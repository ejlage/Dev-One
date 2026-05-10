import * as aulasController from "../controllers/aulas.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function aulasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", aulasController.getAllAulas);

  fastify.get("/:id", aulasController.getAulaById);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return aulasController.createAula(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return aulasController.updateAula(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return aulasController.deleteAula(req, reply);
  });

  fastify.post("/:id/confirm", aulasController.confirmAula);

  fastify.post("/:id/cancel", aulasController.cancelAula);

  fastify.put("/:id/remarcar", aulasController.remarcarAula);

  fastify.put("/:id/sugerir-nova-data", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Apenas professores podem sugerir novas datas" });
    }
    return aulasController.sugerirNovaData(req, reply);
  });

  fastify.post("/:id/join", aulasController.joinAula);
}