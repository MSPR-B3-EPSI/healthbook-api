import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from '../services/user.service.js';
import { User } from '../generated/prisma/client.js';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  signup(@Body() userData: { name?: string; email: string }): Promise<User> {
    return this.userService.createUser(userData);
  }
}
