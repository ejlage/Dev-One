import prisma from "../config/db.js";

export const getAllTransacoes = async () => {
  return prisma.transacaofigurino.findMany({
    include: {
      estado: true,
      anuncio: { include: { figurino: true } },
      itemfigurino: true,
      direcao: { include: { utilizador: true } },
    },
  });
};

export const getTransacaoById = async (id) => {
  return prisma.transacaofigurino.findUnique({
    where: { idtransacao: parseInt(id) },
    include: {
      estado: true,
      anuncio: { include: { figurino: true } },
      itemfigurino: true,
      direcao: { include: { utilizador: true } },
    },
  });
};

export const getTransacoesByAnuncio = async (anuncioId) => {
  return prisma.transacaofigurino.findMany({
    where: { anuncioidanuncio: parseInt(anuncioId) },
    include: {
      estado: true,
      itemfigurino: true,
      direcao: { include: { utilizador: true } },
    },
  });
};

export const createTransacao = async (data) => {
  const { quantidade, datatransacao, anuncioidanuncio, estadoidestado, itemfigurinoiditem, direcaoutilizadoriduser } = data;
  
  const anuncio = await prisma.anuncio.findUnique({
    where: { idanuncio: parseInt(anuncioidanuncio) },
    include: { figurino: true }
  });
  
  if (!anuncio) {
    throw new Error("Anúncio não encontrado");
  }
  
  const totalReservado = await prisma.transacaofigurino.aggregate({
    where: { anuncioidanuncio: parseInt(anuncioidanuncio) },
    _sum: { quantidade: true }
  });
  
  const disponivel = anuncio.quantidade - (totalReservado._sum.quantidade || 0);
  
  if (parseInt(quantidade) > disponivel) {
    throw new Error(`Apenas ${disponivel} unidades disponíveis`);
  }
  
  const transacao = await prisma.transacaofigurino.create({
    data: {
      quantidade: parseInt(quantidade),
      datatransacao: new Date(datatransacao),
      anuncioidanuncio: parseInt(anuncioidanuncio),
      estadoidestado: parseInt(estadoidestado) || 1,
      itemfigurinoiditem: parseInt(itemfigurinoiditem),
      direcaoutilizadoriduser: parseInt(direcaoutilizadoriduser),
    },
    include: {
      estado: true,
      anuncio: { include: { figurino: true } },
      itemfigurino: true,
    },
  });
  
  await criarNotificacaoReserva(transacao.idtransacao, anuncioidanuncio);
  
  return transacao;
};

export const updateTransacaoStatus = async (id, novoEstadoId) => {
  const transacao = await prisma.transacaofigurino.update({
    where: { idtransacao: parseInt(id) },
    data: { estadoidestado: parseInt(novoEstadoId) },
    include: {
      estado: true,
      anuncio: { include: { figurino: true } },
      direcao: { include: { utilizador: true } },
    },
  });
  
  await criarNotificacaoStatus(transacao.idtransacao, transacao.estado.tipoestado);
  
  return transacao;
};

export const deleteTransacao = async (id) => {
  return prisma.transacaofigurino.delete({
    where: { idtransacao: parseInt(id) },
  });
};

export const getDisponibilidadeFigurino = async (anuncioId) => {
  const anuncio = await prisma.anuncio.findUnique({
    where: { idanuncio: parseInt(anuncioId) },
    include: { figurino: true }
  });
  
  if (!anuncio) {
    throw new Error("Anúncio não encontrado");
  }
  
  const totalReservado = await prisma.transacaofigurino.aggregate({
    where: { 
      anuncioidanuncio: parseInt(anuncioId),
      estadoidestado: { in: [1, 2] }
    },
    _sum: { quantidade: true }
  });
  
  return {
    total: anuncio.quantidade,
    reservado: totalReservado._sum.quantidade || 0,
    disponivel: anuncio.quantidade - (totalReservado._sum.quantidade || 0)
  };
};

export const getReservasByUser = async (userId) => {
  return prisma.transacaofigurino.findMany({
    where: { direcaoutilizadoriduser: parseInt(userId) },
    include: {
      estado: true,
      anuncio: { include: { figurino: true } },
      itemfigurino: true,
    },
  });
};

async function criarNotificacaoReserva(transacaoId, anuncioId) {
  const direcao = await prisma.direcao.findFirst({
    include: { utilizador: true }
  });
  
  if (direcao) {
    await prisma.notificacao.create({
      data: {
        mensagem: `Nova reserva #${transacaoId} para anúncio #${anuncioId}`,
        tipo: "ALUGUER_RESERVA",
        utilizadoriduser: direcao.utilizadoriduser,
      },
    });
  }
}

async function criarNotificacaoStatus(transacaoId, novoEstado) {
  const transacao = await prisma.transacaofigurino.findUnique({
    where: { idtransacao: transacaoId },
    include: { direcao: true }
  });
  
  if (transacao?.direcao) {
    await prisma.notificacao.create({
      data: {
        mensagem: `Reserva #${transacaoId} atualizada para ${novoEstado}`,
        tipo: "ALUGUER_" + novoEstado.toUpperCase(),
        utilizadoriduser: transacao.direcaoutilizadoriduser,
      },
    });
  }
}

export const getEstados = async () => {
  return prisma.estado.findMany({
    where: {
      tipoestado: { in: ["PENDENTE", "APROVADO", "REJEITADO", "CONCLUIDO", "CANCELADO"] }
    }
  });
};