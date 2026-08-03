import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Child } from './entities/child.entity';
import { FilesService, parseStoredFileUrl, imageMimeFromUrl } from '../files/files.service';
import { encryptChildPassword } from '../common/child-password.util';
import { TelegramService, esc } from '../notifications/telegram.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(Child)
    private childRepo: Repository<Child>,
    private dataSource: DataSource,
    private filesService: FilesService,
    private telegram: TelegramService,
  ) {}

  async findByLogin(login: string): Promise<Child | null> {
    // Логин всегда храним и ищем в нижнем регистре — мобильные клавиатуры
    // автокапитализируют первую букву, из-за чего вход не проходил.
    return this.childRepo.findOne({ where: { login: (login ?? '').trim().toLowerCase() } });
  }

  async findById(id: string): Promise<Child | null> {
    return this.childRepo.findOne({ where: { id } });
  }

  async findByParentId(parentId: string): Promise<Child[]> {
    return this.childRepo.find({ where: { parentId } });
  }

  async create(dto: { name: string; age: number; login: string; password: string; parentId: string }): Promise<Child> {
    const login = (dto.login ?? '').trim().toLowerCase();
    const existing = await this.findByLogin(login);
    if (existing) throw new ConflictException('Login already taken');
    const encrypted = encryptChildPassword(dto.password);
    const child = this.childRepo.create({ ...dto, login, password: encrypted });
    const saved = await this.childRepo.save(child);

    const parent = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: dto.parentId } })
      .catch(() => null);

    this.telegram.send(
      'registrations',
      `👶 <b>Добавлен ребёнок</b>\n` +
        `Ребёнок: ${esc(saved.name)}, ${esc(saved.age)} лет (логин ${esc(saved.login)})\n` +
        `🆔 ${esc(saved.id)}\n` +
        `👤 Родитель: ${esc(parent?.name ?? '—')} (${esc(dto.parentId)})`,
    );

    return saved;
  }

  async update(id: string, parentId: string, dto: { name?: string; age?: number; login?: string; password?: string; photoUrl?: string }): Promise<Child> {
    const child = await this.findById(id);
    if (!child) throw new NotFoundException('Child not found');
    if (child.parentId !== parentId) throw new ForbiddenException('Not your child');
    if (dto.login !== undefined) {
      // Родитель может исправить ошибочный логин ребёнка. Нормализуем в нижний
      // регистр и проверяем уникальность (если логин действительно меняется).
      const login = (dto.login ?? '').trim().toLowerCase();
      if (!/^[a-z0-9_]{3,}$/.test(login)) {
        throw new ConflictException('Некорректный логин (только a-z, 0-9, _, минимум 3 символа)');
      }
      if (login !== child.login) {
        const existing = await this.findByLogin(login);
        if (existing && existing.id !== id) throw new ConflictException('Login already taken');
      }
      dto.login = login;
    }
    if (dto.password) {
      dto.password = encryptChildPassword(dto.password);
    }
    Object.assign(child, dto);
    return this.childRepo.save(child);
  }

  // Отдаём фото ребёнка через backend (тот же https-origin, что и API),
  // чтобы не упираться в mixed-content блокировку прямых http-ссылок MinIO на проде.
  async getPhoto(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const child = await this.findById(id);
    if (!child?.photoUrl) throw new NotFoundException('Photo not found');
    const parsed = parseStoredFileUrl(child.photoUrl);
    if (!parsed) throw new NotFoundException('Photo not found');
    const buffer = await this.filesService.getBuffer(parsed.key, parsed.bucket);
    return { buffer, contentType: imageMimeFromUrl(child.photoUrl) };
  }

  // Ссылка живёт 30 дней: её пересылают в мессенджере, и семья возвращается к
  // ней при переустановке приложения или смене телефона. Родитель может
  // перевыпустить — старая ссылка при этом перестаёт работать.
  private static readonly INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  /**
   * Отдаёт действующий инвайт-токен ребёнка, создавая его при необходимости.
   * `regenerate` выпускает новый и обесценивает предыдущий.
   */
  async getOrCreateInviteToken(
    id: string,
    parentId: string,
    regenerate = false,
  ): Promise<{ token: string; expiresAt: Date }> {
    // inviteToken помечен select: false — запрашиваем его явно.
    const child = await this.childRepo
      .createQueryBuilder('child')
      .addSelect('child.inviteToken')
      .where('child.id = :id', { id })
      .getOne();
    if (!child) throw new NotFoundException('Child not found');
    if (child.parentId !== parentId) throw new ForbiddenException('Not your child');

    const expired =
      !child.inviteTokenExpiresAt || child.inviteTokenExpiresAt.getTime() <= Date.now();

    let token = child.inviteToken;
    let expiresAt = child.inviteTokenExpiresAt;

    if (regenerate || !token || expired) {
      token = randomBytes(24).toString('base64url');
      expiresAt = new Date(Date.now() + ChildrenService.INVITE_TTL_MS);
      // Возвращаем локальные значения, а не поля сущности: save() перечитывает
      // строку, а колонка с select: false в выборку не попадает и обнуляется.
      child.inviteToken = token;
      child.inviteTokenExpiresAt = expiresAt;
      await this.childRepo.save(child);
    }

    return { token: token!, expiresAt: expiresAt! };
  }

  // Вход ребёнка по ссылке. Токен не одноразовый: ребёнок может открыть ссылку
  // повторно, если вышел из аккаунта или переустановил приложение.
  async findByInviteToken(token: string): Promise<Child | null> {
    if (!token) return null;
    const child = await this.childRepo.findOne({ where: { inviteToken: token } });
    if (!child) return null;
    if (!child.inviteTokenExpiresAt || child.inviteTokenExpiresAt.getTime() <= Date.now()) {
      return null;
    }
    return child;
  }

  // Ребёнок закончил или пропустил онбординг — больше его не показываем.
  async markOnboarded(id: string): Promise<Child> {
    const child = await this.findById(id);
    if (!child) throw new NotFoundException('Child not found');
    if (!child.onboardedAt) {
      child.onboardedAt = new Date();
      await this.childRepo.save(child);
    }
    const { password, ...rest } = child as any;
    return rest;
  }

  // Ребёнок ответил на вопрос «на что копишь?» — согласием или отказом.
  // Больше не спрашиваем: одна попытка, без превращения в назойливый баннер.
  async markDreamPrompted(id: string): Promise<Child> {
    const child = await this.findById(id);
    if (!child) throw new NotFoundException('Child not found');
    if (!child.dreamPromptedAt) {
      child.dreamPromptedAt = new Date();
      await this.childRepo.save(child);
    }
    const { password, ...rest } = child as any;
    return rest;
  }

  async incrementStreak(id: string): Promise<void> {
    await this.childRepo.increment({ id }, 'streak', 1);
  }

  async resetStreak(id: string): Promise<void> {
    await this.childRepo.update(id, { streak: 0 });
  }

  async count(): Promise<number> {
    return this.childRepo.count();
  }

  async getStats(id: string): Promise<{
    streak: number;
    totalSessions: number;
    totalCoinsEarned: number;
    activeEnrollments: number;
    childBalance: number;
  }> {
    const child = await this.findById(id);
    if (!child) throw new NotFoundException('Child not found');

    const [sessionsRow, coinsRow, enrollmentsRow, balanceRow] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) AS count FROM sessions WHERE "childId" = $1`,
        [id],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM coin_transactions WHERE "toId" = $1 AND "toType" = 'child' AND status = 'confirmed'`,
        [id],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS count FROM challenge_enrollments WHERE "childId" = $1 AND status = 'active'`,
        [id],
      ),
      this.dataSource.query(
        `SELECT COALESCE(
          SUM(CASE WHEN "toId" = $1 AND "toType" = 'child' THEN amount ELSE 0 END) -
          SUM(CASE WHEN "fromId" = $1 AND "fromType" = 'child' THEN amount ELSE 0 END)
        , 0) AS balance FROM coin_transactions WHERE status = 'confirmed'`,
        [id],
      ),
    ]);

    return {
      streak: child.streak,
      totalSessions: Number(sessionsRow[0]?.count ?? 0),
      totalCoinsEarned: Number(coinsRow[0]?.total ?? 0),
      activeEnrollments: Number(enrollmentsRow[0]?.count ?? 0),
      childBalance: Number(balanceRow[0]?.balance ?? 0),
    };
  }
}
