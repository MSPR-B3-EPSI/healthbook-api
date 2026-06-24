import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

const MEDIA_DOCS = `
## Post media

Each post can carry **one** optional media file (image). Media is **not** sent in
the post's JSON body — it is managed through dedicated multipart endpoints and
stored in object storage (MinIO), not on the API server.

### Lifecycle
1. **Create the post** with \`POST /post\` (JSON, no media).
2. **Attach media** with \`POST /post/{id}/media\` — \`multipart/form-data\`, field
   name \`file\`. Uploading again **replaces** the previous file.
3. **Remove media** with \`DELETE /post/{id}/media\`.

Deleting a post also deletes its stored media object.

### Constraints
- Allowed types: \`image/png\`, \`image/jpeg\`, \`image/webp\`, \`image/gif\`.
- Max size: **5 MB**. Violations return **400**.
- Only the post's author may upload/replace/delete its media (**403** otherwise).

### Reading media — \`mediaUrl\`
Post responses expose \`mediaUrl\`:
- \`null\` when the post has no media.
- Otherwise a **short-lived presigned URL** (valid ~15 min) served through the
  gateway. Fetch the bytes directly from that URL — no auth header needed, the
  signature carries the grant. The URL is re-generated on every read, so do not
  cache it past its expiry; re-fetch the post to get a fresh one.
`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Healthbook API')
    .setDescription(MEDIA_DOCS)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('post', 'Posts and their media attachments')
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
