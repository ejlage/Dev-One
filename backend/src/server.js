import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

// Importações de rotas
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import figurinoRoutes from "./routes/figurino.routes.js";

const app = Fastify({ logger: true });

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.get("/", async () => {
  return { message: "API a funcionar" };
});

// rotas
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(protectedRoutes, { prefix: "/api" });
// as rotas de aulas já estão dentro do protected.routes.js

const PORT = process.env.PORT || 3000;

try {
  await app.listen({
    port: PORT,
    host: "0.0.0.0",
  });
  console.log(`Servidor a correr em http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
// Plugins (Ordem importa!)
await app.register(cors);

// Rotas
app.register(authRoutes, { prefix: "/api/auth" });
app.register(figurinoRoutes, { prefix: "/api/figurinos" });
app.register(protectedRoutes, { prefix: "/api" });

// Rota de teste
app.get("/", async () => {
  return { message: "API a funcionar" };
});

// Inicialização segura
try {
  await app.listen({ port: process.env.PORT || 3000 });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
