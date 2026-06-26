import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { CoinTransaction } from './entities/coin-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoinTransaction])],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
