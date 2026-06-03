import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';
import { PrismaModule } from '../modules/prisma.module.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { CurrentUserService } from './services/current-user.service.js';
import { StatusController } from './controllers/status.controller.js';

@Module({
  imports: [
    ClsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
  ],
  controllers: [StatusController],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, CurrentUserService],
  exports: [PassportModule, CurrentUserService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
