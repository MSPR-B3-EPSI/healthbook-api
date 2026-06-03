import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from './auth/auth.module.js';
import { AnalyzeModule } from './analyze/analyze.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ middleware: { mount: true } }),
    AuthModule,
    AnalyzeModule,
  ],
  controllers: [],
})
export class AppModule {}
