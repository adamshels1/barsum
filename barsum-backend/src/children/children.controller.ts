import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChildrenService } from './children.service';

@ApiTags('children')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

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
  async getOne(@Param('id') id: string) {
    const child = await this.childrenService.findById(id);
    if (!child) throw new Error('Not found');
    const { password, ...result } = child as any;
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить ребёнка' })
  async update(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string; age?: number; password?: string }) {
    const child = await this.childrenService.update(id, req.user.sub, body);
    const { password, ...result } = child as any;
    return result;
  }
}
