import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { ApplicationStatus } from '../generated/prisma/enums.js';

const STATUSES: ApplicationStatus[] = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
];

const RESPONDED_STATUSES: ApplicationStatus[] = [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async funnel(clerkUserId: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const counts = await this.prisma.client.application.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { _all: true },
    });
    return STATUSES.map((status) => ({
      status,
      count: counts.find((c) => c.status === status)?._count._all ?? 0,
    }));
  }

  async skillResponseRate(clerkUserId: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const joins = await this.prisma.client.skillTagOnApplication.findMany({
      where: { application: { userId: user.id } },
      include: { skillTag: true, application: { select: { status: true } } },
    });

    const bySkill = new Map<string, { total: number; interviewOrBetter: number }>();
    for (const join of joins) {
      const entry = bySkill.get(join.skillTag.name) ?? { total: 0, interviewOrBetter: 0 };
      entry.total += 1;
      if (RESPONDED_STATUSES.includes(join.application.status)) entry.interviewOrBetter += 1;
      bySkill.set(join.skillTag.name, entry);
    }

    return Array.from(bySkill.entries())
      .map(([skill, v]) => ({
        skill,
        total: v.total,
        interviewOrBetter: v.interviewOrBetter,
        responseRate: v.total > 0 ? v.interviewOrBetter / v.total : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async weeklyVolume(clerkUserId: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const applications = await this.prisma.client.application.findMany({
      where: { userId: user.id },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (const application of applications) {
      const key = startOfWeek(application.createdAt).toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, count]) => ({ weekStart, count }));
  }
}
