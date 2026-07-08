import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { PublicRewardsController } from './public-rewards.controller';
import { RewardRequestsController } from './reward-requests.controller';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';
import { RewardRequest } from './entities/reward-request.entity';
import { CoinsModule } from '../coins/coins.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, RewardRequest]), CoinsModule, FilesModule],
  controllers: [RewardsController, PublicRewardsController, RewardRequestsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
