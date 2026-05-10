import 'dotenv/config';
import Fastify from "fastify";
import cors from "@fastify/cors";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import aulasRoutes from "./routes/aulas.routes.js";
import salasRoutes from "./routes/salas.routes.js";
import turmasRoutes from "./routes/turmas.routes.js";
import figurinosRoutes from "./routes/figurinos.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import anunciosRoutes from "./routes/anuncios.routes.js";
import contactoRoutes from "./routes/contacto.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import pedidosaulaRoutes from "./routes/pedidosaula.routes.js";
import notificacoesRoutes from "./routes/notificacoes.routes.js";
import aluguerFigurinoRoutes from "./routes/aluguerFigurino.routes.js";
import professorRoutes from "./routes/professor.routes.js";
import * as professorService from "./services/professor.service.js";
import prisma from "./config/db.js";
import alunoRoutes from "./routes/aluno.routes.js";
import encarregadoRoutes from "./routes/encarregado.routes.js";
import professorAulasRoutes from "./routes/professor-aulas.routes.js";
import direcaoRoutes from "./routes/direcao.routes.js";
import { startPedidoAulaScheduler } from "./services/pedidoaula.scheduler.js";

const app = Fastify({
  logger: true
});

app.register(cors, { 
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

app.get("/api/public/modalidades", async (req, reply) => {
  try {
    const modalidades = await prisma.modalidade.findMany({ orderBy: { nome: 'asc' } });
    return reply.send({ success: true, data: modalidades });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
});

app.get("/api/public/eventos", async (req, reply) => {
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

app.get("/api/public/disponibilidades", async (req, reply) => {
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
app.register(contactoRoutes, { prefix: "/api/contacto" });
app.register(pedidosaulaRoutes, { prefix: "/api/pedidosaula" });
app.register(notificacoesRoutes, { prefix: "/api/notificacoes" });
app.register(aluguerFigurinoRoutes, { prefix: "/api/aluguer" });
app.register(professorRoutes, { prefix: "/api/professor" });
app.register(alunoRoutes, { prefix: "/api/aluno" });
app.register(encarregadoRoutes, { prefix: "/api/encarregado" });
app.register(professorAulasRoutes, { prefix: "/api/professor-aulas" });
app.register(direcaoRoutes, { prefix: "/api/direcao" });
app.register(protectedRoutes, { prefix: "/api" });

startPedidoAulaScheduler();

app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => console.log("Servidor a correr em http://localhost:3000"))
  .catch(err => {
    console.error("Erro ao iniciar servidor:", err);
    process.exit(1);
  });