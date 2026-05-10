import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  figurino: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  estadouso: { findMany: vi.fn() },
  tamanho: { findMany: vi.fn() },
  cor: { findMany: vi.fn() },
  genero: { findMany: vi.fn() },
  modelofigurino: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  tipofigurino: { findMany: vi.fn() },
  itemfigurino: { create: vi.fn() },
  direcao: { findFirst: vi.fn() },
  encarregadoeducacao: { findUnique: vi.fn() },
  professor: { findUnique: vi.fn() },
  transacaofigurino: { findMany: vi.fn() },
  anuncio: { findMany: vi.fn() },
};

vi.mock('../../src/config/db.js', () => ({ default: mockPrisma }));

const {
  getAllFigurinos,
  consultarFigurino,
  createFigurino,
  updateFigurino,
  deleteFigurino,
  updateFigurinoStatus,
  getLookupData,
  createFigurinoStock,
  updateFigurinoStatusSimple,
  getStock,
  getFigurinoHistory,
  getFigurinosStockBaixo,
  getRelatorioFigurinos,
} = await import('../../src/services/figurinos.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAllFigurinos', () => {
  it('deve retornar lista de figurinos mapeados', async () => {
    const mockFigurinos = [
      {
        idfigurino: 1,
        quantidadetotal: 10,
        quantidadedisponivel: 5,
        estadousoidestado: 19,
        modelofigurinoidmodelo: 1,
        generoidgenero: 1,
        tamanhoidtamanho: 1,
        coridcor: 1,
        estadouso: { idestado: 19, estadouso: 'Disponível' },
        tamanho: { idtamanho: 1, nometamanho: 'M' },
        cor: { idcor: 1, nomecor: 'Vermelho' },
        genero: { idgenero: 1, nomegenero: 'Feminino' },
        modelofigurino: { idmodelo: 1, nomemodelo: 'Vestido Ballet', descricao: 'Vestido clássico', fotografia: 'img.jpg', tipofigurinoidtipofigurino: 1, tipofigurino: { idtipofigurino: 1, tipofigurino: 'Ballet' } },
        itemfigurino: { iditem: 1, localizacao: 'Armário 1' },
      },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getAllFigurinos();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].nome).toBe('Vestido Ballet');
    expect(result[0].status).toBe('DISPONIVEL');
    expect(mockPrisma.figurino.findMany).toHaveBeenCalledWith({
      include: expect.objectContaining({ estadouso: true, tamanho: true }),
    });
  });

  it('deve retornar array vazio quando não há figurinos', async () => {
    mockPrisma.figurino.findMany.mockResolvedValue([]);

    const result = await getAllFigurinos();

    expect(result).toEqual([]);
  });
});

describe('consultarFigurino', () => {
  it('deve retornar figurino pelo ID', async () => {
    const mockFigurino = {
      idfigurino: 1,
      quantidadetotal: 10,
      quantidadedisponivel: 5,
      estadousoidestado: 19,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { idtamanho: 1, nometamanho: 'M' },
      cor: { idcor: 1, nomecor: 'Vermelho' },
      genero: { idgenero: 1, nomegenero: 'Feminino' },
      modelofigurino: { idmodelo: 1, nomemodelo: 'Vestido', tipofigurino: { idtipofigurino: 1, tipofigurino: 'Ballet' } },
    };
    mockPrisma.figurino.findUnique.mockResolvedValue(mockFigurino);

    const result = await consultarFigurino(1);

    expect(result).toEqual(mockFigurino);
    expect(mockPrisma.figurino.findUnique).toHaveBeenCalledWith({
      where: { idfigurino: 1 },
      include: expect.any(Object),
    });
  });

  it('deve retornar null quando figurino não existe', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue(null);

    const result = await consultarFigurino(999);

    expect(result).toBeNull();
  });
});

