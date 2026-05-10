import prisma from "../config/db.js";
import { createAuditLog } from "./audit.service.js";

/**
 * Obtém todos os figurinos.
 * 
 * @returns {Promise<any>} {Promise<object[]>}
 */

  const figurinos = await prisma.figurino.findMany({
    include: {
      estadouso: true, tamanho: true, cor: true, genero: true,
      modelofigurino: { include: { tipofigurino: true } },
      itemfigurino: true,
    }
  });
  return figurinos.map(mapFigurino);
};

export const consultarFigurino = async (id) => {
  const figurino = await prisma.figurino.findUnique({
    where: { idfigurino: id },
    include: {
      estadouso: true,
      tamanho: true,
      cor: true,
      genero: true,
      modelofigurino: {
        include: {
          tipofigurino: true
        }
      }
    }
  });
  return figurino;
};

/**
 * Cria figurino.
 * @param {object} data @param {number} userId
 * @returns {Promise<any>} {Promise<object>}
 */

  const {
    quantidadedisponivel,
    quantidadetotal,
    modelofigurinoidmodelo,
    generoidgenero,
    tamanhoidtamanho,
    coridcor,
    estadousoidestado,
    direcaoutilizadoriduser
  } = data;

  const figurino = await prisma.figurino.create({
    data: {
      quantidadedisponivel: parseInt(quantidadedisponivel),
      quantidadetotal: parseInt(quantidadetotal),
      modelofigurinoidmodelo: parseInt(modelofigurinoidmodelo),
      generoidgenero: parseInt(generoidgenero),
      tamanhoidtamanho: parseInt(tamanhoidtamanho),
      coridcor: parseInt(coridcor),
      estadousoidestado: parseInt(estadousoidestado),
      direcaoutilizadoriduser: direcaoutilizadoriduser ? parseInt(direcaoutilizadoriduser) : null
    },
    include: {
      estadouso: true,
      tamanho: true,
      cor: true,
      genero: true
    }
  });

  return figurino;
};

/**
 * Atualiza figurino.
 * @param {string|number} id @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

  const existingFigurino = await prisma.figurino.findUnique({
    where: { idfigurino: id }
  });

  if (!existingFigurino) {
    throw new Error("Figurino não encontrado");
  }

  const updateData = {};
  if (data.quantidadedisponivel !== undefined) updateData.quantidadedisponivel = parseInt(data.quantidadedisponivel);
  if (data.quantidadetotal !== undefined) updateData.quantidadetotal = parseInt(data.quantidadetotal);
  if (data.modelofigurinoidmodelo !== undefined) updateData.modelofigurinoidmodelo = parseInt(data.modelofigurinoidmodelo);
  if (data.generoidgenero !== undefined) updateData.generoidgenero = parseInt(data.generoidgenero);
  if (data.tamanhoidtamanho !== undefined) updateData.tamanhoidtamanho = parseInt(data.tamanhoidtamanho);
  if (data.coridcor !== undefined) updateData.coridcor = parseInt(data.coridcor);
  if (data.estadousoidestado !== undefined) updateData.estadousoidestado = parseInt(data.estadousoidestado);

  const figurino = await prisma.figurino.update({
    where: { idfigurino: id },
    data: updateData,
    include: {
      estadouso: true,
      tamanho: true,
      cor: true,
      genero: true
    }
  });

  return figurino;
};

/**
 * Elimina figurino.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<void>}
 */

  const existingFigurino = await prisma.figurino.findUnique({
    where: { idfigurino: id }
  });

  if (!existingFigurino) {
    throw new Error("Figurino não encontrado");
  }

  await prisma.figurino.delete({
    where: { idfigurino: id }
  });

  return { message: "Figurino eliminado com sucesso" };
};

const STATUS_TRANSITIONS = {
  1: [2],
  2: [3, 1],
  3: [1]
};

export const updateFigurinoStatus = async (id, novoEstadoId) => {
  const figurino = await prisma.figurino.findUnique({
    where: { idfigurino: id },
    include: { estadouso: true }
  });

  if (!figurino) {
    throw new Error("Figurino não encontrado");
  }

  const currentStatus = figurino.estadousoidestado;
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(parseInt(novoEstadoId))) {
    throw new Error(`Transição de estado não permitida: ${figurino.estadouso.estadouso} → ${novoEstadoId}`);
  }

  const updatedFigurino = await prisma.figurino.update({
    where: { idfigurino: id },
    data: { estadousoidestado: parseInt(novoEstadoId) },
    include: {
      estadouso: true,
      tamanho: true,
      cor: true,
      genero: true
    }
  });

  return updatedFigurino;
};

