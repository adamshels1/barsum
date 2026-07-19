import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Child } from '../../children/entities/child.entity';
import { User } from '../../users/entities/user.entity';
import { Challenge } from './challenge.entity';
import { BookRequestStatus } from '../../common/enums';

// Запрос ребёнка «купи мне эту книгу»: родитель видит его на главной
// и покупает обычным флоу — при активации enrollment запрос закрывается (purchased).
@Entity('book_requests')
export class BookRequest {
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
  challengeId: string;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @Column({ type: 'enum', enum: BookRequestStatus, default: BookRequestStatus.PENDING })
  status: BookRequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;
}
