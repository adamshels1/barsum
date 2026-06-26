import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: { get: jest.fn((key: string, def = '') => def) } },
      ],
    }).compile();
    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('sendMail → calls transporter with correct params', async () => {
    const sendMailSpy = jest.spyOn(service['transporter'], 'sendMail');
    await service.sendMail('test@example.com', 'Subject', '<p>Body</p>');
    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com', subject: 'Subject' }),
    );
  });

  it('sendMail → does not throw on transporter error', async () => {
    jest
      .spyOn(service['transporter'], 'sendMail')
      .mockRejectedValueOnce(new Error('SMTP error'));
    await expect(service.sendMail('a@b.com', 'S', 'B')).resolves.not.toThrow();
  });
});
