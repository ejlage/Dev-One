import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  utilizador: { findMany: vi.fn() },
  evento: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
};

vi.mock('../../src/config/db.js', () => ({ default: mockPrisma }));
vi.mock('../../src/services/notificacoes.service.js', () => ({
  createNotificacao: vi.fn(() => Promise.resolve({ idnotificacao: 1 })),
}));

const {
  getAllEventos, getEventoById, createEvento, updateEvento, deleteEvento, publishEvento,
} = await import('../../src/services/eventos.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

const mockEvento = {
  idevento: 1,
  titulo: 'Show de Final de Ano',
  descricao: 'Evento de encerramento',
  dataevento: new Date('2026-06-15'),
  datafim: null,
  localizacao: 'Auditório Municipal',
  imagem: '',
  linkbilhetes: 'https://bilhetes.pt',
  publicado: false,
  destaque: false,
  datacriacao: new Date(),
  direcaoutilizadoriduser: 1,
};

describe('getAllEventos', () => {
  it('deve retornar todos os eventos mapeados', async () => {
    mockPrisma.evento.findMany.mockResolvedValue([mockEvento]);

    const result = await getAllEventos();

    expect(result).toHaveLength(1);
    expect(result[0].titulo).toBe('Show de Final de Ano');
    expect(result[0].id).toBe('1');
    expect(mockPrisma.evento.findMany).toHaveBeenCalledOnce();
  });

  it('deve retornar array vazio quando não há eventos', async () => {
    mockPrisma.evento.findMany.mockResolvedValue([]);

    const result = await getAllEventos();

    expect(result).toEqual([]);
  });
});

describe('getEventoById', () => {
  it('deve retornar evento mapeado quando encontrado', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(mockEvento);

    const result = await getEventoById(1);

    expect(result.titulo).toBe('Show de Final de Ano');
    expect(result.id).toBe('1');
  });

  it('deve retornar null quando não encontrado', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(null);

    const result = await getEventoById(999);

    expect(result).toBeNull();
  });
});

describe('createEvento', () => {
  it('deve criar evento com dados válidos', async () => {
    mockPrisma.evento.create.mockResolvedValue(mockEvento);

    const result = await createEvento({
      titulo: 'Show de Final de Ano',
      descricao: 'Evento de encerramento',
      data: '2026-06-15',
      local: 'Auditório Municipal',
      linkBilhetes: 'https://bilhetes.pt',
      publicado: false,
      destaque: false,
    }, '1');

    expect(result.titulo).toBe('Show de Final de Ano');
    expect(mockPrisma.evento.create).toHaveBeenCalledOnce();
  });

  it('deve notificar utilizadores quando publicado=true', async () => {
    const eventoPublicado = { ...mockEvento, publicado: true };
    mockPrisma.evento.create.mockResolvedValue(eventoPublicado);
    mockPrisma.utilizador.findMany.mockResolvedValue([
      { iduser: 1 }, { iduser: 2 }, { iduser: 3 },
    ]);

    await createEvento({
      titulo: 'Show',
      descricao: '',
      data: '2026-06-15',
      publicado: true,
    }, '1');

    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');
    expect(createNotificacao).toHaveBeenCalledTimes(3);
  });

  it('não deve notificar quando publicado=false', async () => {
    mockPrisma.evento.create.mockResolvedValue(mockEvento);

    await createEvento({
      titulo: 'Rascunho',
      descricao: '',
      data: '2026-06-15',
      publicado: false,
    }, '1');

    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');
    expect(createNotificacao).not.toHaveBeenCalled();
  });
});

describe('updateEvento', () => {
  it('deve atualizar campos fornecidos', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(mockEvento);
    mockPrisma.evento.update.mockResolvedValue({ ...mockEvento, titulo: 'Novo Título' });

    const result = await updateEvento(1, { titulo: 'Novo Título' });

    expect(result.titulo).toBe('Novo Título');
  });

  it('deve rejeitar evento inexistente', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(null);

    await expect(updateEvento(999, { titulo: 'X' })).rejects.toThrow('Evento não encontrado');
    expect(mockPrisma.evento.update).not.toHaveBeenCalled();
  });

  it('deve notificar quando data altera em evento publicado', async () => {
    const eventoPublicado = { ...mockEvento, publicado: true };
    mockPrisma.evento.findUnique.mockResolvedValue(eventoPublicado);
    mockPrisma.evento.update.mockResolvedValue({
      ...eventoPublicado, dataevento: new Date('2026-07-01'),
    });
    mockPrisma.utilizador.findMany.mockResolvedValue([{ iduser: 1 }]);

    await updateEvento(1, { data: '2026-07-01' });

    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');
    expect(createNotificacao).toHaveBeenCalled();
  });
});

describe('deleteEvento', () => {
  it('deve eliminar evento existente', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(mockEvento);
    mockPrisma.evento.delete.mockResolvedValue(mockEvento);

    const result = await deleteEvento(1);

    expect(result).toMatchObject({ message: expect.stringContaining('sucesso') });
    expect(mockPrisma.evento.delete).toHaveBeenCalledWith({ where: { idevento: 1 } });
  });

  it('deve rejeitar evento inexistente', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(null);

    await expect(deleteEvento(999)).rejects.toThrow('Evento não encontrado');
    expect(mockPrisma.evento.delete).not.toHaveBeenCalled();
  });
});

describe('publishEvento', () => {
  it('deve publicar evento e notificar todos', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(mockEvento);
    mockPrisma.evento.update.mockResolvedValue({ ...mockEvento, publicado: true });
    mockPrisma.utilizador.findMany.mockResolvedValue([{ iduser: 1 }, { iduser: 2 }]);

    const result = await publishEvento(1);

    expect(result.publicado).toBe(true);
    const { createNotificacao } = await import('../../src/services/notificacoes.service.js');
    expect(createNotificacao).toHaveBeenCalledTimes(2);
  });

  it('deve rejeitar evento inexistente', async () => {
    mockPrisma.evento.findUnique.mockResolvedValue(null);

    await expect(publishEvento(999)).rejects.toThrow('Evento não encontrado');
  });
});
