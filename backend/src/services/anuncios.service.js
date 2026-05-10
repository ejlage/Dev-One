import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const notificacoesService = {};

const ANUNCIO_INCLUDE = {
  figurino: { include: { modelofigurino: true } },
  estado: true,
  direcao: { include: { utilizador: true } },
  professor: { include: { utilizador: true } },
  encarregadoeducacao: { include: { utilizador: true } },
};

export const mapAnuncio = (a) => {
  const estadoStr = (a.estado?.tipoestado || '').toLowerCase();
  const statusMap = { aprovado: 'APROVADO', pendente: 'PENDENTE', rejeitado: 'REJEITADO' };
  const status = statusMap[estadoStr] || estadoStr.toUpperCase();

  const vendedorUser = a.encarregadoeducacao?.utilizador || a.professor?.utilizador;
  const vendedorId = vendedorUser?.iduser
    ? String(vendedorUser.iduser)
    : a.direcao?.utilizador?.iduser ? String(a.direcao.utilizador.iduser) : '';

  const nomeModelo = a.figurino?.modelofigurino?.nomemodelo || `Figurino #${a.figurinoidfigurino}`;
  const foto = a.figurino?.modelofigurino?.fotografia || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400';

  return {
    id: String(a.idanuncio),
    titulo: nomeModelo,
    descricao: `${a.tipotransacao === 'VENDA' ? 'Venda' : 'Aluguer'} — ${nomeModelo}. ${a.quantidade} unidade(s) disponíveis.`,
    preco: a.valor,
    imagem: foto,
    vendedorId,
    vendedorNome: vendedorUser?.nome || a.direcao?.utilizador?.nome || 'Escola',
    vendedorContato: vendedorUser?.telemovel || '',
    vendedorEmail: vendedorUser?.email || a.direcao?.utilizador?.email || '',
    status,
    tipoTransacao: a.tipotransacao || 'ALUGUER',
    criadoEm: a.dataanuncio?.toISOString?.() || new Date().toISOString(),
    espetaculoNome: null,
    stockAssociadoId: String(a.figurinoidfigurino),
  };
};

export const getAllAnuncios = async () => {
  const rows = await prisma.anuncio.findMany({ include: ANUNCIO_INCLUDE });
  return rows.map(mapAnuncio);
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
  const { valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado, direcaoutilizadoriduser, professorutilizadoriduser, encarregadoeducacaoutilizadoriduser, tipotransacao } = data;

  const novoAnuncio = await prisma.anuncio.create({
    data: {
      valor: parseInt(valor),
      dataanuncio: new Date(dataanuncio),
      datainicio: new Date(datainicio),
      datafim: new Date(datafim),
      quantidade: parseInt(quantidade),
      figurinoidfigurino: parseInt(figurinoidfigurino),
      estadoidestado: parseInt(estadoidestado),
      tipotransacao: tipotransacao || 'ALUGUER',
      direcaoutilizadoriduser: parseInt(direcaoutilizadoriduser),
      professorutilizadoriduser: professorutilizadoriduser ? parseInt(professorutilizadoriduser) : null,
      encarregadoeducacaoutilizadoriduser: encarregadoeducacaoutilizadoriduser ? parseInt(encarregadoeducacaoutilizadoriduser) : null,
    },
    include: ANUNCIO_INCLUDE,
  });

  await criarNotificacaoValidacao(novoAnuncio.idanuncio);

  return mapAnuncio(novoAnuncio);
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
    where: { tipoestado: { equals: "Aprovado", mode: "insensitive" } },
  });
  
  if (!estadoAprovado) {
    throw new Error("Estado APROVADO não encontrado");
  }
  
  const anuncio = await prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: { estadoidestado: estadoAprovado.idestado },
    include: ANUNCIO_INCLUDE,
  });

  if (anuncio.encarregadoeducacaoutilizadoriduser) {
    await createNotificacaoAnuncio(anuncio.encarregadoeducacaoutilizadoriduser, anuncio.idanuncio, "APROVADO");
  }
  if (anuncio.professorutilizadoriduser) {
    await createNotificacaoAnuncio(anuncio.professorutilizadoriduser, anuncio.idanuncio, "APROVADO");
  }

  return mapAnuncio(anuncio);
};

export const rejectAnuncio = async (id, userId) => {
  const estadoRejeitado = await prisma.estado.findFirst({
    where: { tipoestado: { equals: "Rejeitado", mode: "insensitive" } },
  });

  if (!estadoRejeitado) {
    throw new Error("Estado REJEITADO não encontrado");
  }

  const anuncio = await prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: { estadoidestado: estadoRejeitado.idestado },
    include: ANUNCIO_INCLUDE,
  });

  if (anuncio.encarregadoeducacaoutilizadoriduser) {
    await createNotificacaoAnuncio(anuncio.encarregadoeducacaoutilizadoriduser, anuncio.idanuncio, "REJEITADO");
  }
  if (anuncio.professorutilizadoriduser) {
    await createNotificacaoAnuncio(anuncio.professorutilizadoriduser, anuncio.idanuncio, "REJEITADO");
  }

  return mapAnuncio(anuncio);
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