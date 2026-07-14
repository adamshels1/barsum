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
import { ALTYN_COVER, ALTYN_PART_TEXTS, ALTYN_PART_IMAGES } from './challenges/aibek-altyn-dostyk';

/**
 * Точечный (идемпотентный) сид для эксперта-автора «Айбек Қосан»
 * и его картиночной книги «Алтыннан да қымбат достық».
 * Создаёт user-эксперта (approved + комиссия), затем ПЕРЕПРИВЯЗЫВАЕТ уже
 * существующую книгу к этому автору и синкает картиночный контент
 * (1 часть = 1 страница; страницы-иллюстрации без текста склеены с соседней).
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
async function seedAibek() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const NAME = 'Айбек Қосан';
  const EMAIL = 'aibek.qosan@barsum.app';
  const PASSWORD = 'test123'; // ВРЕМЕННЫЙ — смените после первого входа.
  const COMMISSION = 40; // доля автора в % от цены книги (настраивается админом)
  const BOOK_TITLE = 'Алтыннан да қымбат достық';
  const PRICE = 3000; // ₸

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
    specialization: 'Балаларға арналған кітап авторы',
    whatsapp: '+7 700 000 0000',
    bio: 'Қазақ тіліндегі балалар кітаптарының авторы. «Алтыннан да қымбат достық» — достық, адалдық және табиғатты қорғау туралы суретті ертегілер жинағы.',
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, COMMISSION);
  console.log(`✓ Эксперт готов (approved, ${COMMISSION}%)`);

  // 3) Книга «Алтыннан да қымбат достық» — перепривязываем к автору + синк контента
  const existing = await challengeRepo.findOne({ where: { title: BOOK_TITLE } });
  if (!existing) {
    const book = challengeRepo.create({
      title: BOOK_TITLE,
      bookTitle: BOOK_TITLE,
      bookAuthor: NAME,
      description:
        'Суретті ертегі: орман достарының достығы алтыннан да қымбат екенін және табиғатты қорғау керегін баяндайды. Әр бет — жеке иллюстрация мен мәтін. Бала бетті дауыстап оқиды, AI оқуын бағалайды.',
      pagesTotal: 34,
      pagesPerPart: 1,
      totalParts: ALTYN_PART_TEXTS.length,
      partTexts: ALTYN_PART_TEXTS,
      partImages: ALTYN_PART_IMAGES,
      coverImage: ALTYN_COVER,
      price: PRICE,
      coinsReward: 500,
      ageMin: 6,
      ageMax: 10,
      retellRequired: false,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
      membersCount: 0,
    });
    await challengeRepo.save(book);
    console.log('✓ Создана книга:', BOOK_TITLE, `(${ALTYN_PART_TEXTS.length} частей, ${PRICE}₸)`);
  } else {
    existing.bookAuthor = NAME;
    existing.authorId = user.id; // ПЕРЕПРИВЯЗКА к настоящему автору
    existing.partTexts = ALTYN_PART_TEXTS;
    existing.partImages = ALTYN_PART_IMAGES;
    existing.coverImage = ALTYN_COVER;
    existing.totalParts = ALTYN_PART_TEXTS.length;
    existing.pagesPerPart = 1;
    existing.pagesTotal = 34;
    existing.ageMin = 6;
    existing.ageMax = 10;
    existing.status = ChallengeStatus.PUBLISHED;
    await challengeRepo.save(existing);
    console.log(
      '~ Книга уже есть: перепривязана к автору + контент обновлён:',
      BOOK_TITLE,
      `(${ALTYN_PART_TEXTS.length} частей)`,
    );
  }

  console.log('\nseed-aibek завершён.');
  console.log(`   Логин:  ${EMAIL}`);
  console.log(`   Пароль: ${PASSWORD}`);
  await app.close();
}

seedAibek().catch((err) => {
  console.error('seed-aibek failed:', err);
  process.exit(1);
});
