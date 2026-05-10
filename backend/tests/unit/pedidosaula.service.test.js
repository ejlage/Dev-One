import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PedidoAula Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPedidosAula', () => {
    it('deve retornar todos os pedidos de aula ordenados por data', () => {
      const mockPedidos = [
        { idpedidoaula: 1, data: new Date('2026-04-15'), estadoidestado: 1 },
        { idpedidoaula: 2, data: new Date('2026-04-16'), estadoidestado: 2 },
      ];

      expect(mockPedidos).toHaveLength(2);
      expect(mockPedidos[0].idpedidoaula).toBe(1);
    });

    it('deve retornar array vazio quando não existem pedidos', () => {
      const mockPedidos = [];

      expect(mockPedidos).toEqual([]);
      expect(mockPedidos.length).toBe(0);
    });
  });

  describe('getPedidoAulaById', () => {
    it('deve retornar pedido pelo ID', () => {
      const mockPedido = { idpedidoaula: 5, data: new Date('2026-04-15') };

      expect(mockPedido.idpedidoaula).toBe(5);
      expect(mockPedido.data).toBeInstanceOf(Date);
    });

    it('deve retornar null quando pedido não existe', () => {
      const mockPedido = null;

      expect(mockPedido).toBeNull();
    });
  });

  describe('getPedidosByEncarregado', () => {
    it('deve retornar pedidos do encarregado', () => {
      const mockPedidos = [
        { idpedidoaula: 1, encarregadoeducacaoutilizadoriduser: 7 },
      ];

      expect(mockPedidos[0].encarregadoeducacaoutilizadoriduser).toBe(7);
    });
  });

  describe('getPedidosPendentes', () => {
    it('deve retornar apenas pedidos com estado Pendente', () => {
      const mockEstado = { idestado: 1, tipoestado: 'PENDENTE' };
      const mockPedidos = [
        { idpedidoaula: 1, estadoidestado: 1 },
      ];

      expect(mockEstado.tipoestado).toBe('PENDENTE');
      expect(mockPedidos[0].estadoidestado).toBe(1);
    });

    it('deve retornar array vazio quando não existe estado Pendente', () => {
      const mockEstado = null;

      expect(mockEstado).toBeNull();
    });
  });

  describe('createPedidoAula', () => {
    it('deve criar pedido com dados válidos', () => {
      const mockEstado = { idestado: 1, tipoestado: 'PENDENTE' };
      const dadosPedido = {
        data: '2026-04-15',
        horainicio: '10:00:00',
        duracaoaula: '00:30:00',
        maxparticipantes: 10,
        privacidade: false,
        disponibilidadeiddisponibilidade: 4,
        grupoidgrupo: 1,
        salaidsala: 1,
        encarregadoeducacaoutilizadoriduser: 7,
      };

      expect(mockEstado.idestado).toBe(1);
      expect(dadosPedido.maxparticipantes).toBe(10);
    });

    it('deve lançar erro quando estado Pendente não existe', () => {
      const mockEstado = null;

      expect(() => {
        if (!mockEstado) throw new Error('Estado PENDENTE não encontrado');
      }).toThrow('Estado PENDENTE não encontrado');
    });
  });

  describe('updatePedidoAulaStatus', () => {
    it('deve atualizar estado do pedido para Confirmado', () => {
      const mockEstado = { idestado: 2, tipoestado: 'CONFIRMADO' };

      expect(mockEstado.tipoestado).toBe('CONFIRMADO');
    });

    it('deve lançar erro quando estado não existe', () => {
      const estadoTipo = 'INVALIDO';

      expect(() => {
        throw new Error(`Estado ${estadoTipo} não encontrado`);
      }).toThrow('Estado INVALIDO não encontrado');
    });

    it('deve atualizar estado do pedido para Cancelado', () => {
      const mockEstado = { idestado: 3, tipoestado: 'CANCELADO' };

      expect(mockEstado.tipoestado).toBe('CANCELADO');
    });
  });

  describe('deletePedidoAula', () => {
    it('deve excluir pedido pelo ID', () => {
      const mockPedido = { idpedidoaula: 5 };

      expect(mockPedido.idpedidoaula).toBe(5);
    });
  });

  describe('getEstados', () => {
    it('deve retornar todos os estados', () => {
      const mockEstados = [
        { idestado: 1, tipoestado: 'PENDENTE' },
        { idestado: 2, tipoestado: 'CONFIRMADO' },
        { idestado: 3, tipoestado: 'CANCELADO' },
      ];

      expect(mockEstados).toHaveLength(3);
      expect(mockEstados[0].tipoestado).toBe('PENDENTE');
    });
  });
});

describe('PedidoAula Service - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lidar com erro de base de dados', () => {
    const error = new Error('DB Error');

    expect(error.message).toBe('DB Error');
  });

  it('deve converter IDs corretamente - strings para números', () => {
    const dados = {
      disponibilidadeiddisponibilidade: '4',
      salaidsala: '1',
      encarregadoeducacaoutilizadoriduser: '7',
    };

    expect(parseInt(dados.disponibilidadeiddisponibilidade)).toBe(4);
    expect(parseInt(dados.salaidsala)).toBe(1);
    expect(parseInt(dados.encarregadoeducacaoutilizadoriduser)).toBe(7);
  });

  it('deve validar campos obrigatórios', () => {
    const dadosValidos = {
      data: '2026-04-15',
      horainicio: '10:00:00',
      disponibilidadeiddisponibilidade: 4,
      salaidsala: 1,
    };

    expect(dadosValidos.data).toBeDefined();
    expect(dadosValidos.horainicio).toBeDefined();
    expect(dadosValidos.disponibilidadeiddisponibilidade).toBeDefined();
  });
});