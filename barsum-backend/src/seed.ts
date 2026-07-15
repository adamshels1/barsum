import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ChildrenService } from './children/children.service';
import { ExpertsService } from './experts/experts.service';
import { UserRole, ExpertStatus, ChallengeStatus, ChallengeCategory, EnrollmentStatus, RewardType } from './common/enums';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Challenge } from './challenges/entities/challenge.entity';
import { User } from './users/entities/user.entity';
import { Reward } from './rewards/entities/reward.entity';
import { ChallengeEnrollment } from './sessions/entities/enrollment.entity';
import { Repository } from 'typeorm';
import { BARSUM_COLLECTION_PARTS, BARSUM_COLLECTION_TITLES, BARSUM_COLLECTION_IMAGES } from './challenges/barsum-collection';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  const usersService = app.get(UsersService);
  const childrenService = app.get(ChildrenService);
  const expertsService = app.get(ExpertsService);
  const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));
  const rewardRepo = app.get<Repository<Reward>>(getRepositoryToken(Reward));
  const enrollmentRepo = app.get<Repository<ChallengeEnrollment>>(getRepositoryToken(ChallengeEnrollment));

  // Admin
  let admin = await usersService.findByEmail('admin@barsum.kz');
  if (!admin) {
    admin = await usersService.create({
      email: 'admin@barsum.kz',
      password: await bcrypt.hash('admin123', 10),
      name: 'Администратор',
      role: UserRole.ADMIN,
    });
    console.log('✓ Created admin:', admin.email);
  } else {
    console.log('~ Admin already exists');
  }

  // Parent
  let parent = await usersService.findByEmail('parent@test.kz');
  if (!parent) {
    parent = await usersService.create({
      email: 'parent@test.kz',
      password: await bcrypt.hash('test123', 10),
      name: 'Тестовый родитель',
      role: UserRole.PARENT,
    });
    console.log('✓ Created parent:', parent.email);
  } else {
    console.log('~ Parent already exists');
  }

  // Child
  let child = await childrenService.findByLogin('ayla_2024');
  if (!child) {
    child = await childrenService.create({
      name: 'Айла',
      age: 10,
      login: 'ayla_2024',
      password: 'test123',
      parentId: parent.id,
    });
    console.log('✓ Created child:', child.login);
  } else {
    console.log('~ Child already exists');
  }

  // Expert user
  let expertUser = await usersService.findByEmail('expert@test.kz');
  if (!expertUser) {
    expertUser = await usersService.create({
      email: 'expert@test.kz',
      password: await bcrypt.hash('test123', 10),
      name: 'Тестовый эксперт',
      role: UserRole.EXPERT,
    });
    console.log('✓ Created expert user:', expertUser.email);
  } else {
    console.log('~ Expert user already exists');
  }

  let expert = await expertsService.findByUserId(expertUser.id);
  if (!expert) {
    expert = await expertsService.createForUser(expertUser.id);
  }
  if (expert.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(expert.id, ExpertStatus.APPROVED);
    console.log('✓ Approved expert');
  }

  // Реальный эксперт-автор сборника «Мейірімді бала» с долей 30%.
  const AIGUL_NAME = 'Дана Аманжолқызы';
  const AIGUL_EMAIL = 'dana@barsum.app';
  const AIGUL_LEGACY_EMAIL = 'aigul@barsum.kz';
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  let aigulUser =
    (await usersService.findByEmail(AIGUL_EMAIL)) ||
    (await usersService.findByEmail(AIGUL_LEGACY_EMAIL));
  if (!aigulUser) {
    aigulUser = await usersService.create({
      email: AIGUL_EMAIL,
      password: await bcrypt.hash('test123', 10),
      name: AIGUL_NAME,
      role: UserRole.EXPERT,
    });
    console.log('✓ Created expert user:', aigulUser.email);
  } else if (aigulUser.email !== AIGUL_EMAIL || aigulUser.name !== AIGUL_NAME) {
    // Мигрируем существующего пользователя (тот же id — книга остаётся за ним).
    aigulUser.email = AIGUL_EMAIL;
    aigulUser.name = AIGUL_NAME;
    await userRepo.save(aigulUser);
    console.log('✓ Updated expert user →', AIGUL_NAME, AIGUL_EMAIL);
  } else {
    console.log('~ Expert user already exists:', aigulUser.email);
  }

  let aigul = await expertsService.findByUserId(aigulUser.id);
  if (!aigul) {
    aigul = await expertsService.createForUser(aigulUser.id);
  }
  await expertsService.updateProfile(aigulUser.id, {
    specialization: 'Балалар әдебиеті және оқу сауаттылығы',
    whatsapp: '+7 701 234 5678',
    bio: '10 жылдан астам тәжірибесі бар бастауыш сынып мұғалімі. Балаларды қазақ тілінде мәнерлеп оқуға және мәтінді өз сөзімен айтуға үйретеді.',
  });
  if (aigul.status !== ExpertStatus.APPROVED) {
    await expertsService.updateStatus(aigul.id, ExpertStatus.APPROVED);
  }
  await expertsService.setCommission(aigul.id, 30);
  console.log('✓ Expert Айгүл ready (approved, 30%)');

  // Challenges
  const challengeData = [
    {
      title: 'Алиса в Стране чудес',
      bookTitle: 'Алиса в Стране чудес',
      bookAuthor: 'Льюис Кэрролл',
      description: 'Классическая история о девочке Алисе, попавшей в волшебный мир. Развивает фантазию и любовь к чтению.',
      pagesTotal: 200,
      pagesPerPart: 7,
      totalParts: 30,
      price: 2990,
      coinsReward: 500,
      ageMin: 8,
      ageMax: 12,
    },
    {
      title: 'Маленький принц',
      bookTitle: 'Маленький принц',
      bookAuthor: 'Антуан де Сент-Экзюпери',
      description: 'Философская сказка о маленьком принце, путешествующем по планетам. Учит доброте и ответственности.',
      pagesTotal: 180,
      pagesPerPart: 6,
      totalParts: 30,
      price: 2490,
      coinsReward: 500,
      ageMin: 9,
      ageMax: 14,
    },
    {
      title: 'Гарри Поттер и философский камень',
      bookTitle: 'Гарри Поттер и философский камень',
      bookAuthor: 'Дж. К. Роулинг',
      description: 'Первая книга о юном волшебнике Гарри Поттере. Захватывающее приключение в волшебном мире.',
      pagesTotal: 320,
      pagesPerPart: 11,
      totalParts: 30,
      price: 3490,
      coinsReward: 500,
      ageMin: 10,
      ageMax: 14,
    },
  ];

  for (const data of challengeData) {
    const existing = await challengeRepo.findOne({ where: { title: data.title } });
    if (!existing) {
      const challenge = challengeRepo.create({
        ...data,
        category: ChallengeCategory.READING,
        status: ChallengeStatus.PUBLISHED,
        authorId: expertUser.id,
        membersCount: 0,
      });
      await challengeRepo.save(challenge);
      console.log('✓ Created challenge:', data.title);
    } else {
      console.log('~ Challenge already exists:', data.title);
    }
  }

  // Книга-сборник «Мейірімді бала» — 9 рассказов, цена 10 000 ₸, с пересказом, автор — Айгүл (30%).
  const collectionTitle = 'Мейірімді бала: әңгімелер жинағы';
  const existingCollection = await challengeRepo.findOne({ where: { title: collectionTitle } });
  if (!existingCollection) {
    const collection = challengeRepo.create({
      title: collectionTitle,
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
      authorId: aigulUser.id,
      membersCount: 0,
    });
    await challengeRepo.save(collection);
    console.log('✓ Created collection book:', collectionTitle, `(${BARSUM_COLLECTION_PARTS.length} parts, 3000₸)`);
  } else {
    console.log('~ Collection book already exists:', collectionTitle);
  }

  // Rewards for test parent
  const rewardData = [
    { name: 'Мороженое', cost: 200, type: RewardType.SNACK },
    { name: 'Прогулка в парке', cost: 300, type: RewardType.TIME },
    { name: 'Игровая приставка (1 час)', cost: 500, type: RewardType.TIME },
    { name: 'Пицца', cost: 1500, type: RewardType.SNACK },
    { name: 'Кино', cost: 3000, type: RewardType.EXPERIENCE },
  ];

  for (const data of rewardData) {
    const existing = await rewardRepo.findOne({ where: { name: data.name, parentId: parent.id } });
    if (!existing) {
      const reward = rewardRepo.create({
        ...data,
        parentId: parent.id,
        isActive: true,
      });
      await rewardRepo.save(reward);
      console.log('✓ Created reward:', data.name);
    } else {
      console.log('~ Reward already exists:', data.name);
    }
  }

  // Enrollment: ayla_2024 → first challenge
  const firstChallenge = await challengeRepo.findOne({ where: { title: 'Алиса в Стране чудес' } });
  if (firstChallenge) {
    const existing = await enrollmentRepo.findOne({
      where: { childId: child.id, challengeId: firstChallenge.id },
    });
    if (!existing) {
      const enrollment = enrollmentRepo.create({
        childId: child.id,
        challengeId: firstChallenge.id,
        parentId: parent.id,
        status: EnrollmentStatus.ACTIVE,
        startedAt: new Date(),
      });
      await enrollmentRepo.save(enrollment);
      console.log('✓ Created enrollment: ayla_2024 → Алиса в Стране чудес');
    } else {
      console.log('~ Enrollment already exists');
    }
  }

  console.log('\nSeed completed!');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
