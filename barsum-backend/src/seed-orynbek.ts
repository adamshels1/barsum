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
  BULLING_COVER,
  BULLING_PART_TITLES,
  BULLING_PART_TEXTS,
  BULLING_PART_IMAGES,
} from './challenges/orynbek-bulling';

/**
 * Точечный (идемпотентный) сид эксперта-автора «Орынбек Нұрсұлтан Орыналыұлы»
 * и его картиночной книги «Буллинг деген не?».
 *
 * Книга — правовой ликбез о буллинге на казахском: признаки и формы буллинга,
 * ответственность по КоАП РК, советы ребёнку, разделы для родителей и учителей.
 * Развороты исходного PDF разрезаны на книжные страницы и сгруппированы по темам
 * (12 частей), иллюстрация всегда склеена со своим текстом.
 *
 * sortWeight = 90 — книга встаёт ЧЕТВЁРТОЙ в каталоге, то есть сразу после карточки
 * «Своя книжка» (она вставлена фронтом после первых трёх книг), но ниже закреплённых
 * «Барсум» рус./каз. (300/200) и «ДАНА БАЛА» (100). Сортировка: sortWeight DESC, createdAt DESC.
 *
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
const NAME = 'Орынбек Нұрсұлтан';
const EMAIL = 'orynbek@barsum.app';
const PASSWORD = 'test123'; // ВРЕМЕННЫЙ — сменить после первого входа
const COMMISSION = 30; // доля автора, % от цены книги
const BOOK_TITLE = 'Буллинг деген не?';
const PRICE = 2000; // ₸ — цена родителю
const REWARD = 2000; // монет ребёнку за всю книгу (делится на части)
const SORT_WEIGHT = 90;

async function seedOrynbek() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  // 1) Пользователь-эксперт (автор)
  let user = await usersService.findByEmail(EMAIL);
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Создан эксперт-пользователь (автор):', user.email);
  } else {
    user.name = NAME;
    user.role = UserRole.EXPERT;
    user.password = await bcrypt.hash(PASSWORD, 10); // синкаем пароль на каждый запуск
    await userRepo.save(user);
    console.log('~ Эксперт-пользователь уже есть, обновлён (пароль синкнут):', user.email);
  }

  // 2) Профиль эксперта (approved + комиссия)
  let expert = await expertsService.findByUserId(user.id);
  if (!expert) expert = await expertsService.createForUser(user.id);
  await expertsService.updateProfile(user.id, {
    specialization: 'Заңгер, балаларға арналған құқықтық сауаттылық',
    whatsapp: '+7 700 000 0000',
    bio:
      'Заңгер, «Құқық қорғаны» заңгерлік компаниясының басшысы. ҚР Қаржылық мониторинг ' +
      'агенттігінің Қоғамдық кеңес мүшесі, ҚР Ішкі істер министрлігінің Қоғамдық кеңесін ' +
      'қалыптастыру бойынша жұмыс тобының мүшесі. Мектептерде «Заң мен тәртіп» ' +
      'факультативін жүргізеді.',
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, COMMISSION);
  console.log(`✓ Эксперт готов (approved, ${COMMISSION}%)`);

  // 3) Книга «Буллинг деген не?»
  const fields: Partial<Challenge> = {
    title: BOOK_TITLE,
    bookTitle: BOOK_TITLE,
    bookAuthor: NAME,
    description:
      'Буллинг деген не, оның белгілері мен формалары қандай, заң бойынша қандай жауапкершілік ' +
      'бар және қысымға тап болсаң не істеу керек? Заңгер Нұрсұлтан Орынбектің суретті кітабы ' +
      'балаға өзін қорғауды үйретеді, ата-аналар мен мұғалімдерге әдістемелік нұсқаулық береді. ' +
      'Әр бөлім — жеке тақырып: бала суретті бетті дауыстап оқиды, AI оқуын бағалайды.',
    pagesTotal: 22,
    pagesPerPart: 2,
    totalParts: BULLING_PART_TEXTS.length,
    partTexts: BULLING_PART_TEXTS,
    partTitles: BULLING_PART_TITLES,
    partImages: BULLING_PART_IMAGES,
    coverImage: BULLING_COVER,
    price: PRICE,
    coinsReward: REWARD,
    ageMin: 7,
    ageMax: 14,
    retellRequired: false,
    category: ChallengeCategory.READING,
    language: 'kk',
    status: ChallengeStatus.PUBLISHED,
    authorId: user.id,
    sortWeight: SORT_WEIGHT,
  };

  const existing = await challengeRepo.findOne({ where: { title: BOOK_TITLE } });
  if (!existing) {
    await challengeRepo.save(challengeRepo.create({ ...fields, membersCount: 0 }));
    console.log(`✓ Создана книга: ${BOOK_TITLE} — ${fields.totalParts} частей, ${PRICE}₸, ${REWARD} монет`);
  } else {
    // Контент синкаем — повторный запуск обновляет книгу после перегенерации картинок.
    Object.assign(existing, fields);
    await challengeRepo.save(existing);
    console.log(`~ Книга уже есть — контент синхронизирован: ${BOOK_TITLE} (${existing.id})`);
  }

  console.log('\nseed-orynbek завершён.');
  console.log(`   Логин:  ${EMAIL}`);
  console.log(`   Пароль: ${PASSWORD}`);
  await app.close();
}

seedOrynbek().catch((err) => {
  console.error('seed-orynbek failed:', err);
  process.exit(1);
});
