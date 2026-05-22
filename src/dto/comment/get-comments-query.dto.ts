import { IsUUID } from 'class-validator';

export class GetCommentsQueryDto {
  @IsUUID()
  postId: string;
}
