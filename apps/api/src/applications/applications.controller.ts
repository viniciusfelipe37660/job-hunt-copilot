import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { CurrentUserPayload } from '../auth/current-user.interface.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { MoveApplicationDto } from './dto/move-application.dto.js';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.applicationsService.list(user.clerkUserId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.applicationsService.findOne(user.clerkUserId, id);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user.clerkUserId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(user.clerkUserId, id, dto);
  }

  @Patch(':id/move')
  move(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() dto: MoveApplicationDto) {
    return this.applicationsService.move(user.clerkUserId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.applicationsService.remove(user.clerkUserId, id);
  }
}