describe('createFigurino', () => {
  it('deve criar figurino com dados válidos', async () => {
    const inputData = {
      quantidadedisponivel: '5',
      quantidadetotal: '10',
      modelofigurinoidmodelo: '1',
      generoidgenero: '2',
      tamanhoidtamanho: '3',
      coridcor: '4',
      estadousoidestado: '19',
      direcaoutilizadoriduser: '1',
    };
    const mockCreated = {
      idfigurino: 1,
      quantidadedisponivel: 5,
      quantidadetotal: 10,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { idtamanho: 3, nometamanho: 'M' },
      cor: { idcor: 4, nomecor: 'Vermelho' },
      genero: { idgenero: 2, nomegenero: 'Feminino' },
    };
    mockPrisma.figurino.create.mockResolvedValue(mockCreated);

    const result = await createFigurino(inputData);

    expect(result).toEqual(mockCreated);
    expect(mockPrisma.figurino.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantidadedisponivel: 5,
        quantidadetotal: 10,
        modelofigurinoidmodelo: 1,
        generoidgenero: 2,
        tamanhoidtamanho: 3,
        coridcor: 4,
        estadousoidestado: 19,
        direcaoutilizadoriduser: 1,
      }),
      include: expect.any(Object),
    });
  });

  it('deve converter strings para inteiros', async () => {
    const inputData = {
      quantidadedisponivel: '5',
      quantidadetotal: '10',
      modelofigurinoidmodelo: '1',
      generoidgenero: '2',
      tamanhoidtamanho: '3',
      coridcor: '4',
      estadousoidestado: '19',
    };
    mockPrisma.figurino.create.mockResolvedValue({ idfigurino: 1 });

    await createFigurino(inputData);

    const createCall = mockPrisma.figurino.create.mock.calls[0][0].data;
    expect(typeof createCall.quantidadedisponivel).toBe('number');
    expect(typeof createCall.modelofigurinoidmodelo).toBe('number');
  });

  it('deve definir direcaoutilizadoriduser como null quando não fornecido', async () => {
    const inputData = {
      quantidadedisponivel: '5',
      quantidadetotal: '10',
      modelofigurinoidmodelo: '1',
      generoidgenero: '2',
      tamanhoidtamanho: '3',
      coridcor: '4',
      estadousoidestado: '19',
    };
    mockPrisma.figurino.create.mockResolvedValue({ idfigurino: 1 });

    await createFigurino(inputData);

    const createCall = mockPrisma.figurino.create.mock.calls[0][0].data;
    expect(createCall.direcaoutilizadoriduser).toBeNull();
  });
});

describe('updateFigurino', () => {
  it('deve atualizar figurino existente', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue({ idfigurino: 1 });
    mockPrisma.figurino.update.mockResolvedValue({ idfigurino: 1, quantidadedisponivel: 8 });

    const result = await updateFigurino(1, { quantidadedisponivel: '8' });

    expect(result).toEqual({ idfigurino: 1, quantidadedisponivel: 8 });
    expect(mockPrisma.figurino.update).toHaveBeenCalledWith({
      where: { idfigurino: 1 },
      data: { quantidadedisponivel: 8 },
      include: expect.any(Object),
    });
  });

  it('deve lançar erro quando figurino não existe', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue(null);

    await expect(updateFigurino(999, { quantidadedisponivel: '5' })).rejects.toThrow('Figurino não encontrado');
  });

  it('deve atualizar apenas campos fornecidos', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue({ idfigurino: 1 });
    mockPrisma.figurino.update.mockResolvedValue({ idfigurino: 1, quantidadedisponivel: 3 });

    await updateFigurino(1, { quantidadedisponivel: '3' });

    const updateCall = mockPrisma.figurino.update.mock.calls[0][0].data;
    expect(updateCall).toHaveProperty('quantidadedisponivel');
    expect(updateCall).not.toHaveProperty('quantidadetotal');
    expect(updateCall).not.toHaveProperty('modelofigurinoidmodelo');
  });

  it('deve converter strings para inteiros nos campos fornecidos', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue({ idfigurino: 1 });
    mockPrisma.figurino.update.mockResolvedValue({ idfigurino: 1 });

    await updateFigurino(1, { quantidadedisponivel: '10', quantidadetotal: '20' });

    const updateCall = mockPrisma.figurino.update.mock.calls[0][0].data;
    expect(updateCall.quantidadedisponivel).toBe(10);
    expect(updateCall.quantidadetotal).toBe(20);
  });
});

