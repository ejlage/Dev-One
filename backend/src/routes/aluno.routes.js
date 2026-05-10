import * as alunoService from "../services/aluno.service.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function alunoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", {
    schema: {
      tags: ["Aluno"],
      description: "Listar aulas do aluno autenticado",
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
      if (!req.user.normalizedRoles.includes("ALUNO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await alunoService.getAlunoAulas(req.user.id);
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/disponibilidades", {
    schema: {
      tags: ["Aluno"],
      description: "Listar todas as disponibilidades disponíveis para alunos",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  professorId: { type: "string" },
                  professorNome: { type: "string" },
                  data: { type: "string" },
                  horaInicio: { type: "string" },
                  horaFim: { type: "string" },
                  modalidadeId: { type: "string" },
                  modalidade: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("ALUNO")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const disponibilidades = await alunoService.getAllDisponibilidadesMensais();
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
}