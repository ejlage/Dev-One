import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

// Importações de rotas
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import figurinoRoutes from "./routes/figurino.routes.js";

const app = Fastify({ logger: true });

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
