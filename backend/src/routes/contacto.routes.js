import * as contactoController from "../controllers/contacto.controller.js";

export default async function contactoRoutes(fastify) {
  fastify.post("/", contactoController.submitContact);
}