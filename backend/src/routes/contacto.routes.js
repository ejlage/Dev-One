import * as contactoController from "../controllers/contacto.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function contactoRoutes(fastify) {
  fastify.post("/", contactoController.submitContact);

  fastify.get("/", async (req, reply) => {
    await verifyToken(req, reply);
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return contactoController.getContactos(req, reply);
  });
}
