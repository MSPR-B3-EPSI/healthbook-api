import { Module } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
