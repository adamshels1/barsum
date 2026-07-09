import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TelegramService, esc } from './telegram.service';

/**
 * Глобальный фильтр: ловит все исключения, отдаёт стандартный HTTP-ответ и
 * дополнительно шлёт в топик «Баги» только настоящие ошибки (5xx / необработанные).
 * Ожидаемые 4xx (валидация, 401/403/404) в Telegram не спамим.
 */
@Catch()
export class TelegramExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegramExceptionFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly telegram: TelegramService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const method = request?.method;
      const url = request?.url;
      const message = exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : '';

      // Кто дёрнул запрос (если прошёл JWT-guard, req.user проставлен).
      const u = request?.user;
      const actor = u
        ? `👤 ${esc(u.role ?? 'user')}: ${esc(u.email ?? u.login ?? '')} (${esc(u.sub)})\n`
        : '';

      const text =
        `❌ <b>Ошибка ${status}</b>\n` +
        actor +
        `<b>${esc(method)}</b> ${esc(url)}\n` +
        `${esc(message)}` +
        (stack ? `\n<pre>${esc(stack.split('\n').slice(0, 6).join('\n'))}</pre>` : '');

      this.telegram.send('errors', text);
      this.logger.error(`${method} ${url} → ${status}: ${message}`, stack);
    }

    const responseBody =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
