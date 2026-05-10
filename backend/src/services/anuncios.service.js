import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "./audit.service.js";

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
  const statusMap = { aprovado: 'APROVADO', pendente: 'PENDENTE', rejeitado: 'REJEITADO', inativo: 'INATIVO' };
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
    quantidade: a.quantidade,
    motivoRejeicao: a.motivorejeicao || null,
    criadoPorDirecao: !!a.direcaoutilizadoriduser,
    criadoPorProfessor: !!a.professorutilizadoriduser,
    criadoPorEncarregado: !!a.encarregadoeducacaoutilizadoriduser,
  };
};

export const getAllAnuncios = async (userRole = null, userId = null, estadoFilter = null) => {
  const where = {};
  
  if (estadoFilter) {
    where.estado = { tipoestado: { equals: estadoFilter, mode: 'insensitive' } };
  } else if (userRole && userRole !== 'DIRECAO') {
    // Non-DIRECAO: only see APROVADO or their own anuncios
    const estadoAprovado = await prisma.estado.findFirst({
      where: { tipoestado: { equals: "Aprovado", mode: "insensitive" } },
    });
    where.OR = [
      { estadoidestado: estadoAprovado?.idestado ?? 0 },
      ...(userId ? [
        { encarregadoeducacaoutilizadoriduser: parseInt(userId) },
        { professorutilizadoriduser: parseInt(userId) },
      ] : []),
    ];
  }
  
  const rows = await prisma.anuncio.findMany({ where, include: ANUNCIO_INCLUDE, orderBy: { dataanuncio: 'desc' } });
  return rows.map(mapAnuncio);
};

export const consultarAnuncio = async (id) => {
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

export const registarAnuncio = async (data, userId = null, userNome = '', userRole = null) => {
  const { valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado, direcaoutilizadoriduser, professorutilizadoriduser, encarregadoeducacaoutilizadoriduser, tipotransacao } = data;
  
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

  let resolvedEstadoId = estadoidestado ? parseInt(estadoidestado) : null;
  if (!resolvedEstadoId || isNaN(resolvedEstadoId)) {
    // Auto-aprovação para DIRECAO (BPMN 04)
    if (userRole === 'DIRECAO') {
      const aprovado = await prisma.estado.findFirst({
        where: { tipoestado: { equals: 'Aprovado', mode: 'insensitive' } }
      });
      resolvedEstadoId = aprovado?.idestado ?? 21;
    } else {
      const pendente = await prisma.estado.findFirst({
        where: { tipoestado: { equals: 'Pendente', mode: 'insensitive' } }
      });
      resolvedEstadoId = pendente?.idestado ?? 21;
    }
  }

  const novoAnuncio = await prisma.anuncio.create({
    data: {
      valor: valor != null && valor !== '' ? parseFloat(valor) : null,
      dataanuncio: new Date(dataanuncio || new Date().toISOString().split('T')[0]),
      datainicio: datainicio ? new Date(datainicio) : null,
      datafim: datafim ? new Date(datafim) : null,
      quantidade: parseInt(quantidade) || 1,
      figurinoidfigurino: parseInt(figurinoidfigurino),
      estadoidestado: resolvedEstadoId,
      tipotransacao: tipotransacao || 'ALUGUER',
      direcaoutilizadoriduser: direcaoutilizadoriduser ? parseInt(direcaoutilizadoriduser) : null,
      professorutilizadoriduser: professorutilizadoriduser ? parseInt(professorutilizadoriduser) : null,
      encarregadoeducacaoutilizadoriduser: encarregadoeducacaoutilizadoriduser ? parseInt(encarregadoeducacaoutilizadoriduser) : null,
    },
    include: ANUNCIO_INCLUDE,
  });

  await criarNotificacaoValidacao(novoAnuncio.idanuncio);

  await createAuditLog(userId ? parseInt(userId) : null, userNome, 'CREATE', 'Anuncio', novoAnuncio.idanuncio, 'Anúncio criado');

  return mapAnuncio(novoAnuncio);
};

export const updateAnuncio = async (id, data, userId, userRole) => {
  const { valor, dataanuncio, datainicio, datafim, quantidade, figurinoidfigurino, estadoidestado } = data;

  if (userRole !== 'DIRECAO') {
    const anuncio = await prisma.anuncio.findUnique({ where: { idanuncio: parseInt(id) }, include: ANUNCIO_INCLUDE });
    const ownerId = anuncio?.encarregadoeducacao?.utilizador?.iduser || anuncio?.professor?.utilizador?.iduser;
    if (!anuncio || String(ownerId) !== String(userId)) {
      throw new Error('Sem permissão para editar este anúncio');
    }
    const estadoStr = (anuncio.estado?.tipoestado || '').toLowerCase();
    const novoEstado = await prisma.estado.findUnique({ where: { idestado: parseInt(estadoidestado) } });
    const novoEstadoStr = (novoEstado?.tipoestado || '').toLowerCase();
    if (novoEstadoStr === 'inativo') {
      if (estadoStr !== 'aprovado' && estadoStr !== 'pendente') {
        throw new Error('Só é possível inativar anúncios aprovados ou pendentes');
      }
    } else if (estadoStr !== 'pendente') {
      throw new Error('Só é possível editar anúncios pendentes');
    }
  }

  const updated = await prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: {
      valor: valor != null && valor !== '' ? parseFloat(valor) : undefined,
      dataanuncio: dataanuncio ? new Date(dataanuncio) : undefined,
      datainicio: datainicio ? new Date(datainicio) : undefined,
      datafim: datafim ? new Date(datafim) : undefined,
      quantidade: quantidade ? parseInt(quantidade) : undefined,
      figurinoidfigurino: figurinoidfigurino ? parseInt(figurinoidfigurino) : undefined,
      estadoidestado: estadoidestado ? parseInt(estadoidestado) : undefined,
    },
    include: ANUNCIO_INCLUDE,
  });
  return mapAnuncio(updated);
};

