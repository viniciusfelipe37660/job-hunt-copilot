import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { ApplicationStatus } from '../generated/prisma/enums.js';

const STALE_DAYS = 7;

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async listForUser(clerkUserId: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    return this.prisma.client.followUpReminder.findMany({
      where: { userId: user.id, dismissed: false },
      orderBy: { dueAt: 'asc' },
      include: { application: { select: { id: true, company: true, role: true } } },
    });
  }

  async dismiss(clerkUserId: string, id: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const reminder = await this.prisma.client.followUpReminder.findFirst({ where: { id, userId: user.id } });
    if (!reminder) throw new NotFoundException('Reminder not found');
    return this.prisma.client.followUpReminder.update({ where: { id }, data: { dismissed: true } });
  }

  async generateDueReminders() {
    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
    const staleApplications = await this.prisma.client.application.findMany({
      where: {
        status: { in: [ApplicationStatus.SAVED, ApplicationStatus.APPLIED] },
        lastActivityAt: { lt: cutoff },
        reminders: { none: { dismissed: false } },
      },
    });

    for (const application of staleApplications) {
      await this.prisma.client.followUpReminder.create({
        data: {
          userId: application.userId,
          applicationId: application.id,
          dueAt: new Date(),
          message: `Sem atualização em ${application.company} - ${application.role} há mais de ${STALE_DAYS} dias. Considere um follow-up.`,
        },
      });
    }

    return staleApplications.length;
  }
}
