import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockPrisma = {
  utilizador: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  direcao: { findUnique: vi.fn() },
  professor: { findUnique: vi.fn() },
  encarregadoeducacao: { findUnique: vi.fn() },
  aluno: { findUnique: vi.fn() },
};

vi.mock('../../src/config/db.js', () => ({ default: mockPrisma }));

const {
  register, login, validateToken, logout,
  forgotPassword, resetPassword, getProfile, updateProfile,
} = await import('../../src/services/auth.service.js');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret-key';
});

describe('register', () => {
  it('deve registar utilizador com dados válidos', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({
      iduser: 1, nome: 'João', email: 'joao@teste.pt', role: '"UTILIZADOR"',
    });

    const result = await register('João', 'joao@teste.pt', '911111111', 'pass123');

    expect(result).toMatchObject({ id: 1, nome: 'João', email: 'joao@teste.pt' });
    expect(mockPrisma.utilizador.create).toHaveBeenCalledOnce();
    const createCall = mockPrisma.utilizador.create.mock.calls[0][0].data;
    expect(createCall.password).not.toBe('pass123'); // deve ser hash
    expect(createCall.estado).toBe(true);
  });

  it('deve rejeitar email já registado', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 1 });

    await expect(
      register('João', 'joao@teste.pt', '911111111', 'pass123')
    ).rejects.toThrow('Email já registado');
    expect(mockPrisma.utilizador.create).not.toHaveBeenCalled();
  });

  it('deve usar role padrão UTILIZADOR quando não fornecida', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({ iduser: 2, nome: 'Ana', email: 'ana@teste.pt', role: '"UTILIZADOR"' });

    const result = await register('Ana', 'ana@teste.pt', '922222222', 'pass456');

    expect(mockPrisma.utilizador.create.mock.calls[0][0].data.role).toBe('utilizador');
  });

  it('deve aceitar role fornecida explicitamente', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);
    mockPrisma.utilizador.create.mockResolvedValue({ iduser: 3, nome: 'Dir', email: 'dir@teste.pt', role: '"DIRECAO"' });

    const result = await register('Dir', 'dir@teste.pt', '933333333', 'pass789', 'direcao');

    expect(mockPrisma.utilizador.create.mock.calls[0][0].data.role).toBe('direcao');
  });
});

describe('login', () => {
  it('deve autenticar com credenciais válidas', async () => {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, nome: 'João', email: 'joao@teste.pt', telemovel: '911111111',
      password: hashedPassword, estado: true, role: '"UTILIZADOR"', tokenVersion: 0,
    });
    mockPrisma.direcao.findUnique.mockResolvedValue(null);
    mockPrisma.professor.findUnique.mockResolvedValue(null);
    mockPrisma.encarregadoeducacao.findUnique.mockResolvedValue(null);
    mockPrisma.aluno.findUnique.mockResolvedValue(null);

    const result = await login('joao@teste.pt', 'pass123');

    expect(result.success).toBe(true);
    expect(result.user.nome).toBe('João');
    expect(result.token).toBeTruthy();
    expect(typeof result.token).toBe('string');
  });

  it('deve rejeitar email inexistente', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);

    await expect(login('naoexiste@teste.pt', 'pass123')).rejects.toThrow('Utilizador não encontrado');
  });

  it('deve rejeitar password incorreta', async () => {
    const hashedPassword = await bcrypt.hash('passCorreta', 10);
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, password: hashedPassword, estado: true,
    });

    await expect(login('user@teste.pt', 'passErrada')).rejects.toThrow('Password incorreta');
  });

  it('deve rejeitar utilizador inativo', async () => {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, password: hashedPassword, estado: false,
    });

    await expect(login('inativo@teste.pt', 'pass123')).rejects.toThrow('Utilizador inativo');
  });

  it('deve detetar múltiplas roles', async () => {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, nome: 'Multi', email: 'multi@teste.pt', telemovel: '911111111',
      password: hashedPassword, estado: true, role: '"UTILIZADOR"', tokenVersion: 0,
    });
    mockPrisma.direcao.findUnique.mockResolvedValue({ utilizadoriduser: 1 });
    mockPrisma.professor.findUnique.mockResolvedValue({ utilizadoriduser: 1 });
    mockPrisma.encarregadoeducacao.findUnique.mockResolvedValue(null);
    mockPrisma.aluno.findUnique.mockResolvedValue(null);

    const result = await login('multi@teste.pt', 'pass123');

    expect(Array.isArray(result.user.role)).toBe(true);
    expect(result.user.role).toContain('DIRECAO');
    expect(result.user.role).toContain('PROFESSOR');
  });

  it('deve gerar token JWT com dados corretos', async () => {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 42, nome: 'Token', email: 'token@teste.pt', telemovel: '911111111',
      password: hashedPassword, estado: true, role: '"DIRECAO"', tokenVersion: 1,
    });
    mockPrisma.direcao.findUnique.mockResolvedValue({ utilizadoriduser: 42 });
    mockPrisma.professor.findUnique.mockResolvedValue(null);
    mockPrisma.encarregadoeducacao.findUnique.mockResolvedValue(null);
    mockPrisma.aluno.findUnique.mockResolvedValue(null);

    const result = await login('token@teste.pt', 'pass123');
    const decoded = jwt.verify(result.token, 'test-secret-key');

    expect(decoded.id).toBe(42);
    expect(decoded.role).toBe('DIRECAO');
    expect(decoded.tokenVersion).toBe(1);
    expect(decoded.exp - decoded.iat).toBe(3600); // 1h
  });
});

