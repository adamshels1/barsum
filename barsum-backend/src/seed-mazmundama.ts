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
import { AKE_COVER, AKE_PART_TEXTS, AKE_PART_IMAGES } from './challenges/mazmundama-ake';

/**
 * Точечный (идемпотентный) сид для издательства-эксперта «Мазмұндама»
 * и его картиночной книги «Әке» (серия «Әдепті балақай»).
 * Картиночная книга: 1 страница = 1 часть. partImages — страницы-иллюстрации
 * (их стиль и шрифты), partTexts — текст страниц (AI сверяет чтение вслух).
 * НИЧЕГО не удаляет — безопасно запускать повторно и на проде.
 */
async function seedMazmundama() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const NAME = '«Мазмұндама» қоғамдық қоры';
  const EMAIL = 'mazmundama@barsum.app';
  const PASSWORD = 'test123'; // ВРЕМЕННЫЙ — смените после проверки.
  const COMMISSION = 40; // доля издательства в % от цены книги (настраивается админом)

  // 1) Пользователь-эксперт (издательство)
  let user = await usersService.findByEmail(EMAIL);
  if (!user) {
    user = await usersService.create({
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Создан эксперт-пользователь (издательство):', user.email);
  } else if (user.name !== NAME || user.role !== UserRole.EXPERT) {
    user.name = NAME;
    user.role = UserRole.EXPERT;
    await userRepo.save(user);
    console.log('✓ Обновлён эксперт-пользователь →', NAME, EMAIL);
  } else {
    console.log('~ Эксперт-пользователь уже есть:', user.email);
  }

  // 2) Профиль эксперта (approved)
  let expert = await expertsService.findByUserId(user.id);
  if (!expert) expert = await expertsService.createForUser(user.id);
  await expertsService.updateProfile(user.id, {
    specialization: 'Балаларға арналған кітап баспасы',
    whatsapp: '+7 700 000 0000',
    bio: 'Қазақ тіліндегі сапалы балалар кітаптарын шығаратын қоғамдық қор. «Әдепті балақай» сериясы — балаларды әдепке, сыйластыққа және отбасылық құндылықтарға баулиды.',
  });
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(expert.id, COMMISSION);
  console.log(`✓ Эксперт готов (approved, ${COMMISSION}%)`);

  // 3) Книга «Әке» (картиночная, 1 страница = 1 часть)
  const title = 'Әке (Әдепті балақай)';
  const existing = await challengeRepo.findOne({ where: { title } });
  if (!existing) {
    const book = challengeRepo.create({
      title,
      bookTitle: 'Әке',
      bookAuthor: '«Мазмұндама» қоғамдық қоры',
      description:
        'Суретті кітап «Әдепті балақай» сериясынан: бала әкесіне қалай құрмет көрсету керегін үйренеді. Әр бет — жеке иллюстрация мен қысқа диалог. Бала бетті дауыстап оқиды, AI оқуын бағалайды.',
      pagesTotal: 24,
      pagesPerPart: 1,
      totalParts: AKE_PART_TEXTS.length,
      partTexts: AKE_PART_TEXTS,
      partImages: AKE_PART_IMAGES,
      coverImage: AKE_COVER,
      price: 5000,
      coinsReward: 300,
      ageMin: 4,
      ageMax: 8,
      retellRequired: false,
      category: ChallengeCategory.READING,
      status: ChallengeStatus.PUBLISHED,
      authorId: user.id,
      membersCount: 0,
    });
    await challengeRepo.save(book);
    console.log('✓ Создана книга:', title, `(${AKE_PART_TEXTS.length} страниц-частей, 5000₸)`);
  } else {
    // Идемпотентно обновляем контент (на случай перегенерации PDF)
    existing.partTexts = AKE_PART_TEXTS;
    existing.partImages = AKE_PART_IMAGES;
    existing.coverImage = AKE_COVER;
    existing.totalParts = AKE_PART_TEXTS.length;
    await challengeRepo.save(existing);
    console.log('~ Книга уже есть, контент обновлён:', title);
  }

  console.log('\nseed-mazmundama завершён.');
  await app.close();
}

seedMazmundama().catch((err) => {
  console.error('seed-mazmundama failed:', err);
  process.exit(1);
});
