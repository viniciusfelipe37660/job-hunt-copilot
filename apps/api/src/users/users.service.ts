import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  private readonly clerkClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.clerkClient = createClerkClient({ secretKey: this.config.get<string>('CLERK_SECRET_KEY') });
  }

  async findOrCreateByClerkId(clerkUserId: string) {
    const existing = await this.prisma.client.user.findUnique({ where: { clerkUserId } });
    if (existing) return existing;

    const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

    return this.prisma.client.user.create({
      data: {
        clerkUserId,
        email: primaryEmail ?? `${clerkUserId}@placeholder.local`,
        name,
      },
    });
  }

  async updateBaseResume(clerkUserId: string, baseResumeText: string) {
    return this.prisma.client.user.update({
      where: { clerkUserId },
      data: { baseResumeText },
    });
  }
}
