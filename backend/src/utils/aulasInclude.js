//include de todos os dados de aula para organizar codigo

export const aulaInclude = {
  estadoaula: true,
  sala: {
    include: { tiposala: true, estadosala: true },
  },
  alunoaula: {
    include: {
      aluno: { include: { utilizador: true } },
    },
  },
  pedidodeaula: {
    include: {
      sala: {
        include: { tiposala: true, estadosala: true },
      },
      estado: true,
      grupo: true,
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade: {
        include: {
          professor: { include: { utilizador: true } },
          modalidadeprofessor: { include: { modalidade: true } },
          tipoaula: true,
        },
      },
    },
  },
};