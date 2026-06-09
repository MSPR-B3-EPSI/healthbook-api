import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from './auth/auth.module.js';
import { HealthbookModule } from './modules/healthbook.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ middleware: { mount: true }, global: true }),
    AuthModule,
    HealthbookModule,
  ],
  controllers: [],
})
export class AppModule {}
