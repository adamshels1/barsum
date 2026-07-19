import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Child } from '../children/entities/child.entity';
import { ChallengeEnrollment } from '../sessions/entities/enrollment.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { BookRequest } from '../challenges/entities/book-request.entity';
import { Expert } from '../experts/entities/expert.entity';
import { CoinsService } from '../coins/coins.service';
import {
  PaymentStatus,
  CoinTransactionType,
  EnrollmentStatus,
  ChallengeCategory,
  ChallengeStatus,
  BookRequestStatus,
} from '../common/enums';

// Экономика «своей книги»: 1000 ₸ = 60 минут = 6 сессий по 10 минут.
// Курс монет как у экспертских книг: 1 монета = 1 ₸ — весь пул монет равен цене,
// за засчитанную сессию начисляется фиксированная доля (цена / кол-во сессий).
const OWN_BOOK_MINUTES_PER_1000TG = 60;
const OWN_BOOK_SESSION_MINUTES = 10;
import { TelegramService, esc } from '../notifications/telegram.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(ChallengeEnrollment)
    private enrollmentRepo: Repository<ChallengeEnrollment>,
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,
    private coinsService: CoinsService,
    private telegram: TelegramService,
    private dataSource: DataSource,
  ) {}

  // Достаём имена родителя и ребёнка для человекочитаемого уведомления.
  private async actorLines(parentId: string, childId: string): Promise<string> {
    const [parent, child] = await Promise.all([
      this.dataSource.getRepository(User).findOne({ where: { id: parentId } }).catch(() => null),
      this.dataSource.getRepository(Child).findOne({ where: { id: childId } }).catch(() => null),
    ]);
    return (
      `👤 Родитель: ${esc(parent?.name ?? '—')} (${esc(parentId)})\n` +
      `🧒 Ребёнок: ${esc(child?.name ?? '—')} (${esc(childId)})`
    );
  }

  // Доля эксперта на момент оплаты: процент берём с профиля автора книги (снимок),
  // чтобы позднее изменение % админом не переписывало историю выплат.
  private async resolveExpertSplit(
    challengeId: string,
    price: number,
  ): Promise<{ expertShare: number; platformFee: number; expertCommissionPct: number }> {
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    let pct = 0;
    if (challenge?.authorId) {
      const expert = await this.dataSource
        .getRepository(Expert)
        .findOne({ where: { userId: challenge.authorId } });
      // Нет профиля эксперта (напр. «своя книга») → доли нет.
      pct = expert?.commissionPct ?? 0;
    }
    const expertShare = Math.round((price * pct) / 100);
    return { expertShare, platformFee: price - expertShare, expertCommissionPct: pct };
  }

  async create(dto: {
    parentId: string;
    childId: string;
    challengeId: string;
    challengePrice: number;
    coinsAmount: number;
  }): Promise<Payment> {
    // Монеты для ребёнка теперь равны цене книги (ползунок убран): родитель платит
    // цену книги, ребёнок получает столько же монет — без доплаты за монеты.
    const coinsTg = 0;
    const total = dto.challengePrice;
    const split = await this.resolveExpertSplit(dto.challengeId, dto.challengePrice);

    // Оплата подтверждается родителем на слово (QR Kaspi, без загрузки чека) —
    // сразу помечаем как confirmed и открываем доступ к заданию.
    const payment = this.paymentRepo.create({
      ...dto,
      coinsTg,
      total,
      ...split,
      status: PaymentStatus.CONFIRMED,
      resolvedAt: new Date(),
    });
    const saved = await this.paymentRepo.save(payment);
    await this.activateEnrollment(saved);

    this.telegram.send(
      'payments',
      `💳 <b>Новая оплата</b>\n${await this.actorLines(saved.parentId, saved.childId)}\n` +
        `Сумма: ${saved.total} ₸ (задание ${saved.challengePrice} ₸ + монеты ${saved.coinsAmount})`,
    );

    return saved;
  }

  // Черновик оплаты (intent): создаётся в момент клика «Оплатить через Kaspi»,
  // ДО перехода в Kaspi. Статус pending, доступ (enrollment) НЕ выдаётся — только
  // когда родитель (или админ) подтвердит оплату. Это ловит кейс «оплатил в Kaspi,
  // но забыл нажать "Я оплатил"»: незавершённая покупка не теряется, её можно добить.
  async createIntent(dto: {
    parentId: string;
    childId: string;
    challengeId: string;
    challengePrice: number;
    coinsAmount: number;
  }): Promise<Payment> {
    // Дедуп: если для этой пары ребёнок+книга уже есть незавершённый черновик —
    // переиспользуем его, чтобы повторные клики «Оплатить» не плодили дубли.
    const existing = await this.paymentRepo.findOne({
      where: {
        parentId: dto.parentId,
        childId: dto.childId,
        challengeId: dto.challengeId,
        status: PaymentStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
    if (existing) return existing;

    const total = dto.challengePrice;
    const split = await this.resolveExpertSplit(dto.challengeId, dto.challengePrice);
    const payment = this.paymentRepo.create({
      ...dto,
      coinsTg: 0,
      total,
      ...split,
      status: PaymentStatus.PENDING,
    });
    const saved = await this.paymentRepo.save(payment);

    this.telegram.send(
      'payments',
      `⏳ <b>Начата оплата (ожидает подтверждения)</b>\n${await this.actorLines(saved.parentId, saved.childId)}\n` +
        `Сумма: ${saved.total} ₸`,
    );

    return saved;
  }

  // Родитель подтверждает СВОЙ незавершённый платёж (кнопка «Я оплатил» /
  // баннер «продолжить» в кабинете). pending → confirmed + активация доступа.
  async confirmByParent(id: string, parentId: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (payment.parentId !== parentId) throw new ForbiddenException('Not your payment');
    if (payment.status === PaymentStatus.CONFIRMED) return payment; // идемпотентно
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
    payment.status = PaymentStatus.CONFIRMED;
    payment.resolvedAt = new Date();
    await this.paymentRepo.save(payment);
    await this.activateEnrollment(payment);

    this.telegram.send(
      'payments',
      `✅ <b>Оплата подтверждена родителем</b>\n${await this.actorLines(payment.parentId, payment.childId)}\n` +
        `Сумма: ${payment.total} ₸`,
    );

    return payment;
  }

  // Родитель отменяет СВОЙ незавершённый платёж (передумал / не оплатил).
  async cancelByParent(id: string, parentId: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (payment.parentId !== parentId) throw new ForbiddenException('Not your payment');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
    payment.status = PaymentStatus.REJECTED;
    payment.adminNote = 'Отменено родителем';
    payment.resolvedAt = new Date();
    return this.paymentRepo.save(payment);
  }

  // «Своя книжка»: родитель оплачивает время чтения своей физической книги.
  // Создаём приватный Challenge (без сканов/эталона) + Payment + Enrollment с таймерной экономикой.
  async createOwnBook(dto: {
    parentId: string;
    childId: string;
    bookTitle: string;
    amountTg: number;
  }): Promise<{ payment: Payment; enrollment: ChallengeEnrollment; challenge: Challenge }> {
    const amountTg = Math.max(0, Math.floor(dto.amountTg));
    if (amountTg < 1000) {
      throw new BadRequestException('Минимальная сумма — 1000 ₸');
    }
    const title = (dto.bookTitle || '').trim() || 'Своя книга';

    const minutes = Math.round((amountTg / 1000) * OWN_BOOK_MINUTES_PER_1000TG);
    const sessions = Math.max(1, Math.round(minutes / OWN_BOOK_SESSION_MINUTES));
    // Фиксированная сумма за засчитанную сессию: цена книги делится на кол-во сессий
    // (1000 ₸ / 6 сессий ≈ 167 монет). Итоговый пул монет равен цене книги.
    const coinsPerPart = Math.round(amountTg / sessions);
    const coinsPool = coinsPerPart * sessions;

    const challenge = await this.challengeRepo.save(
      this.challengeRepo.create({
        title,
        bookTitle: title,
        bookAuthor: 'Своя книга',
        category: ChallengeCategory.OWN_BOOK,
        status: ChallengeStatus.PUBLISHED,
        authorId: dto.parentId,
        // Дефолтная обложка для всех «своих книг» — герой-барсик (статик фронта).
        coverImage: '/books/own-book.jpg',
        totalParts: sessions,
        price: amountTg,
        coinsReward: coinsPool,
      }),
    );

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        parentId: dto.parentId,
        childId: dto.childId,
        challengeId: challenge.id,
        challengePrice: amountTg,
        coinsAmount: 0,
        coinsTg: 0,
        total: amountTg,
        status: PaymentStatus.CONFIRMED,
        resolvedAt: new Date(),
      }),
    );

    const enrollment = await this.enrollmentRepo.save(
      this.enrollmentRepo.create({
        childId: dto.childId,
        challengeId: challenge.id,
        parentId: dto.parentId,
        status: EnrollmentStatus.ACTIVE,
        coinsPerPart,
        coinsPerMinute: 0,
        startedAt: new Date(),
      }),
    );

    this.telegram.send(
      'payments',
      `📖 <b>Своя книжка оплачена</b>\n${await this.actorLines(dto.parentId, dto.childId)}\n` +
        `Книга: ${esc(title)}\nСумма: ${amountTg} ₸ · ${minutes} мин · ${sessions} сессий по ${OWN_BOOK_SESSION_MINUTES} мин · до ${coinsPool} монет`,
    );

    return { payment, enrollment, challenge };
  }

  private async activateEnrollment(payment: Payment): Promise<void> {
    const existing = await this.enrollmentRepo.findOne({
      where: { childId: payment.childId, challengeId: payment.challengeId },
    });
    if (existing) return;

    const challenge = await this.challengeRepo.findOne({ where: { id: payment.challengeId } });
    const totalParts = challenge?.totalParts || 1;
    const coinsPerPart = payment.coinsAmount > 0
      ? Math.floor(payment.coinsAmount / totalParts)
      : 0;
    const enrollment = this.enrollmentRepo.create({
      childId: payment.childId,
      challengeId: payment.challengeId,
      parentId: payment.parentId,
      status: EnrollmentStatus.ACTIVE,
      coinsPerPart,
      startedAt: new Date(),
    });
    await this.enrollmentRepo.save(enrollment);

    // Если ребёнок просил эту книгу — закрываем его запрос как купленный.
    await this.dataSource
      .getRepository(BookRequest)
      .update(
        { childId: payment.childId, challengeId: payment.challengeId, status: BookRequestStatus.PENDING },
        { status: BookRequestStatus.PURCHASED, resolvedAt: new Date() },
      )
      .catch(() => undefined);
  }

  async uploadReceipt(id: string, parentId: string, receiptUrl: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (payment.parentId !== parentId) throw new ForbiddenException('Not your payment');
    payment.receiptUrl = receiptUrl;
    return this.paymentRepo.save(payment);
  }

  async findById(id: string): Promise<Payment> {
    const p = await this.paymentRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  async findByParent(parentId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { parentId },
      relations: ['child', 'challenge'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { status: PaymentStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async findByStatus(status: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { status: status as PaymentStatus },
      relations: ['parent', 'child', 'challenge'],
      order: { createdAt: 'DESC' },
    });
  }

  async confirm(id: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (payment.status === PaymentStatus.CONFIRMED) {
      throw new ConflictException('Payment already confirmed');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
    payment.status = PaymentStatus.CONFIRMED;
    payment.resolvedAt = new Date();
    await this.paymentRepo.save(payment);
    await this.activateEnrollment(payment);

    this.telegram.send(
      'payments',
      `✅ <b>Оплата подтверждена</b>\n${await this.actorLines(payment.parentId, payment.childId)}\n` +
        `Сумма: ${payment.total} ₸`,
    );

    return payment;
  }

  async reject(id: string, adminNote: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
    payment.status = PaymentStatus.REJECTED;
    payment.adminNote = adminNote;
    payment.resolvedAt = new Date();
    return this.paymentRepo.save(payment);
  }

  async countByStatus(status: PaymentStatus): Promise<number> {
    return this.paymentRepo.count({ where: { status } });
  }

  async totalRevenue(): Promise<number> {
    const result = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.total), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.CONFIRMED })
      .getRawOne();
    return Number(result?.total || 0);
  }
}
