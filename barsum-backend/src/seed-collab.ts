import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { Repository } from 'typeorm';

/**
 * Идемпотентный сид демо-книги СОАВТОРСТВА (collaborative).
 * Автор — тестовый эксперт expert@test.kz. Книга сразу PUBLISHED и открыта
 * для приёма продолжений (collabOpen=true, currentRound=2). Стартовая глава задана.
 * Безопасно запускать повторно.
 */
async function seedCollab() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  const EMAIL = 'expert@test.kz';
  const user = await usersService.findByEmail(EMAIL);
  if (!user) {
    console.error(`✗ Эксперт ${EMAIL} не найден — сначала выполните основной seed.`);
    await app.close();
    process.exit(1);
  }

  // Убеждаемся, что эксперт approved (иначе книгу нельзя было бы создать через UI).
  const expert = await expertsService.findByUserId(user.id);
  if (expert && expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }

  const TITLE = 'Совместная сказка: Барс и звёзды';
  const CHAPTER_1 =
    'Жил-был маленький барсёнок по имени Ак. Однажды ночью он поднял голову и увидел, что с неба пропала одна звезда. «Куда же она делась?» — подумал Ак и решил отправиться на поиски пропавшей звезды.';

  let book = await challengeRepo.findOne({ where: { title: TITLE } });
  if (!book) {
    book = challengeRepo.create({
      title: TITLE,
      bookTitle: 'Барс и звёзды',
      bookAuthor: 'Сочиняем вместе',
      description:
        'Совместная сказка: эксперт задал начало, а продолжение сочиняют дети и родители — глава за главой, своим голосом. Лучшие продолжения выбирает эксперт.',
      pagesTotal: 0,
      pagesPerPart: 1,
      totalParts: 1,
      partTexts: [CHAPTER_1],
      partTitles: ['Глава 1'],
      partImages: [],
      partAudios: [],
      coverImage: null,
      price: 0,
      coinsReward: 0,
      ageMin: 5,
      ageMax: 12,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
      membersCount: 0,
      collaborative: true,
      currentRound: 2,
      collabOpen: true,
      collabCompleted: false,
      winnerCoins: 300,
      coAuthors: [],
    });
    await challengeRepo.save(book);
    console.log(`✓ Создана совместная книга (published, открыт приём): «${TITLE}»`);
    console.log(`  id: ${book.id}`);
  } else {
    // Идемпотентно приводим к рабочему состоянию демо.
    book.collaborative = true;
    book.status = ChallengeStatus.PUBLISHED;
    book.collabOpen = true;
    book.collabCompleted = false;
    if (!book.partTexts?.length) {
      book.partTexts = [CHAPTER_1];
      book.partTitles = ['Глава 1'];
    }
    if (!book.currentRound || book.currentRound < 2) book.currentRound = 2;
    if (!book.winnerCoins) book.winnerCoins = 300;
    book.authorId = user.id;
    await challengeRepo.save(book);
    console.log(`~ Совместная книга уже есть — синхронизирована: «${TITLE}»`);
    console.log(`  id: ${book.id}`);
  }

  console.log('\nseed-collab завершён.');
  await app.close();
}

seedCollab().catch((err) => {
  console.error('seed-collab failed:', err);
  process.exit(1);
});
