import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  utilizador: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  aluno: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  direcao: {
    upsert: vi.fn(),
  },
  professor: {
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  encarregadoeducacao: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  modalidadeprofessor: {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

vi.mock('../../src/config/db.js', () => ({ default: mockPrisma }));

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserModalidades,
} = await import('../../src/services/users.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAllUsers', () => {
  it('deve retornar array vazio quando não há utilizadores', async () => {
    mockPrisma.utilizador.findMany.mockResolvedValue([]);

    const result = await getAllUsers();

    expect(result).toEqual([]);
    expect(mockPrisma.utilizador.findMany).toHaveBeenCalledOnce();
  });

  it('deve retornar utilizadores mapeados sem alumnos nem encarregado', async () => {
    mockPrisma.utilizador.findMany.mockResolvedValue([
      { iduser: 1, nome: 'Diretor', email: 'dir@teste.pt', telemovel: '911111111', estado: true, role: 'DIRECAO', aluno: [] },
      { iduser: 2, nome: 'Admin', email: 'admin@teste.pt', telemovel: '922222222', estado: true, role: 'UTILIZADOR', aluno: [] },
    ]);

    const result = await getAllUsers();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: '1', nome: 'Diretor', role: 'DIRECAO' });
    expect(result[1]).toMatchObject({ id: '2', nome: 'Admin', role: 'UTILIZADOR' });
  });

  it('deve incluir alumnosIds e alumnosNomes para ENCARREGADO', async () => {
    mockPrisma.utilizador.findMany.mockResolvedValueOnce([
      { iduser: 10, nome: 'Encarregado', email: 'enc@teste.pt', telemovel: '910000000', estado: true, role: 'ENCARREGADO', aluno: [] },
    ]);
    mockPrisma.aluno.findMany.mockResolvedValue([
      { utilizadoriduser: 11 },
      { utilizadoriduser: 12 },
    ]);
    mockPrisma.utilizador.findMany.mockResolvedValueOnce([
      { nome: 'Aluno João' },
      { nome: 'Aluno Maria' },
    ]);
    mockPrisma.utilizador.findMany.mockResolvedValueOnce([]);

    const result = await getAllUsers();

    expect(result[0].alunosIds).toEqual(['11', '12']);
    expect(result[0].alunosNomes).toEqual(['Aluno João', 'Aluno Maria']);
  });

  it('deve incluir encarregadoNome para aluno com encarregado', async () => {
    mockPrisma.utilizador.findMany.mockResolvedValueOnce([
      { iduser: 20, nome: 'Aluno', email: 'al@teste.pt', telemovel: '920000000', estado: true, role: 'ALUNO', aluno: [{ encarregadoiduser: 10 }] },
    ]);
    mockPrisma.utilizador.findMany.mockResolvedValueOnce([]);
    mockPrisma.utilizador.findUnique.mockResolvedValue({ nome: 'Encarregado do João' });

    const result = await getAllUsers();

    expect(result[0].encarregadoId).toBe('10');
    expect(result[0].encarregadoNome).toBe('Encarregado do João');
  });
});

describe('getUserById', () => {
  it('deve retornar utilizador quando encontrado', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 5, nome: 'User', email: 'user@teste.pt', telemovel: '911111111', estado: true, role: 'PROFESSOR',
    });

    const result = await getUserById(5);

    expect(result).toMatchObject({ iduser: 5, nome: 'User', role: 'PROFESSOR' });
    expect(mockPrisma.utilizador.findUnique).toHaveBeenCalledWith({ where: { iduser: 5 }, select: expect.any(Object) });
  });

  it('deve retornar null quando utilizador não existe', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);

    const result = await getUserById(999);

    expect(result).toBeNull();
  });
});

