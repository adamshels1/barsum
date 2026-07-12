import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChallengeEnrollment } from './enrollment.entity';
import { Child } from '../../children/entities/child.entity';
import { SessionPhase, SessionStatus } from '../../common/enums';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  enrollmentId: string;

  @ManyToOne(() => ChallengeEnrollment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: ChallengeEnrollment;

  @Column()
  childId: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column({ default: 1 })
  partNumber: number;

  @Column({ type: 'enum', enum: SessionPhase, default: SessionPhase.READ })
  phase: SessionPhase;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true, type: 'text' })
  transcription: string;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  aiScore: number;

  @Column({ nullable: true, type: 'jsonb' })
  aiQuestions: string[];

  @Column({ nullable: true, type: 'jsonb' })
  aiAnswers: object;

  @Column({ nullable: true, type: 'int' })
  readingAccuracy: number;

  @Column({ nullable: true, type: 'int' })
  readingCompleteness: number;

  @Column({ nullable: true, type: 'int' })
  readingSpeedWpm: number;

  @Column({ nullable: true, type: 'jsonb' })
  errorWords: string[];

  @Column({ nullable: true, type: 'int' })
  audioDurationSec: number;

  @Column({ nullable: true, type: 'text' })
  aiFeedback: string;

  // ── Пересказ (retelling): ребёнок своими словами рассказывает прочитанное ──
  @Column({ nullable: true })
  retellAudioUrl: string;

  @Column({ nullable: true, type: 'int' })
  retellDurationSec: number;

  @Column({ nullable: true, type: 'text' })
  retellTranscription: string;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  retellScore: number;

  @Column({ nullable: true, type: 'text' })
  retellFeedback: string;

  // Причина, по которой сессия ушла эксперту: 'low_score' | 'no_speech' | 'ai_error'
  @Column({ nullable: true, type: 'varchar' })
  reviewReason: string;

  // AI-черновик отчёта — предзаполняет поле эксперта, чтобы не писал с нуля
  @Column({ nullable: true, type: 'text' })
  expertReportDraft: string;

  // Финальный отчёт эксперта — его видит родитель, когда AI не справился
  @Column({ nullable: true, type: 'text' })
  expertReport: string;

  @Column({ nullable: true, type: 'text' })
  lastError: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.PENDING })
  status: SessionStatus;

  @CreateDateColumn()
  createdAt: Date;
}
