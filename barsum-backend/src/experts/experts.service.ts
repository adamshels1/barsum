import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expert } from './entities/expert.entity';
import { ExpertStatus } from '../common/enums';
import { TelegramService, esc } from '../notifications/telegram.service';

@Injectable()
export class ExpertsService {
  constructor(
    @InjectRepository(Expert)
    private expertRepo: Repository<Expert>,
    private telegram: TelegramService,
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
    const expert = await this.expertRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!expert) throw new NotFoundException('Expert not found');
    expert.status = ExpertStatus.REVIEW;

    // Уведомляем команду в Telegram: поступила заявка эксперта на модерацию.
    const lines = [
      '📝 <b>Заявка эксперта на рассмотрение</b>',
      `Имя: ${esc(expert.user?.name)}`,
      `Email: ${esc(expert.user?.email)}`,
      expert.whatsapp ? `WhatsApp: ${esc(expert.whatsapp)}` : null,
      expert.specialization ? `Специализация: ${esc(expert.specialization)}` : null,
      expert.bio ? `О себе: ${esc(expert.bio)}` : null,
      `🆔 ${esc(expert.id)}`,
    ].filter(Boolean);
    this.telegram.send('registrations', lines.join('\n'));

    // Не возвращаем связанного user (в нём хэш пароля) — сохраняем и отдаём чистого эксперта.
    delete (expert as any).user;
    return this.expertRepo.save(expert);
  }

  async updateProfile(userId: string, dto: { specialization?: string; bio?: string; whatsapp?: string }): Promise<Expert> {
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
