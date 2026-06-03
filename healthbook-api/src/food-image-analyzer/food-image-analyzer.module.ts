import { Module } from '@nestjs/common';
import { FoodImageAnalyzerController } from './food-image-analyzer.controller.js';
import { FoodImageAnalyzerService } from './food-image-analyzer.service.js';

@Module({
  controllers: [FoodImageAnalyzerController],
  providers: [FoodImageAnalyzerService],
})
export class FoodImageAnalyzerModule {}
