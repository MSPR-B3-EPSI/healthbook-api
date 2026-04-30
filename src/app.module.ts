import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RootController } from './controllers/app.controller.js';
import { UserModule } from './modules/user.module.js';
import { PostModule } from './modules/post.module.js';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, PostModule],
  controllers: [RootController],
})
export class AppModule {}
