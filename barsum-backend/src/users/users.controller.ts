import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль' })
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    const { password, ...result } = user as any;
    return result;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль' })
  async updateMe(@Request() req: any, @Body() body: { name?: string; phone?: string }) {
    const user = await this.usersService.updateProfile(req.user.sub, body);
    const { password, ...result } = user as any;
    return result;
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Сменить пароль' })
  async updatePassword(
    @Request() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.usersService.updatePassword(req.user.sub, body.oldPassword, body.newPassword);
    return { message: 'Password updated' };
  }
}
