import * as professorAulasController from "../controllers/professor-aulas.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function professorAulasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", {
    schema: {
      tags: ["Professor"],
      description: "Listar aulas do professor autenticado",
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
  }, professorAulasController.getAulas);

  fastify.put("/aulas/:id/status", {
    schema: {
      tags: ["Professor"],
      description: "Atualizar status de uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["CONFIRMADA", "REALIZADA", "CANCELADA"] }
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
  }, professorAulasController.updateStatus);
}
