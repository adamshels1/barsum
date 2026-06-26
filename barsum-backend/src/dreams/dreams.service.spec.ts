import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DreamsService } from './dreams.service';
import { Dream } from './entities/dream.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DreamStatus } from '../common/enums';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

describe('DreamsService', () => {
  let service: DreamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DreamsService,
        { provide: getRepositoryToken(Dream), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<DreamsService>(DreamsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('sendCoins → throws BadRequest if insufficient balance', async () => {
    await expect(service.sendCoins('c1', 500, 100)).rejects.toThrow(BadRequestException);
  });

  it('sendCoins → throws NotFoundException if no active dream', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.sendCoins('c1', 100, 500)).rejects.toThrow(NotFoundException);
  });

  it('sendCoins → sets status completed when target reached', async () => {
    const dream = {
      id: 'd1',
      childId: 'c1',
      targetCoins: 500,
      savedCoins: 400,
      status: DreamStatus.ACTIVE,
    };
    mockRepo.findOne.mockResolvedValue({ ...dream });
    mockRepo.save.mockImplementation(async (d: any) => d);
    const result = await service.sendCoins('c1', 100, 500);
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
    mockRepo.save.mockImplementation(async (d: any) => d);
    const result = await service.sendCoins('c1', 300, 500);
    expect(result.savedCoins).toBe(500);
    expect(result.status).toBe(DreamStatus.ACTIVE);
  });
});
