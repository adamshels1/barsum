import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { Challenge } from './entities/challenge.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChallengeStatus } from '../common/enums';

const mockQB = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};
const mockRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQB),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  increment: jest.fn(),
  count: jest.fn(),
};

describe('ChallengesService', () => {
  let service: ChallengesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: getRepositoryToken(Challenge), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ChallengesService>(ChallengesService);
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQB);
    mockQB.where.mockReturnThis();
    mockQB.andWhere.mockReturnThis();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('findAll → returns published challenges', async () => {
    mockQB.getMany.mockResolvedValue([{ id: '1', status: 'published' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('findById → throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
  });

  it('create → throws ForbiddenException if not approved expert', async () => {
    await expect(service.create({} as any, 'u1', 'new')).rejects.toThrow(ForbiddenException);
  });

  it('approve → throws ForbiddenException if not admin', async () => {
    await expect(service.approve('id', 'parent')).rejects.toThrow(ForbiddenException);
  });

  it('submit → changes status to moderation', async () => {
    const challenge = { id: '1', authorId: 'u1', status: ChallengeStatus.DRAFT };
    mockRepo.findOne.mockResolvedValue(challenge);
    mockRepo.save.mockResolvedValue({ ...challenge, status: ChallengeStatus.MODERATION });
    const result = await service.submit('1', 'u1');
    expect(result.status).toBe(ChallengeStatus.MODERATION);
  });
});
