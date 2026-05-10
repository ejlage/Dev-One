import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProfessorAulas = async (professorId) => {
  const aulas = await prisma.$queryRaw`
    SELECT
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.estadoidestado,
      e.tipoestado as estado_nome,
      pa.privacidade,
      pa.sugestaoestado,
      pa.novadata,
      s.nomesala as sala_nome,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      alu.nome as aluno_nome,
      al.idaluno as aluno_id,
      enc.nome as encarregado_nome,
      pa.encarregadoeducacaoutilizadoriduser as encarregado_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN alunoaula aa ON pa.idpedidoaula = aa.aulaidaula
    LEFT JOIN aluno al ON aa.alunoidaluno = al.idaluno
    LEFT JOIN utilizador alu ON al.utilizadoriduser = alu.iduser
    LEFT JOIN utilizador enc ON pa.encarregadoeducacaoutilizadoriduser = enc.iduser
    WHERE dm.professorutilizadoriduser = ${professorId}
    AND LOWER(e.tipoestado) IN ('confirmado', 'realizado', 'pendente', 'aguarda_professor', 'aguarda_ee')
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;

  return aulas.map(a => ({
    id: String(a.idpedidoaula),
    data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
    horaInicio: a.horainicio ? String(a.horainicio).substring(0, 5) : '',
    duracao: a.duracaoaula ? parseInt(String(a.duracaoaula).split(':')[0]) : 60,
    status: (a.estado_nome || '').toUpperCase(),
    modalidade: a.modalidade_nome || '',
    sala: a.sala_nome || '',
    alunoNome: a.aluno_nome || '',
    encarregadoId: String(a.encarregado_id || ''),
    encarregadoNome: a.encarregado_nome || '',
    privacidade: a.privacidade || false,
    sugestaoestado: a.sugestaoestado || null,
    novadata: a.novadata ? new Date(a.novadata).toISOString().split('T')[0] : null
  }));
};

export const updateAulaStatus = async (id, newStatus) => {
  const estado = await prisma.$queryRaw`
    SELECT idestado FROM estado WHERE tipoestado = ${newStatus}
  `;

  if (!estado || estado.length === 0) {
    throw new Error(`Estado ${newStatus} não encontrado`);
  }

  return await prisma.$queryRaw`
    UPDATE pedidodeaula
    SET estadoidestado = ${estado[0].idestado}
    WHERE idpedidoaula = ${parseInt(id)}
    RETURNING idpedidoaula, data, horainicio, duracaoaula, estadoidestado
  `;
};