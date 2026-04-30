import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RootController } from './controllers/app.controller.js';
import { UserModule } from './modules/user.module.js';
import { PublicationModule } from './modules/publication.module.js';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, PublicationModule],
  controllers: [RootController],
})
export class AppModule {}
