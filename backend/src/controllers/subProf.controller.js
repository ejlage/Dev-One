// T15 – Substituir Professor
// ST58: PATCH /api/aulas/:idaula/substituir-professor


import { substituirProfessor } from "../services/aulas.substituicao.service.js";

// PATCH /api/aulas/:idaula/substituir-professor
// body: { novoProfessorutilizadoriduser }
export async function substituirProfessorController(request, reply) {
  const idaula                          = Number(request.params.idaula);
  const direcaoutilizadoriduser         = request.user?.iduser;
  const { novoProfessorutilizadoriduser } = request.body ?? {};

  if (!direcaoutilizadoriduser)
    return reply.code(401).send({ erro: "Não autenticado." });

  if (!novoProfessorutilizadoriduser)
    return reply.code(400).send({ erro: "novoProfessorutilizadoriduser é obrigatório." });

  try {
    const aula = await substituirProfessor(idaula, Number(novoProfessorutilizadoriduser), direcaoutilizadoriduser);
    return reply.send({ mensagem: "Professor substituído com sucesso.", aula });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}