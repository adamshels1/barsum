import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RewardsService } from './rewards.service';

@ApiTags('reward-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reward-requests')
export class RewardRequestsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.rewardsService.findRequests(req.user.sub);
  }

  @Get('my')
  findMy(@Request() req: any) {
    return this.rewardsService.findRequestsByChild(req.user.sub);
  }

  @Post(':id/deliver')
  deliver(@Request() req: any, @Param('id') id: string) {
    return this.rewardsService.deliver(id, req.user.sub);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id') id: string) {
    return this.rewardsService.reject(id, req.user.sub);
  }
}
