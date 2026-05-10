import * as direcaoService from "../services/direcao.service.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function direcaoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", async (req, reply) => {
    try {
      if (req.user.role !== "DIRECAO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await direcaoService.getAllAulas();
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/aulas/pending", async (req, reply) => {
    try {
      if (req.user.role !== "DIRECAO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await direcaoService.getPendingAulas();
      return reply.send({ success: true, data: aulas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:id/approve", async (req, reply) => {
    try {
      if (req.user.role !== "DIRECAO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const { salaId } = req.body || {};
      const result = await direcaoService.approveAula(id, salaId);
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err.message || '';
      if (message.includes('já') || message.includes('aprovado') || message.includes('confirmado') || message.includes('estado')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:id/reject", async (req, reply) => {
    try {
      if (req.user.role !== "DIRECAO") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return reply.status(400).send({ success: false, error: "Motivo de rejeição obrigatório" });
      }

      const result = await direcaoService.rejectAula(id, motivo);
      return reply.send({ success: true, data: result });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/aulas/:id/realizado", async (req, reply) => {
    try {
      if (req.user.role !== "DIRECAO" && req.user.role !== "PROFESSOR") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const { id } = req.params;
      const result = await direcaoService.confirmarAulaRealizada(id);
      return reply.send({ success: true, data: result });
    } catch (err) {
      const message = err.message || '';
      if (message.includes('passado') || message.includes('futuro') || message.includes('realizar')) {
        return reply.status(400).send({ success: false, error: message });
      }
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}