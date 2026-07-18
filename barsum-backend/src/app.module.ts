import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChildrenModule } from './children/children.module';
import { ChallengesModule } from './challenges/challenges.module';
import { SessionsModule } from './sessions/sessions.module';
import { RewardsModule } from './rewards/rewards.module';
import { CoinsModule } from './coins/coins.module';
import { ExpertsModule } from './experts/experts.module';
import { FilesModule } from './files/files.module';
import { EmailModule } from './email/email.module';
import { AiModule } from './ai/ai.module';
import { PaymentsModule } from './payments/payments.module';
import { DreamsModule } from './dreams/dreams.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';
import { CollabModule } from './collab/collab.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NotificationsModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5435'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'barsum',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ChildrenModule,
    ChallengesModule,
    SessionsModule,
    RewardsModule,
    CoinsModule,
    ExpertsModule,
    FilesModule,
    EmailModule,
    AiModule,
    PaymentsModule,
    DreamsModule,
    AdminModule,
    PushModule,
    CollabModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
