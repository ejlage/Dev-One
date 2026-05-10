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
  getPedidosByEncarregado,
  getAllPedidosEAulas,
  getPedidosPendentes,
  submeterPedidoAula,
  updatePedidoAulaStatus,
  deletePedidoAula,
  getEstados,
} = await import('../../src/services/pedidosaula.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getAllPedidosAula
// ---------------------------------------------------------------------------
describe('getAllPedidosAula', () => {
  it('deve retornar todos os pedidos ordenados por data descendente', async () => {
    const mockPedidos = [
      { idpedidoaula: 1, data: new Date('2026-04-16'), estadoidestado: 2 },
      { idpedidoaula: 2, data: new Date('2026-04-15'), estadoidestado: 1 },
    ];
    mockPrisma.pedidodeaula.findMany.mockResolvedValue(mockPedidos);

    const result = await getAllPedidosAula();

    expect(result).toHaveLength(2);
    expect(mockPrisma.pedidodeaula.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: { datapedido: 'desc' },
    });
  });

  it('deve retornar array vazio quando não existem pedidos', async () => {
    mockPrisma.pedidodeaula.findMany.mockResolvedValue([]);

    const result = await getAllPedidosAula();

    expect(result).toEqual([]);
  });

  it('deve propagar erro quando o Prisma falha', async () => {
    mockPrisma.pedidodeaula.findMany.mockRejectedValue(new Error('DB connection lost'));

    await expect(getAllPedidosAula()).rejects.toThrow('DB connection lost');
  });
});

// ---------------------------------------------------------------------------
// obterPedido
// ---------------------------------------------------------------------------
describe('obterPedido', () => {
  it('deve retornar pedido quando ID existe', async () => {
    const mockPedido = { idpedidoaula: 5, data: new Date('2026-04-15') };
    mockPrisma.pedidodeaula.findUnique.mockResolvedValue(mockPedido);

    const result = await obterPedido('5');

    expect(result).toEqual(mockPedido);
    expect(mockPrisma.pedidodeaula.findUnique).toHaveBeenCalledWith({
      where: { idpedidoaula: 5 },
      include: expect.any(Object),
    });
  });

  it('deve retornar null quando pedido não existe', async () => {
    mockPrisma.pedidodeaula.findUnique.mockResolvedValue(null);

    const result = await obterPedido('999');

    expect(result).toBeNull();
  });

  it('deve converter string ID para número inteiro', async () => {
    mockPrisma.pedidodeaula.findUnique.mockResolvedValue({ idpedidoaula: 42 });

    await obterPedido('42');

    expect(mockPrisma.pedidodeaula.findUnique).toHaveBeenCalledWith({
      where: { idpedidoaula: 42 },
      include: expect.any(Object),
    });
  });
});

