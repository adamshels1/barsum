import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Request,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Request() req: any, @Body() body: { enrollmentId: string }) {
    return this.sessionsService.create(body.enrollmentId, req.user.sub);
  }

  @Get()
  list(@Request() req: any, @Query('childId') childId?: string) {
    if (childId && req.user.role === 'parent') {
      return this.sessionsService.findByChildForParent(childId, req.user.sub);
    }
    return this.sessionsService.findByChild(req.user.sub);
  }

  @Get(':id/text')
  getDayText(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.getDayText(id, req.user.sub);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Post(':id/start-recording')
  startRecording(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.startRecording(id, req.user.sub);
  }

  @Post(':id/upload-audio')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.sessionsService.uploadAudio(id, req.user.sub, file);
  }

  @Post(':id/transcribe')
  transcribe(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.transcribe(id, req.user.sub);
  }

  @Post(':id/analyze')
  analyze(@Request() req: any, @Param('id') id: string, @Body('bookTitle') bookTitle: string) {
    return this.sessionsService.analyze(id, req.user.sub, bookTitle);
  }

  @Post(':id/answer')
  answer(
    @Request() req: any,
    @Param('id') id: string,
    @Body('answers') answers: Record<string, string>,
  ) {
    return this.sessionsService.answer(id, req.user.sub, answers);
  }
}
