import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllAulas() {
  return prisma.aula.findMany({
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: {
        include: {
          disponibilidade: true,
          grupo: true,
        },
      },
      alunoaula: {
        include: {
          aluno: {
            include: {
              utilizador: true,
            },
          },
        },
      },
    },
  });
}

export async function getAulaById(id) {
  return prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: {
        include: {
          disponibilidade: true,
          grupo: true,
        },
      },
      alunoaula: {
        include: {
          aluno: {
            include: {
              utilizador: true,
            },
          },
        },
      },
    },
  });
}

export async function createAula(data) {
  const { pedidodeaulaidpedidoaula, salaidsala } = data;

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: pedidodeaulaidpedidoaula },
    include: {
      disponibilidade: true,
      sala: true,
    },
  });

  if (!pedido) {
    throw new Error("Pedido de aula não encontrado");
  }

  const conflictingAulas = await prisma.aula.findMany({
    where: {
      salaidsala: salaidsala,
      pedidodeaula: {
        data: pedido.data,
      },
    },
    include: {
      pedidodeaula: true,
    },
  });

  for (const aula of conflictingAulas) {
    if (aula.pedidodeaula && pedido.horainicio) {
      const existingStart = new Date(aula.pedidodeaula.horainicio).getTime();
      const existingEnd = existingStart + (aula.pedidodeaula.duracaoaula?.getTime() || 0);
      const newStart = new Date(pedido.horainicio).getTime();
      const newEnd = newStart + (pedido.duracaoaula?.getTime() || 0);

      if (newStart < existingEnd && newEnd > existingStart) {
        throw new Error("Sala não disponível para o horário solicitado");
      }
    }
  }

  const estadoPendente = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "PENDENTE" },
  });

  if (!estadoPendente) {
    throw new Error("Estado PENDENTE não encontrado");
  }

  return prisma.aula.create({
    data: {
      pedidodeaulaidpedidoaula,
      salaidsala,
      estadoaulaidestadoaula: estadoPendente.idestadoaula,
    },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: true,
    },
  });
}

export async function updateAula(id, data) {
  const { salaidsala, estadoaulaidestadoaula } = data;

  const existingAula = await prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
    include: {
      pedidodeaula: true,
    },
  });

  if (!existingAula) {
    throw new Error("Aula não encontrada");
  }

  if (salaidsala && salaidsala !== existingAula.salaidsala) {
    const pedido = await prisma.pedidodeaula.findUnique({
      where: { idpedidoaula: existingAula.pedidodeaulaidpedidoaula },
    });

    if (pedido) {
      const conflictingAulas = await prisma.aula.findMany({
        where: {
          salaidsala: salaidsala,
          idaula: { not: parseInt(id) },
          pedidodeaula: {
            data: pedido.data,
          },
        },
      });

      for (const aula of conflictingAulas) {
        if (aula.pedidodeaula && pedido.horainicio) {
          const existingStart = new Date(aula.pedidodeaula.horainicio).getTime();
          const existingEnd = existingStart + (aula.pedidodeaula.duracaoaula?.getTime() || 0);
          const newStart = new Date(pedido.horainicio).getTime();
          const newEnd = newStart + (pedido.duracaoaula?.getTime() || 0);

          if (newStart < existingEnd && newEnd > existingStart) {
            throw new Error("Sala não disponível para o horário solicitado");
          }
        }
      }
    }
  }

  return prisma.aula.update({
    where: { idaula: parseInt(id) },
    data: {
      ...(salaidsala && { salaidsala }),
      ...(estadoaulaidestadoaula && { estadoaulaidestadoaula }),
    },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: true,
      alunoaula: true,
    },
  });
}

export async function deleteAula(id) {
  const existingAula = await prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
  });

  if (!existingAula) {
    throw new Error("Aula não encontrada");
  }

  await prisma.alunoaula.deleteMany({
    where: { aulaidaula: parseInt(id) },
  });

  return prisma.aula.delete({
    where: { idaula: parseInt(id) },
  });
}

export async function confirmAula(id) {
  const aula = await prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
  });

  if (!aula) {
    throw new Error("Aula não encontrada");
  }

  const estadoConfirmada = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "CONFIRMADA" },
  });

  if (!estadoConfirmada) {
    throw new Error("Estado CONFIRMADA não encontrado");
  }

  return prisma.aula.update({
    where: { idaula: parseInt(id) },
    data: {
      estadoaulaidestadoaula: estadoConfirmada.idestadoaula,
    },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: true,
    },
  });
}

