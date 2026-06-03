import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from './auth/auth.module.js';
import { FoodImageAnalyzerModule } from './food-image-analyzer/food-image-analyzer.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ middleware: { mount: true } }),
    AuthModule,
    FoodImageAnalyzerModule,
  ],
  controllers: [],
})
export class AppModule {}
