import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  anuncio: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  estado: { findFirst: vi.fn(), findMany: vi.fn() },
  notificacao: { create: vi.fn() },
  direcao: { findFirst: vi.fn() },
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

const {
  getAllAnuncios, consultarAnuncio, getAnunciosByEstado,
  registarAnuncio, updateAnuncio, deleteAnuncio,
  avaliarAnuncio, ressubmeterAnuncio, getEstados, mapAnuncio,
} = await import('../../src/services/anuncios.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

const makeMockAnuncio = (overrides = {}) => ({
  idanuncio: 1,
  valor: 50,
  dataanuncio: new Date(),
  datainicio: new Date(),
  datafim: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  quantidade: 5,
  figurinoidfigurino: 1,
  tipotransacao: 'ALUGUER',
  motivorejeicao: null,
  estado: { tipoestado: 'Pendente' },
  figurino: { idfigurino: 1, modelofigurino: { nomemodelo: 'Tutu Clássico', fotografia: '' } },
  direcao: { utilizador: { iduser: 2, nome: 'Direção', telemovel: '911111111', email: 'dir@teste.pt' } },
  encarregadoeducacao: null,
  professor: null,
  ...overrides,
});

describe('getAllAnuncios', () => {
  it('deve retornar lista de anúncios mapeados', async () => {
    mockPrisma.anuncio.findMany.mockResolvedValue([makeMockAnuncio()]);

    const result = await getAllAnuncios();

    expect(result).toHaveLength(1);
    expect(result[0].titulo).toBe('Tutu Clássico');
    expect(result[0].status).toBe('PENDENTE');
  });

  it('deve retornar array vazio', async () => {
    mockPrisma.anuncio.findMany.mockResolvedValue([]);
    expect(await getAllAnuncios()).toEqual([]);
  });
});

describe('registarAnuncio', () => {
  it('deve criar anúncio com dados válidos', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 21 });
    mockPrisma.anuncio.create.mockResolvedValue(makeMockAnuncio());
    mockPrisma.direcao.findFirst.mockResolvedValue({ utilizadoriduser: 2, utilizador: {} });
    mockPrisma.notificacao.create.mockResolvedValue({});

    const result = await registarAnuncio({
      valor: 50, dataanuncio: new Date(), datainicio: new Date(),
      datafim: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      quantidade: 5, figurinoidfigurino: 1, tipotransacao: 'ALUGUER',
    });

    expect(result.titulo).toBeDefined();
  });

  it('deve rejeitar data de início no passado', async () => {
    await expect(registarAnuncio({
      valor: 50, dataanuncio: new Date(),
      datainicio: '2020-01-01',
      datafim: new Date(), quantidade: 5, figurinoidfigurino: 1,
    })).rejects.toThrow('não pode ser no passado');
  });

  it('deve rejeitar data de fim <= data de início', async () => {
    await expect(registarAnuncio({
      valor: 50, dataanuncio: new Date(),
      datainicio: new Date(new Date().setDate(new Date().getDate() + 10)),
      datafim: new Date(new Date().setDate(new Date().getDate() + 10)),
      quantidade: 5, figurinoidfigurino: 1,
    })).rejects.toThrow('posterior');
  });
});

describe('avaliarAnuncio', () => {
  it('deve aprovar anúncio e notificar EE', async () => {
    const anuncioEE = makeMockAnuncio({ encarregadoeducacao: { utilizador: { iduser: 5, nome: 'EE' } } });
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 22 });
    mockPrisma.anuncio.update.mockResolvedValue({ ...anuncioEE, estado: { tipoestado: 'Aprovado' } });
    mockPrisma.notificacao.create.mockResolvedValue({});

    const result = await avaliarAnuncio(1, 'aprovar', 2);

    expect(result.status).toBe('APROVADO');
  });

  it('deve rejeitar anúncio com motivo e notificar', async () => {
    const anuncioEE = makeMockAnuncio({
      encarregadoeducacao: { utilizador: { iduser: 5, nome: 'EE' } },
      estado: { tipoestado: 'Rejeitado' },
    });
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 23 });
    mockPrisma.anuncio.update.mockResolvedValue({ ...anuncioEE, motivorejeicao: 'Stock insuficiente' });
    mockPrisma.notificacao.create.mockResolvedValue({});

    const result = await avaliarAnuncio(1, 'rejeitar', 2, 'Stock insuficiente');

    expect(result.status).toBe('REJEITADO');
  });

  it('deve lançar erro se estado APROVADO não existe', async () => {
    mockPrisma.estado.findFirst.mockResolvedValue(null);

    await expect(avaliarAnuncio(1, 'aprovar', 2)).rejects.toThrow('APROVADO não encontrado');
  });
});

describe('ressubmeterAnuncio', () => {
  it('deve ressubmeter anúncio rejeitado', async () => {
    const anuncioRej = makeMockAnuncio({
      encarregadoeducacao: { utilizador: { iduser: 5, nome: 'EE' } },
      estado: { tipoestado: 'Rejeitado' },
    });
    mockPrisma.anuncio.findUnique.mockResolvedValue(anuncioRej);
    mockPrisma.estado.findFirst.mockResolvedValue({ idestado: 21 });
    mockPrisma.anuncio.update.mockResolvedValue(makeMockAnuncio({ estado: { tipoestado: 'Pendente' } }));
    mockPrisma.direcao.findFirst.mockResolvedValue({ utilizadoriduser: 2, utilizador: {} });
    mockPrisma.notificacao.create.mockResolvedValue({});

    const result = await ressubmeterAnuncio(1, 5, 'ENCARREGADO');

    expect(result).toBeDefined();
  });

  it('deve rejeitar ressubmissão de anúncio pendente', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue(makeMockAnuncio({
      estado: { tipoestado: 'Pendente' },
      encarregadoeducacao: { utilizador: { iduser: 5, nome: 'EE' } },
    }));

    await expect(ressubmeterAnuncio(1, 5, 'ENCARREGADO')).rejects.toThrow('Só é possível ressubmeter anúncios rejeitados');
  });
});

describe('updateAnuncio', () => {
  it('deve rejeitar edição por não-DIRECAO de anúncio não-pendente', async () => {
    mockPrisma.anuncio.findUnique.mockResolvedValue(
      makeMockAnuncio({ estado: { tipoestado: 'Aprovado' }, encarregadoeducacao: { utilizador: { iduser: 5, nome: 'EE' } } })
    );

    await expect(updateAnuncio(1, { valor: 60 }, 5, 'ENCARREGADO')).rejects.toThrow('Só é possível editar anúncios pendentes');
  });
});

describe('deleteAnuncio', () => {
  it('deve eliminar como DIRECAO', async () => {
    mockPrisma.anuncio.delete.mockResolvedValue({ idanuncio: 1 });

    const result = await deleteAnuncio(1, 2, 'DIRECAO');

    expect(result).toBeDefined();
  });
});

describe('getEstados', () => {
  it('deve retornar estados', async () => {
    mockPrisma.estado.findMany.mockResolvedValue([{ idestado: 21, tipoestado: 'Pendente' }]);

    const result = await getEstados();

    expect(result).toHaveLength(1);
  });
});
