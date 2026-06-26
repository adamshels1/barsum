import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ChildrenService } from '../children/children.service';
import { ExpertsService } from '../experts/experts.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};
const mockChildrenService = {
  findByLogin: jest.fn(),
};
const mockExpertsService = {
  createForUser: jest.fn().mockResolvedValue({ id: 'e1', userId: '1', status: 'new' }),
  findByUserId: jest.fn().mockResolvedValue({ id: 'e1', userId: '1', status: 'approved' }),
};
const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: ExpertsService, useValue: mockExpertsService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.signAsync.mockResolvedValue('mock-token');
    mockExpertsService.createForUser.mockResolvedValue({ id: 'e1', userId: '1', status: 'new' });
    mockExpertsService.findByUserId.mockResolvedValue({ id: 'e1', userId: '1', status: 'approved' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerParent', () => {
    it('throws ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com' });
      await expect(
        service.registerParent({ email: 'a@b.com', password: '123456', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('registers new parent and returns token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        password: 'hashed',
        name: 'Test',
      });

      const result = await service.registerParent({ email: 'a@b.com', password: '123456', name: 'Test' });
      expect(result.access_token).toBe('mock-token');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('loginParent', () => {
    it('throws UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.loginParent({ email: 'a@b.com', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if password wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        password: await bcrypt.hash('correct', 10),
      });
      await expect(service.loginParent({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('registerExpert', () => {
    it('registers expert with status new', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: '1',
        email: 'expert@test.com',
        password: 'hashed',
        name: 'Expert',
        role: 'expert',
      });

      const result = await service.registerExpert({ email: 'expert@test.com', password: '123456', name: 'Expert' });
      expect(result.access_token).toBe('mock-token');
      expect(result.expert.status).toBe('new');
    });
  });
});
