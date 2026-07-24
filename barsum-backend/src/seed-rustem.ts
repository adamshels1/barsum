import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { UserRole, ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { User } from './users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  RUSTEM_ALATAU_TITLE,
  RUSTEM_ALATAU_CHAPTER_TITLE,
  RUSTEM_ALATAU_CHAPTER_1,
  RUSTEM_ALATAU_COVER,
} from './challenges/rustem-alatau';

/**
 * Точечный (идемпотентный) сид эксперта Рүстем Балтабаев и его СОВМЕСТНОЙ
 * (collab) книги «Алатаудың ақ сақшысы» (жанр: Шытырман оқиға).
 *
 * Эксперт написал стартовую главу (I тарау), а продолжение сочиняют дети и
 * родители своим голосом. Книга PUBLISHED и открыта для приёма продолжений
 * (collaborative, collabOpen, currentRound=2). Аудио к главе нет (не прислано).
 *
 * Незавершённая collab-книга в каталоге покупки НЕ показывается — она живёт в
 * разделе «Сочиняем вместе» (/child/collab, /parent/collab, /expert/collab/[id]).
 * Безопасно запускать повторно (и на проде).
 */
async function seedRustem() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const NAME = 'Рүстем Балтабаев';
  const EMAIL = 'rustem@barsum.app';
  const PHONE = '+7 707 199 9765';
  const PASSWORD = 'test123'; // ВРЕМЕННЫЙ — смените после проверки.
  const COMMISSION = 30;

  // 1) Пользователь-эксперт
  let user = await usersService.findByEmail(EMAIL);
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    user.phone = PHONE;
    await userRepo.save(user);
    console.log('✓ Создан эксперт-пользователь:', user.email);
  } else {
    user.password = await bcrypt.hash(PASSWORD, 10);
    if (user.name !== NAME) user.name = NAME;
    user.phone = PHONE;
    await userRepo.save(user);
    console.log('~ Эксперт-пользователь уже есть, синхронизирован:', user.email);
  }

  // 2) Профиль эксперта (approved, 30%)
  let expert = await expertsService.findByUserId(user.id);
  if (!expert) expert = await expertsService.createForUser(user.id);
  await expertsService.updateProfile(user.id, {
    specialization: 'Балаларға арналған шытырман оқиғалы ертегілер',
    bio: 'Балаларға арналған шытырман ертегілердің басын жазады, жалғасын балалармен бірге ойлап табады.',
    whatsapp: PHONE,
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, COMMISSION);
  console.log(`✓ Эксперт готов (approved, ${COMMISSION}%)`);

  // 3) Совместная книга: стартовая глава от эксперта, открыта для продолжений.
  const title = `${RUSTEM_ALATAU_TITLE} (бірге шығарамыз)`;
  const fields: Partial<Challenge> = {
    title,
    bookTitle: RUSTEM_ALATAU_TITLE,
    bookAuthor: NAME,
    description:
      'Бірлескен шытырман ертегі: сарапшы Рүстем Балтабаев оқиғаның басын жазды — Алатаудағы Тастанды Алматы мен жоғалған Ақ Семсердің құпиясы. Ал жалғасын балалар мен ата-аналар өз дауысымен ойлап табады. Үздік жалғасты сарапшы таңдайды.',
    pagesTotal: 0,
    pagesPerPart: 1,
    totalParts: 1,
    partTexts: [RUSTEM_ALATAU_CHAPTER_1],
    partTitles: [RUSTEM_ALATAU_CHAPTER_TITLE],
    partImages: [RUSTEM_ALATAU_COVER],
    coverImage: RUSTEM_ALATAU_COVER,
    price: 0,
    coinsReward: 0,
    ageMin: 6,
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
    coAuthors: [] as any[],
  };

  let book = await challengeRepo.findOne({ where: { title } });
  if (!book) {
    book = challengeRepo.create(fields);
    await challengeRepo.save(book);
    console.log(`✓ Создана совместная книга: «${title}»`);
  } else {
    Object.assign(book, {
      bookTitle: fields.bookTitle,
      bookAuthor: fields.bookAuthor,
      description: fields.description,
      // Контент главы обновляем только если ещё пусто — чтобы не перетереть
      // правки эксперта, если он уже вёл раунды.
      partTexts: book.partTexts?.length ? book.partTexts : fields.partTexts,
      partTitles: book.partTitles?.length ? book.partTitles : fields.partTitles,
      partImages: fields.partImages,
      coverImage: fields.coverImage,
      collaborative: true,
      status: ChallengeStatus.PUBLISHED,
      collabOpen: true,
      collabCompleted: false,
      currentRound: book.currentRound && book.currentRound >= 2 ? book.currentRound : 2,
      winnerCoins: 300,
      authorId: user.id,
    });
    await challengeRepo.save(book);
    console.log(`~ Совместная книга синхронизирована: «${title}»`);
  }
  console.log(`  id: ${book.id}`);

  console.log('\nseed-rustem завершён.');
  await app.close();
}

seedRustem().catch((err) => {
  console.error('seed-rustem failed:', err);
  process.exit(1);
});
