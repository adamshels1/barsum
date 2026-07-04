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

  @Column({ nullable: true, type: 'text' })
  aiFeedback: string;

  @Column({ nullable: true, type: 'text' })
  lastError: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.PENDING })
  status: SessionStatus;

  @CreateDateColumn()
  createdAt: Date;
}
