import { getAuditLogs } from "../services/audit.service.js";
import { hasRole } from "../middleware/auth.middleware.js";

export default async function auditRoutes(fastify) {
  fastify.addHook("onRequest", async (req) => {
    if (!req.user) {
      throw { statusCode: 401, message: "Não autenticado" };
    }
    if (!hasRole(req.user.role, "DIRECAO")) {
      throw { statusCode: 403, message: "Acesso negado" };
    }
  });

  fastify.get("/", {
    schema: {
      tags: ["Auditoria"],
      description: "Listar logs de auditoria",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          utilizadorId: { type: "string", description: "Filtrar por ID de utilizador" },
          acao: { type: "string", description: "Filtrar por tipo de ação" },
          entidade: { type: "string", description: "Filtrar por entidade" },
          dataInicio: { type: "string", description: "Data de inicio (ISO)" },
          dataFim: { type: "string", description: "Data de fim (ISO)" },
          limit: { type: "integer", description: "Limite de resultados", default: 100 },
          offset: { type: "integer", description: "Offset de paginação", default: 0 }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
            total: { type: "integer" }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const { utilizadorId, acao, entidade, dataInicio, dataFim, limit, offset } = req.query;
      const result = await getAuditLogs({
        utilizadorId: utilizadorId ? parseInt(utilizadorId) : undefined,
        acao,
        entidade,
        dataInicio,
        dataFim,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0,
      });
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}