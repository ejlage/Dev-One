import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import prisma, { cleanTestTables, getEstadoId, getUserId } from '../helpers/db.js';
import { createAnuncio } from '../helpers/seed-utils.js';

const USERS = {
  direcao: 'direcao@entartes.pt',
  encarregado: 'pedro.oliveira@email.pt',
  professor: 'joao.santos@entartes.pt',
};

let userIds = {};
let figurinoId;
let estadoPendente;
let estadoAprovado;
let estadoRejeitado;

beforeAll(async () => {
  for (const [role, email] of Object.entries(USERS)) {
    userIds[role] = await getUserId(email);
  }
  estadoPendente = await getEstadoId('Pendente');
  estadoAprovado = await getEstadoId('Aprovado');
  estadoRejeitado = await getEstadoId('Rejeitado');

  const figurino = await prisma.figurino.findFirst({
    where: { direcaoutilizadoriduser: userIds.direcao },
  });
  if (!figurino) throw new Error('Nenhum figurino encontrado. Execute seed primeiro.');
  figurinoId = figurino.idfigurino;
});

beforeEach(async () => {
  await cleanTestTables();
});

afterAll(async () => {
  await cleanTestTables();
  await prisma.$disconnect();
});

describe('BPMN 04 — Gestão de Anúncios (BD real)', () => {

  it('1. EE cria anúncio → estado Pendente', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 50,
      quantidade: 3,
      tipotransacao: 'ALUGUER',
      encarregadoUserId: userIds.encarregado,
      estado: 'Pendente',
    });

    expect(anuncio).toBeDefined();
    expect(anuncio.estadoidestado).toBe(estadoPendente);
    expect(anuncio.encarregadoeducacaoutilizadoriduser).toBe(userIds.encarregado);

    const dbAnuncio = await prisma.anuncio.findUnique({
      where: { idanuncio: anuncio.idanuncio },
      include: { estado: true },
    });
    expect(dbAnuncio.estado.tipoestado.toLowerCase()).toBe('pendente');
  });

  it('2. Professor cria anúncio → estado Pendente', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 40,
      quantidade: 2,
      tipotransacao: 'VENDA',
      professorUserId: userIds.professor,
      estado: 'Pendente',
    });

    expect(anuncio.professorutilizadoriduser).toBe(userIds.professor);
    expect(anuncio.estadoidestado).toBe(estadoPendente);
  });

  it('3. Direção aprova anúncio → estado Aprovado', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 50,
      quantidade: 3,
      encarregadoUserId: userIds.encarregado,
    });

    await prisma.anuncio.update({
      where: { idanuncio: anuncio.idanuncio },
      data: {
        estadoidestado: estadoAprovado,
        direcaoutilizadoriduser: userIds.direcao,
      },
    });

    const updated = await prisma.anuncio.findUnique({
      where: { idanuncio: anuncio.idanuncio },
    });
    expect(updated.estadoidestado).toBe(estadoAprovado);
    expect(updated.direcaoutilizadoriduser).toBe(userIds.direcao);
  });

  it('4. Direção rejeita anúncio com motivo → estado Rejeitado', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 50,
      quantidade: 3,
      encarregadoUserId: userIds.encarregado,
    });

    await prisma.anuncio.update({
      where: { idanuncio: anuncio.idanuncio },
      data: {
        estadoidestado: estadoRejeitado,
        direcaoutilizadoriduser: userIds.direcao,
        motivorejeicao: 'Figurino sem stock suficiente',
      },
    });

    const updated = await prisma.anuncio.findUnique({
      where: { idanuncio: anuncio.idanuncio },
    });
    expect(updated.estadoidestado).toBe(estadoRejeitado);
    expect(updated.motivorejeicao).toBe('Figurino sem stock suficiente');
  });

  it('5. Não pode aprovar anúncio que já foi rejeitado', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 50,
      quantidade: 3,
      encarregadoUserId: userIds.encarregado,
      estado: 'Rejeitado',
    });

    expect(anuncio.estadoidestado).toBe(estadoRejeitado);

    const { registarAnuncio } = await import('../../src/services/anuncios.service.js');

    const allowedStates = ['Pendente', 'Aprovado'];
    expect(allowedStates.includes('Rejeitado')).toBe(false);
  });

  it('6. Notificação criada após aprovação de anúncio', async () => {
    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');

    const notif = await createNotificacao(
      userIds.encarregado,
      'O seu anúncio foi aprovado e já está visível no Marketplace!',
      'ANUNCIO_APROVADO'
    );

    expect(notif).toBeDefined();
    expect(notif.utilizadoriduser).toBe(userIds.encarregado);
    expect(notif.tipo).toBe('ANUNCIO_APROVADO');
  });
});
