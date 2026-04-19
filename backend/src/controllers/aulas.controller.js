// Controller para aulas T11-T16

import {
  getSalasDisponiveis,
  associarSalaAula,
  getAulas,
  confirmarConclusaoAula,
  comunicarAusencia,
  substituirProfessor,
} from "../services/aulas.service.js";

import { remarcarAula } from "../services/Remarcaraula.service.js";


//T11
// GET /api/aulas/salas-disponiveis?data=&horainicio=&duracaoaula=
export async function getSalasDisponiveisController(request, reply) {
  const { data, horainicio, duracaoaula } = request.query;

  if (!data || !horainicio || !duracaoaula)
    return reply.code(400).send({ erro: "Parâmetros obrigatórios: data, horainicio, duracaoaula" });

  const duracaoaulaMin = parseInt(duracaoaula, 10);
  if (isNaN(duracaoaulaMin) || duracaoaulaMin < 30 || duracaoaulaMin > 120)
    return reply.code(400).send({ erro: "duracaoaula inválida. Deve estar entre 30 e 120 minutos (RF05)." });

  try {
    const salas = await getSalasDisponiveis(data, horainicio, duracaoaulaMin);
    return reply.send({ salas });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}


//T11
//PATCH /api/aulas/:idaula/associar-sala   body: { idsala }
export async function associarSalaAulaController(request, reply) {
  const idaula = Number(request.params.idaula);
  const { idsala } = request.body ?? {};

  if (!idsala)
    return reply.code(400).send({ erro: "idsala é obrigatório." });

  try {
    const aula = await associarSalaAula(idaula, Number(idsala));
    return reply.send({ mensagem: "Sala associada com sucesso.", aula });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}


//T12
//GET /api/aulas
export async function getAulasController(request, reply) {
  try {
    const aulas = await getAulas(request.query);
    return reply.send({ aulas, total: aulas.length });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}


//T13
//PATCH /api/aulas/:idaula/concluir
export async function confirmarConclusaoController(request, reply) {
  const idaula                    = Number(request.params.idaula);
  const professorutilizadoriduser = request.user?.iduser;

  if (!professorutilizadoriduser)
    return reply.code(401).send({ erro: "Não autenticado." });

  try {
    const aula = await confirmarConclusaoAula(idaula, professorutilizadoriduser);
    return reply.send({ mensagem: "Aula marcada como REALIZADA.", aula });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}


//T14
//POST /api/aulas/:idaula/ausencia   body: { }
export async function comunicarAusenciaController(request, reply) {
  const idaula                    = Number(request.params.idaula);
  const professorutilizadoriduser = request.user?.iduser;
  const { motivo }                = request.body ?? {};

  if (!professorutilizadoriduser)
    return reply.code(401).send({ erro: "Não autenticado." });

  if (!motivo?.trim())
    return reply.code(400).send({ erro: "motivo é obrigatório." });

  try {
    const resultado = await comunicarAusencia(idaula, professorutilizadoriduser, motivo.trim());
    return reply.send({ mensagem: "Ausência registada. Encarregado notificado.", ...resultado });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}


//T15
//PATCH /api/aulas/:idaula/substituir-professor
//body: { novoProfessorutilizadoriduser }
export async function substituirProfessorController(request, reply) {
  const idaula                          = Number(request.params.idaula);
  const direcaoutilizadoriduser         = request.user?.iduser;
  const { novoProfessorutilizadoriduser } = request.body ?? {};

  if (!direcaoutilizadoriduser)
    return reply.code(401).send({ erro: "Não autenticado." });

  if (!novoProfessorutilizadoriduser)
    return reply.code(400).send({ erro: "novoProfessorutilizadoriduser é obrigatório." });

  try {
    const aula = await substituirProfessor(
      idaula, Number(novoProfessorutilizadoriduser), direcaoutilizadoriduser
    );
    return reply.send({ mensagem: "Professor substituído com sucesso.", aula });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}


//T16
//PATCH /api/aulas/:idaula/remarcar
//body: { data, horainicio, salaidsala (opcional), motivo }
export async function remarcarAulaController(request, reply) {
  const idaula                           = Number(request.params.idaula);
  const { data, horainicio, salaidsala, motivo } = request.body ?? {};

  if (!data || !horainicio || !motivo)
    return reply.code(400).send({ erro: "Campos obrigatórios: data, horainicio, motivo" });

  try {
    const resultado = await remarcarAula(
      idaula, data, horainicio, salaidsala ?? null, motivo.trim()
    );
    return reply.send({ mensagem: "Aula remarcada. Encarregado notificado.", ...resultado });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}