import prisma from "../config/db.js";

export const getAllTurmas = async () => {
  const turmas = await prisma.grupo.findMany({
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
  return turmas;
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
  const { nomegrupo } = data;

  const turma = await prisma.grupo.create({
    data: {
      nomegrupo
    },
    include: {
      alunogrupo: true
    }
  });

  return turma;
};

export const updateTurma = async (id, data) => {
  const { nomegrupo } = data;

  const existingTurma = await prisma.grupo.findUnique({
    where: { idgrupo: id }
  });

  if (!existingTurma) {
    throw new Error("Turma não encontrada");
  }

  const updateData = {};
  if (nomegrupo !== undefined) updateData.nomegrupo = nomegrupo;

  const turma = await prisma.grupo.update({
    where: { idgrupo: id },
    data: updateData,
    include: {
      alunogrupo: true
    }
  });

  return turma;
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

export const enrollAluno = async (turmaId, alunoId) => {
  const turma = await prisma.grupo.findUnique({
    where: { idgrupo: turmaId }
  });

  if (!turma) {
    throw new Error("Turma não encontrada");
  }

  const aluno = await prisma.aluno.findUnique({
    where: { idaluno: alunoId }
  });

  if (!aluno) {
    throw new Error("Aluno não encontrado");
  }

  const existingEnrollment = await prisma.alunogrupo.findFirst({
    where: {
      grupoidgrupo: turmaId,
      alunoidaluno: alunoId
    }
  });

  if (existingEnrollment) {
    throw new Error("Aluno já matriculado nesta turma");
  }

  const enrollment = await prisma.alunogrupo.create({
    data: {
      grupoidgrupo: turmaId,
      alunoidaluno: alunoId
    },
    include: {
      aluno: {
        include: {
          utilizador: true
        }
      },
      grupo: true
    }
  });

  return enrollment;
};

export const removeAluno = async (turmaId, alunoId) => {
  const existingEnrollment = await prisma.alunogrupo.findFirst({
    where: {
      grupoidgrupo: turmaId,
      alunoidaluno: alunoId
    }
  });

  if (!existingEnrollment) {
    throw new Error("Aluno não matriculado nesta turma");
  }

  await prisma.alunogrupo.delete({
    where: { idalunogrupo: existingEnrollment.idalunogrupo }
  });

  return { message: "Aluno removido da turma com sucesso" };
};

export const closeTurma = async (id) => {
  const turma = await prisma.grupo.findUnique({
    where: { idgrupo: id }
  });

  if (!turma) {
    throw new Error("Turma não encontrada");
  }

  return { message: "Turma fechada com sucesso" };
};

export const archiveTurma = async (id) => {
  const turma = await prisma.grupo.findUnique({
    where: { idgrupo: id }
  });

  if (!turma) {
    throw new Error("Turma não encontrada");
  }

  return { message: "Turma arquivada com sucesso" };
};