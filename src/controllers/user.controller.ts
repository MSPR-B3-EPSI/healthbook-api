import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { UpdateUserDto } from '../dto/user/update-user.dto.js';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly currentUser: CurrentUserService) {}

  @Get('me')
  getMe() {
    throw new NotImplementedException();
  }

  @Get(':id')
  getUser(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }

  @Patch('me')
  updateMe(@Body() _dto: UpdateUserDto) {
    throw new NotImplementedException();
  }
}
