import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DreamsService } from './dreams.service';

// Публичный (без JwtAuthGuard) стриминг фото мечты. Ссылка кладётся в <img src>,
// который не может отправить Authorization-заголовок; сам бакет MinIO и так read-public.
// Отдаём файл через backend по https (barsum.app/api), обходя mixed-content на проде.
@ApiTags('dreams')
@Controller('dreams')
export class PublicDreamsController {
  constructor(private readonly dreamsService: DreamsService) {}

  @Get(':id/photo')
  async streamPhoto(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, contentType } = await this.dreamsService.getPhoto(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  }
}
