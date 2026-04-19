import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import bcrypt from "bcrypt";

export default async function (fastify) {

  // =========================
  // REGISTER
  // =========================
  fastify.post("/register", async (req, reply) => {
    try {
      console.log("BODY:", req.body);
      const { nome, email, telemovel, password } = req.body;
      console.log("EMAIL:", email);
      // validação
      if (!nome || !email || !telemovel || !password) {
        return reply.status(400).send({
          error: "Todos os campos são obrigatórios"
        });
      }

      // verificar se já existe
      const existingUser = await prisma.utilizador.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(400).send({
          error: "Email já registado"
        });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // criar user
      const user = await prisma.utilizador.create({
        data: {
          nome,
          email,
          telemovel,
          password: hashedPassword,
          estado: true,
          role: "utilizador"
        }
      });

      return {
        message: "Utilizador criado com sucesso",
        user: {
          id: user.iduser,
          nome: user.nome,
          email: user.email
        }
      };

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Erro no servidor"
      });
    }
  });

  // =========================
  // LOGIN
  // =========================
  fastify.post("/login", async (req, reply) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.utilizador.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.status(400).send({
          error: "Utilizador não encontrado"
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return reply.status(400).send({
          error: "Password incorreta"
        });
      }

      const token = jwt.sign(
        {
          id: user.iduser,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return {
        message: "Login com sucesso",
        token,
        user: {
          id: user.iduser,
          nome: user.nome,
          email: user.email,
          role: user.role
        }
      };

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Erro no servidor"
      });
    }
  });

}