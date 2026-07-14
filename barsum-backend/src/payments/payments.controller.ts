import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { FilesService } from '../files/files.service';
import { Challenge } from '../challenges/entities/challenge.entity';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly filesService: FilesService,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
  ) {}

  @Post()
  async create(
    @Request() req: any,
    @Body()
    body: {
      childId: string;
      challengeId: string;
      coinsAmount: number;
    },
  ) {
    const challenge = await this.challengeRepo.findOne({ where: { id: body.challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return this.paymentsService.create({
      ...body,
      parentId: req.user.sub,
      challengePrice: challenge.price,
    });
  }

  // Черновик оплаты — создаётся при клике «Оплатить через Kaspi» (до перехода в Kaspi).
  @Post('intent')
  async createIntent(
    @Request() req: any,
    @Body() body: { childId: string; challengeId: string; coinsAmount: number },
  ) {
    const challenge = await this.challengeRepo.findOne({ where: { id: body.challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return this.paymentsService.createIntent({
      ...body,
      parentId: req.user.sub,
      challengePrice: challenge.price,
    });
  }

  // Родитель подтверждает свой незавершённый платёж («Я оплатил» / кабинет).
  @Post(':id/confirm')
  confirmMine(@Request() req: any, @Param('id') id: string) {
    return this.paymentsService.confirmByParent(id, req.user.sub);
  }

  // Родитель отменяет свой незавершённый платёж.
  @Post(':id/cancel')
  cancelMine(@Request() req: any, @Param('id') id: string) {
    return this.paymentsService.cancelByParent(id, req.user.sub);
  }

  @Post('own-book')
  async createOwnBook(
    @Request() req: any,
    @Body()
    body: {
      childId: string;
      bookTitle: string;
      amountTg: number;
    },
  ) {
    return this.paymentsService.createOwnBook({
      parentId: req.user.sub,
      childId: body.childId,
      bookTitle: body.bookTitle,
      amountTg: body.amountTg,
    });
  }

  @Post(':id/receipt')
  @UseInterceptors(FileInterceptor('receipt'))
  async uploadReceipt(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadReceipt(file, id);
    return this.paymentsService.uploadReceipt(id, req.user.sub, url);
  }

  @Get()
  list(@Request() req: any) {
    return this.paymentsService.findByParent(req.user.sub);
  }
}
