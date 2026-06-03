import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FoodImageAnalyzerController } from './food-image-analyzer.controller.js';
import { FoodImageAnalyzerService } from './food-image-analyzer.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FoodImageAnalyzerController],
  providers: [FoodImageAnalyzerService, JwtAuthGuard],
})
export class FoodImageAnalyzerModule {}
