// T11 a t16 parte das aulas


import prisma from "../config/db.js";
import { existeConflitoSala, existeConflitoProf, timeParaMinutos } from "../utils/aulasHelpers.js";
import { aulaInclude } from "../utils/aulasInclude.js";
//import { notificarAusencia, notificarRemarcacao } from "../utils/aulas.notificacoes.js";


// t11 - Devolve as salas 
export async function getSalasDisponiveis(data, horainicio, duracaoaulaMin) {
  const [ih, im] = horainicio.split(":").map(Number);
  const inicioMin = ih * 60 + im;
  const fimMin    = inicioMin + duracaoaulaMin;

  const todasSalas = await prisma.sala.findMany({
    include: { tiposala: true, estadosala: true },
  });

  const resultados = await Promise.all(
    todasSalas.map(async (sala) => {
      const temConflito = await existeConflitoSala(
        sala.idsala, new Date(data), inicioMin, fimMin, null
      );
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

// Associauma sala a uma aula e valida antes de guardar
export async function associarSalaAula(idaula, idsala) {
  const sala = await prisma.sala.findUnique({ where: { idsala } });
  if (!sala)
    throw { statusCode: 404, message: `sala.idsala=${idsala} não encontrada.` };

  const aula = await prisma.aula.findUnique({
    where: { idaula },
    include: { pedidodeaula: true },
  });
  if (!aula)
    throw { statusCode: 404, message: `aula.idaula=${idaula} não encontrada.` };

  const pedido    = aula.pedidodeaula;
  const inicioMin = timeParaMinutos(pedido.horainicio);
  const fimMin    = inicioMin + timeParaMinutos(pedido.duracaoaula);

  const temConflito = await existeConflitoSala(
    idsala, pedido.data, inicioMin, fimMin, pedido.idpedidoaula
  );
  if (temConflito)
    throw { statusCode: 409, message: `sala.idsala=${idsala} já está ocupada nesse horário (RF06).` };

  await prisma.pedidodeaula.update({
    where: { idpedidoaula: pedido.idpedidoaula },
    data: { salaidsala: idsala },
  });
  await prisma.aula.update({
    where: { idaula },
    data: { salaidsala: idsala },
  });

  return prisma.aula.findUnique({ where: { idaula }, include: aulaInclude });
}



//T12 - Query aulas para ir buscar dados com os filtros opcionais
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
    wherePedido.disponibilidade = {
      professorutilizadoriduser: Number(professorutilizadoriduser),
    };
  if (Object.keys(wherePedido).length > 0) where.pedidodeaula = wherePedido;

  return prisma.aula.findMany({
    where,
    include: aulaInclude,
    orderBy: { pedidodeaula: { data: "asc" } },
  });
}



//T13 - O Professor confirma a realização da aula 
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

  if (aula.pedidodeaula.disponibilidade.professorutilizadoriduser !== Number(professorutilizadoriduser))
    throw { statusCode: 403, message: "Sem permissão: não és o professor desta aula." };

  if (aula.estadoaula.nomeestadoaula !== "CONFIRMADA")
    throw { statusCode: 400, message: `Aula está '${aula.estadoaula.nomeestadoaula}'. Só aulas CONFIRMADAS podem ser concluídas (RF08).` };

  const estadoRealizada = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "REALIZADA" },
  });
  if (!estadoRealizada)
    throw { statusCode: 500, message: "Estado 'REALIZADA' não existe na tabela estadoaula." };

  await prisma.aula.update({
    where: { idaula },
    data: { estadoaulaidestadoaula: estadoRealizada.idestadoaula },
  });

  return prisma.aula.findUnique({ where: { idaula }, include: aulaInclude });
}



//T14 - comunicaDA ausência pelo prof e muda para estado PENDENTE 
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

  if (aula.pedidodeaula.disponibilidade.professorutilizadoriduser !== Number(professorutilizadoriduser))
    throw { statusCode: 403, message: "Sem permissão: não és o professor desta aula." };

  if (!["PENDENTE", "CONFIRMADA"].includes(aula.estadoaula.nomeestadoaula))
    throw { statusCode: 400, message: `Não é possível comunicar ausência numa aula '${aula.estadoaula.nomeestadoaula}'.` };

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

  // caso se use email para notificar
  const utilizador = aula.pedidodeaula.encarregadoeducacao.utilizador;
  const dataAula   = aula.pedidodeaula.data.toISOString().substring(0, 10);
  await notificarAusencia({
    email: utilizador.email,
    nome: utilizador.nome,
    idaula,
    data: dataAula,
    motivo,
  });

  return {
    aula: aulaAtualizada,
    notificacao: { enviada: true, email: utilizador.email },
  };
}



//t15 - Direção substitui o professor 
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



//t16 -  Remarcar aula - atualiza dados mais o estado PENDENTE 
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

  // Mantém duração original 
  const duracaoaulaMin = timeParaMinutos(pedido.duracaoaula);
  if (duracaoaulaMin < 30 || duracaoaulaMin > 120)
    throw { statusCode: 400, message: `duracaoaula=${duracaoaulaMin} min fora do intervalo permitido (30-120 min) (RF05).` };

  const [ih, im] = horainicio.split(":").map(Number);
  const inicioMin      = ih * 60 + im;
  const fimMin         = inicioMin + duracaoaulaMin;
  const salaidsalaFinal = salaidsala ? Number(salaidsala) : pedido.salaidsala;

  //falha de sala
  const conflitoSala = await existeConflitoSala(
    salaidsalaFinal, new Date(data), inicioMin, fimMin, pedido.idpedidoaula
  );
  if (conflitoSala)
    throw { statusCode: 409, message: `sala.idsala=${salaidsalaFinal} já está ocupada no novo horário (RF06).` };

  //falha de prof
  const conflitoProf = await existeConflitoProf(
    pedido.disponibilidade.professorutilizadoriduser, new Date(data), inicioMin, fimMin, pedido.idpedidoaula
  );
  if (conflitoProf)
    throw { statusCode: 409, message: "Professor já tem aula no novo horário (RF06)." };

  const horainicioBD = new Date(
    `1970-01-01T${String(ih).padStart(2, "0")}:${String(im).padStart(2, "0")}:00`
  );

  //update bd
  await prisma.pedidodeaula.update({
    where: { idpedidoaula: pedido.idpedidoaula },
    data: { data: new Date(data), horainicio: horainicioBD, salaidsala: salaidsalaFinal },
  });
  await prisma.aula.update({
    where: { idaula },
    data: { salaidsala: salaidsalaFinal },
  });

  //volta a PENDENTE, direção tem de reconfirmar
  const estadoPendente = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "PENDENTE" },
  });
  await prisma.aula.update({
    where: { idaula },
    data: { estadoaulaidestadoaula: estadoPendente.idestadoaula },
  });

  const aulaAtualizada = await prisma.aula.findUnique({
    where: { idaula },
    include: aulaInclude,
  });

  
  //notificar encarregado
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

