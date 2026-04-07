import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import protectedRoutes from "./routes/protected.routes.js";


const app = Fastify({ logger: true });

await app.register(cors);

//TODAS as rotas ficam com /api
app.register(protectedRoutes, { prefix: "/api" });

app.get("/", async () => {
  return { message: "API a funcionar" };
});

try {
  await app.listen({ port: 3000 });
  console.log("Servidor em http://localhost:3000");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}