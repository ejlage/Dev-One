import prisma from "../config/db.js";
import { createNotificacao } from "./notificacoes.service.js";

const mapGrupo = (g) => ({
  id: String(g.idgrupo),
  nome: g.nomegrupo,
  status: g.status,
  descricao: g.descricao || '',
  modalidade: g.modalidade || '',
  nivel: g.nivel || 'Iniciante',
  faixaEtaria: g.faixaEtaria || '',
  professorId: g.professorId ? String(g.professorId) : '',
  professorNome: '',
  estudioId: g.estudioId ? String(g.estudioId) : '',
  estudioNome: '',
  diasSemana: g.diasSemana ? (() => { try { return JSON.parse(g.diasSemana); } catch { return []; } })() : [],
  horaInicio: g.horaInicio || '',
  horaFim: g.horaFim || '',
  duracao: g.duracao || 60,
  lotacaoMaxima: g.lotacaoMaxima || 0,
  dataInicio: g.dataInicio || '',
  dataFim: g.dataFim || undefined,
  cor: g.cor || '#5eead4',
  requisitos: g.requisitos || undefined,
  criadaEm: new Date().toISOString(),
  alunosInscritos: (g.alunogrupo || []).map(ag => ({
    alunoId: String(ag.aluno?.utilizadoriduser ?? ag.alunoidaluno),
    alunoNome: ag.aluno?.utilizador?.nome || '',
    encarregadoId: '',
    inscritoEm: new Date().toISOString(),
  })),
});

export const getAllTurmas = async () => {
  const turmas = await prisma.grupo.findMany({
    include: {
      alunogrupo: {
        include: { aluno: { include: { utilizador: true } } }
      }
    }
  });
  return turmas.map(mapGrupo);
};

export const getTurmaById = async (id) => {
  const turma = await prisma.grupo.findUnique({
    where: { idgrupo: id },
    include: {
      alunogrupo: {
        include: {
          aluno: {
            include: {
              utilizador: true
            }
          }
        }
      }
    }
  });
  return turma;
};

export const createTurma = async (data) => {
  const {
    nomegrupo, status, descricao, modalidade, nivel, faixaEtaria,
    professorId, estudioId, diasSemana, horaInicio, horaFim, duracao,
    lotacaoMaxima, dataInicio, dataFim, cor, requisitos
  } = data;

  return prisma.grupo.create({
    data: {
      nomegrupo,
      ...(status && { status }),
      ...(descricao !== undefined && { descricao }),
      ...(modalidade !== undefined && { modalidade }),
      ...(nivel !== undefined && { nivel }),
      ...(faixaEtaria !== undefined && { faixaEtaria }),
      ...(professorId !== undefined && { professorId: parseInt(professorId) }),
      ...(estudioId !== undefined && { estudioId: parseInt(estudioId) }),
      ...(diasSemana !== undefined && { diasSemana: JSON.stringify(diasSemana) }),
      ...(horaInicio !== undefined && { horaInicio }),
      ...(horaFim !== undefined && { horaFim }),
      ...(duracao !== undefined && { duracao: parseInt(duracao) }),
      ...(lotacaoMaxima !== undefined && { lotacaoMaxima: parseInt(lotacaoMaxima) }),
      ...(dataInicio !== undefined && { dataInicio }),
      ...(dataFim !== undefined && { dataFim }),
      ...(cor !== undefined && { cor }),
      ...(requisitos !== undefined && { requisitos }),
    },
    include: { alunogrupo: true }
  });
};

