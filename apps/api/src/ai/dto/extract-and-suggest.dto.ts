import { IsString, MinLength } from 'class-validator';

export class ExtractAndSuggestDto {
  @IsString()
  @MinLength(1)
  applicationId: string;

  @IsString()
  @MinLength(1)
  jobDescriptionText: string;
}
