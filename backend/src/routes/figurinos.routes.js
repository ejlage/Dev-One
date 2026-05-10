import * as figurinosController from "../controllers/figurinos.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function figurinosRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", figurinosController.getAllFigurinos);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return figurinosController.createFigurino(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return figurinosController.updateFigurino(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return figurinosController.deleteFigurino(req, reply);
  });
}