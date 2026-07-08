import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildrenController } from './children.controller';
import { PublicChildrenController } from './public-children.controller';
import { ChildrenService } from './children.service';
import { Child } from './entities/child.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Child]), FilesModule],
  controllers: [ChildrenController, PublicChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
