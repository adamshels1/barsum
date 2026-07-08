import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DreamsController } from './dreams.controller';
import { PublicDreamsController } from './public-dreams.controller';
import { DreamsService } from './dreams.service';
import { Dream } from './entities/dream.entity';
import { Child } from '../children/entities/child.entity';
import { FilesModule } from '../files/files.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [TypeOrmModule.forFeature([Dream, Child]), FilesModule, CoinsModule],
  controllers: [DreamsController, PublicDreamsController],
  providers: [DreamsService],
  exports: [DreamsService],
})
export class DreamsModule {}
