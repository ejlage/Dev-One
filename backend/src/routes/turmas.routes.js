import * as turmasController from "../controllers/turmas.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function turmasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", turmasController.getAllTurmas);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.createTurma(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.updateTurma(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.deleteTurma(req, reply);
  });

  fastify.put("/:id/enroll", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.enrollAluno(req, reply);
  });

  fastify.put("/:id/close", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.closeTurma(req, reply);
  });

  fastify.put("/:id/archive", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.archiveTurma(req, reply);
  });

  fastify.delete("/:id/alunos/:alunoId", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negated" });
    }
    return turmasController.removeAluno(req, reply);
  });
}