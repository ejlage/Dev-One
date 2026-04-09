// T13 – Confirmar Conclusão de Aula
// ST52: PATCH /api/aulas/:idaula/concluir


import { confirmarConclusaoAula } from "../services/aulas.conclusao.service.js";

// PATCH /api/aulas/:idaula/concluir
// O iduser do prof vem do JWT: request.user.iduser
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