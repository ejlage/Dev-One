import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import bcrypt from "bcrypt";

export default async function (fastify) {

  fastify.post("/register", {
    schema: {
      tags: ["Autenticação"],
      description: "Regista um novo utilizador na aplicação",
      body: {
        type: "object",
        required: ["nome", "email", "telemovel", "password"],
        properties: {
          nome: { type: "string", description: "Nome completo do utilizador" },
          email: { type: "string", format: "email", description: "Email do utilizador" },
          telemovel: { type: "string", description: "Número de telemóvel" },
          password: { type: "string", minLength: 6, description: "Password do utilizador" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "integer" },
                nome: { type: "string" },
                email: { type: "string" }
              }
            }
          }
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
        500: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
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

  fastify.post("/login", {
    schema: {
      tags: ["Autenticação"],
      description: "Efetua login e retorna token JWT",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", description: "Email do utilizador" },
          password: { type: "string", description: "Password do utilizador" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            token: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "integer" },
                nome: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
                alunosIds: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
        500: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
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
          role: user.role,
          tokenVersion: user.tokenVersion,
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

  fastify.post("/logout", {
    schema: {
      tags: ["Autenticação"],
      description: "Efetua logout (remove token do cliente)",
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
    return {
      success: true,
      message: "Logout realizado"
    };
  });

  fastify.post("/forgot-password", {
    schema: {
      tags: ["Autenticação"],
      description: "Gera token para recuperação de password",
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", description: "Email do utilizador" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            token: { type: "string" }
          }
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
        404: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
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

    return {
      success: true,
      message: "Token de recuperação gerado",
      token: resetToken
    };
  });

  fastify.post("/reset-password", {
    schema: {
      tags: ["Autenticação"],
      description: "Altera password usando token de recuperação",
      body: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", description: "Token de recuperação" },
          password: { type: "string", minLength: 6, description: "Nova password" }
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
            error: { type: "string" }
          }
        },
        401: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  }, async (req, reply) => {
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