import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({ text: 'Test transcription', words: [] }),
        },
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    score: 85,
                    feedback: 'Good',
                    questions: ['Q1?', 'Q2?', 'Q3?'],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

const mockConfigGet = jest.fn((key: string) => {
  if (key === 'GEMINI_API_KEY') return undefined;
  return 'test';
});

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: { get: mockConfigGet } },
      ],
    }).compile();
    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('transcribeAudio → returns text and confidence', async () => {
    const result = await service.transcribeAudio(Buffer.from('audio'), 'test.webm');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.confidence).toBe('number');
  });

  it('analyzeRetelling → returns score and 3 questions', async () => {
    const result = await service.analyzeRetelling('Some text', 'Harry Potter');
    expect(result.score).toBe(85);
    expect(result.questions).toHaveLength(3);
  });

  it('analyzeRetelling → propagates API errors', async () => {
    const mockOpenai = {
      chat: {
        completions: { create: jest.fn().mockRejectedValue(new Error('API Error')) },
      },
      audio: { transcriptions: { create: jest.fn() } },
    };
    (service as any).openai = mockOpenai;
    await expect(service.analyzeRetelling('text', 'book')).rejects.toThrow('API Error');
  });
});
