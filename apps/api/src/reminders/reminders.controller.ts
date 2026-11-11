import { Controller, Get, Param, Patch } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { CurrentUserPayload } from '../auth/current-user.interface.js';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.remindersService.listForUser(user.clerkUserId);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.remindersService.dismiss(user.clerkUserId, id);
  }
}
