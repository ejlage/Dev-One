import * as professorService from "../services/professor.service.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

const formatTime = (v) => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().substring(11, 16);
  const s = String(v);
  return s.includes('T') ? s.substring(11, 16) : s.substring(0, 5);
};
const formatDisp = (d) => ({
  id: String(d.iddisponibilidade_mensal),
  ...d,
  data: d.data ? new Date(d.data).toISOString().split('T')[0] : '',
  horainicio: formatTime(d.horainicio),
  horafim: formatTime(d.horafim),
});

export default async function professorRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/disponibilidades", {
    schema: {
      tags: ["Professor"],
      description: "Listar disponibilidades do professor autenticado",
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
                  data: { type: "string" },
                  horainicio: { type: "string" },
                  horafim: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      if (!req.user.normalizedRoles.includes("PROFESSOR")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const disponibilidades = await professorService.verificarDisponibilidadeProfessor(req.user.id);
      return reply.send({ success: true, data: disponibilidades.map(formatDisp) });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/modalidades", {
    schema: {
      tags: ["Professor"],
      description: "Listar modalidades do professor autenticado",
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
      const modalidades = await professorService.getProfessorModalidades(req.user.id);
      return reply.send({ success: true, data: modalidades });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
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
      const aulas = await professorService.getProfessorAulas(req.user.id);
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/disponibilidades", {
    schema: {
      tags: ["Professor"],
      description: "Criar nova disponibilidade",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["modalidadesprofessoridmodalidadeprofessor", "data", "horainicio", "horafim"],
        properties: {
          modalidadesprofessoridmodalidadeprofessor: { type: "integer" },
          data: { type: "string" },
          horainicio: { type: "string" },
          horafim: { type: "string" },
          salaid: { type: "integer" }
        }
      },
      response: {
        201: {
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
      const { modalidadesprofessoridmodalidadeprofessor, data, horainicio, horafim, salaid } = req.body;
      
      if (!modalidadesprofessoridmodalidadeprofessor || !data || !horainicio || !horafim) {
        return reply.status(400).send({ success: false, error: "Campos obrigatórios em falta" });
      }
      
      const result = await professorService.createDisponibilidadeMensal({
        professorutilizadoriduser: req.user.id,
        modalidadesprofessoridmodalidadeprofessor,
        data,
        horainicio,
        horafim,
        salaid: salaid || null
      });
      
      return reply.status(201).send({ success: true, data: result.map(formatDisp) });
    } catch (err) {
      const message = err.message || '';
      // Erros de validação de negócio retornam códigos apropriados
      if (message.includes('Já existe') || message.includes('overlap') || message.includes('conflito')) {
        return reply.status(409).send({ success: false, error: message });
      }
      if (message.includes('passado') || message.includes('obrigatório') || message.includes('formato')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.put("/disponibilidades/:id", {
    schema: {
      tags: ["Professor"],
      description: "Atualizar disponibilidade existente",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          data: { type: "string" },
          horainicio: { type: "string" },
          horafim: { type: "string" },
          ativo: { type: "boolean" },
          salaid: { type: "integer" }
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
    try {
      if (!req.user.normalizedRoles.includes("PROFESSOR")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const { data, horainicio, horafim, ativo, salaid } = req.body;
      
      const result = await professorService.updateDisponibilidadeMensal(id, {
        data: data || null,
        horainicio: horainicio || null,
        horafim: horafim || null,
        ativo: ativo !== undefined ? ativo : true
      });
      
      return reply.send({ success: true, data: result.map(formatDisp) });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.delete("/disponibilidades/:id", {
    schema: {
      tags: ["Professor"],
      description: "Eliminar disponibilidade",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
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
    try {
      if (!req.user.normalizedRoles.includes("PROFESSOR")) {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      await professorService.deleteDisponibilidadeMensal(id);
      return reply.send({ success: true, message: "Disponibilidade eliminada" });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/disponibilidades/all", {
    schema: {
      tags: ["Professor"],
      description: "Listar todas as disponibilidades de todos os professores",
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
      const disponibilidades = await professorService.getAllDisponibilidadesMensais();
      const formatted = disponibilidades.map(d => {
        const totalMinutos = d.total_minutos || (d.horainicio && d.horafim ? 
          (parseInt(d.horafim.split(':')[0])*60 + parseInt(d.horafim.split(':')[1]) - 
           parseInt(d.horainicio.split(':')[0])*60 - parseInt(d.horainicio.split(':')[1])) : 60);
        const minutosOcupados = parseInt(d.minutos_ocupados) || 0;
        const maxDuracao = Math.max(0, totalMinutos - minutosOcupados);

        // Effective start time advances by minutos_ocupados
        const horaInicioBase = formatTime(d.horainicio);
        let effectiveHoraInicio = horaInicioBase;
        if (minutosOcupados > 0) {
          const [h, m] = horaInicioBase.split(':').map(Number);
          const totalMin = h * 60 + m + minutosOcupados;
          effectiveHoraInicio = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
        }

        return {
          id: String(d.iddisponibilidade_mensal),
          professorId: String(d.professorutilizadoriduser),
          professorNome: d.professor_nome || '',
          data: d.data ? new Date(d.data).toISOString().split('T')[0] : '',
          horaInicio: effectiveHoraInicio,
          horaFim: formatTime(d.horafim),
          duracao: totalMinutos,
          maxDuracao: maxDuracao,
          minutosOcupados,
          modalidadeId: String(d.idmodalidadeprofessor),
          modalidade: d.modalidades_nome || '',
          estudioId: d.salaid ? String(d.salaid) : '',
          estudioNome: d.estudio_nome ? String(d.estudio_nome) : '',
        };
      });
      return reply.send({ success: true, data: formatted });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/dias-semana", {
    schema: {
      tags: ["Professor"],
      description: "Listar dias da semana",
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
      const dias = professorService.getDiasSemana();
      return reply.send({ success: true, data: dias });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}