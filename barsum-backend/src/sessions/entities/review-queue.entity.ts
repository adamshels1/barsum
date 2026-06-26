import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Session } from './session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('review_queue')
export class ReviewQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column({ default: false })
  resolved: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