describe('createUser', () => {
  it('deve criar utilizador com dados válidos', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({
      iduser: 1, nome: 'Novo', email: 'novo@teste.pt', telemovel: '911111111', estado: true, role: 'UTILIZADOR',
    });

    const result = await createUser({ nome: 'Novo', email: 'novo@teste.pt', telemovel: '911111111', password: 'pass123', role: 'UTILIZADOR' });

    expect(result.nome).toBe('Novo');
    expect(result.email).toBe('novo@teste.pt');
    const createCall = mockPrisma.utilizador.create.mock.calls[0][0].data;
    expect(createCall.password).not.toBe('pass123');
    expect(createCall.estado).toBe(true);
  });

  it('deve lançar erro quando email já existe', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 1 });

    await expect(createUser({ nome: 'Dup', email: 'dup@teste.pt', telemovel: '911111111', password: 'pass', role: 'UTILIZADOR' }))
      .rejects.toThrow('Email já registado');
    expect(mockPrisma.utilizador.create).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando ALUNO sem encarregadoId', async () => {
    await expect(createUser({ nome: 'Aluno', email: 'al@teste.pt', telemovel: '911111111', password: 'pass', role: 'ALUNO' }))
      .rejects.toThrow('Encarregado de educação é obrigatório para alunos');
    expect(mockPrisma.utilizador.findUnique).not.toHaveBeenCalled();
  });

  it('deve criar registo em direcao quando role DIRECAO', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({ iduser: 1, nome: 'Dir', email: 'dir@teste.pt', role: 'DIRECAO' });
    mockPrisma.direcao.upsert.mockResolvedValue({});

    await createUser({ nome: 'Dir', email: 'dir@teste.pt', telemovel: '911111111', password: 'pass', role: 'DIRECAO' });

    expect(mockPrisma.direcao.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { utilizadoriduser: 1 },
      create: { utilizadoriduser: 1 },
    }));
  });

  it('deve criar registo em professor quando role PROFESSOR', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({ iduser: 2, nome: 'Prof', email: 'prof@teste.pt', role: 'PROFESSOR' });
    mockPrisma.professor.upsert.mockResolvedValue({});
    mockPrisma.modalidadeprofessor.create.mockResolvedValue({});

    await createUser({ nome: 'Prof', email: 'prof@teste.pt', telemovel: '911111111', password: 'pass', role: 'PROFESSOR', modalidades: [1, 2] });

    expect(mockPrisma.professor.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { utilizadoriduser: 2 } }));
    expect(mockPrisma.modalidadeprofessor.create).toHaveBeenCalledTimes(2);
  });

  it('deve criar registo em encarregadoeducacao quando role ENCARREGADO', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({ iduser: 3, nome: 'EE', email: 'ee@teste.pt', role: 'ENCARREGADO' });
    mockPrisma.encarregadoeducacao.upsert.mockResolvedValue({});

    await createUser({ nome: 'EE', email: 'ee@teste.pt', telemovel: '911111111', password: 'pass', role: 'ENCARREGADO' });

    expect(mockPrisma.encarregadoeducacao.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { utilizadoriduser: 3 } }));
  });

  it('deve criar aluno e garantir que encarregado existe quando role ALUNO', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({ iduser: 20, nome: 'Aluno', email: 'al@teste.pt', role: 'ALUNO' });
    mockPrisma.encarregadoeducacao.upsert.mockResolvedValue({});
    mockPrisma.aluno.create.mockResolvedValue({});

    await createUser({ nome: 'Aluno', email: 'al@teste.pt', telemovel: '911111111', password: 'pass', role: 'ALUNO', encarregadoId: 10 });

    expect(mockPrisma.encarregadoeducacao.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { utilizadoriduser: 10 } }));
    expect(mockPrisma.aluno.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ utilizadoriduser: 20, encarregadoiduser: 10 }) }));
  });
});

