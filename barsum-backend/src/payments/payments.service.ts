import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { ChallengeEnrollment } from '../sessions/entities/enrollment.entity';
import { CoinsService } from '../coins/coins.service';
import { PaymentStatus, CoinTransactionType, EnrollmentStatus } from '../common/enums';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(ChallengeEnrollment)
    private enrollmentRepo: Repository<ChallengeEnrollment>,
    private coinsService: CoinsService,
  ) {}

  async create(dto: {
    parentId: string;
    childId: string;
    challengeId: string;
    challengePrice: number;
    coinsAmount: number;
  }): Promise<Payment> {
    const coinsTg = Math.floor(dto.coinsAmount / 10);
    const total = dto.challengePrice + coinsTg;

    const payment = this.paymentRepo.create({
      ...dto,
      coinsTg,
      total,
      status: PaymentStatus.PENDING,
    });
    return this.paymentRepo.save(payment);
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

    // Зачисляем монеты на баланс ребёнка
    if (payment.coinsAmount > 0) {
      await this.coinsService.transfer({
        fromId: 'system',
        fromType: 'system',
        toId: payment.childId,
        toType: 'child',
        amount: payment.coinsAmount,
        type: CoinTransactionType.PURCHASE,
        referenceId: `payment-coins-${id}`,
      });
    }

    // Создаём enrollment ребёнка на челлендж (если ещё нет)
    const existing = await this.enrollmentRepo.findOne({
      where: { childId: payment.childId, challengeId: payment.challengeId },
    });
    if (!existing) {
      const enrollment = this.enrollmentRepo.create({
        childId: payment.childId,
        challengeId: payment.challengeId,
        parentId: payment.parentId,
        status: EnrollmentStatus.ACTIVE,
        startedAt: new Date(),
      });
      await this.enrollmentRepo.save(enrollment);
    }

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
