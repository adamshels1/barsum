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

  // Пригласительная ссылка: родитель пересылает её ребёнку, тот входит одним
  // тапом, без набора логина и пароля. Ручной ввод — главная точка потери:
  // до формы входа доходят почти все дети, внутрь попадает меньшинство.
  // select: false — токен равносилен паролю, и сущность Child уезжает наружу
  // через связи (мечты и запросы с relations: ['child'], списки эксперта).
  // По умолчанию не выбираем, читаем только там, где он действительно нужен.
  @Column({ nullable: true, unique: true, select: false })
  inviteToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  inviteTokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
