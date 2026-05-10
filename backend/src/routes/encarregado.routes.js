import * as encarregadoController from "../controllers/encarregado.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function encarregadoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", {
    schema: {
      tags: ["Encarregado"],
      description: "Listar aulas do encarregado de educação",
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
  }, encarregadoController.getAulas);

  fastify.get("/disponibilidades", {
    schema: {
      tags: ["Encarregado"],
      description: "Listar disponibilidades disponíveis",
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
  }, encarregadoController.getDisponibilidades);

  fastify.get("/aulas/open", {
    schema: {
      tags: ["Encarregado"],
      description: "Listar grupos/turmas abertas para inscrição",
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
  }, encarregadoController.getAulasOpen);

  fastify.post("/aulas/:pedidoId/participar", {
    schema: {
      tags: ["Encarregado"],
      description: "Participar numa aula como participante",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          pedidoId: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["alunoId"],
        properties: {
          alunoId: { type: "integer" }
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
  }, encarregadoController.participar);

  fastify.post("/aulas/:pedidoId/cancelar-participacao", {
    schema: {
      tags: ["Encarregado"],
      description: "Cancelar participação numa aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          pedidoId: { type: "string" }
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
  }, encarregadoController.cancelarParticipacao);

  fastify.post("/aulas", {
    schema: {
      tags: ["Encarregado"],
      description: "Submeter novo pedido de aula",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["data", "horainicio", "salaidsala"],
        properties: {
          data: { type: "string" },
          horainicio: { type: "string" },
          duracaoaula: { type: "integer" },
          disponibilidade_mensal_id: { type: "integer" },
          professor_utilizador_id: { type: "integer" },
          alunoutilizadoriduser: { type: "integer" },
          salaidsala: { type: "integer" },
          privacidade: { type: "boolean" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", additionalProperties: true }
          }
        }
      }
    }
  }, encarregadoController.submeterPedidoAula);
}
