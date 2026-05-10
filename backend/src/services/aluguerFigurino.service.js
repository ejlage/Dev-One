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
    datainicio,
    datafim,
    anuncioidanuncio,
    estadoidestado,
    itemfigurinoiditem,
    encarregadoeducacaoutilizadoriduser,
    professorutilizadoriduser,
  } = data;

  if (!encarregadoeducacaoutilizadoriduser && !professorutilizadoriduser) {
    throw new Error("É necessário identificar o requerente (encarregado ou professor)");
  }
  
  const agora = new Date();
  const dataHojeStr = agora.toISOString().split('T')[0];
  
  if (datainicio) {
    const dataInicioStr = new Date(datainicio).toISOString().split('T')[0];
    if (dataInicioStr < dataHojeStr) {
      throw new Error('A data de início não pode ser no passado');
    }
  }
  
  if (datainicio && datafim) {
    const dataInicioObj = new Date(datainicio);
    const dataFimObj = new Date(datafim);
    if (dataFimObj <= dataInicioObj) {
      throw new Error('A data de fim deve ser posterior à data de início');
    }
  }

  const anuncio = await prisma.anuncio.findUnique({
    where: { idanuncio: parseInt(anuncioidanuncio) },
    include: { figurino: true },
  });

  if (!anuncio) {
    throw new Error("Anúncio não encontrado");
  }

  const estadosAtivos = await prisma.estado.findMany({
    where: { tipoestado: { in: ['Pendente', 'Aprovado'], mode: 'insensitive' } },
  });
  const estadosAtivosIds = estadosAtivos.map(e => e.idestado);

  const totalReservado = await prisma.transacaofigurino.aggregate({
    where: { anuncioidanuncio: parseInt(anuncioidanuncio), estadoidestado: { in: estadosAtivosIds } },
    _sum: { quantidade: true },
  });

  const disponivel = anuncio.quantidade - (totalReservado._sum.quantidade || 0);

  if (disponivel <= 0) {
    throw new Error('Este anúncio não tem unidades disponíveis');
  }
  if (parseInt(quantidade) > disponivel) {
    throw new Error(`Apenas ${disponivel} unidade(s) disponível(is)`);
  }

  let resolvedEstadoId = estadoidestado ? parseInt(estadoidestado) : null;
  if (!resolvedEstadoId || isNaN(resolvedEstadoId)) {
    const pendente = await prisma.estado.findFirst({
      where: { tipoestado: { equals: 'Pendente', mode: 'insensitive' } },
    });
    resolvedEstadoId = pendente?.idestado ?? 21;
  }

  const transacao = await prisma.transacaofigurino.create({
    data: {
      quantidade: parseInt(quantidade),
      datatransacao: new Date(datatransacao),
      anuncioidanuncio: parseInt(anuncioidanuncio),
      estadoidestado: resolvedEstadoId,
      itemfigurinoiditem: itemfigurinoiditem ? parseInt(itemfigurinoiditem) : null,
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

export const updateTransacaoStatus = async (id, novoEstadoId, direcaoUserId, motivorejeicao) => {
  const transacao = await prisma.transacaofigurino.update({
    where: { idtransacao: parseInt(id) },
    data: {
      estadoidestado: parseInt(novoEstadoId),
      ...(direcaoUserId && { direcaoutilizadoriduser: parseInt(direcaoUserId) }),
      ...(motivorejeicao !== undefined && { motivorejeicao: motivorejeicao || null }),
    },
    include: { ...transacaoInclude, estado: true },
  });

  await criarNotificacaoStatus(transacao);

  const novoEstadoStr = (transacao.estado?.tipoestado || '').toLowerCase();
  if (novoEstadoStr === 'aprovado') {
    await prisma.anuncio.update({
      where: { idanuncio: transacao.anuncioidanuncio },
      data: { quantidade: { decrement: transacao.quantidade } },
    });
  }

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
  
  const estadosAtivos = await prisma.estado.findMany({
    where: { tipoestado: { in: ['Pendente', 'Aprovado'], mode: 'insensitive' } },
  });
  const estadoIdsAtivos = estadosAtivos.map(e => e.idestado);

  const totalReservado = await prisma.transacaofigurino.aggregate({
    where: {
      anuncioidanuncio: parseInt(anuncioId),
      estadoidestado: { in: estadoIdsAtivos },
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
      tipoestado: { in: ["Pendente", "Aprovado", "Rejeitado", "Concluído", "Cancelado"], mode: 'insensitive' }
    }
  });
};