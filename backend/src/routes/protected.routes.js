import { getProfile } from "../controllers/protected.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function (fastify) {

  // =========================
  // PROFILE (PROTEGIDA)
  // =========================
  fastify.get("/profile", {
    schema: {
      tags: ["Perfil"],
      description: "Obtém os dados do utilizador autenticado",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            user: { type: "object" }
          }
        }
      }
    },
    preHandler: verifyToken
  }, getProfile);

}
