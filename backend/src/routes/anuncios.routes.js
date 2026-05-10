import * as anunciosController from "../controllers/anuncios.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function anunciosRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", anunciosController.getAllAnuncios);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso não autorizado" });
    }
    return anunciosController.createAnuncio(req, reply);
  });

  fastify.get("/:id", anunciosController.getAnuncioById);

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return anunciosController.updateAnuncio(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return anunciosController.deleteAnuncio(req, reply);
  });

  fastify.put("/:id/approve", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return anunciosController.approveAnuncio(req, reply);
  });

  fastify.put("/:id/reject", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return anunciosController.rejectAnuncio(req, reply);
  });
}