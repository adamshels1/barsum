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
  BARSUM_CITY_COVER,
  BARSUM_CITY_PART_TEXTS,
  BARSUM_CITY_PART_TITLES,
  BARSUM_CITY_PART_IMAGES,
} from './challenges/barsum-city';
import {
  BARSUM_CITY_KZ_COVER,
  BARSUM_CITY_KZ_PART_TEXTS,
  BARSUM_CITY_KZ_PART_TITLES,
  BARSUM_CITY_KZ_PART_IMAGES,
} from './challenges/barsum-city-kz';

/**
 * Точечный (идемпотентный) сид фирменных книг Barsum «Барсум и город потерянных слов»
 * и её казахской версии «Барсум және жоғалған сөздер қаласы» (две отдельные книги).
 *
 * Особенность: книги БЕСПЛАТНЫЕ (price = 0) — родитель добавляет их ребёнку без оплаты
 * (кнопка «Добавить», без Kaspi). Ребёнок читает 9 частей вслух и зарабатывает
 * coinsReward монет (112 за часть). После прочтения всех частей книга остаётся
 * в «Моей библиотеке» для перечитывания — там сессий нет, монеты больше не капают.
 *
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
async function seedBarsumCity() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  // Автор — «внутренний» эксперт платформы: это переименованный тестовый эксперт,
  // под которым уже лежит весь демо-контент Barsum. Отдельного аккаунта не заводим.
  const NAME = 'Команда Barsum';
  const EMAIL = 'expert@test.kz';
  const PASSWORD = 'test123'; // используется, только если пользователя ещё нет
  const COMMISSION = 0; // применяется ТОЛЬКО к новому профилю эксперта (см. ниже)
  const PRICE = 0; // ₸ — бесплатно, родитель добавляет без оплаты
  // Монеты ребёнку за всю книгу: 112 × 9 частей. Делится нацело, чтобы округление
  // не съедало монеты (обещанная «тысяча» с запасом).
  const COINS_PER_PART = 112;

  // 1) Пользователь-эксперт (издатель книги — сама платформа)
  let user = await usersService.findByEmail(EMAIL);
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Создан эксперт-пользователь:', user.email);
  } else if (user.name !== NAME || user.role !== UserRole.EXPERT) {
    user.name = NAME;
    user.role = UserRole.EXPERT;
    await userRepo.save(user);
    console.log('✓ Обновлён эксперт-пользователь →', NAME, EMAIL);
  } else {
    console.log('~ Эксперт-пользователь уже есть:', user.email);
  }

  // 2) Профиль эксперта. У существующего эксперта НЕ трогаем ни комиссию, ни профиль:
  // под этим аккаунтом лежат другие книги, и их выплаты считаются по его текущему %.
  let expert = await expertsService.findByUserId(user.id);
  if (!expert) {
    expert = await expertsService.createForUser(user.id);
    await expertsService.updateProfile(user.id, {
      specialization: 'Детская литература Barsum',
      whatsapp: '+7 700 000 0000',
      bio: 'Собственные истории платформы Barsum — про снежного барса Барсума, который помогает детям полюбить чтение.',
    });
    await expertsService.setCommission(expert.id, COMMISSION);
    console.log(`✓ Создан профиль эксперта (${COMMISSION}%)`);
  } else {
    console.log(`~ Профиль эксперта уже есть (комиссия ${expert.commissionPct}% — не меняем)`);
  }
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }

  // 3) Книги (текстовые, 9 частей-сцен с иллюстрациями). Русская и казахская версии —
  // ОТДЕЛЬНЫЕ книги в каталоге: Challenge хранит один язык текста, а ребёнок читает
  // вслух на конкретном языке. Казахская стоит сразу за русской (sortWeight).
  const books = [
    {
      title: 'Барсум и город потерянных слов',
      description:
        'Мини-рассказ о мальчике Алане и снежном барсе Барсуме. Вместе они спасают Город историй ' +
        'от Пожирателя слов, который становится сильнее каждый раз, когда кто-то бросает книгу ' +
        'недочитанной. Девять коротких сцен с иллюстрациями: ребёнок читает вслух, AI оценивает ' +
        'чтение. Книга бесплатная — родитель просто добавляет её ребёнку.',
      partTexts: BARSUM_CITY_PART_TEXTS,
      partTitles: BARSUM_CITY_PART_TITLES,
      partImages: BARSUM_CITY_PART_IMAGES,
      coverImage: BARSUM_CITY_COVER,
      sortWeight: 100, // вторая книга в каталоге (после «ДАНА БАЛА»)
    },
    {
      title: 'Барсум және жоғалған сөздер қаласы',
      description:
        'Алан есімді бала мен қар барысы Барсум туралы шағын әңгіме. Олар бірге Оқиғалар қаласын ' +
        'Сөзжұтқыштан құтқарады — ол балалар кітапты соңына дейін оқымай тастаған сайын күшейе ' +
        'түседі. Иллюстрациялары бар тоғыз қысқа көрініс: бала дауыстап оқиды, AI оқуын бағалайды. ' +
        'Кітап тегін — ата-ана оны балаға жай ғана қосады.',
      partTexts: BARSUM_CITY_KZ_PART_TEXTS,
      partTitles: BARSUM_CITY_KZ_PART_TITLES,
      partImages: BARSUM_CITY_KZ_PART_IMAGES,
      coverImage: BARSUM_CITY_KZ_COVER,
      sortWeight: 90, // сразу за русской версией
    },
  ];

  for (const book of books) {
    const content = {
      bookTitle: book.title,
      bookAuthor: NAME,
      description: book.description,
      pagesTotal: 10,
      pagesPerPart: 1,
      totalParts: book.partTexts.length,
      partTexts: book.partTexts,
      partTitles: book.partTitles,
      partImages: book.partImages,
      coverImage: book.coverImage,
      price: PRICE,
      coinsReward: COINS_PER_PART * book.partTexts.length,
      ageMin: 6,
      ageMax: 9,
      retellRequired: false,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      sortWeight: book.sortWeight,
    };

    const existing = await challengeRepo.findOne({ where: { title: book.title } });
    if (!existing) {
      await challengeRepo.save(
        challengeRepo.create({ title: book.title, ...content, authorId: user.id, membersCount: 0 }),
      );
      console.log('✓ Создана книга:', book.title, `(${content.totalParts} частей, бесплатно, ${content.coinsReward} монет)`);
    } else {
      // Идемпотентно обновляем контент (на случай перегенерации из docx) и автора —
      // чтобы книгу можно было перевесить на другой аккаунт эксперта повторным запуском.
      Object.assign(existing, content, { authorId: user.id });
      await challengeRepo.save(existing);
      console.log('~ Книга уже есть, контент обновлён:', book.title, `(${content.totalParts} частей)`);
    }
  }

  console.log('\nseed-barsum-city завершён.');
  await app.close();
}

seedBarsumCity().catch((err) => {
  console.error('seed-barsum-city failed:', err);
  process.exit(1);
});
