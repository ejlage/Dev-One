// T12 – Consultar Aulas

import prisma from "../config/prisma.js";
import { aulaInclude } from "../utils/aulas.include.js";
 
export async function getAulas(filtros = {}) {
  const {
    professorutilizadoriduser,
    encarregadoeducacaoutilizadoriduser,
    utilizadoriduser_aluno,
    estadoaulaidestadoaula,
    data,
  } = filtros;
 
  const where = {};
 
  if (estadoaulaidestadoaula)
    where.estadoaulaidestadoaula = Number(estadoaulaidestadoaula);
 
  if (utilizadoriduser_aluno) {
    where.alunoaula = {
      some: { aluno: { utilizadoriduser: Number(utilizadoriduser_aluno) } },
    };
  }
 
  const wherePedido = {};
  if (data) wherePedido.data = new Date(data);
  if (encarregadoeducacaoutilizadoriduser)
    wherePedido.encarregadoeducacaoutilizadoriduser = Number(encarregadoeducacaoutilizadoriduser);
  if (professorutilizadoriduser)
    wherePedido.disponibilidade = { professorutilizadoriduser: Number(professorutilizadoriduser) };
  if (Object.keys(wherePedido).length > 0) where.pedidodeaula = wherePedido;
 
  return prisma.aula.findMany({
    where,
    include: aulaInclude,
    orderBy: { pedidodeaula: { data: "asc" } },
  });
}