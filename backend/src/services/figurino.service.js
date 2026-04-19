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
export const criarFigurino = async (dados, user) => {
  const userId = user?.iduser || 1;
  const userRole = user?.role || 'direcao';

  // Criamos o objeto de ligação apenas com o perfil do user
  const ligacao = {};
  if (userRole === 'direcao') ligacao.direcao = { connect: { utilizadoriduser: userId } };
  else if (userRole === 'professor') ligacao.professor = { connect: { utilizadoriduser: userId } };
  else ligacao.encarregadoeducacao = { connect: { utilizadoriduser: userId } };

  return await prisma.figurino.create({
    data: {
      quantidadedisponivel: dados.quantidade,
      quantidadetotal: dados.quantidade,
      modelofigurino: { connect: { idmodelo: dados.idmodelo } },
      genero: { connect: { idgenero: dados.idgenero } },
      tamanho: { connect: { idtamanho: dados.idtamanho } },
      cor: { connect: { idcor: dados.idcor } },
      estadouso: { connect: { idestado: 1 } },
      itemfigurino: { connect: { iditem: 1 } },
      ...ligacao // Envia apenas UM perfil
    }
  });
};