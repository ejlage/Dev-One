import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import prisma, { cleanTestTables, getEstadoId, getUserId } from '../helpers/db.js';
import { createAnuncio, createTransacaoFigurino } from '../helpers/seed-utils.js';

const USERS = {
  direcao: 'direcao@entartes.pt',
  encarregado: 'pedro.oliveira@email.pt',
};

let userIds = {};
let figurinoId;
let estadoPendente;
let estadoAprovado;

beforeAll(async () => {
  for (const [role, email] of Object.entries(USERS)) {
    userIds[role] = await getUserId(email);
  }
  estadoPendente = await getEstadoId('Pendente');
  estadoAprovado = await getEstadoId('Aprovado');

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

describe('BPMN 03 — Aluguer de Figurino (BD real)', () => {

  it('1. EE solicita aluguer de figurino → transação criada como Pendente', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 30,
      quantidade: 5,
      direcaoUserId: userIds.direcao,
      estado: 'Pendente',
    });

    const transacao = await createTransacaoFigurino({
      anuncioId: anuncio.idanuncio,
      encarregadoUserId: userIds.encarregado,
      quantidade: 1,
      estado: 'Pendente',
    });

    expect(transacao).toBeDefined();
    expect(transacao.encarregadoeducacaoutilizadoriduser).toBe(userIds.encarregado);
    expect(transacao.quantidade).toBe(1);

    const dbTransacao = await prisma.transacaofigurino.findUnique({
      where: { idtransacao: transacao.idtransacao },
      include: { estado: true },
    });
    expect(dbTransacao.estado.tipoestado.toLowerCase()).toBe('pendente');
  });

  it('2. Direção aprova aluguer → estado muda para Aprovado', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 30,
      quantidade: 5,
      direcaoUserId: userIds.direcao,
    });
    const transacao = await createTransacaoFigurino({
      anuncioId: anuncio.idanuncio,
      encarregadoUserId: userIds.encarregado,
      quantidade: 1,
    });

    await prisma.transacaofigurino.update({
      where: { idtransacao: transacao.idtransacao },
      data: {
        estadoidestado: estadoAprovado,
        direcaoutilizadoriduser: userIds.direcao,
      },
    });

    const updated = await prisma.transacaofigurino.findUnique({
      where: { idtransacao: transacao.idtransacao },
    });
    expect(updated.estadoidestado).toBe(estadoAprovado);
    expect(updated.direcaoutilizadoriduser).toBe(userIds.direcao);
  });

  it('3. Direção rejeita aluguer → estado muda para Rejeitado', async () => {
    const estadoRejeitado = await getEstadoId('Rejeitado');
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 30,
      quantidade: 5,
      direcaoUserId: userIds.direcao,
    });
    const transacao = await createTransacaoFigurino({
      anuncioId: anuncio.idanuncio,
      encarregadoUserId: userIds.encarregado,
      quantidade: 1,
    });

    await prisma.transacaofigurino.update({
      where: { idtransacao: transacao.idtransacao },
      data: {
        estadoidestado: estadoRejeitado,
        direcaoutilizadoriduser: userIds.direcao,
        motivorejeicao: 'Figurino indisponível para as datas solicitadas',
      },
    });

    const updated = await prisma.transacaofigurino.findUnique({
      where: { idtransacao: transacao.idtransacao },
    });
    expect(updated.estadoidestado).toBe(estadoRejeitado);
    expect(updated.motivorejeicao).toBeTruthy();
  });

  it('4. Notificação criada após aprovação de aluguer', async () => {
    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');

    const notif = await createNotificacao(
      userIds.encarregado,
      'A sua reserva de figurino foi aprovada!',
      'ALUGUER_APROVADO'
    );

    expect(notif).toBeDefined();
    expect(notif.utilizadoriduser).toBe(userIds.encarregado);
    expect(notif.tipo).toBe('ALUGUER_APROVADO');
  });

  it('5. Valida que quantidade disponível não pode ser excedida', async () => {
    const anuncio = await createAnuncio({
      figurinoId,
      valor: 30,
      quantidade: 5,
      direcaoUserId: userIds.direcao,
    });

    await createTransacaoFigurino({
      anuncioId: anuncio.idanuncio,
      encarregadoUserId: userIds.encarregado,
      quantidade: 5,
    });

    const totalReservado = await prisma.transacaofigurino.aggregate({
      where: { anuncioidanuncio: anuncio.idanuncio },
      _sum: { quantidade: true },
    });

    const disponivel = anuncio.quantidade - (totalReservado._sum.quantidade || 0);
    expect(disponivel).toBe(0);
  });
});
