import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChildrenService } from './children.service';
import { FilesService } from '../files/files.service';
import { decryptChildPassword, isBcryptHash } from '../common/child-password.util';

@ApiTags('children')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать ребёнка' })
  async create(@Request() req: any, @Body() body: { name: string; age: number; login: string; password: string }) {
    const child = await this.childrenService.create({ ...body, parentId: req.user.sub });
    const { password, ...result } = child as any;
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Список детей родителя' })
  async list(@Request() req: any) {
    const children = await this.childrenService.findByParentId(req.user.sub);
    return children.map(({ password, ...c }: any) => c);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Статистика ребёнка' })
  async getStats(@Param('id') id: string) {
    return this.childrenService.getStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Профиль ребёнка' })
  async getOne(@Request() req: any, @Param('id') id: string) {
    const child = await this.childrenService.findById(id);
    if (!child) throw new NotFoundException('Not found');
    const { password, ...result } = child as any;
    const isOwner = req.user.role === 'parent' && child.parentId === req.user.sub;
    // Отдаём расшифрованный пароль владельцу-родителю, чтобы он мог посмотреть
    // его позже (если забыл). Для старых аккаунтов с bcrypt-хэшем это невозможно.
    if (isOwner && !isBcryptHash(password)) {
      return { ...result, password: decryptChildPassword(password) };
    }
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить ребёнка' })
  async update(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string; age?: number; login?: string; password?: string }) {
    const child = await this.childrenService.update(id, req.user.sub, body);
    const { password, ...result } = child as any;
    return result;
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Загрузить фото ребёнка' })
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadAvatar(file, id);
    const child = await this.childrenService.update(id, req.user.sub, { photoUrl: url });
    const { password, ...result } = child as any;
    return result;
  }
}
