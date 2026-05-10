import * as professorController from "../controllers/professor.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function professorRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/disponibilidades", {
    schema: {
      tags: ["Professor"],
      description: "Listar disponibilidades do professor autenticado",
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
                  data: { type: "string" },
                  horainicio: { type: "string" },
                  horafim: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  }, professorController.getDisponibilidades);

  fastify.get("/modalidades", {
    schema: {
      tags: ["Professor"],
      description: "Listar modalidades do professor autenticado",
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
  }, professorController.getModalidades);

  fastify.get("/aulas", {
    schema: {
      tags: ["Professor"],
      description: "Listar aulas do professor autenticado",
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
  }, professorController.getAulas);

  fastify.post("/disponibilidades", {
    schema: {
      tags: ["Professor"],
      description: "Criar nova disponibilidade",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["modalidadesprofessoridmodalidadeprofessor", "data", "horainicio", "horafim"],
        properties: {
          modalidadesprofessoridmodalidadeprofessor: { type: "integer" },
          data: { type: "string" },
          horainicio: { type: "string" },
          horafim: { type: "string" },
          salaid: { type: "integer" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" }
          }
        }
      }
    }
  }, professorController.createDisponibilidade);

  fastify.put("/disponibilidades/:id", {
    schema: {
      tags: ["Professor"],
      description: "Atualizar disponibilidade existente",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          data: { type: "string" },
          horainicio: { type: "string" },
          horafim: { type: "string" },
          ativo: { type: "boolean" },
          salaid: { type: "integer" }
        }
      },
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
  }, professorController.updateDisponibilidade);

  fastify.delete("/disponibilidades/:id", {
    schema: {
      tags: ["Professor"],
      description: "Eliminar disponibilidade",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, professorController.deleteDisponibilidade);

  fastify.get("/disponibilidades/all", {
    schema: {
      tags: ["Professor"],
      description: "Listar todas as disponibilidades de todos os professores",
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
  }, professorController.getAllDisponibilidades);

  fastify.get("/dias-semana", {
    schema: {
      tags: ["Professor"],
      description: "Listar dias da semana",
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
  }, professorController.getDiasSemana);
}
