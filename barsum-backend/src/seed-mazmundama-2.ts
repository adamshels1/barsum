import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ExpertsService } from './experts/experts.service';
import { UserRole, ExpertStatus, ChallengeStatus, ChallengeCategory } from './common/enums';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { Repository } from 'typeorm';
import { MAZMUNDAMA_2_BOOKS } from './challenges/mazmundama-2';

/**
 * Вторая партия книг издательства «Мазмұндама» — 22 картиночные книги на казахском:
 *   «Шытырман ертегілер» (9, 6+), «Мектепте үйретпейтін дағдылар» (3, 8+),
 *   «Өнертабыстар тарихы» (10, 12+).
 *
 * Цена родителю — 1500 ₸ (по прайсу заказчика), расчёт с издательством по СЕБЕСТОИМОСТИ
 * экземпляра (challenge.costPrice: 630 / 622 / 616 ₸ в зависимости от серии), а не процентом.
 *
 * sortWeight отрицательный — новинки должны встать В КОНЕЦ каталога, а не впереди
 * закреплённых книг («Барсум», «ДАНА БАЛА»): сортировка идёт sortWeight DESC, createdAt DESC.
 *
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
const NAME = '«Мазмұндама» қоғамдық қоры';
const EMAIL = 'mazmundama@barsum.app';
const PASSWORD = 'test123'; // используется только при первом создании пользователя
const PRICE = 1500; // ₸ — цена для родителя
const REWARD = 1500; // монет ребёнку за прочтение всей книги (делится на части)
const SORT_WEIGHT_BASE = -10; // ниже всех существующих книг (у тех 0 и выше)

async function seedMazmundama2() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

  // 1) Эксперт-издательство (создан ещё первой партией — подстрахуемся)
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

  // 2) Книги
  let created = 0;
  let updated = 0;
  for (const [i, b] of MAZMUNDAMA_2_BOOKS.entries()) {
    const title = `${b.bookTitle} (${b.series})`;
    const fields = {
      title,
      bookTitle: b.bookTitle,
      bookAuthor: NAME,
      description: b.description,
      pagesTotal: b.pagesTotal,
      pagesPerPart: b.pagesPerPart,
      totalParts: b.partTexts.length,
      partTexts: b.partTexts,
      partImages: b.partImages,
      coverImage: b.cover,
      price: PRICE,
      costPrice: b.costPrice,
      coinsReward: REWARD,
      ageMin: b.ageMin,
      ageMax: b.ageMax,
      retellRequired: false,
      category: ChallengeCategory.READING,
      language: b.lang,
      sortWeight: SORT_WEIGHT_BASE - i, // порядок внутри партии = порядок в прайсе
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
    };

    const existing = await challengeRepo.findOne({ where: { title } });
    if (!existing) {
      await challengeRepo.save(challengeRepo.create({ ...fields, membersCount: 0 }));
      created++;
      console.log(
        `✓ Создана книга: ${title} — ${fields.totalParts} частей, ${PRICE}₸ (себестоимость ${b.costPrice}₸), ${b.ageMin}–${b.ageMax} лет`,
      );
    } else {
      // Контент/цены синкаем — повторный запуск обновляет книгу после перегенерации.
      Object.assign(existing, fields);
      await challengeRepo.save(existing);
      updated++;
      console.log(`~ Обновлена книга: ${title} (${fields.totalParts} частей)`);
    }
  }

  console.log(`\nseed-mazmundama-2 завершён: создано ${created}, обновлено ${updated}.`);
  await app.close();
}

seedMazmundama2().catch((err) => {
  console.error('seed-mazmundama-2 failed:', err);
  process.exit(1);
});
