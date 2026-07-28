import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { IsNull, Repository } from 'typeorm';

/**
 * Разовый бэкфилл языка книг (`challenge.language`) для тех, у кого он ещё не задан.
 *
 * Определяем по буквам, которых нет в русском алфавите (ә, ғ, қ, ң, ө, ұ, ү, һ, і):
 * если они встречаются в тексте частей/описании/названии — книга казахская.
 * Смотрим В ПЕРВУЮ ОЧЕРЕДЬ на partTexts (сам текст, который читает ребёнок), а не на
 * название: у русской книги автор вполне может быть с казахским именем.
 *
 * Идемпотентно и безопасно для прода: трогает только строки с language IS NULL,
 * поэтому ручные правки языка повторный запуск не перетирает.
 * Прогон без записи: `npm run backfill:book-language -- --dry`.
 */
const KZ_LETTERS = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;

function detectLanguage(c: Challenge): 'ru' | 'kk' {
  const texts = Array.isArray(c.partTexts) ? c.partTexts.join(' ') : '';
  const titles = Array.isArray(c.partTitles) ? c.partTitles.join(' ') : '';
  // Текст частей — самый надёжный сигнал; если его нет (напр. «своя книга»),
  // откатываемся на заголовки и описание.
  const primary = `${texts} ${titles}`.trim();
  const sample = primary || `${c.title} ${c.bookTitle} ${c.description ?? ''}`;
  return KZ_LETTERS.test(sample) ? 'kk' : 'ru';
}

async function backfill() {
  const dry = process.argv.includes('--dry');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  const pending = await challengeRepo.find({ where: { language: IsNull() } });
  console.log(`Книг без языка: ${pending.length}${dry ? ' (--dry: только показываю)' : ''}\n`);

  const counts = { ru: 0, kk: 0 };
  for (const c of pending) {
    const lang = detectLanguage(c);
    counts[lang]++;
    console.log(`  ${lang === 'kk' ? '🇰🇿' : '🇷🇺'} ${lang}  ${c.title}`);
    if (!dry) {
      c.language = lang;
      await challengeRepo.save(c);
    }
  }

  console.log(`\nИтого: ${counts.ru} рус., ${counts.kk} каз.`);
  console.log(dry ? 'Ничего не записано (--dry).' : 'backfill-book-language завершён.');
  await app.close();
}

backfill().catch((err) => {
  console.error('backfill-book-language failed:', err);
  process.exit(1);
});
