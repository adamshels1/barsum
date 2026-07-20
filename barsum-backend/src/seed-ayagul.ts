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
  AYAGUL_ERTEGILER_PARTS,
  AYAGUL_ERTEGILER_TITLES,
  AYAGUL_ERTEGILER_IMAGES,
  AYAGUL_ERTEGILER_AUDIOS,
} from './challenges/ayagul-ertegiler';

/**
 * Точечный (идемпотентный) сид ТОЛЬКО для эксперта Аягүл Құдайбергенқызы и её
 * книги «Ел аузындағы ертегілер». Книга публикуется (PUBLISHED) сразу.
 * Безопасно запускать повторно (и на проде).
 */
async function seedAyagul() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const NAME = 'Аягүл Құдайбергенқызы';
  const EMAIL = 'ayagul@barsum.app';
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
    console.log('✓ Создан эксперт-пользователь:', user.email);
  } else {
    user.password = await bcrypt.hash(PASSWORD, 10);
    if (user.name !== NAME) user.name = NAME;
    await userRepo.save(user);
    console.log('~ Эксперт-пользователь уже есть, пароль синхронизирован:', user.email);
  }

  // 2) Профиль эксперта (approved, 30%)
  let expert = await expertsService.findByUserId(user.id);
  if (!expert) expert = await expertsService.createForUser(user.id);
  await expertsService.updateProfile(user.id, {
    specialization: 'Балалар әдебиеті, халық ертегілері мен аңыздарын мәнерлеп оқу',
    bio: 'Қазақтың халық ертегілері мен аңыздарын балаларға арнап дауыстап оқып, аудио нұсқасын ұсынады.',
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, COMMISSION);
  console.log(`✓ Эксперт готов (approved, ${COMMISSION}%)`);

  // 3) Книга: 4 ертегі/аңыз (7 бөлім, аудиомен). Статус PUBLISHED — сразу в
  //    маркетплейсе.
  const title = 'Ел аузындағы ертегілер';
  const existing = await challengeRepo.findOne({ where: { title } });
  if (!existing) {
    const book = challengeRepo.create({
      title,
      bookTitle: title,
      bookAuthor: 'Аягүл Құдайбергенқызы',
      description:
        'Ел аузынан жиналған 4 қазақ халық ертегісі мен аңызы: Үйсін Төле би мен Әнет баба, Жиренше шешен, Тәкаппар Күнбағыс, Мейірімді түлкі. Әр бөлімнің авторлық аудио нұсқасы бар — бала алдымен тыңдап, кейін дауыстап оқып, өз сөзімен айтып береді (пересказ).',
      pagesTotal: AYAGUL_ERTEGILER_PARTS.length,
      pagesPerPart: 1,
      totalParts: AYAGUL_ERTEGILER_PARTS.length,
      partTexts: AYAGUL_ERTEGILER_PARTS,
      partTitles: AYAGUL_ERTEGILER_TITLES,
      partImages: AYAGUL_ERTEGILER_IMAGES,
      partAudios: AYAGUL_ERTEGILER_AUDIOS,
      coverImage: '/books/ayagul-ertegiler/cover.jpg',
      price: 3000,
      coinsReward: 3000,
      ageMin: 6,
      ageMax: 10,
      retellRequired: true,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
      membersCount: 0,
    });
    await challengeRepo.save(book);
    console.log(`✓ Создана книга (published): ${title} (${AYAGUL_ERTEGILER_PARTS.length} частей, 3000₸)`);
  } else {
    // Идемпотентный бэкфилл контента.
    existing.title = title;
    existing.bookTitle = title;
    existing.bookAuthor = 'Аягүл Құдайбергенқызы';
    existing.partTexts = AYAGUL_ERTEGILER_PARTS;
    existing.partTitles = AYAGUL_ERTEGILER_TITLES;
    existing.partImages = AYAGUL_ERTEGILER_IMAGES;
    existing.partAudios = AYAGUL_ERTEGILER_AUDIOS;
    existing.coverImage = '/books/ayagul-ertegiler/cover.jpg';
    existing.totalParts = AYAGUL_ERTEGILER_PARTS.length;
    existing.authorId = user.id;
    existing.status = ChallengeStatus.PUBLISHED;
    existing.price = 3000;
    existing.coinsReward = 3000;
    await challengeRepo.save(existing);
    console.log('✓ Книга уже есть — контент синхронизирован:', title);
  }

  console.log('\nseed-ayagul завершён.');
  await app.close();
}

seedAyagul().catch((err) => {
  console.error('seed-ayagul failed:', err);
  process.exit(1);
});
