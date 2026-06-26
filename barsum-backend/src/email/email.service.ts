import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.from = config.get('SMTP_FROM', 'Barsum <noreply@barsum.kz>');
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'smtp.eu.mailgun.org'),
      port: parseInt(config.get('SMTP_PORT', '587')),
      secure: config.get('SMTP_SECURE') === 'true',
      auth: {
        user: config.get('SMTP_USER', ''),
        pass: config.get('SMTP_PASSWORD', ''),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.sendMail(
      to,
      'Добро пожаловать в Barsum!',
      `<h1>Привет, ${name}!</h1><p>Добро пожаловать на платформу Barsum.</p>`,
    );
  }

  async sendPaymentConfirmed(to: string, challengeTitle: string): Promise<void> {
    await this.sendMail(
      to,
      'Оплата подтверждена — Barsum',
      `<h2>Оплата подтверждена!</h2><p>Ребёнок записан на челлендж «${challengeTitle}».</p>`,
    );
  }

  async sendPaymentRejected(to: string, reason: string): Promise<void> {
    await this.sendMail(
      to,
      'Оплата отклонена — Barsum',
      `<h2>Оплата отклонена</h2><p>Причина: ${reason}</p>`,
    );
  }

  async sendExpertApproved(to: string): Promise<void> {
    await this.sendMail(
      to,
      'Ваша заявка одобрена — Barsum',
      `<h2>Поздравляем!</h2><p>Ваша заявка эксперта одобрена. Теперь вы можете создавать челленджи.</p>`,
    );
  }

  async sendExpertRejected(to: string, reason: string): Promise<void> {
    await this.sendMail(
      to,
      'Заявка отклонена — Barsum',
      `<h2>Ваша заявка отклонена</h2><p>Причина: ${reason}</p>`,
    );
  }

  async sendRewardRequested(to: string, childName: string, rewardName: string): Promise<void> {
    await this.sendMail(
      to,
      'Новый запрос награды — Barsum',
      `<p>${childName} хочет получить награду «${rewardName}».</p>`,
    );
  }
}