// ---------------------------------------------------------------------------
// getPedidosByEncarregado
// ---------------------------------------------------------------------------
describe('getPedidosByEncarregado', () => {
  it('deve retornar pedidos do encarregado específico', async () => {
    const mockPedidos = [
      { idpedidoaula: 1, encarregadoeducacaoutilizadoriduser: 7 },
    ];
    mockPrisma.pedidodeaula.findMany.mockResolvedValue(mockPedidos);

    const result = await getPedidosByEncarregado(7);

    expect(result).toHaveLength(1);
    expect(mockPrisma.pedidodeaula.findMany).toHaveBeenCalledWith({
      where: { encarregadoeducacaoutilizadoriduser: 7 },
      include: expect.any(Object),
      orderBy: { datapedido: 'desc' },
    });
  });

  it('deve retornar array vazio quando encarregado não tem pedidos', async () => {
    mockPrisma.pedidodeaula.findMany.mockResolvedValue([]);

    const result = await getPedidosByEncarregado(999);

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAllPedidosEAulas
// ---------------------------------------------------------------------------
describe('getAllPedidosEAulas', () => {
  it('deve mapear resultado de $queryRaw para formato padronizado', async () => {
    const rawRows = [
      {
        idpedidoaula: 1,
        data: new Date('2026-05-10'),
        horainicio: new Date('2026-05-10T10:00:00Z'),
        duracaoaula: '01:30:00',
        maxparticipantes: 10,
        estadoidestado: 1,
        estado_nome: 'PENDENTE',
        datapedido: new Date('2026-05-08'),
        privacidade: false,
        sala_nome: 'Estúdio A - Principal',
        sala_id: 1,
        modalidade_nome: 'Ballet Clássico',
        professor_id: 5,
        professor_nome: 'João Santos',
        aluno_nome: 'Miguel Silva',
        aluno_utilizador_id: 10,
        encarregado_id: 7,
      },
    ];
    mockPrisma.$queryRaw.mockResolvedValue(rawRows);

    const result = await getAllPedidosEAulas();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '1',
      modalidade: 'Ballet Clássico',
      professorNome: 'João Santos',
      alunoNome: 'Miguel Silva',
      estudioNome: 'Estúdio A - Principal',
      status: 'PENDENTE',
      duracao: 90,
    });
  });

  it('deve retornar array vazio quando não há dados', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getAllPedidosEAulas();

    expect(result).toEqual([]);
  });

  it('deve normalizar nomes de estado corretamente', async () => {
    const statusTests = [
      { estado_nome: 'CONFIRMADO', expected: 'CONFIRMADA' },
      { estado_nome: 'REJEITADO', expected: 'REJEITADA' },
      { estado_nome: 'REALIZADO', expected: 'REALIZADA' },
      { estado_nome: 'CANCELADO', expected: 'CANCELADA' },
      { estado_nome: 'CONCLUÍDO', expected: 'CONCLUÍDA' },
    ];

    for (const { estado_nome, expected } of statusTests) {
      mockPrisma.$queryRaw.mockResolvedValue([{
        idpedidoaula: 1, data: new Date(), horainicio: new Date(),
        duracaoaula: '01:00', maxparticipantes: 1, estadoidestado: 1,
        estado_nome, datapedido: new Date(), privacidade: false,
        sala_nome: '', sala_id: 1, modalidade_nome: '',
        professor_id: null, professor_nome: null,
        aluno_nome: null, aluno_utilizador_id: null, encarregado_id: null,
      }]);

      const result = await getAllPedidosEAulas();
      expect(result[0].status).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// getPedidosPendentes
// ---------------------------------------------------------------------------
describe('getPedidosPendentes', () => {
  it('deve retornar apenas pedidos com estado Pendente', async () => {
    const mockEstado = { idestado: 1, tipoestado: 'PENDENTE' };
    const mockPedidos = [
      { idpedidoaula: 1, estadoidestado: 1 },
      { idpedidoaula: 2, estadoidestado: 1 },
    ];
    mockPrisma.estado.findFirst.mockResolvedValue(mockEstado);
    mockPrisma.pedidodeaula.findMany.mockResolvedValue(mockPedidos);

    const result = await getPedidosPendentes();

    expect(result).toHaveLength(2);
    expect(mockPrisma.estado.findFirst).toHaveBeenCalledWith({
      where: { tipoestado: 'PENDENTE' },
    });
    expect(mockPrisma.pedidodeaula.findMany).toHaveBeenCalledWith({
      where: { estadoidestado: 1 },
      include: expect.any(Object),
      orderBy: { datapedido: 'asc' },
    });
  });

  it('deve retornar array vazio quando não existe estado Pendente na BD', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    const result = await getPedidosPendentes();

    expect(result).toEqual([]);
    expect(mockPrisma.pedidodeaula.findMany).not.toHaveBeenCalled();
  });

  it('deve retornar array vazio quando não há pedidos pendentes', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 1, tipoestado: 'PENDENTE' });
    mockPrisma.pedidodeaula.findMany.mockResolvedValue([]);

    const result = await getPedidosPendentes();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// submeterPedidoAula
// ---------------------------------------------------------------------------
describe('submeterPedidoAula', () => {
  const dadosValidos = {
    data: '2026-05-10',
    horainicio: '10:00',
    duracaoaula: '00:30',
    maxparticipantes: 10,
    privacidade: false,
    salaidsala: '1',
    encarregadoeducacaoutilizadoriduser: '7',
  };

  it('deve criar pedido com dados válidos', async () => {
    const mockEstado = { idestado: 1, tipoestado: 'PENDENTE' };
    const mockPedidoCriado = {
      idpedidoaula: 1,
      data: new Date('2026-05-10'),
      estado: mockEstado,
    };
    mockPrisma.estado.findFirst.mockResolvedValue(mockEstado);
    mockPrisma.pedidodeaula.create.mockResolvedValue(mockPedidoCriado);

    const result = await submeterPedidoAula(dadosValidos);

    expect(result).toBeDefined();
    expect(result.idpedidoaula).toBe(1);
    expect(mockPrisma.estado.findFirst).toHaveBeenCalledWith({
      where: { tipoestado: 'PENDENTE' },
    });
    expect(mockPrisma.pedidodeaula.create).toHaveBeenCalledOnce();
  });

  it('deve rejeitar quando estado PENDENTE não está configurado na BD', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    await expect(submeterPedidoAula(dadosValidos)).rejects.toThrow(
      'Estado PENDENTE não encontrado'
    );
    expect(mockPrisma.pedidodeaula.create).not.toHaveBeenCalled();
  });

  it('deve usar duração padrão de 01:00 quando não fornecida', async () => {
    const mockEstado = { idestado: 1, tipoestado: 'PENDENTE' };
    mockPrisma.estado.findFirst.mockResolvedValue(mockEstado);
    mockPrisma.pedidodeaula.create.mockResolvedValue({ idpedidoaula: 1 });

    const { duracaoaula: _, ...semDuracao } = dadosValidos;
    await submeterPedidoAula(semDuracao);

    const createData = mockPrisma.pedidodeaula.create.mock.calls[0][0].data;
    expect(createData.duracaoaula).toBeDefined();
  });

  it('deve converter maxparticipantes para inteiro', async () => {
    const mockEstado = { idestado: 1, tipoestado: 'PENDENTE' };
    mockPrisma.estado.findFirst.mockResolvedValue(mockEstado);
    mockPrisma.pedidodeaula.create.mockResolvedValue({ idpedidoaula: 1 });

    await submeterPedidoAula({ ...dadosValidos, maxparticipantes: '5' });

    const createData = mockPrisma.pedidodeaula.create.mock.calls[0][0].data;
    expect(createData.maxparticipantes).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// updatePedidoAulaStatus
// ---------------------------------------------------------------------------
describe('updatePedidoAulaStatus', () => {
  it('deve atualizar estado do pedido para CONFIRMADO', async () => {
    const mockEstado = { idestado: 2, tipoestado: 'CONFIRMADO' };
    const mockUpdated = { idpedidoaula: 1, estadoidestado: 2 };
    mockPrisma.estado.findFirst.mockResolvedValue(mockEstado);
    mockPrisma.pedidodeaula.update.mockResolvedValue(mockUpdated);

    const result = await updatePedidoAulaStatus('1', 'CONFIRMADO');

    expect(result.estadoidestado).toBe(2);
    expect(mockPrisma.pedidodeaula.update).toHaveBeenCalledWith({
      where: { idpedidoaula: 1 },
      data: { estadoidestado: 2 },
      include: expect.any(Object),
    });
  });

  it('deve rejeitar quando o estado alvo não existe na BD', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    await expect(
      updatePedidoAulaStatus('1', 'ESTADO_INEXISTENTE')
    ).rejects.toThrow('Estado ESTADO_INEXISTENTE não encontrado');
    expect(mockPrisma.pedidodeaula.update).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando ID é inválido', async () => {
    const mockEstado = { idestado: 3, tipoestado: 'CANCELADO' };
    mockPrisma.estado.findFirst.mockResolvedValue(mockEstado);
    mockPrisma.pedidodeaula.update.mockRejectedValue(
      new Error('Record to update not found')
    );

    await expect(
      updatePedidoAulaStatus('99999', 'CANCELADO')
    ).rejects.toThrow('Record to update not found');
  });
});

// ---------------------------------------------------------------------------
// deletePedidoAula
// ---------------------------------------------------------------------------
describe('deletePedidoAula', () => {
  it('deve eliminar pedido por ID', async () => {
    mockPrisma.pedidodeaula.delete.mockResolvedValue({ idpedidoaula: 1 });

    await deletePedidoAula('1');

    expect(mockPrisma.pedidodeaula.delete).toHaveBeenCalledWith({
      where: { idpedidoaula: 1 },
    });
  });

  it('deve propagar erro quando pedido não existe', async () => {
    mockPrisma.pedidodeaula.delete.mockRejectedValue(
      new Error('Record to delete does not exist')
    );

    await expect(deletePedidoAula('999')).rejects.toThrow(
      'Record to delete does not exist'
    );
  });
});

// ---------------------------------------------------------------------------
// getEstados
// ---------------------------------------------------------------------------
describe('getEstados', () => {
  it('deve retornar lista de estados', async () => {
    const mockEstados = [
      { idestado: 1, tipoestado: 'PENDENTE' },
      { idestado: 2, tipoestado: 'CONFIRMADO' },
      { idestado: 3, tipoestado: 'CANCELADO' },
    ];
    mockPrisma.estado.findMany.mockResolvedValue(mockEstados);

    const result = await getEstados();

    expect(result).toHaveLength(3);
    expect(mockPrisma.estado.findMany).toHaveBeenCalledOnce();
  });

  it('deve retornar array vazio quando não há estados', async () => {
    mockPrisma.estado.findMany.mockResolvedValue([]);

    const result = await getEstados();

    expect(result).toEqual([]);
  });
});
