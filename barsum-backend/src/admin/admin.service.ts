import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ChildrenService } from '../children/children.service';
import { PaymentsService } from '../payments/payments.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ExpertsService } from '../experts/experts.service';
import { PaymentStatus, ChallengeStatus, ExpertStatus } from '../common/enums';

export interface ReaderRatingRow {
  childId: string;
  name: string;
  age: number;
  photoUrl: string | null;
  streak: number;
  parentName: string | null;
  totalSessions: number;
  completedParts: number;
  booksCount: number;
  avgScore: number | null;
  avgAccuracy: number | null;
  totalCoinsEarned: number;
  lastActivityAt: string | null;
}

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private childrenService: ChildrenService,
    private paymentsService: PaymentsService,
    private challengesService: ChallengesService,
    private expertsService: ExpertsService,
    private dataSource: DataSource,
  ) {}

  async getStats() {
    const [
      totalUsers,
      totalChildren,
      totalPayments,
      totalRevenueTg,
      pendingPayments,
      pendingChallenges,
    ] = await Promise.all([
      this.usersService.count(),
      this.childrenService.count(),
      this.paymentsService.countByStatus(PaymentStatus.CONFIRMED),
      this.paymentsService.totalRevenue(),
      this.paymentsService.countByStatus(PaymentStatus.PENDING),
      this.challengesService.countByStatus(ChallengeStatus.MODERATION),
    ]);

    const pendingExperts = await this.expertsService.countByStatus(ExpertStatus.REVIEW);

    return {
      totalUsers,
      totalChildren,
      totalPayments,
      totalRevenueTg,
      pendingPayments,
      pendingExperts,
      pendingChallenges,
    };
  }

  /**
   * Рейтинг читателей: агрегирует по каждому ребёнку метрики чтения
   * (прочитано частей/книг, средний балл AI, точность, серия, монеты)
   * и сортирует по «объёму прочитанного» и качеству.
   */
  async getReadersRating(): Promise<ReaderRatingRow[]> {
    const rows = await this.dataSource.query(
      `SELECT
         c.id AS "childId",
         c.name AS "name",
         c.age AS "age",
         c."photoUrl" AS "photoUrl",
         c.streak AS "streak",
         u.name AS "parentName",
         COALESCE(s.total_sessions, 0) AS "totalSessions",
         COALESCE(s.completed_parts, 0) AS "completedParts",
         COALESCE(s.books_count, 0) AS "booksCount",
         s.avg_score AS "avgScore",
         s.avg_accuracy AS "avgAccuracy",
         s.last_activity AS "lastActivityAt",
         COALESCE(co.earned, 0) AS "totalCoinsEarned"
       FROM children c
       LEFT JOIN users u ON u.id = c."parentId"
       LEFT JOIN (
         SELECT
           ss."childId" AS child_id,
           COUNT(*) AS total_sessions,
           COUNT(*) FILTER (WHERE ss.status = 'completed') AS completed_parts,
           COUNT(DISTINCT e."challengeId") AS books_count,
           AVG(ss."aiScore") FILTER (WHERE ss."aiScore" IS NOT NULL) AS avg_score,
           AVG(ss."readingAccuracy") FILTER (WHERE ss."readingAccuracy" IS NOT NULL) AS avg_accuracy,
           MAX(ss."createdAt") AS last_activity
         FROM sessions ss
         LEFT JOIN challenge_enrollments e ON e.id = ss."enrollmentId"
         GROUP BY ss."childId"
       ) s ON s.child_id = c.id
       LEFT JOIN (
         SELECT "toId" AS child_id, SUM(amount) AS earned
         FROM coin_transactions
         WHERE "toType" = 'child' AND status = 'confirmed' AND type = 'earn'
         GROUP BY "toId"
       ) co ON co.child_id = c.id::text
       ORDER BY "completedParts" DESC, "avgScore" DESC NULLS LAST, "totalCoinsEarned" DESC`,
    );

    return rows.map((r: any) => ({
      childId: r.childId,
      name: r.name,
      age: Number(r.age),
      photoUrl: r.photoUrl ?? null,
      streak: Number(r.streak ?? 0),
      parentName: r.parentName ?? null,
      totalSessions: Number(r.totalSessions ?? 0),
      completedParts: Number(r.completedParts ?? 0),
      booksCount: Number(r.booksCount ?? 0),
      avgScore: r.avgScore != null ? Math.round(Number(r.avgScore) * 10) / 10 : null,
      avgAccuracy: r.avgAccuracy != null ? Math.round(Number(r.avgAccuracy)) : null,
      totalCoinsEarned: Number(r.totalCoinsEarned ?? 0),
      lastActivityAt: r.lastActivityAt
        ? new Date(r.lastActivityAt).toISOString()
        : null,
    }));
  }
}
