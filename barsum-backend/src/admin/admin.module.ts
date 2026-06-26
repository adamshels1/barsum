import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { ChildrenModule } from '../children/children.module';
import { PaymentsModule } from '../payments/payments.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { ExpertsModule } from '../experts/experts.module';

@Module({
  imports: [UsersModule, ChildrenModule, PaymentsModule, ChallengesModule, ExpertsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
