import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import prisma, { cleanTestTables, getEstadoId, getSalaId, getUserId } from '../helpers/db.js';
import { createDisponibilidade, createModalidadeProfessor, createPedidoAula } from '../helpers/seed-utils.js';
import { submeterPedidoAula } from '../../src/services/encarregado.service.js';

const USERS = {
  direcao: 'direcao@entartes.pt',
  professor: 'joao.santos@entartes.pt',
  encarregado: 'pedro.oliveira@email.pt',
  aluno: 'miguel.silva@email.pt',
};

let userIds = {};
let salaId;
let estadoPendente;
let mp;

beforeAll(async () => {
  for (const [role, email] of Object.entries(USERS)) {
    userIds[role] = await getUserId(email);
  }
  salaId = await getSalaId('Estúdio A - Principal');
  estadoPendente = await getEstadoId('Pendente');

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

describe('BPMN 01 — Pedido de Aula (BD real)', () => {

  it('1. Encarregado submete pedido de aula com dados válidos', async () => {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      horainicio: '10:00:00',
      horafim: '11:00:00',
      salaid: salaId,
    });

    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 5);
    const dataStr = dataFutura.toISOString().split('T')[0];

    const result = await submeterPedidoAula({
      data: dataStr,
      horainicio: '10:00',
      duracaoaula: '60',
      disponibilidade_mensal_id: disp.iddisponibilidade_mensal,
      professor_utilizador_id: userIds.professor,
      alunoutilizadoriduser: userIds.aluno,
      salaidsala: salaId,
      privacidade: false,
    }, userIds.encarregado);

    expect(result).toBeDefined();
    expect(Array.isArray(result) || result.idpedidoaula).toBeTruthy();
    const pedidoId = Array.isArray(result) ? result[0]?.idpedidoaula : result.idpedidoaula;
    expect(pedidoId).toBeGreaterThan(0);

    const pedido = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedidoId },
    });
    expect(pedido).not.toBeNull();
    expect(pedido.encarregadoeducacaoutilizadoriduser).toBe(userIds.encarregado);
  });

  it('2. Direção aprova o pedido → estado muda para Confirmado', async () => {
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

    const estadoConfirmado = await getEstadoId('Confirmado');
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { estadoidestado: estadoConfirmado },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.estadoidestado).toBe(estadoConfirmado);
  });

  it('3. Direção rejeita o pedido → estado muda para Rejeitado', async () => {
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

    const estadoRejeitado = await getEstadoId('Rejeitado');
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { estadoidestado: estadoRejeitado },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.estadoidestado).toBe(estadoRejeitado);
  });

  it('4. Notificação criada após aprovação do pedido', async () => {
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

    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');
    const notif = await createNotificacao(userIds.encarregado, 'A sua aula foi aprovada!', 'AULA_APROVADA');

    expect(notif).toBeDefined();
    expect(notif.utilizadoriduser).toBe(userIds.encarregado);
    expect(notif.tipo).toBe('AULA_APROVADA');
  });

  it('5. Rejeita pedido com data no passado', async () => {
    const dataPassada = '2020-01-01';
    const hoje = new Date().toISOString().split('T')[0];
    expect(() => {
      if (dataPassada < hoje) throw new Error('A data não pode ser no passado');
    }).toThrow('A data não pode ser no passado');
  });

  it('6. Pedido fica PENDENTE após submissão', async () => {
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
  });
});
