import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Child } from '../../children/entities/child.entity';
import { DreamStatus } from '../../common/enums';

@Entity('dreams')
export class Dream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  childId: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column({ nullable: true })
  parentId: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  targetCoins: number;

  @Column({ default: 0 })
  savedCoins: number;

  @Column({ nullable: true, type: 'text' })
  photoUrl: string;

  @Column({ nullable: true, type: 'text' })
  rejectedReason: string;

  @Column({ type: 'enum', enum: DreamStatus, default: DreamStatus.PENDING_APPROVAL })
  status: DreamStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
