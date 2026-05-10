import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import prisma, { cleanTestTables, getEstadoId, getSalaId, getUserId } from '../helpers/db.js';
import { createDisponibilidade, createModalidadeProfessor, createPedidoAula } from '../helpers/seed-utils.js';

const USERS = {
  direcao: 'direcao@entartes.pt',
  professor: 'joao.santos@entartes.pt',
  encarregado: 'pedro.oliveira@email.pt',
  aluno: 'miguel.silva@email.pt',
};

let userIds = {};
let salaId;
let mp;

beforeAll(async () => {
  for (const [role, email] of Object.entries(USERS)) {
    userIds[role] = await getUserId(email);
  }
  salaId = await getSalaId('Estúdio A - Principal');

  const modalidade = await prisma.modalidade.findFirst();
  mp = await createModalidadeProfessor({ professorId: userIds.professor, modalidadeId: modalidade.idmodalidade });
});

beforeEach(async () => {
  await cleanTestTables();
});

afterAll(async () => {
  await cleanTestTables();
  await prisma.$disconnect();
});

describe('Pedido Aula Scheduler — Auto-Rejeição (3h timeout)', () => {
  it('deve rejeitar pedidos Pendente com mais de 3 horas', async () => {
    const estadoPendente = await getEstadoId('Pendente');
    const estadoRejeitado = await getEstadoId('Rejeitado');

    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });
    expect(pedido.estadoidestado).toBe(estadoPendente);

    const quatroHorasAtras = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await prisma.$executeRawUnsafe(
      'UPDATE pedidodeaula SET datapedido = $1 WHERE idpedidoaula = $2',
      quatroHorasAtras, pedido.idpedidoaula
    );

    const tresHorasAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const pedidosAntigos = await prisma.pedidodeaula.findMany({
      where: {
        estadoidestado: estadoPendente,
        datapedido: { lte: tresHorasAgo },
      },
    });
    expect(pedidosAntigos.length).toBeGreaterThanOrEqual(1);

    for (const p of pedidosAntigos) {
      await prisma.pedidodeaula.update({
        where: { idpedidoaula: p.idpedidoaula },
        data: { estadoidestado: estadoRejeitado },
      });
    }

    const rejeitados = await prisma.pedidodeaula.findMany({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(rejeitados[0].estadoidestado).toBe(estadoRejeitado);
  });

  it('deve manter pedidos recentes como Pendente', async () => {
    const estadoPendente = await getEstadoId('Pendente');
    const estadoRejeitado = await getEstadoId('Rejeitado');

    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });

    const recente = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(recente.estadoidestado).toBe(estadoPendente);
    expect(recente.estadoidestado).not.toBe(estadoRejeitado);
  });

  it('deve criar notificação ao rejeitar automaticamente', async () => {
    const estadoPendente = await getEstadoId('Pendente');
    const estadoRejeitado = await getEstadoId('Rejeitado');

    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });

    await prisma.$executeRawUnsafe(
      'UPDATE pedidodeaula SET datapedido = $1 WHERE idpedidoaula = $2',
      new Date(Date.now() - 4 * 60 * 60 * 1000), pedido.idpedidoaula
    );

await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { estadoidestado: estadoRejeitado },
    });

    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');
    const notif = await createNotificacao(
      userIds.encarregado,
      `O seu pedido de aula foi rejeitado automaticamente. Pode submeter um novo pedido.`,
      'PEDIDO_REJEITADO_AUTO'
    );

    expect(notif).toBeDefined();
    expect(notif.utilizadoriduser).toBe(userIds.encarregado);
    expect(notif.tipo).toBe('PEDIDO_REJEITADO_AUTO');
  });
});

describe('Pedido Aula Scheduler — Expiração de Sugestões', () => {
  it('deve expirar sugestão AGUARDA_PROFESSOR após prazo', async () => {
    const estadoPendente = await getEstadoId('Pendente');
    const estadoCancelado = await getEstadoId('Cancelado');

    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_PROFESSOR',
      novadata: '2026-05-20',
    });

    const dataLimiteExpirada = new Date(Date.now() - 1000);
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { novaDataLimite: dataLimiteExpirada },
    });

    const expiradas = await prisma.pedidodeaula.findMany({
      where: {
        novaDataLimite: { not: null, lte: new Date() },
        sugestaoestado: { not: null },
      },
    });
    expect(expiradas.length).toBeGreaterThanOrEqual(1);

    for (const e of expiradas) {
      await prisma.pedidodeaula.update({
        where: { idpedidoaula: e.idpedidoaula },
        data: {
          novaDataLimite: null,
          novadata: null,
          sugestaoestado: null,
          ...(estadoCancelado && { estadoidestado: estadoCancelado }),
        },
      });
    }

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBeNull();
    expect(updated.novadata).toBeNull();
    expect(updated.novaDataLimite).toBeNull();
    if (estadoCancelado) {
      expect(updated.estadoidestado).toBe(estadoCancelado);
    }
  });

  it('não deve expirar sugestão com prazo ainda válido', async () => {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_PROFESSOR',
      novadata: '2026-05-20',
    });

    const dataLimiteFutura = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { novaDataLimite: dataLimiteFutura },
    });

    const expiradas = await prisma.pedidodeaula.findMany({
      where: {
        novaDataLimite: { not: null, lte: new Date() },
        sugestaoestado: { not: null },
      },
    });
    expect(expiradas.length).toBe(0);
  });
});

describe('Pedido Aula Scheduler — Stock Mínimo', () => {
  it('deve criar notificação quando stock abaixo do mínimo', async () => {
    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');

    const figurino = await prisma.figurino.findFirst({
      where: { stockminimo: { gt: 0 } },
    });

    if (figurino) {
      const notif = await createNotificacao(
        userIds.direcao,
        `Alerta de stock: O figurino #${figurino.idfigurino} tem apenas ${figurino.quantidadedisponivel} unidades disponíveis (mínimo: ${figurino.stockminimo})`,
        'STOCK_BAIXO'
      );

      expect(notif).toBeDefined();
      expect(notif.utilizadoriduser).toBe(userIds.direcao);
      expect(notif.tipo).toBe('STOCK_BAIXO');
    }
  });
});
