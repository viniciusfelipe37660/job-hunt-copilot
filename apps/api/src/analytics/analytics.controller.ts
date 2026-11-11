import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { CurrentUserPayload } from '../auth/current-user.interface.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('funnel')
  funnel(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.funnel(user.clerkUserId);
  }

  @Get('response-rate-by-skill')
  responseRateBySkill(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.skillResponseRate(user.clerkUserId);
  }

  @Get('weekly-volume')
  weeklyVolume(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.weeklyVolume(user.clerkUserId);
  }
}
