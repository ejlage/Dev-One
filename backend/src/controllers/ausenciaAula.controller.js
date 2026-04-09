// T14 – Comunicar a ausência
// ST55: POST /api/aulas/:idaula/ausencia

import { comunicarAusencia } from "../services/aulas.ausencia.service.js";

// POST /api/aulas/:idaula/ausencia   body: { motivo }
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