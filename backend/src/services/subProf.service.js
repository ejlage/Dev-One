// T15 – Substituir Professor
// ST59: Atualiza pedidodeaula.disponibilidadeiddisponibilidade

import prisma from "../config/prisma.js";
import { existeConflitoProf, timeParaMinutos } from "../utils/aulas.helpers.js";
import { aulaInclude } from "../utils/aulas.include.js";
 
export async function substituirProfessor(idaula, novoProfessorutilizadoriduser, direcaoutilizadoriduser) {
  const direcao = await prisma.direcao.findUnique({
    where: { utilizadoriduser: Number(direcaoutilizadoriduser) },
  });
  if (!direcao)
    throw { statusCode: 403, message: "Apenas a Direção pode substituir professores." };
 
  const aula = await prisma.aula.findUnique({
    where: { idaula },
    include: { pedidodeaula: { include: { disponibilidade: true } } },
  });
  if (!aula)
    throw { statusCode: 404, message: `aula.idaula=${idaula} não encontrada.` };
 
  const novoProfessor = await prisma.professor.findUnique({
    where: { utilizadoriduser: Number(novoProfessorutilizadoriduser) },
  });
  if (!novoProfessor)
    throw { statusCode: 404, message: `professor.utilizadoriduser=${novoProfessorutilizadoriduser} não encontrado.` };
 
  const pedido    = aula.pedidodeaula;
  const inicioMin = timeParaMinutos(pedido.horainicio);
  const fimMin    = inicioMin + timeParaMinutos(pedido.duracaoaula);
 
  const temConflito = await existeConflitoProf(
    novoProfessorutilizadoriduser, pedido.data, inicioMin, fimMin, pedido.idpedidoaula
  );
  if (temConflito)
    throw { statusCode: 409, message: `professor.utilizadoriduser=${novoProfessorutilizadoriduser} já tem aula nesse horário (RF06).` };
 
  const disponibilidade = await prisma.disponibilidade.findFirst({
    where: { professorutilizadoriduser: Number(novoProfessorutilizadoriduser) },
  });
  if (!disponibilidade)
    throw { statusCode: 400, message: "Professor substituto não tem disponibilidades registadas." };
 
  await prisma.pedidodeaula.update({
    where: { idpedidoaula: pedido.idpedidoaula },
    data: { disponibilidadeiddisponibilidade: disponibilidade.iddisponibilidade },
  });
 
  return prisma.aula.findUnique({ where: { idaula }, include: aulaInclude });
}