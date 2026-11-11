import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { CurrentUserPayload } from '../auth/current-user.interface.js';
import { ExtractAndSuggestDto } from './dto/extract-and-suggest.dto.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-and-suggest')
  extractAndSuggest(@CurrentUser() user: CurrentUserPayload, @Body() dto: ExtractAndSuggestDto) {
    return this.aiService.extractAndSuggest(user.clerkUserId, dto.applicationId, dto.jobDescriptionText);
  }
}
