import * as alquuerController from "../controllers/aluguerFigurino.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function aluguerFigurinoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Listar todas as transações de aluguer",
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
  }, alquuerController.getAllTransacoes);

  fastify.get("/estados", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Listar estados disponíveis para transações",
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
  }, alquuerController.getEstados);

  fastify.get("/:id", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Obter uma transação de aluguer por ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
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
    }
  }, alquuerController.getTransacaoById);

  fastify.get("/anuncio/:anuncioId/disponibilidade", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Verificar disponibilidade de um figurino para aluguer",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          anuncioId: { type: "integer" }
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
    }
  }, alquuerController.getDisponibilidade);

  fastify.get("/user/reservas", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Listar reservas do utilizador autenticado",
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
  }, alquuerController.getReservasByUser);

  fastify.post("/", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Criar uma nova reserva de aluguer",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["anuncioidanuncio", "datainicio", "datafim", "quantidade"],
        properties: {
          anuncioidanuncio: { type: "integer" },
          datainicio: { type: "string" },
          datafim: { type: "string" },
          quantidade: { type: "integer" },
          valor: { type: "number" },
          itemfigurinoiditem: { type: "integer" },
          encarregadoeducacaoutilizadoriduser: { type: "integer" },
          professorutilizadoriduser: { type: "integer" }
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
    }
  }, async (req, reply) => {
    return alquuerController.submeterPedidoReserva(req, reply);
  });

  fastify.put("/:id/status", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Atualizar o status de uma reserva",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      body: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string" }
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
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.avaliarPedidoReserva(req, reply);
  });

  fastify.put("/:id/avaliar", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Avaliar uma reserva de aluguer",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      body: {
        type: "object",
        required: ["decisao"],
        properties: {
          decisao: { type: "string" },
          motivorejeicao: { type: "string" }
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
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.avaliarPedidoReserva(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Eliminar uma transação de aluguer",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas direction pode eliminar" });
    }
    return alquuerController.deleteTransacao(req, reply);
  });
}