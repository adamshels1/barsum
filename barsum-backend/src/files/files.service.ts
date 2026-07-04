import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

const ALLOWED_AUDIO = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png'];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const BUCKET_AUDIO = 'barsum-audio';
export const BUCKET_RECEIPTS = 'barsum-receipts';
export const BUCKET_AVATARS = 'barsum-avatars';
export const BUCKET_REWARDS = 'barsum-rewards';

export const KNOWN_BUCKETS = [BUCKET_AUDIO, BUCKET_RECEIPTS, BUCKET_AVATARS, BUCKET_REWARDS];

const AUDIO_MIME_BY_EXT: Record<string, string> = {
  webm: 'audio/webm', mp4: 'audio/mp4', wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4',
};

export function audioMimeFromUrl(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  return AUDIO_MIME_BY_EXT[ext ?? ''] ?? 'audio/webm';
}

/**
 * Разбирает сохранённую в БД ссылку на файл MinIO в { bucket, key } независимо от того,
 * как она сформирована: http://ip:9100/<bucket>/<key>, https://host/prefix/<bucket>/<key> и т.д.
 * Ищем известное имя бакета в сегментах пути — это устойчиво к смене хоста/префикса.
 */
export function parseStoredFileUrl(url: string): { bucket: string; key: string } | null {
  if (!url) return null;
  try {
    const path = new URL(url).pathname.replace(/^\/+/, '');
    const segments = path.split('/');
    const idx = segments.findIndex((s) => KNOWN_BUCKETS.includes(s));
    if (idx === -1) return null;
    const key = segments.slice(idx + 1).join('/');
    if (!key) return null;
    return { bucket: segments[idx], key: decodeURIComponent(key) };
  } catch {
    return null;
  }
}

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly client: Minio.Client;
  private readonly logger = new Logger(FilesService.name);

  constructor(private config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: config.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(config.get('MINIO_PORT', '9100')),
      useSSL: config.get('MINIO_USE_SSL') === 'true',
      accessKey: config.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBuckets();
  }

  async ensureBuckets(): Promise<void> {
    for (const bucket of [BUCKET_AUDIO, BUCKET_RECEIPTS, BUCKET_AVATARS, BUCKET_REWARDS]) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Created bucket: ${bucket}`);
      }
    }
    // Чеки, аватары, награды и аудиозаписи чтения отдаются напрямую через <img>/<audio> src,
    // поэтому читаются анонимно.
    for (const bucket of [BUCKET_RECEIPTS, BUCKET_AVATARS, BUCKET_REWARDS, BUCKET_AUDIO]) {
      await this.client.setBucketPolicy(bucket, JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }));
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    bucket: string,
    mimetype: string,
  ): Promise<string> {
    const isAudio = ALLOWED_AUDIO.includes(mimetype);
    const isImage = ALLOWED_IMAGE.includes(mimetype);

    if (!isAudio && !isImage) {
      throw new BadRequestException(`Unsupported file type: ${mimetype}`);
    }
    if (isAudio && buffer.length > MAX_AUDIO_SIZE) {
      throw new BadRequestException('Audio file too large (max 50MB)');
    }
    if (isImage && buffer.length > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image file too large (max 10MB)');
    }

    await this.client.putObject(bucket, filename, buffer, buffer.length, {
      'Content-Type': mimetype,
    });
    const publicUrl = this.config.get('MINIO_PUBLIC_URL');
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${bucket}/${filename}`;
    }
    const useSSL = this.config.get('MINIO_USE_SSL') === 'true';
    const scheme = useSSL ? 'https' : 'http';
    const endpoint = this.config.get('MINIO_ENDPOINT', 'localhost');
    const port = this.config.get('MINIO_PORT', '9100');
    const isDefaultPort = (useSSL && port === '443') || (!useSSL && port === '80');
    const host = isDefaultPort ? endpoint : `${endpoint}:${port}`;
    return `${scheme}://${host}/${bucket}/${filename}`;
  }

  async deleteFile(filename: string, bucket: string): Promise<void> {
    await this.client.removeObject(bucket, filename);
  }

  async getSignedUrl(filename: string, bucket: string, expiresIn = 3600): Promise<string> {
    return this.client.presignedGetObject(bucket, filename, expiresIn);
  }

  async uploadAudio(file: Express.Multer.File, sessionId: string): Promise<string> {
    const filename = `${sessionId}/${Date.now()}-${file.originalname}`;
    return this.uploadFile(file.buffer, filename, BUCKET_AUDIO, file.mimetype);
  }

  async uploadReceipt(file: Express.Multer.File, paymentId: string): Promise<string> {
    const filename = `${paymentId}/${Date.now()}-${file.originalname}`;
    return this.uploadFile(file.buffer, filename, BUCKET_RECEIPTS, file.mimetype);
  }

  async uploadAvatar(file: Express.Multer.File, ownerId: string): Promise<string> {
    const filename = `${ownerId}/${Date.now()}-${file.originalname}`;
    return this.uploadFile(file.buffer, filename, BUCKET_AVATARS, file.mimetype);
  }

  async uploadReward(file: Express.Multer.File, rewardId: string): Promise<string> {
    const filename = `${rewardId}/${Date.now()}-${file.originalname}`;
    return this.uploadFile(file.buffer, filename, BUCKET_REWARDS, file.mimetype);
  }

  async getBuffer(objectPath: string, bucket: string): Promise<Buffer> {
    const stream = await this.client.getObject(bucket, objectPath);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
