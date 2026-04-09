// T13 – Confirmar Conclusão
// ST53: Atualiza aula.estadoaulaidestadoaula → REALIZADs

import prisma from "../config/prisma.js";
import { aulaInclude } from "../utils/aulas.include.js";
 
export async function confirmarConclusaoAula(idaula, professorutilizadoriduser) {
  const aula = await prisma.aula.findUnique({
    where: { idaula },
    include: {
      estadoaula: true,
      pedidodeaula: { include: { disponibilidade: true } },
    },
  });
  if (!aula)
    throw { statusCode: 404, message: `aula.idaula=${idaula} não encontrada.` };
 
  const professorDaAula = aula.pedidodeaula.disponibilidade.professorutilizadoriduser;
  if (professorDaAula !== Number(professorutilizadoriduser))
    throw { statusCode: 403, message: "Sem permissão: não és o professor desta aula." };
 
  if (aula.estadoaula.nomeestadoaula !== "CONFIRMADA")
    throw { statusCode: 400, message: `Aula está '${aula.estadoaula.nomeestadoaula}'. Só aulas CONFIRMADAS podem ser concluídas (RF08).` };
 
  const estadoRealizada = await prisma.estadoaula.findFirst({ where: { nomeestadoaula: "REALIZADA" } });
  if (!estadoRealizada)
    throw { statusCode: 500, message: "Estado 'REALIZADA' não existe na tabela estadoaula." };
 
  await prisma.aula.update({
    where: { idaula },
    data: { estadoaulaidestadoaula: estadoRealizada.idestadoaula },
  });
 
  return prisma.aula.findUnique({ where: { idaula }, include: aulaInclude });
}
 