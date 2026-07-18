import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterContribution } from './entities/chapter-contribution.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { CoinsService } from '../coins/coins.service';
import { ChildrenService } from '../children/children.service';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import {
  FilesService,
  BUCKET_AUDIO,
  parseStoredFileUrl,
  audioMimeFromUrl,
} from '../files/files.service';
import { PushService } from '../push/push.service';
import { ContributionStatus, ChallengeStatus, CoinTransactionType } from '../common/enums';

// Монеты ребёнку за участие (даже если не выбрали) — чтобы возвращался.
const PARTICIPATION_COINS = 50;

export type Author = { type: 'child' | 'parent'; id: string };

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name);

  constructor(
    @InjectRepository(ChapterContribution)
    private contribRepo: Repository<ChapterContribution>,
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,
    private coinsService: CoinsService,
    private childrenService: ChildrenService,
    private usersService: UsersService,
    private aiService: AiService,
    private filesService: FilesService,
    private push: PushService,
  ) {}

  // Список совместных книг, открытых для приёма продолжений (для ребёнка/родителя).
  async findOpenBooks(): Promise<Challenge[]> {
    return this.challengeRepo.find({
      where: {
        collaborative: true,
        collabOpen: true,
        collabCompleted: false,
        status: ChallengeStatus.PUBLISHED,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async findBook(id: string): Promise<Challenge> {
    const c = await this.challengeRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Book not found');
    return c;
  }

  private async resolveAuthorName(author: Author): Promise<string> {
    if (author.type === 'child') {
      const child = await this.childrenService.findById(author.id).catch(() => null);
      return child?.name ?? 'Ребёнок';
    }
    const user = await this.usersService.findById(author.id).catch(() => null);
    return user?.name ?? 'Родитель';
  }

  // Ребёнок/родитель записывает продолжение текущей главы.
  async createContribution(
    author: Author,
    challengeId: string,
    file: Express.Multer.File,
    durationSec?: number,
  ): Promise<ChapterContribution> {
    const challenge = await this.findBook(challengeId);
    if (!challenge.collaborative) throw new BadRequestException('Not a collaborative book');
    if (challenge.collabCompleted) throw new BadRequestException('Book already completed');
    if (!challenge.collabOpen) throw new BadRequestException('Round is closed');

    // Один автор — одно продолжение на раунд (серверная защита, не полагаемся на UI).
    const already = await this.contribRepo.findOne({
      where: {
        challengeId,
        roundNumber: challenge.currentRound,
        authorType: author.type,
        authorId: author.id,
      },
    });
    if (already) {
      throw new BadRequestException('Вы уже добавили продолжение для этой главы');
    }

    const authorName = await this.resolveAuthorName(author);
    const contrib = this.contribRepo.create({
      challengeId,
      roundNumber: challenge.currentRound,
      authorType: author.type,
      authorId: author.id,
      authorName,
      status: ContributionStatus.PENDING,
    });
    const saved = await this.contribRepo.save(contrib);

    const audioUrl = await this.filesService.uploadAudio(file, `collab-${saved.id}`);
    saved.audioUrl = audioUrl;
    if (durationSec && durationSec > 0) saved.durationSec = durationSec;
    await this.contribRepo.save(saved);

    // Транскрибация + ИИ-скоринг — в фоне, как в сессиях чтения.
    setImmediate(() => {
      this.processContribution(saved.id).catch((err) =>
        this.logger.error(`processContribution ${saved.id} failed: ${err?.message}`),
      );
    });

    return saved;
  }

  private async processContribution(id: string): Promise<void> {
    const contrib = await this.contribRepo.findOne({ where: { id } });
    if (!contrib?.audioUrl) return;
    const challenge = await this.challengeRepo.findOne({ where: { id: contrib.challengeId } });

    // Транскрибация аудио (Gemini → Whisper), тот же конвейер, что и чтение.
    const parsed = parseStoredFileUrl(contrib.audioUrl);
    const bucket = parsed?.bucket ?? BUCKET_AUDIO;
    const objectPath = parsed?.key ?? new URL(contrib.audioUrl).pathname.replace(/^\/+/, '');
    const mimeType = audioMimeFromUrl(contrib.audioUrl);
    const audioBuffer = await this.filesService.getBuffer(objectPath, bucket);
    const { text } = await this.aiService.transcribeAudio(audioBuffer, objectPath, mimeType);
    const transcription = text ?? '';

    // Пишем ТОЛЬКО ИИ-поля через точечный update, не трогая status: если пока шла
    // асинхронная обработка эксперт успел выбрать/отклонить продолжение — не затираем
    // его статус (гонка save(entity) перезаписала бы весь объект устаревшим status).
    const aiFields: Partial<ChapterContribution> = { transcription };

    if (transcription.trim()) {
      const texts: string[] = challenge?.partTexts ?? [];
      const previousChapter = texts[texts.length - 1] ?? '';
      try {
        const a = await this.aiService.assessContribution(previousChapter, transcription, contrib.authorType);
        aiFields.aiScore = a.overall;
        aiFields.aiScoreBreakdown = {
          relevance: a.relevance,
          creativity: a.creativity,
          coherence: a.coherence,
          language: a.language,
        };
        aiFields.aiFeedback = a.feedback;
        aiFields.safetyFlag = a.safetyFlag;
      } catch (err: any) {
        this.logger.error(`assessContribution ${id} failed: ${err?.message}`);
        aiFields.aiFeedback = 'Продолжение записано. Оценить автоматически не удалось.';
      }
    } else {
      aiFields.aiFeedback = 'Речь не распозналась — послушайте запись.';
    }

    await this.contribRepo.update({ id }, aiFields);
  }

  // Продолжения раунда — для эксперта (сортировка по скору; safetyFlag отдельно).
  async findRound(
    challengeId: string,
    expertUserId: string,
    round?: number,
  ): Promise<ChapterContribution[]> {
    const challenge = await this.findBook(challengeId);
    if (challenge.authorId !== expertUserId) throw new ForbiddenException('Not your book');
    const roundNumber = round ?? challenge.currentRound;
    const list = await this.contribRepo.find({
      where: { challengeId, roundNumber },
      order: { aiScore: 'DESC', createdAt: 'ASC' },
    });
    return list;
  }

  // Мои продолжения (для мотивирующего экрана ребёнка/родителя).
  async findMine(author: Author, challengeId?: string): Promise<ChapterContribution[]> {
    const where: any = { authorType: author.type, authorId: author.id };
    if (challengeId) where.challengeId = challengeId;
    return this.contribRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // Эксперт выбирает победителей раунда → выбранное становится следующей главой.
  async selectWinners(
    challengeId: string,
    expertUserId: string,
    params: { round?: number; contributionIds: string[]; editedText?: string },
  ): Promise<Challenge> {
    const challenge = await this.findBook(challengeId);
    if (challenge.authorId !== expertUserId) throw new ForbiddenException('Not your book');
    if (challenge.collabCompleted) throw new BadRequestException('Book already completed');

    const roundNumber = params.round ?? challenge.currentRound;
    const winnerIds = new Set(params.contributionIds ?? []);
    if (winnerIds.size === 0) throw new BadRequestException('Select at least one contribution');

    const roundContribs = await this.contribRepo.find({ where: { challengeId, roundNumber } });
    const winners = roundContribs.filter((c) => winnerIds.has(c.id));
    if (winners.length === 0) throw new BadRequestException('No matching contributions in round');

    // Текст новой главы: правка эксперта, иначе — тексты выбранных через перенос строки.
    const chapterText =
      (params.editedText && params.editedText.trim()) ||
      winners.map((w) => (w.expertEditedText || w.transcription || '').trim()).filter(Boolean).join('\n\n');

    // Дописываем главу в книгу (partTexts/partTitles), переиспользуя обычную структуру.
    const partTexts = [...(challenge.partTexts ?? [])];
    const partTitles = [...(challenge.partTitles ?? [])];
    partTexts.push(chapterText);
    partTitles.push(`Глава ${partTexts.length}`);
    challenge.partTexts = partTexts;
    challenge.partTitles = partTitles;
    challenge.totalParts = partTexts.length;

    const coAuthors = [...(challenge.coAuthors ?? [])];

    // Победители.
    for (const w of winners) {
      w.status = ContributionStatus.SELECTED;
      w.isWinner = true;
      w.resolvedAt = new Date();
      if (params.editedText && params.editedText.trim()) w.expertEditedText = params.editedText.trim();

      // Монеты — только ребёнку. Родитель получает статус соавтора.
      if (w.authorType === 'child') {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: w.authorId,
          toType: 'child',
          amount: challenge.winnerCoins,
          type: CoinTransactionType.EARN,
          referenceType: 'collab_win',
          referenceId: `collab-win-${w.id}`,
        });
        w.coinsAwarded = challenge.winnerCoins;
        await this.childrenService.incrementStreak(w.authorId).catch(() => {});
      }

      if (!coAuthors.some((a) => a.type === w.authorType && a.id === w.authorId)) {
        coAuthors.push({ type: w.authorType, id: w.authorId, name: w.authorName });
      }

      void this.notifyAuthor(w, true, challenge.bookTitle);
    }
    challenge.coAuthors = coAuthors;

    // Остальные продолжения раунда — участие.
    const losers = roundContribs.filter((c) => !winnerIds.has(c.id) && c.status === ContributionStatus.PENDING);
    for (const l of losers) {
      l.status = ContributionStatus.NOT_SELECTED;
      l.resolvedAt = new Date();
      if (l.authorType === 'child') {
        await this.coinsService.transfer({
          fromId: 'system',
          fromType: 'system',
          toId: l.authorId,
          toType: 'child',
          amount: PARTICIPATION_COINS,
          type: CoinTransactionType.EARN,
          referenceType: 'collab_participation',
          referenceId: `collab-part-${l.id}`,
        });
        l.coinsAwarded = PARTICIPATION_COINS;
      }
      void this.notifyAuthor(l, false, challenge.bookTitle);
    }

    await this.contribRepo.save([...winners, ...losers]);

    // Следующий раунд.
    challenge.currentRound = roundNumber + 1;
    return this.challengeRepo.save(challenge);
  }

  // Пуш автору. Дети обычно без подписки — best-effort, ошибки глушим.
  private async notifyAuthor(c: ChapterContribution, won: boolean, bookTitle: string): Promise<void> {
    const title = won ? '🎉 Твоё продолжение выбрали!' : '✍️ Новая глава — попробуй ещё!';
    const body = won
      ? `Ты соавтор книги «${bookTitle}»!`
      : `Продолжение к «${bookTitle}» — придумай для следующей главы`;
    const url = c.authorType === 'parent' ? '/parent/collab' : '/child/collab';
    void this.push.sendToUser(c.authorId, { title, body, url, tag: `collab-${c.challengeId}` }).catch(() => {});
  }

  // Эксперт открывает/закрывает приём продолжений.
  async setRoundOpen(challengeId: string, expertUserId: string, open: boolean): Promise<Challenge> {
    const challenge = await this.findBook(challengeId);
    if (challenge.authorId !== expertUserId) throw new ForbiddenException('Not your book');
    challenge.collabOpen = open;
    return this.challengeRepo.save(challenge);
  }

  // Эксперт завершает книгу → доступна в магазине как читаемая.
  async completeBook(
    challengeId: string,
    expertUserId: string,
    coverImage?: string,
  ): Promise<Challenge> {
    const challenge = await this.findBook(challengeId);
    if (challenge.authorId !== expertUserId) throw new ForbiddenException('Not your book');
    challenge.collabCompleted = true;
    challenge.collabOpen = false;
    challenge.totalParts = (challenge.partTexts ?? []).length;
    if (coverImage) challenge.coverImage = coverImage;
    return this.challengeRepo.save(challenge);
  }

  // Публичная отдача аудио продолжения через backend (mixed-content на проде).
  async getContributionAudio(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const c = await this.contribRepo.findOne({ where: { id } });
    if (!c?.audioUrl) throw new NotFoundException('Audio not found');
    const parsed = parseStoredFileUrl(c.audioUrl);
    if (!parsed) throw new NotFoundException('Audio not found');
    const buffer = await this.filesService.getBuffer(parsed.key, parsed.bucket);
    return { buffer, contentType: audioMimeFromUrl(c.audioUrl) };
  }
}
