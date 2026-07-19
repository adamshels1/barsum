import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookRequestsService } from './book-requests.service';

@ApiTags('book-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('book-requests')
export class BookRequestsController {
  constructor(private readonly bookRequestsService: BookRequestsService) {}

  // Ребёнок просит родителя купить книгу из каталога.
  @Post()
  request(@Request() req: any, @Body('challengeId') challengeId: string) {
    return this.bookRequestsService.request(challengeId, req.user.sub, req.user.parentId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.bookRequestsService.findByParent(req.user.sub);
  }

  @Get('my')
  findMy(@Request() req: any) {
    return this.bookRequestsService.findByChild(req.user.sub);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id') id: string) {
    return this.bookRequestsService.reject(id, req.user.sub);
  }
}
