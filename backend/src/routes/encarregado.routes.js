import * as encarregadoService from "../services/encarregado.service.js";
import prisma from "../config/db.js";
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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await encarregadoService.getEncarregadoAulas(req.user.id);
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { getAllDisponibilidadesMensais } = await import("../services/aluno.service.js");
      const disponibilidades = await getAllDisponibilidadesMensais();
      const formatted = disponibilidades.map(d => ({
        id: String(d.iddisponibilidade_mensal),
        professorId: String(d.professorutilizadoriduser),
        professorNome: d.professor_nome || '',
        data: d.data ? new Date(d.data).toISOString().split('T')[0] : '',
        horaInicio: d.horainicio instanceof Date ? d.horainicio.toISOString().substring(11, 16) : String(d.horainicio).substring(0, 5),
        horaFim: d.horafim instanceof Date ? d.horafim.toISOString().substring(11, 16) : String(d.horafim).substring(0, 5),
        modalidadeId: String(d.idmodalidadeprofessor),
        modalidade: d.modalidades_nome || '',
      }));
      return reply.send({ success: true, data: formatted });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const grupos = await encarregadoService.getGruposAbertos();
      return reply.send({ success: true, data: grupos });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { alunoId } = req.body;
      if (!alunoId) return reply.status(400).send({ success: false, error: "alunoId obrigatório" });
      const result = await encarregadoService.marcarAula(
        parseInt(req.params.pedidoId), parseInt(alunoId), req.user.id
      );
      return reply.status(201).send({ success: true, data: result });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

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
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const result = await encarregadoService.cancelarParticipacaoAula(
        req.params.pedidoId, req.user.id
      );
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err.message || '';
      if (message.includes('encontrado') || message.includes('permissão') || message.includes('Só pode')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

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
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { data, horainicio, duracaoaula, disponibilidade_mensal_id, professor_utilizador_id, alunoutilizadoriduser, salaidsala, privacidade } = req.body;

      if (!data || !horainicio || !salaidsala) {
        return reply.status(400).send({ success: false, error: "Campos obrigatórios em falta" });
      }

      const result = await encarregadoService.submeterPedidoAula(
        { data, horainicio, duracaoaula, disponibilidade_mensal_id, professor_utilizador_id, alunoutilizadoriduser, salaidsala, privacidade },
        req.user.id
      );
      
      return reply.status(201).send({ success: true, data: result });
    } catch (err) {
      const message = err.message || '';
      if (message.includes('passado') || message.includes('hora') || message.includes('obrigatório') || message.includes('formato')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}