import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockService = {
  getAllPedidosAula: vi.fn(),
  obterPedido: vi.fn(),
  getPedidosByEncarregado: vi.fn(),
  getPedidosPendentes: vi.fn(),
  submeterPedidoAula: vi.fn(),
  updatePedidoAulaStatus: vi.fn(),
  deletePedidoAula: vi.fn(),
};

const mockNotificacoes = {
  createNotificacao: vi.fn(),
};

vi.mock('../../src/services/pedidosaula.service.js', () => mockService);
vi.mock('../../src/services/notificacoes.service.js', () => mockNotificacoes);

const {
  getAllPedidosAula,
  obterPedido,
  getMyPedidos,
  getPedidosPendentes,
  submeterPedidoAula: submeterController,
  approvePedidoAula,
  rejectPedidoAula,
  deletePedidoAula,
} = await import('../../src/controllers/pedidosaula.controller.js');

beforeEach(() => {
  vi.clearAllMocks();
});

function mockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnValue({}),
  };
}

// ---------------------------------------------------------------------------
// getAllPedidosAula
// ---------------------------------------------------------------------------
describe('getAllPedidosAula (controller)', () => {
  it('deve retornar lista de pedidos com success=true', async () => {
    const pedidos = [{ idpedidoaula: 1, data: new Date('2026-04-15') }];
    mockService.getAllPedidosAula.mockResolvedValue(pedidos);

    const reply = mockReply();
    const result = await getAllPedidosAula({}, reply);

    expect(result).toEqual({ success: true, data: pedidos });
    expect(mockService.getAllPedidosAula).toHaveBeenCalledOnce();
  });

  it('deve retornar 500 quando serviço lança erro', async () => {
    mockService.getAllPedidosAula.mockRejectedValue(new Error('DB Error'));

    const reply = mockReply();
    await getAllPedidosAula({}, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'DB Error',
    });
  });
});

