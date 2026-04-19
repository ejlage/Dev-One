// T16 – Remarcar Aula

import prisma from "../config/db.js";
import { existeConflitoSala, existeConflitoProf, timeParaMinutos } from "../utils/aulasHelpers.js";
import { aulaInclude } from "../utils/aulasInclude.js";
import { notificarRemarcacao } from "../utils/aulas.notificacoes.js";

export async function remarcarAula(idaula, data, horainicio, salaidsala, motivo) {
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

  const pedido = aula.pedidodeaula;

  // Valida data futura
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (new Date(data) < hoje)
    throw { statusCode: 400, message: "Não é possível remarcar para uma data no passado." };

  // Mantém duração original — valida RF05
  const duracaoaulaMin = timeParaMinutos(pedido.duracaoaula);
  if (duracaoaulaMin < 30 || duracaoaulaMin > 120)
    throw { statusCode: 400, message: `duracaoaula=${duracaoaulaMin} min fora do intervalo permitido (30-120 min) (RF05).` };

  const [ih, im] = horainicio.split(":").map(Number);
  const inicioMin       = ih * 60 + im;
  const fimMin          = inicioMin + duracaoaulaMin;
  const salaidsalaFinal = salaidsala ? Number(salaidsala) : pedido.salaidsala;

  // RF06 — conflito de sala
  const conflitoSala = await existeConflitoSala(
    salaidsalaFinal, new Date(data), inicioMin, fimMin, pedido.idpedidoaula
  );
  if (conflitoSala)
    throw { statusCode: 409, message: `sala.idsala=${salaidsalaFinal} já está ocupada no novo horário (RF06).` };

  // RF06 — conflito de professor
  const conflitoProf = await existeConflitoProf(
    pedido.disponibilidade.professorutilizadoriduser, new Date(data), inicioMin, fimMin, pedido.idpedidoaula
  );
  if (conflitoProf)
    throw { statusCode: 409, message: "Professor já tem aula no novo horário (RF06)." };

  const horainicioBD = new Date(
    `1970-01-01T${String(ih).padStart(2, "0")}:${String(im).padStart(2, "0")}:00`
  );

  // ST62 — atualiza data, horainicio e salaidsala na BD
  await prisma.pedidodeaula.update({
    where: { idpedidoaula: pedido.idpedidoaula },
    data: { data: new Date(data), horainicio: horainicioBD, salaidsala: salaidsalaFinal },
  });
  await prisma.aula.update({
    where: { idaula },
    data: { salaidsala: salaidsalaFinal },
  });

  // RF07 — volta a PENDENTE, direção tem de reconfirmar
  const estadoPendente = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "PENDENTE" },
  });
  if (!estadoPendente)
    throw { statusCode: 500, message: "Estado 'PENDENTE' não existe na tabela estadoaula." };

  await prisma.aula.update({
    where: { idaula },
    data: { estadoaulaidestadoaula: estadoPendente.idestadoaula },
  });

  const aulaAtualizada = await prisma.aula.findUnique({
    where: { idaula },
    include: aulaInclude,
  });

  // ST63 — notifica encarregado
  const utilizador = pedido.encarregadoeducacao.utilizador;
  await notificarRemarcacao({
    email: utilizador.email,
    nome: utilizador.nome,
    idaula,
    data,
    horainicio,
    motivo,
  });

  return {
    aula: aulaAtualizada,
    notificacao: { enviada: true, email: utilizador.email },
  };
}