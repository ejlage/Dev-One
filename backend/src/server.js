import Fastify from "fastify";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";


const app = Fastify();

// rotas
app.register(authRoutes, { prefix: "/api/auth" });
app.register(protectedRoutes, { prefix: "/api" });
//as rotas de aulas já estão registadas dentro do protected.routes.js

app.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("Servidor a correr em http://localhost:3000");
});