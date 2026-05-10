import { PrismaClient } from "@prisma/client";
import { createNotificacao } from "./notificacoes.service.js";

const prisma = new PrismaClient();

export async function getAllAulas() {
  return prisma.aula.findMany({
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: {
        include: {
          disponibilidade_mensal: true,
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
          disponibilidade_mensal: true,
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
      disponibilidade_mensal: true,
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
    include: {
      pedidodeaula: {
        include: { disponibilidade_mensal: { include: { professor: true } } },
      },
    },
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

  const aulaAtualizada = await prisma.aula.update({
    where: { idaula: parseInt(id) },
    data: { estadoaulaidestadoaula: estadoCancelada.idestadoaula },
    include: { estadoaula: true, sala: true, pedidodeaula: true },
  });

  const direcao = await prisma.direcao.findFirst();
  if (direcao) {
    const professorNome =
      aula.pedidodeaula?.disponibilidade_mensal?.professor?.utilizadoriduser
        ? `(professor #${aula.pedidodeaula.disponibilidade_mensal.professor.utilizadoriduser})`
        : '';
    await createNotificacao(
      direcao.utilizadoriduser,
      `A aula #${id} foi cancelada pelo professor ${professorNome}. É necessário remarcar.`,
      'AULA_CANCELADA'
    );
  }

  return aulaAtualizada;
}

export async function remarcarAula(id, newData, newHora) {
  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(id) },
    include: {
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } },
      },
      encarregadoeducacao: { include: { utilizador: true } },
      sala: true,
    },
  });

  if (!pedido) throw new Error("Aula não encontrada");

  const professorUserId = pedido.disponibilidade_mensal?.professor?.utilizadoriduser;

  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const updated = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(id) },
    data: {
      novadata: newData ? new Date(newData) : undefined,
      novaDataLimite: tresHoras,
      sugestaoestado: 'AGUARDA_PROFESSOR',
    },
  });

  if (professorUserId) {
    const dataFormatada = newData ? new Date(newData).toLocaleDateString('pt-PT') : '';
    await createNotificacao(
      professorUserId,
      `A Direção propôs remarcar a aula #${id} para ${dataFormatada}. Por favor confirme se aceita.`,
      'SUGESTAO_REMARCACAO_PROFESSOR'
    );
  }

  return updated;
}

export async function responderSugestaoProfessor(aulaId, aceitar, professorUserId) {
  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(aulaId) },
    include: {
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } },
      },
    },
  });

  if (!pedido) throw new Error("Aula não encontrada");
  if (pedido.sugestaoestado !== 'AGUARDA_PROFESSOR') {
    throw new Error("Não existe sugestão pendente para este professor");
  }

  const professorDaAula = pedido.disponibilidade_mensal?.professor?.utilizadoriduser;
  if (professorDaAula && professorDaAula !== parseInt(professorUserId)) {
    throw new Error("Não tem permissão para responder a esta sugestão");
  }

  const dataFormatada = pedido.novadata
    ? new Date(pedido.novadata).toLocaleDateString('pt-PT')
    : '';
  const encarregadoUserId = pedido.encarregadoeducacao?.utilizadoriduser;

  if (!aceitar) {
    const estadoCancelado = await prisma.estado.findFirst({
      where: { tipoestado: { equals: 'Cancelado', mode: 'insensitive' } },
    });
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: parseInt(aulaId) },
      data: {
        novadata: null,
        novaDataLimite: null,
        sugestaoestado: null,
        ...(estadoCancelado && { estadoidestado: estadoCancelado.idestado }),
      },
    });

    const direcao = await prisma.direcao.findFirst();
    if (direcao) {
      await createNotificacao(
        direcao.utilizadoriduser,
        `O professor rejeitou a remarcação da aula #${aulaId}. A aula foi cancelada.`,
        'REMARCACAO_REJEITADA_PROFESSOR'
      );
    }
    if (encarregadoUserId) {
      await createNotificacao(
        encarregadoUserId,
        `A remarcação da aula #${aulaId} foi cancelada pelo professor.`,
        'AULA_CANCELADA'
      );
    }
    return { cancelada: true };
  }

  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const updated = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(aulaId) },
    data: { novaDataLimite: tresHoras, sugestaoestado: 'AGUARDA_EE' },
  });

  if (encarregadoUserId) {
    await createNotificacao(
      encarregadoUserId,
      `O professor aceitou remarcar a aula #${aulaId} para ${dataFormatada}. Por favor confirme se aceita.`,
      'SUGESTAO_REMARCACAO_EE'
    );
  }

  return updated;
}

export async function responderSugestaoEE(aulaId, aceitar, encarregadoUserId) {
  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(aulaId) },
    include: {
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } },
      },
    },
  });

  if (!pedido) throw new Error("Aula não encontrada");
  if (pedido.sugestaoestado !== 'AGUARDA_EE') {
    throw new Error("Não existe sugestão pendente para este encarregado");
  }

  const eeDaAula = pedido.encarregadoeducacaoutilizadoriduser;
  if (eeDaAula && eeDaAula !== parseInt(encarregadoUserId)) {
    throw new Error("Não tem permissão para responder a esta sugestão");
  }

  const novaData = pedido.novadata;
  const professorId = pedido.disponibilidade_mensal?.professor?.utilizadoriduser;
  const direcao = await prisma.direcao.findFirst();
  const dataFormatada = novaData ? new Date(novaData).toLocaleDateString('pt-PT') : '';

  if (!aceitar) {
    const estadoCancelado = await prisma.estado.findFirst({
      where: { tipoestado: { equals: 'Cancelado', mode: 'insensitive' } },
    });
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: parseInt(aulaId) },
      data: {
        novadata: null,
        novaDataLimite: null,
        sugestaoestado: null,
        ...(estadoCancelado && { estadoidestado: estadoCancelado.idestado }),
      },
    });

    if (professorId) {
      await createNotificacao(
        professorId,
        `O encarregado rejeitou a remarcação da aula #${aulaId}. A aula foi cancelada.`,
        'AULA_CANCELADA'
      );
    }
    if (direcao) {
      await createNotificacao(
        direcao.utilizadoriduser,
        `O encarregado rejeitou a remarcação da aula #${aulaId}. A aula foi cancelada.`,
        'AULA_CANCELADA'
      );
    }

    return { cancelada: true };
  }

  const updated = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(aulaId) },
    data: {
      data: novaData,
      novadata: null,
      novaDataLimite: null,
      sugestaoestado: null,
    },
  });

  if (professorId) {
    await createNotificacao(
      professorId,
      `Aula #${aulaId} remarcada para ${dataFormatada} com sucesso.`,
      'AULA_REMARCADA'
    );
  }
  if (direcao) {
    await createNotificacao(
      direcao.utilizadoriduser,
      `Aula #${aulaId} remarcada para ${dataFormatada} com sucesso.`,
      'AULA_REMARCADA'
    );
  }

  return updated;
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
      disponibilidade_mensal: true,
      encarregadoeducacao: { include: { utilizador: true } },
      sala: true,
    },
  });
}