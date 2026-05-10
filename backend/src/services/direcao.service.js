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
      s.idsala as sala_id,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      dm.professorutilizadoriduser as professor_id,
      u.nome as professor_nome,
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
    const hora = a.horainicio;
    const horaFmt = hora instanceof Date
      ? hora.toISOString().substring(11, 16)
      : String(hora).substring(0, 5);
    const [hH, hM] = horaFmt.split(':').map(Number);
    const inicioMin = hH * 60 + (hM || 0);

    const durRaw = a.duracaoaula;
    let duracaoMin = 60;
    if (durRaw) {
      if (durRaw instanceof Date) {
        duracaoMin = durRaw.getUTCHours() * 60 + durRaw.getUTCMinutes();
      } else {
        const parts = String(durRaw).split(':');
        duracaoMin = parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
      }
    }
    const endMin = inicioMin + duracaoMin;
    const horaFim = String(Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0');

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
      encarregadoNome: a.encarregado_nome || '',
      professorId: String(a.professor_id || ''),
      professorNome: a.professor_nome || '',
      estudioId: String(a.sala_id || ''),
      estudioNome: a.sala_nome || '',
      modalidade: a.modalidade_nome || '',
      data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
      horaInicio: horaFmt,
      horaFim,
      duracao: duracaoMin,
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
      pa.alunoutilizadoriduser as pedido_aluno_id,
      alu.nome as aluno_nome,
      s.nomesala as sala_nome,
      pa.disponibilidade_mensal_id as slot_id,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      dm.professorutilizadoriduser as professor_id,
      u.nome as professor_nome,
      enc.nome as encarregado_nome,
      pa.encarregadoeducacaoutilizadoriduser as encarregado_id,
      s.idsala as sala_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    LEFT JOIN utilizador alu ON pa.alunoutilizadoriduser = alu.iduser
    LEFT JOIN utilizador enc ON pa.encarregadoeducacaoutilizadoriduser = enc.iduser
    WHERE LOWER(e.tipoestado) = 'pendente'
    ORDER BY pa.data ASC, pa.horainicio ASC
  `;

  return aulas.map(a => {
    let horaFmt = '';
    const hora = a.horainicio;
    if (hora) {
      if (hora instanceof Date) {
        horaFmt = hora.toISOString().substring(11, 16);
      } else if (typeof hora === 'string') {
        horaFmt = hora.substring(0, 5);
      } else {
        horaFmt = String(hora).substring(0, 5);
      }
    }
    
    let duracaoFmt = 60;
    const duracao = a.duracaoaula;
    if (duracao) {
      if (duracao instanceof Date) {
        duracaoFmt = duracao.getHours() * 60 + duracao.getMinutes();
      } else if (typeof duracao === 'string') {
        const parts = duracao.split(':');
        if (parts.length >= 2) {
          duracaoFmt = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
          duracaoFmt = parseInt(duracao) || 60;
        }
      }
    }
    
    const [hH2, hM2] = horaFmt.split(':').map(Number);
    const endMin2 = hH2 * 60 + (hM2 || 0) + duracaoFmt;
    const horaFim = String(Math.floor(endMin2 / 60)).padStart(2, '0') + ':' + String(endMin2 % 60).padStart(2, '0');

    return {
      id: String(a.idpedidoaula),
      alunoId: String(a.pedido_aluno_id || ''),
      alunoNome: a.aluno_nome || '',
      encarregadoId: String(a.encarregado_id || ''),
      encarregadoNome: a.encarregado_nome || '',
      professorId: String(a.professor_id || ''),
      professorNome: a.professor_nome || '',
      estudioId: String(a.sala_id || ''),
      estudioNome: a.sala_nome || '',
      modalidade: a.modalidade_nome || '',
      data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
      horaInicio: horaFmt,
      horaFim,
      duracao: duracaoFmt,
      status: a.estado_nome || '',
      maxParticipantes: a.maxparticipantes || 0,
      criadoEm: a.datapedido ? new Date(a.datapedido).toISOString() : '',
      participantes: []
    };
  });
};

export const approveAula = async (id, salaId) => {
  const estadoConfirmada = await prisma.$queryRaw`
    SELECT idestado FROM estado WHERE LOWER(tipoestado) = 'confirmado'
  `;

  if (!estadoConfirmada || estadoConfirmada.length === 0) {
    throw new Error('Estado CONFIRMADA não encontrado');
  }

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(id) },
    include: {
      estado: true,
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade_mensal: {
        include: {
          professor: { include: { utilizador: true } }
        }
      }
    }
  });

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  if (pedido.estado && pedido.estado.tipoestado.toLowerCase() === 'confirmado') {
    throw new Error('O pedido já foi aprovado anteriormente');
  }

  if (pedido.estado && pedido.estado.tipoestado.toLowerCase() === 'rejeitado') {
    throw new Error('Não é possível aprovar um pedido que foi rejeitado');
  }

  if (salaId) {
    await prisma.$queryRaw`
      UPDATE pedidodeaula SET salaidsala = ${parseInt(salaId)}
      WHERE idpedidoaula = ${parseInt(id)}
    `;
  }

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
    const mensagem = `❌ A sua aula foi rejeitada. Motivo: ${motivo}. Se pretender reagendar, consulte as disponibilidades dos professores e submeta um novo pedido.`;
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
