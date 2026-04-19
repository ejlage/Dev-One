import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
//T17
export const listarTodosFigurinos = async () => {
    return await prisma.figurino.findMany({
        include: {
          modelofigurino: true,
          cor: true,
          tamanho: true
        }
    });
};
//T18
export const buscarFigurinoPorId = async (id) => {
  return await prisma.figurino.findUnique({
    where: { idfigurino: parseInt(id) },
    include: {
      modelofigurino: true,
      cor: true,
      tamanho: true,
      estadouso: true
    }
  });
};

//T19
export const criarFigurino = async (dados) => {
  return await prisma.figurino.create({
    data: {
      quantidadedisponivel: dados.quantidade,
      quantidadetotal: dados.quantidade,
      // Ligações Obrigatórias
      cor: { connect: { idcor: dados.idcor } },
      tamanho: { connect: { idtamanho: dados.idtamanho } },
      modelofigurino: { connect: { idmodelofigurino: dados.idmodelo } },
      estadouso: { connect: { idestadouso: dados.idestado || 1 } },
      professor: { connect: { idutilizador: 1 } },
      genero: { connect: { idgenero: dados.idgenero || 1 } },
      // O CAMPO QUE FALTA: Liga à direção do Admin (Rui)
      direcao: { connect: { iddirecao: 1 } } 
    }
  });
};