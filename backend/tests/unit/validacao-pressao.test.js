import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Turmas Service — enrollAluno
// ---------------------------------------------------------------------------
const mockPrismaTurmas = {
  grupo: { findUnique: vi.fn() },
  aluno: { findFirst: vi.fn() },
  alunogrupo: { findFirst: vi.fn(), create: vi.fn() },
};

vi.mock('../../src/services/audit.service.js', () => ({
  createAuditLog: vi.fn(),
}));

vi.mock('../../src/services/notificacoes.service.js', () => ({
  createNotificacao: vi.fn(),
}));

const mockPrismaClientTurmas = vi.fn(() => mockPrismaTurmas);
vi.mock('@prisma/client', () => ({ PrismaClient: mockPrismaClientTurmas }));

const { enrollAluno } = await import('../../src/services/turmas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Turmas — enrollAluno (inscrição em grupo)', () => {
  const turmaValida = {
    idgrupo: 1,
    nomegrupo: 'Ballet Intermédio',
    lotacao: 10,
    estado: 'ABERTA',
    professorId: 5,
  };

  const alunoValido = {
    idaluno: 1,
    utilizadoriduser: 10,
    encarregadoeducacao: { utilizadoriduser: 7 },
    utilizador: { nome: 'Maria Aluna' },
  };

  it('deve inscrever aluno com dados válidos', async () => {
    mockPrismaTurmas.grupo.findUnique.mockResolvedValue(turmaValida);
    mockPrismaTurmas.aluno.findFirst.mockResolvedValue(alunoValido);
    mockPrismaTurmas.alunogrupo.findFirst.mockResolvedValue(null);
    mockPrismaTurmas.alunogrupo.create.mockResolvedValue({
      idalunogrupo: 1,
      alunoidaluno: 1,
      grupoidgrupo: 1,
      aluno: {
        ...alunoValido,
        encarregadoeducacao: { utilizadoriduser: 7 },
      },
      grupo: turmaValida,
    });

    const result = await enrollAluno(1, 10);

    expect(result).toBeDefined();
    expect(mockPrismaTurmas.alunogrupo.create).toHaveBeenCalledOnce();
  });

  it('deve rejeitar quando turma não existe', async () => {
    mockPrismaTurmas.grupo.findUnique.mockResolvedValue(null);

    await expect(enrollAluno(999, 10)).rejects.toThrow('Turma não encontrada');
    expect(mockPrismaTurmas.alunogrupo.create).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando aluno não existe', async () => {
    mockPrismaTurmas.grupo.findUnique.mockResolvedValue(turmaValida);
    mockPrismaTurmas.aluno.findFirst.mockResolvedValue(null);

    await expect(enrollAluno(1, 999)).rejects.toThrow('Aluno não encontrado');
    expect(mockPrismaTurmas.alunogrupo.create).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando aluno já está inscrito na turma', async () => {
    mockPrismaTurmas.grupo.findUnique.mockResolvedValue(turmaValida);
    mockPrismaTurmas.aluno.findFirst.mockResolvedValue(alunoValido);
    mockPrismaTurmas.alunogrupo.findFirst.mockResolvedValue({ idalunogrupo: 1 });

    await expect(enrollAluno(1, 10)).rejects.toThrow('Aluno já matriculado nesta turma');
    expect(mockPrismaTurmas.alunogrupo.create).not.toHaveBeenCalled();
  });

  it('deve aceitar aluno que ainda não está inscrito', async () => {
    mockPrismaTurmas.grupo.findUnique.mockResolvedValue(turmaValida);
    mockPrismaTurmas.aluno.findFirst.mockResolvedValue(alunoValido);
    mockPrismaTurmas.alunogrupo.findFirst.mockResolvedValue(null);
    mockPrismaTurmas.alunogrupo.create.mockResolvedValue({
      idalunogrupo: 1,
      alunoidaluno: 1,
      grupoidgrupo: 1,
      aluno: {
        ...alunoValido,
        encarregadoeducacao: { utilizadoriduser: 7 },
      },
      grupo: turmaValida,
    });

    const result = await enrollAluno(1, 10);

    expect(result).toBeDefined();
  });
});
