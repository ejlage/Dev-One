import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const disponibilidadeInclude = {
  include: {
    modalidadeprofessor: {
      include: {
        modalidade: true
      }
    },
    tipoaula: true,
    professor: {
      include: {
        utilizador: true
      }
    }
  }
};

export async function getAllPedidosAula() {
  return prisma.pedidodeaula.findMany({
    include: {
      disponibilidade: disponibilidadeInclude,
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
      disponibilidade: disponibilidadeInclude,
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
      disponibilidade: disponibilidadeInclude,
      grupo: true,
      estado: true,
      sala: true
    },
    orderBy: { datapedido: 'desc' }
  });
}

export async function getPedidosPendentes() {
  const estadoPendente = await prisma.estado.findFirst({
    where: { tipoestado: 'PENDENTE' }
  });
  
  if (!estadoPendente) return [];

  return prisma.pedidodeaula.findMany({
    where: { estadoidestado: estadoPendente.idestado },
    include: {
      disponibilidade: disponibilidadeInclude,
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
    disponibilidadeiddisponibilidade, 
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
      disponibilidadeiddisponibilidade: parseInt(disponibilidadeiddisponibilidade),
      grupoidgrupo: grupoidgrupo ? parseInt(grupoidgrupo) : null,
      estadoidestado: estadoPendente.idestado,
      salaidsala: parseInt(salaidsala),
      encarregadoeducacaoutilizadoriduser: parseInt(encarregadoeducacaoutilizadoriduser)
    },
    include: {
      disponibilidade: disponibilidadeInclude,
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
      disponibilidade: disponibilidadeInclude,
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