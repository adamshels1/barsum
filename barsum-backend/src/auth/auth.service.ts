import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterParentDto } from './dto/register-parent.dto';
import { LoginDto } from './dto/login.dto';
import { ChildLoginDto } from './dto/child-login.dto';
import { UniversalLoginDto } from './dto/universal-login.dto';
import { ChildrenService } from '../children/children.service';
import { ExpertsService } from '../experts/experts.service';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private childrenService: ChildrenService,
    private expertsService: ExpertsService,
  ) {}

  async registerParent(dto: RegisterParentDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, password: hashed, role: UserRole.PARENT });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: 'parent',
    });

    const { password, ...result } = user as any;
    return { user: result, access_token: token };
  }

  async loginParent(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: 'parent',
    });

    const { password, ...result } = user as any;
    return { user: result, access_token: token };
  }

  async loginChild(dto: ChildLoginDto) {
    const child = await this.childrenService.findByLogin(dto.login);
    if (!child) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, child.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync({
      sub: child.id,
      login: child.login,
      role: 'child',
      parentId: child.parentId,
    });

    const { password, ...result } = child as any;
    return { child: result, access_token: token };
  }

  async registerExpert(dto: RegisterParentDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, password: hashed, role: UserRole.EXPERT });
    const expert = await this.expertsService.createForUser(user.id);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: 'expert',
      expertStatus: expert.status,
    });

    const { password, ...userResult } = user as any;
    return { user: userResult, expert, access_token: token };
  }

  async loginExpert(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.role !== UserRole.EXPERT) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const expert = await this.expertsService.findByUserId(user.id);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: 'expert',
      expertStatus: expert?.status,
    });

    const { password, ...result } = user as any;
    return { user: result, expert, access_token: token };
  }

  async universalLogin(dto: UniversalLoginDto) {
    const { identifier, password } = dto;
    const isEmail = identifier.includes('@');

    if (isEmail) {
      const user = await this.usersService.findByEmail(identifier);
      if (user) {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Неверный логин или пароль');

        const role = user.role as string;
        const payload: Record<string, any> = { sub: user.id, email: user.email, role };

        if (role === UserRole.EXPERT) {
          const expert = await this.expertsService.findByUserId(user.id);
          payload.expertStatus = expert?.status;
          const token = await this.jwtService.signAsync(payload);
          const { password: _, ...result } = user as any;
          return { access_token: token, role, user: result, expert };
        }

        const token = await this.jwtService.signAsync(payload);
        const { password: _, ...result } = user as any;
        return { access_token: token, role, user: result };
      }
    } else {
      const child = await this.childrenService.findByLogin(identifier);
      if (child) {
        const valid = await bcrypt.compare(password, child.password);
        if (!valid) throw new UnauthorizedException('Неверный логин или пароль');

        const token = await this.jwtService.signAsync({
          sub: child.id,
          login: child.login,
          role: 'child',
          parentId: child.parentId,
        });
        const { password: _, ...result } = child as any;
        return { access_token: token, role: 'child', child: result };
      }
    }

    throw new UnauthorizedException('Неверный логин или пароль');
  }

  async loginAdmin(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.role !== UserRole.ADMIN) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: 'admin',
    });

    const { password, ...result } = user as any;
    return { user: result, access_token: token };
  }
}
