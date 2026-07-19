import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterParentDto } from './dto/register-parent.dto';
import { LoginDto } from './dto/login.dto';
import { ChildLoginDto } from './dto/child-login.dto';
import { UniversalLoginDto } from './dto/universal-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Универсальный вход (email или логин)' })
  universalLogin(@Body() dto: UniversalLoginDto) {
    return this.authService.universalLogin(dto);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обмен валидного токена на свежий (скользящая сессия)' })
  refresh(@Request() req: any) {
    return this.authService.refreshToken(req.user);
  }

  @Post('parent/register')
  @ApiOperation({ summary: 'Регистрация родителя' })
  registerParent(@Body() dto: RegisterParentDto) {
    return this.authService.registerParent(dto);
  }

  @Post('parent/login')
  @ApiOperation({ summary: 'Вход родителя' })
  loginParent(@Body() dto: LoginDto) {
    return this.authService.loginParent(dto);
  }

  @Post('child/login')
  @ApiOperation({ summary: 'Вход ребёнка' })
  loginChild(@Body() dto: ChildLoginDto) {
    return this.authService.loginChild(dto);
  }

  @Post('expert/register')
  @ApiOperation({ summary: 'Регистрация эксперта' })
  registerExpert(@Body() dto: RegisterParentDto) {
    return this.authService.registerExpert(dto);
  }

  @Post('expert/login')
  @ApiOperation({ summary: 'Вход эксперта' })
  loginExpert(@Body() dto: LoginDto) {
    return this.authService.loginExpert(dto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Вход администратора' })
  loginAdmin(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }
}
