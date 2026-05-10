import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import prisma from '../helpers/db.js';
import { getTokenForUser } from '../helpers/auth-utils.js';

let app;
let direcaoToken;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  const { token } = await getTokenForUser('direcao@entartes.pt');
  direcaoToken = token;
});

afterAll(async () => {
  await app.close();
});

describe('GET /api/public/eventos', () => {
  it('deve listar eventos públicos sem auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/public/eventos',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});

describe('POST /api/eventos (DIRECAO)', () => {
  it('deve criar evento com dados válidos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/eventos',
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: {
        titulo: 'Evento Teste',
        descricao: 'Descrição do evento',
        data: '2026-06-01',
        local: 'Estúdio A',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().success).toBe(true);
  });

  it('deve rejeitar criação sem auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/eventos',
      payload: {
        titulo: 'Evento Teste',
        descricao: 'Descrição',
        data: '2026-06-01',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('deve rejeitar criação com campos em falta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/eventos',
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: { titulo: 'Incompleto' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/eventos/:id (DIRECAO)', () => {
  let eventoId;

  beforeAll(async () => {
    const evento = await prisma.evento.create({
      data: {
        titulo: 'Evento para editar',
        descricao: 'Descrição original',
        dataevento: new Date('2026-07-01'),
        publicado: false,
      },
    });
    eventoId = evento.idevento;
  });

  it('deve editar evento existente', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/eventos/${eventoId}`,
      headers: { authorization: `Bearer ${direcaoToken}` },
      payload: { titulo: 'Evento Editado' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('deve rejeitar edição sem auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/eventos/${eventoId}`,
      payload: { titulo: 'Editado sem auth' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/eventos/:id/publish (DIRECAO)', () => {
  let eventoId;

  beforeAll(async () => {
    const evento = await prisma.evento.create({
      data: {
        titulo: 'Evento para publicar',
        descricao: 'Descrição',
        dataevento: new Date('2026-08-01'),
        publicado: false,
      },
    });
    eventoId = evento.idevento;
  });

  it('deve publicar evento', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/eventos/${eventoId}/publish`,
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    expect(res.statusCode).toBe(200);
    if (res.json().evento) {
      expect(res.json().evento.publicado).toBe(true);
    }
  });

  it('deve rejeitar publicação sem auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/eventos/${eventoId}/publish`,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/eventos/:id (DIRECAO)', () => {
  let eventoId;

  beforeAll(async () => {
    const evento = await prisma.evento.create({
      data: {
        titulo: 'Evento para eliminar',
        descricao: 'Descrição',
        dataevento: new Date('2026-09-01'),
        publicado: false,
      },
    });
    eventoId = evento.idevento;
  });

  it('deve eliminar evento', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/eventos/${eventoId}`,
      headers: { authorization: `Bearer ${direcaoToken}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('deve rejeitar eliminação sem auth', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/eventos/9999`,
    });
    expect(res.statusCode).toBe(401);
  });
});
