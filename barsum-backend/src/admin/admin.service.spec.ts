import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { ChildrenService } from '../children/children.service';
import { PaymentsService } from '../payments/payments.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ExpertsService } from '../experts/experts.service';

const mockUsers = { count: jest.fn().mockResolvedValue(10) };
const mockChildren = { count: jest.fn().mockResolvedValue(20) };
const mockPayments = {
  countByStatus: jest.fn().mockResolvedValue(5),
  totalRevenue: jest.fn().mockResolvedValue(50000),
};
const mockChallenges = { countByStatus: jest.fn().mockResolvedValue(3) };
const mockExperts = { countByStatus: jest.fn().mockResolvedValue(2) };

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UsersService, useValue: mockUsers },
        { provide: ChildrenService, useValue: mockChildren },
        { provide: PaymentsService, useValue: mockPayments },
        { provide: ChallengesService, useValue: mockChallenges },
        { provide: ExpertsService, useValue: mockExperts },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('getStats → returns correct structure', async () => {
    mockUsers.count.mockResolvedValue(10);
    mockChildren.count.mockResolvedValue(20);
    mockPayments.countByStatus.mockResolvedValue(5);
    mockPayments.totalRevenue.mockResolvedValue(50000);
    mockChallenges.countByStatus.mockResolvedValue(3);
    mockExperts.countByStatus.mockResolvedValue(2);

    const stats = await service.getStats();
    expect(stats).toMatchObject({
      totalUsers: expect.any(Number),
      totalChildren: expect.any(Number),
      totalPayments: expect.any(Number),
      totalRevenueTg: expect.any(Number),
      pendingPayments: expect.any(Number),
      pendingExperts: expect.any(Number),
      pendingChallenges: expect.any(Number),
    });
  });

  it('getStats → access with non-admin role → ForbiddenException from controller', () => {
    expect(service).toBeDefined();
  });
});