describe('deleteFigurino', () => {
  it('deve eliminar figurino pelo ID', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue({ idfigurino: 1 });
    mockPrisma.figurino.delete.mockResolvedValue({ idfigurino: 1 });

    const result = await deleteFigurino(1);

    expect(result).toEqual({ message: 'Figurino eliminado com sucesso' });
    expect(mockPrisma.figurino.delete).toHaveBeenCalledWith({ where: { idfigurino: 1 } });
  });

  it('deve lançar erro quando figurino não existe', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue(null);

    await expect(deleteFigurino(999)).rejects.toThrow('Figurino não encontrado');
    expect(mockPrisma.figurino.delete).not.toHaveBeenCalled();
  });
});

describe('updateFigurinoStatus', () => {
  it('deve atualizar estado de DISPONIVEL para ALUGADO', async () => {
    const mockFigurino = {
      idfigurino: 1,
      estadousoidestado: 1,
      estadouso: { idestado: 1, estadouso: 'Disponível' },
    };
    mockPrisma.figurino.findUnique.mockResolvedValue(mockFigurino);
    mockPrisma.figurino.update.mockResolvedValue({
      ...mockFigurino,
      estadousoidestado: 2,
      estadouso: { idestado: 2, estadouso: 'Alugado' },
    });

    const result = await updateFigurinoStatus(1, 2);

    expect(result.estadousoidestado).toBe(2);
    expect(mockPrisma.figurino.update).toHaveBeenCalledWith({
      where: { idfigurino: 1 },
      data: { estadousoidestado: 2 },
      include: expect.any(Object),
    });
  });

  it('deve atualizar estado de ALUGADO para VENDIDO', async () => {
    const mockFigurino = {
      idfigurino: 1,
      estadousoidestado: 2,
      estadouso: { idestado: 2, estadouso: 'Alugado' },
    };
    mockPrisma.figurino.findUnique.mockResolvedValue(mockFigurino);
    mockPrisma.figurino.update.mockResolvedValue({
      ...mockFigurino,
      estadousoidestado: 3,
      estadouso: { idestado: 3, estadouso: 'Vendido' },
    });

    const result = await updateFigurinoStatus(1, 3);

    expect(result.estadousoidestado).toBe(3);
  });

  it('deve lançar erro quando figurino não existe', async () => {
    mockPrisma.figurino.findUnique.mockResolvedValue(null);

    await expect(updateFigurinoStatus(999, 2)).rejects.toThrow('Figurino não encontrado');
  });

  it('deve lançar erro para transição não permitida', async () => {
    const mockFigurino = {
      idfigurino: 1,
      estadousoidestado: 1,
      estadouso: { idestado: 1, estadouso: 'Disponível' },
    };
    mockPrisma.figurino.findUnique.mockResolvedValue(mockFigurino);

    await expect(updateFigurinoStatus(1, 3)).rejects.toThrow('Transição de estado não permitida');
  });

  it('deve converter novo estado para inteiro', async () => {
    const mockFigurino = {
      idfigurino: 1,
      estadousoidestado: 1,
      estadouso: { idestado: 1, estadouso: 'Disponível' },
    };
    mockPrisma.figurino.findUnique.mockResolvedValue(mockFigurino);
    mockPrisma.figurino.update.mockResolvedValue({ ...mockFigurino, estadousoidestado: 2 });

    await updateFigurinoStatus(1, '2');

    const updateCall = mockPrisma.figurino.update.mock.calls[0][0].data;
    expect(updateCall.estadousoidestado).toBe(2);
  });
});

