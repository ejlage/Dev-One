import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  notificacao: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

const {
  getNotificacoesByUser, getNotificacoesNaoLidas,
  createNotificacao, marcarComoLida, marcarTodasComoLidas, deleteNotificacao,
} = await import('../../src/services/notificacoes.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getNotificacoesByUser', () => {
  it('deve retornar notificações do utilizador ordenadas por data desc', async () => {
    mockPrisma.notificacao.findMany.mockResolvedValue([
      { idnotificacao: 2, mensagem: 'Notif 2', datanotificacao: new Date('2026-05-02') },
      { idnotificacao: 1, mensagem: 'Notif 1', datanotificacao: new Date('2026-05-01') },
    ]);

    const result = await getNotificacoesByUser(42);

    expect(result).toHaveLength(2);
    expect(mockPrisma.notificacao.findMany).toHaveBeenCalledWith({
      where: { utilizadoriduser: 42 },
      orderBy: { datanotificacao: 'desc' },
      take: 50,
    });
  });

  it('deve retornar array vazio quando não há notificações', async () => {
    mockPrisma.notificacao.findMany.mockResolvedValue([]);

    const result = await getNotificacoesByUser(999);

    expect(result).toEqual([]);
  });
});

describe('getNotificacoesNaoLidas', () => {
  it('deve filtrar apenas notificações não lidas', async () => {
    mockPrisma.notificacao.findMany.mockResolvedValue([
      { idnotificacao: 1, mensagem: 'Não lida', lida: false },
    ]);

    const result = await getNotificacoesNaoLidas(42);

    expect(result).toHaveLength(1);
    expect(mockPrisma.notificacao.findMany).toHaveBeenCalledWith({
      where: { utilizadoriduser: 42, lida: false },
      orderBy: { datanotificacao: 'desc' },
    });
  });
});

describe('createNotificacao', () => {
  it('deve criar notificação com dados fornecidos', async () => {
    mockPrisma.notificacao.create.mockResolvedValue({
      idnotificacao: 1, mensagem: 'Teste', tipo: 'TESTE', utilizadoriduser: 42,
    });

    const result = await createNotificacao(42, 'Teste', 'TESTE');

    expect(result.mensagem).toBe('Teste');
    expect(mockPrisma.notificacao.create).toHaveBeenCalledWith({
      data: { mensagem: 'Teste', tipo: 'TESTE', utilizadoriduser: 42 },
    });
  });
});

describe('marcarComoLida', () => {
  it('deve marcar notificação como lida com data', async () => {
    mockPrisma.notificacao.updateMany.mockResolvedValue({ count: 1 });

    const result = await marcarComoLida('5', 42);

    expect(result.count).toBe(1);
    const callArgs = mockPrisma.notificacao.updateMany.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({ idnotificacao: 5, utilizadoriduser: 42 });
    expect(callArgs.data.lida).toBe(true);
    expect(callArgs.data.dataleitura).toBeInstanceOf(Date);
  });
});

describe('marcarTodasComoLidas', () => {
  it('deve marcar todas as não lidas como lidas', async () => {
    mockPrisma.notificacao.updateMany.mockResolvedValue({ count: 3 });

    const result = await marcarTodasComoLidas(42);

    expect(result.count).toBe(3);
    const callArgs = mockPrisma.notificacao.updateMany.mock.calls[0][0];
    expect(callArgs.where).toMatchObject({ utilizadoriduser: 42, lida: false });
    expect(callArgs.data.lida).toBe(true);
  });
});

describe('deleteNotificacao', () => {
  it('deve eliminar notificação por ID e userId', async () => {
    mockPrisma.notificacao.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteNotificacao('5', 42);

    expect(mockPrisma.notificacao.deleteMany).toHaveBeenCalledWith({
      where: { idnotificacao: 5, utilizadoriduser: 42 },
    });
    expect(result.count).toBe(1);
  });
});
