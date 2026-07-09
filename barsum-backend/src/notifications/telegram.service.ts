import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Категории соответствуют топикам (message_thread_id) в одной супергруппе Telegram.
export type TelegramTopic = 'registrations' | 'payments' | 'other' | 'errors';

/**
 * Отправка важных событий в Telegram-группу с топиками.
 * Один бот добавлен в супергруппу с включёнными «Темами»; каждая категория
 * событий уходит в свой топик через message_thread_id.
 *
 * Все отправки — fire-and-forget: сбой уведомления НИКОГДА не роняет бизнес-логику.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly enabled: boolean;
  private readonly botToken?: string;
  private readonly chatId?: string;
  private readonly topics: Record<TelegramTopic, number | undefined>;

  // Анти-спам для топика «Баги»: не повторять одинаковую ошибку чаще раза в минуту
  // и не слать больше ERROR_MAX_PER_MIN сообщений в минуту (иначе один зациклившийся
  // баг зальёт весь чат).
  private static readonly ERROR_DEDUP_MS = 60_000;
  private static readonly ERROR_MAX_PER_MIN = 12;
  private readonly recentErrors = new Map<string, number>();
  private errorWindowStart = 0;
  private errorCountInWindow = 0;

  constructor(private readonly config: ConfigService) {
    this.enabled = this.config.get<string>('TELEGRAM_ENABLED') === 'true';
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    this.topics = {
      registrations: this.parseTopic('TELEGRAM_TOPIC_REGISTRATIONS'),
      payments: this.parseTopic('TELEGRAM_TOPIC_PAYMENTS'),
      other: this.parseTopic('TELEGRAM_TOPIC_OTHER'),
      errors: this.parseTopic('TELEGRAM_TOPIC_ERRORS'),
    };
  }

  private parseTopic(key: string): number | undefined {
    const raw = this.config.get<string>(key);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }

  /** Отправить сообщение в топик. Не бросает исключений. */
  send(topic: TelegramTopic, text: string): void {
    if (topic === 'errors' && this.throttleError(text)) return;
    void this.deliver(topic, text).catch((e) =>
      this.logger.warn(`Telegram send failed (${topic}): ${e?.message ?? e}`),
    );
  }

  // true — если ошибку нужно подавить (дубликат или превышен лимит в минуту).
  private throttleError(text: string): boolean {
    const now = Date.now();
    const sig = text.slice(0, 200);

    const last = this.recentErrors.get(sig);
    if (last && now - last < TelegramService.ERROR_DEDUP_MS) return true;
    this.recentErrors.set(sig, now);
    // подчищаем старые сигнатуры, чтобы Map не рос бесконечно
    if (this.recentErrors.size > 200) {
      for (const [k, t] of this.recentErrors) {
        if (now - t > TelegramService.ERROR_DEDUP_MS) this.recentErrors.delete(k);
      }
    }

    if (now - this.errorWindowStart > 60_000) {
      this.errorWindowStart = now;
      this.errorCountInWindow = 0;
    }
    this.errorCountInWindow++;
    if (this.errorCountInWindow === TelegramService.ERROR_MAX_PER_MIN + 1) {
      // один раз предупреждаем, что дальше подавляем
      void this.deliver(
        'errors',
        '🚫 <b>Слишком много ошибок</b> — дальнейшие подавлены до конца минуты',
      ).catch(() => undefined);
    }
    return this.errorCountInWindow > TelegramService.ERROR_MAX_PER_MIN;
  }

  private async deliver(topic: TelegramTopic, text: string): Promise<void> {
    if (!this.enabled) return;
    if (!this.botToken || !this.chatId) {
      this.logger.warn('Telegram not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID missing)');
      return;
    }

    const body: Record<string, unknown> = {
      chat_id: this.chatId,
      text: this.truncate(text),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    const threadId = this.topics[topic];
    if (threadId != null) body.message_thread_id = threadId;

    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${detail}`);
    }
  }

  private truncate(text: string): string {
    return text.length > 4000 ? text.substring(0, 3997) + '...' : text;
  }
}

/** Экранирование для parse_mode=HTML. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
