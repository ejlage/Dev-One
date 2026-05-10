import * as turmasController from "../controllers/turmas.controller.js";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

export default async function turmasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Turmas"],
      description: "Listar todas as turmas",
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
  }, turmasController.getAllTurmas);

  fastify.post("/", {
    schema: {
      tags: ["Turmas"],
      description: "Criar nova turma",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["nome", "modalidade", "nivel"],
        properties: {
          nome: { type: "string", description: "Nome da turma" },
          modalidade: { type: "string", description: "Modalidade da turma" },
          nivel: { type: "string", description: "Nível da turma" },
          descricao: { type: "string", description: "Descrição da turma" },
          faixaEtaria: { type: "string", description: "Faixa etária" },
          professorId: { type: "integer", description: "ID do professor" },
          estudioId: { type: "integer", description: "ID da sala/estúdio" },
          diasSemana: { type: "array", items: { type: "integer" }, description: "Dias da semana (0-6)" },
          horaInicio: { type: "string", description: "Hora de início (HH:MM)" },
          horaFim: { type: "string", description: "Hora de fim (HH:MM)" },
          duracao: { type: "integer", description: "Duração em minutos" },
          lotacaoMaxima: { type: "integer", description: "Lotação máxima" },
          dataInicio: { type: "string", description: "Data de início (YYYY-MM-DD)" },
          dataFim: { type: "string", description: "Data de fim (YYYY-MM-DD)" },
          cor: { type: "string", description: "Cor de identificação" },
          requisitos: { type: "string", description: "Requisitos da turma" }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return turmasController.createTurma(req, reply);
  });

  fastify.put("/:id", {
    schema: {
      tags: ["Turmas"],
      description: "Atualizar turma",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da turma" }
        }
      },
      body: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome da turma" },
          modalidade: { type: "string", description: "Modalidade da turma" },
          nivel: { type: "string", description: "Nível da turma" },
          descricao: { type: "string", description: "Descrição da turma" },
          faixaEtaria: { type: "string", description: "Faixa etária" },
          professorId: { type: "integer", description: "ID do professor" },
          estudioId: { type: "integer", description: "ID da sala/estúdio" },
          diasSemana: { type: "array", items: { type: "integer" }, description: "Dias da semana (0-6)" },
          horaInicio: { type: "string", description: "Hora de início (HH:MM)" },
          horaFim: { type: "string", description: "Hora de fim (HH:MM)" },
          duracao: { type: "integer", description: "Duração em minutos" },
          lotacaoMaxima: { type: "integer", description: "Lotação máxima" },
          dataInicio: { type: "string", description: "Data de início (YYYY-MM-DD)" },
          dataFim: { type: "string", description: "Data de fim (YYYY-MM-DD)" },
          cor: { type: "string", description: "Cor de identificação" },
          requisitos: { type: "string", description: "Requisitos da turma" }
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return turmasController.updateTurma(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Turmas"],
      description: "Eliminar turma",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da turma" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return turmasController.deleteTurma(req, reply);
  });

  fastify.put("/:id/enroll", {
    schema: {
      tags: ["Turmas"],
      description: "Inscrever aluno na turma",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da turma" }
        }
      },
      body: {
        type: "object",
        required: ["alunoId"],
        properties: {
          alunoId: { type: "integer", description: "ID do aluno a matricular" }
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
    return turmasController.enrollAluno(req, reply);
  });

  fastify.put("/:id/close", {
    schema: {
      tags: ["Turmas"],
      description: "Fechar turma",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da turma" }
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return turmasController.closeTurma(req, reply);
  });

  fastify.put("/:id/archive", {
    schema: {
      tags: ["Turmas"],
      description: "Arquivar turma",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da turma" }
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return turmasController.archiveTurma(req, reply);
  });

  fastify.delete("/:id/alunos/:alunoId", {
    schema: {
      tags: ["Turmas"],
      description: "Remover aluno da turma",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da turma" },
          alunoId: { type: "integer", description: "ID do aluno a remover" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" }
          }
        }
      }
    }
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return turmasController.removeAluno(req, reply);
  });
}