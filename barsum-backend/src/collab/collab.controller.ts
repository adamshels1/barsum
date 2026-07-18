import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollabService, Author } from './collab.service';

function authorFromReq(req: any): Author {
  // JWT: role 'child' → children table; 'parent' → users. sub = id.
  const type = req.user.role === 'parent' ? 'parent' : 'child';
  return { type, id: req.user.sub };
}

@ApiTags('collab')
@Controller('collab')
export class CollabController {
  constructor(private readonly collab: CollabService) {}

  // ── Публичный стриминг аудио продолжения (для <audio src>, без заголовка auth) ──
  @Get('contributions/:id/audio')
  async streamAudio(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, contentType } = await this.collab.getContributionAudio(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Accept-Ranges', 'none');
    res.end(buffer);
  }

  // Список открытых для соавторства книг.
  @Get('open')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOpen() {
    return this.collab.findOpenBooks();
  }

  // Мои продолжения (ребёнок/родитель).
  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: any, @Query('challengeId') challengeId?: string) {
    return this.collab.findMine(authorFromReq(req), challengeId);
  }

  // Детали книги (главы, набранные к текущему моменту).
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findBook(@Param('id') id: string) {
    return this.collab.findBook(id);
  }

  // Записать продолжение текущей главы.
  @Post(':id/contributions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('audio'))
  contribute(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('durationSec') durationSec?: string,
  ) {
    const dur = durationSec ? parseInt(durationSec, 10) : undefined;
    return this.collab.createContribution(
      authorFromReq(req),
      id,
      file,
      Number.isFinite(dur as number) ? dur : undefined,
    );
  }

  // Эксперт: продолжения раунда со скорами.
  @Get(':id/contributions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  round(@Request() req: any, @Param('id') id: string, @Query('round') round?: string) {
    return this.collab.findRound(id, req.user.sub, round ? parseInt(round, 10) : undefined);
  }

  // Эксперт: выбрать победителей → следующая глава.
  @Post(':id/select')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  select(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { round?: number; contributionIds: string[]; editedText?: string },
  ) {
    return this.collab.selectWinners(id, req.user.sub, body);
  }

  // Эксперт: открыть/закрыть приём продолжений.
  @Post(':id/round')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  setRound(@Request() req: any, @Param('id') id: string, @Body('open') open: boolean) {
    return this.collab.setRoundOpen(id, req.user.sub, open !== false);
  }

  // Эксперт: завершить книгу → в магазин.
  @Post(':id/complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  complete(@Request() req: any, @Param('id') id: string, @Body('coverImage') coverImage?: string) {
    return this.collab.completeBook(id, req.user.sub, coverImage);
  }
}
