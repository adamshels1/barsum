import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoinsService } from './coins.service';

@ApiTags('coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get('parent-balance')
  getParentBalance(@Request() req: any) {
    return this.coinsService.getParentBalance(req.user.sub);
  }

  @Get('child-balance/:childId')
  getChildBalance(@Param('childId') childId: string) {
    return this.coinsService.getChildBalance(childId);
  }

  @Get('transactions')
  getTransactions(@Request() req: any) {
    return this.coinsService.getTransactions(req.user.sub);
  }
}
