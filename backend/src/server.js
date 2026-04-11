import Fastify from "fastify";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";

const app = Fastify();

// rotas
app.register(authRoutes, { prefix: "/api/auth" });
app.register(protectedRoutes, { prefix: "/api" });

app.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("Servidor a correr em http://localhost:3000");
});