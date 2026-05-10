import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSala = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockAula = {
  findMany: vi.fn(),
};

const mockDb = {
  sala: mockSala,
  aula: mockAula,
  $queryRaw: vi.fn(),
};

vi.mock('../../src/config/db.js', () => ({
  default: mockDb,
}));

const {
  getAllSalas,
  getSalaById,
  createSala,
  updateSala,
  deleteSala,
  getSalaAvailability,
  consultarSalaDisponivel,
} = await import('../../src/services/salas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAllSalas', () => {
  const mockSalas = [
    {
      idsala: 1,
      nomesala: 1,
      capacidade: 10,
      estadosalaidestadosala: 1,
      tiposalaidtiposala: 1,
      estadosala: { idestadosala: 1, tipoestado: 'Disponivel' },
      tiposala: { idtiposala: 1, tiposala: 'Individual' },
    },
    {
      idsala: 2,
      nomesala: 2,
      capacidade: 20,
      estadosalaidestadosala: 2,
      tiposalaidtiposala: 2,
      estadosala: { idestadosala: 2, tipoestado: 'Ocupada' },
      tiposala: { idtiposala: 2, tiposala: 'Grupo' },
    },
  ];

  it('deve retornar todas as salas com estadosala e tiposala', async () => {
    mockSala.findMany.mockResolvedValue(mockSalas);

    const result = await getAllSalas();

    expect(mockSala.findMany).toHaveBeenCalledWith({
      include: {
        estadosala: true,
        tiposala: true,
      },
    });
    expect(result).toEqual(mockSalas);
  });

  it('deve retornar array vazio quando não há salas', async () => {
    mockSala.findMany.mockResolvedValue([]);

    const result = await getAllSalas();

    expect(result).toEqual([]);
  });
});

describe('getSalaById', () => {
  const mockSalaData = {
    idsala: 1,
    nomesala: 1,
    capacidade: 10,
    estadosalaidestadosala: 1,
    tiposalaidtiposala: 1,
    estadosala: { idestadosala: 1, tipoestado: 'Disponivel' },
    tiposala: { idtiposala: 1, tiposala: 'Individual' },
  };

  it('deve retornar sala específica com estadosala e tiposala', async () => {
    mockSala.findUnique.mockResolvedValue(mockSalaData);

    const result = await getSalaById(1);

    expect(mockSala.findUnique).toHaveBeenCalledWith({
      where: { idsala: 1 },
      include: {
        estadosala: true,
        tiposala: true,
      },
    });
    expect(result).toEqual(mockSalaData);
  });

  it('deve retornar null quando sala não existe', async () => {
    mockSala.findUnique.mockResolvedValue(null);

    const result = await getSalaById(999);

    expect(result).toBeNull();
  });
});

describe('createSala', () => {
  const validData = {
    nomesala: 1,
    capacidade: 10,
    estadosalaidestadosala: 1,
    tiposalaidtiposala: 1,
  };

  it('deve criar sala com dados válidos', async () => {
    const mockCreatedSala = {
      idsala: 1,
      ...validData,
      estadosala: { idestadosala: 1, tipoestado: 'Disponivel' },
      tiposala: { idtiposala: 1, tiposala: 'Individual' },
    };
    mockSala.create.mockResolvedValue(mockCreatedSala);

    const result = await createSala(validData);

    expect(mockSala.create).toHaveBeenCalledWith({
      data: {
        nomesala: 1,
        capacidade: 10,
        estadosalaidestadosala: 1,
        tiposalaidtiposala: 1,
      },
      include: {
        estadosala: true,
        tiposala: true,
      },
    });
    expect(result).toEqual(mockCreatedSala);
  });
});

describe('updateSala', () => {
  it('deve lançar erro quando sala não existe', async () => {
    mockSala.findUnique.mockResolvedValue(null);

    await expect(updateSala(999, { nomesala: 5 })).rejects.toThrow('Sala não encontrada');
  });

  it('deve atualizar sala existente', async () => {
    const existingSala = { idsala: 1, nomesala: 1, capacidade: 10 };
    const updatedSala = { ...existingSala, nomesala: 5 };
    mockSala.findUnique.mockResolvedValue(existingSala);
    mockSala.update.mockResolvedValue(updatedSala);

    const result = await updateSala(1, { nomesala: 5 });

    expect(result).toEqual(updatedSala);
  });

  it('deve fazer parse dos valores numéricos', async () => {
    const existingSala = { idsala: 1, nomesala: 1, capacidade: 10 };
    mockSala.findUnique.mockResolvedValue(existingSala);
    mockSala.update.mockResolvedValue(existingSala);

    await updateSala(1, { nomesala: '5', capacidade: '15' });

    expect(mockSala.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nomesala: 5,
          capacidade: 15,
        }),
      })
    );
  });
});

