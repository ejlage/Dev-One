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
import { startPedidoAulaScheduler } from "./services/pedidoaula.scheduler.js";

const app = Fastify({
  logger: false
});

app.register(cors, { 
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.register(protectedRoutes, { prefix: "/api" });

// startPedidoAulaScheduler();

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
  console.log("Servidor a correr em http://localhost:3000");
});