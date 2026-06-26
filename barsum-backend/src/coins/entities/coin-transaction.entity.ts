import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { CoinTransactionType, CoinTransactionStatus } from '../../common/enums';

@Entity('coin_transactions')
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromType: string;

  @Column({ nullable: true })
  fromId: string;

  @Column()
  toType: string;

  @Column({ nullable: true })
  toId: string;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: CoinTransactionType })
  type: CoinTransactionType;

  @Column({ type: 'enum', enum: CoinTransactionStatus, default: CoinTransactionStatus.CONFIRMED })
  status: CoinTransactionStatus;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceType: string;

  @CreateDateColumn()
  createdAt: Date;
}
