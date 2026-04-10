import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user.module.js';
import { PostModule } from './modules/post.module.js';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, PostModule],
})
export class AppModule {}
