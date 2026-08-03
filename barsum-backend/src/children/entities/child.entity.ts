import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('children')
export class Child {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  login: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column()
  age: number;

  @Column()
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column({ default: 0 })
  streak: number;

  @Column({ nullable: true })
  photoUrl: string | null;

  // Когда ребёнок прошёл (или пропустил) первый онбординг. null → показываем
  // онбординг при входе. Флаг серверный, а не в localStorage: иначе на новом
  // устройстве / в переустановленной PWA онбординг начнётся заново.
  @Column({ nullable: true, type: 'timestamp' })
  onboardedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
