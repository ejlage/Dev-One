// routes aulas

import { autorizar, verificarToken }          from "../middleware/auth.middleware.js";
import { getSalasDisponiveisController, associarSalaAulaController }  from "../controllers/aulas.sala.controller.js"; // T11
import { getAulasController }                  from "../controllers/aulas.consultar.controller.js";   // T12
import { confirmarConclusaoController }        from "../controllers/aulas.conclusao.controller.js";   // T13
import { comunicarAusenciaController }         from "../controllers/aulas.ausencia.controller.js";    // T14
import { substituirProfessorController }       from "../controllers/aulas.substituicao.controller.js";// T15
import { remarcarAulaController }              from "../controllers/aulas.remarcar.controller.js";    // T16

// importar as outras

export default async function aulasRoutes(fastify) {

  fastify.get(
    "/aulas/salas-disponiveis",
    { preHandler: autorizar(["ENCARREGADO", "PROFESSOR", "DIRECAO"]) },
    getSalasDisponiveisController
  );

  fastify.patch(
    "/aulas/:idaula/associar-sala",
    { preHandler: autorizar(["DIRECAO"]) },
    associarSalaAulaController
  );


  
  fastify.get(
    "/aulas",
    { preHandler: verificarToken },
    getAulasController
  );


  fastify.patch(
    "/aulas/:idaula/concluir",
    { preHandler: autorizar(["PROFESSOR"]) },
    confirmarConclusaoController
  );


  fastify.post(
    "/aulas/:idaula/ausencia",
    { preHandler: autorizar(["PROFESSOR"]) },
    comunicarAusenciaController
  );


  fastify.patch(
    "/aulas/:idaula/substituir-professor",
    { preHandler: autorizar(["DIRECAO"]) },
    substituirProfessorController
  );


  fastify.patch(
    "/aulas/:idaula/remarcar",
    { preHandler: autorizar(["PROFESSOR", "DIRECAO"]) },
    remarcarAulaController
  );

}