import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getNotificacoesByUser(userId) {
  return prisma.notificacao.findMany({
    where: { utilizadoriduser: userId },
    orderBy: { datanotificacao: 'desc' },
    take: 50
  });
}

export async function getNotificacoesNaoLidas(userId) {
  return prisma.notificacao.findMany({
    where: { 
      utilizadoriduser: userId,
      lida: false
    },
    orderBy: { datanotificacao: 'desc' }
  });
}

export async function createNotificacao(utilizadoriduser, mensagem, tipo) {
  return prisma.notificacao.create({
    data: {
      mensagem,
      tipo,
      utilizadoriduser
    }
  });
}

export async function marcarComoLida(id, userId) {
  return prisma.notificacao.updateMany({
    where: { 
      idnotificacao: parseInt(id),
      utilizadoriduser: userId
    },
    data: { 
      lida: true,
      dataleitura: new Date()
    }
  });
}

export async function marcarTodasComoLidas(userId) {
  return prisma.notificacao.updateMany({
    where: { 
      utilizadoriduser: userId,
      lida: false
    },
    data: { 
      lida: true,
      dataleitura: new Date()
    }
  });
}

export async function deleteNotificacao(id, userId) {
  return prisma.notificacao.deleteMany({
    where: { 
      idnotificacao: parseInt(id),
      utilizadoriduser: userId
    }
  });
}