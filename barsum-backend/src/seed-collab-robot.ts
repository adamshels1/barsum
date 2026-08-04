import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { Repository } from 'typeorm';

/**
 * Идемпотентный сид совместной книги «Айдан келген робот» (казахский).
 * Стартовую главу задал эксперт: текст + авторская аудио-озвучка + обложка.
 * Книга PUBLISHED и открыта для приёма продолжений (collabOpen, currentRound=2).
 * Ассеты статические: /public/books/robot/*. Безопасно запускать повторно.
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  const user = await usersService.findByEmail('expert@test.kz');
  if (!user) {
    console.error('✗ Эксперт expert@test.kz не найден — выполните основной seed.');
    await app.close();
    process.exit(1);
  }
  const expert = await expertsService.findByUserId(user.id);
  if (expert && expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }

  const TITLE = 'Айдан келген робот (бірге шығарамыз)';
  // Цена книги после завершения соавторства. Монеты ребёнку = цене (см. payments.create).
  const PRICE = 500;
  const CHAPTER_1 =
    'Бір күні түнде Аянның терезесі жарқ ете қалды. Ол сыртқа жүгіріп шықты. Аулада кішкентай күміс шар тұр екен. Шар баяу ашылды. Ішінен алақандай ғана робот шықты. Оның көздері көгілдір түспен жарқырап тұрды. Робот Аянға жақындады.\n— Сәлем, Аян, — деді ол.\nАян таңғалып қалды.\n— Сен менің атымды қайдан білесің?\nРобот үнсіз күлімсіреді. Сосын қолындағы кішкентай жарық тасты Аянға ұсынды.\n— Ай жоғалып бара жатыр. Маған сенің көмегің керек...';

  const fields = {
    title: TITLE,
    bookTitle: 'Айдан келген робот',
    bookAuthor: 'Бірге шығарамыз',
    description:
      'Бірлескен ертегі: сарапшы басын жазды (мәтін + авторлық аудио), ал жалғасын балалар мен ата-аналар өз дауысымен ойлап табады. Үздік жалғасты сарапшы таңдайды.',
    pagesTotal: 0,
    pagesPerPart: 1,
    totalParts: 1,
    partTexts: [CHAPTER_1],
    partTitles: ['1-тарау'],
    // Иллюстрация к каждой главе. 1-тарау — обложка (эксперт); главы 2–5 —
    // придуманы соавторами, картинки добавлены вручную (accept-флоу collab не
    // сохраняет partImages, поэтому канон живёт здесь и переживает ре-сид).
    partImages: [
      '/books/robot/cover.jpg', // 1-тарау (эксперт)
      '/books/robot/chapter2.jpg', // Глава 2 (соавторы)
      '/books/robot/chapter3.jpg', // Глава 3 (соавторы)
      '/books/robot/chapter4.jpg', // Глава 4 (соавторы)
      '/books/robot/chapter5.jpg', // Глава 5 (соавторы)
    ],
    partAudios: ['/books/robot/chapter1.mp3'],
    coverImage: '/books/robot/cover.jpg',
    // Книга дописана и переведена в платные: 500 ₸ = 500 монет ребёнку
    // (coinsAmount при покупке = price), доля автора — commissionPct эксперта.
    price: PRICE,
    coinsReward: PRICE,
    ageMin: 5,
    ageMax: 12,
    category: ChallengeCategory.READING,
    language: 'kk',
    status: ChallengeStatus.PUBLISHED,
    authorId: user.id,
    membersCount: 0,
    collaborative: true,
    currentRound: 2,
    collabOpen: true,
    collabCompleted: false,
    winnerCoins: 300,
    coAuthors: [] as any[],
  };

  let book = await challengeRepo.findOne({ where: { title: TITLE } });
  if (!book) {
    book = challengeRepo.create(fields);
    await challengeRepo.save(book);
    console.log(`✓ Создана совместная книга (KZ): «${TITLE}»`);
  } else {
    // Обновляем только то, чей канон живёт в сиде. Прогресс соавторства
    // (главы, раунд, открыта/завершена) и автора книги НЕ трогаем: на проде
    // книга уже дописана и её автор — реальный эксперт, а не expert@test.kz.
    const parts = book.partTexts?.length || 0;
    Object.assign(book, {
      bookTitle: fields.bookTitle,
      partTexts: parts ? book.partTexts : fields.partTexts,
      partTitles: book.partTitles?.length ? book.partTitles : fields.partTitles,
      // Картинок ровно столько, сколько глав (лишние слоты обрезаем).
      partImages: fields.partImages.slice(0, Math.max(parts, 1)),
      partAudios: fields.partAudios,
      coverImage: fields.coverImage,
      collaborative: true,
      status: ChallengeStatus.PUBLISHED,
      price: fields.price,
      coinsReward: fields.coinsReward,
      winnerCoins: 300,
      authorId: book.authorId || user.id,
    });
    await challengeRepo.save(book);
    console.log(`~ Совместная книга синхронизирована: «${TITLE}»`);
  }
  console.log(`  id: ${book.id}`);
  await app.close();
}

seed().catch((err) => {
  console.error('seed-collab-robot failed:', err);
  process.exit(1);
});
