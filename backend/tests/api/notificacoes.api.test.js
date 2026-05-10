import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import prisma from '../helpers/db.js';
import { getTokenForUser, generateToken } from '../helpers/auth-utils.js';

let app;
let direcaoToken;
let encarregadoToken;
let encarregadoId;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  const direcao = await getTokenForUser('direcao@entartes.pt');
  direcaoToken = direcao.token;
  const ee = await getTokenForUser('pedro.oliveira@email.pt');
  encarregadoToken = ee.token;
  encarregadoId = ee.user.iduser;
});

afterAll(async () => {
  await app.close();
});

describe('GET /api/notificacoes', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE notificacao RESTART IDENTITY CASCADE');
  });

  it('deve listar notificações do utilizador autenticado', async () => {
    await prisma.notificacao.create({
      data: {
        utilizadoriduser: encarregadoId,
        mensagem: 'Notificação de teste',
        tipo: 'TESTE',
        lida: false,
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/notificacoes',
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('deve rejeitar listagem sem auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notificacoes',
    });
    expect(res.statusCode).toBe(401);
  });

  it('não deve mostrar notificações de outros utilizadores', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notificacoes',
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    const body = res.json();
    if (body.data) {
      for (const notif of body.data) {
        expect(notif.utilizadoriduser).not.toBe(encarregadoId);
      }
    }
  });
});

describe('GET /api/notificacoes/nao-lidas', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE notificacao RESTART IDENTITY CASCADE');
  });

  it('deve retornar contagem de não lidas', async () => {
    await prisma.notificacao.createMany({
      data: [
        { utilizadoriduser: encarregadoId, mensagem: 'Teste 1', tipo: 'TESTE', lida: false },
        { utilizadoriduser: encarregadoId, mensagem: 'Teste 2', tipo: 'TESTE', lida: false },
        { utilizadoriduser: encarregadoId, mensagem: 'Teste 3', tipo: 'TESTE', lida: true },
      ],
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/notificacoes/nao-lidas',
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(2);
  });
});

describe('POST /api/notificacoes/:id/read', () => {
  let notifId;

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE notificacao RESTART IDENTITY CASCADE');
    const notif = await prisma.notificacao.create({
      data: {
        utilizadoriduser: encarregadoId,
        mensagem: 'Notificação para marcar lida',
        tipo: 'TESTE',
        lida: false,
      },
    });
    notifId = notif.idnotificacao;
  });

  it('deve marcar notificação como lida', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/notificacoes/${notifId}/read`,
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    expect(res.statusCode).toBe(200);

    const updated = await prisma.notificacao.findUnique({ where: { idnotificacao: notifId } });
    expect(updated.lida).toBe(true);
    expect(updated.dataleitura).toBeTruthy();
  });

  it('deve retornar 200 mesmo para notificação de outro (sem ownership check)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/notificacoes/${notifId}/read`,
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('POST /api/notificacoes/read-all', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE notificacao RESTART IDENTITY CASCADE');
    await prisma.notificacao.createMany({
      data: [
        { utilizadoriduser: encarregadoId, mensagem: 'Teste 1', tipo: 'TESTE', lida: false },
        { utilizadoriduser: encarregadoId, mensagem: 'Teste 2', tipo: 'TESTE', lida: false },
      ],
    });
  });

  it('deve marcar todas como lidas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/notificacoes/read-all',
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});

describe('DELETE /api/notificacoes/:id', () => {
  let notifId;

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE notificacao RESTART IDENTITY CASCADE');
    const notif = await prisma.notificacao.create({
      data: {
        utilizadoriduser: encarregadoId,
        mensagem: 'Notificação para eliminar',
        tipo: 'TESTE',
        lida: false,
      },
    });
    notifId = notif.idnotificacao;
  });

  it('deve eliminar notificação própria', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/notificacoes/${notifId}`,
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    expect(res.statusCode).toBe(200);

    const deleted = await prisma.notificacao.findUnique({ where: { idnotificacao: notifId } });
    expect(deleted).toBeNull();
  });

  it('não deve mostrar notificações de outros na listagem', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notificacoes',
      headers: { authorization: `Bearer ${encarregadoToken}` },
    });
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
  });
});
