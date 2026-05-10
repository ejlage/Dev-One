import * as encarregadoService from "../services/encarregado.service.js";
import prisma from "../config/db.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function encarregadoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", async (req, reply) => {
    try {
      if (req.user.role !== "ENCARREGADO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await encarregadoService.getEncarregadoAulas(req.user.id);
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/disponibilidades", async (req, reply) => {
    try {
      if (req.user.role !== "ENCARREGADO") {
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

  fastify.get("/aulas/open", async (req, reply) => {
    try {
      if (req.user.role !== "ENCARREGADO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const grupos = await encarregadoService.getGruposAbertos();
      return reply.send({ success: true, data: grupos });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:pedidoId/participar", async (req, reply) => {
    try {
      if (req.user.role !== "ENCARREGADO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { alunoId } = req.body;
      if (!alunoId) return reply.status(400).send({ success: false, error: "alunoId obrigatório" });
      const result = await encarregadoService.participarAula(
        parseInt(req.params.pedidoId), parseInt(alunoId), req.user.id
      );
      return reply.status(201).send({ success: true, data: result });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas", async (req, reply) => {
    try {
      if (req.user.role !== "ENCARREGADO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { data, horainicio, duracaoaula, disponibilidade_mensal_id, salaidsala, privacidade } = req.body;

      if (!data || !horainicio || !salaidsala) {
        return reply.status(400).send({ success: false, error: "Campos obrigatórios em falta" });
      }

      const result = await encarregadoService.createPedidoAula(
        { data, horainicio, duracaoaula, disponibilidade_mensal_id, salaidsala, privacidade },
        req.user.id
      );
      
      return reply.status(201).send({ success: true, data: result });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}