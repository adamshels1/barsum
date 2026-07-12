import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpertsService } from './experts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpertStatus } from '../common/enums';

@ApiTags('experts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('experts')
export class ExpertsController {
  constructor(private readonly expertsService: ExpertsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Профиль эксперта' })
  getMe(@Request() req: any) {
    return this.expertsService.findByUserId(req.user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Статистика эксперта' })
  getMyStats(@Request() req: any) {
    return this.expertsService.getStats(req.user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль эксперта' })
  updateMe(@Request() req: any, @Body() body: { specialization?: string; bio?: string; whatsapp?: string }) {
    return this.expertsService.updateProfile(req.user.sub, body);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Подать заявку' })
  apply(@Request() req: any) {
    return this.expertsService.apply(req.user.sub);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Одобрить эксперта (admin)' })
  approve(@Param('id') id: string) {
    return this.expertsService.updateStatus(id, ExpertStatus.APPROVED);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Отклонить эксперта (admin)' })
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.expertsService.updateStatus(id, ExpertStatus.NEW, body.reason);
  }
}
