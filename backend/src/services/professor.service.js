import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDisponibilidadesMensais = async (professorId) => {
  return await prisma.$queryRaw`
    SELECT dm.*, mp.modalidadeidmodalidade, m.nome as modalidade_nome
    FROM disponibilidade_mensal dm
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    WHERE dm.professorutilizadoriduser = ${professorId}
    AND dm.ativo = true
    ORDER BY dm.diadasemana, dm.horainicio
  `;
};

export const createDisponibilidadeMensal = async (data) => {
  const { professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, diadasemana, horainicio, horafim } = data;
  
  return await prisma.$queryRaw`
    INSERT INTO disponibilidade_mensal 
    (professorutilizadoriduser, modalidadesprofessoridmodalidadeprofessor, diadasemana, horainicio, horafim, ativo)
    VALUES (${professorutilizadoriduser}, ${modalidadesprofessoridmodalidadeprofessor}, ${diadasemana}, ${horainicio}, ${horafim}, true)
    RETURNING *
  `;
};

export const updateDisponibilidadeMensal = async (id, data) => {
  const { diadasemana, horainicio, horafim, ativo } = data;
  
  return await prisma.$queryRaw`
    UPDATE disponibilidade_mensal
    SET diadasemana = ${diadasemana}, horainicio = ${horainicio}, horafim = ${horafim}, ativo = ${ativo}
    WHERE iddisponibilidade_mensal = ${parseInt(id)}
    RETURNING *
  `;
};

export const deleteDisponibilidadeMensal = async (id) => {
  return await prisma.$queryRaw`
    DELETE FROM disponibilidade_mensal
    WHERE iddisponibilidade_mensal = ${parseInt(id)}
    RETURNING *
  `;
};

export const getProfessorModalidades = async (professorId) => {
  return await prisma.$queryRaw`
    SELECT mp.idmodalidadeprofessor, m.idmodalidade, m.nome as modalidade_nome
    FROM modalidadeprofessor mp
    JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    WHERE mp.professorutilizadoriduser = ${professorId}
  `;
};

export const getProfessorAulas = async (professorId) => {
  return await prisma.$queryRaw`
    SELECT 
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.estadoidestado,
      e.tipoestado as estado_nome,
      pa.privacidade,
      s.nomesala as sala_nome,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      u.nome as aluno_nome,
      u.iduser as aluno_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    JOIN disponibilidade d ON pa.disponibilidadeiddisponibilidade = d.iddisponibilidade
    JOIN modalidadeprofessor mp ON d.modalidadeprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    JOIN utilizador u ON pa.encarregadoeducacaoutilizadoriduser = u.iduser
    WHERE mp.professorutilizadoriduser = ${professorId}
    AND e.tipoestado IN ('CONFIRMADA', 'REALIZADA')
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;
};

export const getDiasSemana = () => {
  return [
    { num: 1, label: "Segunda-feira", short: "Seg" },
    { num: 2, label: "Terça-feira", short: "Ter" },
    { num: 3, label: "Quarta-feira", short: "Qua" },
    { num: 4, label: "Quinta-feira", short: "Qui" },
    { num: 5, label: "Sexta-feira", short: "Sex" },
    { num: 6, label: "Sábado", short: "Sáb" },
  ];
};
