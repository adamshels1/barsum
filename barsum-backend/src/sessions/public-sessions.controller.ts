import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SessionsService } from './sessions.service';

// Публичный (без JwtAuthGuard) стриминг аудио сессии. Ссылка кладётся в <audio src>,
// который не может отправить Authorization-заголовок; сами бакеты MinIO и так read-public.
// Отдаём файл через backend по https (barsum.app/api), обходя mixed-content на проде.
@ApiTags('sessions')
@Controller('sessions')
export class PublicSessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id/audio')
  async streamAudio(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, contentType } = await this.sessionsService.getAudio(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Accept-Ranges', 'none');
    res.end(buffer);
  }

  @Get(':id/retell-audio')
  async streamRetellAudio(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, contentType } = await this.sessionsService.getRetellAudio(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Accept-Ranges', 'none');
    res.end(buffer);
  }
}
