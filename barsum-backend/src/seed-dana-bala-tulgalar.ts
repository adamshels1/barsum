import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { UserRole, ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import {
  DANA_BALA_TULGALAR_PARTS,
  DANA_BALA_TULGALAR_TITLES,
  DANA_BALA_TULGALAR_IMAGES,
  DANA_BALA_TULGALAR_AUDIOS,
} from './challenges/dana-bala-tulgalar';

/**
 * Точечный (идемпотентный) сид ВТОРОЙ книги эксперта Даны Нұржігіт —
 * «ДАНА БАЛА» І бөлім (9 рассказов о великих тұлға, с иллюстрациями
 * и авторской озвучкой каждой части).
 * Статус PUBLISHED — сразу в маркетплейсе, 3000₸, с пересказом.
 *
 * У эксперта уже есть первая (draft) книга с ТАКИМ ЖЕ названием, поэтому
 * эта книга ищется по coverImage, а не по title — иначе сиды перетирали бы
 * контент друг друга. Эксперт (пользователь/профиль/комиссия) здесь только
 * дочитывается: его создаёт seed:dana-nurzhigit.
 */
const COVER = '/books/dana-bala-tulgalar/cover.jpg';

async function seedDanaBalaTulgalar() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  const NAME = 'Дана Нұржігіт';
  const EMAIL = 'nurzhigit@barsum.app';

  // 1) Эксперт должен уже существовать (создаётся сидом seed:dana-nurzhigit).
  const user = await usersService.findByEmail(EMAIL);
  if (!user || user.role !== UserRole.EXPERT) {
    throw new Error(`Эксперт ${EMAIL} не найден — сначала запустите: npm run seed:dana-nurzhigit`);
  }
  const expert = await expertsService.findByUserId(user.id);
  if (!expert || expert.status !== ExpertStatus.APPROVED) {
    throw new Error(`Профиль эксперта ${EMAIL} не approved — сначала запустите: npm run seed:dana-nurzhigit`);
  }
  console.log('✓ Эксперт найден:', NAME, EMAIL);

  // 2) Книга: 9 частей, published, 3000₸, пересказ обязателен.
  const title = '«ДАНА БАЛА» І бөлім';
  const description =
    'Қазақтың ұлы тұлғалары туралы 9 танымдық әңгіме: Абай, Шоқан, Ыбырай, Сәкен, Бауыржан, Мұхтар, Өзбекәлі, Бердібек және Санжар. Бала әр бөлімді суретімен қоса дауыстап оқып, содан кейін өз сөзімен айтып береді (пересказ).';

  const existing = await challengeRepo.findOne({ where: { coverImage: COVER } });
  const data: Partial<Challenge> = {
    title,
    bookTitle: title,
    bookAuthor: NAME,
    description,
    pagesTotal: DANA_BALA_TULGALAR_PARTS.length,
    pagesPerPart: 1,
    totalParts: DANA_BALA_TULGALAR_PARTS.length,
    partTexts: DANA_BALA_TULGALAR_PARTS,
    partTitles: DANA_BALA_TULGALAR_TITLES,
    partImages: DANA_BALA_TULGALAR_IMAGES,
    partAudios: DANA_BALA_TULGALAR_AUDIOS,
    coverImage: COVER,
    price: 3000,
    coinsReward: 3000,
    ageMin: 7,
    ageMax: 12,
    retellRequired: true,
    category: ChallengeCategory.READING,
    status: ChallengeStatus.PUBLISHED,
    authorId: user.id,
  };

  if (!existing) {
    const book = challengeRepo.create({ ...data, membersCount: 0 });
    await challengeRepo.save(book);
    console.log(`✓ Создана книга (published): ${title} — ${DANA_BALA_TULGALAR_PARTS.length} частей, 3000₸, с пересказом`);
  } else {
    Object.assign(existing, data);
    await challengeRepo.save(existing);
    console.log(`✓ Книга уже есть — контент синхронизирован: ${title} (${existing.id})`);
  }

  console.log('\nseed-dana-bala-tulgalar завершён.');
  await app.close();
}

seedDanaBalaTulgalar().catch((err) => {
  console.error('seed-dana-bala-tulgalar failed:', err);
  process.exit(1);
});
