import { verifyToken } from "../middleware/auth.middleware.js";
import aulasRoutes from "./aulas.routes.js";

export default async function (fastify) {

  // =========================
  // PROFILE (PROTEGIDA)
  // =========================
  fastify.get("/profile", {
    preHandler: verifyToken
  }, async (req, reply) => {
    return {
      message: "Acesso autorizado",
      user: req.user
    };
  });

  //t11-t16
  fastify.register(aulasRoutes);
}

