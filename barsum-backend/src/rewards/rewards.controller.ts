import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RewardsService } from './rewards.service';
import { FilesService } from '../files/files.service';
import { RewardType } from '../common/enums';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    return this.rewardsService.findAll(req.user.sub);
  }

  @Get('for-child')
  findForChild(@Request() req: any) {
    const parentId = req.user.parentId;
    if (!parentId) return [];
    return this.rewardsService.findAll(parentId);
  }

  @Post()
  create(@Request() req: any, @Body() body: { name: string; cost: number; type: RewardType; photoUrl?: string }) {
    return this.rewardsService.create(req.user.sub, body);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadReward(file, id);
    return this.rewardsService.update(id, req.user.sub, { photoUrl: url });
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.rewardsService.update(id, req.user.sub, body);
  }

  @Delete(':id')
  deactivate(@Request() req: any, @Param('id') id: string) {
    return this.rewardsService.deactivate(id, req.user.sub);
  }

  @Post(':id/request')
  request(
    @Request() req: any,
    @Param('id') rewardId: string,
  ) {
    const parentId = req.user.parentId;
    return this.rewardsService.request(rewardId, req.user.sub, parentId);
  }
}
