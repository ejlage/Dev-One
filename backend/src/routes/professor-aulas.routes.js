import * as professorAulasService from "../services/professor-aulas.service.js";
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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("PROFESSOR")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await professorAulasService.getProfessorAulas(req.user.id);
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("PROFESSOR")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['CONFIRMADA', 'REALIZADA', 'CANCELADA'].includes(status)) {
        return reply.status(400).send({ success: false, error: "Status inválido" });
      }
      
      const result = await professorAulasService.updateAulaStatus(id, status);
      return reply.send({ success: true, data: result });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}