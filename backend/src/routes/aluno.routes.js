import * as alunoController from "../controllers/aluno.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function alunoRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", {
    schema: {
      tags: ["Aluno"],
      description: "Listar aulas do aluno autenticado",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" }
          }
        }
      }
    }
  }, alunoController.getAulas);

  fastify.get("/disponibilidades", {
    schema: {
      tags: ["Aluno"],
      description: "Listar todas as disponibilidades disponíveis para alunos",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  professorId: { type: "string" },
                  professorNome: { type: "string" },
                  data: { type: "string" },
                  horaInicio: { type: "string" },
                  horaFim: { type: "string" },
                  modalidadeId: { type: "string" },
                  modalidade: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  }, alunoController.getDisponibilidades);
}
