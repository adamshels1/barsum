import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollabController } from './collab.controller';
import { CollabService } from './collab.service';
import { ChapterContribution } from './entities/chapter-contribution.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { CoinsModule } from '../coins/coins.module';
import { ChildrenModule } from '../children/children.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { FilesModule } from '../files/files.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChapterContribution, Challenge]),
    CoinsModule,
    ChildrenModule,
    UsersModule,
    AiModule,
    FilesModule,
    PushModule,
  ],
  controllers: [CollabController],
  providers: [CollabService],
  exports: [CollabService],
})
export class CollabModule {}
