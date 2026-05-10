import * as aulasController from "../controllers/aulas.controller.js";
import * as pedidosaulaService from "../services/pedidosaula.service.js";
import { PrismaClient } from "@prisma/client";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

const prisma = new PrismaClient();

export default async function aulasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", {
    schema: {
      tags: ["Aulas"],
      description: "Listar todas as aulas do utilizador autenticado",
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
  }, aulasController.listarAulas);

  fastify.get("/all", {
    schema: {
      tags: ["Aulas"],
      description: "Listar todas as aulas (apenas direção)",
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas direção" });
    }
    try {
      const dados = await pedidosaulaService.getAllPedidosEAulas();
      return reply.send({ success: true, data: dados });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/my", {
    schema: {
      tags: ["Aulas"],
      description: "Listar aulas do professor autenticado",
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
  }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const role = req.user.normalizedRoles || req.user.role;

      const salas = Object.fromEntries((await prisma.sala.findMany()).map(s => [s.idsala, s.nomesala]));
      const estados = Object.fromEntries((await prisma.estado.findMany()).map(e => [e.idestado, e.tipoestado]));

      let pedidos;
      if (role === 'ENCARREGADO') {
        pedidos = await prisma.pedidodeaula.findMany({
          where: { encarregadoeducacaoutilizadoriduser: userId },
          orderBy: { datapedido: 'desc' }
        });
      } else if (role === 'PROFESSOR') {
        pedidos = await prisma.$queryRaw`
          SELECT pa.* FROM pedidodeaula pa
          LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
          WHERE dm.professorutilizadoriduser = ${userId}
             OR pa.professorutilizadoriduser = ${userId}
          ORDER BY pa.datapedido DESC
        `;
      } else if (role === 'ALUNO') {
        pedidos = [];
      } else {
        pedidos = await prisma.pedidodeaula.findMany({ orderBy: { datapedido: 'desc' } });
      }

      let filtered = pedidos;

      const data = filtered.map(p => ({
        id: String(p.idpedidoaula),
        alunoId: String(p.alunoutilizadoriduser || p.alunoid || ''),
        alunoNome: '',
        encarregadoId: p.encarregadoeducacaoutilizadoriduser ? String(p.encarregadoeducacaoutilizadoriduser) : '',
        professorId: '',
        professorNome: '',
        estudioId: String(p.salaidsala),
        estudioNome: salas[p.salaidsala] || '',
        modalidade: '',
        data: p.data ? new Date(p.data).toISOString().split('T')[0] : '',
        horaInicio: p.horainicio ? String(p.horainicio).substring(11, 16) : '',
        horaFim: '',
        duracao: p.duracaoaula || 60,
        status: estados[p.estadoidestado] || 'PENDENTE',
        observacoes: p.observacoes || '',
        motivoRejeicao: p.motivorejeicao || '',
        criadoEm: p.datapedido ? new Date(p.datapedido).toISOString() : '',
        validadaFaturacao: p.validadafaturacao || false,
        valorAula: p.valoraula ? Number(p.valoraula) : 0,
        dataValidacao: p.datavalidacao || null,
        participantes: []
      }));

      return reply.send({ success: true, data });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/open", {
    schema: {
      tags: ["Aulas"],
      description: "Listar aulas abertas para inscrição pública",
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
  }, async (req, reply) => {
    try {
      const role = req.user.normalizedRoles || req.user.role;
      if (role !== 'ENCARREGADO' && role !== 'ALUNO') {
        return reply.send({ success: true, data: [] });
      }

      const pedidos = await prisma.pedidodeaula.findMany({ orderBy: { datapedido: 'desc' } });
      const salas = Object.fromEntries((await prisma.sala.findMany()).map(s => [s.idsala, s.nomesala]));
      const estados = Object.fromEntries((await prisma.estado.findMany()).map(e => [e.idestado, e.tipoestado]));

      const open = pedidos
        .filter(p => estados[p.estadoidestado] === 'PENDENTE' && p.privacidade === false)
        .map(p => ({
          id: String(p.idpedidoaula),
          alunoId: String(p.alunoutilizadoriduser || p.alunoid || ''),
          alunoNome: '',
          encarregadoId: p.encarregadoeducacaoutilizadoriduser ? String(p.encarregadoeducacaoutilizadoriduser) : '',
          professorId: '',
          professorNome: '',
          estudioId: String(p.salaidsala),
          estudioNome: salas[p.salaidsala] || '',
          modalidade: '',
          data: p.data ? new Date(p.data).toISOString().split('T')[0] : '',
          horaInicio: p.horainicio ? String(p.horainicio).substring(11, 16) : '',
          horaFim: '',
          duracao: p.duracaoaula || 60,
          status: 'PENDENTE',
          observacoes: p.observacoes || '',
          motivoRejeicao: '',
          criadoEm: p.datapedido ? new Date(p.datapedido).toISOString() : '',
          validadaFaturacao: false,
          valorAula: 0,
          dataValidacao: null,
          participantes: []
        }));

      return reply.send({ success: true, data: open });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/:id", {
    schema: {
      tags: ["Aulas"],
      description: "Obter uma aula pelo ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
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
  }, aulasController.getAulaById);

  fastify.get("/pedido/:pedidoId", {
    schema: {
      tags: ["Aulas"],
      description: "Obter aula associada a um pedido",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          pedidoId: { type: "string", description: "ID do pedido de aula" }
        },
        required: ["pedidoId"]
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
  }, aulasController.obterAulaDoPedido);

  fastify.post("/", {
    schema: {
      tags: ["Aulas"],
      description: "Criar uma nova aula",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          data: { type: "string", description: "Data da aula (YYYY-MM-DD)" },
          horainicio: { type: "string", description: "Hora de início (HH:MM)" },
          duracaoaula: { type: "integer", description: "Duração em minutos" },
          salaidsala: { type: "integer", description: "ID da sala" },
          disponibilidade_mensal_id: { type: "integer", description: "ID da disponibilidade" },
          observacoes: { type: "string", description: "Observações" }
        },
        required: ["data", "horainicio", "salaidsala"]
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
    if (!hasRole(req.user.normalizedRoles, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.criarAula(req, reply);
  });

  fastify.put("/:id", {
    schema: {
      tags: ["Aulas"],
      description: "Atualizar uma aula existente",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          data: { type: "string", description: "Data da aula (YYYY-MM-DD)" },
          horainicio: { type: "string", description: "Hora de início (HH:MM)" },
          duracaoaula: { type: "integer", description: "Duração em minutos" },
          salaidsala: { type: "integer", description: "ID da sala" },
          observacoes: { type: "string", description: "Observações" }
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
    if (!hasRole(req.user.normalizedRoles, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.updateAula(req, reply);
  });

  fastify.delete("/:id", {
    schema: {
      tags: ["Aulas"],
      description: "Eliminar uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.deleteAula(req, reply);
  });

  fastify.post("/:id/confirm", {
    schema: {
      tags: ["Aulas"],
      description: "Confirmar uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
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
  }, aulasController.confirmAula);

  fastify.post("/:id/cancel", {
    schema: {
      tags: ["Aulas"],
      description: "Cancelar uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
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
  }, aulasController.cancelarAula);

  fastify.put("/:id/remarcar", {
    schema: {
      tags: ["Aulas"],
      description: "Remarcar uma aula para nova data (apenas direção)",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          novadata: { type: "string", description: "Nova data (YYYY-MM-DD)" },
          novaHora: { type: "string", description: "Nova hora (HH:MM)" }
        },
        required: ["novadata", "novaHora"]
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.remarcarAula(req, reply);
  });

  fastify.put("/:id/sugerir-nova-data", {
    schema: {
      tags: ["Aulas"],
      description: "Sugerir nova data para remarcação de aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          novadata: { type: "string", description: "Nova data sugerida (YYYY-MM-DD)" },
          novaHora: { type: "string", description: "Nova hora sugerida (HH:MM)" }
        },
        required: ["novadata", "novaHora"]
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
    if (!hasRole(req.user.normalizedRoles, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas professores ou direção podem sugerir novas datas" });
    }
    return aulasController.sugerirNovaData(req, reply);
  });

  fastify.post("/:id/responder-direcao", {
    schema: {
      tags: ["Aulas"],
      description: "Direção responde a sugestão de remarcação",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          aceitar: { type: "boolean", description: "Aceitar ou rejeitar a sugestão" }
        },
        required: ["aceitar"]
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
    if (!hasRole(req.user.normalizedRoles, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas a direção pode responder a esta sugestão" });
    }
    return aulasController.responderSugestaoDirecao(req, reply);
  });

  fastify.post("/:id/pedir-remarcacao", {
    schema: {
      tags: ["Aulas"],
      description: "Professor pede remarcação de uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
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
    if (!hasRole(req.user.normalizedRoles, "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Apenas professores podem pedir remarcação" });
    }
    return aulasController.pedirRemarcacao(req, reply);
  });

  fastify.post("/:id/responder-professor", {
    schema: {
      tags: ["Aulas"],
      description: "Professor responde a sugestão de remarcação",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          aceitar: { type: "boolean", description: "Aceitar ou rejeitar a sugestão" }
        },
        required: ["aceitar"]
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
    if (!hasRole(req.user.normalizedRoles, "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Apenas professores podem responder a esta sugestão" });
    }
    return aulasController.responderSugestaoProfessor(req, reply);
  });

  fastify.post("/:id/responder-encarregado", {
    schema: {
      tags: ["Aulas"],
      description: "Encarregado de educação responde a sugestão de remarcação",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          aceitar: { type: "boolean", description: "Aceitar ou rejeitar a sugestão" }
        },
        required: ["aceitar"]
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
    if (!hasRole(req.user.normalizedRoles, "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Apenas encarregados podem responder a esta sugestão" });
    }
    return aulasController.responderSugestaoEE(req, reply);
  });

  fastify.post("/:id/join", {
    schema: {
      tags: ["Aulas"],
      description: "Aluno junta-se a uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
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
  }, aulasController.inserirAlunoAula);

  fastify.get("/:id/presencas", {
    schema: {
      tags: ["Aulas"],
      description: "Listar presenças de uma aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
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
  }, async (req, reply) => {
    if (!hasRole(req.user.normalizedRoles, "DIRECAO", "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { getPresencas } = await import("../services/aulas.service.js");
    try {
      const presencas = await getPresencas(req.params.id);
      return reply.send({ success: true, data: presencas });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post("/:id/presenca", {
    schema: {
      tags: ["Aulas"],
      description: "Registar presença de aluno numa aula",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da aula" }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          alunoId: { type: "string", description: "ID do aluno" },
          presente: { type: "boolean", description: "Está presente ou não" }
        },
        required: ["alunoId", "presente"]
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
    const { registrarPresenca } = await import("../services/aulas.service.js");
    try {
      const { alunoId, presente } = req.body;
      const presenca = await registrarPresenca(req.params.id, alunoId, presente);
      return reply.send({ success: true, data: presenca });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}