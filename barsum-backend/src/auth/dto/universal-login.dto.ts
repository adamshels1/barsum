import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UniversalLoginDto {
  @ApiProperty({ description: 'Email (для родителя/эксперта) или логин (для ребёнка)' })
  @IsString()
  identifier: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string;
}
