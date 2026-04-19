import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import bcrypt from "bcrypt";

export default async function (fastify) {
  
  // Rota de Registo
  fastify.post("/register", async (req, reply) => {
    try {
      const { nome, email, telemovel, password } = req.body;

      if (!nome || !email || !telemovel || !password) {
        return reply.status(400).send({ error: "Todos os campos são obrigatórios" });
      }

      const existingUser = await prisma.utilizador.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({ error: "Email já registado" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.utilizador.create({
        data: { nome, email, telemovel, password: hashedPassword, estado: true, role: "utilizador" }
      });

      return { message: "Utilizador criado com sucesso", user: { id: user.iduser, nome: user.nome, email: user.email } };
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Erro no servidor" });
    }
  });

  // Rota de Login
  fastify.post("/login", async (req, reply) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.utilizador.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.status(400).send({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign({ id: user.iduser, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

      return { success: true, message: "Login com sucesso", token, user: { id: user.iduser, nome: user.nome, email: user.email, role: user.role } };
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Erro no servidor" });
    }
  });

  // Rota de Logout (Lógica simples, pois JWT é stateless)
  fastify.post("/logout", async (req, reply) => {
    return { success: true, message: "Logout realizado" };
  });

  // Placeholder para Forgot Password
  fastify.post("/forgot-password", async (req, reply) => {
    const { email } = req.body;
    if (!email) return reply.status(400).send({ error: "Email é obrigatório" });
    return { success: true, message: "Email de recuperação enviado" };
  });

  // Placeholder para Reset Password
  fastify.post("/reset-password", async (req, reply) => {
    const { email, password } = req.body;
    if (!email || !password) return reply.status(400).send({ error: "Email e password são obrigatórios" });
    return { success: true, message: "Password alterada" };
  });
}