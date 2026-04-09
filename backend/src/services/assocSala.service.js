//T11 - ASSOCIAR SALA

import prisma from "../config/prisma.js";
import { existeConflitoSala, timeParaMinutos } from "../utils/aulas.helpers.js";
import { aulaInclude } from "../utils/aulas.include.js";
 
// ST46 — devolve salas livres no slot pedido
export async function getSalasDisponiveis(data, horainicio, duracaoaulaMin) {
  const [ih, im] = horainicio.split(":").map(Number);
  const inicioMin = ih * 60 + im;
  const fimMin    = inicioMin + duracaoaulaMin;
 
  const todasSalas = await prisma.sala.findMany({
    include: { tiposala: true, estadosala: true },
  });
 
  const resultados = await Promise.all(
    todasSalas.map(async (sala) => {
      const temConflito = await existeConflitoSala(sala.idsala, new Date(data), inicioMin, fimMin, null);
      return temConflito ? null : sala;
    })
  );
 
  return resultados.filter(Boolean).map((sala) => ({
    idsala:         sala.idsala,
    nomesala:       sala.nomesala,
    capacidade:     sala.capacidade,
    nometiposala:   sala.tiposala?.nometiposala ?? null,
    nomeestadosala: sala.estadosala?.nomeestadosala ?? null,
  }));
}
 
// ST47 — associa sala à aula, valida conflito antes de gravar
export async function associarSalaAula(idaula, idsala) {
  const sala = await prisma.sala.findUnique({ where: { idsala } });
  if (!sala) throw { statusCode: 404, message: `sala.idsala=${idsala} não encontrada.` };
 
  const aula = await prisma.aula.findUnique({
    where: { idaula },
    include: { pedidodeaula: true },
  });
  if (!aula) throw { statusCode: 404, message: `aula.idaula=${idaula} não encontrada.` };
 
  const pedido    = aula.pedidodeaula;
  const inicioMin = timeParaMinutos(pedido.horainicio);
  const fimMin    = inicioMin + timeParaMinutos(pedido.duracaoaula);
 
  const temConflito = await existeConflitoSala(idsala, pedido.data, inicioMin, fimMin, pedido.idpedidoaula);
  if (temConflito) throw { statusCode: 409, message: `sala.idsala=${idsala} já está ocupada nesse horário (RF06).` };
 
  await prisma.pedidodeaula.update({ where: { idpedidoaula: pedido.idpedidoaula }, data: { salaidsala: idsala } });
  await prisma.aula.update({ where: { idaula }, data: { salaidsala: idsala } });
 
  return prisma.aula.findUnique({ where: { idaula }, include: aulaInclude });
}
 