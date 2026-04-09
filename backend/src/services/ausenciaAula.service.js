// T14 – Comunicar Ausência
// ST55: Regista ausência → aula volta a PENDENTE
// ST56: Trigger notificação ao encarregadoeducacao

import prisma from "../config/prisma.js";
import { aulaInclude } from "../utils/aulas.include.js";
import { notificarAusencia } from "../utils/aulas.notificacoes.js";
 
export async function comunicarAusencia(idaula, professorutilizadoriduser, motivo) {
  const aula = await prisma.aula.findUnique({
    where: { idaula },
    include: {
      estadoaula: true,
      pedidodeaula: {
        include: {
          disponibilidade: true,
          encarregadoeducacao: { include: { utilizador: true } },
        },
      },
    },
  });
  if (!aula)
    throw { statusCode: 404, message: `aula.idaula=${idaula} não encontrada.` };
 
  const professorDaAula = aula.pedidodeaula.disponibilidade.professorutilizadoriduser;
  if (professorDaAula !== Number(professorutilizadoriduser))
    throw { statusCode: 403, message: "Sem permissão: não és o professor desta aula." };
 
  const estadoAtual = aula.estadoaula.nomeestadoaula;
  if (!["PENDENTE", "CONFIRMADA"].includes(estadoAtual))
    throw { statusCode: 400, message: `Não é possível comunicar ausência numa aula '${estadoAtual}'.` };
 
  const estadoPendente = await prisma.estadoaula.findFirst({ where: { nomeestadoaula: "PENDENTE" } });
  if (!estadoPendente)
    throw { statusCode: 500, message: "Estado 'PENDENTE' não existe na tabela estadoaula." };
 
  await prisma.aula.update({
    where: { idaula },
    data: { estadoaulaidestadoaula: estadoPendente.idestadoaula },
  });
 
  const aulaAtualizada = await prisma.aula.findUnique({ where: { idaula }, include: aulaInclude });
 
  // ST56 — notifica encarregado
  const utilizador = aula.pedidodeaula.encarregadoeducacao.utilizador;
  const dataAula   = aula.pedidodeaula.data.toISOString().substring(0, 10);
  await notificarAusencia({ email: utilizador.email, nome: utilizador.nome, idaula, data: dataAula, motivo });
 
  return {
    aula: aulaAtualizada,
    notificacao: { enviada: true, email: utilizador.email },
  };
}
 