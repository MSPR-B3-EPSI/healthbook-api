import { Module } from '@nestjs/common';
import { PublicationService } from '../services/publication.service.js';
import { PublicationRepository } from '../repositories/publication.repository.js';
import { PublicationController } from '../controllers/publication.controller.js';
import { PrismaModule } from './prisma.module.js';
@Module({
  imports: [PrismaModule],
  controllers: [PublicationController],
  providers: [PublicationService, PublicationRepository],
  exports: [PublicationService],
})
export class PublicationModule {}
