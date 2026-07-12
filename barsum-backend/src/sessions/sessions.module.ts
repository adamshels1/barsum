import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { PublicSessionsController } from './public-sessions.controller';
import { EnrollmentsController } from './enrollments.controller';
import { ReviewQueueController } from './review-queue.controller';
import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';
import { ChallengeEnrollment } from './entities/enrollment.entity';
import { ReviewQueue } from './entities/review-queue.entity';
import { CoinsModule } from '../coins/coins.module';
import { ChildrenModule } from '../children/children.module';
import { AiModule } from '../ai/ai.module';
import { FilesModule } from '../files/files.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, ChallengeEnrollment, ReviewQueue]),
    CoinsModule,
    ChildrenModule,
    AiModule,
    FilesModule,
    PushModule,
  ],
  controllers: [SessionsController, PublicSessionsController, EnrollmentsController, ReviewQueueController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
