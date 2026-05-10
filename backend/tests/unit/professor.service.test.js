import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

const {
  verificarDisponibilidadeProfessor,
  createDisponibilidadeMensal,
  updateDisponibilidadeMensal,
  deleteDisponibilidadeMensal,
  getProfessorModalidades,
  getProfessorAulas,
  getDiasSemana,
} = await import('../../src/services/professor.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('verificarDisponibilidadeProfessor', () => {
  const mockDisponibilidades = [
    {
      iddisponibilidade_mensal: 1,
      professorutilizadoriduser: 5,
      data: new Date('2026-05-01'),
      horainicio: '09:00',
      horafim: '10:00',
      modalidadeidmodalidade: 1,
      modalidade_nome: 'Piano',
      ativo: true,
    },
    {
      iddisponibilidade_mensal: 2,
      professorutilizadoriduser: 5,
      data: new Date('2026-05-02'),
      horainicio: '14:00',
      horafim: '15:00',
      modalidadeidmodalidade: 2,
      modalidade_nome: 'Violino',
      ativo: true,
    },
  ];

  it('deve retornar disponibilidades do professor com informações de modalidade', async () => {
    mockPrisma.$queryRaw.mockResolvedValue(mockDisponibilidades);

    const result = await verificarDisponibilidadeProfessor(5);

    expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('SELECT dm.*, mp.modalidadeidmodalidade, m.nome as modalidade_nome')]),
      expect.any(Number)
    );
    expect(result).toEqual(mockDisponibilidades);
  });

  it('deve passar o professorId correto para a query', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await verificarDisponibilidadeProfessor(10);

    expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(String)]),
      10
    );
  });

  it('deve retornar array vazio quando professor não tem disponibilidades', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await verificarDisponibilidadeProfessor(999);

    expect(result).toEqual([]);
  });
});

describe('createDisponibilidadeMensal', () => {
  const validData = {
    professorutilizadoriduser: 5,
    modalidadesprofessoridmodalidadeprofessor: 1,
    data: '2026-05-01',
    horainicio: '09:00',
    horafim: '10:00',
    salaid: 2,
  };

  it('deve criar disponibilidade mensal com dados válidos', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ iddisponibilidade_mensal: 1 }]);

    const result = await createDisponibilidadeMensal(validData);

    expect(result).toEqual([{ iddisponibilidade_mensal: 1 }]);
  });

  it('deve lançar erro quando há conflito de horário', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { iddisponibilidade_mensal: 99, horainicio: '09:30', horafim: '10:30', data: new Date('2026-05-01') },
    ]);

    await expect(createDisponibilidadeMensal(validData)).rejects.toThrow(
      'Já existe uma disponibilidade para este professor nesta data e horário'
    );
  });

  it('deve permitir salaid nulo', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ iddisponibilidade_mensal: 2 }]);

    const dataWithoutSalaId = { ...validData, salaid: undefined };

    const result = await createDisponibilidadeMensal(dataWithoutSalaId);

    expect(result).toEqual([{ iddisponibilidade_mensal: 2 }]);
  });
});

describe('updateDisponibilidadeMensal', () => {
  const validData = {
    data: '2026-05-01',
    horainicio: '11:00',
    horafim: '12:00',
    ativo: true,
    salaid: 2,
  };

  it('deve atualizar disponibilidade existente', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ iddisponibilidade_mensal: 1 }]);

    const result = await updateDisponibilidadeMensal(1, validData);

    expect(result).toEqual([{ iddisponibilidade_mensal: 1 }]);
  });

  it('deve lançar erro quando há conflito com outra disponibilidade', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { iddisponibilidade_mensal: 99, horainicio: '11:30', horafim: '12:30', data: new Date('2026-05-01') },
    ]);

    await expect(updateDisponibilidadeMensal(1, validData)).rejects.toThrow(
      'Já existe uma disponibilidade para este professor nesta data e horário'
    );
  });
});

describe('deleteDisponibilidadeMensal', () => {
  it('deve deletar disponibilidade pelo ID', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ iddisponibilidade_mensal: 1 }]);

    const result = await deleteDisponibilidadeMensal(1);

    expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('DELETE FROM disponibilidade_mensal')]),
      expect.any(Number)
    );
    expect(result).toEqual([{ iddisponibilidade_mensal: 1 }]);
  });
});

describe('getProfessorModalidades', () => {
  const mockModalidades = [
    { idmodalidadeprofessor: 1, idmodalidade: 1, modalidade_nome: 'Piano' },
    { idmodalidadeprofessor: 2, idmodalidade: 2, modalidade_nome: 'Violino' },
  ];

  it('deve retornar modalidades do professor', async () => {
    mockPrisma.$queryRaw.mockResolvedValue(mockModalidades);

    const result = await getProfessorModalidades(5);

    expect(result).toEqual(mockModalidades);
  });

  it('deve retornar array vazio quando professor não tem modalidades', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getProfessorModalidades(999);

    expect(result).toEqual([]);
  });
});

describe('getProfessorAulas', () => {
  const mockAulasRaw = [
    {
      idpedidoaula: 1,
      data: new Date('2026-05-01'),
      horainicio: '09:00',
      duracaoaula: '01:00',
      estadoidestado: 1,
      estado_nome: 'CONFIRMADO',
      privacidade: 'PUBLICO',
      sugestaoestado: null,
      novadata: null,
      sala_nome: 'Sala 1',
      modalidadeidmodalidade: 1,
      modalidade_nome: 'Piano',
      aluno_nome: 'João Silva',
      aluno_id: 10,
    },
  ];

  it('deve formatar correctamente os dados das aulas', async () => {
    mockPrisma.$queryRaw.mockResolvedValue(mockAulasRaw);

    const result = await getProfessorAulas(5);

    expect(result[0]).toMatchObject({
      id: '1',
      data: '2026-05-01',
      horaInicio: '09:00',
      horaFim: '10:00',
      duracao: 60,
      status: 'CONFIRMADA',
      modalidade: 'Piano',
      estudioNome: 'Sala 1',
      professorId: '5',
      alunoId: '10',
      alunoNome: 'João Silva',
    });
  });

  it('deve retornar lista vazia quando professor não tem aulas', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getProfessorAulas(999);

    expect(result).toEqual([]);
  });

  it('deve mapear estado PENDENTE correctamente', async () => {
    const mockAulaPendente = [{
      ...mockAulasRaw[0],
      estado_nome: 'PENDENTE',
    }];
    mockPrisma.$queryRaw.mockResolvedValue(mockAulaPendente);

    const result = await getProfessorAulas(5);

    expect(result[0].status).toBe('PENDENTE');
  });
});

describe('getDiasSemana', () => {
  it('deve retornar array com 6 dias da semana', () => {
    const result = getDiasSemana();

    expect(result).toHaveLength(6);
  });

  it('deve conter os días correctos da semana', () => {
    const result = getDiasSemana();

    expect(result).toContainEqual({ num: 1, label: 'Segunda-feira', short: 'Seg' });
    expect(result).toContainEqual({ num: 6, label: 'Sábado', short: 'Sáb' });
  });

  it('não deve depender de base de dados', () => {

    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});