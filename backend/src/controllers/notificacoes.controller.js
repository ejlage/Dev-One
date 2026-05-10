import * as notificacoesService from '../services/notificacoes.service.js';

export async function getMyNotificacoes(req, reply) {
  try {
    const userId = req.user.id;
    const notificacoes = await notificacoesService.getNotificacoesByUser(userId);
    return { success: true, data: notificacoes };
  } catch (error) {
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function getNotificacoesNaoLidas(req, reply) {
  try {
    const userId = req.user.id;
    const notificacoes = await notificacoesService.getNotificacoesNaoLidas(userId);
    return { success: true, data: notificacoes };
  } catch (error) {
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function markAsRead(req, reply) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await notificacoesService.marcarComoLida(id, userId);
    return { success: true, data: result };
  } catch (error) {
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function markAllAsRead(req, reply) {
  try {
    const userId = req.user.id;
    const result = await notificacoesService.marcarTodasComoLidas(userId);
    return { success: true, data: result };
  } catch (error) {
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function deleteNotificacao(req, reply) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await notificacoesService.deleteNotificacao(id, userId);
    return { success: true, message: 'Notificação eliminada' };
  } catch (error) {
    return reply.status(500).send({ success: false, error: error.message });
  }
}