import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dream } from './entities/dream.entity';
import { DreamStatus, CoinTransactionType } from '../common/enums';
import { Child } from '../children/entities/child.entity';
import { FilesService, parseStoredFileUrl, imageMimeFromUrl } from '../files/files.service';
import { CoinsService } from '../coins/coins.service';
import { TelegramService, esc } from '../notifications/telegram.service';
import { PushService } from '../push/push.service';

// Как часто ребёнок может напоминать родителю про неодобренную мечту.
const REMIND_COOLDOWN_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class DreamsService {
  constructor(
    @InjectRepository(Dream)
    private dreamRepo: Repository<Dream>,
    @InjectRepository(Child)
    private childRepo: Repository<Child>,
    private filesService: FilesService,
    private coinsService: CoinsService,
    private telegram: TelegramService,
    private push: PushService,
  ) {}

  async create(childId: string, dto: { name: string; photoUrl?: string }): Promise<Dream> {
    const child = await this.childRepo.findOne({ where: { id: childId } });
    if (!child) throw new NotFoundException('Child not found');

    const dream = this.dreamRepo.create({
      name: dto.name,
      photoUrl: dto.photoUrl,
      childId,
      parentId: child.parentId,
      targetCoins: 0,
      savedCoins: 0,
      status: DreamStatus.PENDING_APPROVAL,
    });
    const saved = await this.dreamRepo.save(dream);

    this.telegram.send(
      'other',
      `⭐ <b>Новая мечта</b>\n🧒 Ребёнок: ${esc(child.name)} (${esc(childId)})\nМечта: «${esc(saved.name)}»`,
    );

    // Веб-пуш родителю: без него мечта висит в pending_approval неделями —
    // родитель просто не знает, что её нужно оценить.
    if (child.parentId) {
      void this.push.sendToUser(child.parentId, {
        title: '💫 Новая мечта',
        body: `${child.name} мечтает: ${saved.name}. Оцените мечту в монетах.`,
        url: '/parent/cabinet',
        tag: `dream-${saved.id}`,
      });
    }

    return saved;
  }

  // Ребёнок напоминает родителю про неодобренную мечту. Повторный пуш, но не чаще
  // раза в REMIND_COOLDOWN_MS — иначе получится спам-кнопка.
  async remind(id: string, childId: string): Promise<{ ok: boolean; nextAvailableAt?: Date }> {
    const dream = await this.dreamRepo.findOne({ where: { id, childId } });
    if (!dream) throw new NotFoundException('Dream not found');
    if (dream.status !== DreamStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Dream is not pending approval');
    }

    if (dream.remindedAt) {
      const nextAvailableAt = new Date(dream.remindedAt.getTime() + REMIND_COOLDOWN_MS);
      if (nextAvailableAt > new Date()) {
        return { ok: false, nextAvailableAt };
      }
    }

    const child = await this.childRepo.findOne({ where: { id: childId } });
    if (dream.parentId) {
      void this.push.sendToUser(dream.parentId, {
        title: '💫 Напоминание о мечте',
        body: `${child?.name ?? 'Ребёнок'} ждёт: «${dream.name}». Оцените мечту в монетах.`,
        url: '/parent/cabinet',
        tag: `dream-${dream.id}`,
      });
    }

    dream.remindedAt = new Date();
    await this.dreamRepo.save(dream);
    return { ok: true };
  }

  async findMy(childId: string): Promise<Dream | null> {
    // Активная/на одобрении важнее — показываем её.
    const current = await this.dreamRepo.findOne({
      where: [
        { childId, status: DreamStatus.ACTIVE },
        { childId, status: DreamStatus.PENDING_APPROVAL },
      ],
      order: { createdAt: 'DESC' },
    });
    if (current) return current;
    // Иначе — собранная мечта, которая ждёт исполнения родителем.
    // fulfilled/rejected не показываем: ребёнок увидит экран «Добавь мечту».
    return this.dreamRepo.findOne({
      where: { childId, status: DreamStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });
  }

  // Все мечты ребёнка (несколько мечт + история исполненных).
  async findAllMy(childId: string): Promise<Dream[]> {
    return this.dreamRepo.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });
  }

  // Текущие мечты конкретного ребёнка — чтобы родитель видел, к чему копит ребёнок.
  async findCurrentForParentChild(parentId: string, childId: string): Promise<Dream[]> {
    return this.dreamRepo.find({
      where: [
        { parentId, childId, status: DreamStatus.PENDING_APPROVAL },
        { parentId, childId, status: DreamStatus.ACTIVE },
        { parentId, childId, status: DreamStatus.COMPLETED },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingForParent(parentId: string): Promise<Dream[]> {
    return this.dreamRepo.find({
      where: { parentId, status: DreamStatus.PENDING_APPROVAL },
      relations: ['child'],
      order: { createdAt: 'DESC' },
    });
  }

  // Собранные мечты, ожидающие исполнения родителем.
  async findCompletedForParent(parentId: string): Promise<Dream[]> {
    return this.dreamRepo.find({
      where: { parentId, status: DreamStatus.COMPLETED },
      relations: ['child'],
      order: { updatedAt: 'DESC' },
    });
  }

  // Родитель отмечает, что исполнил мечту (выдал приз) → архивируем.
  async fulfill(id: string, parentId: string): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream) throw new NotFoundException('Dream not found');
    if (dream.parentId !== parentId) throw new ForbiddenException('Not your child dream');
    if (dream.status !== DreamStatus.COMPLETED)
      throw new BadRequestException('Dream is not completed');
    dream.status = DreamStatus.FULFILLED;
    const saved = await this.dreamRepo.save(dream);

    const child = await this.childRepo.findOne({ where: { id: dream.childId } }).catch(() => null);

    this.telegram.send(
      'other',
      `🌟 <b>Мечта исполнена</b>\n🧒 Ребёнок: ${esc(child?.name ?? '—')} (${esc(dream.childId)})\n` +
        `Мечта: «${esc(saved.name)}» — родитель выдал приз`,
    );

    return saved;
  }

  async approve(id: string, parentId: string, targetCoins: number): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream) throw new NotFoundException('Dream not found');
    if (dream.parentId !== parentId) throw new ForbiddenException('Not your child dream');
    if (dream.status !== DreamStatus.PENDING_APPROVAL) throw new BadRequestException('Dream is not pending approval');
    dream.targetCoins = targetCoins;
    dream.status = DreamStatus.ACTIVE;
    return this.dreamRepo.save(dream);
  }

  async reject(id: string, parentId: string, reason: string): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream) throw new NotFoundException('Dream not found');
    if (dream.parentId !== parentId) throw new ForbiddenException('Not your child dream');
    if (dream.status !== DreamStatus.PENDING_APPROVAL) throw new BadRequestException('Dream is not pending approval');
    dream.rejectedReason = reason;
    dream.status = DreamStatus.REJECTED;
    return this.dreamRepo.save(dream);
  }

  async sendCoins(childId: string, amount: number, dreamId?: string): Promise<Dream> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Сумма должна быть целым числом больше нуля');
    }

    // Если указан dreamId — копим в конкретную мечту (у ребёнка их может быть несколько),
    // иначе — в единственную активную (обратная совместимость).
    const dream = await this.dreamRepo.findOne({
      where: dreamId
        ? { id: dreamId, childId, status: DreamStatus.ACTIVE }
        : { childId, status: DreamStatus.ACTIVE },
    });
    if (!dream) throw new NotFoundException('No active dream');

    // Баланс считаем на сервере (сумма подтверждённых транзакций),
    // не доверяя значению из запроса.
    const balance = await this.coinsService.getBalance(childId, 'child');
    if (balance < amount) {
      throw new BadRequestException('Недостаточно монет на балансе');
    }

    // Реально списываем монеты: создаём транзакцию child -> system (type = dream).
    // transfer() повторно проверяет баланс на сервере атомарно.
    await this.coinsService.transfer({
      fromId: childId,
      fromType: 'child',
      toId: 'system',
      toType: 'system',
      amount,
      type: CoinTransactionType.DREAM,
      referenceId: `dream-${dream.id}-${Date.now()}`,
      referenceType: 'dream',
    });

    dream.savedCoins += amount;
    if (dream.savedCoins >= dream.targetCoins) {
      dream.status = DreamStatus.COMPLETED;
    }
    return this.dreamRepo.save(dream);
  }

  async update(
    id: string,
    childId: string,
    dto: { name?: string; targetCoins?: number },
  ): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id, childId } });
    if (!dream) throw new NotFoundException('Dream not found');
    Object.assign(dream, dto);
    return this.dreamRepo.save(dream);
  }

  async updatePhoto(id: string, childId: string, photoUrl: string): Promise<Dream> {
    const dream = await this.dreamRepo.findOne({ where: { id, childId } });
    if (!dream) throw new NotFoundException('Dream not found');
    dream.photoUrl = photoUrl;
    return this.dreamRepo.save(dream);
  }

  // Отдаём фото мечты через backend (тот же https-origin, что и API),
  // чтобы не упираться в mixed-content блокировку прямых http-ссылок MinIO на проде.
  async getPhoto(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const dream = await this.dreamRepo.findOne({ where: { id } });
    if (!dream?.photoUrl) throw new NotFoundException('Photo not found');
    const parsed = parseStoredFileUrl(dream.photoUrl);
    if (!parsed) throw new NotFoundException('Photo not found');
    const buffer = await this.filesService.getBuffer(parsed.key, parsed.bucket);
    return { buffer, contentType: imageMimeFromUrl(dream.photoUrl) };
  }
}
