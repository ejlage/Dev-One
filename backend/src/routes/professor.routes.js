import * as professorService from "../services/professor.service.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

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
      return reply.send({ success: true, data: disponibilidades });
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
      const { modalidadesprofessoridmodalidadeprofessor, diadasemana, horainicio, horafim } = req.body;
      
      if (!modalidadesprofessoridmodalidadeprofessor || !diadasemana || !horainicio || !horafim) {
        return reply.status(400).send({ success: false, error: "Campos obrigatórios em falta" });
      }
      
      if (diadasemana < 1 || diadasemana > 6) {
        return reply.status(400).send({ success: false, error: "Dia da semana inválido (1-6)" });
      }
      
      const result = await professorService.createDisponibilidadeMensal({
        professorutilizadoriduser: req.user.id,
        modalidadesprofessoridmodalidadeprofessor,
        diadasemana,
        horainicio,
        horafim
      });
      
      return reply.status(201).send({ success: true, data: result });
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
      const { diadasemana, horainicio, horafim, ativo } = req.body;
      
      if (diadasemana && (diadasemana < 1 || diadasemana > 6)) {
        return reply.status(400).send({ success: false, error: "Dia da semana inválido (1-6)" });
      }
      
      const result = await professorService.updateDisponibilidadeMensal(id, {
        diadasemana: diadasemana || null,
        horainicio: horainicio || null,
        horafim: horafim || null,
        ativo: ativo !== undefined ? ativo : true
      });
      
      return reply.send({ success: true, data: result });
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

  fastify.get("/dias-semana", async (req, reply) => {
    try {
      const dias = professorService.getDiasSemana();
      return reply.send({ success: true, data: dias });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}