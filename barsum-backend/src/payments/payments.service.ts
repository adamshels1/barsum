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
import { CoinsService } from '../coins/coins.service';
import {
  PaymentStatus,
  CoinTransactionType,
  EnrollmentStatus,
  ChallengeCategory,
  ChallengeStatus,
} from '../common/enums';

// Экономика «своей книги»: 1000 ₸ = 60 минут = 6 сессий по 10 минут.
// Курс монет как в системе: 1 ₸ = 10 монет → ~167 монет за минуту чтения.
const OWN_BOOK_MINUTES_PER_1000TG = 60;
const OWN_BOOK_SESSION_MINUTES = 10;
const OWN_BOOK_COINS_PER_MINUTE = 167;
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

  async create(dto: {
    parentId: string;
    childId: string;
    challengeId: string;
    challengePrice: number;
    coinsAmount: number;
  }): Promise<Payment> {
    const coinsTg = Math.floor(dto.coinsAmount / 10);
    const total = dto.challengePrice + coinsTg;

    // Оплата подтверждается родителем на слово (QR Kaspi, без загрузки чека) —
    // сразу помечаем как confirmed и открываем доступ к заданию.
    const payment = this.paymentRepo.create({
      ...dto,
      coinsTg,
      total,
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
    const coinsPerMinute = OWN_BOOK_COINS_PER_MINUTE;
    // Монет за полную 10-минутную сессию (для отображения ребёнку/родителю).
    const coinsPerPart = coinsPerMinute * OWN_BOOK_SESSION_MINUTES;
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
        coinsPerMinute,
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
