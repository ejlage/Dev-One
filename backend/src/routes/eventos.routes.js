import * as eventosController from "../controllers/eventos.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function eventosRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", eventosController.getAllEventos);
  fastify.get("/:id", eventosController.getEventoById);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return eventosController.createEvento(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return eventosController.updateEvento(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return eventosController.deleteEvento(req, reply);
  });

  fastify.put("/:id/publish", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return eventosController.publishEvento(req, reply);
  });
}