export const updateTurma = async (id, data) => {
  const existing = await prisma.grupo.findUnique({ where: { idgrupo: id } });
  if (!existing) throw new Error("Turma não encontrada");

  const {
    nomegrupo, status, descricao, modalidade, nivel, faixaEtaria,
    professorId, estudioId, diasSemana, horaInicio, horaFim, duracao,
    lotacaoMaxima, dataInicio, dataFim, cor, requisitos
  } = data;

  const updateData = {};
  if (nomegrupo !== undefined) updateData.nomegrupo = nomegrupo;
  if (status !== undefined) updateData.status = status;
  if (descricao !== undefined) updateData.descricao = descricao;
  if (modalidade !== undefined) updateData.modalidade = modalidade;
  if (nivel !== undefined) updateData.nivel = nivel;
  if (faixaEtaria !== undefined) updateData.faixaEtaria = faixaEtaria;
  if (professorId !== undefined) updateData.professorId = parseInt(professorId);
  if (estudioId !== undefined) updateData.estudioId = parseInt(estudioId);
  if (diasSemana !== undefined) updateData.diasSemana = JSON.stringify(diasSemana);
  if (horaInicio !== undefined) updateData.horaInicio = horaInicio;
  if (horaFim !== undefined) updateData.horaFim = horaFim;
  if (duracao !== undefined) updateData.duracao = parseInt(duracao);
  if (lotacaoMaxima !== undefined) updateData.lotacaoMaxima = parseInt(lotacaoMaxima);
  if (dataInicio !== undefined) updateData.dataInicio = dataInicio;
  if (dataFim !== undefined) updateData.dataFim = dataFim;
  if (cor !== undefined) updateData.cor = cor;
  if (requisitos !== undefined) updateData.requisitos = requisitos;

  return prisma.grupo.update({
    where: { idgrupo: id },
    data: updateData,
    include: { alunogrupo: true }
  });
};

export const deleteTurma = async (id) => {
  const existingTurma = await prisma.grupo.findUnique({
    where: { idgrupo: id }
  });

  if (!existingTurma) {
    throw new Error("Turma não encontrada");
  }

  await prisma.alunogrupo.deleteMany({
    where: { grupoidgrupo: id }
  });

  await prisma.grupo.delete({
    where: { idgrupo: id }
  });

  return { message: "Turma eliminada com sucesso" };
};

async function getGrupoIntervenientes(turmaId) {
  const grupo = await prisma.grupo.findUnique({
    where: { idgrupo: turmaId },
    include: {
      alunogrupo: {
        include: {
          aluno: {
            include: {
              encarregadoeducacao: { include: { utilizador: true } },
              utilizador: true,
            }
          }
        }
      }
    }
  });
  if (!grupo) return { professorUserId: null, encarregadoIds: [], nomeGrupo: '' };

  let professorUserId = null;
  if (grupo.professorId) {
    const prof = await prisma.professor.findUnique({ where: { utilizadoriduser: grupo.professorId } });
    if (prof) professorUserId = prof.utilizadoriduser;
  }

  const encarregadoIds = grupo.alunogrupo
    .map(ag => ag.aluno?.encarregadoeducacao?.utilizadoriduser)
    .filter(Boolean);

  return { professorUserId, encarregadoIds: [...new Set(encarregadoIds)], nomeGrupo: grupo.nomegrupo };
}

export const enrollAluno = async (turmaId, alunoId) => {
  const turma = await prisma.grupo.findUnique({
    where: { idgrupo: turmaId }
  });

  if (!turma) {
    throw new Error("Turma não encontrada");
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      OR: [
        { idaluno: alunoId },
        { utilizadoriduser: alunoId }
      ]
    }
  });

  if (!aluno) {
    throw new Error("Aluno não encontrado");
  }

  const existingEnrollment = await prisma.alunogrupo.findFirst({
    where: {
      grupoidgrupo: turmaId,
      alunoidaluno: aluno.idaluno
    }
  });

  if (existingEnrollment) {
    throw new Error("Aluno já matriculado nesta turma");
  }

  const enrollment = await prisma.alunogrupo.create({
    data: {
      grupoidgrupo: turmaId,
      alunoidaluno: aluno.idaluno
    },
    include: {
      aluno: { include: { utilizador: true, encarregadoeducacao: true } },
      grupo: true
    }
  });

  const nomeGrupo = turma.nomegrupo;
  const alunoNome = enrollment.aluno?.utilizador?.nome || `Aluno #${alunoId}`;

  // Notificar encarregado do aluno inscrito
  const encId = enrollment.aluno?.encarregadoeducacao?.utilizadoriduser;
  if (encId) {
    await createNotificacao(encId, `O seu educando ${alunoNome} foi inscrito no grupo "${nomeGrupo}".`, 'GRUPO_INSCRICAO');
  }

  // Notificar professor do grupo
  if (turma.professorId) {
    await createNotificacao(turma.professorId, `Um novo aluno (${alunoNome}) foi inscrito no grupo "${nomeGrupo}".`, 'GRUPO_INSCRICAO');
  }

  return enrollment;
};

