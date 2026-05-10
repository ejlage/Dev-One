import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const notificacoesService = {};

export const getAllAnuncios = async () => {
  return prisma.anuncio.findMany({
    include: {
      figurino: true,
      estado: true,
      direcao: { include: { utilizador: true } },
      professor: { include: { utilizador: true } },
      encarregadoeducacao: { include: { utilizador: true } },
    },
  });
};

export const getAnuncioById = async (id) => {
  return prisma.anuncio.findUnique({
    where: { idanuncio: parseInt(id) },
    include: {
      figurino: true,
      estado: true,
      direcao: { include: { utilizador: true } },
      professor: { include: { utilizador: true } },
      encarregadoeducacao: { include: { utilizador: true } },
    },
  });
};

export const getAnunciosByEstado = async (estadoTipo) => {
  return prisma.anuncio.findMany({
    where: {
      estado: { tipoestado: estadoTipo },
    },
    include: {
      figurino: true,
      estado: true,
    },
  });
};

export const createAnuncio = async (data) => {
  const { valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado, direcaoutilizadoriduser, professorutilizadoriduser, encarregadoeducacaoutilizadoriduser } = data;
  
  const novoAnuncio = await prisma.anuncio.create({
    data: {
      valor: parseInt(valor),
      dataanuncio: new Date(dataanuncio),
      datainicio: new Date(datainicio),
      datafim: new Date(datafim),
      quantidade: parseInt(quantidade),
      figurinoidfigurino: parseInt(figurinoidfigurino),
      estadoidestado: parseInt(estadoidestado),
      direcaoutilizadoriduser: parseInt(direcaoutilizadoriduser),
      professorutilizadoriduser: professorutilizadoriduser ? parseInt(professorutilizadoriduser) : null,
      encarregadoeducacaoutilizadoriduser: encarregadoeducacaoutilizadoriduser ? parseInt(encarregadoeducacaoutilizadoriduser) : null,
    },
    include: {
      figurino: true,
      estado: true,
    },
  });
  
  await criarNotificacaoValidacao(novoAnuncio.idanuncio);
  
  return novoAnuncio;
};

export const updateAnuncio = async (id, data) => {
  const { valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado } = data;
  
  return prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: {
      valor: valor ? parseInt(valor) : undefined,
      dataanuncio: dataanuncio ? new Date(dataanuncio) : undefined,
      datainicio: datainicio ? new Date(datainicio) : undefined,
      datafim: datafim ? new Date(datafim) : undefined,
      quantidade: quantidade ? parseInt(quantidade) : undefined,
      figurinoidfigurino: figurinoidfigurino ? parseInt(figurinoidfigurino) : undefined,
      estadoidestado: estadoidestado ? parseInt(estadoidestado) : undefined,
    },
    include: {
      figurino: true,
      estado: true,
    },
  });
};

export const deleteAnuncio = async (id) => {
  return prisma.anuncio.delete({
    where: { idanuncio: parseInt(id) },
  });
};

export const approveAnuncio = async (id, userId) => {
  const estadoAprovado = await prisma.estado.findFirst({
    where: { tipoestado: "APROVADO" },
  });
  
  if (!estadoAprovado) {
    throw new Error("Estado APROVADO não encontrado");
  }
  
  const anuncio = await prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: { estadoidestado: estadoAprovado.idestado },
    include: {
      figurino: true,
      encarregadoeducacao: { include: { utilizador: true } },
      professor: { include: { utilizador: true } },
    },
  });
  
  if (anuncio.encarregadoeducacaoutilizadoriduser) {
    await createNotificacaoAnuncio(anuncio.encarregadoeducacaoutilizadoriduser, anuncio.idanuncio, "APROVADO");
  }
  
  return anuncio;
};

export const rejectAnuncio = async (id, userId) => {
  const estadoRejeitado = await prisma.estado.findFirst({
    where: { tipoestado: "REJEITADO" },
  });
  
  if (!estadoRejeitado) {
    throw new Error("Estado REJEITADO não encontrado");
  }
  
  const anuncio = await prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: { estadoidestado: estadoRejeitado.idestado },
    include: {
      figurino: true,
      encarregadoeducacao: { include: { utilizador: true } },
      professor: { include: { utilizador: true } },
    },
  });
  
  if (anuncio.encarregadoeducacaoutilizadoriduser) {
    await createNotificacaoAnuncio(anuncio.encarregadoeducacaoutilizadoriduser, anuncio.idanuncio, "REJEITADO");
  }
  
  return anuncio;
};

async function createNotificacaoAnuncio(userId, anuncioId, tipo) {
  const mensagem = tipo === "APROVADO" 
    ? `O seu anúncio foi aprovado!`
    : `O seu anúncio foi rejeitado.`;
  
  return prisma.notificacao.create({
    data: {
      mensagem,
      tipo: "ANUNCIO_" + tipo,
      utilizadoriduser: userId,
    },
  });
}

export const getEstados = async () => {
  return prisma.estado.findMany();
};

async function criarNotificacaoValidacao(anuncioId) {
  const direcao = await prisma.direcao.findFirst({
    include: { utilizador: true }
  });
  
  if (direcao) {
    await prisma.notificacao.create({
      data: {
        mensagem: `Novo anúncio #${anuncioId} aguarda validação`,
        tipo: "ANUNCIO_PENDENTE",
        utilizadoriduser: direcao.utilizadoriduser,
      },
    });
  }
}