describe('updateUser', () => {
  it('deve atualizar campos e retornar utilizador', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValueOnce({ iduser: 1, email: 'old@teste.pt', role: 'UTILIZADOR' });
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, nome: 'Atualizado', email: 'old@teste.pt', telemovel: '911111111', estado: true, role: 'UTILIZADOR' });

    const result = await updateUser(1, { nome: 'Atualizado' });

    expect(result.nome).toBe('Atualizado');
    expect(mockPrisma.utilizador.update).toHaveBeenCalledWith(expect.objectContaining({ where: { iduser: 1 }, data: expect.objectContaining({ nome: 'Atualizado' }) }));
  });

  it('deve lançar erro quando utilizador não encontrado', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);

    await expect(updateUser(999, { nome: 'Test' })).rejects.toThrow('Utilizador não encontrado');
  });

  it('deve lançar erro quando email já está em uso', async () => {
    mockPrisma.utilizador.findUnique
      .mockResolvedValueOnce({ iduser: 1, email: 'old@teste.pt', role: 'UTILIZADOR' })
      .mockResolvedValueOnce({ iduser: 2, email: 'taken@teste.pt' });

    await expect(updateUser(1, { email: 'taken@teste.pt' })).rejects.toThrow('Email já está em uso');
  });

  it('deve criar registo professor ao mudar para role PROFESSOR', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValueOnce({ iduser: 1, role: 'UTILIZADOR' });
    mockPrisma.utilizador.findUnique.mockResolvedValueOnce(null);
    mockPrisma.professor.upsert.mockResolvedValue({});
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, role: 'PROFESSOR' });

    await updateUser(1, { role: 'PROFESSOR' });

    expect(mockPrisma.professor.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { utilizadoriduser: 1 } }));
  });

  it('deve criar registo encarregado ao mudar para role ENCARREGADO', async () => {
    mockPrisma.utilizador.findUnique
      .mockResolvedValueOnce({ iduser: 1, role: 'UTILIZADOR' })
      .mockResolvedValueOnce(null);
    mockPrisma.encarregadoeducacao.upsert.mockResolvedValue({});
    mockPrisma.aluno.findMany.mockResolvedValue([]);
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, role: 'ENCARREGADO' });

    await updateUser(1, { role: 'ENCARREGADO' });

    expect(mockPrisma.encarregadoeducacao.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { utilizadoriduser: 1 } }));
  });

  it('deve criar registo direcao ao mudar para role DIRECAO', async () => {
    mockPrisma.utilizador.findUnique
      .mockResolvedValueOnce({ iduser: 1, role: 'UTILIZADOR' })
      .mockResolvedValueOnce(null);
    mockPrisma.direcao.upsert.mockResolvedValue({});
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, role: 'DIRECAO' });

    const result = await updateUser(1, { role: 'DIRECAO' });

    expect(result.role).toBe('DIRECAO');
    expect(mockPrisma.direcao.upsert).toHaveBeenCalledOnce();
  });

  it('deve atualizar aluno com novo encarregadoId', async () => {
    mockPrisma.utilizador.findUnique
      .mockResolvedValueOnce({ iduser: 20, role: 'ALUNO' })
      .mockResolvedValueOnce(null);
    mockPrisma.encarregadoeducacao.upsert.mockResolvedValue({});
    mockPrisma.aluno.findFirst.mockResolvedValue({ idaluno: 5 });
    mockPrisma.aluno.update.mockResolvedValue({});
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 20, role: 'ALUNO' });
    mockPrisma.aluno.findFirst.mockResolvedValueOnce({ idaluno: 5, encarregadoiduser: 10 });

    const result = await updateUser(20, { encarregadoId: '10' });

    expect(mockPrisma.aluno.update).toHaveBeenCalledWith(expect.objectContaining({ where: { idaluno: 5 }, data: { encarregadoiduser: 10 } }));
  });

  it('deve criar aluno quando não existe e role é ALUNO com encarregadoId', async () => {
    mockPrisma.utilizador.findUnique
      .mockResolvedValueOnce({ iduser: 20, role: 'UTILIZADOR' });
    mockPrisma.encarregadoeducacao.upsert.mockResolvedValue({});
    mockPrisma.aluno.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ idaluno: 6, encarregadoiduser: 10 });
    mockPrisma.aluno.create.mockResolvedValue({ idaluno: 6 });
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 20, role: 'ALUNO' });

    const result = await updateUser(20, { role: 'ALUNO', encarregadoId: '10' });

    expect(result.role).toBe('ALUNO');
    expect(mockPrisma.aluno.create).toHaveBeenCalledOnce();
    expect(mockPrisma.aluno.create.mock.calls[0][0].data.encarregadoiduser).toBe(10);
  });

  it('deve atualizar tokenVersion ao desativar utilizador', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValueOnce({ iduser: 1, role: 'DIRECAO' });
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, estado: false, role: 'DIRECAO' });

    await updateUser(1, { estado: false });

    const updateData = mockPrisma.utilizador.update.mock.calls[0][0].data;
    expect(updateData.tokenVersion).toEqual({ increment: 1 });
  });

  it('deve atualizar tokenVersion ao adicionar nova role', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValueOnce({ iduser: 1, role: 'PROFESSOR' });
    mockPrisma.aluno.findMany.mockResolvedValue([]);
    mockPrisma.direcao.upsert.mockResolvedValue({});
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, role: '["PROFESSOR","DIRECAO"]' });

    await updateUser(1, { role: ['PROFESSOR', 'DIRECAO'] });

    const updateData = mockPrisma.utilizador.update.mock.calls[0][0].data;
    expect(updateData.tokenVersion).toEqual({ increment: 1 });
  });

  it('deve atualizar tokenVersion ao alterar role principal', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValueOnce({ iduser: 1, role: 'ENCARREGADO' });
    mockPrisma.aluno.findMany.mockResolvedValue([]);
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1, role: 'PROFESSOR' });

    await updateUser(1, { role: 'PROFESSOR' });

    const updateData = mockPrisma.utilizador.update.mock.calls[0][0].data;
    expect(updateData.tokenVersion).toEqual({ increment: 1 });
  });

it('deve substituir modalidades de professor quando fornecidas', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 2, role: 'PROFESSOR' });
    mockPrisma.aluno.findMany.mockResolvedValue([]);
    mockPrisma.aluno.findFirst.mockResolvedValue(null);
    mockPrisma.modalidadeprofessor.deleteMany.mockResolvedValue({});
    mockPrisma.modalidadeprofessor.create.mockResolvedValue({});
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 2, role: 'PROFESSOR' });

    const result = await updateUser(2, { role: 'PROFESSOR', modalidades: [3, 4, 5] });

    expect(result.role).toBe('PROFESSOR');
    expect(mockPrisma.modalidadeprofessor.deleteMany).toHaveBeenCalledOnce();
    expect(mockPrisma.modalidadeprofessor.create).toHaveBeenCalledTimes(3);
    const creates = mockPrisma.modalidadeprofessor.create.mock.calls;
    expect(creates[0][0].data.modalidadeidmodalidade).toBe(3);
    expect(creates[1][0].data.modalidadeidmodalidade).toBe(4);
    expect(creates[2][0].data.modalidadeidmodalidade).toBe(5);
  });
});