export const removeAluno = async (turmaId, userId) => {
  const alunoRec = await prisma.aluno.findFirst({
    where: { utilizadoriduser: userId }
  });
  const alunoId = alunoRec ? alunoRec.idaluno : userId;

  const existingEnrollment = await prisma.alunogrupo.findFirst({
    where: { grupoidgrupo: turmaId, alunoidaluno: alunoId }
  });

  if (!existingEnrollment) {
    throw new Error("Aluno não matriculado nesta turma");
  }

  await prisma.alunogrupo.delete({
    where: { idalunogrupo: existingEnrollment.idalunogrupo }
  });

  // Notificações após remoção
  const grupoInfo = await prisma.grupo.findUnique({ where: { idgrupo: turmaId } });
  const alunoInfo = await prisma.aluno.findUnique({
    where: { idaluno: alunoId },
    include: { utilizador: true, encarregadoeducacao: true }
  });
  const nomeGrupo = grupoInfo?.nomegrupo || `Grupo #${turmaId}`;
  const alunoNome = alunoInfo?.utilizador?.nome || `Aluno #${userId}`;

  const encId = alunoInfo?.encarregadoeducacao?.utilizadoriduser;
  if (encId) {
    await createNotificacao(encId, `O seu educando ${alunoNome} foi removido do grupo "${nomeGrupo}".`, 'GRUPO_REMOCAO');
  }
  if (grupoInfo?.professorId) {
    await createNotificacao(grupoInfo.professorId, `O aluno ${alunoNome} foi removido do grupo "${nomeGrupo}".`, 'GRUPO_REMOCAO');
  }

  return { message: "Aluno removido da turma com sucesso" };
};

export const closeTurma = async (id) => {
  const turma = await prisma.grupo.findUnique({ where: { idgrupo: id } });
  if (!turma) throw new Error("Turma não encontrada");
  const newStatus = turma.status === 'ABERTA' ? 'FECHADA' : 'ABERTA';
  const updated = await prisma.grupo.update({ where: { idgrupo: id }, data: { status: newStatus } });

  const { professorUserId, encarregadoIds, nomeGrupo } = await getGrupoIntervenientes(id);
  if (newStatus === 'FECHADA') {
    if (professorUserId) {
      await createNotificacao(professorUserId, `O grupo "${nomeGrupo}" foi encerrado para novas inscrições.`, 'GRUPO_FECHADO');
    }
    for (const encId of encarregadoIds) {
      await createNotificacao(encId, `As inscrições do grupo "${nomeGrupo}" foram encerradas pela Direção.`, 'GRUPO_FECHADO');
    }
  } else {
    if (professorUserId) {
      await createNotificacao(professorUserId, `O grupo "${nomeGrupo}" foi reaberto para inscrições.`, 'GRUPO_ABERTO');
    }
  }

  return updated;
};

export const archiveTurma = async (id) => {
  const turma = await prisma.grupo.findUnique({ where: { idgrupo: id } });
  if (!turma) throw new Error("Turma não encontrada");
  const updated = await prisma.grupo.update({ where: { idgrupo: id }, data: { status: 'ARQUIVADA' } });

  const { professorUserId, encarregadoIds, nomeGrupo } = await getGrupoIntervenientes(id);
  if (professorUserId) {
    await createNotificacao(professorUserId, `O grupo "${nomeGrupo}" foi arquivado pela Direção.`, 'GRUPO_ARQUIVADO');
  }
  for (const encId of encarregadoIds) {
    await createNotificacao(encId, `O grupo "${nomeGrupo}" foi arquivado. O seu educando já não terá aulas neste grupo.`, 'GRUPO_ARQUIVADO');
  }

  return updated;
};