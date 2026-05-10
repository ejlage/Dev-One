import prisma, { getEstadoId, getSalaId } from './db.js';

function futureDate(daysFromNow = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function futureTime() {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
}

export async function createModalidadeProfessor({
  professorId,
  modalidadeId,
}) {
  return prisma.modalidadeprofessor.create({
    data: {
      professorutilizadoriduser: professorId,
      modalidadeidmodalidade: modalidadeId,
    },
  });
}

export async function createDisponibilidade({
  professorId,
  modalidadeprofessorId,
  data,
  horainicio,
  horafim,
  salaid = null,
}) {
  const dataStr = data || futureDate(5);
  const hi = horainicio || '10:00:00';
  const hf = horafim || '11:00:00';
  return prisma.disponibilidade_mensal.create({
    data: {
      professorutilizadoriduser: professorId,
      modalidadesprofessoridmodalidadeprofessor: modalidadeprofessorId,
      data: new Date(dataStr),
      horainicio: new Date(`1970-01-01T${hi}`),
      horafim: new Date(`1970-01-01T${hf}`),
      ativo: true,
      salaid,
      minutos_ocupados: 0,
    },
  });
}

export async function createPedidoAula({
  data,
  horainicio,
  duracaoaula,
  encarregadoUserId,
  professorUserId = null,
  alunoUserId = null,
  salaId,
  disponibilidadeId = null,
  estado = 'Pendente',
  privacidade = false,
  sugestaoestado = null,
  novadata = null,
}) {
  const estadoId = await getEstadoId(estado);
  const dataStr = data || futureDate(3);
  const hi = horainicio || futureTime();
  const dur = duracaoaula || '01:00:00';

  return prisma.pedidodeaula.create({
    data: {
      data: new Date(dataStr),
      horainicio: new Date(`1970-01-01T${hi}`),
      duracaoaula: new Date(`1970-01-01T${dur}`),
      maxparticipantes: 1,
      datapedido: new Date(),
      privacidade,
      grupoidgrupo: 3,
      estadoidestado: estadoId,
      salaidsala: salaId,
      encarregadoeducacaoutilizadoriduser: encarregadoUserId,
      professorutilizadoriduser: professorUserId,
      alunoutilizadoriduser: alunoUserId,
      disponibilidade_mensal_id: disponibilidadeId,
      sugestaoestado,
      novadata: novadata ? new Date(novadata) : null,
    },
  });
}

export async function createAula({
  pedidoId,
  salaId,
  estadoAulaNome = 'CONFIRMADA',
}) {
  const estadoAula = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: { equals: estadoAulaNome, mode: 'insensitive' } },
  });
  if (!estadoAula) throw new Error(`EstadoAula "${estadoAulaNome}" não encontrado`);
  return prisma.aula.create({
    data: {
      pedidodeaulaidpedidoaula: pedidoId,
      salaidsala: salaId,
      estadoaulaidestadoaula: estadoAula.idestadoaula,
    },
  });
}

export async function createAnuncio({
  figurinoId,
  estado = 'Pendente',
  valor = 50,
  quantidade = 1,
  tipotransacao = 'ALUGUER',
  direcaoUserId = null,
  encarregadoUserId = null,
  professorUserId = null,
}) {
  const estadoId = await getEstadoId(estado);
  const hoje = new Date();
  const daquiUmMes = new Date();
  daquiUmMes.setMonth(daquiUmMes.getMonth() + 1);
  return prisma.anuncio.create({
    data: {
      valor,
      dataanuncio: hoje,
      datainicio: hoje,
      datafim: daquiUmMes,
      quantidade,
      figurinoidfigurino: figurinoId,
      estadoidestado: estadoId,
      direcaoutilizadoriduser: direcaoUserId,
      encarregadoeducacaoutilizadoriduser: encarregadoUserId,
      professorutilizadoriduser: professorUserId,
      tipotransacao,
    },
  });
}

export async function createTransacaoFigurino({
  anuncioId,
  estado = 'Pendente',
  quantidade = 1,
  direcaoUserId = null,
  encarregadoUserId = null,
  professorUserId = null,
}) {
  const estadoId = await getEstadoId(estado);
  return prisma.transacaofigurino.create({
    data: {
      quantidade,
      datatransacao: new Date(),
      anuncioidanuncio: anuncioId,
      estadoidestado: estadoId,
      direcaoutilizadoriduser: direcaoUserId,
      encarregadoeducacaoutilizadoriduser: encarregadoUserId,
      professorutilizadoriduser: professorUserId,
    },
  });
}

export async function createNotificacao({
  userId,
  mensagem = 'Notificação de teste',
  tipo = 'TESTE',
  lida = false,
}) {
  return prisma.notificacao.create({
    data: { utilizadoriduser: userId, mensagem, tipo, lida },
  });
}

export { futureDate, futureTime };