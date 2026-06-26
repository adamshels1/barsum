import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';
import { ChallengeEnrollment } from './entities/enrollment.entity';
import { ReviewQueue } from './entities/review-queue.entity';
import { CoinsService } from '../coins/coins.service';
import { ChildrenService } from '../children/children.service';
import { AiService } from '../ai/ai.service';
import { FilesService } from '../files/files.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionPhase, SessionStatus, EnrollmentStatus } from '../common/enums';

const mockSessionRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
};
const mockEnrollmentRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockReviewRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockCoins = { transfer: jest.fn().mockResolvedValue({ id: 'tx1' }) };
const mockChildren = { incrementStreak: jest.fn().mockResolvedValue(undefined) };
const mockAi = {
  transcribeAudio: jest.fn().mockResolvedValue({ text: 'Test text', confidence: 0.9 }),
  analyzeRetelling: jest.fn().mockResolvedValue({ score: 85, feedback: 'Good', questions: ['Q1?', 'Q2?', 'Q3?'] }),
};
const mockFiles = { uploadAudio: jest.fn().mockResolvedValue('http://audio-url/session1/test.webm') };

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
        { provide: getRepositoryToken(ChallengeEnrollment), useValue: mockEnrollmentRepo },
        { provide: getRepositoryToken(ReviewQueue), useValue: mockReviewRepo },
        { provide: CoinsService, useValue: mockCoins },
        { provide: ChildrenService, useValue: mockChildren },
        { provide: AiService, useValue: mockAi },
        { provide: FilesService, useValue: mockFiles },
      ],
    }).compile();
    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('create → throws NotFoundException if enrollment not found', async () => {
    mockEnrollmentRepo.findOne.mockResolvedValue(null);
    await expect(service.create('bad-id', 'c1')).rejects.toThrow(NotFoundException);
  });

  it('analyze → earns coins and increments streak when score >= 80', async () => {
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1',
      transcription: 'text', phase: SessionPhase.ANALYZING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockAi.analyzeRetelling.mockResolvedValue({ score: 85, feedback: 'Good', questions: ['Q1', 'Q2', 'Q3'] });
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', parentId: 'p1', challenge: { coinsReward: 500 },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);

    const result = await service.analyze('s1', 'c1', 'Test Book');
    expect(mockCoins.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ toId: 'c1', amount: 500, type: 'earn' }),
    );
    expect(mockChildren.incrementStreak).toHaveBeenCalledWith('c1');
    expect(result.status).toBe(SessionStatus.COMPLETED);
  });

  it('analyze → adds to review queue when score < 80', async () => {
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1',
      transcription: 'text', phase: SessionPhase.ANALYZING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockAi.analyzeRetelling.mockResolvedValue({ score: 60, feedback: 'Poor', questions: ['Q1', 'Q2', 'Q3'] });
    mockEnrollmentRepo.findOne.mockResolvedValue({ id: 'e1', parentId: 'p1', challenge: { coinsReward: 500 } });
    mockReviewRepo.findOne.mockResolvedValue(null);
    mockReviewRepo.create.mockReturnValue({ sessionId: 's1', parentId: 'p1' });
    mockReviewRepo.save.mockResolvedValue({ id: 'rq1' });

    await service.analyze('s1', 'c1', 'Test Book');
    expect(mockReviewRepo.save).toHaveBeenCalled();
    expect(mockCoins.transfer).not.toHaveBeenCalled();
  });

  it('startRecording → throws BadRequest if wrong phase', async () => {
    mockSessionRepo.findOne.mockResolvedValue({ id: 's1', childId: 'c1', phase: SessionPhase.RECORDING });
    await expect(service.startRecording('s1', 'c1')).rejects.toThrow(BadRequestException);
  });

  it('startRecording → throws ForbiddenException if wrong child', async () => {
    mockSessionRepo.findOne.mockResolvedValue({ id: 's1', childId: 'c1', phase: SessionPhase.READ });
    await expect(service.startRecording('s1', 'c2')).rejects.toThrow(ForbiddenException);
  });

  it('create → throws BadRequest if enrollment not active', async () => {
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', childId: 'c1', status: EnrollmentStatus.COMPLETED,
    });
    await expect(service.create('e1', 'c1')).rejects.toThrow(BadRequestException);
  });
});
