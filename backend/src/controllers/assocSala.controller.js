// T11 – Associar Sala
// ST46 GET salas disponíveis
// ST47 associar sala a aula


import { getSalasDisponiveis, associarSalaAula } from "../services/aulas.sala.service.js";

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

// PATCH /api/aulas/:idaula/associar-sala   body: { idsala }
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