describe('getLookupData', () => {
  it('deve retornar todos os dados de lookup', async () => {
    mockPrisma.tamanho.findMany.mockResolvedValue([{ idtamanho: 1, nometamanho: 'P' }]);
    mockPrisma.genero.findMany.mockResolvedValue([{ idgenero: 1, nomegenero: 'Masculino' }]);
    mockPrisma.cor.findMany.mockResolvedValue([{ idcor: 1, nomecor: 'Azul' }]);
    mockPrisma.modelofigurino.findMany.mockResolvedValue([{ idmodelo: 1, nomemodelo: 'Modelo 1', tipofigurino: { idtipofigurino: 1, tipofigurino: 'Ballet' } }]);
    mockPrisma.tipofigurino.findMany.mockResolvedValue([{ idtipofigurino: 1, tipofigurino: 'Ballet' }]);
    mockPrisma.estadouso.findMany.mockResolvedValue([{ idestado: 19, estadouso: 'Disponível' }]);

    const result = await getLookupData();

    expect(result).toHaveProperty('tamanhos');
    expect(result).toHaveProperty('generos');
    expect(result).toHaveProperty('cores');
    expect(result).toHaveProperty('modelos');
    expect(result).toHaveProperty('tipos');
    expect(result).toHaveProperty('estadosUso');
    expect(result.tamanhos).toHaveLength(1);
    expect(result.generos).toHaveLength(1);
  });

  it('deve executar queries em paralelo', async () => {
    mockPrisma.tamanho.findMany.mockResolvedValue([]);
    mockPrisma.genero.findMany.mockResolvedValue([]);
    mockPrisma.cor.findMany.mockResolvedValue([]);
    mockPrisma.modelofigurino.findMany.mockResolvedValue([]);
    mockPrisma.tipofigurino.findMany.mockResolvedValue([]);
    mockPrisma.estadouso.findMany.mockResolvedValue([]);

    await getLookupData();

    expect(mockPrisma.tamanho.findMany).toHaveBeenCalled();
    expect(mockPrisma.genero.findMany).toHaveBeenCalled();
    expect(mockPrisma.cor.findMany).toHaveBeenCalled();
  });
});

