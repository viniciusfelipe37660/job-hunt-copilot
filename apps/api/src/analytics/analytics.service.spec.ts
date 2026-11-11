import { Test } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { ApplicationStatus } from '../generated/prisma/enums.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: {
    client: {
      application: Record<string, ReturnType<typeof vi.fn>>;
      skillTagOnApplication: Record<string, ReturnType<typeof vi.fn>>;
    };
  };

  beforeEach(async () => {
    prisma = {
      client: {
        application: { groupBy: vi.fn(), findMany: vi.fn() },
        skillTagOnApplication: { findMany: vi.fn() },
      },
    };

    const usersService = { findOrCreateByClerkId: vi.fn().mockResolvedValue({ id: 'user-1' }) };

    const module = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(AnalyticsService);
  });

  describe('funnel', () => {
    it('fills in zero counts for statuses the user has no applications in', async () => {
      prisma.client.application.groupBy.mockResolvedValue([
        { status: ApplicationStatus.APPLIED, _count: { _all: 3 } },
        { status: ApplicationStatus.OFFER, _count: { _all: 1 } },
      ]);

      const result = await service.funnel('clerk-1');

      expect(result).toEqual([
        { status: ApplicationStatus.SAVED, count: 0 },
        { status: ApplicationStatus.APPLIED, count: 3 },
        { status: ApplicationStatus.INTERVIEW, count: 0 },
        { status: ApplicationStatus.OFFER, count: 1 },
        { status: ApplicationStatus.REJECTED, count: 0 },
      ]);
    });
  });

  describe('skillResponseRate', () => {
    it('computes the interview-or-better ratio per skill', async () => {
      prisma.client.skillTagOnApplication.findMany.mockResolvedValue([
        { skillTag: { name: 'react' }, application: { status: ApplicationStatus.APPLIED } },
        { skillTag: { name: 'react' }, application: { status: ApplicationStatus.INTERVIEW } },
        { skillTag: { name: 'react' }, application: { status: ApplicationStatus.OFFER } },
        { skillTag: { name: 'docker' }, application: { status: ApplicationStatus.REJECTED } },
      ]);

      const result = await service.skillResponseRate('clerk-1');

      expect(result).toEqual(
        expect.arrayContaining([
          { skill: 'react', total: 3, interviewOrBetter: 2, responseRate: 2 / 3 },
          { skill: 'docker', total: 1, interviewOrBetter: 0, responseRate: 0 },
        ]),
      );
    });

    it('returns an empty list when nothing has been tagged yet', async () => {
      prisma.client.skillTagOnApplication.findMany.mockResolvedValue([]);
      const result = await service.skillResponseRate('clerk-1');
      expect(result).toEqual([]);
    });
  });

  describe('weeklyVolume', () => {
    it('buckets applications by the Monday of their creation week', async () => {
      prisma.client.application.findMany.mockResolvedValue([
        { createdAt: new Date('2026-11-10') }, // a Tuesday
        { createdAt: new Date('2026-11-12') }, // same week, Thursday
        { createdAt: new Date('2026-11-17') }, // following Tuesday
      ]);

      const result = await service.weeklyVolume('clerk-1');

      expect(result).toEqual([
        { weekStart: '2026-11-09', count: 2 },
        { weekStart: '2026-11-16', count: 1 },
      ]);
    });
  });
});
