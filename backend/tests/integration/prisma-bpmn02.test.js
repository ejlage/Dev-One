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

describe('BPMN 02 — Remarcação de Aula (BD real)', () => {

  async function criarPedidoPendente() {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      horainicio: '10:00:00',
      horafim: '11:00:00',
      salaid: salaId,
    });
    return createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });
  }

  it('1. Direção propõe nova data → sugestaoestado = AGUARDA_PROFESSOR', async () => {
    const pedido = await criarPedidoPendente();

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: {
        sugestaoestado: 'AGUARDA_PROFESSOR',
        novadata: new Date('2026-05-20'),
      },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBe('AGUARDA_PROFESSOR');
    expect(updated.novadata).toBeTruthy();
  });

  it('2. Professor aceita sugestão → AGUARDA_EE', async () => {
    const pedido = await criarPedidoPendente();
    const estadoConfirmado = await getEstadoId('Confirmado');

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { estadoidestado: estadoConfirmado },
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: {
        sugestaoestado: 'AGUARDA_PROFESSOR',
        novadata: new Date('2026-05-20'),
      },
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: 'AGUARDA_EE' },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBe('AGUARDA_EE');
  });

  it('3. Professor rejeita sugestão → sugestaoestado = null', async () => {
    const pedido = await criarPedidoPendente();

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: {
        sugestaoestado: 'AGUARDA_PROFESSOR',
        novadata: new Date('2026-05-20'),
      },
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: null, novadata: null },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBeNull();
    expect(updated.novadata).toBeNull();
  });

  it('4. EE aceita remarcação → data da aula actualizada', async () => {
    const pedido = await criarPedidoPendente();

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: {
        sugestaoestado: 'AGUARDA_EE',
        novadata: new Date('2026-05-25'),
      },
    });

    const novaData = new Date('2026-05-25');
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { data: novaData, sugestaoestado: null, novadata: null },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.data.toISOString().split('T')[0]).toBe('2026-05-25');
    expect(updated.sugestaoestado).toBeNull();
  });

  it('5. EE rejeita remarcação → sugestaoestado = null, data original mantida', async () => {
    const pedido = await criarPedidoPendente();
    const dataOriginal = pedido.data;

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: {
        sugestaoestado: 'AGUARDA_EE',
        novadata: new Date('2026-05-25'),
      },
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: null, novadata: null },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBeNull();
    expect(updated.novadata).toBeNull();
    expect(updated.data.toISOString().split('T')[0]).toBe(dataOriginal.toISOString().split('T')[0]);
  });

  it('6. Notificação criada na transição de estado de remarcação', async () => {
    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');

    const notif = await createNotificacao(
      userIds.encarregado,
      'A remarcação da sua aula foi aceite. Nova data: 2026-05-25',
      'AULA_REMARCADA'
    );

    expect(notif).toBeDefined();
    expect(notif.utilizadoriduser).toBe(userIds.encarregado);
    expect(notif.tipo).toBe('AULA_REMARCADA');
  });
});
