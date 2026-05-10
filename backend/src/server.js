import { buildApp } from "./app.js";
import { startPedidoAulaScheduler } from "./services/pedidoaula.scheduler.js";

const app = await buildApp({ logger: true });

startPedidoAulaScheduler();

app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => console.log("Servidor a correr em http://localhost:3000"))
  .catch(err => {
    console.error("Erro ao iniciar servidor:", err);
    process.exit(1);
  });
