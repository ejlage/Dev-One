import * as anunciosController from "../controllers/anuncios.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function anunciosRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Anúncios"],
      description: "Listar todos os anúncios",
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
  }, anunciosController.getAllAnuncios);

  fastify.post("/", {
    schema: {
      tags: ["Anúncios"],
      description: "Criar um novo anúncio",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["tipotransacao", "datainicio", "datafim", "figurinoidfigurino"],
        properties: {
          titulo: { type: "string", description: "Ignorado (gerado automaticamente)" },
          descricao: { type: "string", description: "Ignorado (gerado automaticamente)" },
          tipotransacao: { type: "string" },
          valor: { type: "number" },
          datainicio: { type: "string" },
          datafim: { type: "string" },
          figurinoidfigurino: { type: "integer" },
          quantidade: { type: "integer" },
          figurinoiditem: { type: "integer" },
          encarregadoeducacaoutilizadoriduser: { type: "integer" },
          professorutilizadoriduser: { type: "integer" }
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
      return reply.status(403).send({ success: false, error: "Acesso não autorizado" });
    }
    return anunciosController.registarAnuncio(req, reply);
  });

  fastify.get("/:id", {
    schema: {
      tags: ["Anúncios"],
      description: "Consultar um anúncio específico",
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
            data: { type: "object" }
          }
        }
      }
    }
  }, anunciosController.consultarAnuncio);

  fastify.put("/:id", {
    schema: {
      tags: ["Anúncios"],
      description: "Atualizar um anúncio existente",
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
          titulo: { type: "string" },
          descricao: { type: "string" },
          tipotransacao: { type: "string" },
          valor: { type: "number" },
          datainicio: { type: "string" },
          datafim: { type: "string" },
          quantidade: { type: "integer" }
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
    return anunciosController.updateAnuncio(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Anúncios"],
      description: "Eliminar um anúncio",
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR", "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return anunciosController.deleteAnuncio(req, reply);
  });

  fastify.put("/:id/approve", {
    schema: {
      tags: ["Anúncios"],
      description: "Aprovar um anúncio",
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
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    req.body = { ...(req.body || {}), decisao: 'aprovar' };
    return anunciosController.avaliarAnuncio(req, reply);
  });

  fastify.put("/:id/reject", {
    schema: {
      tags: ["Anúncios"],
      description: "Rejeitar um anúncio",
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
          motivorejeicao: { type: "string" }
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
    const body = req.body || {};
    req.body = { decisao: 'rejeitar', motivo: body.motivorejeicao || body.motivo };
    return anunciosController.avaliarAnuncio(req, reply);
  });

  fastify.put("/:id/avaliar", {
    schema: {
      tags: ["Anúncios"],
      description: "Avaliar um anúncio (aprovar ou rejeitar)",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      body: {
        type: "object",
        required: ["decisao"],
        properties: {
          decisao: { type: "string" },
          motivorejeicao: { type: "string" }
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
    return anunciosController.avaliarAnuncio(req, reply);
  });

  fastify.put("/:id/ressubmeter", {
    schema: {
      tags: ["Anúncios"],
      description: "Ressubmeter um anúncio para aprovação",
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
          titulo: { type: "string" },
          descricao: { type: "string" },
          tipotransacao: { type: "string" },
          valor: { type: "number" },
          datainicio: { type: "string" },
          datafim: { type: "string" },
          quantidade: { type: "integer" }
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
    return anunciosController.ressubmeterAnuncio(req, reply);
  });
}