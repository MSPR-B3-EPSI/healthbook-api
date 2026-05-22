import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  content?: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;
}
