import * as usersController from "../controllers/users.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";
import prisma from "../config/db.js";

export default async function usersRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", usersController.getAllUsers);

  fastify.get("/modalidades", async (req, reply) => {
    try {
      const modalidades = await prisma.modalidade.findMany({ orderBy: { nome: 'asc' } });
      return reply.send({ success: true, data: modalidades });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/:id", async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    return usersController.getUserById(req, reply);
  });

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return usersController.createUser(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    if (!hasRole(req.user.role, "DIRECAO") && req.user.id !== req.params.id) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return usersController.updateUser(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    if (req.user.role !== "DIRECAO") {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return usersController.deleteUser(req, reply);
  });

  fastify.get("/:id/modalidades", async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    return usersController.getUserModalidades(req, reply);
  });
}