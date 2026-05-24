import { Module } from '@nestjs/common';
import { UserService } from '../services/user.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { UserController } from '../controllers/user.controller.js';
import { PrismaModule } from './prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
