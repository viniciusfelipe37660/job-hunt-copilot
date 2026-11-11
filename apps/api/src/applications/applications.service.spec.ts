import { Test } from '@nestjs/testing';
import { ApplicationsService } from './applications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { ApplicationStatus } from '../generated/prisma/enums.js';

const USER_ID = 'user-1';
const CLERK_USER_ID = 'clerk-1';

function fakeApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'app-1',
    userId: USER_ID,
    company: 'Acme',
    role: 'Dev',
    status: ApplicationStatus.APPLIED,
    boardPosition: 0,
    appliedAt: null,
    interviewAt: null,
    offerAt: null,
    rejectedAt: null,
    lastActivityAt: new Date(),
    skillTags: [],
    ...overrides,
  };
}

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    client: {
      application: Record<string, ReturnType<typeof vi.fn>>;
      $transaction: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      client: {
        application: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          count: vi.fn(),
        },
        $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(prisma.client)),
      },
    };

    const usersService = {
      findOrCreateByClerkId: vi.fn().mockResolvedValue({ id: USER_ID, clerkUserId: CLERK_USER_ID }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(ApplicationsService);
  });

  describe('create', () => {
    it('places a new application at the end of the SAVED column', async () => {
      prisma.client.application.count.mockResolvedValue(2);
      prisma.client.application.create.mockResolvedValue(
        fakeApplication({ status: ApplicationStatus.SAVED, boardPosition: 2 }),
      );

      const result = await service.create(CLERK_USER_ID, { company: 'Acme', role: 'Dev' });

      expect(prisma.client.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ApplicationStatus.SAVED, boardPosition: 2 }),
        }),
      );
      expect(result.skillTags).toEqual([]);
    });
  });

  describe('move', () => {
    function updateCallFor(id: string) {
      const call = prisma.client.application.update.mock.calls.find(([arg]: any) => arg.where.id === id);
      return call?.[0];
    }

    it('reorders within the same column without touching other columns', async () => {
      prisma.client.application.findFirst.mockResolvedValue(
        fakeApplication({ id: 'app-1', status: ApplicationStatus.APPLIED, boardPosition: 0 }),
      );
      prisma.client.application.findMany.mockImplementation(({ where }: any) =>
        where.status === ApplicationStatus.APPLIED
          ? Promise.resolve([
              fakeApplication({ id: 'app-2', boardPosition: 0 }),
              fakeApplication({ id: 'app-3', boardPosition: 1 }),
            ])
          : Promise.resolve([]),
      );
      prisma.client.application.update.mockResolvedValue({});
      prisma.client.application.findUnique.mockResolvedValue(fakeApplication());

      await service.move(CLERK_USER_ID, 'app-1', { status: ApplicationStatus.APPLIED, targetIndex: 1 });

      expect(updateCallFor('app-2').data.boardPosition).toBe(0);
      expect(updateCallFor('app-1').data.boardPosition).toBe(1);
      expect(updateCallFor('app-3').data.boardPosition).toBe(2);
    });

    it('moving to a new column stamps the matching timestamp and closes the gap in the old column', async () => {
      prisma.client.application.findFirst.mockResolvedValue(
        fakeApplication({ id: 'app-1', status: ApplicationStatus.SAVED, boardPosition: 1, appliedAt: null }),
      );
      prisma.client.application.findMany.mockImplementation(({ where }: any) => {
        if (where.status === ApplicationStatus.APPLIED) return Promise.resolve([]);
        if (where.status === ApplicationStatus.SAVED) {
          return Promise.resolve([fakeApplication({ id: 'app-0', status: ApplicationStatus.SAVED, boardPosition: 0 })]);
        }
        return Promise.resolve([]);
      });
      prisma.client.application.update.mockResolvedValue({});
      prisma.client.application.findUnique.mockResolvedValue(
        fakeApplication({ status: ApplicationStatus.APPLIED, boardPosition: 0 }),
      );

      await service.move(CLERK_USER_ID, 'app-1', { status: ApplicationStatus.APPLIED, targetIndex: 0 });

      const movedCall = updateCallFor('app-1');
      expect(movedCall.data.status).toBe(ApplicationStatus.APPLIED);
      expect(movedCall.data.boardPosition).toBe(0);
      expect(movedCall.data.appliedAt).toBeInstanceOf(Date);

      // the card left behind in SAVED should be renumbered to close the gap
      expect(updateCallFor('app-0').data.boardPosition).toBe(0);
    });

    it('does not overwrite a timestamp that was already set on an earlier move', async () => {
      const alreadyApplied = new Date('2026-01-01');
      prisma.client.application.findFirst.mockResolvedValue(
        fakeApplication({ id: 'app-1', status: ApplicationStatus.APPLIED, appliedAt: alreadyApplied }),
      );
      prisma.client.application.findMany.mockImplementation(({ where }: any) =>
        where.status === ApplicationStatus.INTERVIEW ? Promise.resolve([]) : Promise.resolve([]),
      );
      prisma.client.application.update.mockResolvedValue({});
      prisma.client.application.findUnique.mockResolvedValue(fakeApplication({ status: ApplicationStatus.INTERVIEW }));

      await service.move(CLERK_USER_ID, 'app-1', { status: ApplicationStatus.INTERVIEW, targetIndex: 0 });

      expect(updateCallFor('app-1').data.appliedAt).toBeUndefined();
    });

    it('clamps an out-of-range targetIndex to the end of the destination column', async () => {
      prisma.client.application.findFirst.mockResolvedValue(fakeApplication({ id: 'app-1' }));
      prisma.client.application.findMany.mockImplementation(({ where }: any) =>
        where.status === ApplicationStatus.APPLIED
          ? Promise.resolve([fakeApplication({ id: 'app-2', boardPosition: 0 })])
          : Promise.resolve([]),
      );
      prisma.client.application.update.mockResolvedValue({});
      prisma.client.application.findUnique.mockResolvedValue(fakeApplication());

      await service.move(CLERK_USER_ID, 'app-1', { status: ApplicationStatus.APPLIED, targetIndex: 999 });

      expect(updateCallFor('app-1').data.boardPosition).toBe(1);
    });
  });
});
