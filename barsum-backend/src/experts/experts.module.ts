import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpertsController } from './experts.controller';
import { ExpertsService } from './experts.service';
import { Expert } from './entities/expert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expert])],
  controllers: [ExpertsController],
  providers: [ExpertsService],
  exports: [ExpertsService],
})
export class ExpertsModule {}
