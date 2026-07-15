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
import { BARSUM_COLLECTION_PARTS, BARSUM_COLLECTION_TITLES, BARSUM_COLLECTION_IMAGES } from './challenges/barsum-collection';

/**
 * Точечный (идемпотентный) сид ТОЛЬКО для эксперта Даны и её книги-сборника.
 * Предназначен для запуска на проде — НИЧЕГО не удаляет и не трогает других
 * пользователей/книги. Безопасно запускать повторно.
 */
async function seedDana() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const NAME = 'Дана Аманжолқызы';
  const EMAIL = 'dana@barsum.app';
  const LEGACY_EMAIL = 'aigul@barsum.kz';
  const PASSWORD = 'test123'; // ВРЕМЕННЫЙ — смените после проверки.

  // 1) Пользователь-эксперт
  let user = (await usersService.findByEmail(EMAIL)) || (await usersService.findByEmail(LEGACY_EMAIL));
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Создан эксперт-пользователь:', user.email);
  } else if (user.email !== EMAIL || user.name !== NAME) {
    user.email = EMAIL;
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
    specialization: 'Балалар әдебиеті және оқу сауаттылығы',
    whatsapp: '+7 701 234 5678',
    bio: '10 жылдан астам тәжірибесі бар бастауыш сынып мұғалімі. Балаларды қазақ тілінде мәнерлеп оқуға және мәтінді өз сөзімен айтуға үйретеді.',
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, 30);
  console.log('✓ Эксперт готов (approved, 30%)');

  // 3) Книга-сборник
  const title = 'Мейірімді бала: әңгімелер жинағы';
  const existing = await challengeRepo.findOne({ where: { title } });
  if (!existing) {
    const collection = challengeRepo.create({
      title,
      bookTitle: 'Мейірімді бала',
      bookAuthor: 'Ы. Алтынсарин, Л. Толстой және т.б.',
      description:
        '9 қазақ әңгімесінен тұратын жинақ: мейірім, достық, еңбекқорлық және адалдық туралы. Әр бөлім — жеке әңгіме. Оқып болған соң бала оны өз сөзімен айтып береді, ал AI бағалайды.',
      pagesTotal: 18,
      pagesPerPart: 2,
      totalParts: BARSUM_COLLECTION_PARTS.length,
      partTexts: BARSUM_COLLECTION_PARTS,
      partTitles: BARSUM_COLLECTION_TITLES,
      partImages: BARSUM_COLLECTION_IMAGES,
      coverImage: '/books/barsum-collection.jpg',
      price: 3000,
      coinsReward: 3000,
      ageMin: 7,
      ageMax: 12,
      retellRequired: true,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
      membersCount: 0,
    });
    await challengeRepo.save(collection);
    console.log('✓ Создана книга-сборник:', title, `(${BARSUM_COLLECTION_PARTS.length} частей, 3000₸)`);
  } else {
    // Идемпотентный бэкфилл частей (названия + иллюстрации) для уже созданной книги на проде.
    const needsTitles =
      !existing.partTitles || existing.partTitles.length !== BARSUM_COLLECTION_TITLES.length;
    const needsImages =
      !existing.partImages || existing.partImages.length !== BARSUM_COLLECTION_IMAGES.length;
    if (needsTitles || needsImages) {
      existing.partTitles = BARSUM_COLLECTION_TITLES;
      existing.partTexts = BARSUM_COLLECTION_PARTS;
      existing.partImages = BARSUM_COLLECTION_IMAGES;
      await challengeRepo.save(existing);
      console.log('✓ Обновлены части (названия + иллюстрации) в книге:', title);
    } else {
      console.log('~ Книга уже есть (части на месте):', title);
    }
  }

  console.log('\nseed-dana завершён.');
  await app.close();
}

seedDana().catch((err) => {
  console.error('seed-dana failed:', err);
  process.exit(1);
});
