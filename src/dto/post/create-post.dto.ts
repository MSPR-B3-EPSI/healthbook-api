import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(1, 200)
  title: string;

  @IsString()
  @Length(1, 2000)
  content: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;
}
