import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { ChallengeEnrollment } from './entities/enrollment.entity';
import { ReviewQueue } from './entities/review-queue.entity';
import { CoinsService } from '../coins/coins.service';
import { ChildrenService } from '../children/children.service';
import { AiService } from '../ai/ai.service';
import { FilesService, BUCKET_AUDIO } from '../files/files.service';
import { SessionPhase, SessionStatus, EnrollmentStatus, CoinTransactionType } from '../common/enums';

function mimeFromUrl(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const map: Record<string, string> = { webm: 'audio/webm', mp4: 'audio/mp4', wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg' };
  return map[ext ?? ''] ?? 'audio/webm';
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(ChallengeEnrollment)
    private enrollmentRepo: Repository<ChallengeEnrollment>,
    @InjectRepository(ReviewQueue)
    private reviewQueueRepo: Repository<ReviewQueue>,
    private coinsService: CoinsService,
    private childrenService: ChildrenService,
    private aiService: AiService,
    private filesService: FilesService,
  ) {}

  async create(enrollmentId: string, childId: string): Promise<Session> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId, childId },
      relations: ['challenge'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('Enrollment is not active');
    }

    // Return existing in-progress session if any
    const existing = await this.sessionRepo.findOne({
      where: { enrollmentId, status: SessionStatus.PENDING, phase: Not(SessionPhase.DONE) },
    });
    if (existing) return existing;

    // Check we haven't exceeded totalParts
    const completedCount = await this.sessionRepo.count({
      where: { enrollmentId, status: SessionStatus.COMPLETED },
    });
    const totalParts = enrollment.challenge?.totalParts ?? 0;
    if (totalParts > 0 && completedCount >= totalParts) {
      throw new BadRequestException('All parts completed');
    }

    const session = this.sessionRepo.create({
      enrollmentId,
      childId,
      partNumber: completedCount + 1,
      phase: SessionPhase.READ,
      status: SessionStatus.PENDING,
    });
    return this.sessionRepo.save(session);
  }

  async findById(id: string): Promise<Session & { coinsPerPart?: number }> {
    const s = await this.sessionRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Session not found');
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: s.enrollmentId } });
    return { ...s, coinsPerPart: enrollment?.coinsPerPart ?? 0 };
  }

  async findByChild(childId: string): Promise<Session[]> {
    return this.sessionRepo.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEnrollment(enrollmentId: string, childId: string): Promise<Session[]> {
    return this.sessionRepo.find({
      where: { enrollmentId, childId },
      order: { partNumber: 'ASC' },
    });
  }

  async findByChildForParent(childId: string, _parentId: string): Promise<Session[]> {
    return this.sessionRepo.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });
  }

  async startRecording(id: string, childId: string): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    if (session.phase !== SessionPhase.READ) {
      throw new BadRequestException('Session is not in read phase');
    }
    session.phase = SessionPhase.RECORDING;
    return this.sessionRepo.save(session);
  }

  async uploadAudio(id: string, childId: string, file: Express.Multer.File): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');

    const audioUrl = await this.filesService.uploadAudio(file, id);
    session.audioUrl = audioUrl;
    session.phase = SessionPhase.TRANSCRIBING;
    const saved = await this.sessionRepo.save(session);

    setImmediate(() => {
      this.transcribe(id, childId).catch((err) => {
        this.logger.error(`Auto-transcribe failed for session ${id}: ${err?.message}`);
      });
    });

    return saved;
  }

  async transcribe(id: string, childId: string): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    if (!session.audioUrl) throw new BadRequestException('No audio uploaded');

    const urlPath = new URL(session.audioUrl).pathname.slice(1);
    const slashIdx = urlPath.indexOf('/');
    const bucket = slashIdx === -1 ? BUCKET_AUDIO : urlPath.slice(0, slashIdx);
    const objectPath = slashIdx === -1 ? urlPath : urlPath.slice(slashIdx + 1);
    const mimeType = mimeFromUrl(session.audioUrl);

    const audioBuffer = await this.filesService.getBuffer(objectPath, bucket);
    const result = await this.aiService.transcribeAudio(audioBuffer, objectPath, mimeType);
    session.transcription = result.text;

    const hasText = result.text && result.text.trim().length > 0;
    session.phase = SessionPhase.DONE;

    if (hasText) {
      session.status = SessionStatus.COMPLETED;
      const enrollment = await this.enrollmentRepo.findOne({
        where: { id: session.enrollmentId },
        relations: ['challenge'],
      });
      if (enrollment && enrollment.coinsPerPart > 0) {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: childId,
          toType: 'child',
          amount: enrollment.coinsPerPart,
          type: CoinTransactionType.EARN,
          referenceId: `session-earn-${id}`,
        });
        await this.childrenService.incrementStreak(childId);
      }
    } else {
      // Empty transcription — send to expert for review
      const enrollment = await this.enrollmentRepo.findOne({
        where: { id: session.enrollmentId },
        relations: ['challenge'],
      });
      if (enrollment?.challenge?.authorId) {
        const existing = await this.reviewQueueRepo.findOne({ where: { sessionId: id } });
        if (!existing) {
          await this.reviewQueueRepo.save(
            this.reviewQueueRepo.create({
              sessionId: id,
              expertId: enrollment.challenge.authorId,
              resolved: false,
            }),
          );
        }
      }
    }

    return this.sessionRepo.save(session);
  }

  async getPartText(id: string, childId: string): Promise<{ text: string | null; imageUrl: string | null; partNumber: number }> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });
    const texts: string[] = enrollment?.challenge?.partTexts ?? [];
    const images: string[] = enrollment?.challenge?.partImages ?? [];
    const text = texts[session.partNumber - 1] ?? null;
    const imageUrl = images[session.partNumber - 1] ?? null;
    return { text, imageUrl, partNumber: session.partNumber };
  }

  async analyze(id: string, childId: string, bookTitle?: string): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    if (!session.transcription) throw new BadRequestException('No transcription');

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });

    const resolvedTitle = bookTitle ?? enrollment?.challenge?.bookTitle ?? '';

    const result = await this.aiService.analyzeRetelling(session.transcription, resolvedTitle);
    session.aiScore = result.score;
    session.aiQuestions = result.questions;
    session.phase = SessionPhase.DONE;

    if (result.score >= 80) {
      session.status = SessionStatus.COMPLETED;
      if (enrollment && enrollment.coinsPerPart > 0) {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: childId,
          toType: 'child',
          amount: enrollment.coinsPerPart,
          type: CoinTransactionType.EARN,
          referenceId: `session-earn-${id}`,
        });
        await this.childrenService.incrementStreak(childId);
      }
    } else if (enrollment?.challenge?.authorId) {
      const existing = await this.reviewQueueRepo.findOne({ where: { sessionId: id } });
      if (!existing) {
        await this.reviewQueueRepo.save(
          this.reviewQueueRepo.create({
            sessionId: id,
            expertId: enrollment.challenge.authorId,
            resolved: false,
          }),
        );
      }
    }

    return this.sessionRepo.save(session);
  }

  async answer(id: string, childId: string, answers: Record<string, string>): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    session.aiAnswers = answers;
    return this.sessionRepo.save(session);
  }

  async createEnrollment(dto: {
    childId: string;
    challengeId: string;
    parentId: string;
  }): Promise<ChallengeEnrollment> {
    const existing = await this.enrollmentRepo.findOne({
      where: { childId: dto.childId, challengeId: dto.challengeId },
    });
    if (existing) throw new BadRequestException('Already enrolled');

    const enrollment = this.enrollmentRepo.create({
      ...dto,
      status: EnrollmentStatus.ACTIVE,
      startedAt: new Date(),
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async findEnrollmentsByChild(childId: string): Promise<any[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { childId, status: EnrollmentStatus.ACTIVE },
      relations: ['challenge'],
    });

    return Promise.all(
      enrollments.map(async (e) => {
        const completedParts = await this.sessionRepo.count({
          where: { enrollmentId: e.id, status: SessionStatus.COMPLETED },
        });
        return { ...e, completedParts };
      }),
    );
  }

  async findEnrollmentsByParent(parentId: string): Promise<ChallengeEnrollment[]> {
    return this.enrollmentRepo.find({
      where: { parentId },
      relations: ['challenge', 'child'],
    });
  }

  async findReviewQueue(expertId: string): Promise<ReviewQueue[]> {
    return this.reviewQueueRepo.find({
      where: { expertId, resolved: false },
      relations: ['session', 'session.enrollment', 'session.enrollment.challenge', 'session.child'],
    });
  }

  async approveReview(id: string, expertId: string): Promise<ReviewQueue> {
    const item = await this.reviewQueueRepo.findOne({
      where: { id, expertId },
      relations: ['session'],
    });
    if (!item) throw new NotFoundException('Review item not found');
    if (!item.session) throw new BadRequestException('Session not found');

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: item.session.enrollmentId },
      relations: ['challenge'],
    });

    if (enrollment) {
      item.session.status = SessionStatus.COMPLETED;
      await this.sessionRepo.save(item.session);

      if (enrollment.coinsPerPart > 0) {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: item.session.childId,
          toType: 'child',
          amount: enrollment.coinsPerPart,
          type: CoinTransactionType.EARN,
          referenceId: `review-approve-${id}`,
        });
      }
      await this.childrenService.incrementStreak(item.session.childId);
    }

    item.resolved = true;
    item.resolvedAt = new Date();
    return this.reviewQueueRepo.save(item);
  }

  async rejectReview(id: string, expertId: string): Promise<ReviewQueue> {
    const item = await this.reviewQueueRepo.findOne({ where: { id, expertId } });
    if (!item) throw new NotFoundException('Review item not found');
    item.resolved = true;
    item.resolvedAt = new Date();
    return this.reviewQueueRepo.save(item);
  }
}