export const deleteAnuncio = async (id, userId, userRole, userNome = '') => {
  if (userRole !== 'DIRECAO') {
    const anuncio = await prisma.anuncio.findUnique({ where: { idanuncio: parseInt(id) }, include: ANUNCIO_INCLUDE });
    const ownerId = anuncio?.encarregadoeducacao?.utilizador?.iduser || anuncio?.professor?.utilizador?.iduser;
    if (!anuncio || String(ownerId) !== String(userId)) {
      throw new Error('Sem permissão para eliminar este anúncio');
    }
    const estadoStr = (anuncio.estado?.tipoestado || '').toLowerCase();
    if (estadoStr !== 'pendente') {
      throw new Error('Só é possível eliminar anúncios pendentes');
    }
  }
  const result = await prisma.anuncio.delete({ where: { idanuncio: parseInt(id) } });
  await _auditAnuncioDelete(id, userId, userNome || '');
  return result;
};

const _auditAnuncioDelete = async (id, userId, userNome) => {
  try {
    await createAuditLog(userId ? parseInt(userId) : null, userNome, 'DELETE', 'Anuncio', parseInt(id), 'Anúncio removido');
  } catch (_) {}
};
const _auditAnuncioApprove = async (id, userId, userNome) => {
  try {
    await createAuditLog(userId ? parseInt(userId) : null, userNome, 'APPROVE', 'Anuncio', parseInt(id), 'Anúncio aprovado');
  } catch (_) {}
};
const _auditAnuncioReject = async (id, userId, userNome, motivo) => {
  try {
    await createAuditLog(userId ? parseInt(userId) : null, userNome, 'REJECT', 'Anuncio', parseInt(id), `Anúncio rejeitado: ${motivo || ''}`);
  } catch (_) {}
};

export const avaliarAnuncio = async (id, decisao, userId, userNome = '', motivo) => {
  if (decisao === 'aprovar') {
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

    await _auditAnuncioApprove(id, userId, userNome || 'Direção');

    return mapAnuncio(anuncio);
  } else if (decisao === 'rejeitar') {
    const estadoRejeitado = await prisma.estado.findFirst({
      where: { tipoestado: { equals: "Rejeitado", mode: "insensitive" } },
    });

    if (!estadoRejeitado) {
      throw new Error("Estado REJEITADO não encontrado");
    }

    const anuncio = await prisma.anuncio.update({
      where: { idanuncio: parseInt(id) },
      data: {
        estadoidestado: estadoRejeitado.idestado,
        motivorejeicao: motivo || null,
      },
      include: ANUNCIO_INCLUDE,
    });

    if (anuncio.encarregadoeducacaoutilizadoriduser) {
      await createNotificacaoAnuncio(anuncio.encarregadoeducacaoutilizadoriduser, anuncio.idanuncio, "REJEITADO", motivo);
    }
    if (anuncio.professorutilizadoriduser) {
      await createNotificacaoAnuncio(anuncio.professorutilizadoriduser, anuncio.idanuncio, "REJEITADO", motivo);
    }

    await _auditAnuncioReject(id, userId, userNome || 'Direção', motivo);

    return mapAnuncio(anuncio);
  }
};

export const ressubmeterAnuncio = async (id, userId, userRole) => {
  const anuncio = await prisma.anuncio.findUnique({ where: { idanuncio: parseInt(id) }, include: ANUNCIO_INCLUDE });
  if (!anuncio) throw new Error("Anúncio não encontrado");

  const ownerId = anuncio.encarregadoeducacao?.utilizador?.iduser || anuncio.professor?.utilizador?.iduser;
  if (userRole !== 'DIRECAO' && String(ownerId) !== String(userId)) {
    throw new Error("Sem permissão para ressubmeter este anúncio");
  }

  const estadoStr = (anuncio.estado?.tipoestado || '').toLowerCase();
  if (estadoStr !== 'rejeitado') {
    throw new Error("Só é possível ressubmeter anúncios rejeitados");
  }

  const estadoPendente = await prisma.estado.findFirst({
    where: { tipoestado: { equals: 'Pendente', mode: 'insensitive' } },
  });

  const updated = await prisma.anuncio.update({
    where: { idanuncio: parseInt(id) },
    data: {
      estadoidestado: estadoPendente?.idestado ?? 21,
      motivorejeicao: null,
    },
    include: ANUNCIO_INCLUDE,
  });

  await criarNotificacaoValidacao(updated.idanuncio);

  return mapAnuncio(updated);
};

async function createNotificacaoAnuncio(userId, anuncioId, tipo, motivo) {
  let mensagem;
  if (tipo === "APROVADO") {
    mensagem = `O seu anúncio #${anuncioId} foi aprovado!`;
  } else if (motivo) {
    mensagem = `O seu anúncio #${anuncioId} foi rejeitado. Motivo: ${motivo}`;
  } else {
    mensagem = `O seu anúncio #${anuncioId} foi rejeitado.`;
  }

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