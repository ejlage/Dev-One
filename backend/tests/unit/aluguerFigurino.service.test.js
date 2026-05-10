import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  transacaofigurino: {
    findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), aggregate: vi.fn(),
  },
  anuncio: { findUnique: vi.fn(), update: vi.fn() },
  estado: { findMany: vi.fn(), findFirst: vi.fn() },
  notificacao: { create: vi.fn() },
  direcao: { findFirst: vi.fn() },
};

vi.mock('../../src/config/db.js', () => ({ default: mockPrisma }));

const {
  getAllTransacoes, getTransacaoById, getTransacoesByAnuncio,
  registarTransacao, avaliarPedidoReserva, deleteTransacao,
  getDisponibilidadeFigurino, getReservasByUser, getEstados,
} = await import('../../src/services/aluguerFigurino.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registarTransacao', () => {
  it('deve criar transação com dados válidos', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue({ idanuncio: 1, quantidade: 5, figurino: {} });
    mockPrisma.estado.findMany.mockResolvedValue([{ idestado: 21 }]);
    mockPrisma.transacaofigurino.aggregate.mockResolvedValue({ _sum: { quantidade: 0 } });
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 21 });
    mockPrisma.transacaofigurino.create.mockResolvedValue({
      idtransacao: 1, quantidade: 1, encarregadoeducacaoutilizadoriduser: 5,
    });
    mockPrisma.direcao.findFirst.mockResolvedValue({ utilizadoriduser: 2, utilizador: {} });
    mockPrisma.notificacao.create.mockResolvedValue({});

    const result = await registarTransacao({
      quantidade: 1, datatransacao: new Date(), anuncioidanuncio: 1,
      encarregadoeducacaoutilizadoriduser: 5,
    });

    expect(result).toBeDefined();
    expect(result.idtransacao).toBe(1);
  });

  it('deve rejeitar sem requerente', async () => {
    await expect(registarTransacao({
      quantidade: 1, datatransacao: new Date(), anuncioidanuncio: 1,
    })).rejects.toThrow('É necessário identificar o requerente');
  });

  it('deve rejeitar data de início no passado', async () => {
    await expect(registarTransacao({
      quantidade: 1, datatransacao: new Date(), anuncioidanuncio: 1,
      datainicio: '2020-01-01', encarregadoeducacaoutilizadoriduser: 5,
    })).rejects.toThrow('não pode ser no passado');
  });

  it('deve rejeitar anúncio inexistente', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue(null);

    await expect(registarTransacao({
      quantidade: 1, datatransacao: new Date(), anuncioidanuncio: 999,
      encarregadoeducacaoutilizadoriduser: 5,
    })).rejects.toThrow('Anúncio não encontrado');
  });

  it('deve rejeitar quantidade acima do disponível', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue({ idanuncio: 1, quantidade: 3, figurino: {} });
    mockPrisma.estado.findMany.mockResolvedValue([{ idestado: 21 }]);
    mockPrisma.transacaofigurino.aggregate.mockResolvedValue({ _sum: { quantidade: 3 } });

    await expect(registarTransacao({
      quantidade: 1, datatransacao: new Date(), anuncioidanuncio: 1,
      encarregadoeducacaoutilizadoriduser: 5,
    })).rejects.toThrow('não tem unidades disponíveis');
  });
});

describe('avaliarPedidoReserva', () => {
  it('deve aprovar reserva e decrementar stock', async () => {
    const transacaoAprovada = {
      idtransacao: 1, quantidade: 2, anuncioidanuncio: 1,
      encarregadoeducacaoutilizadoriduser: 5,
      estado: { tipoestado: 'Aprovado' },
    };
    mockPrisma.transacaofigurino.update.mockResolvedValue(transacaoAprovada);
    mockPrisma.anuncio.update.mockResolvedValue({});
    mockPrisma.notificacao.create.mockResolvedValue({});

    const result = await avaliarPedidoReserva(1, 22, 2, null);

    expect(result.estado.tipoestado).toBe('Aprovado');
    expect(mockPrisma.anuncio.update).toHaveBeenCalled();
  });
});

describe('getDisponibilidadeFigurino', () => {
  it('deve calcular disponibilidade corretamente', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue({ idanuncio: 1, quantidade: 10 });
    mockPrisma.estado.findMany.mockResolvedValue([{ idestado: 21 }]);
    mockPrisma.transacaofigurino.aggregate.mockResolvedValue({ _sum: { quantidade: 4 } });

    const result = await getDisponibilidadeFigurino(1);

    expect(result.total).toBe(10);
    expect(result.reservado).toBe(4);
    expect(result.disponivel).toBe(6);
  });

  it('deve rejeitar anúncio inexistente', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue(null);

    await expect(getDisponibilidadeFigurino(999)).rejects.toThrow('Anúncio não encontrado');
  });
});

describe('getReservasByUser', () => {
  it('deve filtrar por PROFESSOR', async () => {
    mockPrisma.transacaofigurino.findMany.mockResolvedValue([]);

    await getReservasByUser(10, 'PROFESSOR');

    expect(mockPrisma.transacaofigurino.findMany).toHaveBeenCalledWith({
      where: { professorutilizadoriduser: 10 },
      include: expect.any(Object),
    });
  });

  it('deve filtrar por ENCARREGADO', async () => {
    mockPrisma.transacaofigurino.findMany.mockResolvedValue([]);

    await getReservasByUser(5, 'ENCARREGADO');

    expect(mockPrisma.transacaofigurino.findMany).toHaveBeenCalledWith({
      where: { encarregadoeducacaoutilizadoriduser: 5 },
      include: expect.any(Object),
    });
  });
});

describe('getEstados', () => {
  it('deve retornar estados filtrados', async () => {
    mockPrisma.estado.findMany.mockResolvedValue([{ idestado: 21 }]);

    const result = await getEstados();

    expect(result).toHaveLength(1);
  });
});
