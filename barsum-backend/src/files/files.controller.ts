import { Controller, Post, Param, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('audio/:sessionId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Param('sessionId') sessionId: string,
  ) {
    return this.filesService.uploadAudio(file, sessionId);
  }
}
