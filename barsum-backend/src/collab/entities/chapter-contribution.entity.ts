import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { ContributionStatus } from '../../common/enums';

// Детское/родительское продолжение главы совместной книги.
// Автор ПОЛИМОРФНЫЙ (authorType + authorId, без FK) — по образцу монетного реестра,
// чтобы одинаково поддержать и ребёнка (children), и родителя (users).
@Entity('chapter_contributions')
export class ChapterContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  challengeId: string;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  // Для какой главы это продолжение (= challenge.currentRound на момент записи).
  @Column()
  roundNumber: number;

  // Кто записал: 'child' | 'parent'. Без внешнего ключа — резолвим по типу в сервисе.
  @Column()
  authorType: 'child' | 'parent';

  @Column()
  authorId: string;

  // Имя автора на момент записи (для отображения в списке эксперта и в соавторах).
  @Column({ nullable: true })
  authorName: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true, type: 'int' })
  durationSec: number;

  @Column({ nullable: true, type: 'text' })
  transcription: string;

  // Общий скор-подсказка эксперту (0–10). НЕ авто-решение.
  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  aiScore: number;

  // Разбор по критериям: { relevance, creativity, coherence, language }.
  @Column({ nullable: true, type: 'jsonb' })
  aiScoreBreakdown: {
    relevance: number;
    creativity: number;
    coherence: number;
    language: number;
  };

  @Column({ nullable: true, type: 'text' })
  aiFeedback: string;

  // ИИ отметил недетский контент / персональные данные → прячем из общего показа.
  @Column({ default: false })
  safetyFlag: boolean;

  @Column({ type: 'enum', enum: ContributionStatus, default: ContributionStatus.PENDING })
  status: ContributionStatus;

  // Если эксперт отредактировал выбранный текст перед публикацией главы.
  @Column({ nullable: true, type: 'text' })
  expertEditedText: string;

  @Column({ default: 0 })
  coinsAwarded: number;

  @Column({ default: false })
  isWinner: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;
}
