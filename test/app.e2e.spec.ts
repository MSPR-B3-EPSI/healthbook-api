import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

// Smoke test : vérifie que le câblage de l'application est sain
// (le module compile, l'app démarre, l'endpoint public répond).
describe('App bootstrap (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('démarre sans erreur', () => {
    expect(app).toBeDefined();
  });

  it('expose la route publique /status', () => {
    return request(app.getHttpServer()).get('/status').expect(200);
  });
});
