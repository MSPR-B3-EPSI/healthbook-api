import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../src/helpers/prisma.service.js';
import {
  FakeJwtAuthGuard,
  OTHER_USER,
  TEST_USER,
} from './utils/auth-bypass.js';
import { resetDb } from './utils/db.js';

const UNKNOWN_UUID = '99999999-9999-4999-8999-999999999999';

describe('PostController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    // resetDb efface tout : on exige une base de test.
    if (!/test/i.test(process.env.DATABASE_URL ?? '')) {
      throw new Error(
        'DATABASE_URL doit pointer vers une base de test (nom contenant "test").',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    FakeJwtAuthGuard.reset();
    await resetDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createPost(
    body = { title: 'Mon titre', content: 'Mon contenu' },
  ): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/post')
      .send(body)
      .expect(201);
    return res.body.id as string;
  }

  describe('GET /post', () => {
    it('retourne une liste paginée', async () => {
      await createPost();

      const res = await request(app.getHttpServer()).get('/post').expect(200);

      expect(res.body).toMatchObject({ total: 1, page: 1, limit: 20 });
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        title: 'Mon titre',
        authorId: TEST_USER.sub,
        likesCount: 0,
        commentsCount: 0,
      });
    });

    it('filtre par authorId', async () => {
      await createPost();

      const mine = await request(app.getHttpServer())
        .get('/post')
        .query({ authorId: TEST_USER.sub })
        .expect(200);
      expect(mine.body.total).toBe(1);

      const others = await request(app.getHttpServer())
        .get('/post')
        .query({ authorId: OTHER_USER.sub })
        .expect(200);
      expect(others.body.total).toBe(0);
    });
  });

  describe('GET /post/:id', () => {
    it('retourne le post mappé', async () => {
      const id = await createPost();

      const res = await request(app.getHttpServer())
        .get(`/post/${id}`)
        .expect(200);

      expect(res.body).toMatchObject({ id, title: 'Mon titre' });
    });

    it('renvoie 404 pour un id inconnu', async () => {
      await request(app.getHttpServer())
        .get(`/post/${UNKNOWN_UUID}`)
        .expect(404);
    });

    it('renvoie 400 pour un id non-UUID', async () => {
      await request(app.getHttpServer()).get('/post/not-a-uuid').expect(400);
    });
  });

  describe('POST /post', () => {
    it('crée un post dont l’auteur est l’utilisateur courant', async () => {
      const res = await request(app.getHttpServer())
        .post('/post')
        .send({ title: 'T', content: 'C', mediaUrl: 'https://ex.com/i.png' })
        .expect(201);

      expect(res.body.authorId).toBe(TEST_USER.sub);
      expect(res.body.mediaUrl).toBe('https://ex.com/i.png');
    });

    it('renvoie 400 si le DTO est invalide (titre vide, mediaUrl non URL)', async () => {
      await request(app.getHttpServer())
        .post('/post')
        .send({ title: '', content: 'C' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/post')
        .send({ title: 'T', content: 'C', mediaUrl: 'pas-une-url' })
        .expect(400);
    });
  });

  describe('PATCH /post/:id', () => {
    it('met à jour le post du propriétaire', async () => {
      const id = await createPost();

      const res = await request(app.getHttpServer())
        .patch(`/post/${id}`)
        .send({ title: 'Mis à jour' })
        .expect(200);

      expect(res.body.title).toBe('Mis à jour');
    });

    it('renvoie 403 pour un non-propriétaire', async () => {
      const id = await createPost();

      FakeJwtAuthGuard.setCurrentUser(OTHER_USER);
      await request(app.getHttpServer())
        .patch(`/post/${id}`)
        .send({ title: 'Pirate' })
        .expect(403);
    });

    it('renvoie 404 pour un id inconnu', async () => {
      await request(app.getHttpServer())
        .patch(`/post/${UNKNOWN_UUID}`)
        .send({ title: 'x' })
        .expect(404);
    });
  });

  describe('POST /post/like/:id', () => {
    it('like puis unlike le même post', async () => {
      const id = await createPost();

      const liked = await request(app.getHttpServer())
        .post(`/post/like/${id}`)
        .expect(201);
      expect(liked.body).toEqual({ liked: true, likesCount: 1 });

      const unliked = await request(app.getHttpServer())
        .post(`/post/like/${id}`)
        .expect(201);
      expect(unliked.body).toEqual({ liked: false, likesCount: 0 });
    });

    it('renvoie 404 pour un id inconnu', async () => {
      await request(app.getHttpServer())
        .post(`/post/like/${UNKNOWN_UUID}`)
        .expect(404);
    });
  });

  describe('DELETE /post/:id', () => {
    it('supprime le post du propriétaire et ses dépendances (cascade)', async () => {
      const id = await createPost();
      await request(app.getHttpServer()).post(`/post/like/${id}`).expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/post/${id}`)
        .expect(200);
      expect(res.body).toEqual({ deleted: true });

      await request(app.getHttpServer()).get(`/post/${id}`).expect(404);
      expect(await prisma.postLike.count()).toBe(0);
    });

    it('renvoie 403 pour un non-propriétaire', async () => {
      const id = await createPost();

      FakeJwtAuthGuard.setCurrentUser(OTHER_USER);
      await request(app.getHttpServer()).delete(`/post/${id}`).expect(403);
    });

    it('renvoie 404 pour un id inconnu', async () => {
      await request(app.getHttpServer())
        .delete(`/post/${UNKNOWN_UUID}`)
        .expect(404);
    });
  });
});
