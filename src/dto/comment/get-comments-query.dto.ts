import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { SortOrder } from '../common/sort-order.enum.js';

export enum CommentSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Likes = 'likes',
}

export class GetCommentsQueryDto {
  @ApiProperty({ description: 'Post whose comments are listed' })
  @IsUUID()
  postId: string;

  @ApiPropertyOptional({ description: 'Filter by author (keycloakId)' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive search in content' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  search?: string;

  @ApiPropertyOptional({
    enum: CommentSortBy,
    default: CommentSortBy.CreatedAt,
  })
  @IsOptional()
  @IsEnum(CommentSortBy)
  sortBy?: CommentSortBy = CommentSortBy.CreatedAt;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Desc })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.Desc;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number;
}
