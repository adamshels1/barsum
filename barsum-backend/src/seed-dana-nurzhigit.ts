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
  DANA_NURZHIGIT_PARTS,
  DANA_NURZHIGIT_TITLES,
  DANA_NURZHIGIT_IMAGES,
  DANA_NURZHIGIT_AUDIOS,
} from './challenges/dana-nurzhigit';

/**
 * Точечный (идемпотентный) сид ТОЛЬКО для эксперта Даны Нұржігіт и её книги.
 * Книга остаётся в статусе DRAFT — в маркетплейс НЕ попадает, видна только
 * самому эксперту в кабинете. Безопасно запускать повторно (и на проде).
 */
async function seedDanaNurzhigit() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const NAME = 'Дана Нұржігіт';
  const EMAIL = 'nurzhigit@barsum.app';
  const PASSWORD = 'test123'; // ВРЕМЕННЫЙ — смените после проверки.

  // 1) Пользователь-эксперт
  let user = await usersService.findByEmail(EMAIL);
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Создан эксперт-пользователь:', user.email);
  } else if (user.name !== NAME) {
    user.name = NAME;
    await userRepo.save(user);
    console.log('✓ Обновлён эксперт-пользователь →', NAME, EMAIL);
  } else {
    console.log('~ Эксперт-пользователь уже есть:', user.email);
  }

  // 2) Профиль эксперта (approved, 30%)
  let expert = await expertsService.findByUserId(user.id);
  if (!expert) expert = await expertsService.createForUser(user.id);
  await expertsService.updateProfile(user.id, {
    specialization: 'Балалар әдебиеті, тіл дамыту және мәнерлеп оқу',
    bio: 'Телерадиожүргізуші, қоғам қайраткері. Балаларға арналған тәрбиелік әңгімелер авторы: әр әңгімені өз дауысымен оқып, аудио нұсқасын ұсынады.',
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, 30);
  console.log('✓ Эксперт готов (approved, 30%)');

  // 3) Книга: 3 рассказа (Абай, Шоқан, Ыбырай) с аудио. Статус DRAFT —
  //    не публикуется в маркетплейсе, видна только автору-эксперту.
  const title = '«ДАНА БАЛА» І бөлім';
  const LEGACY_TITLES = ['Дана бала. І бөлім', 'Ұлылар ізімен: Абай, Шоқан, Ыбырай'];
  let existing = await challengeRepo.findOne({ where: { title } });
  for (const legacy of LEGACY_TITLES) {
    if (existing) break;
    existing = await challengeRepo.findOne({ where: { title: legacy } });
  }
  if (!existing) {
    const book = challengeRepo.create({
      title,
      bookTitle: '«ДАНА БАЛА» І бөлім',
      bookAuthor: 'Дана Нұржігіт',
      description:
        'Ұлы қазақ ағартушылары туралы 3 тәрбиелік әңгіме: Абай, Шоқан және Ыбырай. Әр бөлімнің авторлық аудио нұсқасы бар — бала алдымен тыңдап, кейін дауыстап оқып, өз сөзімен айтып береді.',
      pagesTotal: 12,
      pagesPerPart: 4,
      totalParts: DANA_NURZHIGIT_PARTS.length,
      partTexts: DANA_NURZHIGIT_PARTS,
      partTitles: DANA_NURZHIGIT_TITLES,
      partImages: DANA_NURZHIGIT_IMAGES,
      partAudios: DANA_NURZHIGIT_AUDIOS,
      coverImage: '/books/dana-nurzhigit/cover.jpg',
      price: 5000,
      coinsReward: 5000,
      ageMin: 7,
      ageMax: 12,
      retellRequired: true,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.DRAFT,
      authorId: user.id,
      membersCount: 0,
    });
    await challengeRepo.save(book);
    console.log(`✓ Создана книга (draft): ${title} (${DANA_NURZHIGIT_PARTS.length} части, 5000₸, с аудио)`);
  } else {
    // Идемпотентный бэкфилл контента (название книги + тексты + названия + аудио).
    existing.title = title;
    existing.bookTitle = '«ДАНА БАЛА» І бөлім';
    existing.partTexts = DANA_NURZHIGIT_PARTS;
    existing.partTitles = DANA_NURZHIGIT_TITLES;
    existing.partImages = DANA_NURZHIGIT_IMAGES;
    existing.partAudios = DANA_NURZHIGIT_AUDIOS;
    existing.coverImage = '/books/dana-nurzhigit/cover.jpg';
    existing.totalParts = DANA_NURZHIGIT_PARTS.length;
    existing.authorId = user.id;
    await challengeRepo.save(existing);
    console.log('✓ Книга уже есть — контент (тексты/названия/аудио) синхронизирован:', title);
  }

  console.log('\nseed-dana-nurzhigit завершён.');
  await app.close();
}

seedDanaNurzhigit().catch((err) => {
  console.error('seed-dana-nurzhigit failed:', err);
  process.exit(1);
});
