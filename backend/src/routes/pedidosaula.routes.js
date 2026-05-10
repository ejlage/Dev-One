import { 
  getAllPedidosAula, 
  obterPedido, 
  getMyPedidos,
  getPedidosPendentes,
  submeterPedidoAula, 
  approvePedidoAula,
  rejectPedidoAula,
  deletePedidoAula 
} from '../controllers/pedidosaula.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

export default async function pedidosaulaRoutes(fastify, options) {
  
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Listar todos os pedidos de aula (apenas direção)",
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
    },
    preHandler: authorizeRole('DIRECAO')
  }, getAllPedidosAula);

  fastify.get('/pendentes', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Listar pedidos de aula pendentes (apenas direção)",
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
    },
    preHandler: authorizeRole('DIRECAO')
  }, getPedidosPendentes);

  fastify.get('/my', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Listar os meus pedidos de aula (apenas encarregado)",
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
    },
    preHandler: authorizeRole('ENCARREGADO')
  }, getMyPedidos);

  fastify.get('/:id', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Obter um pedido de aula pelo ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do pedido de aula" }
        },
        required: ["id"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, obterPedido);

  fastify.post('/', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Submeter novo pedido de aula",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          data: { type: "string", description: "Data pretendida (YYYY-MM-DD)" },
          horainicio: { type: "string", description: "Hora de início (HH:MM)" },
          duracaoaula: { type: "integer", description: "Duração em minutos" },
          disponibilidade_mensal_id: { type: "integer", description: "ID da disponibilidade" },
          salaidsala: { type: "integer", description: "ID da sala" },
          observacoes: { type: "string", description: "Observações" },
          privacidade: { type: "boolean", description: "Aula privada ou pública" },
          alunoutilizadoriduser: { type: "integer", description: "ID do aluno" }
        },
        required: ["data", "horainicio", "duracaoaula"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    },
    preHandler: authorizeRole('ENCARREGADO')
  }, submeterPedidoAula);

  fastify.post('/:id/approve', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Aprovar um pedido de aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do pedido de aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          salaId: { type: "integer", description: "ID da sala para a aula" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    },
    preHandler: authorizeRole('DIRECAO')
  }, approvePedidoAula);

  fastify.post('/:id/reject', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Rejeitar um pedido de aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do pedido de aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          motivo: { type: "string", description: "Motivo da rejeição" }
        },
        required: ["motivo"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    },
    preHandler: authorizeRole('DIRECAO')
  }, rejectPedidoAula);

  fastify.delete('/:id', {
    schema: {
      tags: ["Pedidos de Aula"],
      description: "Eliminar um pedido de aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID do pedido de aula" }
        },
        required: ["id"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    },
    preHandler: authorizeRole('DIRECAO')
  }, deletePedidoAula);
}