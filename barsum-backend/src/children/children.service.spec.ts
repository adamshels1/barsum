import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChildrenService } from './children.service';
import { Child } from './entities/child.entity';
import { ConflictException, ForbiddenException } from '@nestjs/common';

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  increment: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

describe('ChildrenService', () => {
  let service: ChildrenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildrenService,
        { provide: getRepositoryToken(Child), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ChildrenService>(ChildrenService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('create → throws if login taken', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', login: 'taken' });
    await expect(service.create({ name: 'A', age: 7, login: 'taken', password: 'pw', parentId: 'p1' })).rejects.toThrow(ConflictException);
  });

  it('create → success', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const child = { id: '1', name: 'A', login: 'unique', age: 7, parentId: 'p1' };
    mockRepo.create.mockReturnValue(child);
    mockRepo.save.mockResolvedValue(child);
    const result = await service.create({ name: 'A', age: 7, login: 'unique', password: 'pw', parentId: 'p1' });
    expect(result).toEqual(child);
  });

  it('update → throws ForbiddenException if wrong parent', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', parentId: 'p1' });
    await expect(service.update('1', 'p2', { name: 'B' })).rejects.toThrow(ForbiddenException);
  });

  it('findByParentId → returns children array', async () => {
    mockRepo.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await service.findByParentId('p1');
    expect(result).toHaveLength(2);
  });
});
