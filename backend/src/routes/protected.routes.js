import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/role.middleware.js";

export default async function (fastify) {


// =========================
  // REGISTER
  // =========================
  
  
  fastify.post("/auth/register", async (req, reply) => {
    try {
      const { nome, email, telemovel, password } = req.body;

      // validação básica
      if (!nome || !email || !telemovel || !password) {
        return reply.status(400).send({
          error: "Todos os campos são obrigatórios"
        });
      }

      // verificar se já existe email
      const existingUser = await prisma.utilizador.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(400).send({
          error: "Email já registado"
        });
      }

      // encriptar password
      const hashedPassword = await bcrypt.hash(password, 10);

      // criar utilizador
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
  // LOGIN (NOVO)
  // =========================
  fastify.post("/auth/login", async (req, reply) => {
    try {
      const { email, password } = req.body;

      // procurar utilizador
      const user = await prisma.utilizador.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.status(400).send({
          error: "Utilizador não encontrado"
        });
      }

      // comparar password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return reply.status(400).send({
          error: "Password incorreta"
        });
      }

      // gerar token JWT
      const token = jwt.sign(
        {
          id: user.iduser,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return {
        message: "Login com sucesso",
        token
      };

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Erro no servidor"
      });
    }
  });


// =========================
  // ROTA PROTEGIDA 
  // =========================
  fastify.get("/profile", { preHandler: verifyToken }, async (req, reply) => {
    return {
      message: "Acesso autorizado",
      user: req.user
    };
  });
}


