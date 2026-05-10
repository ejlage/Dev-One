import * as figurinosController from "../controllers/figurinos.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function figurinosRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Figurinos"],
      description: "Listar todos os figurinos",
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
  }, figurinosController.getAllFigurinos);

  fastify.post("/", {
    schema: {
      tags: ["Figurinos"],
      description: "Criar um novo figurino",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["nome", "descricao", "tamanho", "genero", "cor", "tipoiditem", "quantidade"],
        properties: {
          nome: { type: "string" },
          descricao: { type: "string" },
          tamanho: { type: "string" },
          genero: { type: "string" },
          cor: { type: "string" },
          tipoiditem: { type: "integer" },
          quantidade: { type: "integer" },
          preco: { type: "number" },
          imagem: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.createFigurino(req, reply);
  });

  fastify.put("/:id", {
    schema: {
      tags: ["Figurinos"],
      description: "Atualizar um figurino existente",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      body: {
        type: "object",
        properties: {
          nome: { type: "string" },
          descricao: { type: "string" },
          tamanho: { type: "string" },
          genero: { type: "string" },
          cor: { type: "string" },
          tipoiditem: { type: "integer" },
          quantidade: { type: "integer" },
          preco: { type: "number" },
          imagem: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.updateFigurino(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Figurinos"],
      description: "Eliminar um figurino",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.deleteFigurino(req, reply);
  });

  fastify.post("/stock", {
    schema: {
      tags: ["Figurinos"],
      description: "Criar um novo figurino em stock",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["nome", "descricao", "tamanho", "genero", "cor", "tipoiditem", "quantidade"],
        properties: {
          nome: { type: "string" },
          descricao: { type: "string" },
          tamanho: { type: "string" },
          genero: { type: "string" },
          cor: { type: "string" },
          tipoiditem: { type: "integer" },
          quantidade: { type: "integer" },
          preco: { type: "number" },
          imagem: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.createFigurinoStock(req, reply);
  });

  fastify.patch("/:id/status", {
    schema: {
      tags: ["Figurinos"],
      description: "Atualizar o status de um figurino",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      body: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return figurinosController.updateFigurinoStatusSimple(req, reply);
  });

  fastify.get("/lookup", {
    schema: {
      tags: ["Figurinos"],
      description: "Obter dados de lookup para figurinos (tipos, tamanhos, géneros, cores)",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, figurinosController.getLookupData);

  fastify.get("/:id/history", {
    schema: {
      tags: ["Figurinos"],
      description: "Obter histórico de transações de um figurino",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { getFigurinoHistory } = await import("../services/figurinos.service.js");
    try {
      const history = await getFigurinoHistory(req.params.id);
      return reply.send({ success: true, data: history });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/stock/baixo", {
    schema: {
      tags: ["Figurinos"],
      description: "Listar figurinos com stock baixo",
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negadokkkkk" });
    }
    const { getFigurinosStockBaixo } = await import("../services/figurinos.service.js");
    try {
      const figurinos = await getFigurinosStockBaixo();
      return reply.send({ success: true, data: figurinos });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/relatorio", {
    schema: {
      tags: ["Figurinos"],
      description: "Obter relatório completo de figurinos",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { getRelatorioFigurinos } = await import("../services/figurinos.service.js");
    try {
      const relatorio = await getRelatorioFigurinos();
      return reply.send({ success: true, data: relatorio });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}