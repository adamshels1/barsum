import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { UserRole, ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import {
  ISKANDER_LIGA_COVER,
  ISKANDER_LIGA_PART_TITLES,
  ISKANDER_LIGA_PART_TEXTS,
  ISKANDER_LIGA_PART_IMAGES,
} from './challenges/iskander-liga';

/**
 * Точечный (идемпотентный) сид комикса «Искандер и Лига Цифрового Света»
 * (автор — Сабазова Жанар, Steppe Tech Lab; на платформе числится за
 * внутренним экспертом «Команда Barsum», как и остальные фирменные книги).
 *
 * Комикс по ИИ-грамотности: 10 страниц = 10 частей, каждая часть — картинка
 * страницы целиком (picture-book режим ридера), partTexts набраны по репликам
 * и используются только сверялкой чтения вслух.
 *
 * Книга БЕСПЛАТНАЯ (price = 0): родитель добавляет её ребёнку без Kaspi,
 * ребёнок может взять её себе сам. sortWeight = 50 — сразу после
 * «ДАНА БАЛА» І бөлім (100) и перед остальным каталогом (0 и ниже).
 *
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
async function seedIskanderLiga() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  // Эксперт — «Команда Barsum» (тот же аккаунт, что у книг «Барсум и город
  // потерянных слов»); создаётся сидом seed:barsum-city.
  const EXPERT_NAME = 'Команда Barsum';
  const EXPERT_EMAIL = 'expert@test.kz';
  const COINS_PER_PART = 100; // 100 × 10 частей = 1000 монет за книгу

  const user = await usersService.findByEmail(EXPERT_EMAIL);
  if (!user || user.role !== UserRole.EXPERT) {
    throw new Error(`Эксперт ${EXPERT_EMAIL} не найден — сначала запустите: npm run seed:barsum-city`);
  }
  const expert = await expertsService.findByUserId(user.id);
  if (!expert || expert.status !== ExpertStatus.APPROVED) {
    throw new Error(`Профиль эксперта ${EXPERT_EMAIL} не approved — сначала запустите: npm run seed:barsum-city`);
  }
  console.log('✓ Эксперт найден:', EXPERT_NAME, EXPERT_EMAIL);

  const title = 'Искандер и Лига Цифрового Света';
  const description =
    'Комикс по ИИ-грамотности для детей. Искандер, Айя и Темирлан вместе со снежным барсом Барсумом ' +
    'разоблачают фейковое сообщение в школьном чате, поддельное видео «от директора», игру, которая ' +
    'выманивает личные данные, и слух, разлетевшийся по классу. Шесть глав — шесть правил безопасного ' +
    'общения с искусственным интеллектом. Ребёнок читает страницы вслух и получает монеты. ' +
    'Книга бесплатная. Автор — Сабазова Жанар (Steppe Tech Lab).';

  const data: Partial<Challenge> = {
    title,
    bookTitle: title,
    bookAuthor: 'Сабазова Жанар',
    description,
    pagesTotal: ISKANDER_LIGA_PART_IMAGES.length,
    pagesPerPart: 1,
    totalParts: ISKANDER_LIGA_PART_TEXTS.length,
    partTexts: ISKANDER_LIGA_PART_TEXTS,
    partTitles: ISKANDER_LIGA_PART_TITLES,
    partImages: ISKANDER_LIGA_PART_IMAGES,
    coverImage: ISKANDER_LIGA_COVER,
    price: 0, // бесплатно
    costPrice: 0,
    coinsReward: COINS_PER_PART * ISKANDER_LIGA_PART_TEXTS.length,
    ageMin: 8,
    ageMax: 14,
    retellRequired: false,
    category: ChallengeCategory.READING,
    language: 'ru',
    status: ChallengeStatus.PUBLISHED,
    authorId: user.id,
    sortWeight: 50, // сразу после «ДАНА БАЛА» І бөлім (sortWeight 100)
  };

  const existing = await challengeRepo.findOne({ where: { coverImage: ISKANDER_LIGA_COVER } });
  if (!existing) {
    await challengeRepo.save(challengeRepo.create({ ...data, membersCount: 0 }));
    console.log(
      `✓ Создана книга (published): ${title} — ${data.totalParts} частей, бесплатно, ${data.coinsReward} монет`,
    );
  } else {
    Object.assign(existing, data);
    await challengeRepo.save(existing);
    console.log(`~ Книга уже есть — контент синхронизирован: ${title} (${existing.id})`);
  }

  console.log('\nseed-iskander-liga завершён.');
  await app.close();
}

seedIskanderLiga().catch((err) => {
  console.error('seed-iskander-liga failed:', err);
  process.exit(1);
});
