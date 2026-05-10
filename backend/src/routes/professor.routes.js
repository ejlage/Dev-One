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

  fastify.get("/disponibilidades", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const disponibilidades = await professorService.getDisponibilidadesMensais(req.user.id);
      return reply.send({ success: true, data: disponibilidades.map(formatDisp) });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/modalidades", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const modalidades = await professorService.getProfessorModalidades(req.user.id);
      return reply.send({ success: true, data: modalidades });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/aulas", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await professorService.getProfessorAulas(req.user.id);
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/disponibilidades", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
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
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.put("/disponibilidades/:id", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
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

  fastify.delete("/disponibilidades/:id", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      await professorService.deleteDisponibilidadeMensal(id);
      return reply.send({ success: true, message: "Disponibilidade eliminada" });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/disponibilidades/all", async (req, reply) => {
    try {
      const disponibilidades = await professorService.getAllDisponibilidadesMensais();
      const formatted = disponibilidades.map(d => {
        const totalMinutos = d.total_minutos || (d.horainicio && d.horafim ? 
          (parseInt(d.horafim.split(':')[0])*60 + parseInt(d.horafim.split(':')[1]) - 
           parseInt(d.horainicio.split(':')[0])*60 - parseInt(d.horainicio.split(':')[1])) : 60);
        const minutosOcupados = parseInt(d.minutos_ocupados) || 0;
        const maxDuracao = Math.max(0, totalMinutos - minutosOcupados);
        
        return {
          id: String(d.iddisponibilidade_mensal),
          professorId: String(d.professorutilizadoriduser),
          professorNome: d.professor_nome || '',
          data: d.data ? new Date(d.data).toISOString().split('T')[0] : '',
          horaInicio: formatTime(d.horainicio),
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

  fastify.get("/dias-semana", async (req, reply) => {
    try {
      const dias = professorService.getDiasSemana();
      return reply.send({ success: true, data: dias });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}