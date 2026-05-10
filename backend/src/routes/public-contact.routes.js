import * as contactoController from "../controllers/contacto.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function publicContactRoutes(fastify) {
  // POST /api/public/contactos — publico, envia email sem guardar na BD
  fastify.post("/contactos", {
    schema: {
      tags: ["Contactos"],
      description: "Envia formulário de contacto (público)",
      body: {
        type: "object",
        required: ["nome", "email", "mensagem"],
        properties: {
          nome: { type: "string", description: "Nome do visitante" },
          email: { type: "string", format: "email", description: "Email do visitante" },
          telemovel: { type: "string", description: "Telemóvel (opcional)" },
          modalidade: { type: "string", description: "Modalidade de interesse" },
          faixaetaria: { type: "string", description: "Faixa etária" },
          mensagem: { type: "string", description: "Mensagem do visitante" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        },
        400: {
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
  }, contactoController.submitContactForm);

  // GET /api/public/ — protegido, apenas para direcao ver inscricoes
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });
  fastify.get("/", {
    schema: {
      tags: ["Contactos"],
      description: "Lista todos os contactos/submissões (apenas Direção)",
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
  }, contactoController.getContactos);
}