// Status string → estadouso ID
const STATUS_MAP = { DISPONIVEL: 19, ALUGADO: 21, VENDIDO: 17 };
const ESTADO_TO_STATUS = { 16: 'DISPONIVEL', 17: 'DISPONIVEL', 18: 'DISPONIVEL', 19: 'DISPONIVEL', 20: 'ALUGADO', 21: 'ALUGADO', 22: 'ALUGADO' };

export const createFigurinoStock = async (data, callerUserId, callerRole, auditUserId = null, auditUserNome = '') => {
  const {
    nome, descricao, fotografia, tipofigurinoid,
    tamanhoid, generoid, corid, estadousoid, localizacao,
    quantidadetotal = 1, quantidadedisponivel = 1,
    encarregadoeducacaoutilizadoriduser, professorutilizadoriduser,
  } = data;
  const estadoUsoId = estadousoid ? parseInt(estadousoid) : 19;

  let direcaoFkId = null;
  let encFkId = encarregadoeducacaoutilizadoriduser ? parseInt(encarregadoeducacaoutilizadoriduser) : null;
  let profFkId = professorutilizadoriduser ? parseInt(professorutilizadoriduser) : null;

  if (callerRole === 'DIRECAO' && callerUserId) {
    const direcaoRecord = await prisma.direcao.findFirst({
      where: { utilizadoriduser: parseInt(callerUserId) },
    });
    if (direcaoRecord) direcaoFkId = direcaoRecord.utilizadoriduser;
  }

  const modelo = await prisma.modelofigurino.create({
    data: {
      nomemodelo: nome,
      descricao: descricao || '',
      fotografia: fotografia || '',
      tipofigurinoidtipofigurino: parseInt(tipofigurinoid),
    }
  });

  const item = await prisma.itemfigurino.create({
    data: { localizacao: localizacao || '' }
  });

  const figurino = await prisma.figurino.create({
    data: {
      quantidadetotal: parseInt(quantidadetotal),
      quantidadedisponivel: parseInt(quantidadedisponivel),
      modelofigurinoidmodelo: modelo.idmodelo,
      generoidgenero: parseInt(generoid),
      tamanhoidtamanho: parseInt(tamanhoid),
      coridcor: parseInt(corid),
      estadousoidestado: estadoUsoId,
      itemfigurinoiditem: item.iditem,
      ...(direcaoFkId && { direcaoutilizadoriduser: direcaoFkId }),
      ...(encFkId && { encarregadoeducacaoutilizadoriduser: encFkId }),
      ...(profFkId && { professorutilizadoriduser: profFkId }),
    },
    include: { estadouso: true, tamanho: true, cor: true, genero: true, modelofigurino: true, itemfigurino: true }
  });

  await createAuditLog(auditUserId ? parseInt(auditUserId) : null, auditUserNome, 'CREATE', 'Figurino', figurino.idfigurino, 'Figurino adicionado ao stock');

  return mapFigurino(figurino);
};

/**
 * Atualiza estado do figurino.
 * @param {string|number} id @param {number} estadousoid
 * @returns {Promise<any>} {Promise<object>}
 */

  const estadoId = STATUS_MAP[statusStr];
  if (!estadoId) throw new Error('Status inválido');
  const figurino = await prisma.figurino.update({
    where: { idfigurino: parseInt(id) },
    data: { estadousoidestado: estadoId },
    include: { estadouso: true, tamanho: true, cor: true, genero: true, modelofigurino: true, itemfigurino: true }
  });

  await createAuditLog(auditUserId ? parseInt(auditUserId) : null, auditUserNome, 'UPDATE', 'Figurino', parseInt(id), `Estado alterado para ${statusStr}`);

  return mapFigurino(figurino);
};

