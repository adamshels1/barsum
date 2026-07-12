import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  url?: string; // куда вести по клику
  tag?: string; // группировка/замена уведомлений
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;
  private publicKey = '';

  constructor(
    @InjectRepository(PushSubscription)
    private subRepo: Repository<PushSubscription>,
    config: ConfigService,
  ) {
    this.publicKey = config.get<string>('VAPID_PUBLIC_KEY', '');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY', '');
    const subject = config.get<string>('VAPID_SUBJECT', 'https://barsum.app');
    if (this.publicKey && privateKey) {
      webpush.setVapidDetails(subject, this.publicKey, privateKey);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID ключи не заданы — веб-пуши отключены.');
    }
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Сохраняем подписку (idempotent по endpoint).
  async subscribe(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void> {
    const existing = await this.subRepo.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = sub.keys.p256dh;
      existing.auth = sub.keys.auth;
      await this.subRepo.save(existing);
      return;
    }
    await this.subRepo.save(
      this.subRepo.create({
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      }),
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subRepo.delete({ endpoint });
  }

  // Шлём пуш всем подпискам пользователя. Мёртвые подписки (404/410) удаляем.
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;
    const subs = await this.subRepo.find({ where: { userId } });
    if (!subs.length) return;

    const data = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            data,
          );
        } catch (err: any) {
          const code = err?.statusCode;
          if (code === 404 || code === 410) {
            await this.subRepo.delete({ id: s.id }).catch(() => {});
          } else {
            this.logger.warn(`Push failed (${code ?? '?'}): ${err?.message ?? err}`);
          }
        }
      }),
    );
  }
}
