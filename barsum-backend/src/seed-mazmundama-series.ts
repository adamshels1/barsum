import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { UserRole, ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import { MAZMUNDAMA_BOOKS } from './challenges/mazmundama-series';

/**
 * Идемпотентный сид серий издательства «Мазмұндама»:
 * «Әдепті балақай» (каз.) и «Как вести себя хорошо» (рус.) — 19 картиночных книг.
 *
 * Расчёт с издательством идёт НЕ процентом, а по СЕБЕСТОИМОСТИ экземпляра
 * (прайс «Мазмұндама баспасы»: 427 ₸ за книгу серии) — поле challenge.costPrice.
 * Цена для родителя — 1000 ₸, ребёнку столько же монет за прочтение.
 *
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
const NAME = '«Мазмұндама» қоғамдық қоры';
const EMAIL = 'mazmundama@barsum.app';
const PASSWORD = 'test123'; // используется только при первом создании пользователя
const PRICE = 1000; // ₸ — цена для родителя
const COST_PRICE = 427; // ₸ — себестоимость по прайсу издательства (выплата правообладателю)
const REWARD = 1000; // монет ребёнку за прочтение всей книги
const AGE_MIN = 5;
const AGE_MAX = 7;

async function seedMazmundamaSeries() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  // 1) Эксперт-издательство (уже создан сидом seed-mazmundama, но подстрахуемся)
  let user = await usersService.findByEmail(EMAIL);
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Создан эксперт-пользователь (издательство):', user.email);
  } else {
    console.log('~ Эксперт-пользователь уже есть:', user.email);
  }

  let expert = await expertsService.findByUserId(user.id);
  if (!expert) expert = await expertsService.createForUser(user.id);
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
    console.log('✓ Эксперт переведён в approved');
  }

  // 2) Книги серий
  let created = 0;
  let updated = 0;
  for (const b of MAZMUNDAMA_BOOKS) {
    const title = `${b.bookTitle} (${b.series})`;
    const fields = {
      title,
      bookTitle: b.bookTitle,
      bookAuthor: NAME,
      description: b.description,
      pagesTotal: 24,
      pagesPerPart: 2,
      totalParts: b.partTexts.length,
      partTexts: b.partTexts,
      partImages: b.partImages,
      coverImage: b.cover,
      price: PRICE,
      costPrice: COST_PRICE,
      coinsReward: REWARD,
      ageMin: AGE_MIN,
      ageMax: AGE_MAX,
      retellRequired: false,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
    };

    const existing = await challengeRepo.findOne({ where: { title } });
    if (!existing) {
      await challengeRepo.save(challengeRepo.create({ ...fields, membersCount: 0 }));
      created++;
      console.log(`✓ Создана книга: ${title} (${fields.totalParts} частей, ${PRICE}₸, себестоимость ${COST_PRICE}₸)`);
    } else {
      // Контент/цены синкаем — повторный запуск обновляет книгу после перегенерации.
      Object.assign(existing, fields);
      await challengeRepo.save(existing);
      updated++;
      console.log(`~ Обновлена книга: ${title} (${fields.totalParts} частей)`);
    }
  }

  console.log(`\nseed-mazmundama-series завершён: создано ${created}, обновлено ${updated}.`);
  await app.close();
}

seedMazmundamaSeries().catch((err) => {
  console.error('seed-mazmundama-series failed:', err);
  process.exit(1);
});