export async function cancelAula(id) {
  const aula = await prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
  });

  if (!aula) {
    throw new Error("Aula não encontrada");
  }

  const estadoCancelada = await prisma.estadoaula.findFirst({
    where: { nomeestadoaula: "CANCELADA" },
  });

  if (!estadoCancelada) {
    throw new Error("Estado CANCELADA não encontrado");
  }

  return prisma.aula.update({
    where: { idaula: parseInt(id) },
    data: {
      estadoaulaidestadoaula: estadoCancelada.idestadoaula,
    },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: true,
    },
  });
}

export async function remarcarAula(id, newData, newHora) {
  const aula = await prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
    include: {
      pedidodeaula: true,
      sala: true,
    },
  });

  if (!aula) {
    throw new Error("Aula não encontrada");
  }

  const conflictingAulas = await prisma.aula.findMany({
    where: {
      salaidsala: aula.salaidsala,
      idaula: { not: parseInt(id) },
    },
    include: {
      pedidodeaula: true,
    },
  });

  for (const existingAula of conflictingAulas) {
    if (existingAula.pedidodeaula && newData) {
      const existingDate = new Date(existingAula.pedidodeaula.data).toDateString();
      const newDateStr = new Date(newData).toDateString();

      if (existingDate === newDateStr && newHora && existingAula.pedidodeaula.horainicio) {
        const existingStart = new Date(existingAula.pedidodeaula.horainicio).getTime();
        const existingEnd = existingStart + (existingAula.pedidodeaula.duracaoaula?.getTime() || 0);
        const newStart = new Date(newHora).getTime();

        const duracao = aula.pedidodeaula?.duracaoaula?.getTime() || 3600000;
        const newEnd = newStart + duracao;

        if (newStart < existingEnd && newEnd > existingStart) {
          throw new Error("Sala não disponível para o novo horário");
        }
      }
    }
  }

  await prisma.pedidodeaula.update({
    where: { idpedidoaula: aula.pedidodeaulaidpedidoaula },
    data: {
      ...(newData && { data: new Date(newData) }),
      ...(newHora && { horainicio: new Date(newHora) }),
    },
  });

  return prisma.aula.findUnique({
    where: { idaula: parseInt(id) },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: true,
      alunoaula: {
        include: {
          aluno: true,
        },
      },
    },
  });
}

export async function joinAula(aulaId, alunoId) {
  const aula = await prisma.aula.findUnique({
    where: { idaula: parseInt(aulaId) },
    include: {
      pedidodeaula: true,
      alunoaula: true,
      estadoaula: true,
    },
  });

  if (!aula) {
    throw new Error("Aula não encontrada");
  }

  if (aula.estadoaula.nomeestadoaula !== "PENDENTE" && aula.estadoaula.nomeestadoaula !== "CONFIRMADA") {
    throw new Error("Não é possível juntar-se a esta aula");
  }

  const alreadyJoined = aula.alunoaula.some((a) => a.alunoidaluno === parseInt(alunoId));
  if (alreadyJoined) {
    throw new Error("Aluno já participa nesta aula");
  }

  if (aula.pedidodeaula && aula.alunoaula.length >= aula.pedidodeaula.maxparticipantes) {
    throw new Error("Atingido limite máximo de participantes");
  }

  const aluno = await prisma.aluno.findUnique({
    where: { idaluno: parseInt(alunoId) },
  });

  if (!aluno) {
    throw new Error("Aluno não encontrado");
  }

  return prisma.alunoaula.create({
    data: {
      alunoidaluno: parseInt(alunoId),
      aulaidaula: parseInt(aulaId),
    },
    include: {
      aluno: true,
      aula: {
        include: {
          estadoaula: true,
          sala: true,
        },
      },
    },
  });
}

export async function getEstadoAulaByName(nome) {
  return prisma.estadoaula.findFirst({
    where: { nomeestadoaula: nome },
  });
}

export async function sugerirNovaData(pedidoId, novaData) {
  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);
  
  return prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(pedidoId) },
    data: {
      novadata: new Date(novaData),
      novaDataLimite: tresHoras,
    },
    include: {
      disponibilidade: {
        include: {
          modalidade: true,
          professor: { include: { utilizador: true } }
        }
      },
      encarregadoeducacao: { include: { utilizador: true } },
      sala: true,
    },
  });
}