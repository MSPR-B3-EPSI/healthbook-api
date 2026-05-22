import { IsString, IsUUID, Length } from 'class-validator';

export class CreateCommentDTO {
  @IsUUID()
  postId: string;

  @IsString()
  @Length(1, 255)
  content: string;
}
