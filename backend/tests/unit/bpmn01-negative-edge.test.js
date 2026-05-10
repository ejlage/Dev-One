import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  pedidodeaula: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  estado: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

const {
  getAllPedidosAula,
  obterPedido,
  getPedidosPendentes,
  submeterPedidoAula,
  updatePedidoAulaStatus,
  deletePedidoAula,
} = await import('../../src/services/pedidosaula.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Campos obrigatórios — validados ao nível do serviço
// ---------------------------------------------------------------------------
describe('Campos obrigatórios (submeterPedidoAula)', () => {
  it('deve rejeitar quando estado PENDENTE não existe na BD', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    await expect(
      submeterPedidoAula({
        data: '2026-06-15',
        horainicio: '10:00',
        salaidsala: '1',
        encarregadoeducacaoutilizadoriduser: '7',
      })
    ).rejects.toThrow('Estado PENDENTE não encontrado');
    expect(mockPrisma.pedidodeaula.create).not.toHaveBeenCalled();
  });

  it('deve usar privacidade false por omissão', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 1, tipoestado: 'PENDENTE' });
    mockPrisma.pedidodeaula.create.mockResolvedValue({ idpedidoaula: 1 });

    await submeterPedidoAula({
      data: '2026-06-15',
      horainicio: '10:00',
      salaidsala: '1',
      encarregadoeducacaoutilizadoriduser: '7',
    });

    const createData = mockPrisma.pedidodeaula.create.mock.calls[0][0].data;
    expect(createData.privacidade).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Transições de estado inválidas
// ---------------------------------------------------------------------------
describe('Transições de estado inválidas (updatePedidoAulaStatus)', () => {
  it('deve rejeitar quando o estado alvo não existe', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    await expect(
      updatePedidoAulaStatus('1', 'ESTADO_INEXISTENTE')
    ).rejects.toThrow('Estado ESTADO_INEXISTENTE não encontrado');
    expect(mockPrisma.pedidodeaula.update).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando ID do pedido é inválido (não existe)', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 2, tipoestado: 'CONFIRMADO' });
    mockPrisma.pedidodeaula.update.mockRejectedValue(
      new Error('Record to update not found')
    );

    await expect(
      updatePedidoAulaStatus('99999', 'CONFIRMADO')
    ).rejects.toThrow('Record to update not found');
  });
});

// ---------------------------------------------------------------------------
// Operações em dados inexistentes
// ---------------------------------------------------------------------------
describe('Operações em pedidos inexistentes', () => {
  it('obterPedido — deve retornar null para ID inexistente', async () => {
    mockPrisma.pedidodeaula.findUnique.mockResolvedValue(null);

    const result = await obterPedido('99999');

    expect(result).toBeNull();
  });

  it('deletePedidoAula — deve propagar erro ao eliminar ID inexistente', async () => {
    mockPrisma.pedidodeaula.delete.mockRejectedValue(
      new Error('Record to delete does not exist')
    );

    await expect(deletePedidoAula('99999')).rejects.toThrow(
      'Record to delete does not exist'
    );
  });
});

// ---------------------------------------------------------------------------
// Erros de base de dados
// ---------------------------------------------------------------------------
describe('Erros de base de dados', () => {
  it('getAllPedidosAula — deve propagar erro do Prisma', async () => {
    mockPrisma.pedidodeaula.findMany.mockRejectedValue(
      new Error('Connection refused')
    );

    await expect(getAllPedidosAula()).rejects.toThrow('Connection refused');
  });

  it('getPedidosPendentes — deve propagar erro na lookup de estado', async () => {
    mockPrisma.estado.findFirst.mockRejectedValue(
      new Error('DB connection lost')
    );

    await expect(getPedidosPendentes()).rejects.toThrow('DB connection lost');
  });

  it('getPedidosPendentes — não deve chamar findMany se estado não existe', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    const result = await getPedidosPendentes();

    expect(result).toEqual([]);
    expect(mockPrisma.pedidodeaula.findMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Boundary: conversão de tipos
// ---------------------------------------------------------------------------
describe('Conversão de tipos e parsing de IDs', () => {
  it('submeterPedidoAula — deve converter string IDs para números', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 1, tipoestado: 'PENDENTE' });
    mockPrisma.pedidodeaula.create.mockResolvedValue({ idpedidoaula: 1 });

    await submeterPedidoAula({
      data: '2026-06-15',
      horainicio: '10:00',
      duracaoaula: '00:30',
      maxparticipantes: '8',
      salaidsala: '3',
      privacidade: false,
      encarregadoeducacaoutilizadoriduser: '7',
    });

    const createData = mockPrisma.pedidodeaula.create.mock.calls[0][0].data;
    expect(createData.salaidsala).toBe(3);
    expect(createData.maxparticipantes).toBe(8);
    expect(createData.encarregadoeducacaoutilizadoriduser).toBe(7);
  });

  it('updatePedidoAulaStatus — deve converter string ID para número', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 2, tipoestado: 'CONFIRMADO' });
    mockPrisma.pedidodeaula.update.mockResolvedValue({ idpedidoaula: 1 });

    await updatePedidoAulaStatus('42', 'CONFIRMADO');

    expect(mockPrisma.pedidodeaula.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idpedidoaula: 42 },
      })
    );
  });

  it('obterPedido — deve converter string ID para número', async () => {
    mockPrisma.pedidodeaula.findUnique.mockResolvedValue({ idpedidoaula: 77 });

    await obterPedido('77');

    expect(mockPrisma.pedidodeaula.findUnique).toHaveBeenCalledWith({
      where: { idpedidoaula: 77 },
      include: expect.any(Object),
    });
  });
});
