import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller.js';
import { AnalyzeService } from './analyze.service.js';

@Module({
  controllers: [AnalyzeController],
  providers: [AnalyzeService],
})
export class AnalyzeModule {}
