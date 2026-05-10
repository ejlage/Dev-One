import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import { getTokenForUser } from '../helpers/auth-utils.js';
import prisma from '../helpers/db.js';

let app;
let direcaoToken;
let encarregadoToken;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  const d = await getTokenForUser('direcao@entartes.pt');
  direcaoToken = d.token;
  const e = await getTokenForUser('pedro.oliveira@email.pt');
  encarregadoToken = e.token;
});

afterAll(async () => {
  await app.close();
});

describe('Contrato: Respostas de sucesso usam { success, data }', () => {
  it('GET /api/public/modalidades', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/public/modalidades' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const item = body.data[0];
      expect(item).toHaveProperty('idmodalidade');
      expect(item).toHaveProperty('nome');
    }
  });

  it('GET /api/public/eventos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/public/eventos' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const item = body.data[0];
      expect(item).toHaveProperty('titulo');
      expect(item).toHaveProperty('data');
    }
  });

  it('GET /api/public/disponibilidades', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/public/disponibilidades' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const d = body.data[0];
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('professorId');
      expect(d).toHaveProperty('data');
      expect(d).toHaveProperty('horaInicio');
      expect(d).toHaveProperty('horaFim');
      expect(d).toHaveProperty('modalidade');
    }
  });

  it('GET /api/users (DIRECAO)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const u = body.data[0];
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('nome');
      expect(u).toHaveProperty('email');
      expect(u).toHaveProperty('role');
    }
  });
});

describe('Contrato: Erros sem auth usam 401', () => {
  const protectedEndpoints = [
    ['GET', '/api/users'],
    ['GET', '/api/eventos'],
    ['GET', '/api/notificacoes'],
    ['GET', '/api/anuncios'],
  ];

  for (const [method, url] of protectedEndpoints) {
    it(`${method} ${url} → 401`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
});

describe('Contrato: Erros de validação retornam 400', () => {
  it('POST /api/auth/register sem campos', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register', payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login com dados inválidos', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: 'inexistente@test.pt', password: 'x' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('Contrato: Login devolve token + user', () => {
  it('POST /api/auth/login shape', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: 'direcao@entartes.pt', password: 'password123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.').length).toBe(3);
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('nome');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('role');
  });
});

describe('Contrato: Eventos CRUD shape', () => {
  it('POST /api/eventos shape', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/eventos',
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: { titulo: 'Contract Evento', descricao: 'Teste', data: '2026-06-15', local: 'Sala A' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    if (body.data) {
      expect(body.data).toHaveProperty('titulo', 'Contract Evento');
    }
  });
});

describe('Contrato: Notificações shape', () => {
  it('GET /api/notificacoes shape', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/notificacoes',
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('success', true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const n = body.data[0];
      expect(n).toHaveProperty('idnotificacao');
      expect(n).toHaveProperty('mensagem');
      expect(n).toHaveProperty('tipo');
      expect(n).toHaveProperty('lida');
    }
  });
});

describe('Contrato: Erro 404 para recursos inexistentes', () => {
  it('GET /api/eventos/:id inexistente (DIRECAO)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/eventos/999999',
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
