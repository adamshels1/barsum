import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

function normalizeMimeType(raw: string): string {
  const stripped = raw.split(';')[0].trim();
  return stripped === 'video/webm' ? 'audio/webm' : stripped;
}

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(AiService.name);
  private readonly geminiKey: string | undefined;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY', 'sk-placeholder'),
    });
    this.geminiKey = config.get<string>('GEMINI_API_KEY');
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    mimeType = 'audio/webm',
  ): Promise<{ text: string; confidence: number }> {
    if (this.geminiKey) {
      const text = await this.transcribeWithGemini(audioBuffer, mimeType);
      return { text, confidence: 0.9 };
    }
    const file = new File([audioBuffer as unknown as BlobPart], filename, { type: mimeType });
    const transcript = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'ru',
      response_format: 'verbose_json',
    });
    return { text: transcript.text, confidence: 0.9 };
  }

  async transcribeWithGemini(audioBuffer: Buffer, rawMimeType: string): Promise<string> {
    if (!this.geminiKey) throw new Error('GEMINI_API_KEY not set');
    const mimeType = normalizeMimeType(rawMimeType);
    const client = new GoogleGenerativeAI(this.geminiKey);
    const systemInstruction =
      'Ты помощник для детей. Транскрибируй пересказ ребёнка книги на русском или казахском языке. Возвращай только текст пересказа без комментариев.';
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent([
          { inlineData: { mimeType, data: audioBuffer.toString('base64') } },
          systemInstruction,
        ]);
        return result.response.text().trim();
      } catch (err) {
        const is503 = err instanceof Error && err.message.includes('503');
        if (!is503 || attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
    throw new Error('transcribeWithGemini: exhausted retries');
  }

  private stripMarkdownJson(text: string): string {
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  private async generateText(prompt: string): Promise<string> {
    if (this.geminiKey) {
      const client = new GoogleGenerativeAI(this.geminiKey);
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          return this.stripMarkdownJson(result.response.text());
        } catch (err) {
          const is503 = err instanceof Error && err.message.includes('503');
          if (!is503 || attempt === 3) throw err;
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
      throw new Error('generateText: exhausted retries');
    }
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    return response.choices[0].message.content || '{}';
  }

  async analyzeRetelling(
    text: string,
    bookTitle: string,
    chapterContext?: string,
  ): Promise<{ score: number; feedback: string; questions: string[] }> {
    const prompt = `Ты учитель, оцениваешь пересказ ребёнка книги "${bookTitle}".
${chapterContext ? `Контекст главы: ${chapterContext}` : ''}

Пересказ ребёнка:
"${text}"

Оцени пересказ по шкале 0-100. Задай 3 вопроса по тексту.
Ответь СТРОГО в JSON: {"score": number, "feedback": "string", "questions": ["q1","q2","q3"]}`;

    const content = await this.generateText(prompt);
    return JSON.parse(content);
  }

  async answerQuestion(
    question: string,
    childAnswer: string,
    context: string,
  ): Promise<{ correct: boolean; feedback: string }> {
    const prompt = `Вопрос: "${question}"
Ответ ребёнка: "${childAnswer}"
Контекст книги: "${context}"

Оцени ответ. JSON: {"correct": boolean, "feedback": "string"}`;

    const content = await this.generateText(prompt);
    return JSON.parse(content);
  }
}
