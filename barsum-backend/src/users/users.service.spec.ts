import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  increment: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('findByEmail → returns user', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const result = await service.findByEmail('a@b.com');
    expect(result).toEqual({ id: '1', email: 'a@b.com' });
  });

  it('create → saves and returns user', async () => {
    const newUser = { id: '1', email: 'a@b.com', name: 'Test', role: 'parent' };
    mockRepo.create.mockReturnValue(newUser);
    mockRepo.save.mockResolvedValue(newUser);
    const result = await service.create({ email: 'a@b.com', password: 'hashed', name: 'Test' });
    expect(result).toEqual(newUser);
  });

  it('updateProfile → throws if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.updateProfile('bad-id', { name: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('updatePassword → throws if wrong old password', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', password: await bcrypt.hash('correct', 10) });
    await expect(service.updatePassword('1', 'wrong', 'new')).rejects.toThrow(ConflictException);
  });
});
