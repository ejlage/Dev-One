import * as usersController from "../controllers/users.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";
import prisma from "../config/db.js";

export default async function usersRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Utilizadores"],
      description: "Lista todos os utilizadores",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { type: "object" } }
          }
        },
        500: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, usersController.getAllUsers);

  fastify.get("/modalidades", {
    schema: {
      tags: ["Utilizadores"],
      description: "Lista todas as modalidades disponíveis",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { type: "object" } }
          }
        },
        500: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const modalidades = await prisma.modalidade.findMany({ orderBy: { nome: 'asc' } });
      return reply.send({ success: true, data: modalidades });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/:id", {
    schema: {
      tags: ["Utilizadores"],
      description: "Obtém um utilizador pelo ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", description: "ID do utilizador" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        },
        404: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        },
        500: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    return usersController.getUserById(req, reply);
  });

  fastify.post("/", {
    schema: {
      tags: ["Utilizadores"],
      description: "Cria um novo utilizador (apenas Direção)",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["nome", "email", "telemovel", "password", "role"],
        properties: {
          nome: { type: "string", description: "Nome completo do utilizador" },
          email: { type: "string", format: "email", description: "Email do utilizador" },
          telemovel: { type: "string", description: "Número de telemóvel" },
          password: { type: "string", minLength: 6, description: "Password inicial" },
          role: { type: "string", description: "Role do utilizador (ALUNO, ENCARREGADO, PROFESSOR, DIRECAO)" },
          modalidades: { type: "array", items: { type: "integer" }, description: "IDs das modalidades" },
          encarregadoId: { type: "integer", description: "ID do encarregado (obrigatório para role ALUNO)" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        },
        403: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return usersController.createUser(req, reply);
  });

  fastify.put("/:id", {
    schema: {
      tags: ["Utilizadores"],
      description: "Atualiza um utilizador pelo ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", description: "ID do utilizador" }
        }
      },
      body: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome completo" },
          email: { type: "string", format: "email", description: "Email" },
          telemovel: { type: "string", description: "Telemóvel" },
          password: { type: "string", minLength: 6, description: "Nova password" },
          role: { type: "string", description: "Role do utilizador" },
          estado: { type: "boolean", description: "Estado ativo" },
          modalidades: { type: "array", items: { type: "integer" }, description: "IDs das modalidades" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        },
        403: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        },
        404: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    if (!hasRole(req.user.normalizedRoles, "DIRECAO") && req.user.id !== req.params.id) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return usersController.updateUser(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Utilizadores"],
      description: "Elimina um utilizador pelo ID (apenas Direção)",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", description: "ID do utilizador" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        },
        403: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    if (!req.user.normalizedRoles.includes("DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return usersController.deleteUser(req, reply);
  });

  fastify.get("/:id/modalidades", {
    schema: {
      tags: ["Utilizadores"],
      description: "Obtém as modalidades de um utilizador",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", description: "ID do utilizador" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { type: "object" } }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
    req.params.id = parseInt(req.params.id);
    return usersController.getUserModalidades(req, reply);
  });
}