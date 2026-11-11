import { IsString, MinLength } from 'class-validator';

export class UpdateBaseResumeDto {
  @IsString()
  @MinLength(1)
  baseResumeText: string;
}
