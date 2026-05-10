import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  grupo: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  alunogrupo: {
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  aluno: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  utilizador: {
    findUnique: vi.fn(),
  },
  sala: {
    findUnique: vi.fn(),
  },
  professor: {
    findUnique: vi.fn(),
  },
  encarregadoeducacao: {
    findUnique: vi.fn(),
  },
  notificacao: {
    create: vi.fn(),
  },
  disponibilidade_mensal: {
    findMany: vi.fn(),
  },
};

vi.mock('../../src/config/db.js', () => ({ default: mockPrisma }));

vi.mock('../../src/services/notificacoes.service.js', () => ({
  createNotificacao: vi.fn(),
}));

const {
  getAllTurmas,
  getTurmaById,
  createTurma,
  updateTurma,
  deleteTurma,
  enrollAluno,
  removeAluno,
  closeTurma,
  archiveTurma,
} = await import('../../src/services/turmas.service.js');

const { createNotificacao } = await import('../../src/services/notificacoes.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAllTurmas', () => {
  it('deve retornar lista de turmas com alunos', async () => {
    const mockTurmas = [
      {
        idgrupo: 1,
        nomegrupo: 'Ballet Iniciantes',
        status: 'ABERTA',
        descricao: 'Turma de ballet',
        modalidade: 'Ballet',
        nivel: 'Iniciante',
        faixaEtaria: '6-8',
        professorId: 5,
        estudioId: 1,
        diasSemana: '["segunda","quarta"]',
        horaInicio: '10:00',
        horaFim: '11:00',
        duracao: 60,
        lotacaoMaxima: 15,
        dataInicio: '2026-01-01',
        dataFim: null,
        cor: '#5eead4',
        requisitos: null,
        alunogrupo: [
          { alunoidaluno: 10, aluno: { utilizadoriduser: 10, utilizador: { nome: 'Maria' }, encarregadoeducacao: null } },
          { alunoidaluno: 11, aluno: { utilizadoriduser: 11, utilizador: { nome: 'João' }, encarregadoeducacao: null } },
        ],
      },
    ];

    mockPrisma.grupo.findMany.mockResolvedValue(mockTurmas);

    const result = await getAllTurmas();

    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe('Ballet Iniciantes');
    expect(result[0].status).toBe('ABERTA');
    expect(result[0].alunosInscritos).toHaveLength(2);
    expect(result[0].alunosInscritos[0].alunoNome).toBe('Maria');
  });

  it('deve retornar lista vazia quando não existirem turmas', async () => {
    mockPrisma.grupo.findMany.mockResolvedValue([]);

    const result = await getAllTurmas();

    expect(result).toEqual([]);
  });

  it('deve mapear corretamente campos opcionais vazios', async () => {
    const mockTurmas = [
      {
        idgrupo: 2,
        nomegrupo: 'Dança Livre',
        status: 'FECHADA',
        descricao: null,
        modalidade: null,
        nivel: null,
        faixaEtaria: null,
        professorId: null,
        estudioId: null,
        diasSemana: null,
        horaInicio: null,
        horaFim: null,
        duracao: null,
        lotacaoMaxima: null,
        dataInicio: null,
        dataFim: null,
        cor: null,
        requisitos: null,
        alunogrupo: [],
      },
    ];

    mockPrisma.grupo.findMany.mockResolvedValue(mockTurmas);

    const result = await getAllTurmas();

    expect(result[0].descricao).toBe('');
    expect(result[0].modalidade).toBe('');
    expect(result[0].nivel).toBe('Iniciante');
    expect(result[0].duracao).toBe(60);
    expect(result[0].cor).toBe('#5eead4');
  });
});

describe('getTurmaById', () => {
  it('deve retornar turma pelo id', async () => {
    const mockTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet Avançados',
      status: 'ABERTA',
      alunogrupo: [
        { alunoidaluno: 5, aluno: { utilizadoriduser: 5, utilizador: { nome: 'Ana' }, encarregadoeducacao: null } },
      ],
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);

    const result = await getTurmaById(1);

    expect(result).toEqual(mockTurma);
    expect(mockPrisma.grupo.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idgrupo: 1 },
        include: expect.any(Object),
      })
    );
  });

  it('deve retornar null quando turma não existe', async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);

    const result = await getTurmaById(999);

    expect(result).toBeNull();
  });
});

