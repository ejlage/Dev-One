import * as figurinosController from "../controllers/figurinos.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function figurinosRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", figurinosController.getAllFigurinos);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.createFigurino(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.updateFigurino(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.deleteFigurino(req, reply);
  });

  fastify.post("/stock", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.createFigurinoStock(req, reply);
  });

  fastify.patch("/:id/status", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.updateFigurinoStatusSimple(req, reply);
  });

  fastify.get("/lookup", figurinosController.getLookupData);
}