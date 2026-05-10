import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  audit_log: {
    create: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

const {
  createAuditLog,
  getAuditLogs,
} = await import('../../src/services/audit.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAuditLog', () => {
  it('deve registar log de auditoria com todos os campos', async () => {
    mockPrisma.audit_log.create.mockResolvedValue({ idaudit: 1 });

    await createAuditLog(5, 'João Silva', 'CREATE', 'PedidoAula', 42, 'Pedido criado com sucesso');

    expect(mockPrisma.audit_log.create).toHaveBeenCalledWith({
      data: {
        utilizadorid: 5,
        utilizadornome: 'João Silva',
        acao: 'CREATE',
        entidade: 'PedidoAula',
        entidadeid: 42,
        detalhes: 'Pedido criado com sucesso',
      },
    });
  });

  it('deve registar log sem entidadeId e detalhes (null defaults)', async () => {
    mockPrisma.audit_log.create.mockResolvedValue({ idaudit: 2 });

    await createAuditLog(1, 'Admin', 'LOGIN', 'Utilizador');

    expect(mockPrisma.audit_log.create).toHaveBeenCalledWith({
      data: {
        utilizadorid: 1,
        utilizadornome: 'Admin',
        acao: 'LOGIN',
        entidade: 'Utilizador',
        entidadeid: null,
        detalhes: null,
      },
    });
  });

  it('deve truncar detalhes com mais de 1000 caracteres', async () => {
    mockPrisma.audit_log.create.mockResolvedValue({ idaudit: 3 });
    const textoLongo = 'a'.repeat(1500);

    await createAuditLog(1, 'Admin', 'UPDATE', 'Figurino', 10, textoLongo);

    const callArgs = mockPrisma.audit_log.create.mock.calls[0][0];
    expect(callArgs.data.detalhes.length).toBe(1000);
    expect(callArgs.data.detalhes).toBe('a'.repeat(1000));
  });

  it('não deve lançar erro quando Prisma falha (catch silencioso)', async () => {
    mockPrisma.audit_log.create.mockRejectedValue(new Error('DB error'));

    await expect(
      createAuditLog(1, 'Admin', 'DELETE', 'Evento', 5, 'Falha')
    ).resolves.toBeUndefined();
  });

  it('deve registar erro no console quando Prisma falha', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockPrisma.audit_log.create.mockRejectedValue(new Error('DB error'));

    await createAuditLog(1, 'Admin', 'DELETE', 'Evento', 5, 'Falha');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Audit] Erro ao registar log:',
      'DB error'
    );
    consoleSpy.mockRestore();
  });
});

describe('getAuditLogs', () => {
  const mockLogs = [
    {
      idaudit: 1,
      utilizadorid: 5,
      utilizadornome: 'João Silva',
      acao: 'CREATE',
      entidade: 'PedidoAula',
      entidadeid: 42,
      detalhes: 'Pedido criado',
      data: new Date('2026-05-01T10:00:00Z'),
    },
    {
      idaudit: 2,
      utilizadorid: 5,
      utilizadornome: 'João Silva',
      acao: 'UPDATE',
      entidade: 'PedidoAula',
      entidadeid: 42,
      detalhes: 'Data alterada',
      data: new Date('2026-05-02T10:00:00Z'),
    },
  ];

  it('deve retornar logs com paginação default', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(2);
    mockPrisma.audit_log.findMany.mockResolvedValue(mockLogs);

    const result = await getAuditLogs();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(0);
  });

  it('deve mapear campos snake_case para camelCase', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(1);
    mockPrisma.audit_log.findMany.mockResolvedValue([mockLogs[0]]);

    const result = await getAuditLogs();

    expect(result.data[0]).toMatchObject({
      id: 1,
      utilizadorId: 5,
      utilizadorNome: 'João Silva',
      acao: 'CREATE',
      entidade: 'PedidoAula',
      entidadeId: 42,
      detalhes: 'Pedido criado',
    });
    expect(result.data[0].data).toBe('2026-05-01T10:00:00.000Z');
  });

  it('deve aplicar filtro de utilizadorId', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(1);
    mockPrisma.audit_log.findMany.mockResolvedValue([mockLogs[0]]);

    await getAuditLogs({ utilizadorId: 5 });

    expect(mockPrisma.audit_log.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ utilizadorid: 5 }),
      })
    );
  });

  it('deve aplicar filtro de acao (case insensitive)', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(1);
    mockPrisma.audit_log.findMany.mockResolvedValue([mockLogs[0]]);

    await getAuditLogs({ acao: 'create' });

    expect(mockPrisma.audit_log.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          acao: { equals: 'create', mode: 'insensitive' },
        }),
      })
    );
  });

  it('deve aplicar filtro de entidade (case insensitive)', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(1);
    mockPrisma.audit_log.findMany.mockResolvedValue([mockLogs[0]]);

    await getAuditLogs({ entidade: 'pedidoaula' });

    expect(mockPrisma.audit_log.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entidade: { equals: 'pedidoaula', mode: 'insensitive' },
        }),
      })
    );
  });

  it('deve aplicar filtro de data (dataInicio/dataFim)', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(1);
    mockPrisma.audit_log.findMany.mockResolvedValue([mockLogs[0]]);

    await getAuditLogs({
      dataInicio: '2026-05-01',
      dataFim: '2026-05-31',
    });

    const where = mockPrisma.audit_log.findMany.mock.calls[0][0].where;
    expect(where.data).toBeDefined();
    expect(where.data.gte).toBeInstanceOf(Date);
    expect(where.data.lte).toBeInstanceOf(Date);
  });

  it('deve retornar lista vazia quando não há logs', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(0);
    mockPrisma.audit_log.findMany.mockResolvedValue([]);

    const result = await getAuditLogs({ utilizadorId: 999 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('deve respeitar limit e offset fornecidos', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(50);
    mockPrisma.audit_log.findMany.mockResolvedValue(mockLogs);

    const result = await getAuditLogs({ limit: 10, offset: 20 });

    expect(mockPrisma.audit_log.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 })
    );
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
  });

  it('deve ordenar logs por data descendente', async () => {
    mockPrisma.audit_log.count.mockResolvedValue(2);
    mockPrisma.audit_log.findMany.mockResolvedValue(mockLogs);

    await getAuditLogs();

    expect(mockPrisma.audit_log.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { data: 'desc' } })
    );
  });
});
