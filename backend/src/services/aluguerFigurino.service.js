import prisma from "../config/db.js";

const transacaoInclude = {
  estado: true,
  anuncio: { include: { figurino: true } },
  itemfigurino: true,
  direcao: { include: { utilizador: true } },
  encarregadoeducacao: { include: { utilizador: true } },
  professor: { include: { utilizador: true } },
};

export const getAllTransacoes = async () => {
  return prisma.transacaofigurino.findMany({ include: transacaoInclude });
};

export const getTransacaoById = async (id) => {
  return prisma.transacaofigurino.findUnique({
    where: { idtransacao: parseInt(id) },
    include: transacaoInclude,
  });
};

export const getTransacoesByAnuncio = async (anuncioId) => {
  return prisma.transacaofigurino.findMany({
    where: { anuncioidanuncio: parseInt(anuncioId) },
    include: transacaoInclude,
  });
};

export const createTransacao = async (data) => {
  const {
    quantidade,
    datatransacao,
    anuncioidanuncio,
    estadoidestado,
    itemfigurinoiditem,
    encarregadoeducacaoutilizadoriduser,
    professorutilizadoriduser,
  } = data;

  if (!encarregadoeducacaoutilizadoriduser && !professorutilizadoriduser) {
    throw new Error("É necessário identificar o requerente (encarregado ou professor)");
  }

  const anuncio = await prisma.anuncio.findUnique({
    where: { idanuncio: parseInt(anuncioidanuncio) },
    include: { figurino: true },
  });

  if (!anuncio) {
    throw new Error("Anúncio não encontrado");
  }

  const totalReservado = await prisma.transacaofigurino.aggregate({
    where: { anuncioidanuncio: parseInt(anuncioidanuncio) },
    _sum: { quantidade: true },
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
      encarregadoeducacaoutilizadoriduser: encarregadoeducacaoutilizadoriduser
        ? parseInt(encarregadoeducacaoutilizadoriduser)
        : null,
      professorutilizadoriduser: professorutilizadoriduser
        ? parseInt(professorutilizadoriduser)
        : null,
    },
    include: transacaoInclude,
  });

  await criarNotificacaoReserva(transacao.idtransacao, anuncioidanuncio);

  return transacao;
};

export const updateTransacaoStatus = async (id, novoEstadoId, direcaoUserId) => {
  const transacao = await prisma.transacaofigurino.update({
    where: { idtransacao: parseInt(id) },
    data: {
      estadoidestado: parseInt(novoEstadoId),
      ...(direcaoUserId && { direcaoutilizadoriduser: parseInt(direcaoUserId) }),
    },
    include: transacaoInclude,
  });

  await criarNotificacaoStatus(transacao);

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

export const getReservasByUser = async (userId, role) => {
  const where =
    role === 'PROFESSOR'
      ? { professorutilizadoriduser: parseInt(userId) }
      : { encarregadoeducacaoutilizadoriduser: parseInt(userId) };

  return prisma.transacaofigurino.findMany({
    where,
    include: transacaoInclude,
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

async function criarNotificacaoStatus(transacao) {
  const novoEstado = transacao.estado.tipoestado;
  const mensagem = `A sua reserva #${transacao.idtransacao} foi atualizada para ${novoEstado}.`;
  const tipo = "ALUGUER_" + novoEstado.toUpperCase();

  if (transacao.encarregadoeducacaoutilizadoriduser) {
    await prisma.notificacao.create({
      data: { mensagem, tipo, utilizadoriduser: transacao.encarregadoeducacaoutilizadoriduser },
    });
  }
  if (transacao.professorutilizadoriduser) {
    await prisma.notificacao.create({
      data: { mensagem, tipo, utilizadoriduser: transacao.professorutilizadoriduser },
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