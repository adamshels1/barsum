import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { ChallengeEnrollment } from './entities/enrollment.entity';
import { ReviewQueue } from './entities/review-queue.entity';
import { CoinsService } from '../coins/coins.service';
import { ChildrenService } from '../children/children.service';
import { AiService } from '../ai/ai.service';
import { FilesService, BUCKET_AUDIO, parseStoredFileUrl, audioMimeFromUrl } from '../files/files.service';
import { SessionPhase, SessionStatus, EnrollmentStatus, CoinTransactionType, ChallengeCategory } from '../common/enums';
import { assessReading, readingAdvice } from './reading-assessment';
import { TelegramService, esc } from '../notifications/telegram.service';
import { PushService } from '../push/push.service';

// Порог автозачёта (0–10). Ниже — уходит эксперту на ручную проверку.
const AUTO_CREDIT_SCORE = 7;

// «Своя книжка»: одна сессия чтения — не больше 10 минут.
const OWN_BOOK_SESSION_MAX_SEC = 600;
// Минимум, чтобы сессия засчиталась автоматически (иначе — на подтверждение родителю).
const OWN_BOOK_MIN_SEC = 60;

// Бонус за пересказ: до 30% от монет за часть, пропорционально оценке пересказа (0–10).
const RETELL_BONUS_FRACTION = 0.3;

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
    private telegram: TelegramService,
    private push: PushService,
  ) {}

  async create(enrollmentId: string, childId: string, requestedPart?: number): Promise<Session> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId, childId },
      relations: ['challenge'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException('Enrollment is not active');
    }

    const totalParts = enrollment.challenge?.totalParts ?? 0;

    // Какую часть открываем: если фронт передал номер нажатой части — её,
    // иначе первую непрочитанную. НЕ по счётчику завершённых (иначе дубли/
    // пропуски частей сбивают нумерацию — см. историю бага).
    let partNumber =
      requestedPart && requestedPart > 0 ? Math.floor(requestedPart) : 0;
    if (!partNumber) {
      partNumber = await this.nextUnreadPart(enrollmentId, totalParts);
    }
    if (totalParts > 0 && partNumber > totalParts) {
      throw new BadRequestException('All parts completed');
    }

    // Идемпотентность по (enrollment, partNumber): если сессия для этой части
    // уже есть — возвращаем её, а не плодим дубль (чинит гонку двойного тапа).
    const existing = await this.sessionRepo.findOne({
      where: { enrollmentId, partNumber },
    });
    if (existing) return existing;

    const session = this.sessionRepo.create({
      enrollmentId,
      childId,
      partNumber,
      phase: SessionPhase.READ,
      status: SessionStatus.PENDING,
    });
    return this.sessionRepo.save(session);
  }

  // Первая непрочитанная часть = наименьший номер в [1..totalParts], у которого
  // ещё нет завершённой сессии. Устойчиво к дублям и пропускам в истории чтения.
  private async nextUnreadPart(enrollmentId: string, totalParts: number): Promise<number> {
    const completed = await this.sessionRepo.find({
      where: { enrollmentId, status: SessionStatus.COMPLETED },
      select: ['partNumber'],
    });
    const done = new Set(completed.map((s) => s.partNumber));
    const limit = totalParts > 0 ? totalParts : Number.MAX_SAFE_INTEGER;
    for (let p = 1; p <= limit; p++) {
      if (!done.has(p)) return p;
    }
    return (totalParts || 0) + 1; // всё прочитано — вызовет ошибку "All parts completed"
  }

  async findById(
    id: string,
  ): Promise<
    Session & {
      coinsPerPart?: number;
      coinsPerMinute?: number;
      category?: ChallengeCategory;
      bookTitle?: string;
      retellRequired?: boolean;
    }
  > {
    const s = await this.sessionRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Session not found');
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: s.enrollmentId },
      relations: ['challenge'],
    });
    return {
      ...s,
      coinsPerPart: enrollment?.coinsPerPart ?? 0,
      coinsPerMinute: enrollment?.coinsPerMinute ?? 0,
      category: enrollment?.challenge?.category,
      bookTitle: enrollment?.challenge?.bookTitle,
      retellRequired: enrollment?.challenge?.retellRequired ?? false,
    };
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

  // Аудиозапись пересказа — тот же прокси, что и getAudio.
  async getRetellAudio(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const s = await this.sessionRepo.findOne({ where: { id } });
    if (!s?.retellAudioUrl) throw new NotFoundException('Retell audio not found');
    const parsed = parseStoredFileUrl(s.retellAudioUrl);
    if (!parsed) throw new NotFoundException('Retell audio not found');
    const buffer = await this.filesService.getBuffer(parsed.key, parsed.bucket);
    return { buffer, contentType: audioMimeFromUrl(s.retellAudioUrl) };
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

  // Спорные сессии «своей книжки», ожидающие подтверждения родителя.
  // Это родительский аналог очереди эксперта — фронт родителя опрашивает его,
  // чтобы показать блок «нужно подтвердить чтение».
  async findPendingForParent(parentId: string): Promise<Session[]> {
    // Settled-but-unconfirmed сессии ребёнка: и «своя книжка» (спорные записи),
    // и экспертские книги, ожидающие проверки — родитель может подтвердить оба.
    return this.sessionRepo.find({
      where: {
        status: SessionStatus.PENDING,
        phase: SessionPhase.DONE,
        enrollment: { parentId },
      },
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

  async uploadAudio(id: string, childId: string, file: Express.Multer.File, durationSec?: number): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');

    const audioUrl = await this.filesService.uploadAudio(file, id);
    session.audioUrl = audioUrl;
    if (durationSec && durationSec > 0) session.audioDurationSec = durationSec;
    session.phase = SessionPhase.TRANSCRIBING;
    session.lastError = null;
    const saved = await this.sessionRepo.save(session);

    setImmediate(() => {
      this.transcribe(id, childId).catch((err) => {
        this.logger.error(`Auto-transcribe failed for session ${id}: ${err?.message}`);
        this.handleProcessingError(id).catch((e) =>
          this.logger.error(`Failed to route session ${id} to expert: ${e?.message}`),
        );
      });
    });

    return saved;
  }

  // AI не смог обработать запись (сбой транскрибации/анализа) — не теряем хорошую запись
  // и не гоняем ребёнка на перезапись, а отдаём эксперту (он послушает аудио и решит).
  private async handleProcessingError(id: string): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) return;
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });
    await this.routeToExpert(
      session,
      enrollment,
      'ai_error',
      'Не удалось обработать запись автоматически. Послушайте аудио и оцените чтение.',
    );
  }

  // Отправка сессии на ручную проверку эксперту: черновик отчёта уже готов (AI/шаблон),
  // эксперту остаётся послушать и подтвердить. Родителю проверка НИКОГДА не уходит.
  private async routeToExpert(
    session: Session,
    enrollment: ChallengeEnrollment | null,
    reason: string,
    draft: string,
  ): Promise<void> {
    session.reviewReason = reason;
    session.expertReportDraft = draft;
    session.phase = SessionPhase.DONE;
    session.lastError = null;
    await this.sessionRepo.save(session);

    const rvChild = await this.childrenService.findById(session.childId).catch(() => null);
    const rvBook = enrollment?.challenge?.bookTitle;

    // Пуш родителю: ребёнок прочитал часть (даже если чтение ушло на проверку эксперта).
    if (enrollment?.parentId) {
      void this.push.sendToUser(enrollment.parentId, {
        title: '📖 Ребёнок читает!',
        body: `${rvChild?.name ?? 'Ребёнок'} прочитал(а) часть ${session.partNumber}${rvBook ? ` «${rvBook}»` : ''} — на проверке у эксперта`,
        url: '/parent/cabinet',
        tag: `read-${session.childId}`,
      });
    }

    const authorId = enrollment?.challenge?.authorId;
    if (!authorId) return; // нет эксперта у челленджа — оставляем в pending
    const existing = await this.reviewQueueRepo.findOne({ where: { sessionId: session.id } });
    if (!existing) {
      await this.reviewQueueRepo.save(
        this.reviewQueueRepo.create({ sessionId: session.id, expertId: authorId, resolved: false }),
      );
    }

    // Пуш эксперту: ребёнок закончил чтение — есть что проверить.
    void this.push.sendToUser(authorId, {
      title: '🎧 Новая работа на проверке',
      body: `${rvChild?.name ?? 'Ребёнок'} прочитал(а) часть ${session.partNumber}${rvBook ? ` «${rvBook}»` : ''}`,
      url: '/expert/home',
      tag: 'review',
    });
  }

  // «Своя книжка»: спорную сессию (нет речи / слишком коротко) не теряем и не гоняем
  // на перезапись, а помечаем как ожидающую подтверждения родителя (эксперта тут нет).
  private async routeToParent(session: Session, reason: string): Promise<void> {
    session.reviewReason = reason;
    session.phase = SessionPhase.DONE;
    session.status = SessionStatus.PENDING;
    session.lastError = null;
    await this.sessionRepo.save(session);

    const child = await this.childrenService.findById(session.childId).catch(() => null);
    this.telegram.send(
      'other',
      `📖 <b>Своя книжка — нужна проверка родителя</b>\n🧒 ${esc(child?.name ?? 'Ребёнок')} (${esc(session.childId)}) — сессия ${session.partNumber}`,
    );
  }

  // Начисление монет за сессию чтения своей книги: по-минутно, кап 10 минут.
  // Прогоняет распознанный текст чтения «своей книги» через ИИ и сохраняет разбор
  // в сессию (aiScore / aiFeedback / aiQuestions) — те же поля, что и в экспертских
  // книгах без эталонного текста. Ошибки анализа не критичны: чтение всё равно
  // засчитывается по минутам.
  private async attachOwnBookAiAnalysis(
    session: Session,
    enrollment: ChallengeEnrollment,
  ): Promise<void> {
    const transcription = (session.transcription ?? '').trim();
    if (!transcription) return;
    const bookTitle = enrollment.challenge?.bookTitle || 'Своя книга';
    try {
      const ai = await this.aiService.analyzeRetelling(transcription, bookTitle);
      const raw = Number(ai.score ?? 0);
      const normalized = raw > 10 ? raw / 10 : raw; // на случай если модель вернёт 0–100
      session.aiScore = Math.max(0, Math.min(10, Math.round(normalized)));
      session.aiFeedback = ai.feedback ?? null;
      session.aiQuestions = ai.questions ?? null;
    } catch (err: any) {
      this.logger.error(`own-book analyzeRetelling failed for ${session.id}: ${err?.message}`);
    }
  }

  private async creditOwnBookSession(
    session: Session,
    enrollment: ChallengeEnrollment,
    childId: string,
  ): Promise<Session> {
    // AI-аналитика чтения своей книги — как в других книгах. У своей книги нет
    // эталонного текста (это бумажная книга родителя), поэтому анализируем сам
    // распознанный текст чтения через ту же модель, что и пересказ в экспертских
    // книгах. Результат (оценка + разбор) уходит родителю вместе с подтверждением.
    await this.attachOwnBookAiAnalysis(session, enrollment);

    const cappedSec = Math.min(session.audioDurationSec ?? 0, OWN_BOOK_SESSION_MAX_SEC);
    const minutes = Math.round(cappedSec / 60);

    if (cappedSec < OWN_BOOK_MIN_SEC || minutes < 1) {
      // Слишком короткая запись — на подтверждение родителю (уже с AI-аналитикой).
      await this.routeToParent(session, 'too_short');
      return session;
    }

    const coins = (enrollment.coinsPerMinute || 0) * minutes;
    session.phase = SessionPhase.DONE;
    session.status = SessionStatus.COMPLETED;
    // aiFeedback уже содержит разбор ИИ — не затираем его. Если анализ не удался,
    // оставляем краткий итог по монетам, чтобы экран не был пустым.
    if (!session.aiFeedback) {
      session.aiFeedback = `Прочитано ${minutes} мин — засчитано ${coins} монет.`;
    }
    if (coins > 0) {
      await this.coinsService.transfer({
        fromId: 'system',
        fromType: 'system',
        toId: childId,
        toType: 'child',
        amount: coins,
        type: CoinTransactionType.EARN,
        referenceId: `session-earn-${session.id}`,
      });
      await this.childrenService.incrementStreak(childId);
    }
    const saved = await this.sessionRepo.save(session);

    const child = await this.childrenService.findById(childId).catch(() => null);
    this.telegram.send(
      'other',
      `📖 <b>Своя книжка засчитана</b>\n🧒 ${esc(child?.name ?? 'Ребёнок')} (${esc(childId)}) — сессия ${session.partNumber}, ${minutes} мин (+${coins} монет)`,
    );
    return saved;
  }

  // Родитель подтверждает/отклоняет спорную сессию. Работает и для «своей книжки»,
  // и для экспертских книг (родитель может подтвердить вместо эксперта).
  async parentConfirmSession(
    sessionId: string,
    parentId: string,
    approve: boolean,
  ): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });
    if (!enrollment || enrollment.parentId !== parentId) {
      throw new ForbiddenException('Not your session');
    }
    if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.FAILED) {
      return session;
    }

    const isOwnBook = enrollment.challenge?.category === ChallengeCategory.OWN_BOOK;

    if (isOwnBook) {
      if (!approve) {
        session.status = SessionStatus.FAILED;
        return this.sessionRepo.save(session);
      }
      const cappedSec = Math.min(session.audioDurationSec ?? 0, OWN_BOOK_SESSION_MAX_SEC);
      const minutes = Math.max(1, Math.round(cappedSec / 60));
      const coins = (enrollment.coinsPerMinute || 0) * minutes;
      session.status = SessionStatus.COMPLETED;
      session.phase = SessionPhase.DONE;
      // Не затираем разбор ИИ (aiFeedback) — он нужен родителю и ребёнку.
      // Итог подтверждения кладём в отдельное поле отчёта.
      session.expertReport = `Подтверждено родителем: ${minutes} мин — ${coins} монет.`;
      if (!session.aiFeedback) {
        session.aiFeedback = `Прочитано ${minutes} мин — засчитано ${coins} монет.`;
      }
      if (coins > 0) {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: session.childId,
          toType: 'child',
          amount: coins,
          type: CoinTransactionType.EARN,
          referenceId: `session-earn-${session.id}`,
        });
        await this.childrenService.incrementStreak(session.childId);
      }
      return this.sessionRepo.save(session);
    }

    // Экспертская книга: родитель подтверждает вместо эксперта.
    if (!approve) {
      session.status = SessionStatus.FAILED;
      session.expertReport = (session.expertReport || 'Отклонено родителем.').trim();
      await this.sessionRepo.save(session);
    } else {
      session.status = SessionStatus.COMPLETED;
      session.phase = SessionPhase.DONE;
      session.expertReport = (session.expertReport || 'Подтверждено родителем.').trim();
      await this.sessionRepo.save(session);
      if (enrollment.coinsPerPart > 0) {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: session.childId,
          toType: 'child',
          amount: enrollment.coinsPerPart,
          type: CoinTransactionType.EARN,
          referenceId: `parent-approve-${session.id}`,
        });
      }
      await this.childrenService.incrementStreak(session.childId);
    }
    // Закрываем очередь эксперта по этой сессии, чтобы не подтверждали дважды.
    await this.reviewQueueRepo.update(
      { sessionId: session.id, resolved: false },
      { resolved: true, resolvedAt: new Date() },
    );
    return session;
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
      const enrollment = await this.enrollmentRepo.findOne({
        where: { id: session.enrollmentId },
        relations: ['challenge'],
      });
      if (enrollment?.challenge?.category === ChallengeCategory.OWN_BOOK) {
        // У «своей книги» нет эксперта — спорную запись отдаём на подтверждение родителю.
        await this.routeToParent(session, 'no_speech');
        return session;
      }
      // Речь не распозналась — отдаём эксперту (послушает аудио сам)
      await this.routeToExpert(
        session,
        enrollment,
        'no_speech',
        'Речь в записи не распозналась автоматически. Послушайте аудио и оцените чтение.',
      );
      return session;
    }

    session.phase = SessionPhase.ANALYZING;
    await this.sessionRepo.save(session);
    return this.analyze(id, childId);
  }

  async getPartText(id: string, childId: string): Promise<{ text: string | null; imageUrl: string | null; audioUrl: string | null; title: string | null; partNumber: number }> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });
    const texts: string[] = enrollment?.challenge?.partTexts ?? [];
    const images: string[] = enrollment?.challenge?.partImages ?? [];
    const audios: string[] = enrollment?.challenge?.partAudios ?? [];
    const titles: string[] = enrollment?.challenge?.partTitles ?? [];
    const text = texts[session.partNumber - 1] ?? null;
    const imageUrl = images[session.partNumber - 1] ?? null;
    const audioUrl = audios[session.partNumber - 1] ?? null;
    const title = titles[session.partNumber - 1] ?? null;
    return { text, imageUrl, audioUrl, title, partNumber: session.partNumber };
  }

  async analyze(id: string, childId: string, bookTitle?: string): Promise<Session> {
    const session = await this.findById(id);
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    if (!session.transcription) throw new BadRequestException('No transcription');

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });

    // «Своя книжка»: эталонного текста нет — не оцениваем чтение, а начисляем монеты
    // по-минутно за реально записанное время (речь уже подтверждена на этапе transcribe).
    if (enrollment?.challenge?.category === ChallengeCategory.OWN_BOOK) {
      return this.creditOwnBookSession(session, enrollment, childId);
    }

    const referenceText = enrollment?.challenge?.partTexts?.[session.partNumber - 1] ?? '';
    let score: number;
    let expertDraft: string;

    if (referenceText.trim()) {
      // Оценка чтения вслух: объективные метрики через сравнение с эталоном.
      const a = assessReading(referenceText, session.transcription, session.audioDurationSec);
      session.readingAccuracy = a.accuracy;
      session.readingCompleteness = a.completeness;
      session.readingSpeedWpm = a.speedWpm ?? null;
      session.errorWords = a.errorWords;
      session.aiScore = a.score;
      session.aiFeedback = readingAdvice(a);
      score = a.score;
      const errPart = a.errorWords.length ? ` Споткнулся: ${a.errorWords.map((w) => `«${w}»`).join(', ')}.` : '';
      const speedPart = a.speedWpm != null ? `, скорость ${a.speedWpm} сл/мин` : '';
      expertDraft = `Чтение распознано, но слабое: точность ${a.accuracy}%, полнота ${a.completeness}%${speedPart}.${errPart} Послушайте запись и решите, засчитать ли.`;
    } else {
      // У челленджа нет эталонного текста части (только сканы) — падаем на AI-оценку пересказа.
      const resolvedTitle = bookTitle ?? enrollment?.challenge?.bookTitle ?? '';
      const result = await this.aiService.analyzeRetelling(session.transcription, resolvedTitle);
      session.aiScore = result.score;
      session.aiFeedback = result.feedback;
      session.aiQuestions = result.questions;
      score = result.score >= 10 ? result.score / 10 : result.score; // нормализуем к 0–10 на всякий
      expertDraft = result.feedback || 'Послушайте запись и оцените чтение.';
    }

    session.aiScore = score;
    session.expertReportDraft = expertDraft;

    // Пересказ включён экспертом и есть эталонный текст части — сначала просим
    // ребёнка пересказать; финализацию чтения (зачёт/эксперт) откладываем до конца.
    const needRetell =
      enrollment?.challenge?.category === ChallengeCategory.READING &&
      !!enrollment?.challenge?.retellRequired &&
      referenceText.trim().length > 0 &&
      !session.retellTranscription &&
      session.retellScore == null;
    if (needRetell) {
      session.phase = SessionPhase.RETELL;
      return this.sessionRepo.save(session);
    }

    return this.finalizeReading(session, enrollment);
  }

  // Финализация чтения: авто-зачёт при хорошей оценке, иначе — эксперту.
  // Вызывается либо сразу из analyze (если пересказ не нужен), либо после пересказа.
  private async finalizeReading(
    session: Session,
    enrollment: ChallengeEnrollment | null,
  ): Promise<Session> {
    const childId = session.childId;
    const score = Number(session.aiScore ?? 0);

    if (score >= AUTO_CREDIT_SCORE) {
      session.phase = SessionPhase.DONE;
      session.status = SessionStatus.COMPLETED;
      if (enrollment && enrollment.coinsPerPart > 0) {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: childId,
          toType: 'child',
          amount: enrollment.coinsPerPart,
          type: CoinTransactionType.EARN,
          referenceId: `session-earn-${session.id}`,
        });
        await this.childrenService.incrementStreak(childId);
      }
      const savedSession = await this.sessionRepo.save(session);
      const child = await this.childrenService.findById(childId).catch(() => null);
      this.telegram.send(
        'other',
        `📖 <b>Чтение засчитано</b>\n🧒 ${esc(child?.name ?? 'Ребёнок')} (${esc(childId)}) — часть ${session.partNumber}, оценка ${session.aiScore}/10` +
          (enrollment?.coinsPerPart ? ` (+${enrollment.coinsPerPart} монет)` : ''),
      );
      // Пуш родителю: ребёнок прочитал часть.
      if (enrollment?.parentId) {
        void this.push.sendToUser(enrollment.parentId, {
          title: '📖 Ребёнок читает!',
          body: `${child?.name ?? 'Ребёнок'} прочитал(а) часть ${session.partNumber} — оценка ${session.aiScore}/10` +
            (enrollment?.coinsPerPart ? ` (+${enrollment.coinsPerPart} монет)` : ''),
          url: '/parent/cabinet',
          tag: `read-${childId}`,
        });
      }
      return savedSession;
    }

    // Слабое чтение — решение принимает эксперт (не родитель), с готовым AI-черновиком.
    await this.routeToExpert(
      session,
      enrollment,
      'low_score',
      session.expertReportDraft || 'Послушайте запись и оцените чтение.',
    );
    const child = await this.childrenService.findById(childId).catch(() => null);
    this.telegram.send(
      'other',
      `📖 <b>Чтение на проверке эксперта</b>\n🧒 ${esc(child?.name ?? 'Ребёнок')} (${esc(childId)}) — часть ${session.partNumber}, оценка ${session.aiScore}/10`,
    );
    return session;
  }

  // ── Пересказ: ребёнок записывает пересказ прочитанного ────────────────────────
  async uploadRetellAudio(
    id: string,
    childId: string,
    file: Express.Multer.File,
    durationSec?: number,
  ): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.childId !== childId) throw new ForbiddenException('Not your session');
    if (session.phase !== SessionPhase.RETELL) {
      throw new BadRequestException('Session is not awaiting retell');
    }

    const audioUrl = await this.filesService.uploadAudio(file, `${id}-retell`);
    session.retellAudioUrl = audioUrl;
    if (durationSec && durationSec > 0) session.retellDurationSec = durationSec;
    session.phase = SessionPhase.RETELL_TRANSCRIBING;
    session.lastError = null;
    const saved = await this.sessionRepo.save(session);

    setImmediate(() => {
      this.transcribeRetell(id, childId).catch((err) => {
        this.logger.error(`Retell processing failed for session ${id}: ${err?.message}`);
        // Пересказ не критичен — не теряем чтение, финализируем его.
        this.finalizeReadingById(id).catch((e) =>
          this.logger.error(`finalizeReading fallback failed ${id}: ${e?.message}`),
        );
      });
    });

    return saved;
  }

  private async transcribeRetell(id: string, childId: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (!session.retellAudioUrl) throw new BadRequestException('No retell audio');

    const parsed = parseStoredFileUrl(session.retellAudioUrl);
    const bucket = parsed?.bucket ?? BUCKET_AUDIO;
    const objectPath = parsed?.key ?? new URL(session.retellAudioUrl).pathname.replace(/^\/+/, '');
    const mimeType = audioMimeFromUrl(session.retellAudioUrl);

    const audioBuffer = await this.filesService.getBuffer(objectPath, bucket);
    const result = await this.aiService.transcribeAudio(audioBuffer, objectPath, mimeType);
    session.retellTranscription = result.text ?? '';
    session.phase = SessionPhase.RETELL_ANALYZING;
    await this.sessionRepo.save(session);
    return this.analyzeRetell(id, childId);
  }

  private async analyzeRetell(id: string, childId: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });
    const referenceText = enrollment?.challenge?.partTexts?.[session.partNumber - 1] ?? '';
    const bookTitle = enrollment?.challenge?.bookTitle ?? '';
    const text = (session.retellTranscription ?? '').trim();

    if (text) {
      try {
        const result = await this.aiService.analyzeRetelling(text, bookTitle, referenceText);
        const raw = Number(result.score ?? 0);
        const normalized = raw > 10 ? raw / 10 : raw; // на случай если модель вернёт 0–100
        session.retellScore = Math.max(0, Math.min(10, Math.round(normalized)));
        session.retellFeedback = result.feedback ?? null;

        // Бонус за пересказ — сразу, отдельной транзакцией (не зависит от исхода чтения).
        const bonus =
          enrollment && enrollment.coinsPerPart > 0
            ? Math.round(enrollment.coinsPerPart * (session.retellScore / 10) * RETELL_BONUS_FRACTION)
            : 0;
        if (bonus > 0) {
          await this.coinsService.transfer({
            fromId: 'system',
            fromType: 'system',
            toId: childId,
            toType: 'child',
            amount: bonus,
            type: CoinTransactionType.EARN,
            referenceId: `session-retell-${id}`,
          });
        }
      } catch (err: any) {
        this.logger.error(`analyzeRetelling failed for ${id}: ${err?.message}`);
        session.retellFeedback = 'Пересказ записан. Оценить автоматически не удалось.';
      }
    } else {
      session.retellFeedback = 'Пересказ не распознан.';
    }

    await this.sessionRepo.save(session);
    return this.finalizeReading(session, enrollment);
  }

  private async finalizeReadingById(id: string): Promise<Session | void> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) return;
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: session.enrollmentId },
      relations: ['challenge'],
    });
    return this.finalizeReading(session, enrollment);
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

  async findEnrollmentsByParent(parentId: string): Promise<any[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { parentId },
      relations: ['challenge', 'child'],
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
          audioUrl: s.audioUrl,
          aiFeedback: s.aiFeedback,
          readingAccuracy: s.readingAccuracy,
          readingCompleteness: s.readingCompleteness,
          readingSpeedWpm: s.readingSpeedWpm,
          errorWords: s.errorWords,
          expertReport: s.expertReport,
          retellAudioUrl: s.retellAudioUrl,
          retellScore: s.retellScore,
          retellFeedback: s.retellFeedback,
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

  async approveReview(id: string, expertId: string, report?: string): Promise<ReviewQueue> {
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
      // Отчёт эксперта (или его AI-черновик) — его увидит родитель.
      item.session.expertReport = (report ?? item.session.expertReportDraft ?? '').trim() || null;
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

      // Пуш родителю: эксперт засчитал чтение ребёнка.
      if (enrollment.parentId) {
        const apChild = await this.childrenService.findById(item.session.childId).catch(() => null);
        void this.push.sendToUser(enrollment.parentId, {
          title: '✅ Чтение засчитано экспертом',
          body: `${apChild?.name ?? 'Ребёнок'} — часть ${item.session.partNumber} проверена экспертом`,
          url: '/parent/cabinet',
          tag: `read-${item.session.childId}`,
        });
      }
    }

    item.resolved = true;
    item.resolvedAt = new Date();
    return this.reviewQueueRepo.save(item);
  }

  async rejectReview(id: string, expertId: string, report?: string): Promise<ReviewQueue> {
    const item = await this.reviewQueueRepo.findOne({ where: { id, expertId }, relations: ['session'] });
    if (!item) throw new NotFoundException('Review item not found');
    if (item.session) {
      item.session.status = SessionStatus.FAILED;
      item.session.expertReport = (report ?? item.session.expertReportDraft ?? '').trim() || null;
      await this.sessionRepo.save(item.session);
    }
    item.resolved = true;
    item.resolvedAt = new Date();
    return this.reviewQueueRepo.save(item);
  }
}
