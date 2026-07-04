import { Test, TestingModule } from '@nestjs/testing';
import { FilesService, parseStoredFileUrl, audioMimeFromUrl } from './files.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('parseStoredFileUrl', () => {
  it('parses direct MinIO http URL with ip:port', () => {
    const r = parseStoredFileUrl('http://185.113.132.6:9100/barsum-audio/sess1/123-rec.webm');
    expect(r).toEqual({ bucket: 'barsum-audio', key: 'sess1/123-rec.webm' });
  });

  it('parses https URL served under a path prefix', () => {
    const r = parseStoredFileUrl('https://barsum.app/files/barsum-audio/sess1/123-rec.webm');
    expect(r).toEqual({ bucket: 'barsum-audio', key: 'sess1/123-rec.webm' });
  });

  it('returns null for a URL without a known bucket', () => {
    expect(parseStoredFileUrl('https://example.com/foo/bar.webm')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseStoredFileUrl('')).toBeNull();
  });
});

describe('audioMimeFromUrl', () => {
  it('maps extensions to mime types, defaults to webm', () => {
    expect(audioMimeFromUrl('a/b.wav')).toBe('audio/wav');
    expect(audioMimeFromUrl('a/b.mp3')).toBe('audio/mpeg');
    expect(audioMimeFromUrl('a/b.unknown')).toBe('audio/webm');
  });
});

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn().mockResolvedValue(true),
    makeBucket: jest.fn().mockResolvedValue(undefined),
    putObject: jest.fn().mockResolvedValue(undefined),
    removeObject: jest.fn().mockResolvedValue(undefined),
    presignedGetObject: jest.fn().mockResolvedValue('http://signed-url'),
  })),
}));

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string, def = '') => def) },
        },
      ],
    }).compile();
    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('uploadFile → throws on unsupported type', async () => {
    await expect(
      service.uploadFile(Buffer.from('x'), 'test.pdf', 'barsum-audio', 'application/pdf'),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploadFile → returns URL for valid audio', async () => {
    const url = await service.uploadFile(
      Buffer.from('x'),
      'test.webm',
      'barsum-audio',
      'audio/webm',
    );
    expect(url).toContain('barsum-audio');
  });
});
