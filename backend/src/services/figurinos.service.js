import prisma from "../config/db.js";

export const getAllFigurinos = async () => {
  const figurinos = await prisma.figurino.findMany({
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
  return figurinos;
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