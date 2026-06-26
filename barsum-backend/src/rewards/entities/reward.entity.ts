import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RewardType } from '../../common/enums';

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  name: string;

  @Column()
  cost: number;

  @Column({ type: 'enum', enum: RewardType, default: RewardType.SNACK })
  type: RewardType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