export const getLookupData = async () => {
  const [tamanhos, generos, cores, modelos, tipos, estadosUso] = await Promise.all([
    prisma.tamanho.findMany(),
    prisma.genero.findMany(),
    prisma.cor.findMany(),
    prisma.modelofigurino.findMany({ include: { tipofigurino: true } }),
    prisma.tipofigurino.findMany(),
    prisma.estadouso.findMany({ orderBy: { idestado: 'asc' } }),
  ]);
  // Convert Prisma proxy objects to plain objects for proper serialization
  return JSON.parse(JSON.stringify({ tamanhos, generos, cores, modelos, tipos, estadosUso }));
};

const mapFigurino = (f) => ({
  id: String(f.idfigurino),
  nome: f.modelofigurino?.nomemodelo || '',
  descricao: f.modelofigurino?.descricao || '',
  tamanho: f.tamanho?.nometamanho || '',
  imagem: f.modelofigurino?.fotografia || '',
  localArmazenamento: f.itemfigurino?.localizacao || '',
  status: ESTADO_TO_STATUS[f.estadousoidestado] || 'DISPONIVEL',
  tipo: 'ESCOLA',
  quantidadeTotal: f.quantidadetotal,
  quantidadeDisponivel: f.quantidadedisponivel,
  cor: f.cor?.nomecor || '',
  genero: f.genero?.nomegenero || '',
  tipofigurinoid: f.modelofigurino?.tipofigurinoidtipofigurino,
  tamanhoid: f.tamanhoidtamanho,
  generoid: f.generoidgenero,
  corid: f.coridcor,
});

export const getStock = async () => {
  const figurinos = await prisma.figurino.findMany({
    include: {
      estadouso: true,
      tamanho: true,
      cor: true,
      genero: true,
      modelofigurino: { include: { tipofigurino: true } },
      itemfigurino: true,
    }
  });

  return figurinos.map(f => ({
    id: f.idfigurino,
    modelo: f.modelofigurino?.nomemodelo || '',
    descricao: f.modelofigurino?.descricao || '',
    fotografia: f.modelofigurino?.fotografia || '',
    genero: f.genero?.nomegenero || '',
    tamanho: f.tamanho?.nometamanho || '',
    cor: f.cor?.nomecor || '',
    estado: f.estadouso?.estadouso || '',
    quantidadeTotal: f.quantidadetotal,
    quantidadeDisponivel: f.quantidadedisponivel,
    localizacao: f.itemfigurino?.localizacao || '',
  }));
};

export const getFigurinoHistory = async (figurinoId) => {
  const transactions = await prisma.transacaofigurino.findMany({
    where: {
      anuncio: {
        figurinoidfigurino: parseInt(figurinoId)
      }
    },
    include: {
      estado: true,
      itemfigurino: true,
      encarregadoeducacao: { include: { utilizador: true } },
      professor: { include: { utilizador: true } },
      direcao: { include: { utilizador: true } }
    },
    orderBy: { datatransacao: 'desc' }
  });

  return transactions.map(t => ({
    id: t.idtransacao,
    data: t.datatransacao ? new Date(t.datatransacao).toISOString() : '',
    quantidade: t.quantidade,
    estado: t.estado?.tipoestado || '',
    motivoRejeicao: t.motivorejeicao || '',
    item: t.itemfigurino?.localizacao || '',
    requester: t.encarregadoeducacao?.utilizador?.nome 
      || t.professor?.utilizador?.nome 
      || t.direcao?.utilizador?.nome 
      || 'Desconhecido'
  }));
};

export const getFigurinosStockBaixo = async () => {
  const figurinos = await prisma.figurino.findMany({
    where: {
      stockminimo: { not: null }
    }
  });

  return figurinos.filter(f => f.quantidadedisponivel <= f.stockminimo).map(f => ({
    id: f.idfigurino,
    modelo: f.quantidadetotal,
    disponivel: f.quantidadedisponivel,
    stockMinimo: f.stockminimo
  }));
};

export const getRelatorioFigurinos = async () => {
  const figurinos = await prisma.figurino.findMany({
    include: {
      modelofigurino: true,
      tamanho: true
    }
  });

  return figurinos.map(f => ({
    id: f.idfigurino,
    modelo: f.modelofigurino?.nomemodelo || '',
    tamanho: f.tamanho?.nometamanho || '',
    total: f.quantidadetotal,
    disponivel: f.quantidadedisponivel,
    stockMinimo: f.stockminimo || 5,
    estado: f.quantidadedisponivel <= (f.stockminimo || 5) ? 'BAIXO' : 'NORMAL'
  }));
};