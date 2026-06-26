import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoinsService } from './coins.service';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { BadRequestException } from '@nestjs/common';
import { CoinTransactionType } from '../common/enums';

const mockQB = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  setParameter: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ balance: '100' }),
};

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQB),
};

describe('CoinsService', () => {
  let service: CoinsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        { provide: getRepositoryToken(CoinTransaction), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<CoinsService>(CoinsService);
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQB);
    mockQB.select.mockReturnThis();
    mockQB.where.mockReturnThis();
    mockQB.setParameter.mockReturnThis();
    mockQB.getRawOne.mockResolvedValue({ balance: '100' });
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('getBalance → returns numeric balance', async () => {
    const result = await service.getBalance('p1', 'parent');
    expect(result).toBe(100);
  });

  it('transfer → throws if insufficient balance', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockQB.getRawOne.mockResolvedValue({ balance: '0' });
    await expect(
      service.transfer({
        fromId: 'p1',
        fromType: 'parent',
        toId: 'c1',
        toType: 'child',
        amount: 500,
        type: CoinTransactionType.REWARD_REQUEST,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('transfer → idempotent on duplicate referenceId', async () => {
    const existing = { id: 'tx1', referenceId: 'ref1' };
    mockRepo.findOne.mockResolvedValue(existing);
    const result = await service.transfer({
      fromId: 'system',
      fromType: 'system',
      toId: 'p1',
      toType: 'parent',
      amount: 100,
      type: CoinTransactionType.PURCHASE,
      referenceId: 'ref1',
    });
    expect(result).toEqual(existing);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('transfer system → skips balance check', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const tx = { id: 'tx1', amount: 500 };
    mockRepo.create.mockReturnValue(tx);
    mockRepo.save.mockResolvedValue(tx);
    const result = await service.transfer({
      fromId: 'system',
      fromType: 'system',
      toId: 'p1',
      toType: 'parent',
      amount: 500,
      type: CoinTransactionType.PURCHASE,
    });
    expect(result).toEqual(tx);
  });
});
