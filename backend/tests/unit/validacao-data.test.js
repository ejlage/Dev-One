import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
};

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => mockPrisma);
  return { PrismaClient };
});

vi.mock('../../src/services/audit.service.js', () => ({
  createAuditLog: vi.fn(),
}));

const { submeterPedidoAula } = await import('../../src/services/encarregado.service.js');

beforeEach(() => {
  vi.clearAllMocks();
  // Estado PENDENTE lookup always succeeds by default
  mockPrisma.$queryRaw.mockResolvedValue([{ idestado: 1 }]);
});

const dadosBase = () => ({
  data: '2026-06-15',
  horainicio: '10:00',
  duracaoaula: '60',
  salaidsala: '1',
});

// ---------------------------------------------------------------------------
// Data no passado
// ---------------------------------------------------------------------------
describe('Validação: data não pode ser no passado', () => {
  it('deve rejeitar data anterior a hoje', async () => {
    await expect(
      submeterPedidoAula({ ...dadosBase(), data: '2025-01-01' }, 7)
    ).rejects.toThrow('A data não pode ser no passado');
  });

  it('deve aceitar data de hoje', async () => {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    const horaFutura = `${hoje.getHours() + 2}`.padStart(2, '0') + ':00';

    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 0 }]);

    await submeterPedidoAula({
      ...dadosBase(),
      data: dataStr,
      horainicio: horaFutura,
    }, 7);

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('deve aceitar data futura', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 0 }]);

    await submeterPedidoAula({
      ...dadosBase(),
      data: '2026-07-01',
    }, 7);

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Hora no passado (quando data = hoje)
// ---------------------------------------------------------------------------
describe('Validação: hora deve ser posterior à atual (quando data = hoje)', () => {
  it('deve rejeitar hora anterior à atual quando data = hoje', async () => {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    const horaPassada = `${hoje.getHours() - 2}`.padStart(2, '0') + ':00';

    await expect(
      submeterPedidoAula({
        ...dadosBase(),
        data: dataStr,
        horainicio: horaPassada,
      }, 7)
    ).rejects.toThrow('A hora de início deve ser posterior à hora atual');
  });

  it('deve aceitar hora futura quando data = hoje', async () => {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    const horaFutura = `${hoje.getHours() + 2}`.padStart(2, '0') + ':00';

    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 0 }]);

    await submeterPedidoAula({
      ...dadosBase(),
      data: dataStr,
      horainicio: horaFutura,
    }, 7);

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('deve aceitar qualquer hora quando data > hoje', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 0 }]);

    await submeterPedidoAula({
      ...dadosBase(),
      data: '2026-07-01',
      horainicio: '08:00',
    }, 7);

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('deve rejeitar hora exatamente igual à atual (data = hoje)', async () => {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    const horaExata = `${hoje.getHours()}`.padStart(2, '0') + ':' + `${hoje.getMinutes()}`.padStart(2, '0');

    await expect(
      submeterPedidoAula({
        ...dadosBase(),
        data: dataStr,
        horainicio: horaExata,
      }, 7)
    ).rejects.toThrow('A hora de início deve ser posterior à hora atual');
  });
});

// ---------------------------------------------------------------------------
// Conflito de horário (slot já reservado)
// ---------------------------------------------------------------------------
describe('Validação: conflito de horário', () => {
  it('deve rejeitar quando slot já tem pedido pendente/confirmado no mesmo horário', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ total: 1 }]); // conflito encontrado

    await expect(
      submeterPedidoAula({
        ...dadosBase(),
        data: '2026-06-15',
        disponibilidade_mensal_id: '5',
      }, 7)
    ).rejects.toThrow('Este horário já está reservado');
  });

  it('deve aceitar quando não há conflito no slot', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ total: 0 }])  // sem conflito slot
      .mockResolvedValueOnce([{ total: 0 }])  // sem conflito sala
      .mockResolvedValueOnce([{                // INSERT ok
        idpedidoaula: 1, data: new Date(), horainicio: new Date(), duracaoaula: new Date(), privacidade: false,
      }])
      .mockResolvedValueOnce(undefined);       // UPDATE minutos_ocupados

    const result = await submeterPedidoAula({
      ...dadosBase(),
      data: '2026-06-15',
      disponibilidade_mensal_id: '5',
    }, 7);

    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Conflito de sala
// ---------------------------------------------------------------------------
describe('Validação: conflito de sala', () => {
  it('deve rejeitar quando sala já reservada no mesmo horário', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ total: 1 }]);

    await expect(
      submeterPedidoAula(dadosBase(), 7)
    ).rejects.toThrow('Esta sala já está reservada');
  });
});

// ---------------------------------------------------------------------------
// Estado PENDENTE não configurado
// ---------------------------------------------------------------------------
describe('Validação: estado PENDENTE', () => {
  it('deve rejeitar quando estado PENDENTE não existe na BD', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await expect(
      submeterPedidoAula(dadosBase(), 7)
    ).rejects.toThrow('Estado PENDENTE não encontrado');
  });
});
