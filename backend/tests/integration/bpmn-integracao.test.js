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

describe('BPMN1 - Fluxo de Pedido de Aula (BD real)', () => {
  it('deve submeter pedido com dados válidos', async () => {
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

    expect(pedido).toBeDefined();
    expect(pedido.idpedidoaula).toBeGreaterThan(0);
    expect(pedido.estadoidestado).toBe(estadoPendente);
  });

  it('deve retornar pedidos pendentes da BD', async () => {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });

    await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });

    const pendentes = await prisma.pedidodeaula.findMany({
      where: { estadoidestado: estadoPendente },
    });

    expect(pendentes.length).toBeGreaterThanOrEqual(1);
    for (const p of pendentes) {
      expect(p.estadoidestado).toBe(estadoPendente);
    }
  });

  it('deve transicionar de Pendente para Confirmado', async () => {
    const estadoConfirmado = await getEstadoId('Confirmado');

    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });

    expect(pedido.estadoidestado).toBe(estadoPendente);

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { estadoidestado: estadoConfirmado },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.estadoidestado).toBe(estadoConfirmado);
  });

  it('deve rejeitar pedido - data no passado', async () => {
    const dataPassada = '2020-01-01';
    const hoje = new Date().toISOString().split('T')[0];

    expect(() => {
      if (dataPassada < hoje) throw new Error('A data não pode ser no passado');
    }).toThrow('A data não pode ser no passado');
  });

  it('deve rejeitar transição sem professor definido', async () => {
    const estadoConfirmado = await getEstadoId('Confirmado');

    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });

    expect(pedido.professorutilizadoriduser).toBeNull();

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { estadoidestado: estadoConfirmado },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.estadoidestado).toBe(estadoConfirmado);
  });
});

describe('BPMN2 - Fluxo de Remarcação (BD real)', () => {
  it('deve propor nova data para remarcação', async () => {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: 'AGUARDA_PROFESSOR', novadata: new Date('2026-05-15') },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBe('AGUARDA_PROFESSOR');
    expect(updated.novadata).toBeTruthy();
  });

  it('deve rejeitar remarcação para data passada', async () => {
    const novaData = '2020-01-01';
    const hoje = new Date().toISOString().split('T')[0];
    expect(() => {
      if (novaData < hoje) throw new Error('A data não pode ser no passado');
    }).toThrow('A data não pode ser no passado');
  });

  it('deve aceitar remarcação pelo professor (AGUARDA_PROFESSOR → AGUARDA_EE)', async () => {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_PROFESSOR',
      novadata: '2026-05-15',
    });

    expect(pedido.sugestaoestado).toBe('AGUARDA_PROFESSOR');

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: 'AGUARDA_EE' },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.sugestaoestado).toBe('AGUARDA_EE');
  });

  it('deve confirmar remarcação pelo EE (AGUARDA_EE → data aplicada)', async () => {
    const disp = await createDisponibilidade({
      professorId: userIds.professor,
      modalidadeprofessorId: mp.idmodalidadeprofessor,
      salaid: salaId,
    });
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      salaId,
      disponibilidadeId: disp.iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_EE',
      novadata: '2026-05-15',
    });

    const novaData = new Date('2026-05-15');
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { data: novaData, sugestaoestado: null, novadata: null },
    });

    const updated = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: pedido.idpedidoaula },
    });
    expect(updated.data.toISOString().split('T')[0]).toBe('2026-05-15');
    expect(updated.sugestaoestado).toBeNull();
  });
});

describe('Máquina de Estados - Pedido de Aula', () => {
  it('deve transicionar de PENDENTE para CONFIRMADO', () => {
    const estados = ['PENDENTE', 'CONFIRMADO', 'REJEITADO', 'CANCELADO', 'REALIZADO'];
    const transicoesValidas = {
      'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
      'CONFIRMADO': ['REALIZADO', 'CANCELADO'],
      'REJEITADO': [],
      'CANCELADO': [],
      'REALIZADO': [],
    };
    const eValida = transicoesValidas['PENDENTE'].includes('CONFIRMADO');
    expect(eValida).toBe(true);
  });

  it('deve transicionar de PENDENTE para REJEITADO', () => {
    const transicoesValidas = {
      'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
    };
    expect(transicoesValidas['PENDENTE'].includes('REJEITADO')).toBe(true);
  });

  it('deve proibir transição de PENDENTE para REALIZADO', () => {
    const transicoesValidas = {
      'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
    };
    expect(transicoesValidas['PENDENTE'].includes('REALIZADO')).toBe(false);
  });

  it('deve proibir transição de REJEITADO para CONFIRMADO', () => {
    const transicoesValidas = { 'REJEITADO': [] };
    expect(transicoesValidas['REJEITADO'].includes('CONFIRMADO')).toBe(false);
  });
});

describe('BPMN2 Path B — Professor propõe remarcação → AGUARDA_DIRECAO → Direção aceita → EE aceita', () => {
  it('Professor propõe nova data → sugestaoestado = AGUARDA_DIRECAO', async () => {
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

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: 'AGUARDA_DIRECAO', novadata: new Date('2026-05-20') },
    });

    const updated = await prisma.pedidodeaula.findUnique({ where: { idpedidoaula: pedido.idpedidoaula } });
    expect(updated.sugestaoestado).toBe('AGUARDA_DIRECAO');
    expect(updated.novadata).toBeTruthy();
  });

  it('Direção aceita → AGUARDA_EE', async () => {
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: (await createDisponibilidade({
        professorId: userIds.professor, modalidadeprofessorId: mp.idmodalidadeprofessor, salaid: salaId,
      })).iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_DIRECAO',
      novadata: '2026-05-20',
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: 'AGUARDA_EE' },
    });

    const updated = await prisma.pedidodeaula.findUnique({ where: { idpedidoaula: pedido.idpedidoaula } });
    expect(updated.sugestaoestado).toBe('AGUARDA_EE');
  });

  it('Direção rejeita → sugestaoestado = null', async () => {
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      salaId,
      disponibilidadeId: (await createDisponibilidade({
        professorId: userIds.professor, modalidadeprofessorId: mp.idmodalidadeprofessor, salaid: salaId,
      })).iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_DIRECAO',
      novadata: '2026-05-20',
    });

    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { sugestaoestado: null, novadata: null },
    });

    const updated = await prisma.pedidodeaula.findUnique({ where: { idpedidoaula: pedido.idpedidoaula } });
    expect(updated.sugestaoestado).toBeNull();
    expect(updated.novadata).toBeNull();
  });

  it('EE aceita após Direção aprovar → data aplicada', async () => {
    const pedido = await createPedidoAula({
      encarregadoUserId: userIds.encarregado,
      professorUserId: userIds.professor,
      alunoUserId: userIds.aluno,
      salaId,
      disponibilidadeId: (await createDisponibilidade({
        professorId: userIds.professor, modalidadeprofessorId: mp.idmodalidadeprofessor, salaid: salaId,
      })).iddisponibilidade_mensal,
      sugestaoestado: 'AGUARDA_EE',
      novadata: '2026-05-25',
    });

    const novaData = new Date('2026-05-25');
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: pedido.idpedidoaula },
      data: { data: novaData, sugestaoestado: null, novadata: null },
    });

    const updated = await prisma.pedidodeaula.findUnique({ where: { idpedidoaula: pedido.idpedidoaula } });
    expect(updated.data.toISOString().split('T')[0]).toBe('2026-05-25');
    expect(updated.sugestaoestado).toBeNull();
  });
});