describe('deleteSala', () => {
  it('deve lançar erro quando sala não existe', async () => {
    mockSala.findUnique.mockResolvedValue(null);

    await expect(deleteSala(999)).rejects.toThrow('Sala não encontrada');
  });

  it('deve eliminar sala existente', async () => {
    mockSala.findUnique.mockResolvedValue({ idsala: 1, nomesala: 1 });
    mockSala.delete.mockResolvedValue({ idsala: 1 });

    const result = await deleteSala(1);

    expect(mockSala.delete).toHaveBeenCalledWith({ where: { idsala: 1 } });
    expect(result).toEqual({ message: 'Sala eliminada com sucesso' });
  });
});

describe('getSalaAvailability', () => {
  const mockSalaData = {
    idsala: 1,
    nomesala: 'Sala 1',
  };

  it('deve lançar erro quando sala não existe', async () => {
    mockDb.sala.findUnique.mockResolvedValue(null);

    await expect(getSalaAvailability(999, { datainicio: '2026-05-01', datafim: '2026-05-31' })).rejects.toThrow(
      'Sala não encontrada'
    );
  });

  it('deve retornar disponibilidade por período', async () => {
    mockDb.sala.findUnique.mockResolvedValue(mockSalaData);
    mockAula.findMany.mockResolvedValue([]);

    const result = await getSalaAvailability(1, { datainicio: '2026-05-01', datafim: '2026-05-02' });

    expect(result.sala).toEqual({ idsala: 1, nomesala: 'Sala 1' });
    expect(result.periodo).toEqual({ datainicio: '2026-05-01', datafim: '2026-05-02' });
    expect(result.disponibilidade).toHaveLength(2);
  });

  it('deve marcar dias com aulas como não livres', async () => {
    mockDb.sala.findUnique.mockResolvedValue(mockSalaData);
    mockAula.findMany.mockResolvedValue([
      { pedidodeaula: { data: new Date('2026-05-01') } },
    ]);

    const result = await getSalaAvailability(1, { datainicio: '2026-05-01', datafim: '2026-05-01' });

    expect(result.disponibilidade[0].livre).toBe(false);
    expect(result.disponibilidade[0].aulas).toBe(1);
  });
});

describe('consultarSalaDisponivel', () => {
  const mockSala = {
    idsala: 1,
    nomesala: 'Sala 1',
  };

  it('deve lançar erro quando sala não existe', async () => {
    mockDb.sala.findUnique.mockResolvedValue(null);

    await expect(consultarSalaDisponivel(999, '2026-05-01', '09:00', 60)).rejects.toThrow('Sala não encontrada');
  });

  it('deve retornar sala disponível quando não há conflitos', async () => {
    mockDb.sala.findUnique.mockResolvedValue(mockSala);
    mockDb.$queryRaw.mockResolvedValue([]);

    const result = await consultarSalaDisponivel(1, '2026-05-01', '09:00', 60);

    expect(result.disponivel).toBe(true);
    expect(result.mensagem).toBe('Sala disponível para o horário solicitado');
    expect(result.sala).toEqual({ id: 1, nome: 'Sala 1' });
  });

  it('deve retornar indisponível quando há conflito de horário', async () => {
    const mockSalaData = { idsala: 1, nomesala: 'Sala 1' };
    const mockReserva = {
      idpedidoaula: 42,
      horainicio: '09:30',
      duracaoaula: '01:00',
      data: new Date('2026-05-01'),
      tipoestado: 'CONFIRMADO',
    };
    mockDb.sala.findUnique.mockResolvedValue(mockSalaData);
    mockDb.$queryRaw.mockResolvedValue([mockReserva]);

    const result = await consultarSalaDisponivel(1, '2026-05-01', '09:00', 60);

    expect(result.disponivel).toBe(false);
    expect(result.conflito).toBeDefined();
    expect(result.conflito.idPedido).toBe(42);
  });

  it('deve calcular hora fim correctamente a partir da duração', async () => {
    const mockSalaData = { idsala: 1, nomesala: 'Sala 1' };
    mockDb.sala.findUnique.mockResolvedValue(mockSalaData);
    mockDb.$queryRaw.mockResolvedValue([]);

    const result = await consultarSalaDisponivel(1, '2026-05-01', '10:00', 90);

    expect(result.hora).toBe('10:00');
    expect(result.duracao).toBe(90);
  });
});