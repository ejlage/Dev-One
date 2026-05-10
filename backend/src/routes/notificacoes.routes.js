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

  fastify.get('/', {
    schema: {
      tags: ["Notificações"],
      description: "Listar todas as notificações do utilizador",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" }
          }
        }
      }
    }
  }, getMyNotificacoes);

  fastify.get('/nao-lidas', {
    schema: {
      tags: ["Notificações"],
      description: "Listar notificações não lidas",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" }
          }
        }
      }
    }
  }, getNotificacoesNaoLidas);

  fastify.post('/:id/read', {
    schema: {
      tags: ["Notificações"],
      description: "Marcar notificação como lida",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da notificação" }
        },
        required: ["id"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" }
          }
        }
      }
    }
  }, markAsRead);

  fastify.post('/read-all', {
    schema: {
      tags: ["Notificações"],
      description: "Marcar todas as notificações como lidas",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" }
          }
        }
      }
    }
  }, markAllAsRead);

  fastify.delete('/:id', {
    schema: {
      tags: ["Notificações"],
      description: "Eliminar notificação",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da notificação" }
        },
        required: ["id"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" }
          }
        }
      }
    }
  }, deleteNotificacao);
}