import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import prisma from '../helpers/db.js';

let app;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /api/auth/register', () => {
  const testEmail = `test_register_${Date.now()}@test.pt`;

  it('deve registar novo utilizador com dados válidos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        nome: 'Test User',
        email: testEmail,
        telemovel: '999999999',
        password: 'TestPass123',
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toContain('sucesso');
  });

  it('deve rejeitar registo com email duplicado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        nome: 'Test User',
        email: testEmail,
        telemovel: '999999998',
        password: 'TestPass123',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Email já registado');
  });

  it('deve rejeitar registo com campos em falta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { nome: 'Incomplete' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('deve fazer login com credenciais válidas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'direcao@entartes.pt',
        password: 'password123',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
    expect(body.user.role).toBe('DIRECAO');
  });

  it('deve rejeitar login com password incorreta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'direcao@entartes.pt',
        password: 'wrongpassword',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('deve rejeitar login com email inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'naoexiste@test.pt',
        password: 'password123',
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('deve gerar token para email existente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'direcao@entartes.pt' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeTruthy();
  });

  it('deve retornar 404 para email inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'naoexiste@test.pt' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('deve rejeitar pedido sem email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  let resetToken;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'joao.santos@entartes.pt' },
    });
    resetToken = res.json().token;
  });

  it('deve alterar password com token válido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: resetToken, password: 'NewPass123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'joao.santos@entartes.pt', password: 'NewPass123' },
    });
    expect(loginRes.statusCode).toBe(200);
  });

  it('deve rejeitar token inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'invalid_token_123', password: 'NewPass123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('deve rejeitar pedido sem token ou password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  afterAll(async () => {
    const hashed = await import('bcrypt').then(m => m.hash('password123', 10));
    await prisma.utilizador.update({
      where: { email: 'joao.santos@entartes.pt' },
      data: { password: hashed },
    });
  });
});

describe('tokenVersion — revogação de tokens após alteração', () => {
  const testEmail = `tokenver_${Date.now()}@test.pt`;
  let oldToken;
  let direcaoToken;

  beforeAll(async () => {
    // Criar utilizador de teste
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { nome: 'Token Test', email: testEmail, telemovel: '999999990', password: 'TestPass123' },
    });
    expect(registerRes.statusCode).toBe(200);

    // Fazer login para obter token com tokenVersion
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: testEmail, password: 'TestPass123' },
    });
    expect(loginRes.statusCode).toBe(200);
    oldToken = loginRes.json().token;

    // Token da Direção para modificar o utilizador
    const direcaoLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'direcao@entartes.pt', password: 'password123' },
    });
    direcaoToken = direcaoLogin.json().token;
  });

  it('deve retornar 200 com token válido (antes da alteração)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${oldToken}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('deve retornar 401 após desativar utilizador (tokenVersion incrementado)', async () => {
    const userId = (await prisma.utilizador.findUnique({ where: { email: testEmail } })).iduser;

    // Desativar utilizador
    const desativarRes = await app.inject({
      method: 'PUT',
      url: `/api/users/${userId}`,
      headers: { authorization: `Bearer ${direcaoToken}`, 'content-type': 'application/json' },
      payload: { estado: false },
    });
    expect(desativarRes.statusCode).toBe(200);

    // Token antigo deve ser rejeitado
    const res = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${oldToken}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toContain('expirado');
  });

  it('deve retornar 401 após alterar role do utilizador (tokenVersion incrementado)', async () => {
    // Criar um segundo utilizador especificamente para teste de role
    const roleTestEmail = `tokenver_role_${Date.now()}@test.pt`;
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { nome: 'Role Change Test', email: roleTestEmail, telemovel: '999999989', password: 'TestPass123' },
    });
    expect(registerRes.statusCode).toBe(200);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: roleTestEmail, password: 'TestPass123' },
    });
    expect(loginRes.statusCode).toBe(200);
    const roleOldToken = loginRes.json().token;

    // Verificar que token funciona antes da alteração
    const beforeRes = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${roleOldToken}` },
    });
    expect(beforeRes.statusCode).toBe(200);

    // Alterar role do utilizador via Direção
    const userId = (await prisma.utilizador.findUnique({ where: { email: roleTestEmail } })).iduser;
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/users/${userId}`,
      headers: { authorization: `Bearer ${direcaoToken}`, 'content-type': 'application/json' },
      payload: { role: 'PROFESSOR' },
    });
    expect(updateRes.statusCode).toBe(200);

    // Token antigo deve ser rejeitado
    const afterRes = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${roleOldToken}` },
    });
    expect(afterRes.statusCode).toBe(401);

    // Limpeza
    const roleUser = await prisma.utilizador.findUnique({ where: { email: roleTestEmail } });
    if (roleUser) {
      await prisma.utilizador.delete({ where: { iduser: roleUser.iduser } }).catch(() => {});
    }
  });

  afterAll(async () => {
    const user = await prisma.utilizador.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.utilizador.update({ where: { iduser: user.iduser }, data: { estado: true } });
    }
  });
});
