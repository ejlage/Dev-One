import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import bcrypt from "bcrypt";

export default async function (fastify) {

  fastify.post("/register", async (req, reply) => {
    try {
      const { nome, email, telemovel, password } = req.body;

      if (!nome || !email || !telemovel || !password) {
        return reply.status(400).send({
          error: "Todos os campos são obrigatórios"
        });
      }

      const existingUser = await prisma.utilizador.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(400).send({
          error: "Email já registado"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

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

      let alunosIds = [];
      if (user.role === 'ENCARREGADO' || user.role === 'encarregado') {
        const alunos = await prisma.aluno.findMany({
          where: { encarregadoiduser: user.iduser },
          select: { utilizadoriduser: true }
        });
        alunosIds = alunos.map(a => a.utilizadoriduser.toString());
      }

      return {
        success: true,
        message: "Login com sucesso",
        token,
        user: {
          id: user.iduser,
          nome: user.nome,
          email: user.email,
          role: user.role,
          alunosIds
        }
      };

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Erro no servidor"
      });
    }
  });

  fastify.post("/logout", async (req, reply) => {
    return {
      success: true,
      message: "Logout realizado"
    };
  });

  fastify.post("/forgot-password", async (req, reply) => {
    const { email } = req.body;

    if (!email) {
      return reply.status(400).send({
        error: "Email é obrigatório"
      });
    }

    const user = await prisma.utilizador.findUnique({
      where: { email }
    });

    if (!user) {
      return reply.status(404).send({
        error: "Utilizador não encontrado"
      });
    }

    const resetToken = jwt.sign(
      { id: user.iduser, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`[Auth] Password reset token for ${email}: ${resetToken}`);

    return {
      success: true,
      message: "Token de recuperação gerado",
      token: resetToken
    };
  });

  fastify.post("/reset-password", async (req, reply) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return reply.status(400).send({
        error: "Token e password são obrigatórios"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return reply.status(401).send({
        error: "Token inválido ou expirado"
      });
    }

    if (decoded.type !== "password_reset") {
      return reply.status(401).send({
        error: "Token inválido"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.utilizador.update({
      where: { iduser: decoded.id },
      data: { password: hashedPassword }
    });

    return {
      success: true,
      message: "Password alterada com sucesso"
    };
  });

}