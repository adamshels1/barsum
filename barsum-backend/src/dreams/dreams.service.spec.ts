import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DreamsService } from './dreams.service';
import { Dream } from './entities/dream.entity';
import { Child } from '../children/entities/child.entity';
import { FilesService } from '../files/files.service';
import { CoinsService } from '../coins/coins.service';
import { TelegramService } from '../notifications/telegram.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DreamStatus } from '../common/enums';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockChildRepo = {
  findOne: jest.fn(),
};

const mockFilesService = {};

const mockCoinsService = {
  getBalance: jest.fn(),
  transfer: jest.fn(),
};

const mockTelegramService = {
  send: jest.fn(),
};

describe('DreamsService', () => {
  let service: DreamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DreamsService,
        { provide: getRepositoryToken(Dream), useValue: mockRepo },
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
        { provide: FilesService, useValue: mockFilesService },
        { provide: CoinsService, useValue: mockCoinsService },
        { provide: TelegramService, useValue: mockTelegramService },
      ],
    }).compile();
    service = module.get<DreamsService>(DreamsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('sendCoins → throws BadRequest if amount is not a positive integer', async () => {
    await expect(service.sendCoins('c1', 0)).rejects.toThrow(BadRequestException);
    await expect(service.sendCoins('c1', -5)).rejects.toThrow(BadRequestException);
    await expect(service.sendCoins('c1', 1.5)).rejects.toThrow(BadRequestException);
  });

  it('sendCoins → throws NotFoundException if no active dream', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.sendCoins('c1', 100)).rejects.toThrow(NotFoundException);
  });

  it('sendCoins → throws BadRequest if server-side balance is insufficient', async () => {
    mockRepo.findOne.mockResolvedValue({
      id: 'd1',
      childId: 'c1',
      targetCoins: 500,
      savedCoins: 0,
      status: DreamStatus.ACTIVE,
    });
    mockCoinsService.getBalance.mockResolvedValue(50);
    await expect(service.sendCoins('c1', 100)).rejects.toThrow(BadRequestException);
    expect(mockCoinsService.transfer).not.toHaveBeenCalled();
  });

  it('sendCoins → deducts coins and sets status completed when target reached', async () => {
    const dream = {
      id: 'd1',
      childId: 'c1',
      targetCoins: 500,
      savedCoins: 400,
      status: DreamStatus.ACTIVE,
    };
    mockRepo.findOne.mockResolvedValue({ ...dream });
    mockCoinsService.getBalance.mockResolvedValue(1000);
    mockCoinsService.transfer.mockResolvedValue({});
    mockRepo.save.mockImplementation(async (d: any) => d);

    const result = await service.sendCoins('c1', 100);

    expect(mockCoinsService.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ fromId: 'c1', fromType: 'child', amount: 100 }),
    );
    expect(result.status).toBe(DreamStatus.COMPLETED);
    expect(result.savedCoins).toBe(500);
  });

  it('sendCoins → increments savedCoins without completing', async () => {
    const dream = {
      id: 'd1',
      childId: 'c1',
      targetCoins: 1000,
      savedCoins: 200,
      status: DreamStatus.ACTIVE,
    };
    mockRepo.findOne.mockResolvedValue({ ...dream });
    mockCoinsService.getBalance.mockResolvedValue(1000);
    mockCoinsService.transfer.mockResolvedValue({});
    mockRepo.save.mockImplementation(async (d: any) => d);

    const result = await service.sendCoins('c1', 300);

    expect(result.savedCoins).toBe(500);
    expect(result.status).toBe(DreamStatus.ACTIVE);
  });
});
