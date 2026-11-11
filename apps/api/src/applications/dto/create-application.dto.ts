import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  company: string;

  @IsString()
  @MinLength(1)
  role: string;

  @IsOptional()
  @IsString()
  jobUrl?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
