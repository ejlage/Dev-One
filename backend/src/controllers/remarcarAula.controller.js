// T16 – Remarcar Aula
// ST61 PATCH /api/aulas/:idaula/remarcar

import { remarcarAula } from "../services/aulas.remarcar.service.js";

// PATCH /api/aulas/:idaula/remarcar
// body: { data, horainicio, salaidsala (opcional), motivo }
export async function remarcarAulaController(request, reply) {
  const idaula = Number(request.params.idaula);
  const { data, horainicio, salaidsala, motivo } = request.body ?? {};

  if (!data || !horainicio || !motivo)
    return reply.code(400).send({ erro: "Campos obrigatórios: data, horainicio, motivo" });

  try {
    const resultado = await remarcarAula(idaula, data, horainicio, salaidsala ?? null, motivo.trim());
    return reply.send({ mensagem: "Aula remarcada. Encarregado notificado.", ...resultado });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}