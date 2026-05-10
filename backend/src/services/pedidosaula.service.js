import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const disponibilidade_mensalInclude = {
  include: {
    modalidadeprofessor: {
      include: {
        modalidade: true
      }
    },
    professor: {
      include: {
        utilizador: true
      }
    },
    sala: true,
  }
};

export async function getAllPedidosAula() {
  return prisma.pedidodeaula.findMany({
    include: {
      disponibilidade_mensal: disponibilidade_mensalInclude,
      grupo: true,
      estado: true,
      sala: true,
      encarregadoeducacao: {
        include: { utilizador: true }
      }
    },
    orderBy: { datapedido: 'desc' }
  });
}

export async function getPedidoAulaById(id) {
  return prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(id) },
    include: {
      disponibilidade_mensal: disponibilidade_mensalInclude,
      grupo: true,
      estado: true,
      sala: true,
      encarregadoeducacao: {
        include: { utilizador: true }
      }
    }
  });
}

export async function getPedidosByEncarregado(encarregadoUserId) {
  return prisma.pedidodeaula.findMany({
    where: { encarregadoeducacaoutilizadoriduser: encarregadoUserId },
    include: {
      disponibilidade_mensal: disponibilidade_mensalInclude,
      grupo: true,
      estado: true,
      sala: true
    },
    orderBy: { datapedido: 'desc' }
  });
}

export async function getAllPedidosEAulas() {
  const pedidos = await prisma.pedidodeaula.findMany({ orderBy: { datapedido: 'desc' } });

  const salas = await prisma.sala.findMany();
  const estados = await prisma.estado.findMany();
  const salaMap = Object.fromEntries(salas.map(s => [s.idsala, s.nomesala]));
  const estadoMap = Object.fromEntries(estados.map(e => [e.idestado, e.tipoestado]));

  return pedidos.map(p => ({
    id: String(p.idpedidoaula),
    alunoId: '',
    alunoNome: '',
    encarregadoId: p.encarregadoeducacaoutilizadoriduser ? String(p.encarregadoeducacaoutilizadoriduser) : '',
    professorId: '',
    professorNome: '',
    estudioId: String(p.salaidsala),
    estudioNome: salaMap[p.salaidsala] || '',
    modalidade: '',
    data: p.data ? new Date(p.data).toISOString().split('T')[0] : '',
    horaInicio: p.horainicio ? String(p.horainicio).substring(11, 16) : '',
    horaFim: '',
    duracao: p.duracaoaula || 60,
    status: estadoMap[p.estadoidestado] || 'PENDENTE',
    criadoEm: p.datapedido ? new Date(p.datapedido).toISOString() : '',
    participantes: []
  }));
}

export async function getPedidosPendentes() {
  const estadoPendente = await prisma.estado.findFirst({
    where: { tipoestado: 'PENDENTE' }
  });

  if (!estadoPendente) return [];

  return prisma.pedidodeaula.findMany({
    where: { estadoidestado: estadoPendente.idestado },
    include: {
      disponibilidade_mensal: disponibilidade_mensalInclude,
      grupo: true,
      estado: true,
      sala: true,
      encarregadoeducacao: {
        include: { utilizador: true }
      }
    },
    orderBy: { datapedido: 'asc' }
  });
}

export async function createPedidoAula(data) {
  const {
    data: dataAula,
    horainicio,
    duracaoaula,
    maxparticipantes,
    privacidade,
    disponibilidade_mensal_id,
    grupoidgrupo,
    salaidsala,
    encarregadoeducacaoutilizadoriduser
  } = data;

  const estadoPendente = await prisma.estado.findFirst({
    where: { tipoestado: 'PENDENTE' }
  });

  if (!estadoPendente) {
    throw new Error('Estado PENDENTE não encontrado');
  }

  return prisma.pedidodeaula.create({
    data: {
      data: new Date(dataAula),
      horainicio: new Date(`2000-01-01T${horainicio}`),
      duracaoaula: new Date(`2000-01-01T${duracaoaula || '01:00'}`),
      maxparticipantes: parseInt(maxparticipantes || 10),
      datapedido: new Date(),
      privacidade: privacidade || false,
      disponibilidade_mensal_id: disponibilidade_mensal_id ? parseInt(disponibilidade_mensal_id) : null,
      grupoidgrupo: grupoidgrupo ? parseInt(grupoidgrupo) : null,
      estadoidestado: estadoPendente.idestado,
      salaidsala: parseInt(salaidsala),
      encarregadoeducacaoutilizadoriduser: parseInt(encarregadoeducacaoutilizadoriduser)
    },
    include: {
      disponibilidade_mensal: disponibilidade_mensalInclude,
      grupo: true,
      estado: true,
      sala: true,
      encarregadoeducacao: {
        include: { utilizador: true }
      }
    }
  });
}

export async function updatePedidoAulaStatus(id, novoEstadoTipo) {
  const estado = await prisma.estado.findFirst({
    where: { tipoestado: novoEstadoTipo }
  });

  if (!estado) {
    throw new Error(`Estado ${novoEstadoTipo} não encontrado`);
  }

  return prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(id) },
    data: { estadoidestado: estado.idestado },
    include: {
      disponibilidade_mensal: disponibilidade_mensalInclude,
      estado: true,
      encarregadoeducacao: {
        include: { utilizador: true }
      },
      sala: true
    }
  });
}

export async function deletePedidoAula(id) {
  return prisma.pedidodeaula.delete({
    where: { idpedidoaula: parseInt(id) }
  });
}

export async function getEstados() {
  return prisma.estado.findMany();
}
