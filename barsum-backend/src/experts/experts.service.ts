import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expert } from './entities/expert.entity';
import { ExpertStatus } from '../common/enums';
import { TelegramService, esc } from '../notifications/telegram.service';

@Injectable()
export class ExpertsService {
  constructor(
    @InjectRepository(Expert)
    private expertRepo: Repository<Expert>,
    private telegram: TelegramService,
  ) {}

  async findById(id: string): Promise<Expert | null> {
    return this.expertRepo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Expert | null> {
    return this.expertRepo.findOne({ where: { userId } });
  }

  async createForUser(userId: string): Promise<Expert> {
    const expert = this.expertRepo.create({ userId, status: ExpertStatus.NEW });
    return this.expertRepo.save(expert);
  }

  async updateStatus(id: string, status: ExpertStatus, rejectedReason?: string): Promise<Expert> {
    const expert = await this.findById(id);
    if (!expert) throw new NotFoundException('Expert not found');
    expert.status = status;
    if (rejectedReason) expert.rejectedReason = rejectedReason;
    return this.expertRepo.save(expert);
  }

  async apply(userId: string): Promise<Expert> {
    const expert = await this.expertRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!expert) throw new NotFoundException('Expert not found');
    expert.status = ExpertStatus.REVIEW;

    // Уведомляем команду в Telegram: поступила заявка эксперта на модерацию.
    const lines = [
      '📝 <b>Заявка эксперта на рассмотрение</b>',
      `Имя: ${esc(expert.user?.name)}`,
      `Email: ${esc(expert.user?.email)}`,
      expert.whatsapp ? `WhatsApp: ${esc(expert.whatsapp)}` : null,
      expert.specialization ? `Специализация: ${esc(expert.specialization)}` : null,
      expert.bio ? `О себе: ${esc(expert.bio)}` : null,
      `🆔 ${esc(expert.id)}`,
    ].filter(Boolean);
    this.telegram.send('registrations', lines.join('\n'));

    // Не возвращаем связанного user (в нём хэш пароля) — сохраняем и отдаём чистого эксперта.
    delete (expert as any).user;
    return this.expertRepo.save(expert);
  }

  async setCommission(id: string, commissionPct: number): Promise<Expert> {
    const expert = await this.findById(id);
    if (!expert) throw new NotFoundException('Expert not found');
    // Ограничиваем 0–100, округляем до целого процента.
    expert.commissionPct = Math.max(0, Math.min(100, Math.round(commissionPct)));
    return this.expertRepo.save(expert);
  }

  async updateProfile(userId: string, dto: { specialization?: string; bio?: string; whatsapp?: string }): Promise<Expert> {
    const expert = await this.findByUserId(userId);
    if (!expert) throw new NotFoundException('Expert not found');
    Object.assign(expert, dto);
    return this.expertRepo.save(expert);
  }

  async count(): Promise<number> {
    return this.expertRepo.count();
  }

  async countByStatus(status: ExpertStatus): Promise<number> {
    return this.expertRepo.count({ where: { status } });
  }

  async findByStatus(status: ExpertStatus): Promise<Expert[]> {
    return this.expertRepo.find({ where: { status } });
  }

  async findAllByStatus(status: ExpertStatus): Promise<Expert[]> {
    return this.expertRepo.find({ where: { status } });
  }

  // Для админки: список экспертов со связанным пользователем (имя/почта), без хэша пароля.
  async findByStatusWithUser(status: ExpertStatus): Promise<Expert[]> {
    const experts = await this.expertRepo.find({
      where: { status },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    for (const e of experts) {
      if (e.user) delete (e.user as any).password;
    }
    return experts;
  }

  async getStats(userId: string): Promise<{ challenges: number; students: number; revenueTg: number }> {
    // Метрики считаем независимыми подзапросами: join и enrollments, и payments
    // в одном запросе давал бы декартово произведение и удваивал суммы.
    const result = await this.expertRepo.manager.query(
      `SELECT
        (SELECT COUNT(*) FROM challenges c WHERE c."authorId" = $1)::int AS challenges,
        (SELECT COUNT(DISTINCT e."childId")
           FROM challenge_enrollments e
           JOIN challenges c ON c.id = e."challengeId"
          WHERE c."authorId" = $1)::int AS students,
        (SELECT COALESCE(SUM(p."expertShare"), 0)
           FROM payments p
           JOIN challenges c ON c.id = p."challengeId"
          WHERE c."authorId" = $1 AND p.status = 'confirmed')::int AS "revenueTg"`,
      [userId],
    );
    const row = result[0] || { challenges: 0, students: 0, revenueTg: 0 };
    return {
      challenges: Number(row.challenges),
      students: Number(row.students),
      revenueTg: Number(row.revenueTg),
    };
  }
}