// ---------------------------------------------------------------------------
// obterPedido
// ---------------------------------------------------------------------------
describe('obterPedido (controller)', () => {
  it('deve retornar pedido quando existe', async () => {
    const pedido = { idpedidoaula: 5 };
    mockService.obterPedido.mockResolvedValue(pedido);

    const req = { params: { id: '5' } };
    const reply = mockReply();
    const result = await obterPedido(req, reply);

    expect(result).toEqual({ success: true, data: pedido });
  });

  it('deve retornar 404 quando pedido não existe', async () => {
    mockService.obterPedido.mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const reply = mockReply();
    await obterPedido(req, reply);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Pedido não encontrado',
    });
  });

  it('deve retornar 500 quando serviço falha', async () => {
    mockService.obterPedido.mockRejectedValue(new Error('Erro BD'));

    const req = { params: { id: '1' } };
    const reply = mockReply();
    await obterPedido(req, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getMyPedidos
// ---------------------------------------------------------------------------
describe('getMyPedidos (controller)', () => {
  it('deve retornar pedidos do encarregado autenticado', async () => {
    const pedidos = [{ idpedidoaula: 1, encarregadoeducacaoutilizadoriduser: 7 }];
    mockService.getPedidosByEncarregado.mockResolvedValue(pedidos);

    const req = { user: { id: 7 } };
    const reply = mockReply();
    const result = await getMyPedidos(req, reply);

    expect(result).toEqual({ success: true, data: pedidos });
    expect(mockService.getPedidosByEncarregado).toHaveBeenCalledWith(7);
  });

  it('deve retornar 500 quando serviço falha', async () => {
    mockService.getPedidosByEncarregado.mockRejectedValue(new Error('Erro'));

    const req = { user: { id: 7 } };
    const reply = mockReply();
    await getMyPedidos(req, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getPedidosPendentes
// ---------------------------------------------------------------------------
describe('getPedidosPendentes (controller)', () => {
  it('deve retornar pedidos pendentes', async () => {
    const pendentes = [{ idpedidoaula: 1, estadoidestado: 1 }];
    mockService.getPedidosPendentes.mockResolvedValue(pendentes);

    const reply = mockReply();
    const result = await getPedidosPendentes({}, reply);

    expect(result).toEqual({ success: true, data: pendentes });
  });

  it('deve retornar 500 quando serviço falha', async () => {
    mockService.getPedidosPendentes.mockRejectedValue(new Error('Erro'));

    const reply = mockReply();
    await getPedidosPendentes({}, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// submeterPedidoAula (controller)
// ---------------------------------------------------------------------------
describe('submeterPedidoAula (controller)', () => {
  const reqBase = {
    user: { id: 7 },
    body: {
      data: '2026-05-10',
      horainicio: '10:00',
      salaidsala: '1',
    },
  };

  it('deve criar pedido com dados válidos', async () => {
    const pedidoCriado = { idpedidoaula: 1, data: new Date('2026-05-10') };
    mockService.submeterPedidoAula.mockResolvedValue(pedidoCriado);

    const reply = mockReply();
    const result = await submeterController(reqBase, reply);

    expect(result).toEqual({
      success: true,
      data: pedidoCriado,
      message: 'Pedido submetido com sucesso!',
    });
    expect(mockService.submeterPedidoAula).toHaveBeenCalledWith({
      data: reqBase.body.data,
      horainicio: reqBase.body.horainicio,
      duracaoaula: '01:00',
      maxparticipantes: 10,
      privacidade: false,
      salaidsala: reqBase.body.salaidsala,
      encarregadoeducacaoutilizadoriduser: 7,
    });
  });

  it('deve rejeitar quando data não é fornecida', async () => {
    const req = { user: { id: 7 }, body: { horainicio: '10:00', salaidsala: '1' } };
    const reply = mockReply();

    await submeterController(req, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Campos obrigatórios: data, horainicio, salaidsala',
    });
    expect(mockService.submeterPedidoAula).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando horainicio não é fornecido', async () => {
    const req = { user: { id: 7 }, body: { data: '2026-05-10', salaidsala: '1' } };
    const reply = mockReply();

    await submeterController(req, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('deve rejeitar quando salaidsala não é fornecido', async () => {
    const req = { user: { id: 7 }, body: { data: '2026-05-10', horainicio: '10:00' } };
    const reply = mockReply();

    await submeterController(req, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('deve retornar 500 quando serviço lança erro', async () => {
    mockService.submeterPedidoAula.mockRejectedValue(new Error('Erro ao criar'));

    const reply = mockReply();
    await submeterController(reqBase, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Erro ao criar',
    });
  });
});

// ---------------------------------------------------------------------------
// approvePedidoAula
// ---------------------------------------------------------------------------
describe('approvePedidoAula (controller)', () => {
  const pedidoCompleto = {
    idpedidoaula: 1,
    data: new Date('2026-05-10'),
    estadoidestado: 2,
    encarregadoeducacao: { utilizadoriduser: 7 },
    disponibilidade_mensal: {
      professor: { utilizadoriduser: 5 },
    },
  };

  it('deve aprovar pedido e notificar encarregado e professor', async () => {
    mockService.updatePedidoAulaStatus.mockResolvedValue(pedidoCompleto);

    const req = { params: { id: '1' } };
    const reply = mockReply();
    const result = await approvePedidoAula(req, reply);

    expect(result.success).toBe(true);
    expect(result.message).toContain('aprovado');
    expect(mockService.updatePedidoAulaStatus).toHaveBeenCalledWith('1', 'CONFIRMADO');
    // Deve notificar ambos
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledTimes(2);
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledWith(
      7,
      expect.stringContaining('aprovado'),
      'PEDIDO_APROVADO'
    );
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledWith(
      5,
      expect.stringContaining('confirmada'),
      'PEDIDO_APROVADO'
    );
  });

  it('deve aprovar pedido mesmo sem encarregadoeducacao (fallback)', async () => {
    const pedidoSemEE = {
      ...pedidoCompleto,
      encarregadoeducacao: null,
    };
    mockService.updatePedidoAulaStatus.mockResolvedValue(pedidoSemEE);

    const req = { params: { id: '1' } };
    const reply = mockReply();
    const result = await approvePedidoAula(req, reply);

    expect(result.success).toBe(true);
    // Apenas notifica professor (encarregado é null)
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledTimes(1);
  });

  it('deve retornar 500 quando serviço falha', async () => {
    mockService.updatePedidoAulaStatus.mockRejectedValue(new Error('Erro ao aprovar'));

    const req = { params: { id: '1' } };
    const reply = mockReply();
    await approvePedidoAula(req, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Erro ao aprovar',
    });
  });
});

// ---------------------------------------------------------------------------
// rejectPedidoAula
// ---------------------------------------------------------------------------
describe('rejectPedidoAula (controller)', () => {
  const pedidoComRejeicao = {
    idpedidoaula: 1,
    data: new Date('2026-05-10'),
    estadoidestado: 3,
    encarregadoeducacao: { utilizadoriduser: 7 },
  };

  it('deve rejeitar pedido com motivo e notificar encarregado', async () => {
    mockService.updatePedidoAulaStatus.mockResolvedValue(pedidoComRejeicao);

    const req = { params: { id: '1' }, body: { motivo: 'Sala ocupada' } };
    const reply = mockReply();
    const result = await rejectPedidoAula(req, reply);

    expect(result.success).toBe(true);
    expect(mockService.updatePedidoAulaStatus).toHaveBeenCalledWith('1', 'REJEITADO');
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledWith(
      7,
      expect.stringContaining('rejeitado'),
      'PEDIDO_REJEITADO'
    );
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledWith(
      7,
      expect.stringContaining('Sala ocupada'),
      expect.any(String)
    );
  });

  it('deve rejeitar pedido sem motivo (motivo opcional)', async () => {
    mockService.updatePedidoAulaStatus.mockResolvedValue(pedidoComRejeicao);

    const req = { params: { id: '1' }, body: {} };
    const reply = mockReply();
    const result = await rejectPedidoAula(req, reply);

    expect(result.success).toBe(true);
    expect(mockNotificacoes.createNotificacao).toHaveBeenCalledOnce();
  });

  it('deve retornar 500 quando serviço falha', async () => {
    mockService.updatePedidoAulaStatus.mockRejectedValue(new Error('Erro'));

    const req = { params: { id: '1' }, body: {} };
    const reply = mockReply();
    await rejectPedidoAula(req, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// deletePedidoAula (controller)
// ---------------------------------------------------------------------------
describe('deletePedidoAula (controller)', () => {
  it('deve eliminar pedido com sucesso', async () => {
    mockService.deletePedidoAula.mockResolvedValue(undefined);

    const req = { params: { id: '1' } };
    const reply = mockReply();
    const result = await deletePedidoAula(req, reply);

    expect(result).toEqual({
      success: true,
      message: 'Pedido eliminado com sucesso!',
    });
    expect(mockService.deletePedidoAula).toHaveBeenCalledWith('1');
  });

  it('deve retornar 500 quando serviço falha', async () => {
    mockService.deletePedidoAula.mockRejectedValue(new Error('Not Found'));

    const req = { params: { id: '999' } };
    const reply = mockReply();
    await deletePedidoAula(req, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Not Found',
    });
  });
});
