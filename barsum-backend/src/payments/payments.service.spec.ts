import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
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

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockRepo },
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

  it('create → calculates total correctly (1 coin = 0.1 tg)', async () => {
    const payment = { id: 'p1', challengePrice: 1000, coinsAmount: 5000, coinsTg: 500, total: 1500 };
    mockRepo.create.mockReturnValue(payment);
    mockRepo.save.mockResolvedValue(payment);
    const result = await service.create({
      parentId: 'u1',
      childId: 'c1',
      challengeId: 'ch1',
      challengePrice: 1000,
      coinsAmount: 5000,
    });
    expect(result.total).toBe(1500);
    expect(result.coinsTg).toBe(500);
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
