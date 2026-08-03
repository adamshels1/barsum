import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Child } from './children/entities/child.entity';
import { IsNull, Repository } from 'typeorm';

/**
 * Разовый бэкфилл `child.onboardedAt` для детей, заведённых ДО появления онбординга.
 *
 * Без него все существующие дети при следующем входе попадут на экран онбординга,
 * хотя приложением давно пользуются. Проставляем им дату регистрации (createdAt) —
 * то есть «онбординг считается пройденным».
 *
 * Идемпотентно: трогает только строки с onboardedAt IS NULL.
 * Запускать ОДИН РАЗ сразу после деплоя бэка с новой колонкой.
 * Прогон без записи: `npm run backfill:child-onboarded -- --dry`.
 */
async function backfill() {
  const dry = process.argv.includes('--dry');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const childRepo = app.get<Repository<Child>>(getRepositoryToken(Child));

  const pending = await childRepo.find({ where: { onboardedAt: IsNull() } });
  console.log(
    `Детей без onboardedAt: ${pending.length}${dry ? ' (--dry: только показываю)' : ''}\n`,
  );

  for (const child of pending) {
    console.log(`  ✓ ${child.name} (${child.login}) → ${child.createdAt.toISOString()}`);
    if (!dry) {
      child.onboardedAt = child.createdAt;
      await childRepo.save(child);
    }
  }

  console.log(dry ? '\nНичего не записано (--dry).' : '\nbackfill-child-onboarded завершён.');
  await app.close();
}

backfill().catch((err) => {
  console.error('backfill-child-onboarded failed:', err);
  process.exit(1);
});
