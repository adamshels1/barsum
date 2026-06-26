import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(dto: { email: string; password: string; name: string; role?: UserRole }): Promise<User> {
    const user = this.userRepo.create({ ...dto, role: dto.role || UserRole.PARENT });
    return this.userRepo.save(user);
  }

  async updateProfile(id: string, dto: { name?: string; phone?: string }): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new ConflictException('Wrong current password');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
  }

  async count(): Promise<number> {
    return this.userRepo.count();
  }
}
