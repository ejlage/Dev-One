import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAlunoAulas = async (userId) => {
  const aulas = await prisma.$queryRaw`
    SELECT 
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.estadoidestado,
      e.tipoestado as estado_nome,
      s.nomesala as sala_nome,
      m.nome as modalidade_nome,
      u.nome as professor_nome,
      u.iduser as professor_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    WHERE pa.encarregadoeducacaoutilizadoriduser IS NOT NULL
    AND e.tipoestado IN ('CONFIRMADA', 'REALIZADA')
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;

  return aulas.map(a => ({
    id: String(a.idpedidoaula),
    data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
    horaInicio: a.horainicio ? String(a.horainicio).substring(0, 5) : '',
    duracao: a.duracaoaula ? parseInt(String(a.duracaoaula).split(':')[0]) : 60,
    status: a.estado_nome || '',
    modalidade: a.modalidade_nome || '',
    sala: a.sala_nome || '',
    professorId: String(a.professor_id || ''),
    professorNome: a.professor_nome || ''
  }));
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