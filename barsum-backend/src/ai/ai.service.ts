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

Оцени пересказ по шкале от 0 до 10 (10 — отличный пересказ, полностью передающий суть). Задай 3 вопроса по тексту.
Ответь СТРОГО в JSON: {"score": number от 0 до 10, "feedback": "string", "questions": ["q1","q2","q3"]}`;

    const content = await this.generateText(prompt);
    return JSON.parse(content);
  }

  // Оценка детского/родительского ПРОДОЛЖЕНИЯ главы совместной книги.
  // ВАЖНО: у творческого продолжения нет эталона (в отличие от чтения вслух → LCS),
  // поэтому это генеративная оценка-ПОДСКАЗКА эксперту, а не авто-решение.
  async assessContribution(
    previousChapterText: string,
    contribution: string,
    authorType: 'child' | 'parent' = 'child',
  ): Promise<{
    relevance: number;
    creativity: number;
    coherence: number;
    language: number;
    overall: number;
    safetyFlag: boolean;
    feedback: string;
  }> {
    // Продолжение может добавить и ребёнок, и родитель — фидбек не должен приписывать
    // авторство ребёнку. Обозначаем автора нейтрально/по роли.
    const author = authorType === 'parent' ? 'родитель' : 'ребёнок';
    const prompt = `Ты детский редактор. Участники (дети 6–12 лет и их родители) сочиняют продолжение главы книги, наговаривая его голосом. Оцени продолжение как ПОДСКАЗКУ для педагога — финальное решение примет человек.

Предыдущая глава:
"${previousChapterText || '(это начало книги)'}"

Продолжение, которое предложил автор (роль: ${author}):
"${contribution}"

В поле feedback обращайся к автору по его роли («автор» или «${author}»), НЕ приписывай авторство ребёнку, если это родитель.

Оцени по шкале 0–10 каждый критерий:
- relevance: насколько связано с предыдущей главой (не «улетел» в сторону)
- creativity: оригинальность и интересность идеи
- coherence: связность, законченность мысли, логика
- language: богатство речи, грамотность

Также определи safetyFlag = true, если есть недетский/неуместный контент, ругательства, жестокость или персональные данные (реальные имена, адреса, телефоны). Иначе false.

Дай короткий feedback (1–2 фразы) для педагога о сильных/слабых сторонах.

Ответь СТРОГО в JSON: {"relevance": number, "creativity": number, "coherence": number, "language": number, "safetyFlag": boolean, "feedback": "string"}`;

    const content = await this.generateText(prompt);
    const parsed = JSON.parse(content);
    const clamp = (n: any) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
    const relevance = clamp(parsed.relevance);
    const creativity = clamp(parsed.creativity);
    const coherence = clamp(parsed.coherence);
    const language = clamp(parsed.language);
    // Взвешенная итоговая: связь и креатив весят больше.
    const overall = Math.round(
      (relevance * 0.3 + creativity * 0.3 + coherence * 0.2 + language * 0.2) * 10,
    ) / 10;
    return {
      relevance,
      creativity,
      coherence,
      language,
      overall,
      safetyFlag: !!parsed.safetyFlag,
      feedback: parsed.feedback ?? '',
    };
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
