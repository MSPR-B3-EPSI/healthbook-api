import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { CreateCommentDTO } from '../dto/comment/create-comment.dto.js';
import { GetCommentsQueryDto } from '../dto/comment/get-comments-query.dto.js';
import { UpdateCommentDTO } from '../dto/comment/update-comment.dto.js';

@Controller('comment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentController {
  constructor(private readonly currentUser: CurrentUserService) {}

  @Get()
  getComments(@Query() _query: GetCommentsQueryDto) {
    throw new NotImplementedException();
  }

  @Get(':id')
  getComment(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }

  @Post()
  createComment(@Body() _dto: CreateCommentDTO) {
    throw new NotImplementedException();
  }

  @Patch(':id')
  updateComment(
    @Param('id', ParseUUIDPipe) _id: string,
    @Body() _dto: UpdateCommentDTO,
  ) {
    throw new NotImplementedException();
  }

  @Post('like/:id')
  likeComment(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }

  @Delete(':id')
  deleteComment(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }
}
