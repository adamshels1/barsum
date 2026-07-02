import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('age') age?: string) {
    return this.challengesService.findAll({ category, age: age ? parseInt(age) : undefined });
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMy(@Request() req: any) {
    return this.challengesService.findByAuthor(req.user.sub);
  }

  @Get('books/catalog')
  findBookCatalog() {
    return this.challengesService.findBookCatalog();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() body: any) {
    return this.challengesService.create(body, req.user.sub, req.user.expertStatus);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.challengesService.update(id, req.user.sub, body);
  }

  @Post(':id/submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  submit(@Request() req: any, @Param('id') id: string) {
    return this.challengesService.submit(id, req.user.sub);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  approve(@Request() req: any, @Param('id') id: string) {
    return this.challengesService.approve(id, req.user.role);
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  reject(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
    return this.challengesService.reject(id, req.user.role, reason);
  }
}
