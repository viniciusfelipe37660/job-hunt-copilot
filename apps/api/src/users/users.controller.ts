import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { CurrentUserPayload } from '../auth/current-user.interface.js';
import { UpdateBaseResumeDto } from './dto/update-base-resume.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findOrCreateByClerkId(user.clerkUserId);
  }

  @Patch('me/resume')
  async updateResume(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateBaseResumeDto) {
    await this.usersService.findOrCreateByClerkId(user.clerkUserId);
    return this.usersService.updateBaseResume(user.clerkUserId, dto.baseResumeText);
  }
}
