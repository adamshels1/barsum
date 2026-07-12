import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { ChallengeEnrollment } from '../sessions/entities/enrollment.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { CoinsService } from '../coins/coins.service';
import { TelegramService } from '../notifications/telegram.service';
import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '../common/enums';

const mockQB = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
};

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQB),
};

const mockEnrollmentRepo = {
  // Возвращаем существующий enrollment, чтобы activateEnrollment вышел раньше.
  findOne: jest.fn().mockResolvedValue({ id: 'e1' }),
  create: jest.fn((x) => x),
  save: jest.fn(async (x) => x),
};
const mockChallengeRepo = {
  findOne: jest.fn().mockResolvedValue({ id: 'ch1', totalParts: 1 }),
  create: jest.fn((x) => x),
  save: jest.fn(async (x) => x),
};
const mockCoinsService = { transfer: jest.fn().mockResolvedValue(undefined) };
const mockTelegram = { send: jest.fn() };
const mockDataSource = {
  getRepository: jest.fn().mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) }),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockRepo },
        { provide: getRepositoryToken(ChallengeEnrollment), useValue: mockEnrollmentRepo },
        { provide: getRepositoryToken(Challenge), useValue: mockChallengeRepo },
        { provide: CoinsService, useValue: mockCoinsService },
        { provide: TelegramService, useValue: mockTelegram },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQB);
    mockQB.select.mockReturnThis();
    mockQB.where.mockReturnThis();
    mockQB.getRawOne.mockResolvedValue({ total: '5000' });
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('create → total равен цене книги, монеты идут бонусом (ползунок убран)', async () => {
    mockRepo.create.mockImplementation((x: any) => x);
    mockRepo.save.mockImplementation(async (x: any) => ({ id: 'p1', ...x }));
    const result = await service.create({
      parentId: 'u1',
      childId: 'c1',
      challengeId: 'ch1',
      challengePrice: 1000,
      coinsAmount: 1000,
    });
    expect(result.total).toBe(1000);
    expect(result.coinsTg).toBe(0);
  });

  it('confirm → throws ConflictException if already confirmed', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'p1', status: PaymentStatus.CONFIRMED });
    await expect(service.confirm('p1')).rejects.toThrow(ConflictException);
  });

  it('confirm → throws BadRequest if not pending', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'p1', status: PaymentStatus.REJECTED });
    await expect(service.confirm('p1')).rejects.toThrow(BadRequestException);
  });

  it('confirm → succeeds on pending payment', async () => {
    const payment = { id: 'p1', status: PaymentStatus.PENDING };
    mockRepo.findOne.mockResolvedValue({ ...payment });
    mockRepo.save.mockResolvedValue({ ...payment, status: PaymentStatus.CONFIRMED });
    const result = await service.confirm('p1');
    expect(result.status).toBe(PaymentStatus.CONFIRMED);
  });

  it('uploadReceipt → throws ForbiddenException if wrong parent', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'p1', parentId: 'u1', status: PaymentStatus.PENDING });
    await expect(service.uploadReceipt('p1', 'u2', 'url')).rejects.toThrow(ForbiddenException);
  });

  it('findById → throws NotFoundException if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
  });
});
