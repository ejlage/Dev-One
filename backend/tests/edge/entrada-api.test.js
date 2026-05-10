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

describe('Edge: SQL Injection', () => {
  it('login com SQL injection no email', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: "'; DROP TABLE utilizador; --", password: 'x' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('registo com SQL injection no nome', async () => {
    const email = `sqli_${Date.now()}@test.pt`;
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: "Robert'); DROP TABLE alunos;--", email, telemovel: '999999999', password: 'Pass123' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('forgot-password com SQL injection', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/forgot-password',
      payload: { email: "' OR 1=1 --" },
    });
    // Schema validation (format: email) rejects invalid format before handler → 400
    expect(res.statusCode).toBe(400);
  });
});

describe('Edge: XSS / HTML Injection', () => {
  const xssEmail = `xss_${Date.now()}@test.pt`;

  it('registo com script injection no nome', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: '<script>alert("XSS")</script>', email: xssEmail, telemovel: '999999999', password: 'Pass123' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('evento com HTML injection', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/eventos',
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: { titulo: '<img src=x onerror=alert(1)>', descricao: '<iframe src="evil.com"></iframe>', data: '2026-07-01' },
    });
    expect(res.statusCode).toBe(201);
  });
});

describe('Edge: Strings muito longas', () => {
  it('nome com 500 caracteres', async () => {
    const longNome = 'A'.repeat(500);
    const email = `long_${Date.now()}@test.pt`;
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: longNome, email, telemovel: '999999999', password: 'Pass123' },
    });
    expect(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 500).toBe(true);
  });

  it('email com 300 caracteres', async () => {
    const longEmail = `${'a'.repeat(250)}@test.pt`;
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: 'Long Email Test', email: longEmail, telemovel: '999999999', password: 'Pass123' },
    });
    expect(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 500).toBe(true);
  });
});

describe('Edge: Valores extremos', () => {
  it('password vazia no registo', async () => {
    const email = `empty_${Date.now()}@test.pt`;
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: 'No Password', email, telemovel: '999999999', password: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('login com password vazia', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: 'direcao@entartes.pt', password: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('telemovel com letras em vez de números', async () => {
    const email = `alpha_${Date.now()}@test.pt`;
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: 'Alpha Tel', email, telemovel: 'ABCDEFGHIJ', password: 'Pass123' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('data de evento no passado distante', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/eventos',
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: { titulo: 'Evento Histórico', descricao: 'Teste', data: '1900-01-01' },
    });
    expect([200, 201, 400]).toContain(res.statusCode);
  });
});

describe('Edge: Tokens inválidos', () => {
  it('token mal formatado', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: 'Bearer not-a-jwt-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('token expirado (manipulado)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZXhwIjoxNTAwMDAwMDAwfQ.invalid' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('token sem prefixo Bearer', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: 'Token123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('header Authorization vazio', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: '' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Edge: Payloads mal formatados', () => {
  it('payload como string em vez de objeto', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: 'isto é uma string, não json',
      headers: { 'content-type': 'application/json' },
    });
    expect([400, 500]).toContain(res.statusCode);
  });

  it('payload com campos nulos', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: null, password: null },
    });
    expect(res.statusCode === 400 || res.statusCode === 500).toBe(true);
  });
});

describe('Edge: Caracteres especiais', () => {
  const specialEmail = `special_${Date.now()}@test.pt`;

  it('registo com acentos e caracteres UTF-8', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: 'João González Müller 中文', email: specialEmail, telemovel: '999999999', password: 'Pass123' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('evento com emojis no título', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/eventos',
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: { titulo: '🎉 Evento Especial 🎭', descricao: '✨ Teste ✨', data: '2026-08-01' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('registo com caracteres de escape', async () => {
    const email = `escape_${Date.now()}@test.pt`;
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { nome: 'Test\nNewline\tTab\r\n', email, telemovel: '999999999', password: 'Pass123' },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('Edge: Concorrência básica', () => {
  it('múltiplos registos simultâneos com mesmo email', async () => {
    const sharedEmail = `concurrent_${Date.now()}@test.pt`;
    const results = await Promise.all([
      app.inject({ method: 'POST', url: '/api/auth/register', payload: { nome: 'Concorrência 1', email: sharedEmail, telemovel: '999999991', password: 'Pass123' } }),
      app.inject({ method: 'POST', url: '/api/auth/register', payload: { nome: 'Concorrência 2', email: sharedEmail, telemovel: '999999992', password: 'Pass123' } }),
      app.inject({ method: 'POST', url: '/api/auth/register', payload: { nome: 'Concorrência 3', email: sharedEmail, telemovel: '999999993', password: 'Pass123' } }),
    ]);
    const successes = results.filter(r => r.statusCode === 200).length;
    expect(successes).toBeLessThanOrEqual(1);
  });
});

describe('Edge: Token invalidation on role change', () => {
  let tokenAntesRoleChange;
  let userId;

  beforeAll(async () => {
    const ee = await getTokenForUser('pedro.oliveira@email.pt');
    tokenAntesRoleChange = ee.token;
    userId = ee.user.iduser;
  });

  it('token com role ENCARREGADO funciona antes da alteração', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/notificacoes',
      headers: { authorization: `Bearer ${tokenAntesRoleChange}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('após alterar role para UTILIZADOR, verifyToken NÃO invalida token automaticamente', async () => {
    await prisma.utilizador.update({
      where: { iduser: userId },
      data: { role: 'UTILIZADOR' },
    });

    const res = await app.inject({
      method: 'GET', url: '/api/notificacoes',
      headers: { authorization: `Bearer ${tokenAntesRoleChange}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it('login com novas credenciais devolve role correta', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: 'pedro.oliveira@email.pt', password: 'password123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.role).toBe('UTILIZADOR');
  });

  afterAll(async () => {
    await prisma.utilizador.update({
      where: { iduser: userId },
      data: { role: 'ENCARREGADO' },
    });
  });
});

describe('Edge: Token invalidation on user deactivation', () => {
  let tokenAntesDesativar;
  let userId;

  beforeAll(async () => {
    const d = await getTokenForUser('direcao@entartes.pt');
    tokenAntesDesativar = d.token;
    userId = d.user.iduser;
  });

  it('token funciona antes de desativar', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: `Bearer ${tokenAntesDesativar}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('após desativar utilizador, verifyToken invalida o token (retorna 401)', async () => {
    await prisma.utilizador.update({
      where: { iduser: userId },
      data: { estado: false },
    });

    const res = await app.inject({
      method: 'GET', url: '/api/users',
      headers: { authorization: `Bearer ${tokenAntesDesativar}` },
    });

    expect(res.statusCode).toBe(401);
  });

  afterAll(async () => {
    await prisma.utilizador.update({
      where: { iduser: userId },
      data: { estado: true },
    });
  });
});
