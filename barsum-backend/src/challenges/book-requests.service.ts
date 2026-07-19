import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookRequest } from './entities/book-request.entity';
import { Challenge } from './entities/challenge.entity';
import { Child } from '../children/entities/child.entity';
import { User } from '../users/entities/user.entity';
import { ChallengeEnrollment } from '../sessions/entities/enrollment.entity';
import { BookRequestStatus, ChallengeStatus } from '../common/enums';
import { TelegramService, esc } from '../notifications/telegram.service';
import { PushService } from '../push/push.service';

@Injectable()
export class BookRequestsService {
  constructor(
    @InjectRepository(BookRequest)
    private requestRepo: Repository<BookRequest>,
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,
    private telegram: TelegramService,
    private push: PushService,
    private dataSource: DataSource,
  ) {}

  async request(challengeId: string, childId: string, parentId: string): Promise<BookRequest> {
    if (!parentId) throw new BadRequestException('No parent linked');

    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId, status: ChallengeStatus.PUBLISHED },
    });
    if (!challenge) throw new NotFoundException('Book not found');

    const enrolled = await this.dataSource.getRepository(ChallengeEnrollment).findOne({
      where: { childId, challengeId },
    });
    if (enrolled) throw new BadRequestException('Book already purchased');

    const existing = await this.requestRepo.findOne({
      where: { childId, challengeId, status: BookRequestStatus.PENDING },
    });
    if (existing) return existing;

    const saved = await this.requestRepo.save(
      this.requestRepo.create({ childId, parentId, challengeId }),
    );

    const [child, parent] = await Promise.all([
      this.dataSource.getRepository(Child).findOne({ where: { id: childId } }).catch(() => null),
      this.dataSource.getRepository(User).findOne({ where: { id: parentId } }).catch(() => null),
    ]);

    this.telegram.send(
      'other',
      `📚 <b>Запрос книги</b>\n` +
        `🧒 Ребёнок: ${esc(child?.name ?? '—')} (${esc(childId)})\n` +
        `Книга: ${esc(challenge.bookTitle || challenge.title)} (${challenge.price} ₸)\n` +
        `👤 Родитель: ${esc(parent?.name ?? '—')} (${esc(parentId)})`,
    );

    // Веб-пуш родителю: ребёнок просит купить книгу.
    void this.push.sendToUser(parentId, {
      title: '📚 Запрос книги',
      body: `${child?.name ?? 'Ребёнок'} просит книгу «${challenge.bookTitle || challenge.title}» (${challenge.price.toLocaleString('ru-RU')} ₸)`,
      url: '/parent/home',
      tag: 'book-request',
    });

    return saved;
  }

  async findByParent(parentId: string): Promise<BookRequest[]> {
    return this.requestRepo.find({
      where: { parentId },
      order: { createdAt: 'DESC' },
      relations: ['challenge', 'child'],
    });
  }

  async findByChild(childId: string): Promise<BookRequest[]> {
    return this.requestRepo.find({
      where: { childId },
      order: { createdAt: 'DESC' },
      relations: ['challenge'],
    });
  }

  async reject(id: string, parentId: string): Promise<BookRequest> {
    const req = await this.requestRepo.findOne({ where: { id, parentId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== BookRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    req.status = BookRequestStatus.REJECTED;
    req.resolvedAt = new Date();
    return this.requestRepo.save(req);
  }
}
