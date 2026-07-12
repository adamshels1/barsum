import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpertsService } from './experts.service';
import { Expert } from './entities/expert.entity';
import { ExpertStatus } from '../common/enums';
import { NotFoundException } from '@nestjs/common';
import { TelegramService } from '../notifications/telegram.service';

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
};

const mockTelegram = { send: jest.fn() };

describe('ExpertsService', () => {
  let service: ExpertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpertsService,
        { provide: getRepositoryToken(Expert), useValue: mockRepo },
        { provide: TelegramService, useValue: mockTelegram },
      ],
    }).compile();
    service = module.get<ExpertsService>(ExpertsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('createForUser → creates expert with status new', async () => {
    const expert = { id: 'e1', userId: 'u1', status: ExpertStatus.NEW };
    mockRepo.create.mockReturnValue(expert);
    mockRepo.save.mockResolvedValue(expert);
    const result = await service.createForUser('u1');
    expect(result.status).toBe(ExpertStatus.NEW);
  });

  it('apply → changes status to review', async () => {
    const expert = { id: 'e1', userId: 'u1', status: ExpertStatus.NEW };
    mockRepo.findOne.mockResolvedValue(expert);
    mockRepo.save.mockResolvedValue({ ...expert, status: ExpertStatus.REVIEW });
    const result = await service.apply('u1');
    expect(result.status).toBe(ExpertStatus.REVIEW);
  });

  it('updateStatus → throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.updateStatus('bad', ExpertStatus.APPROVED)).rejects.toThrow(NotFoundException);
  });
});
