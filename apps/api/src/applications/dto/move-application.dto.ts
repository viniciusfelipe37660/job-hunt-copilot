import { IsEnum, IsInt, Min } from 'class-validator';
import { ApplicationStatus } from '../../generated/prisma/enums.js';

export class MoveApplicationDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsInt()
  @Min(0)
  targetIndex: number;
}
