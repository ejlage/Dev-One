import { register, login } from "../controllers/auth.controller.js";

export default async function (fastify) {
  fastify.post("/register", register);
  fastify.post("/login", login);
}