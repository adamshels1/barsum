import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@ApiTags('review-queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('review-queue')
export class ReviewQueueController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@Request() req: any) {
    return this.sessionsService.findReviewQueue(req.user.sub);
  }

  @Post(':id/approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.approveReview(id, req.user.sub);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.rejectReview(id, req.user.sub);
  }
}
