import 'dotenv/config';
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import prisma from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import aulasRoutes from "./routes/aulas.routes.js";
import salasRoutes from "./routes/salas.routes.js";
import turmasRoutes from "./routes/turmas.routes.js";
import figurinosRoutes from "./routes/figurinos.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import anunciosRoutes from "./routes/anuncios.routes.js";
import publicContactRoutes from "./routes/public-contact.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import pedidosaulaRoutes from "./routes/pedidosaula.routes.js";
import notificacoesRoutes from "./routes/notificacoes.routes.js";
import aluguerFigurinoRoutes from "./routes/aluguerFigurino.routes.js";
import professorRoutes from "./routes/professor.routes.js";
import alunoRoutes from "./routes/aluno.routes.js";
import encarregadoRoutes from "./routes/encarregado.routes.js";
import professorAulasRoutes from "./routes/professor-aulas.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import direcaoRoutes from "./routes/direcao.routes.js";
import * as professorService from "./services/professor.service.js";

export async function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? false,
    ...opts.fastify,
  });

  app.register(cors, {
    origin: opts.corsOrigin ?? "http://localhost:5173",
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role']
  });

  // === Rate Limiting (RNF07) — must use await para onRoute hook capturar todas as rotas seguintes ===
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
    errorResponseBuilder: (req, context) => ({
      success: false,
      error: "Demasiados pedidos. Tente novamente mais tarde.",
      retryAfter: context.after,
    }),
  });

  // === OpenAPI / Swagger Documentation ===
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Ent'Artes API",
        description: "API do sistema de gestão da Escola de Dança Ent'Artes",
        version: "1.0.0",
        contact: {
          name: "Ent'Artes",
          email: "entartes@atomicmail.io",
        },
      },
      servers: [{ url: "http://localhost:3000", description: "Desenvolvimento" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Token JWT obtido no login (copiar sem a palavra 'Bearer')",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  // === Response Time Monitoring (RNF03) ===
  app.addHook("onResponse", (req, reply, done) => {
    const elapsed = reply.elapsedTime; // Fastify built-in (ms)
    const method = req.method;
    const url = req.url;
    const status = reply.statusCode;
    if (url !== "/api/health") {
      app.log.info({ method, url, status, elapsed: `${elapsed.toFixed(1)}ms` }, "request completed");
    }
    done();
  });

  // === Health endpoint (RNF03/RNF04) ===
  app.get("/api/health", async (req, reply) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return reply.send({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      uptimeSeconds: uptime,
    });
  });

  // Cache headers for public endpoints (RNF07 — reduz carga na BD)
  function setPublicCache(reply, maxAge = 60) {
    reply.header("Cache-Control", `public, max-age=${maxAge}`);
  }

  app.get("/api/public/modalidades", async (req, reply) => {
    setPublicCache(reply, 3600); // raramente muda
    try {
      const modalidades = await prisma.modalidade.findMany({ orderBy: { nome: 'asc' } });
      return reply.send({ success: true, data: modalidades });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  app.get("/api/public/eventos", async (req, reply) => {
    setPublicCache(reply, 300); // 5 min — eventos podem ser publicados
    try {
      const eventos = await prisma.evento.findMany({
        where: { publicado: true },
        orderBy: { dataevento: 'asc' }
      });
      return reply.send({ success: true, data: eventos.map(e => ({
        id: String(e.idevento),
        titulo: e.titulo,
        descricao: e.descricao,
        data: e.dataevento ? new Date(e.dataevento).toISOString().split('T')[0] : '',
        local: e.localizacao,
        imagem: e.imagem,
        linkBilhetes: e.linkbilhetes,
        destaque: e.destaque,
        publicado: e.publicado,
      }))});
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  app.register(publicContactRoutes, { prefix: "/api/public" });

  app.get("/api/public/disponibilidades", async (req, reply) => {
    setPublicCache(reply, 30); // 30s — disponibilidades mudam com frequência
    try {
      const disponibilidades = await professorService.getAllDisponibilidadesMensais();
      const formatted = disponibilidades.map(d => {
        const totalMinutos = d.total_minutos || 60;
        const minutosOcupados = parseInt(d.minutos_ocupados) || 0;
        return {
          id: String(d.iddisponibilidade_mensal),
          professorId: String(d.professorutilizadoriduser),
          professorNome: d.professor_nome || '',
          data: d.data ? new Date(d.data).toISOString().split('T')[0] : '',
          horaInicio: d.horainicio instanceof Date ? d.horainicio.toISOString().substring(11, 16) : String(d.horainicio || '').substring(0, 5),
          horaFim: d.horafim instanceof Date ? d.horafim.toISOString().substring(11, 16) : String(d.horafim || '').substring(0, 5),
          duracao: totalMinutos,
          maxDuracao: Math.max(0, totalMinutos - minutosOcupados),
          modalidadeId: String(d.idmodalidadeprofessor),
          modalidade: d.modalidade_nome || '',
          estudioId: d.salaid ? String(d.salaid) : '',
          estudioNome: d.estudio_nome || '',
        };
      });
      return reply.send({ success: true, data: formatted });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(usersRoutes, { prefix: "/api/users" });
  app.register(aulasRoutes, { prefix: "/api/aulas" });
  app.register(salasRoutes, { prefix: "/api/salas" });
  app.register(turmasRoutes, { prefix: "/api/turmas" });
  app.register(figurinosRoutes, { prefix: "/api/figurinos" });
  app.register(eventosRoutes, { prefix: "/api/eventos" });
  app.register(anunciosRoutes, { prefix: "/api/anuncios" });
  app.register(pedidosaulaRoutes, { prefix: "/api/pedidosaula" });
  app.register(notificacoesRoutes, { prefix: "/api/notificacoes" });
  app.register(aluguerFigurinoRoutes, { prefix: "/api/aluguer" });
  app.register(professorRoutes, { prefix: "/api/professor" });
  app.register(alunoRoutes, { prefix: "/api/aluno" });
  app.register(encarregadoRoutes, { prefix: "/api/encarregado" });
  app.register(professorAulasRoutes, { prefix: "/api/professor-aulas" });
  app.register(direcaoRoutes, { prefix: "/api/direcao" });
  app.register(auditRoutes, { prefix: "/api/audit" });
  app.register(protectedRoutes, { prefix: "/api" });

  return app;
}
