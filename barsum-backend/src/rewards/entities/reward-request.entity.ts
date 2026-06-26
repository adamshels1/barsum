import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../users/entities/user.entity';
import { Reward } from './reward.entity';
import { RewardRequestStatus } from '../../common/enums';

@Entity('reward_requests')
export class RewardRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  childId: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column()
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  rewardId: string;

  @ManyToOne(() => Reward, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;

  @Column()
  coinsAmount: number;

  @Column({ type: 'enum', enum: RewardRequestStatus, default: RewardRequestStatus.PENDING })
  status: RewardRequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;
}
