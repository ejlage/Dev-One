import * as salasController from "../controllers/salas.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function salasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", salasController.getAllSalas);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return salasController.createSala(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return salasController.updateSala(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return salasController.deleteSala(req, reply);
  });

  fastify.get("/:id/availability", salasController.getSalaAvailability);
}