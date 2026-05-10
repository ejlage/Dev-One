import * as direcaoService from "../services/direcao.service.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { createAuditLog } from "../services/audit.service.js";

export default async function direcaoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", {
    schema: {
      tags: ["Direção"],
      description: "Consultar todas as aulas",
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
      if (!req.user.normalizedRoles.includes("DIRECAO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await direcaoService.consultarAula();
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/aulas/pending", {
    schema: {
      tags: ["Direção"],
      description: "Listar pedidos de aula pendentes",
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
      if (!req.user.normalizedRoles.includes("DIRECAO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await direcaoService.getPendingAulas();
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:id/approve", {
    schema: {
      tags: ["Direção"],
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
    }
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("DIRECAO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const { salaId } = req.body || {};
      const result = await direcaoService.avaliarPedido(id, 'aprovar', salaId);
      await createAuditLog(req.user.id, req.user.nome, 'APPROVE', 'PedidoAula', parseInt(id), 'Aula aprovada');
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err.message || '';
      if (message.includes('já') || message.includes('aprovado') || message.includes('confirmado') || message.includes('estado')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:id/reject", {
    schema: {
      tags: ["Direção"],
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
    }
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("DIRECAO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return reply.status(400).send({ success: false, error: "Motivo de rejeição obrigatório" });
      }

      const result = await direcaoService.avaliarPedido(id, 'rejeitar', null, motivo);
      await createAuditLog(req.user.id, req.user.nome, 'REJECT', 'PedidoAula', parseInt(id), `Aula rejeitada: ${motivo}`);
      return reply.send({ success: true, data: result });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:id/realizado", {
    schema: {
      tags: ["Direção"],
      description: "Confirmar realização de uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("DIRECAO") && !req.user.normalizedRoles.includes("PROFESSOR")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const result = await direcaoService.confirmarAulaRealizada(id);
      await createAuditLog(req.user.id, req.user.nome, 'UPDATE', 'Aula', parseInt(id), 'Realização confirmada');
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err.message || '';
      if (message.includes('passado') || message.includes('futuro') || message.includes('realizar')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/relatorio/aulas/:ano/:mes", {
    schema: {
      tags: ["Direção"],
      description: "Obter relatório de aulas por mês",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          ano: { type: "string", description: "Ano (ex: 2026)" },
          mes: { type: "string", description: "Mês (01-12)" }
        },
        required: ["ano", "mes"]
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
      if (!req.user.normalizedRoles.includes("DIRECAO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { ano, mes } = req.params;
      const relatorio = await direcaoService.getRelatorioAulasMensal(ano, mes);
      return reply.send({ success: true, data: relatorio });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/relatorio/presencas", {
    schema: {
      tags: ["Direção"],
      description: "Obter relatório de presenças por período",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          datainicio: { type: "string", description: "Data de início (YYYY-MM-DD)" },
          datafim: { type: "string", description: "Data de fim (YYYY-MM-DD)" }
        },
        required: ["datainicio", "datafim"]
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
      if (!req.user.normalizedRoles.includes("DIRECAO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { datainicio, datafim } = req.query;
      if (!datainicio || !datafim) {
        return reply.status(400).send({ success: false, error: "datainicio e datafim obrigatórios" });
      }
      const relatorio = await direcaoService.getRelatorioPresencas(datainicio, datafim);
      return reply.send({ success: true, data: relatorio });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}