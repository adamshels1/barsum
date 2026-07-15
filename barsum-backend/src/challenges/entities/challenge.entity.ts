import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChallengeStatus, ChallengeCategory } from '../../common/enums';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  bookTitle: string;

  @Column()
  bookAuthor: string;

  @Column({ default: 0 })
  pagesTotal: number;

  @Column({ default: 0 })
  pagesPerPart: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'json' })
  partTexts: string[];

  // Название каждой части (например, отдельный рассказ в книге-сборнике).
  // partTitles[i] соответствует partTexts[i]. Показывается ребёнку в ридере.
  @Column({ nullable: true, type: 'json' })
  partTitles: string[];

  @Column({ nullable: true, type: 'json' })
  partImages: string[];

  @Column({ nullable: true })
  coverImage: string;

  @Column()
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'enum', enum: ChallengeCategory, default: ChallengeCategory.READING })
  category: ChallengeCategory;

  @Column({ default: 0 })
  ageMin: number;

  @Column({ default: 99 })
  ageMax: number;

  @Column({ default: 30 })
  totalParts: number;

  @Column({ default: 0 })
  price: number;

  @Column({ default: 0 })
  coinsReward: number;

  // Требовать пересказ после каждой прочитанной части (настраивает эксперт).
  @Column({ default: false })
  retellRequired: boolean;

  @Column({ type: 'enum', enum: ChallengeStatus, default: ChallengeStatus.DRAFT })
  status: ChallengeStatus;

  @Column({ nullable: true })
  rejectedReason: string;

  @Column({ default: 0 })
  membersCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