describe('deleteUser', () => {
  it('deve eliminar utilizador PROFESSOR e os seus dados específicos', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 1, role: 'PROFESSOR' });
    mockPrisma.modalidadeprofessor.deleteMany.mockResolvedValue({});
    mockPrisma.$queryRaw.mockResolvedValue({});
    mockPrisma.professor.delete.mockResolvedValue({});
    mockPrisma.utilizador.delete.mockResolvedValue({});

    const result = await deleteUser(1);

    expect(result).toEqual({ message: 'Utilizador eliminado com sucesso' });
    expect(mockPrisma.modalidadeprofessor.deleteMany).toHaveBeenCalledWith({ where: { professorutilizadoriduser: 1 } });
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(mockPrisma.professor.delete).toHaveBeenCalledWith({ where: { utilizadoriduser: 1 } });
    expect(mockPrisma.utilizador.delete).toHaveBeenCalledWith({ where: { iduser: 1 } });
  });

  it('deve eliminar utilizador ALUNO e os seus dados específicos', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 2, role: 'ALUNO' });
    mockPrisma.aluno.deleteMany.mockResolvedValue({});
    mockPrisma.utilizador.delete.mockResolvedValue({});

    const result = await deleteUser(2);

    expect(result).toEqual({ message: 'Utilizador eliminado com sucesso' });
    expect(mockPrisma.aluno.deleteMany).toHaveBeenCalledWith({ where: { utilizadoriduser: 2 } });
    expect(mockPrisma.utilizador.delete).toHaveBeenCalledWith({ where: { iduser: 2 } });
  });

  it('deve eliminar utilizador ENCARREGADO e os seus dados específicos', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 3, role: 'ENCARREGADO' });
    mockPrisma.encarregadoeducacao.deleteMany.mockResolvedValue({});
    mockPrisma.utilizador.delete.mockResolvedValue({});

    const result = await deleteUser(3);

    expect(result).toEqual({ message: 'Utilizador eliminado com sucesso' });
    expect(mockPrisma.encarregadoeducacao.deleteMany).toHaveBeenCalledWith({ where: { utilizadoriduser: 3 } });
    expect(mockPrisma.utilizador.delete).toHaveBeenCalledWith({ where: { iduser: 3 } });
  });

  it('deve eliminar diretamente utilizador sem role específica', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 4, role: 'UTILIZADOR' });
    mockPrisma.utilizador.delete.mockResolvedValue({});

    const result = await deleteUser(4);

    expect(result).toEqual({ message: 'Utilizador eliminado com sucesso' });
    expect(mockPrisma.utilizador.delete).toHaveBeenCalledWith({ where: { iduser: 4 } });
  });

  it('deve lançar erro quando utilizador não encontrado', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);

    await expect(deleteUser(999)).rejects.toThrow('Utilizador não encontrado');
    expect(mockPrisma.utilizador.delete).not.toHaveBeenCalled();
  });
});

describe('getUserModalidades', () => {
  it('deve retornar array de modalidades', async () => {
    mockPrisma.modalidadeprofessor.findMany.mockResolvedValue([
      { idmodalidadeprofessor: 1, modalidadeidmodalidade: 10 },
      { idmodalidadeprofessor: 2, modalidadeidmodalidade: 20 },
      { idmodalidadeprofessor: 3, modalidadeidmodalidade: 30 },
    ]);

    const result = await getUserModalidades(5);

    expect(result).toHaveLength(3);
    expect(result).toMatchObject([
      { idmodalidadeprofessor: 1, modalidadeidmodalidade: 10 },
      { idmodalidadeprofessor: 2, modalidadeidmodalidade: 20 },
      { idmodalidadeprofessor: 3, modalidadeidmodalidade: 30 },
    ]);
    expect(mockPrisma.modalidadeprofessor.findMany).toHaveBeenCalledWith({
      where: { professorutilizadoriduser: 5 },
      select: { idmodalidadeprofessor: true, modalidadeidmodalidade: true },
    });
  });

  it('deve retornar array vazio quando professor não tem modalidades', async () => {
    mockPrisma.modalidadeprofessor.findMany.mockResolvedValue([]);

    const result = await getUserModalidades(999);

    expect(result).toEqual([]);
  });
});