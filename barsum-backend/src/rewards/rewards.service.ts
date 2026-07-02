import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { RewardRequest } from './entities/reward-request.entity';
import { CoinsService } from '../coins/coins.service';
import { RewardRequestStatus, RewardType, CoinTransactionType } from '../common/enums';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private rewardRepo: Repository<Reward>,
    @InjectRepository(RewardRequest)
    private requestRepo: Repository<RewardRequest>,
    private coinsService: CoinsService,
  ) {}

  async findAll(parentId: string): Promise<Reward[]> {
    return this.rewardRepo.find({ where: { parentId, isActive: true } });
  }

  async create(parentId: string, dto: { name: string; cost: number; type: RewardType; photoUrl?: string }): Promise<Reward> {
    const reward = this.rewardRepo.create({ ...dto, parentId, isActive: true });
    return this.rewardRepo.save(reward);
  }

  async update(id: string, parentId: string, dto: Partial<Reward>): Promise<Reward> {
    const reward = await this.rewardRepo.findOne({ where: { id, parentId } });
    if (!reward) throw new NotFoundException('Reward not found');
    Object.assign(reward, dto);
    return this.rewardRepo.save(reward);
  }

  async deactivate(id: string, parentId: string): Promise<void> {
    const reward = await this.rewardRepo.findOne({ where: { id, parentId } });
    if (!reward) throw new NotFoundException('Reward not found');
    reward.isActive = false;
    await this.rewardRepo.save(reward);
  }

  async request(rewardId: string, childId: string, parentId: string): Promise<RewardRequest> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId, isActive: true } });
    if (!reward) throw new NotFoundException('Reward not found');

    await this.coinsService.transfer({
      fromId: childId,
      fromType: 'child',
      toId: 'system',
      toType: 'system',
      amount: reward.cost,
      type: CoinTransactionType.REWARD_REQUEST,
      referenceId: `reward-request-${rewardId}-${childId}-${Date.now()}`,
    });

    const req = this.requestRepo.create({
      childId,
      parentId,
      rewardId,
      coinsAmount: reward.cost,
      status: RewardRequestStatus.PENDING,
    });
    return this.requestRepo.save(req);
  }

  async deliver(requestId: string, parentId: string): Promise<RewardRequest> {
    const req = await this.requestRepo.findOne({ where: { id: requestId, parentId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== RewardRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    await this.coinsService.transfer({
      fromId: 'system',
      fromType: 'system',
      toId: parentId,
      toType: 'parent',
      amount: req.coinsAmount,
      type: CoinTransactionType.REWARD_CONFIRM,
      referenceId: `reward-deliver-${requestId}`,
    });

    req.status = RewardRequestStatus.DELIVERED;
    req.resolvedAt = new Date();
    return this.requestRepo.save(req);
  }

  async reject(requestId: string, parentId: string): Promise<RewardRequest> {
    const req = await this.requestRepo.findOne({ where: { id: requestId, parentId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== RewardRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    await this.coinsService.transfer({
      fromId: 'system',
      fromType: 'system',
      toId: req.childId,
      toType: 'child',
      amount: req.coinsAmount,
      type: CoinTransactionType.REWARD_RETURN,
      referenceId: `reward-reject-${requestId}`,
    });

    req.status = RewardRequestStatus.REJECTED;
    req.resolvedAt = new Date();
    return this.requestRepo.save(req);
  }

  async findRequests(parentId: string): Promise<RewardRequest[]> {
    return this.requestRepo.find({
      where: { parentId },
      order: { createdAt: 'DESC' },
      relations: ['reward', 'child'],
    });
  }
}
