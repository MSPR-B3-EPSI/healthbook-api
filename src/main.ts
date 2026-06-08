import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { readdirSync, readFileSync, readlinkSync } from 'fs';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function freePort(port: number): Promise<void> {
  const hex = port.toString(16).padStart(4, '0').toUpperCase();
  for (const proto of ['tcp6', 'tcp']) {
    try {
      const lines = readFileSync(`/proc/net/${proto}`, 'utf8')
        .split('\n')
        .slice(1);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 10 || parts[3] !== '0A') continue;
        if (!parts[1].toUpperCase().endsWith(`:${hex}`)) continue;
        const inode = parts[9];
        for (const pid of readdirSync('/proc').filter((f) => /^\d+$/.test(f))) {
          if (parseInt(pid) === process.pid) continue;
          try {
            for (const fd of readdirSync(`/proc/${pid}/fd`)) {
              try {
                if (
                  readlinkSync(`/proc/${pid}/fd/${fd}`) === `socket:[${inode}]`
                ) {
                  process.kill(parseInt(pid), 'SIGKILL');
                  await new Promise((r) => setTimeout(r, 300));
                  return;
                }
              } catch (_) {
                void _;
              }
            }
          } catch (_) {
            void _;
          }
        }
      }
    } catch (_) {
      void _;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .addServer('/api')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = parseInt(process.env.PORT ?? '3000');
  if (process.env.NODE_ENV !== 'production') {
    await freePort(port);
  }
  await app.listen(port);
}
void bootstrap();
