import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Child } from '../../children/entities/child.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { PaymentStatus } from '../../common/enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  childId: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column()
  challengeId: string;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @Column({ default: 0 })
  challengePrice: number;

  @Column({ default: 0 })
  coinsAmount: number;

  @Column({ default: 0 })
  coinsTg: number;

  @Column({ default: 0 })
  total: number;

  // Сплит выручки, зафиксированный на момент оплаты (снимок процента эксперта).
  @Column({ default: 0 })
  expertShare: number;

  @Column({ default: 0 })
  platformFee: number;

  @Column({ default: 0 })
  expertCommissionPct: number;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;
}
