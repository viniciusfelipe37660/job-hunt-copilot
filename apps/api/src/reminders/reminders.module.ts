import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';
import { RemindersCron } from './reminders.cron.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersCron],
})
export class RemindersModule {}