describe('createFigurinoStock', () => {
  it('deve criar figurino com stock para DIRECAO', async () => {
    const inputData = {
      nome: 'Novo Figurino',
      descricao: 'Descrição teste',
      tipofigurinoid: '1',
      tamanhoid: '2',
      generoid: '1',
      corid: '3',
      estadousoid: '19',
      quantidadetotal: '5',
      quantidadedisponivel: '5',
    };
    mockPrisma.direcao.findFirst.mockResolvedValue({ utilizadoriduser: 1 });
    mockPrisma.modelofigurino.create.mockResolvedValue({ idmodelo: 1 });
    mockPrisma.itemfigurino.create.mockResolvedValue({ iditem: 1 });
    mockPrisma.figurino.create.mockResolvedValue({
      idfigurino: 1,
      quantidadetotal: 5,
      quantidadedisponivel: 5,
      estadousoidestado: 19,
      modelofigurinoidmodelo: 1,
      generoidgenero: 1,
      tamanhoidtamanho: 2,
      coridcor: 3,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { idtamanho: 2, nometamanho: 'M' },
      cor: { idcor: 3, nomecor: 'Azul' },
      genero: { idgenero: 1, nomegenero: 'Feminino' },
      modelofigurino: { idmodelo: 1, nomemodelo: 'Novo Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { iditem: 1, localizacao: '' },
    });

    const result = await createFigurinoStock(inputData, 1, 'DIRECAO');

    expect(result).toHaveProperty('id');
    expect(mockPrisma.modelofigurino.create).toHaveBeenCalled();
    expect(mockPrisma.itemfigurino.create).toHaveBeenCalled();
    expect(mockPrisma.figurino.create).toHaveBeenCalled();
  });

  it('deve criar figurino com stock para ENCARREGADO', async () => {
    const inputData = {
      nome: 'Figurino EE',
      tipofigurinoid: '1',
      tamanhoid: '2',
      generoid: '1',
      corid: '3',
      encarregadoeducacaoutilizadoriduser: '5',
    };
    mockPrisma.direcao.findFirst.mockResolvedValue(null);
    mockPrisma.modelofigurino.create.mockResolvedValue({ idmodelo: 1 });
    mockPrisma.itemfigurino.create.mockResolvedValue({ iditem: 1 });
    mockPrisma.figurino.create.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 19,
      modelofigurinoidmodelo: 1,
      encarregadoeducacaoutilizadoriduser: 5,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino EE', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    const result = await createFigurinoStock(inputData, 5, 'ENCARREGADO');

    expect(result).toHaveProperty('id');
    const figurinoCall = mockPrisma.figurino.create.mock.calls[0][0].data;
    expect(figurinoCall).toHaveProperty('encarregadoeducacaoutilizadoriduser', 5);
  });

  it('deve criar figurino com stock para PROFESSOR', async () => {
    const inputData = {
      nome: 'Figurino Prof',
      tipofigurinoid: '1',
      tamanhoid: '2',
      generoid: '1',
      corid: '3',
      professorutilizadoriduser: '7',
    };
    mockPrisma.direcao.findFirst.mockResolvedValue(null);
    mockPrisma.modelofigurino.create.mockResolvedValue({ idmodelo: 1 });
    mockPrisma.itemfigurino.create.mockResolvedValue({ iditem: 1 });
    mockPrisma.figurino.create.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 19,
      modelofigurinoidmodelo: 1,
      professorutilizadoriduser: 7,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino Prof', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    const result = await createFigurinoStock(inputData, 7, 'PROFESSOR');

    expect(result).toHaveProperty('id');
    const figurinoCall = mockPrisma.figurino.create.mock.calls[0][0].data;
    expect(figurinoCall).toHaveProperty('professorutilizadoriduser', 7);
  });

  it('deve usar estado padrão 19 quando não fornecido', async () => {
    const inputData = {
      nome: 'Figurino',
      tipofigurinoid: '1',
      tamanhoid: '2',
      generoid: '1',
      corid: '3',
    };
    mockPrisma.direcao.findFirst.mockResolvedValue(null);
    mockPrisma.modelofigurino.create.mockResolvedValue({ idmodelo: 1 });
    mockPrisma.itemfigurino.create.mockResolvedValue({ iditem: 1 });
    mockPrisma.figurino.create.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 19,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    await createFigurinoStock(inputData, 1, 'DIRECAO');

    const figurinoCall = mockPrisma.figurino.create.mock.calls[0][0].data;
    expect(figurinoCall.estadousoidestado).toBe(19);
  });

  it('deve usar valores padrão para quantidade', async () => {
    const inputData = {
      nome: 'Figurino',
      tipofigurinoid: '1',
      tamanhoid: '2',
      generoid: '1',
      corid: '3',
    };
    mockPrisma.direcao.findFirst.mockResolvedValue(null);
    mockPrisma.modelofigurino.create.mockResolvedValue({ idmodelo: 1 });
    mockPrisma.itemfigurino.create.mockResolvedValue({ iditem: 1 });
    mockPrisma.figurino.create.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 19,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    await createFigurinoStock(inputData, 1, 'DIRECAO');

    const figurinoCall = mockPrisma.figurino.create.mock.calls[0][0].data;
    expect(figurinoCall.quantidadetotal).toBe(1);
    expect(figurinoCall.quantidadedisponivel).toBe(1);
  });
});

describe('updateFigurinoStatusSimple', () => {
  it('deve atualizar status para DISPONIVEL', async () => {
    mockPrisma.figurino.update.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 19,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    const result = await updateFigurinoStatusSimple(1, 'DISPONIVEL');

    expect(result.status).toBe('DISPONIVEL');
    expect(mockPrisma.figurino.update).toHaveBeenCalledWith({
      where: { idfigurino: 1 },
      data: { estadousoidestado: 19 },
      include: expect.any(Object),
    });
  });

  it('deve atualizar status para ALUGADO', async () => {
    mockPrisma.figurino.update.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 21,
      estadouso: { idestado: 21, estadouso: 'Alugado' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    const result = await updateFigurinoStatusSimple(1, 'ALUGADO');

    expect(result.status).toBe('ALUGADO');
  });

  it('deve atualizar status para VENDIDO', async () => {
    mockPrisma.figurino.update.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 17,
      estadouso: { idestado: 17, estadouso: 'Vendido' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    const result = await updateFigurinoStatusSimple(1, 'VENDIDO');

    expect(result.status).toBe('DISPONIVEL');
  });

  it('deve lançar erro para status inválido', async () => {
    await expect(updateFigurinoStatusSimple(1, 'INVALIDO')).rejects.toThrow('Status inválido');
  });

  it('deve converter ID para inteiro', async () => {
    mockPrisma.figurino.update.mockResolvedValue({
      idfigurino: 1,
      estadousoidestado: 19,
      estadouso: { idestado: 19, estadouso: 'Disponível' },
      tamanho: { nometamanho: 'M' },
      cor: { nomecor: 'Azul' },
      genero: { nomegenero: 'Feminino' },
      modelofigurino: { nomemodelo: 'Figurino', tipofigurinoidtipofigurino: 1 },
      itemfigurino: { localizacao: '' },
    });

    await updateFigurinoStatusSimple('1', 'DISPONIVEL');

    expect(mockPrisma.figurino.update).toHaveBeenCalledWith({
      where: { idfigurino: 1 },
      data: { estadousoidestado: 19 },
      include: expect.any(Object),
    });
  });
});

describe('getStock', () => {
  it('deve retornar lista de stock de figurinos', async () => {
    const mockFigurinos = [
      {
        idfigurino: 1,
        quantidadetotal: 10,
        quantidadedisponivel: 5,
        modelofigurino: { nomemodelo: 'Vestido', descricao: 'Desc', fotografia: 'img.jpg' },
        genero: { nomegenero: 'Feminino' },
        tamanho: { nometamanho: 'M' },
        cor: { nomecor: 'Vermelho' },
        estadouso: { estadouso: 'Disponível' },
        itemfigurino: { localizacao: 'Armário 1' },
      },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getStock();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      modelo: 'Vestido',
      descricao: 'Desc',
      fotografia: 'img.jpg',
      genero: 'Feminino',
      tamanho: 'M',
      cor: 'Vermelho',
      estado: 'Disponível',
      quantidadeTotal: 10,
      quantidadeDisponivel: 5,
      localizacao: 'Armário 1',
    });
  });

  it('deve retornar array vazio quando não há stock', async () => {
    mockPrisma.figurino.findMany.mockResolvedValue([]);

    const result = await getStock();

    expect(result).toEqual([]);
  });
});

describe('getFigurinoHistory', () => {
  it('deve retornar histórico de transações', async () => {
    const mockTransactions = [
      {
        idtransacao: 1,
        datatransacao: new Date('2024-01-15'),
        quantidade: 2,
        motivorejeicao: '',
        itemfigurino: { localizacao: 'Armário 1' },
        estado: { tipoestado: 'Aprovado' },
        encarregadoeducacao: { utilizador: { nome: 'João' } },
        professor: null,
        direcao: null,
      },
    ];
    mockPrisma.transacaofigurino.findMany.mockResolvedValue(mockTransactions);

    const result = await getFigurinoHistory(1);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      data: '2024-01-15T00:00:00.000Z',
      quantidade: 2,
      estado: 'Aprovado',
      motivoRejeicao: '',
      item: 'Armário 1',
      requester: 'João',
    });
  });

  it('deve retornar requester do professor quando disponível', async () => {
    const mockTransactions = [
      {
        idtransacao: 1,
        datatransacao: new Date(),
        quantidade: 1,
        motivorejeicao: '',
        itemfigurino: { localizacao: '' },
        estado: { tipoestado: 'Pendente' },
        encarregadoeducacao: null,
        professor: { utilizador: { nome: 'Prof Maria' } },
        direcao: null,
      },
    ];
    mockPrisma.transacaofigurino.findMany.mockResolvedValue(mockTransactions);

    const result = await getFigurinoHistory(1);

    expect(result[0].requester).toBe('Prof Maria');
  });

  it('deve retornar requester da direção quando disponível', async () => {
    const mockTransactions = [
      {
        idtransacao: 1,
        datatransacao: new Date(),
        quantidade: 1,
        motivorejeicao: '',
        itemfigurino: { localizacao: '' },
        estado: { tipoestado: 'Pendente' },
        encarregadoeducacao: null,
        professor: null,
        direcao: { utilizador: { nome: 'Diretor' } },
      },
    ];
    mockPrisma.transacaofigurino.findMany.mockResolvedValue(mockTransactions);

    const result = await getFigurinoHistory(1);

    expect(result[0].requester).toBe('Diretor');
  });

  it('deve retornar Desconhecido quando sem requester', async () => {
    const mockTransactions = [
      {
        idtransacao: 1,
        datatransacao: new Date(),
        quantidade: 1,
        motivorejeicao: '',
        itemfigurino: { localizacao: '' },
        estado: { tipoestado: 'Pendente' },
        encarregadoeducacao: null,
        professor: null,
        direcao: null,
      },
    ];
    mockPrisma.transacaofigurino.findMany.mockResolvedValue(mockTransactions);

    const result = await getFigurinoHistory(1);

    expect(result[0].requester).toBe('Desconhecido');
  });
});

