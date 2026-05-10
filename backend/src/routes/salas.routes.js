import * as salasController from "../controllers/salas.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function salasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Salas"],
      description: "Listar todas as salas/estúdios",
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
  }, salasController.getAllSalas);

  fastify.post("/", {
    schema: {
      tags: ["Salas"],
      description: "Criar nova sala/estúdio",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["nome", "localizacao"],
        properties: {
          nome: { type: "string", description: "Nome da sala/estúdio" },
          localizacao: { type: "string", description: "Localização da sala" },
          capacidade: { type: "integer", description: "Capacidade máxima de pessoas" },
          descricao: { type: "string", description: "Descrição da sala" }
        }
      },
      response: {
        201: {
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
    return salasController.createSala(req, reply);
  });

  fastify.put("/:id", {
    schema: {
      tags: ["Salas"],
      description: "Atualizar sala/estúdio",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da sala" }
        }
      },
      body: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome da sala/estúdio" },
          localizacao: { type: "string", description: "Localização da sala" },
          capacidade: { type: "integer", description: "Capacidade máxima de pessoas" },
          descricao: { type: "string", description: "Descrição da sala" }
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
    return salasController.updateSala(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Salas"],
      description: "Eliminar sala/estúdio",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da sala" }
        }
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return salasController.deleteSala(req, reply);
  });

  fastify.get("/:id/availability", {
    schema: {
      tags: ["Salas"],
      description: "Obter disponibilidade de uma sala",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da sala" }
        }
      },
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
  }, salasController.getSalaAvailability);

  fastify.post("/consultar", {
    schema: {
      tags: ["Salas"],
      description: "Consultar salas disponíveis",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          data: { type: "string", description: "Data para consulta (YYYY-MM-DD)" },
          horaInicio: { type: "string", description: "Hora de início (HH:MM)" },
          horaFim: { type: "string", description: "Hora de fim (HH:MM)" },
          modalidade: { type: "string", description: "Modalidade pretendida" }
        }
      },
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "ENCARREGADO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return salasController.consultarSalaDisponivel(req, reply);
  });
}