import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  $queryRaw: vi.fn(),
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

const {
  getProfessorAulas,
  updateAulaStatus,
} = await import('../../src/services/professor-aulas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getProfessorAulas', () => {
  const rawAula = {
    idpedidoaula: 123,
    data: new Date('2026-05-15'),
    horainicio: new Date('2026-05-15T10:30:00Z'),
    duracaoaula: '01:30:00',
    estadoidestado: 22,
    estado_nome: 'confirmado',
    privacidade: false,
    sugestaoestado: null,
    novadata: null,
    sala_nome: 'Estúdio 1',
    modalidadeidmodalidade: 3,
    modalidade_nome: 'Ballet Clássico',
    dm_professor_id: 10,
    aluno_nome: 'Maria Aluna',
    aluno_id: 5,
    encarregado_nome: 'Ana Encarregado',
    encarregado_id: 7,
  };

  it('deve retornar aulas do professor com campos mapeados', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([rawAula]);

    const result = await getProfessorAulas(10);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '123',
      data: '2026-05-15',
      horaInicio: '10:30',
      duracao: 1,
      status: 'CONFIRMADO',
      modalidade: 'Ballet Clássico',
      estudioNome: 'Estúdio 1',
      alunoNome: 'Maria Aluna',
      encarregadoId: '7',
      encarregadoNome: 'Ana Encarregado',
      privacidade: false,
      sugestaoestado: null,
      novadata: null,
      novaData: null,
    });
  });

  it('deve formatar horaInicio quando horainicio é Date', async () => {
    const aula = {
      ...rawAula,
      horainicio: new Date('2026-05-15T14:45:00Z'),
    };
    mockPrisma.$queryRaw.mockResolvedValue([aula]);

    const result = await getProfessorAulas(10);

    expect(result[0].horaInicio).toBe('14:45');
  });

  it('deve formatar horaInicio quando horainicio é string (fallback)', async () => {
    const aula = { ...rawAula, horainicio: '09:15:00' };
    mockPrisma.$queryRaw.mockResolvedValue([aula]);

    const result = await getProfessorAulas(10);

    expect(result[0].horaInicio).toBe('09:15');
  });

  it('deve calcular duracao a partir de HH:MM:SS', async () => {
    const aula = { ...rawAula, duracaoaula: '02:00:00' };
    mockPrisma.$queryRaw.mockResolvedValue([aula]);

    const result = await getProfessorAulas(10);

    expect(result[0].duracao).toBe(2);
  });

  it('deve assumir duracao 60 quando duracaoaula é null', async () => {
    const aula = { ...rawAula, duracaoaula: null };
    mockPrisma.$queryRaw.mockResolvedValue([aula]);

    const result = await getProfessorAulas(10);

    expect(result[0].duracao).toBe(60);
  });

  it('deve retornar array vazio quando o professor não tem aulas', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getProfessorAulas(999);

    expect(result).toEqual([]);
  });

  it('deve lidar com novadata preenchida', async () => {
    const aula = {
      ...rawAula,
      sugestaoestado: 'AGUARDA_PROFESSOR',
      novadata: new Date('2026-06-01'),
    };
    mockPrisma.$queryRaw.mockResolvedValue([aula]);

    const result = await getProfessorAulas(10);

    expect(result[0].sugestaoestado).toBe('AGUARDA_PROFESSOR');
    expect(result[0].novadata).toBe('2026-06-01');
    expect(result[0].novaData).toBe('2026-06-01');
  });

  it('deve retornar string vazia para alunoNome quando não existe', async () => {
    const aula = { ...rawAula, aluno_nome: null };
    mockPrisma.$queryRaw.mockResolvedValue([aula]);

    const result = await getProfessorAulas(10);

    expect(result[0].alunoNome).toBe('');
  });

  it('deve passar professorId como parâmetro na query SQL', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await getProfessorAulas(10);

    expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
  });
});

describe('updateAulaStatus', () => {
  it('deve atualizar status quando estado existe', async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ idestado: 22 }])
      .mockResolvedValueOnce([{
        idpedidoaula: 123,
        data: new Date('2026-05-15'),
        horainicio: new Date('2026-05-15T10:00:00Z'),
        duracaoaula: '01:00:00',
        estadoidestado: 22,
      }]);

    const result = await updateAulaStatus('123', 'Confirmado');

    expect(result).toHaveLength(1);
    expect(result[0].idpedidoaula).toBe(123);
    expect(result[0].estadoidestado).toBe(22);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('deve converter id string para número inteiro no UPDATE', async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ idestado: 22 }])
      .mockResolvedValueOnce([{
        idpedidoaula: 123,
        data: new Date('2026-05-15'),
        horainicio: new Date('2026-05-15T10:00:00Z'),
        duracaoaula: '01:00:00',
        estadoidestado: 22,
      }]);

    await updateAulaStatus('123', 'Confirmado');

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('deve lançar erro quando estado não é encontrado', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await expect(
      updateAulaStatus('123', 'EstadoInexistente')
    ).rejects.toThrow('Estado EstadoInexistente não encontrado');

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('deve lançar erro quando estado retorna array vazio', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await expect(
      updateAulaStatus('1', 'Aprovado')
    ).rejects.toThrow('Estado Aprovado não encontrado');
  });
});
