import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TelegramService } from './telegram.service';
import { TelegramExceptionFilter } from './telegram-exception.filter';

// @Global — TelegramService доступен во всех сервисах без импорта модуля.
@Global()
@Module({
  providers: [
    TelegramService,
    { provide: APP_FILTER, useClass: TelegramExceptionFilter },
  ],
  exports: [TelegramService],
})
export class NotificationsModule {}