describe('validateToken', () => {
  it('deve validar token JWT válido', async () => {
    const token = jwt.sign({ id: 1 }, 'test-secret-key');
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, nome: 'João', email: 'joao@teste.pt', estado: true, role: '"UTILIZADOR"',
    });
    mockPrisma.direcao.findUnique.mockResolvedValue(null);
    mockPrisma.professor.findUnique.mockResolvedValue(null);
    mockPrisma.encarregadoeducacao.findUnique.mockResolvedValue(null);
    mockPrisma.aluno.findUnique.mockResolvedValue(null);

    const result = await validateToken(token);

    expect(result).toMatchObject({ id: 1, nome: 'João' });
  });

  it('deve rejeitar token inválido/expirado', async () => {
    const token = jwt.sign({ id: 1 }, 'wrong-secret');

    await expect(validateToken(token)).rejects.toThrow('Token inválido');
  });

  it('deve rejeitar token de utilizador inativo', async () => {
    const token = jwt.sign({ id: 1 }, 'test-secret-key');
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, estado: false,
    });

    await expect(validateToken(token)).rejects.toThrow('Token inválido');
  });

  it('deve rejeitar token revogado (tokenVersion mismatch)', async () => {
    const token = jwt.sign({ id: 1, tokenVersion: 0 }, 'test-secret-key');
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, estado: true, tokenVersion: 1,
    });

    await expect(validateToken(token)).rejects.toThrow('Token inválido');
  });
});

describe('logout', () => {
  it('deve retornar sucesso', async () => {
    const result = await logout();
    expect(result.success).toBe(true);
    expect(result.message).toContain('sucesso');
  });
});

describe('forgotPassword', () => {
  it('deve retornar sucesso (mock - sempre sucesso)', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null); // não encontrado

    const result = await forgotPassword('qualquer@email.pt');

    expect(result.success).toBe(true);
    // Não deve revelar se o email existe ou não
  });
});

describe('resetPassword', () => {
  it('deve atualizar password com hash', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({ iduser: 1 });
    mockPrisma.utilizador.update.mockResolvedValue({ iduser: 1 });

    const result = await resetPassword('user@teste.pt', 'novaPass123');

    expect(result.success).toBe(true);
    const updateData = mockPrisma.utilizador.update.mock.calls[0][0].data;
    expect(updateData.password).not.toBe('novaPass123'); // deve ser hash
    expect(updateData.password).toContain('$2b$'); // bcrypt hash prefix
  });

  it('deve rejeitar utilizador inexistente', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);

    await expect(resetPassword('naoexiste@teste.pt', 'pass123')).rejects.toThrow('Utilizador não encontrado');
    expect(mockPrisma.utilizador.update).not.toHaveBeenCalled();
  });
});

describe('getProfile', () => {
  it('deve retornar perfil do utilizador', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue({
      iduser: 1, nome: 'João', email: 'joao@teste.pt', telemovel: '911111111',
      estado: true, role: 'DIRECAO',
    });

    const result = await getProfile(1);

    expect(result).toMatchObject({ id: 1, nome: 'João', role: 'DIRECAO' });
  });

  it('deve rejeitar utilizador inexistente', async () => {
    mockPrisma.utilizador.findUnique.mockResolvedValue(null);

    await expect(getProfile(999)).rejects.toThrow('Utilizador não encontrado');
  });
});

describe('updateProfile', () => {
  it('deve atualizar apenas campos fornecidos', async () => {
    mockPrisma.utilizador.update.mockResolvedValue({
      iduser: 1, nome: 'João Atualizado', email: 'joao@teste.pt', telemovel: '911111111',
      role: '"UTILIZADOR"',
    });

    const result = await updateProfile(1, { nome: 'João Atualizado' });

    expect(result.nome).toBe('João Atualizado');
    expect(mockPrisma.utilizador.update.mock.calls[0][0].data).not.toHaveProperty('email');
    expect(mockPrisma.utilizador.update.mock.calls[0][0].data).not.toHaveProperty('telemovel');
  });

  it('deve fazer hash da password se fornecida', async () => {
    mockPrisma.utilizador.update.mockResolvedValue({
      iduser: 1, nome: 'João', email: 'joao@teste.pt', telemovel: '911111111',
      role: '"UTILIZADOR"',
    });

    await updateProfile(1, { password: 'novaPass' });

    const updateData = mockPrisma.utilizador.update.mock.calls[0][0].data;
    expect(updateData.password).not.toBe('novaPass');
    expect(updateData.password).toContain('$2b$');
  });
});
