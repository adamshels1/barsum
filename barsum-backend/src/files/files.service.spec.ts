import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

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
