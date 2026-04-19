//Define os endpoints de aulas e liga-os ao controller

import { autorizar, verifyToken } from "../middleware/auth.middleware.js";
import {
  getSalasDisponiveisController,
  associarSalaAulaController,
  getAulasController,
  confirmarConclusaoController,
  comunicarAusenciaController,
  substituirProfessorController,
  remarcarAulaController,
} from "../controllers/aulas.controller.js";

export default async function aulasRoutes(fastify) {

  //T11 - salas disponíveis num slot horário
  fastify.get(
    "/aulas/salas-disponiveis",
    { preHandler: autorizar(["ENCARREGADO", "PROFESSOR", "DIRECAO"]) },
    getSalasDisponiveisController
  );

  //T11 – associar sala a uma aula
  fastify.patch(
    "/aulas/:idaula/associar-sala",
    { preHandler: autorizar(["DIRECAO"]) },
    associarSalaAulaController
  );

  //T12 – consultar aulas com filtros
  fastify.get(
    "/aulas",
    { preHandler: verifyToken },
    getAulasController
  );

  //T13 – professor confirma realização da aula
  fastify.patch(
    "/aulas/:idaula/concluir",
    { preHandler: autorizar(["PROFESSOR"]) },
    confirmarConclusaoController
  );

  //T14 – professor comunica ausência
  fastify.post(
    "/aulas/:idaula/ausencia",
    { preHandler: autorizar(["PROFESSOR"]) },
    comunicarAusenciaController
  );

  //T15 – direção substitui professor
  fastify.patch(
    "/aulas/:idaula/substituir-professor",
    { preHandler: autorizar(["DIRECAO"]) },
    substituirProfessorController
  );

  //T16 – remarcar aula para nova data/hora
  fastify.patch(
    "/aulas/:idaula/remarcar",
    { preHandler: autorizar(["PROFESSOR", "DIRECAO"]) },
    remarcarAulaController
  );
}