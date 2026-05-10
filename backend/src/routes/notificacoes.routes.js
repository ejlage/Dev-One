import { 
  getMyNotificacoes,
  getNotificacoesNaoLidas,
  markAsRead,
  markAllAsRead,
  deleteNotificacao 
} from '../controllers/notificacoes.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';

export default async function notificacoesRoutes(fastify, options) {
  
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', getMyNotificacoes);

  fastify.get('/nao-lidas', getNotificacoesNaoLidas);

  fastify.post('/:id/read', markAsRead);

  fastify.post('/read-all', markAllAsRead);

  fastify.delete('/:id', deleteNotificacao);
}