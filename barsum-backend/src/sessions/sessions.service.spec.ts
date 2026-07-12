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
import { TelegramService } from '../notifications/telegram.service';
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
const mockChildren = {
  incrementStreak: jest.fn().mockResolvedValue(undefined),
  findById: jest.fn().mockResolvedValue({ id: 'c1', name: 'Test' }),
};
const mockAi = {
  transcribeAudio: jest.fn().mockResolvedValue({ text: 'Test text', confidence: 0.9 }),
  analyzeRetelling: jest.fn().mockResolvedValue({ score: 85, feedback: 'Good', questions: ['Q1?', 'Q2?', 'Q3?'] }),
};
const mockFiles = {
  uploadAudio: jest.fn().mockResolvedValue('http://audio-url/session1/test.webm'),
  getBuffer: jest.fn().mockResolvedValue(Buffer.from('audio')),
};
const mockTelegram = { send: jest.fn() };

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
        { provide: TelegramService, useValue: mockTelegram },
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

  it('analyze → earns coins and increments streak when score >= 8', async () => {
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1',
      transcription: 'text', phase: SessionPhase.ANALYZING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockAi.analyzeRetelling.mockResolvedValue({ score: 9, feedback: 'Good', questions: ['Q1', 'Q2', 'Q3'] });
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', parentId: 'p1', coinsPerPart: 500, challenge: { coinsReward: 500 },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);

    const result = await service.analyze('s1', 'c1', 'Test Book');
    expect(mockCoins.transfer).toHaveBeenCalledWith(
      expect.objectContaining({ toId: 'c1', amount: 500, type: 'earn' }),
    );
    expect(mockChildren.incrementStreak).toHaveBeenCalledWith('c1');
    expect(result.status).toBe(SessionStatus.COMPLETED);
  });

  it('analyze → reading path: считает метрики по эталону и зачитывает при хорошем чтении', async () => {
    const ref = 'Некрасивый серый утёнок не отставал от других уток на птичьем дворе';
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1', partNumber: 1,
      transcription: ref, audioDurationSec: 6, phase: SessionPhase.ANALYZING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', parentId: 'p1', coinsPerPart: 500, challenge: { coinsReward: 500, partTexts: [ref] },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);

    const result = await service.analyze('s1', 'c1');
    expect(mockAi.analyzeRetelling).not.toHaveBeenCalled(); // считаем алгоритмом, не AI
    expect(result.readingAccuracy).toBe(100);
    expect(result.readingCompleteness).toBe(100);
    expect(result.readingSpeedWpm).toBeGreaterThan(0);
    expect(result.aiScore).toBe(10);
    expect(result.status).toBe(SessionStatus.COMPLETED);
    expect(mockCoins.transfer).toHaveBeenCalled();
  });

  it('analyze → reading path: слабое чтение уходит эксперту с AI-черновиком', async () => {
    const ref = 'серый утёнок гулял по птичьему двору вместе с мамой уткой';
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1', partNumber: 1, status: SessionStatus.PENDING,
      transcription: 'кот бежал', audioDurationSec: 5, phase: SessionPhase.ANALYZING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', coinsPerPart: 500, challenge: { partTexts: [ref], authorId: 'expert1' },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);
    mockReviewRepo.create.mockReturnValue({ sessionId: 's1', expertId: 'expert1' });
    mockReviewRepo.save.mockResolvedValue({ id: 'rq1' });

    const result = await service.analyze('s1', 'c1');
    expect(mockReviewRepo.save).toHaveBeenCalled();
    expect(mockCoins.transfer).not.toHaveBeenCalled();
    expect(result.reviewReason).toBe('low_score');
    expect(result.expertReportDraft).toMatch(/точность/i);
    expect(result.status).toBe(SessionStatus.PENDING);
  });

  it('approveReview → сохраняет отчёт эксперта и зачитывает', async () => {
    const sess: any = { id: 's1', childId: 'c1', enrollmentId: 'e1', expertReportDraft: 'черновик' };
    mockReviewRepo.findOne.mockResolvedValue({ id: 'rq1', expertId: 'expert1', session: sess });
    mockReviewRepo.save.mockImplementation(async (x: any) => x);
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockEnrollmentRepo.findOne.mockResolvedValue({ id: 'e1', coinsPerPart: 500, challenge: {} });

    await service.approveReview('rq1', 'expert1', 'Читает уверенно, засчитано.');
    expect(sess.status).toBe(SessionStatus.COMPLETED);
    expect(sess.expertReport).toBe('Читает уверенно, засчитано.');
    expect(mockCoins.transfer).toHaveBeenCalled();
  });

  it('handleProcessingError → сбой AI отправляет запись эксперту (ai_error), не на перезапись', async () => {
    const sess: any = { id: 's1', enrollmentId: 'e1', phase: SessionPhase.TRANSCRIBING };
    mockSessionRepo.findOne.mockResolvedValue(sess);
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockEnrollmentRepo.findOne.mockResolvedValue({ id: 'e1', challenge: { authorId: 'expert1' } });
    mockReviewRepo.findOne.mockResolvedValue(null);
    mockReviewRepo.create.mockReturnValue({ sessionId: 's1', expertId: 'expert1' });
    mockReviewRepo.save.mockResolvedValue({ id: 'rq1' });

    await (service as any).handleProcessingError('s1');
    expect(sess.reviewReason).toBe('ai_error');
    expect(sess.phase).toBe(SessionPhase.DONE); // не READ — ребёнка не гоняем на перезапись
    expect(sess.expertReportDraft).toMatch(/не удалось обработать/i);
    expect(mockReviewRepo.save).toHaveBeenCalled();
  });

  it('rejectReview → сохраняет отчёт эксперта и помечает провал', async () => {
    const sess: any = { id: 's1', childId: 'c1', enrollmentId: 'e1', expertReportDraft: 'черновик' };
    mockReviewRepo.findOne.mockResolvedValue({ id: 'rq1', expertId: 'expert1', session: sess });
    mockReviewRepo.save.mockImplementation(async (x: any) => x);
    mockSessionRepo.save.mockImplementation(async (s: any) => s);

    await service.rejectReview('rq1', 'expert1', 'Читал неразборчиво.');
    expect(sess.status).toBe(SessionStatus.FAILED);
    expect(sess.expertReport).toBe('Читал неразборчиво.');
  });

  it('analyze → adds to review queue when score < 8', async () => {
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1',
      transcription: 'text', phase: SessionPhase.ANALYZING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockAi.analyzeRetelling.mockResolvedValue({ score: 6, feedback: 'Poor', questions: ['Q1', 'Q2', 'Q3'] });
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', parentId: 'p1', coinsPerPart: 500, challenge: { coinsReward: 500, authorId: 'expert1' },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);
    mockReviewRepo.create.mockReturnValue({ sessionId: 's1', expertId: 'expert1' });
    mockReviewRepo.save.mockResolvedValue({ id: 'rq1' });

    await service.analyze('s1', 'c1', 'Test Book');
    expect(mockReviewRepo.save).toHaveBeenCalled();
    expect(mockCoins.transfer).not.toHaveBeenCalled();
  });

  it('transcribe → delegates to analyze() when transcription has text', async () => {
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1',
      audioUrl: 'http://minio/barsum-audio/s1/rec.webm', phase: SessionPhase.TRANSCRIBING,
    };
    mockSessionRepo.findOne
      .mockResolvedValueOnce({ ...session }) // findById() внутри transcribe()
      .mockResolvedValueOnce({ ...session, transcription: 'Пересказ книги' }); // findById() внутри analyze()
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockAi.transcribeAudio.mockResolvedValue({ text: 'Пересказ книги', confidence: 0.9 });
    mockAi.analyzeRetelling.mockResolvedValue({ score: 9, feedback: 'Отлично!', questions: ['Q1', 'Q2', 'Q3'] });
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', parentId: 'p1', challenge: { coinsReward: 500 },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);

    const result = await service.transcribe('s1', 'c1');
    expect(mockAi.analyzeRetelling).toHaveBeenCalled();
    expect(result.status).toBe(SessionStatus.COMPLETED);
    expect(result.aiFeedback).toBe('Отлично!');
  });

  it('transcribe → sends to expert review queue when transcription is empty', async () => {
    const session = {
      id: 's1', childId: 'c1', enrollmentId: 'e1', status: SessionStatus.PENDING,
      audioUrl: 'http://minio/barsum-audio/s1/rec.webm', phase: SessionPhase.TRANSCRIBING,
    };
    mockSessionRepo.findOne.mockResolvedValue({ ...session });
    mockSessionRepo.save.mockImplementation(async (s: any) => s);
    mockAi.transcribeAudio.mockResolvedValue({ text: '', confidence: 0.2 });
    mockEnrollmentRepo.findOne.mockResolvedValue({
      id: 'e1', challenge: { authorId: 'expert1' },
    });
    mockReviewRepo.findOne.mockResolvedValue(null);
    mockReviewRepo.create.mockReturnValue({ sessionId: 's1', expertId: 'expert1' });
    mockReviewRepo.save.mockResolvedValue({ id: 'rq1' });

    const result = await service.transcribe('s1', 'c1');
    expect(mockAi.analyzeRetelling).not.toHaveBeenCalled();
    expect(mockReviewRepo.save).toHaveBeenCalled();
    expect(result.status).toBe(SessionStatus.PENDING);
  });

  it('getAudio → streams buffer derived from stored MinIO url', async () => {
    mockSessionRepo.findOne.mockResolvedValue({
      id: 's1', audioUrl: 'http://185.113.132.6:9100/barsum-audio/s1/rec.wav',
    });
    mockFiles.getBuffer.mockResolvedValue(Buffer.from('audio-bytes'));
    const result = await service.getAudio('s1');
    expect(mockFiles.getBuffer).toHaveBeenCalledWith('s1/rec.wav', 'barsum-audio');
    expect(result.contentType).toBe('audio/wav');
    expect(result.buffer.toString()).toBe('audio-bytes');
  });

  it('getAudio → throws NotFound when session has no audio', async () => {
    mockSessionRepo.findOne.mockResolvedValue({ id: 's1', audioUrl: null });
    await expect(service.getAudio('s1')).rejects.toThrow(NotFoundException);
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
