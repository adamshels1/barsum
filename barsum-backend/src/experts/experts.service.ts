import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expert } from './entities/expert.entity';
import { ExpertStatus } from '../common/enums';

@Injectable()
export class ExpertsService {
  constructor(
    @InjectRepository(Expert)
    private expertRepo: Repository<Expert>,
  ) {}

  async findById(id: string): Promise<Expert | null> {
    return this.expertRepo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Expert | null> {
    return this.expertRepo.findOne({ where: { userId } });
  }

  async createForUser(userId: string): Promise<Expert> {
    const expert = this.expertRepo.create({ userId, status: ExpertStatus.NEW });
    return this.expertRepo.save(expert);
  }

  async updateStatus(id: string, status: ExpertStatus, rejectedReason?: string): Promise<Expert> {
    const expert = await this.findById(id);
    if (!expert) throw new NotFoundException('Expert not found');
    expert.status = status;
    if (rejectedReason) expert.rejectedReason = rejectedReason;
    return this.expertRepo.save(expert);
  }

  async apply(userId: string): Promise<Expert> {
    const expert = await this.findByUserId(userId);
    if (!expert) throw new NotFoundException('Expert not found');
    expert.status = ExpertStatus.REVIEW;
    return this.expertRepo.save(expert);
  }

  async updateProfile(userId: string, dto: { specialization?: string; bio?: string }): Promise<Expert> {
    const expert = await this.findByUserId(userId);
    if (!expert) throw new NotFoundException('Expert not found');
    Object.assign(expert, dto);
    return this.expertRepo.save(expert);
  }

  async count(): Promise<number> {
    return this.expertRepo.count();
  }

  async countByStatus(status: ExpertStatus): Promise<number> {
    return this.expertRepo.count({ where: { status } });
  }

  async findByStatus(status: ExpertStatus): Promise<Expert[]> {
    return this.expertRepo.find({ where: { status } });
  }

  async findAllByStatus(status: ExpertStatus): Promise<Expert[]> {
    return this.expertRepo.find({ where: { status } });
  }

  async getStats(userId: string): Promise<{ challenges: number; students: number; revenueTg: number }> {
    const result = await this.expertRepo.manager.query(
      `SELECT
        COUNT(DISTINCT c.id)::int AS challenges,
        COUNT(DISTINCT e.id)::int AS students,
        COALESCE(SUM(p."coinsTg"), 0)::int AS "revenueTg"
       FROM challenges c
       LEFT JOIN challenge_enrollments e ON e."challengeId" = c.id
       LEFT JOIN payments p ON p."challengeId" = c.id AND p.status = 'confirmed'
       WHERE c."authorId" = $1`,
      [userId],
    );
    const row = result[0] || { challenges: 0, students: 0, revenueTg: 0 };
    return {
      challenges: Number(row.challenges),
      students: Number(row.students),
      revenueTg: Number(row.revenueTg),
    };
  }
}
