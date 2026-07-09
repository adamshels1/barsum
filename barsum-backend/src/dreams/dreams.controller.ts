import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DreamsService } from './dreams.service';
import { FilesService } from '../files/files.service';

@ApiTags('dreams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dreams')
export class DreamsController {
  constructor(
    private readonly dreamsService: DreamsService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  create(@Request() req: any, @Body() body: { name: string }) {
    return this.dreamsService.create(req.user.sub, body);
  }

  @Get('my')
  findMy(@Request() req: any) {
    return this.dreamsService.findMy(req.user.sub);
  }

  @Get('parent/pending')
  findPendingForParent(@Request() req: any) {
    return this.dreamsService.findPendingForParent(req.user.sub);
  }

  @Get('parent/completed')
  findCompletedForParent(@Request() req: any) {
    return this.dreamsService.findCompletedForParent(req.user.sub);
  }

  @Post(':id/fulfill')
  fulfill(@Request() req: any, @Param('id') id: string) {
    return this.dreamsService.fulfill(id, req.user.sub);
  }

  @Post(':id/approve')
  approve(@Request() req: any, @Param('id') id: string, @Body() body: { targetCoins: number }) {
    return this.dreamsService.approve(id, req.user.sub, body.targetCoins);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.dreamsService.reject(id, req.user.sub, body.reason);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadReceipt(file, `dream-${id}`);
    return this.dreamsService.updatePhoto(id, req.user.sub, url);
  }

  @Post('send')
  sendCoins(
    @Request() req: any,
    @Body() body: { amount: number },
  ) {
    return this.dreamsService.sendCoins(req.user.sub, body.amount);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; targetCoins?: number },
  ) {
    return this.dreamsService.update(id, req.user.sub, body);
  }
}
