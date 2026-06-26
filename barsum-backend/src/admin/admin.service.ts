import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChildrenService } from '../children/children.service';
import { PaymentsService } from '../payments/payments.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ExpertsService } from '../experts/experts.service';
import { PaymentStatus, ChallengeStatus, ExpertStatus } from '../common/enums';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private childrenService: ChildrenService,
    private paymentsService: PaymentsService,
    private challengesService: ChallengesService,
    private expertsService: ExpertsService,
  ) {}

  async getStats() {
    const [
      totalUsers,
      totalChildren,
      totalPayments,
      totalRevenueTg,
      pendingPayments,
      pendingChallenges,
    ] = await Promise.all([
      this.usersService.count(),
      this.childrenService.count(),
      this.paymentsService.countByStatus(PaymentStatus.CONFIRMED),
      this.paymentsService.totalRevenue(),
      this.paymentsService.countByStatus(PaymentStatus.PENDING),
      this.challengesService.countByStatus(ChallengeStatus.MODERATION),
    ]);

    const pendingExperts = await this.expertsService.countByStatus(ExpertStatus.REVIEW);

    return {
      totalUsers,
      totalChildren,
      totalPayments,
      totalRevenueTg,
      pendingPayments,
      pendingExperts,
      pendingChallenges,
    };
  }
}