describe('createTurma', () => {
  it('deve criar turma com dados válidos', async () => {
    const inputData = {
      nomegrupo: 'Jazz Moderno',
      status: 'ABERTA',
      descricao: 'Turma de jazz',
      modalidade: 'Jazz',
      nivel: 'Intermediário',
      faixaEtaria: '10-14',
      professorId: '5',
      estudioId: '2',
      diasSemana: ['terça', 'quinta'],
      horaInicio: '14:00',
      horaFim: '15:30',
      duracao: '90',
      lotacaoMaxima: '12',
      dataInicio: '2026-02-01',
      dataFim: '2026-07-01',
      cor: '#f472b6',
      requisitos: 'Sapatilhas de jazz',
    };

    const mockCreated = {
      idgrupo: 10,
      nomegrupo: 'Jazz Moderno',
      status: 'ABERTA',
      alunogrupo: [],
    };

    mockPrisma.grupo.create.mockResolvedValue(mockCreated);

    const result = await createTurma(inputData);

    expect(result.nomegrupo).toBe('Jazz Moderno');
    expect(mockPrisma.grupo.create).toHaveBeenCalledOnce();
    const createCall = mockPrisma.grupo.create.mock.calls[0][0];
    expect(createCall.data.nomegrupo).toBe('Jazz Moderno');
    expect(createCall.data.professorId).toBe(5);
    expect(createCall.data.estudioId).toBe(2);
    expect(createCall.data.diasSemana).toBe('["terça","quinta"]');
    expect(createCall.data.duracao).toBe(90);
    expect(createCall.data.lotacaoMaxima).toBe(12);
  });

  it('deve criar turma apenas com campos obrigatórios', async () => {
    const inputData = {
      nomegrupo: 'Minimal',
    };

    const mockCreated = {
      idgrupo: 11,
      nomegrupo: 'Minimal',
      alunogrupo: [],
    };

    mockPrisma.grupo.create.mockResolvedValue(mockCreated);

    const result = await createTurma(inputData);

    expect(result.nomegrupo).toBe('Minimal');
    expect(mockPrisma.grupo.create).toHaveBeenCalledOnce();
  });
});

describe('updateTurma', () => {
  it('deve atualizar campos da turma', async () => {
    const existingTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet',
      status: 'ABERTA',
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(existingTurma);

    const updatedTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet Avançado',
      status: 'FECHADA',
      alunogrupo: [],
    };

    mockPrisma.grupo.update.mockResolvedValue(updatedTurma);

    const result = await updateTurma(1, { nomegrupo: 'Ballet Avançado', status: 'FECHADA' });

    expect(result.nomegrupo).toBe('Ballet Avançado');
    expect(result.status).toBe('FECHADA');
    expect(mockPrisma.grupo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idgrupo: 1 },
        data: expect.objectContaining({ nomegrupo: 'Ballet Avançado', status: 'FECHADA' }),
      })
    );
  });

  it('deve lançar erro quando turma não existe', async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);

    await expect(updateTurma(999, { nomegrupo: 'Novo Nome' })).rejects.toThrow('Turma não encontrada');
  });

  it('deve converter IDs string para números', async () => {
    const existingTurma = { idgrupo: '1', nomegrupo: 'Teste', status: 'ABERTA' };
    mockPrisma.grupo.findUnique.mockResolvedValue(existingTurma);
    mockPrisma.grupo.update.mockResolvedValue({ ...existingTurma, professorId: 5 });

    await updateTurma('1', { professorId: '5' });

    const updateCall = mockPrisma.grupo.update.mock.calls[0][0];
    expect(updateCall.data.professorId).toBe(5);
  });
});

describe('deleteTurma', () => {
  it('deve eliminar turma e as suas inscrições', async () => {
    const existingTurma = {
      idgrupo: 1,
      nomegrupo: 'Turma Antiga',
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(existingTurma);
    mockPrisma.alunogrupo.deleteMany.mockResolvedValue({ count: 5 });
    mockPrisma.grupo.delete.mockResolvedValue({ idgrupo: 1 });

    const result = await deleteTurma(1);

    expect(result.message).toBe('Turma eliminada com sucesso');
    expect(mockPrisma.alunogrupo.deleteMany).toHaveBeenCalledWith({ where: { grupoidgrupo: 1 } });
    expect(mockPrisma.grupo.delete).toHaveBeenCalledWith({ where: { idgrupo: 1 } });
  });

  it('deve lançar erro quando turma não existe', async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);

    await expect(deleteTurma(999)).rejects.toThrow('Turma não encontrada');
    expect(mockPrisma.grupo.delete).not.toHaveBeenCalled();
  });
});

