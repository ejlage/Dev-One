import * as contactoController from "../controllers/contacto.controller.js";

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

}