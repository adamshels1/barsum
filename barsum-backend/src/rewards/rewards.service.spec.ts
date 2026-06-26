import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';
import { RewardRequest } from './entities/reward-request.entity';
import { CoinsService } from '../coins/coins.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RewardRequestStatus, RewardType } from '../common/enums';

const mockRewardRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockRequestRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockCoinsService = {
  transfer: jest.fn().mockResolvedValue({ id: 'tx1' }),
};

describe('RewardsService', () => {
  let service: RewardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: getRepositoryToken(Reward), useValue: mockRewardRepo },
        { provide: getRepositoryToken(RewardRequest), useValue: mockRequestRepo },
        { provide: CoinsService, useValue: mockCoinsService },
      ],
    }).compile();
    service = module.get<RewardsService>(RewardsService);
    jest.clearAllMocks();
    mockCoinsService.transfer.mockResolvedValue({ id: 'tx1' });
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('request → deducts coins and creates request', async () => {
    const reward = { id: 'r1', cost: 200, isActive: true };
    mockRewardRepo.findOne.mockResolvedValue(reward);
    const req = { id: 'req1', status: RewardRequestStatus.PENDING, coinsAmount: 200 };
    mockRequestRepo.create.mockReturnValue(req);
    mockRequestRepo.save.mockResolvedValue(req);

    const result = await service.request('r1', 'c1', 'p1');
    expect(mockCoinsService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ fromId: 'c1', amount: 200 }),
    );
    expect(result.status).toBe(RewardRequestStatus.PENDING);
  });

  it('request → throws if reward not found', async () => {
    mockRewardRepo.findOne.mockResolvedValue(null);
    await expect(service.request('bad', 'c1', 'p1')).rejects.toThrow(NotFoundException);
  });

  it('deliver → returns coins to parent', async () => {
    const req = { id: 'req1', status: RewardRequestStatus.PENDING, coinsAmount: 300, parentId: 'p1', childId: 'c1' };
    mockRequestRepo.findOne.mockResolvedValue(req);
    mockRequestRepo.save.mockResolvedValue({ ...req, status: RewardRequestStatus.DELIVERED });

    const result = await service.deliver('req1', 'p1');
    expect(mockCoinsService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ toId: 'p1', toType: 'parent', amount: 300 }),
    );
    expect(result.status).toBe(RewardRequestStatus.DELIVERED);
  });

  it('reject → returns coins to child', async () => {
    const req = { id: 'req1', status: RewardRequestStatus.PENDING, coinsAmount: 200, parentId: 'p1', childId: 'c1' };
    mockRequestRepo.findOne.mockResolvedValue(req);
    mockRequestRepo.save.mockResolvedValue({ ...req, status: RewardRequestStatus.REJECTED });

    const result = await service.reject('req1', 'p1');
    expect(mockCoinsService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ toId: 'c1', toType: 'child', amount: 200 }),
    );
    expect(result.status).toBe(RewardRequestStatus.REJECTED);
  });

  it('deliver → throws if request not pending', async () => {
    const req = { id: 'req1', status: RewardRequestStatus.DELIVERED, coinsAmount: 200, parentId: 'p1' };
    mockRequestRepo.findOne.mockResolvedValue(req);
    await expect(service.deliver('req1', 'p1')).rejects.toThrow(BadRequestException);
  });
});
