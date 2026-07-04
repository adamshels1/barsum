import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { ChallengeEnrollment } from './entities/enrollment.entity';
import { ReviewQueue } from './entities/review-queue.entity';
import { CoinsService } from '../coins/coins.service';
import { ChildrenService } from '../children/children.service';
import { AiService } from '../ai/ai.service';
import { FilesService, BUCKET_AUDIO, parseStoredFileUrl, audioMimeFromUrl } from '../files/files.service';
import { SessionPhase, SessionStatus, EnrollmentStatus, CoinTransactionType } from '../common/enums';

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

  // Отдаём аудиозапись сессии через backend (тот же https-origin, что и API),
  // чтобы не упираться в mixed-content блокировку прямых http-ссылок MinIO на проде.
  async getAudio(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const s = await this.sessionRepo.findOne({ where: { id } });
    if (!s?.audioUrl) throw new NotFoundException('Audio not found');
    const parsed = parseStoredFileUrl(s.audioUrl);
    if (!parsed) throw new NotFoundException('Audio not found');
    const buffer = await this.filesService.getBuffer(parsed.key, parsed.bucket);
    return { buffer, contentType: audioMimeFromUrl(s.audioUrl) };
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
      relations: ['enrollment', 'enrollment.challenge'],
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
    session.lastError = null;
    const saved = await this.sessionRepo.save(session);

    setImmediate(() => {
      this.transcribe(id, childId).catch((err) => {
        this.logger.error(`Auto-transcribe failed for session ${id}: ${err?.message}`);
        this.markProcessingFailed(id).catch((e) =>
          this.logger.error(`Failed to mark session ${id} as failed: ${e?.message}`),
        );
      });
    });

    return saved;
  }

  // Пересказ не удалось обработать (упавший AI-запрос и т.п.) — возвращаем ребёнку
  // возможность перезаписать, а не оставляем экран крутиться в "AI проверяет..." навсегда.
  private async markProcessingFailed(id: string): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) return;
    session.phase = SessionPhase.READ;
    session.lastError = 'Не получилось обработать запись. Попробуй записать ещё раз.';
    await this.sessionRepo.save(session);
  }

  async transcribe(id: string, childId: string): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    if (!session.audioUrl) throw new BadRequestException('No audio uploaded');

    const parsed = parseStoredFileUrl(session.audioUrl);
    const bucket = parsed?.bucket ?? BUCKET_AUDIO;
    const objectPath = parsed?.key ?? new URL(session.audioUrl).pathname.replace(/^\/+/, '');
    const mimeType = audioMimeFromUrl(session.audioUrl);

    const audioBuffer = await this.filesService.getBuffer(objectPath, bucket);
    const result = await this.aiService.transcribeAudio(audioBuffer, objectPath, mimeType);
    session.transcription = result.text;
    session.lastError = null;

    const hasText = result.text && result.text.trim().length > 0;

    if (!hasText) {
      // Пустая транскрибация — отправляем эксперту на ручную проверку
      session.phase = SessionPhase.DONE;
      await this.sessionRepo.save(session);
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
      return session;
    }

    session.phase = SessionPhase.ANALYZING;
    await this.sessionRepo.save(session);
    return this.analyze(id, childId);
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
    session.aiFeedback = result.feedback;
    session.aiQuestions = result.questions;
    session.phase = SessionPhase.DONE;

    if (result.score >= 8) {
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

  async findStudentsByExpert(expertUserId: string): Promise<any[]> {
    const enrollments = await this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.challenge', 'challenge')
      .innerJoinAndSelect('e.child', 'child')
      .where('challenge.authorId = :expertUserId', { expertUserId })
      .andWhere('e.status = :status', { status: EnrollmentStatus.ACTIVE })
      .getMany();

    if (enrollments.length === 0) return [];

    const enrollmentIds = enrollments.map((e) => e.id);

    const completedCounts = await this.sessionRepo
      .createQueryBuilder('s')
      .select('s.enrollmentId', 'enrollmentId')
      .addSelect('COUNT(*)', 'count')
      .where('s.enrollmentId IN (:...ids)', { ids: enrollmentIds })
      .andWhere('s.status = :status', { status: SessionStatus.COMPLETED })
      .groupBy('s.enrollmentId')
      .getRawMany();
    const completedMap = new Map(completedCounts.map((r) => [r.enrollmentId, Number(r.count)]));

    const lastActivity = await this.sessionRepo
      .createQueryBuilder('s')
      .select('s.childId', 'childId')
      .addSelect('MAX(s.createdAt)', 'lastAt')
      .where('s.enrollmentId IN (:...ids)', { ids: enrollmentIds })
      .groupBy('s.childId')
      .getRawMany();
    const lastActivityMap = new Map(lastActivity.map((r) => [r.childId, r.lastAt]));

    const byChild = new Map<string, any>();
    for (const e of enrollments) {
      const completed = completedMap.get(e.id) ?? 0;
      if (!byChild.has(e.childId)) {
        byChild.set(e.childId, {
          childId: e.childId,
          name: e.child.name,
          age: e.child.age,
          photoUrl: e.child.photoUrl,
          streak: e.child.streak,
          booksCount: 0,
          completedParts: 0,
          totalParts: 0,
          lastActivityAt: lastActivityMap.get(e.childId) ?? null,
        });
      }
      const entry = byChild.get(e.childId);
      entry.booksCount += 1;
      entry.completedParts += completed;
      entry.totalParts += e.challenge.totalParts;
    }

    return Array.from(byChild.values()).sort((a, b) => {
      if (!a.lastActivityAt) return 1;
      if (!b.lastActivityAt) return -1;
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });
  }

  async findStudentDetail(expertUserId: string, childId: string): Promise<any> {
    const enrollments = await this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.challenge', 'challenge')
      .innerJoinAndSelect('e.child', 'child')
      .where('challenge.authorId = :expertUserId', { expertUserId })
      .andWhere('e.childId = :childId', { childId })
      .getMany();

    if (enrollments.length === 0) throw new NotFoundException('Student not found');

    const enrollmentIds = enrollments.map((e) => e.id);
    const sessions = await this.sessionRepo.find({
      where: { enrollmentId: In(enrollmentIds) },
      order: { createdAt: 'DESC' },
    });

    const sessionsByEnrollment = new Map<string, Session[]>();
    for (const s of sessions) {
      if (!sessionsByEnrollment.has(s.enrollmentId)) sessionsByEnrollment.set(s.enrollmentId, []);
      sessionsByEnrollment.get(s.enrollmentId)!.push(s);
    }

    const child = enrollments[0].child;
    const books = enrollments.map((e) => {
      const enrollmentSessions = sessionsByEnrollment.get(e.id) ?? [];
      return {
        enrollmentId: e.id,
        challengeId: e.challengeId,
        title: e.challenge.title,
        bookTitle: e.challenge.bookTitle,
        bookAuthor: e.challenge.bookAuthor,
        coverImage: e.challenge.coverImage,
        totalParts: e.challenge.totalParts,
        completedParts: enrollmentSessions.filter((s) => s.status === SessionStatus.COMPLETED).length,
        sessions: enrollmentSessions.map((s) => ({
          id: s.id,
          partNumber: s.partNumber,
          status: s.status,
          aiScore: s.aiScore,
          createdAt: s.createdAt,
        })),
      };
    });

    return {
      child: { id: child.id, name: child.name, age: child.age, photoUrl: child.photoUrl, streak: child.streak },
      books,
    };
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
