import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from './auth/auth.module.js';
import { RootController } from './controllers/app.controller.js';
import { UserModule } from './modules/user.module.js';
import { PublicationModule } from './modules/publication.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ middleware: { mount: true } }),
    AuthModule,
    UserModule,
    PublicationModule,
  ],
  controllers: [RootController],
})
export class AppModule {}
