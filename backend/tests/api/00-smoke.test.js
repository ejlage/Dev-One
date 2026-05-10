import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import prisma from '../helpers/db.js';
import { getUserId } from '../helpers/db.js';

let app;
let direcaoToken;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  const direcaoId = await getUserId('direcao@entartes.pt');
  const { generateToken } = await import('../helpers/auth-utils.js');
  direcaoToken = generateToken({ id: direcaoId, role: 'DIRECAO' });
});

afterAll(async () => {
  await app.close();
});

describe('Smoke tests — buildApp().inject()', () => {

  it('GET /api/public/modalidades — 200 sem auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/public/modalidades',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/public/eventos — 200 sem auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/public/eventos',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/users — 401 sem token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/users — 200 com token DIRECAO', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/public/disponibilidades — 200 sem auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/public/disponibilidades',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });
});
