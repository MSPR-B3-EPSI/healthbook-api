import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { CurrentUserService } from '../services/current-user.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { WhoamiResponseDto } from '../dto/whoami-response.dto.js';
import { UserResponseDto } from '../../dto/user/user-response.dto.js';

@Controller('/status')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusController {
  constructor(
    private readonly currentUser: CurrentUserService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @Public()
  getHello(): string {
    // va chercher dans la db
    return 'Hello unconnected user! </br> this is data-recommendation';
  }

  @Get('whoami')
  @ApiOkResponse({ type: WhoamiResponseDto })
  async getme(): Promise<WhoamiResponseDto> {
    const dbUser = await this.currentUser.getDbUser();
    return {
      dbuser: UserResponseDto.from(
        dbUser,
        await this.storage.presign(dbUser.profileMediaKey),
      ),
      jwtuser: this.currentUser.jwtUser,
    };
  }

  @Get('freemium')
  @Roles('plan-freemium')
  getFreemium(): string {
    return `Hello Freemium ${this.currentUser.jwtUser.preferred_username}! \n this is data-recommendation`;
  }

  @Get('premium')
  @Roles('plan-premium')
  getPremium(): string {
    return `Hello Premium ${this.currentUser.jwtUser.preferred_username}! \n this is data-recommendation`;
  }

  @Get('premium-plus')
  @Roles('plan-premium+')
  getPremiumPlus(): string {
    return `Hello Premium Plus ${this.currentUser.jwtUser.preferred_username}! \n this is data-recommendation`;
  }

  @Get('toto/:id')
  @Public()
  getToto(@Param('id', ParseIntPipe) id: number): string {
    return `Hello Toto numero ${id}! \n this is data-recommendation`;
  }
}