describe('enrollAluno', () => {
  it('deve matricular aluno na turma', async () => {
    const mockTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet',
      professorId: 5,
    };

    const mockAluno = {
      idaluno: 10,
      utilizadoriduser: 10,
      utilizador: { nome: 'Maria' },
      encarregadoeducacao: { utilizadoriduser: 20 },
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.aluno.findFirst.mockResolvedValue(mockAluno);
    mockPrisma.alunogrupo.findFirst.mockResolvedValue(null);

    const mockEnrollment = {
      grupoidgrupo: 1,
      alunoidaluno: 10,
      aluno: mockAluno,
      grupo: mockTurma,
    };

    mockPrisma.alunogrupo.create.mockResolvedValue(mockEnrollment);

    const result = await enrollAluno(1, 10);

    expect(result.alunoidaluno).toBe(10);
    expect(mockPrisma.alunogrupo.create).toHaveBeenCalledWith({
      data: { grupoidgrupo: 1, alunoidaluno: 10 },
      include: expect.anything(),
    });
  });

  it('deve lançar erro quando turma não existe', async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);

    await expect(enrollAluno(999, 10)).rejects.toThrow('Turma não encontrada');
  });

  it('deve lançar erro quando aluno não existe', async () => {
    const mockTurma = { idgrupo: 1, nomegrupo: 'Ballet' };
    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.aluno.findFirst.mockResolvedValue(null);

    await expect(enrollAluno(1, 999)).rejects.toThrow('Aluno não encontrado');
  });

  it('deve lançar erro quando aluno já está matriculado', async () => {
    const mockTurma = { idgrupo: 1, nomegrupo: 'Ballet' };
    const mockAluno = { idaluno: 10, utilizadoriduser: 10 };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.aluno.findFirst.mockResolvedValue(mockAluno);
    mockPrisma.alunogrupo.findFirst.mockResolvedValue({ idalunogrupo: 1 });

    await expect(enrollAluno(1, 10)).rejects.toThrow('Aluno já matriculado nesta turma');
  });

  it('deve criar notificações ao matricular', async () => {
    const mockTurma = { idgrupo: 1, nomegrupo: 'Ballet', professorId: 5 };
    const mockAluno = {
      idaluno: 10,
      utilizadoriduser: 10,
      utilizador: { nome: 'Maria' },
      encarregadoeducacao: { utilizadoriduser: 20 },
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.aluno.findFirst.mockResolvedValue(mockAluno);
    mockPrisma.alunogrupo.findFirst.mockResolvedValue(null);
    mockPrisma.alunogrupo.create.mockResolvedValue({
      aluno: mockAluno,
      grupo: mockTurma,
    });

    await enrollAluno(1, 10);

    expect(createNotificacao).toHaveBeenCalledTimes(2);
    expect(createNotificacao).toHaveBeenCalledWith(
      20,
      expect.stringContaining('Maria'),
      'GRUPO_INSCRICAO'
    );
    expect(createNotificacao).toHaveBeenCalledWith(
      5,
      expect.stringContaining('Maria'),
      'GRUPO_INSCRICAO'
    );
  });
});

