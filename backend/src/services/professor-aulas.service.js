import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Obtém aulas do professor.
 * @param {number} professorId
 * @returns {Promise<any>} {Promise<object[]>}
 */

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
      dm.professorutilizadoriduser as dm_professor_id,
      alu.nome as aluno_nome,
      al.idaluno as aluno_id,
      enc.nome as encarregado_nome,
      pa.encarregadoeducacaoutilizadoriduser as encarregado_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN alunoaula aa ON pa.idpedidoaula = aa.aulaidaula
    LEFT JOIN aluno al ON aa.alunoidaluno = al.idaluno
    LEFT JOIN utilizador alu ON al.utilizadoriduser = alu.iduser
    LEFT JOIN utilizador enc ON pa.encarregadoeducacaoutilizadoriduser = enc.iduser
    WHERE (dm.professorutilizadoriduser = ${professorId} OR pa.disponibilidade_mensal_id IS NULL)
    AND LOWER(e.tipoestado) IN ('confirmado', 'realizado', 'pendente')
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;

  return aulas.map(a => {
    const hora = a.horainicio;
    const horaFmt = hora instanceof Date 
      ? hora.toISOString().substring(11, 16) 
      : String(hora).substring(0, 5);
      
return {
      id: String(a.idpedidoaula),
      data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
      horaInicio: horaFmt,
      duracao: a.duracaoaula ? parseInt(String(a.duracaoaula).split(':')[0]) : 60,
      status: (a.estado_nome || '').toUpperCase(),
      modalidade: a.modalidade_nome || '',
      estudioNome: a.sala_nome || '',
      alunoNome: a.aluno_nome || '',
      encarregadoId: String(a.encarregado_id || ''),
      encarregadoNome: a.encarregado_nome || '',
      privacidade: a.privacidade || false,
      sugestaoestado: a.sugestaoestado || null,
      novadata: a.novadata ? new Date(a.novadata).toISOString().split('T')[0] : null,
      novaData: a.novadata ? new Date(a.novadata).toISOString().split('T')[0] : null
    };
  });
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