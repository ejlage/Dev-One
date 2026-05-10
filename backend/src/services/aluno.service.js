import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statusMap = {
  'PENDENTE': 'PENDENTE',
  'CONFIRMADO': 'CONFIRMADA',
  'APROVADO': 'APROVADA',
  'REJEITADO': 'REJEITADA',
  'REALIZADO': 'REALIZADA',
  'CANCELADO': 'CANCELADA',
  'CONCLUÍDO': 'CONCLUÍDA',
};
const normalize = (s) => statusMap[s.toUpperCase()] || s.toUpperCase();

/**
 * Obtém aulas do aluno.
 * @param {number} userId
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
      s.nomesala as sala_nome,
      s.idsala as sala_id,
      m.nome as modalidade_nome,
      COALESCE(u.nome, uprof.nome) as professor_nome,
      COALESCE(u.iduser, uprof.iduser) as professor_id,
      pa.alunoutilizadoriduser as aluno_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    LEFT JOIN utilizador uprof ON pa.professorutilizadoriduser = uprof.iduser
    WHERE (
      pa.alunoutilizadoriduser = ${userId}
      OR (
        pa.alunoutilizadoriduser IS NULL
        AND pa.encarregadoeducacaoutilizadoriduser = (
          SELECT a.encarregadoiduser FROM aluno a WHERE a.utilizadoriduser = ${userId} LIMIT 1
        )
      )
    )
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;

  return aulas.map(a => {
    const horaInicio = a.horainicio instanceof Date
      ? a.horainicio.toISOString().substring(11, 16)
      : (a.horainicio ? String(a.horainicio).substring(0, 5) : '');
    const duracao = (() => {
      if (!a.duracaoaula) return 60;
      if (a.duracaoaula instanceof Date) return a.duracaoaula.getUTCHours() * 60 + a.duracaoaula.getUTCMinutes();
      const [h, m] = String(a.duracaoaula).split(':');
      return parseInt(h) * 60 + parseInt(m || '0');
    })();
    const [hH, hM] = horaInicio.split(':').map(Number);
    const endMin = hH * 60 + (hM || 0) + duracao;
    const horaFim = String(Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0');
    return {
      id: String(a.idpedidoaula),
      data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
      horaInicio,
      horaFim,
      duracao,
      status: normalize(a.estado_nome || ''),
      modalidade: a.modalidade_nome || '',
      estudioId: String(a.sala_id || ''),
      estudioNome: a.sala_nome || '',
      professorId: String(a.professor_id || ''),
      professorNome: a.professor_nome || '',
      alunoId: String(a.aluno_id || userId),
    };
  });
};

export const getAllDisponibilidadesMensais = async () => {
  return await prisma.$queryRaw`
    SELECT 
      dm.iddisponibilidade_mensal,
      dm.professorutilizadoriduser,
      dm.data,
      dm.horainicio,
      dm.horafim,
      mp.idmodalidadeprofessor,
      m.nome as modalidades_nome,
      u.nome as professor_nome
    FROM disponibilidade_mensal dm
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    WHERE dm.ativo = true
    ORDER BY dm.data, dm.horainicio
  `;
};