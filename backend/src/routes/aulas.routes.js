import * as aulasController from "../controllers/aulas.controller.js";
import * as pedidosaulaService from "../services/pedidosaula.service.js";
import { PrismaClient } from "@prisma/client";
import { verifyToken, hasRole } from "../middleware/auth.middleware.js";

const prisma = new PrismaClient();

export default async function aulasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/", aulasController.getAllAulas);

  fastify.get("/all", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas direção" });
    }
    try {
      const dados = await pedidosaulaService.getAllPedidosEAulas();
      return reply.send({ success: true, data: dados });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get("/my", async (req, reply) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      const pedidos = await prisma.pedidodeaula.findMany({ orderBy: { datapedido: 'desc' } });
      const salas = Object.fromEntries((await prisma.sala.findMany()).map(s => [s.idsala, s.nomesala]));
      const estados = Object.fromEntries((await prisma.estado.findMany()).map(e => [e.idestado, e.tipoestado]));

      let filtered = pedidos;
      if (role === 'ENCARREGADO') {
        filtered = pedidos.filter(p => p.encarregadoeducacaoutilizadoriduser === userId);
      } else if (role === 'PROFESSOR') {
        filtered = pedidos;
      } else if (role === 'ALUNO') {
        filtered = [];
      }

      const data = filtered.map(p => ({
        id: String(p.idpedidoaula),
        alunoId: String(p.alunoid || ''),
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

  fastify.get("/open", async (req, reply) => {
    try {
      const role = req.user.role;
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
          alunoId: String(p.alunoid || ''),
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

  fastify.get("/:id", aulasController.getAulaById);

  fastify.post("/", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.createAula(req, reply);
  });

  fastify.put("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.updateAula(req, reply);
  });

  fastify.delete("/:id", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    return aulasController.deleteAula(req, reply);
  });

  fastify.post("/:id/confirm", aulasController.confirmAula);

  fastify.post("/:id/cancel", aulasController.cancelAula);

  fastify.put("/:id/remarcar", aulasController.remarcarAula);

  fastify.put("/:id/sugerir-nova-data", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR", "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas professores ou direção podem sugerir novas datas" });
    }
    return aulasController.sugerirNovaData(req, reply);
  });

  fastify.post("/:id/responder-direcao", async (req, reply) => {
    if (!hasRole(req.user.role, "DIRECAO")) {
      return reply.status(403).send({ success: false, error: "Apenas a direção pode responder a esta sugestão" });
    }
    return aulasController.responderSugestaoDirecao(req, reply);
  });

  fastify.post("/:id/pedir-remarcacao", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Apenas professores podem pedir remarcação" });
    }
    return aulasController.pedirRemarcacao(req, reply);
  });

  fastify.post("/:id/responder-professor", async (req, reply) => {
    if (!hasRole(req.user.role, "PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Apenas professores podem responder a esta sugestão" });
    }
    return aulasController.responderSugestaoProfessor(req, reply);
  });

  fastify.post("/:id/responder-encarregado", async (req, reply) => {
    if (!hasRole(req.user.role, "ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Apenas encarregados podem responder a esta sugestão" });
    }
    return aulasController.responderSugestaoEE(req, reply);
  });

  fastify.post("/:id/join", aulasController.joinAula);
}