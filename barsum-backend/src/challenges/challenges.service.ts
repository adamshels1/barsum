import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeStatus, ChallengeCategory } from '../common/enums';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,
  ) {}

  async findAll(filters?: { category?: string; age?: number }): Promise<Challenge[]> {
    const qb = this.challengeRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.author', 'author')
      .where('c.status = :status', { status: ChallengeStatus.PUBLISHED })
      // «Свои книги» — приватные задания родителя, их не показываем в общем каталоге.
      .andWhere('c.category != :ownBook', { ownBook: ChallengeCategory.OWN_BOOK });
    if (filters?.category) {
      qb.andWhere('c.category = :category', { category: filters.category });
    }
    if (filters?.age) {
      qb.andWhere('c.ageMin <= :age AND c.ageMax >= :age', { age: filters.age });
    }
    return qb.getMany();
  }

  async findById(id: string): Promise<Challenge> {
    const c = await this.challengeRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Challenge not found');
    return c;
  }

  async findByAuthor(authorId: string): Promise<Challenge[]> {
    return this.challengeRepo.find({ where: { authorId } });
  }

  async findBookCatalog(): Promise<
    { title: string; author: string; pages: number; ageMin: number; ageMax: number; coverImage: string | null }[]
  > {
    const challenges = await this.challengeRepo.find({
      where: { status: ChallengeStatus.PUBLISHED, category: ChallengeCategory.READING },
      select: ['bookTitle', 'bookAuthor', 'pagesTotal', 'ageMin', 'ageMax', 'coverImage'],
      order: { bookTitle: 'ASC' },
    });
    const seen = new Set<string>();
    const catalog: { title: string; author: string; pages: number; ageMin: number; ageMax: number; coverImage: string | null }[] = [];
    for (const c of challenges) {
      if (seen.has(c.bookTitle)) continue;
      seen.add(c.bookTitle);
      catalog.push({
        title: c.bookTitle,
        author: c.bookAuthor,
        pages: c.pagesTotal,
        ageMin: c.ageMin,
        ageMax: c.ageMax,
        coverImage: c.coverImage ?? null,
      });
    }
    return catalog;
  }

  async create(
    dto: {
      title: string;
      bookTitle: string;
      bookAuthor: string;
      pagesTotal: number;
      pagesPerPart: number;
      description?: string;
      category?: ChallengeCategory;
      ageMin: number;
      ageMax: number;
      totalParts: number;
      price: number;
      coinsReward: number;
    },
    authorId: string,
    expertStatus: string,
  ): Promise<Challenge> {
    if (expertStatus !== 'approved') {
      throw new ForbiddenException('Only approved experts can create challenges');
    }
    const challenge = this.challengeRepo.create({
      ...dto,
      authorId,
      status: ChallengeStatus.DRAFT,
    });
    return this.challengeRepo.save(challenge);
  }

  async update(id: string, authorId: string, dto: Partial<Challenge>): Promise<Challenge> {
    const c = await this.findById(id);
    if (c.authorId !== authorId) throw new ForbiddenException('Not your challenge');
    if (c.status !== ChallengeStatus.DRAFT) throw new BadRequestException('Can only edit draft');
    Object.assign(c, dto);
    return this.challengeRepo.save(c);
  }

  async submit(id: string, authorId: string): Promise<Challenge> {
    const c = await this.findById(id);
    if (c.authorId !== authorId) throw new ForbiddenException('Not your challenge');
    if (c.status !== ChallengeStatus.DRAFT) throw new BadRequestException('Only draft can be submitted');
    c.status = ChallengeStatus.MODERATION;
    return this.challengeRepo.save(c);
  }

  async approve(id: string, adminRole: string): Promise<Challenge> {
    if (adminRole !== 'admin') throw new ForbiddenException('Admin only');
    const c = await this.findById(id);
    c.status = ChallengeStatus.PUBLISHED;
    return this.challengeRepo.save(c);
  }

  async reject(id: string, adminRole: string, reason: string): Promise<Challenge> {
    if (adminRole !== 'admin') throw new ForbiddenException('Admin only');
    const c = await this.findById(id);
    c.status = ChallengeStatus.REJECTED;
    c.rejectedReason = reason;
    return this.challengeRepo.save(c);
  }

  async incrementMembersCount(id: string): Promise<void> {
    await this.challengeRepo.increment({ id }, 'membersCount', 1);
  }

  async count(): Promise<number> {
    return this.challengeRepo.count();
  }

  async countByStatus(status: ChallengeStatus): Promise<number> {
    return this.challengeRepo.count({ where: { status } });
  }

  async findByStatus(status: string): Promise<Challenge[]> {
    return this.challengeRepo.find({ where: { status: status as ChallengeStatus } });
  }
}
