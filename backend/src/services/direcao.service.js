import { PrismaClient } from "@prisma/client";
import { createNotificacao } from "./notificacoes.service.js";

const prisma = new PrismaClient();

export const getAllAulas = async () => {
  const aulas = await prisma.$queryRaw`
    SELECT
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.maxparticipantes,
      pa.estadoidestado,
      e.tipoestado as estado_nome,
      pa.privacidade,
      pa.datapedido,
      pa.novadata,
      pa.sugestaoestado,
      s.nomesala as sala_nome,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      u.nome as professor_nome,
      u.iduser as professor_id,
      alu.nome as aluno_nome,
      al.utilizadoriduser as aluno_utilizador_id,
      enc.nome as encarregado_nome,
      pa.encarregadoeducacaoutilizadoriduser as encarregado_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    LEFT JOIN alunoaula aa ON pa.idpedidoaula = aa.aulaidaula
    LEFT JOIN aluno al ON aa.alunoidaluno = al.idaluno
    LEFT JOIN utilizador alu ON al.utilizadoriduser = alu.iduser
    LEFT JOIN utilizador enc ON pa.encarregadoeducacaoutilizadoriduser = enc.iduser
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;

  return aulas.map(a => {
    const rawStatus = (a.estado_nome || '').toUpperCase();
    const statusMap = {
      'PENDENTE': 'PENDENTE',
      'CONFIRMADO': 'CONFIRMADA',
      'APROVADO': 'APROVADA',
      'REJEITADO': 'REJEITADA',
      'REALIZADO': 'REALIZADA',
      'CANCELADO': 'CANCELADA',
      'CONCLUÍDO': 'CONCLUÍDA',
    };
    const normalizedStatus = statusMap[rawStatus] || rawStatus;

    return {
      id: String(a.idpedidoaula),
      alunoId: String(a.aluno_utilizador_id || ''),
      alunoNome: a.aluno_nome || '',
      encarregadoId: String(a.encarregado_id || ''),
      professorId: String(a.professor_id || ''),
      professorNome: a.professor_nome || '',
      estudioId: '',
      estudioNome: a.sala_nome || '',
      modalidade: a.modalidade_nome || '',
      data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
      horaInicio: a.horainicio ? String(a.horainicio).substring(0, 5) : '',
      horaFim: '',
      duracao: a.duracaoaula ? parseInt(String(a.duracaoaula).split(':')[0]) : 60,
      status: normalizedStatus,
      maxParticipantes: a.maxparticipantes || 0,
      criadoEm: a.datapedido ? new Date(a.datapedido).toISOString() : '',
      novaData: a.novadata || '',
      sugestaoestado: a.sugestaoestado || null,
      participantes: []
    };
  });
};

export const getPendingAulas = async () => {
  const aulas = await prisma.$queryRaw`
    SELECT
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.maxparticipantes,
      pa.estadoidestado,
      e.tipoestado as estado_nome,
      pa.privacidade,
      pa.datapedido,
      s.nomesala as sala_nome,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      u.nome as professor_nome,
      u.iduser as professor_id,
      alu.nome as aluno_nome,
      al.utilizadoriduser as aluno_utilizador_id,
      enc.nome as encarregado_nome,
      pa.encarregadoeducacaoutilizadoriduser as encarregado_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    LEFT JOIN alunoaula aa ON pa.idpedidoaula = aa.aulaidaula
    LEFT JOIN aluno al ON aa.alunoidaluno = al.idaluno
    LEFT JOIN utilizador alu ON al.utilizadoriduser = alu.iduser
    LEFT JOIN utilizador enc ON pa.encarregadoeducacaoutilizadoriduser = enc.iduser
    WHERE LOWER(e.tipoestado) = 'pendente'
    ORDER BY pa.data ASC, pa.horainicio ASC
  `;

  return aulas.map(a => ({
    id: String(a.idpedidoaula),
    alunoId: String(a.aluno_utilizador_id || ''),
    alunoNome: a.aluno_nome || '',
    encarregadoId: String(a.encarregado_id || ''),
    professorId: String(a.professor_id || ''),
    professorNome: a.professor_nome || '',
    estudioId: '',
    estudioNome: a.sala_nome || '',
    modalidade: a.modalidade_nome || '',
    data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
    horaInicio: a.horainicio ? String(a.horainicio).substring(0, 5) : '',
    horaFim: '',
    duracao: a.duracaoaula ? parseInt(String(a.duracaoaula).split(':')[0]) : 60,
    status: a.estado_nome || '',
    maxParticipantes: a.maxparticipantes || 0,
    criadoEm: a.datapedido ? new Date(a.datapedido).toISOString() : '',
    participantes: []
  }));
};

export const approveAula = async (id) => {
  const estadoConfirmada = await prisma.$queryRaw`
    SELECT idestado FROM estado WHERE LOWER(tipoestado) = 'confirmado'
  `;

  if (!estadoConfirmada || estadoConfirmada.length === 0) {
    throw new Error('Estado CONFIRMADA não encontrado');
  }

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(id) },
    include: {
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade_mensal: {
        include: {
          professor: { include: { utilizador: true } }
        }
      }
    }
  });

  const result = await prisma.$queryRaw`
    UPDATE pedidodeaula
    SET estadoidestado = ${estadoConfirmada[0].idestado}
    WHERE idpedidoaula = ${parseInt(id)}
    RETURNING idpedidoaula, data, horainicio, estadoidestado
  `;

  if (pedido?.encarregadoeducacao) {
    const mensagem = `✅ A sua aula foi aprovada! Data: ${pedido.data} às ${pedido.horainicio}`;
    await createNotificacao(pedido.encarregadoeducacao.utilizadoriduser, mensagem, 'AULA_APROVADA');
  }

  if (pedido?.disponibilidade_mensal?.professor) {
    const mensagem = `📅 Nova aula confirmada para ${pedido.data} às ${pedido.horainicio}`;
    await createNotificacao(pedido.disponibilidade_mensal.professor.utilizadoriduser, mensagem, 'AULA_CONFIRMADA');
  }

  return result;
};

export const rejectAula = async (id, motivo) => {
  const estadoRejeitada = await prisma.$queryRaw`
    SELECT idestado FROM estado WHERE LOWER(tipoestado) = 'rejeitado'
  `;

  if (!estadoRejeitada || estadoRejeitada.length === 0) {
    throw new Error('Estado REJEITADA não encontrado');
  }

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(id) },
    include: { encarregadoeducacao: true }
  });

  const result = await prisma.$queryRaw`
    UPDATE pedidodeaula
    SET estadoidestado = ${estadoRejeitada[0].idestado}
    WHERE idpedidoaula = ${parseInt(id)}
    RETURNING idpedidoaula, data, horainicio, estadoidestado
  `;

  if (pedido?.encarregadoeducacao) {
    const mensagem = `❌ A sua aula foi rejeitada. Motivo: ${motivo}`;
    await createNotificacao(pedido.encarregadoeducacao.utilizadoriduser, mensagem, 'AULA_REJEITADA');
  }

  return result;
};

export const confirmarAulaRealizada = async (id) => {
  const estadoConcluido = await prisma.estado.findFirst({
    where: { tipoestado: { equals: 'Concluído', mode: 'insensitive' } },
  });
  if (!estadoConcluido) throw new Error('Estado Concluído não encontrado');

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(id) },
    include: {
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } }
      }
    }
  });
  if (!pedido) throw new Error('Aula não encontrada');

  const result = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(id) },
    data: { estadoidestado: estadoConcluido.idestado },
  });

  if (pedido.encarregadoeducacao) {
    await createNotificacao(
      pedido.encarregadoeducacao.utilizadoriduser,
      `✅ A aula do dia ${pedido.data ? new Date(pedido.data).toLocaleDateString('pt-PT') : ''} foi confirmada como realizada.`,
      'AULA_REALIZADA'
    );
  }

  return result;
};
