import prisma from "../config/db.js";

export const getAllFigurinos = async () => {
  const figurinos = await prisma.figurino.findMany({
    include: {
      estadouso: true, tamanho: true, cor: true, genero: true,
      modelofigurino: { include: { tipofigurino: true } },
      itemfigurino: true,
    }
  });
  return figurinos.map(mapFigurino);
};

export const getFigurinoById = async (id) => {
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

export const createFigurino = async (data) => {
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

export const updateFigurino = async (id, data) => {
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

export const deleteFigurino = async (id) => {
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
const ESTADO_TO_STATUS = { 16: 'DISPONIVEL', 17: 'DISPONIVEL', 18: 'DISPONIVEL', 19: 'DISPONIVEL', 20: 'ALUGADO', 21: 'ALUGADO' };

export const createFigurinoStock = async (data, direcaoUserId) => {
  const {
    nome, descricao, fotografia, tipofigurinoid,
    tamanhoid, generoid, corid, localizacao,
    quantidadetotal = 1, quantidadedisponivel = 1
  } = data;

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
      estadousoidestado: 19,
      itemfigurinoiditem: item.iditem,
      ...(direcaoUserId && { direcaoutilizadoriduser: parseInt(direcaoUserId) }),
    },
    include: { estadouso: true, tamanho: true, cor: true, genero: true, modelofigurino: true, itemfigurino: true }
  });

  return mapFigurino(figurino);
};

export const updateFigurinoStatusSimple = async (id, statusStr) => {
  const estadoId = STATUS_MAP[statusStr];
  if (!estadoId) throw new Error('Status inválido');
  const figurino = await prisma.figurino.update({
    where: { idfigurino: parseInt(id) },
    data: { estadousoidestado: estadoId },
    include: { estadouso: true, tamanho: true, cor: true, genero: true, modelofigurino: true, itemfigurino: true }
  });
  return mapFigurino(figurino);
};

export const getLookupData = async () => {
  const [tamanhos, generos, cores, modelos, tipos] = await Promise.all([
    prisma.tamanho.findMany(),
    prisma.genero.findMany(),
    prisma.cor.findMany(),
    prisma.modelofigurino.findMany({ include: { tipofigurino: true } }),
    prisma.tipofigurino.findMany(),
  ]);
  return { tamanhos, generos, cores, modelos, tipos };
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