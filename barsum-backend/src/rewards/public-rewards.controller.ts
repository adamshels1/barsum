import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RewardsService } from './rewards.service';

// Публичный (без JwtAuthGuard) стриминг фото награды. Ссылка кладётся в <img src>,
// который не может отправить Authorization-заголовок; сам бакет MinIO и так read-public.
// Отдаём файл через backend по https (barsum.app/api), обходя mixed-content на проде.
@ApiTags('rewards')
@Controller('rewards')
export class PublicRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get(':id/photo')
  async streamPhoto(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, contentType } = await this.rewardsService.getPhoto(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  }
}
