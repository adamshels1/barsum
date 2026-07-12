import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';

@ApiTags('push')
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('public-key')
  @ApiOperation({ summary: 'VAPID public key для подписки' })
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Сохранить push-подписку текущего пользователя' })
  subscribe(
    @Request() req: any,
    @Body() sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.pushService.subscribe(req.user.sub, sub).then(() => ({ ok: true }));
  }

  @Post('unsubscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить push-подписку' })
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.pushService.unsubscribe(body.endpoint).then(() => ({ ok: true }));
  }

  @Post('test')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Отправить себе тестовый пуш' })
  test(@Request() req: any) {
    return this.pushService
      .sendToUser(req.user.sub, {
        title: '🔔 Уведомления включены',
        body: 'Будем сообщать, когда ребёнок просит награду или заканчивает чтение.',
        url: '/parent/cabinet',
        tag: 'welcome',
      })
      .then(() => ({ ok: true }));
  }
}