describe('getFigurinosStockBaixo', () => {
  it('deve retornar figurinos com stock baixo', async () => {
    const mockFigurinos = [
      { idfigurino: 1, quantidadetotal: 5, quantidadedisponivel: 2, stockminimo: 3 },
      { idfigurino: 2, quantidadetotal: 10, quantidadedisponivel: 8, stockminimo: 5 },
      { idfigurino: 3, quantidadetotal: 8, quantidadedisponivel: 1, stockminimo: 2 },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getFigurinosStockBaixo();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it('deve retornar array vazio quando stock está adequado', async () => {
    const mockFigurinos = [
      { idfigurino: 1, quantidadetotal: 10, quantidadedisponivel: 8, stockminimo: 5 },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getFigurinosStockBaixo();

    expect(result).toEqual([]);
  });

  it('deve ignorar figurinos sem stockminimo definido', async () => {
    const mockFigurinos = [
      { idfigurino: 1, quantidadetotal: 5, quantidadedisponivel: 2, stockminimo: null },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getFigurinosStockBaixo();

    expect(result).toEqual([]);
  });
});

describe('getRelatorioFigurinos', () => {
  it('deve retornar relatório de figurinos', async () => {
    const mockFigurinos = [
      {
        idfigurino: 1,
        quantidadetotal: 10,
        quantidadedisponivel: 3,
        stockminimo: 5,
        modelofigurino: { nomemodelo: 'Vestido' },
        tamanho: { nometamanho: 'M' },
      },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getRelatorioFigurinos();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      modelo: 'Vestido',
      tamanho: 'M',
      total: 10,
      disponivel: 3,
      stockMinimo: 5,
      estado: 'BAIXO',
    });
  });

  it('deve usar stockminimo padrão de 5 quando não definido', async () => {
    const mockFigurinos = [
      {
        idfigurino: 1,
        quantidadetotal: 10,
        quantidadedisponivel: 8,
        stockminimo: null,
        modelofigurino: { nomemodelo: 'Vestido' },
        tamanho: { nometamanho: 'M' },
      },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getRelatorioFigurinos();

    expect(result[0].stockMinimo).toBe(5);
    expect(result[0].estado).toBe('NORMAL');
  });

  it('deve marcar como BAIXO quando disponivel <= stockminimo', async () => {
    const mockFigurinos = [
      {
        idfigurino: 1,
        quantidadetotal: 10,
        quantidadedisponivel: 5,
        stockminimo: 5,
        modelofigurino: { nomemodelo: 'Vestido' },
        tamanho: { nometamanho: 'M' },
      },
    ];
    mockPrisma.figurino.findMany.mockResolvedValue(mockFigurinos);

    const result = await getRelatorioFigurinos();

    expect(result[0].estado).toBe('BAIXO');
  });
});