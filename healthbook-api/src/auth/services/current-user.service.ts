import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class CurrentUserService {
  constructor(private readonly cls: ClsService) {}

  get jwtUser(): JwtPayload {
    return this.cls.get<JwtPayload>('user');
  }
}
