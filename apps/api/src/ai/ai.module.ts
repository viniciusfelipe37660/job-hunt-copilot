import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { UsersModule } from '../users/users.module.js';
import { ApplicationsModule } from '../applications/applications.module.js';

@Module({
  imports: [UsersModule, ApplicationsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
