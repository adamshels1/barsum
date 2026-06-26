import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterParentDto } from './dto/register-parent.dto';
import { LoginDto } from './dto/login.dto';
import { ChildLoginDto } from './dto/child-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
