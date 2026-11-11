import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { MoveApplicationDto } from './dto/move-application.dto.js';
import { ApplicationStatus } from '../generated/prisma/enums.js';

type SkillTagJoin = { skillTag: { name: string } };
type WithSkillTags<T> = T & { skillTags?: SkillTagJoin[] };

function toDto<T extends Record<string, unknown>>(application: WithSkillTags<T>) {
  const { skillTags, ...rest } = application;
  return { ...rest, skillTags: (skillTags ?? []).map((t) => t.skillTag.name) };
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async list(clerkUserId: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const applications = await this.prisma.client.application.findMany({
      where: { userId: user.id },
      orderBy: [{ status: 'asc' }, { boardPosition: 'asc' }],
      include: { skillTags: { include: { skillTag: true } } },
    });
    return applications.map(toDto);
  }

  async findOne(clerkUserId: string, id: string) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const application = await this.prisma.client.application.findFirst({
      where: { id, userId: user.id },
      include: { skillTags: { include: { skillTag: true } }, aiSuggestion: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    return toDto(application);
  }

  async create(clerkUserId: string, dto: CreateApplicationDto) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const count = await this.prisma.client.application.count({
      where: { userId: user.id, status: ApplicationStatus.SAVED },
    });
    const application = await this.prisma.client.application.create({
      data: {
        ...dto,
        userId: user.id,
        status: ApplicationStatus.SAVED,
        boardPosition: count,
      },
    });
    return toDto(application);
  }

  async update(clerkUserId: string, id: string, dto: UpdateApplicationDto) {
    await this.findOne(clerkUserId, id);
    const application = await this.prisma.client.application.update({
      where: { id },
      data: { ...dto, lastActivityAt: new Date() },
    });
    return toDto(application);
  }

  async remove(clerkUserId: string, id: string) {
    await this.findOne(clerkUserId, id);
    await this.prisma.client.application.delete({ where: { id } });
  }

  async move(clerkUserId: string, id: string, dto: MoveApplicationDto) {
    const user = await this.usersService.findOrCreateByClerkId(clerkUserId);
    const application = await this.findOne(clerkUserId, id);

    return this.prisma.client.$transaction(async (tx) => {
      const destination = await tx.application.findMany({
        where: { userId: user.id, status: dto.status, id: { not: id } },
        orderBy: { boardPosition: 'asc' },
      });

      const clampedIndex = Math.max(0, Math.min(dto.targetIndex, destination.length));
      destination.splice(clampedIndex, 0, { ...application, status: dto.status });

      await Promise.all(
        destination.map((item, index) =>
          tx.application.update({
            where: { id: item.id },
            data: {
              boardPosition: index,
              status: dto.status,
              ...(item.id === id
                ? {
                    lastActivityAt: new Date(),
                    appliedAt: dto.status === ApplicationStatus.APPLIED && !application.appliedAt ? new Date() : undefined,
                    interviewAt: dto.status === ApplicationStatus.INTERVIEW && !application.interviewAt ? new Date() : undefined,
                    offerAt: dto.status === ApplicationStatus.OFFER && !application.offerAt ? new Date() : undefined,
                    rejectedAt: dto.status === ApplicationStatus.REJECTED && !application.rejectedAt ? new Date() : undefined,
                  }
                : {}),
            },
          }),
        ),
      );

      if (application.status !== dto.status) {
        const source = await tx.application.findMany({
          where: { userId: user.id, status: application.status, id: { not: id } },
          orderBy: { boardPosition: 'asc' },
        });
        await Promise.all(
          source.map((item, index) => tx.application.update({ where: { id: item.id }, data: { boardPosition: index } })),
        );
      }

      const updated = await tx.application.findUnique({ where: { id } });
      return updated ? toDto(updated) : null;
    });
  }
}
