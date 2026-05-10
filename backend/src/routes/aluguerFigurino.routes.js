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
        required: ["anuncioidanuncio", "quantidade"],
        properties: {
          anuncioidanuncio: { type: "integer" },
          datatransacao: { type: "string", description: "Data da transação (YYYY-MM-DD), omite para usar data atual" },
          datainicio: { type: "string", description: "Data de início do aluguer (YYYY-MM-DD)" },
          datafim: { type: "string", description: "Data de fim do aluguer (YYYY-MM-DD)" },
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
    if (!hasRole(req.user.normalizedRoles, "ENCARREGADO", "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.submeterPedidoReserva(req, reply);
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

  fastify.post("/:id/confirmar", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Utilizador confirma reserva após aprovação da Direção",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: { id: { type: "integer" } },
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "ENCARREGADO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.confirmarReserva(req, reply);
  });

  fastify.post("/:id/cancelar-reserva", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Utilizador cancela reserva",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: { id: { type: "integer" } },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          motivo: { type: "string", description: "Motivo do cancelamento" }
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
    if (!hasRole(req.user.normalizedRoles, "ENCARREGADO", "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.cancelarReserva(req, reply);
  });

  fastify.patch("/:id/devolver", {
    schema: {
      tags: ["Aluguer de Figurinos"],
      description: "Marcar aluguer como devolvido (concluído)",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: { id: { type: "integer" } },
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.devolverAluguer(req, reply);
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