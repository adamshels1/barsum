import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { BookRequestsController } from './book-requests.controller';
import { BookRequestsService } from './book-requests.service';
import { Challenge } from './entities/challenge.entity';
import { BookRequest } from './entities/book-request.entity';
import { PushModule } from '../push/push.module';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, BookRequest]), PushModule],
  controllers: [ChallengesController, BookRequestsController],
  providers: [ChallengesService, BookRequestsService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
