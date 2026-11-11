import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service.js';

@Injectable()
export class RemindersCron {
  constructor(private readonly remindersService: RemindersService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.remindersService.generateDueReminders();
  }
}
