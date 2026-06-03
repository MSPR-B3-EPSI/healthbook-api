import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze/analyze.controller';
import { AnalyzeService } from './analyze/analyze.service';

@Module({
  controllers: [AnalyzeController],
  providers: [AnalyzeService],
})
export class AppModule {}
