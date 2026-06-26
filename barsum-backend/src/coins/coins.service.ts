import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { CoinTransactionType, CoinTransactionStatus } from '../common/enums';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(CoinTransaction)
    private txRepo: Repository<CoinTransaction>,
  ) {}

  async getBalance(ownerId: string, ownerType: 'parent' | 'child'): Promise<number> {
    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select(
        'COALESCE(SUM(CASE WHEN tx.toId = :id AND tx.toType = :type THEN tx.amount ELSE 0 END) - SUM(CASE WHEN tx.fromId = :id AND tx.fromType = :type THEN tx.amount ELSE 0 END), 0)',
        'balance',
      )
      .where('tx.status = :status', { status: CoinTransactionStatus.CONFIRMED })
      .setParameter('id', ownerId)
      .setParameter('type', ownerType)
      .getRawOne();
    return Number(result?.balance || 0);
  }

  async transfer(params: {
    fromId: string;
    fromType: string;
    toId: string;
    toType: string;
    amount: number;
    type: CoinTransactionType;
    referenceId?: string;
    referenceType?: string;
  }): Promise<CoinTransaction> {
    if (params.referenceId) {
      const existing = await this.txRepo.findOne({ where: { referenceId: params.referenceId } });
      if (existing) return existing;
    }

    if (params.fromType !== 'system') {
      const balance = await this.getBalance(params.fromId, params.fromType as 'parent' | 'child');
      if (balance < params.amount) {
        throw new BadRequestException('Insufficient balance');
      }
    }

    const tx = this.txRepo.create({
      ...params,
      status: CoinTransactionStatus.CONFIRMED,
    });
    return this.txRepo.save(tx);
  }

  async getParentBalance(parentId: string) {
    const balance = await this.getBalance(parentId, 'parent');
    return { parentId, balance };
  }

  async getChildBalance(childId: string) {
    const balance = await this.getBalance(childId, 'child');
    return { childId, balance };
  }

  async getTransactions(ownerId: string): Promise<CoinTransaction[]> {
    return this.txRepo.find({
      where: [{ fromId: ownerId }, { toId: ownerId }],
      order: { createdAt: 'DESC' },
    });
  }
}
