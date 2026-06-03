import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { CurrentUserService } from '../services/current-user.service.js';

@Controller('/status')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusController {
  constructor(private readonly currentUser: CurrentUserService) {}

  @Get()
  @Public()
  getHello(): string {
    return 'OK';
  }

  @Get('whoami')
  getWhoami() {
    return this.currentUser.jwtUser;
  }

  @Get('freemium')
  @Roles('plan-freemium')
  getFreemium(): string {
    return `Hello Freemium ${this.currentUser.jwtUser.preferred_username}!`;
  }

  @Get('premium')
  @Roles('plan-premium')
  getPremium(): string {
    return `Hello Premium ${this.currentUser.jwtUser.preferred_username}!`;
  }

  @Get('premium-plus')
  @Roles('plan-premium+')
  getPremiumPlus(): string {
    return `Hello Premium Plus ${this.currentUser.jwtUser.preferred_username}!`;
  }

  @Get('toto/:id')
  @Public()
  getToto(@Param('id', ParseIntPipe) id: number): string {
    return `Hello Toto numero ${id}!`;
  }
}
