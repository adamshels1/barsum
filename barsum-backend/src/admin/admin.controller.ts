import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { PaymentsService } from '../payments/payments.service';
import { ExpertsService } from '../experts/experts.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ExpertStatus } from '../common/enums';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly paymentsService: PaymentsService,
    private readonly expertsService: ExpertsService,
    private readonly challengesService: ChallengesService,
  ) {}

  private guard(req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin only');
  }

  @Get('stats')
  getStats(@Request() req: any) {
    this.guard(req);
    return this.adminService.getStats();
  }

  @Get('readers-rating')
  getReadersRating(@Request() req: any) {
    this.guard(req);
    return this.adminService.getReadersRating();
  }

  @Get('payments')
  getPayments(@Request() req: any, @Query('status') status?: string) {
    this.guard(req);
    return this.paymentsService.findByStatus(status ?? 'pending');
  }

  @Post('payments/:id/confirm')
  confirmPayment(@Request() req: any, @Param('id') id: string) {
    this.guard(req);
    return this.paymentsService.confirm(id);
  }

  @Post('payments/:id/reject')
  rejectPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('adminNote') adminNote: string,
  ) {
    this.guard(req);
    return this.paymentsService.reject(id, adminNote);
  }

  @Get('experts')
  getExperts(@Request() req: any) {
    this.guard(req);
    return this.expertsService.findByStatus(ExpertStatus.REVIEW);
  }

  @Post('experts/:id/approve')
  approveExpert(@Request() req: any, @Param('id') id: string) {
    this.guard(req);
    return this.expertsService.updateStatus(id, ExpertStatus.APPROVED);
  }

  @Post('experts/:id/reject')
  rejectExpert(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    this.guard(req);
    return this.expertsService.updateStatus(id, ExpertStatus.NEW, reason);
  }

  @Get('challenges')
  getChallenges(@Request() req: any, @Query('status') status?: string) {
    this.guard(req);
    return this.challengesService.findByStatus(status ?? 'moderation');
  }
}
