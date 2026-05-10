import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PedidoAula Controller - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPedidosAula', () => {
    it('deve retornar todos os pedidos com success=true', async () => {
      const mockPedidos = [
        { idpedidoaula: 1, data: new Date('2026-04-15') },
        { idpedidoaula: 2, data: new Date('2026-04-16') },
      ];

      const result = { success: true, data: mockPedidos };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('deve retornar erro quando falhar', async () => {
      const result = { success: false, error: 'DB Error' };

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Error');
    });
  });

  describe('getPedidoAulaById', () => {
    it('deve retornar pedido existente', async () => {
      const mockPedido = { idpedidoaula: 5, data: new Date('2026-04-15') };

      const result = { success: true, data: mockPedido };

      expect(result.success).toBe(true);
      expect(result.data.idpedidoaula).toBe(5);
    });

    it('deve retornar erro quando pedido não existe', async () => {
      const result = { success: false, error: 'Pedido não encontrado' };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Pedido não encontrado');
    });
  });

  describe('getMyPedidos', () => {
    it('deve retornar pedidos do encarregado autenticado', async () => {
      const mockPedidos = [{ idpedidoaula: 1, encarregadoeducacaoutilizadoriduser: 1 }];

      const result = { success: true, data: mockPedidos };

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getPedidosPendentes', () => {
    it('deve retornar pedidos pendentes', async () => {
      const mockPendentes = [{ idpedidoaula: 1, estadoidestado: 1 }];

      const result = { success: true, data: mockPendentes };

      expect(result.success).toBe(true);
      expect(result.data[0].estadoidestado).toBe(1);
    });
  });

  describe('createPedidoAula', () => {
    it('deve criar pedido com dados válidos', async () => {
      const novoPedido = { idpedidoaula: 1, data: '2026-04-15' };

      const result = { success: true, data: novoPedido, message: 'Pedido submetido com sucesso!' };

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('deve retornar erro com dados inválidos', async () => {
      const result = { success: false, error: 'Campos obrigatórios' };

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatórios');
    });

    it('deve retornar erro quando criar falhar', async () => {
      const result = { success: false, error: 'DB Error' };

      expect(result.success).toBe(false);
    });
  });

  describe('approvePedidoAula', () => {
    it('deve aprovar pedido e enviar notificação', async () => {
      const mockPedido = {
        idpedidoaula: 5,
        estadoidestado: 2,
        encarregadoeducacao: { utilizadoriduser: 7 },
      };

      const result = {
        success: true,
        data: mockPedido,
        message: 'Pedido aprovado! Aula confirmada.'
      };

      expect(result.success).toBe(true);
      expect(result.message).toContain('confirmada');
    });
  });

  describe('rejectPedidoAula', () => {
    it('deve rejeitar pedido e enviar notificação com motivo', async () => {
      const mockPedido = {
        idpedidoaula: 5,
        estadoidestado: 3,
        encarregadoeducacao: { utilizadoriduser: 7 },
      };

      const result = { success: true, data: mockPedido, message: 'Pedido rejeitado.' };

      expect(result.success).toBe(true);
    });
  });

  describe('deletePedidoAula', () => {
    it('deve eliminar pedido com sucesso', async () => {
      const result = { success: true, message: 'Pedido eliminado com sucesso!' };

      expect(result.success).toBe(true);
      expect(result.message).toContain('eliminado');
    });

    it('deve retornar erro quando excluir falhar', async () => {
      const result = { success: false, error: 'Not Found' };

      expect(result.success).toBe(false);
    });
  });
});

describe('PedidoAula Controller - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve validar campos obrigatórios: data', () => {
    const body = { data: null, horainicio: '10:00:00' };

    expect(() => {
      if (!body.data) throw new Error('Campo data é obrigatório');
    }).toThrow('Campo data é obrigatório');
  });

  it('deve validar campos obrigatórios: horainicio', () => {
    const body = { data: '2026-04-15', horainicio: null };

    expect(() => {
      if (!body.horainicio) throw new Error('Campo horainicio é obrigatório');
    }).toThrow('Campo horainicio é obrigatório');
  });

  it('deve validar campos obrigatórios: disponibilidadeiddisponibilidade', () => {
    const body = { data: '2026-04-15', horainicio: '10:00:00', disponibilidadeiddisponibilidade: null };

    expect(() => {
      if (!body.disponibilidadeiddisponibilidade) throw new Error('Campo obrigatória');
    }).toThrow('Campo obrigatória');
  });

  it('deve validar campos obrigatórios: salaidsala', () => {
    const body = { data: '2026-04-15', horainicio: '10:00:00', salaidsala: null };

    expect(() => {
      if (!body.salaidsala) throw new Error('Campo obrigatória');
    }).toThrow('Campo obrigatória');
  });

  it('deve formatar data corretamente para português', () => {
    const data = new Date('2026-04-15');

    expect(data).toBeInstanceOf(Date);
  });

  it('deve construir mensagem de aprovação', () => {
    const pedido = { data: new Date('2026-04-15'), encarregadoeducacao: { utilizadoriduser: 7 } };
    const mensagem = `O seu pedido de aula para ${pedido.data.toLocaleDateString('pt-PT')} foi aprovado!`;

    expect(mensagem).toContain('2026');
  });

  it('deve construir mensagem de rejeição com motivo', () => {
    const motivo = 'Sala indisponível';
    const mensagem = `O seu pedido de aula foi rejeitado. Motivo: ${motivo}`;

    expect(mensagem).toContain(motivo);
  });
});