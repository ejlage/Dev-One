import * as alquuerController from "../controllers/aluguerFigurino.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function aluguerFigurinoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", alquuerController.getAllTransacoes);
  fastify.get("/estados", alquuerController.getEstados);
  fastify.get("/:id", alquuerController.getTransacaoById);
  fastify.get("/anuncio/:anuncioId/disponibilidade", alquuerController.getDisponibilidade);
  fastify.get("/user/reservas", alquuerController.getReservasByUser);
  
  fastify.post("/", async (req, reply) => {
    return alquuerController.createTransacao(req, reply);
  });
  
  fastify.put("/:id/status", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return alquuerController.updateTransacaoStatus(req, reply);
  });
  
  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas direction pode eliminar" });
    }
    return alquuerController.deleteTransacao(req, reply);
  });
}