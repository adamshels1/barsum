import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { ChallengeEnrollment } from '../sessions/entities/enrollment.entity';
import { FilesModule } from '../files/files.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Challenge, ChallengeEnrollment]),
    FilesModule,
    CoinsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