describe('removeAluno', () => {
  it('deve remover aluno da turma', async () => {
    const mockAluno = {
      idaluno: 10,
      utilizadoriduser: 10,
      utilizador: { nome: 'João' },
      encarregadoeducacao: { utilizadoriduser: 20 },
    };

    const mockEnrollment = {
      idalunogrupo: 1,
      grupoidgrupo: 1,
      alunoidaluno: 10,
    };

    mockPrisma.aluno.findFirst.mockResolvedValue(mockAluno);
    mockPrisma.alunogrupo.findFirst.mockResolvedValue(mockEnrollment);
    mockPrisma.alunogrupo.delete.mockResolvedValue({ idalunogrupo: 1 });
    mockPrisma.grupo.findUnique.mockResolvedValue({ idgrupo: 1, nomegrupo: 'Ballet', professorId: 5 });
    mockPrisma.aluno.findUnique.mockResolvedValue(mockAluno);

    const result = await removeAluno(1, 10);

    expect(result.message).toBe('Aluno removido da turma com sucesso');
    expect(mockPrisma.alunogrupo.delete).toHaveBeenCalledWith({ where: { idalunogrupo: 1 } });
  });

  it('deve lançar erro quando aluno não está matriculado', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue({ idaluno: 10 });
    mockPrisma.alunogrupo.findFirst.mockResolvedValue(null);

    await expect(removeAluno(1, 10)).rejects.toThrow('Aluno não matriculado nesta turma');
  });

  it('deve criar notificações ao remover', async () => {
    const mockAluno = {
      idaluno: 10,
      utilizadoriduser: 10,
      utilizador: { nome: 'João' },
      encarregadoeducacao: { utilizadoriduser: 20 },
    };

    mockPrisma.aluno.findFirst.mockResolvedValue(mockAluno);
    mockPrisma.alunogrupo.findFirst.mockResolvedValue({ idalunogrupo: 1 });
    mockPrisma.alunogrupo.delete.mockResolvedValue({});
    mockPrisma.grupo.findUnique.mockResolvedValue({ idgrupo: 1, nomegrupo: 'Ballet', professorId: 5 });
    mockPrisma.aluno.findUnique.mockResolvedValue(mockAluno);

    await removeAluno(1, 10);

    expect(createNotificacao).toHaveBeenCalledTimes(2);
  });
});

describe('closeTurma', () => {
  it('deve fechar turma aberta', async () => {
    const mockTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet',
      status: 'ABERTA',
      professorId: 5,
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.grupo.update.mockResolvedValue({ ...mockTurma, status: 'FECHADA' });
    mockPrisma.professor.findUnique.mockResolvedValue({ utilizadoriduser: 5 });
    mockPrisma.grupo.findUnique.mockResolvedValueOnce(mockTurma).mockResolvedValueOnce({
      ...mockTurma,
      alunogrupo: [{ aluno: { encarregadoeducacao: { utilizadoriduser: 20 } } }],
    });

    const result = await closeTurma(1);

    expect(result.status).toBe('FECHADA');
    expect(createNotificacao).toHaveBeenCalled();
  });

  it('deve reabrir turma fechada', async () => {
    const mockTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet',
      status: 'FECHADA',
      professorId: 5,
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.grupo.update.mockResolvedValue({ ...mockTurma, status: 'ABERTA' });
    mockPrisma.professor.findUnique.mockResolvedValue({ utilizadoriduser: 5 });
    mockPrisma.grupo.findUnique.mockResolvedValueOnce(mockTurma).mockResolvedValueOnce({
      ...mockTurma,
      alunogrupo: [],
    });

    const result = await closeTurma(1);

    expect(result.status).toBe('ABERTA');
  });

  it('deve lançar erro quando turma não existe', async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);

    await expect(closeTurma(999)).rejects.toThrow('Turma não encontrada');
  });
});

describe('archiveTurma', () => {
  it('deve arquivar turma', async () => {
    const mockTurma = {
      idgrupo: 1,
      nomegrupo: 'Ballet Antigo',
      status: 'FECHADA',
      professorId: 5,
    };

    mockPrisma.grupo.findUnique.mockResolvedValue(mockTurma);
    mockPrisma.grupo.update.mockResolvedValue({ ...mockTurma, status: 'ARQUIVADA' });
    mockPrisma.professor.findUnique.mockResolvedValue({ utilizadoriduser: 5 });
    mockPrisma.grupo.findUnique.mockResolvedValueOnce(mockTurma).mockResolvedValueOnce({
      ...mockTurma,
      alunogrupo: [{ aluno: { encarregadoeducacao: { utilizadoriduser: 20 } } }],
    });

    const result = await archiveTurma(1);

    expect(result.status).toBe('ARQUIVADA');
    expect(createNotificacao).toHaveBeenCalledTimes(2);
  });

  it('deve lançar erro quando turma não existe', async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);

    await expect(archiveTurma(999)).rejects.toThrow('Turma não encontrada');
  });
});