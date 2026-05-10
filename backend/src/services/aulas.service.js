import { PrismaClient } from "@prisma/client";
import { createNotificacao } from "./notificacoes.service.js";
import { createAuditLog } from "./audit.service.js";

const prisma = new PrismaClient();

/**
 * Lista todas as aulas.
 * @returns {Promise<object[]>} Array de aulas com relações.
 */
export async function listarAulas() {
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

/**
 * Consulta uma aula pelo ID.
 * @param {string|number} id - ID da aula
 * @returns {Promise<object>} Aula com relações ou null
 */
export async function consultarAula(id) {
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

/**
 * Obtém aula associada a um pedido.
 * @param {string|number} pedidoId - ID do pedido
 * @returns {Promise<any>} {Promise<object|null>}
 */

  /**
   * Obtém aula associada a um pedido.
   * @param {string|number} pedidoId - ID do pedido
   * @returns {Promise<object|null>} Aula ou null
   */
  return prisma.aula.findFirst({
    where: { pedidodeaulaidpedidoaula: parseInt(pedidoId) },
    include: {
      estadoaula: true,
      sala: true,
      pedidodeaula: {
        include: {
          disponibilidade_mensal: true,
          grupo: true,
          estado: true,
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

/**
 * Cria uma nova aula.
 * @param {object} data - Dados da aula
 * @returns {Promise<any>} {Promise<object>}
 */

  /**
   * Cria uma nova aula.
   * @param {object} data - Dados da aula
   * @returns {Promise<object>} Aula criada
   */
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

/**
 * Atualiza uma aula.
 * @param {string|number} id @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

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

/**
 * Elimina uma aula.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<void>}
 */

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

/**
 * Confirma uma aula.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<object>}
 */

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

/**
 * Cancela uma aula.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<object>}
 */

  /**
   * Cancela uma aula.
   * @param {string|number} id - ID da aula
   * @returns {Promise<object>} Aula cancelada
   */
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

/**
 * Remarca uma aula.
 * @param {string|number} id @param {string} newData @param {string} newHora
 * @returns {Promise<any>} {Promise<object>}
 */

  /**
   * Remarca uma aula para nova data/hora.
   * @param {string|number} id - ID da aula
   * @param {string} newData - Nova data
   * @param {string} newHora - Nova hora
   * @returns {Promise<object>} Aula atualizada
   */
  const agora = new Date();
  const novaDataInput = new Date(newData);
  const dataHojeStr = agora.toISOString().split('T')[0];
  const novaDataStr = novaDataInput.toISOString().split('T')[0];
  
  if (novaDataStr < dataHojeStr) {
    throw new Error('A data não pode ser no passado');
  }
  
  if (novaDataStr === dataHojeStr && newHora) {
    const [horaH, horaM] = newHora.split(':').map(Number);
    const horaInput = horaH * 60 + horaM;
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    if (horaInput <= horaAtual) {
      throw new Error('A hora deve ser posterior à hora atual');
    }
  }
  
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

  // Server-side conflict check: same professor or same sala at same date/hora
  if (professorUserId && newData && newHora) {
    const conflitos = await prisma.$queryRaw`
      SELECT pa.idpedidoaula FROM pedidodeaula pa
      JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
      JOIN estado e ON pa.estadoidestado = e.idestado
      WHERE dm.professorutilizadoriduser = ${professorUserId}
      AND pa.data::date = ${newData}::date
      AND pa.horainicio::time = ${newHora}::time
      AND LOWER(e.tipoestado) IN ('pendente', 'confirmado', 'aprovado')
      AND pa.idpedidoaula != ${parseInt(id)}
    `;
    if (conflitos.length > 0) {
      throw new Error('O professor já tem uma aula marcada nesse horário');
    }

    const conflitosSala = await prisma.$queryRaw`
      SELECT pa.idpedidoaula FROM pedidodeaula pa
      JOIN estado e ON pa.estadoidestado = e.idestado
      WHERE pa.salaidsala = ${pedido.salaidsala}
      AND pa.data::date = ${newData}::date
      AND pa.horainicio::time = ${newHora}::time
      AND LOWER(e.tipoestado) IN ('pendente', 'confirmado', 'aprovado')
      AND pa.idpedidoaula != ${parseInt(id)}
    `;
    if (conflitosSala.length > 0) {
      throw new Error('A sala já está ocupada nesse horário');
    }
  }

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

  await createAuditLog(null, 'Direção', 'UPDATE', 'PedidoAula', parseInt(id), `Direção propôs remarcação para ${newData}`);

  return updated;
}

/**
 * Responde a sugestão do professor.
 * @param {string|number} aulaId @param {boolean} aceitar
 * @returns {Promise<any>} {Promise<object>}
 */

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

  if (!aceitar) {
    // Professor rejects: reset suggestion, keep aula state — Direção can propose again
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: parseInt(aulaId) },
      data: { novadata: null, novaDataLimite: null, sugestaoestado: null },
    });

    const direcao = await prisma.direcao.findFirst();
    if (direcao) {
      await createNotificacao(
        direcao.utilizadoriduser,
        `O professor rejeitou a data proposta para a aula #${aulaId}. Pode propor uma nova data.`,
        'REMARCACAO_REJEITADA_PROFESSOR'
      );
    }
    return { rejeitada: true };
  }

  // Professor accepts: forward to EE for confirmation
  const encarregadoUserId = pedido.encarregadoeducacao?.utilizadoriduser;
  const dataFormatadaEE = pedido.novadata
    ? new Date(pedido.novadata).toLocaleDateString('pt-PT')
    : '';

  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(aulaId) },
    data: { novaDataLimite: tresHoras, sugestaoestado: 'AGUARDA_EE' },
  });

  await createAuditLog(
    parseInt(professorUserId), '', 'UPDATE', 'PedidoAula', parseInt(aulaId),
    `Professor aceitou remarcação, aguarda confirmação do EE`
  );

  if (encarregadoUserId) {
    await createNotificacao(
      encarregadoUserId,
      `O professor aceitou a remarcação da aula #${aulaId} para ${dataFormatadaEE}. Por favor confirme se aceita a nova data.`,
      'SUGESTAO_REMARCACAO_EE'
    );
  }

  return { reencaminhada: true, sugestaoestado: 'AGUARDA_EE' };
}

/**
 * Responde a sugestão do encarregado.
 * @param {string|number} aulaId @param {boolean} aceitar
 * @returns {Promise<any>} {Promise<object>}
 */

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

  const encarregadoDaAula = pedido.encarregadoeducacao?.utilizadoriduser;
  if (encarregadoDaAula && encarregadoDaAula !== parseInt(encarregadoUserId)) {
    throw new Error("Não tem permissão para responder a esta sugestão");
  }

  const novaData = pedido.novadata;
  const professorId = pedido.disponibilidade_mensal?.professor?.utilizadoriduser;
  const direcao = await prisma.direcao.findFirst();
  const dataFormatada = novaData ? new Date(novaData).toLocaleDateString('pt-PT') : '';

  if (!aceitar) {
    await createAuditLog(
      parseInt(encarregadoUserId), '', 'UPDATE', 'PedidoAula', parseInt(aulaId),
      `EE rejeitou remarcação`
    );
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

  // EE accepts: apply the new date
  const updated = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(aulaId) },
    data: {
      data: novaData,
      novadata: null,
      novaDataLimite: null,
      sugestaoestado: null,
    },
  });

  await createAuditLog(
    parseInt(encarregadoUserId), '', 'UPDATE', 'PedidoAula', parseInt(aulaId),
    `EE aceitou remarcação para ${dataFormatada}`
  );

  if (professorId && novaData) {
    const disponibilidadeId = pedido.disponibilidade_mensal_id;
    if (disponibilidadeId) {
      const duracaoMinutos = pedido.duracaoaula
        ? (pedido.duracaoaula instanceof Date
          ? pedido.duracaoaula.getUTCHours() * 60 + pedido.duracaoaula.getUTCMinutes()
          : 60)
        : 60;

      await prisma.disponibilidade_mensal.update({
        where: { iddisponibilidade_mensal: disponibilidadeId },
        data: {
          minutos_ocupados: { increment: duracaoMinutos },
        },
      });
    }
  }

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

/**
 * Insere aluno numa aula.
 * @param {string|number} aulaId @param {number} alunoId
 * @returns {Promise<any>} {Promise<object>}
 */

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

/**
 * Professor pede remarcação.
 * @param {string|number} pedidoId @param {number} professorUserId
 * @returns {Promise<any>} {Promise<object>}
 */

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(pedidoId) },
    include: {
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } },
      },
    },
  });
  if (!pedido) throw new Error('Aula não encontrada');

  const professorDaAula = pedido.disponibilidade_mensal?.professor?.utilizadoriduser;
  if (professorDaAula && professorDaAula !== parseInt(professorUserId)) {
    throw new Error('Não tem permissão para pedir remarcação desta aula');
  }

  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const updated = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(pedidoId) },
    data: { novadata: null, novaDataLimite: tresHoras, sugestaoestado: 'AGUARDA_DIRECAO' },
  });

  const direcao = await prisma.direcao.findFirst();
  if (direcao) {
    const professorNome = pedido.disponibilidade_mensal?.professor?.utilizador?.nome || 'Professor';
    await createNotificacao(
      direcao.utilizadoriduser,
      `O professor ${professorNome} pediu a remarcação da aula #${pedidoId}. Proponha uma nova data nas próximas 3 horas.`,
      'SUGESTAO_REMARCACAO_DIRECAO'
    );
  }
  return updated;
}

/**
 * Sugere nova data para aula.
 * @param {string|number} pedidoId @param {string} novaData
 * @returns {Promise<any>} {Promise<object>}
 */

  const agora = new Date();
  const novaDataInput = new Date(novaData);
  const dataHojeStr = agora.toISOString().split('T')[0];
  const novaDataStr = novaDataInput.toISOString().split('T')[0];
  
  if (novaDataStr < dataHojeStr) {
    throw new Error('A data não pode ser no passado');
  }
  
  if (novaDataStr === dataHojeStr) {
    const horaInput = novaDataInput.getHours() * 60 + novaDataInput.getMinutes();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    if (horaInput <= horaAtual) {
      throw new Error('A hora deve ser posterior à hora atual');
    }
  }
  
  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);

  const pedido = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(pedidoId) },
    data: {
      novadata: new Date(novaData),
      novaDataLimite: tresHoras,
      sugestaoestado: 'AGUARDA_DIRECAO',
    },
    include: {
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } },
      },
      encarregadoeducacao: { include: { utilizador: true } },
      sala: true,
    },
  });

  const direcao = await prisma.direcao.findFirst();
  if (direcao) {
    const dataFormatada = new Date(novaData).toLocaleDateString('pt-PT');
    const professorNome = pedido.disponibilidade_mensal?.professor?.utilizador?.nome || `professor #${pedido.disponibilidade_mensal?.professor?.utilizadoriduser}`;
    await createNotificacao(
      direcao.utilizadoriduser,
      `O professor ${professorNome} sugeriu remarcar a aula #${pedidoId} para ${dataFormatada}. Por favor aprove ou rejeite.`,
      'SUGESTAO_REMARCACAO_DIRECAO'
    );
  }

  await createAuditLog(null, 'Professor', 'UPDATE', 'PedidoAula', parseInt(pedidoId), `Professor sugeriu nova data ${novaData}`);

  return pedido;
}

/**
 * Responde a sugestão da direção.
 * @param {string|number} aulaId @param {boolean} aceitar
 * @returns {Promise<any>} {Promise<object>}
 */

  const pedido = await prisma.pedidodeaula.findUnique({
    where: { idpedidoaula: parseInt(aulaId) },
    include: {
      encarregadoeducacao: { include: { utilizador: true } },
      disponibilidade_mensal: {
        include: { professor: { include: { utilizador: true } } },
      },
    },
  });

  if (!pedido) throw new Error('Aula não encontrada');
  if (pedido.sugestaoestado !== 'AGUARDA_DIRECAO') {
    throw new Error('Não existe sugestão de professor pendente para esta aula');
  }

  const professorUserId = pedido.disponibilidade_mensal?.professor?.utilizadoriduser;
  const encarregadoUserId = pedido.encarregadoeducacao?.utilizadoriduser;

  if (!aceitar) {
    await prisma.pedidodeaula.update({
      where: { idpedidoaula: parseInt(aulaId) },
      data: { novadata: null, novaDataLimite: null, sugestaoestado: null },
    });
    if (professorUserId) {
      await createNotificacao(
        professorUserId,
        `A Direção rejeitou o pedido de remarcação da aula #${aulaId}.`,
        'REMARCACAO_REJEITADA_PROFESSOR'
      );
    }
    return { rejeitada: true };
  }

  // Direção accepts — if no date was proposed by Professor, novaData must be provided now
  const dataAUsar = pedido.novadata ? pedido.novadata : (novaData ? new Date(novaData) : null);
  if (!dataAUsar) throw new Error('Nova data é obrigatória quando o professor não propôs data');

  const dataFormatada = new Date(dataAUsar).toLocaleDateString('pt-PT');
  const tresHoras = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const updated = await prisma.pedidodeaula.update({
    where: { idpedidoaula: parseInt(aulaId) },
    data: { novadata: dataAUsar, novaDataLimite: tresHoras, sugestaoestado: 'AGUARDA_EE' },
  });

if (encarregadoUserId) {
    await createNotificacao(
      encarregadoUserId,
      `A Direção propôs remarcar a aula #${aulaId} para ${dataFormatada}. Por favor confirme se aceita.`,
      'SUGESTAO_REMARCACAO_EE'
    );
  }

  await createAuditLog(direcaoUserId ? parseInt(direcaoUserId) : null, 'Direção', 'UPDATE', 'PedidoAula', parseInt(aulaId), aceitar ? `Direção aceitou sugestão` : `Direção rejeitou sugestão`);

  return updated;
}

// PRESENÇAS
export async function getPresencas(aulaId) {
  return prisma.presenca.findMany({
    where: { aulaidaula: parseInt(aulaId) },
    include: {
      aluno: {
        include: {
          utilizador: {
            select: { iduser: true, nome: true, email: true }
          }
        }
      }
    },
    orderBy: { datahora: 'desc' }
  });
}

export async function registrarPresenca(aulaId, alunoId, presente) {
  const aula = await prisma.aula.findUnique({
    where: { idaula: parseInt(aulaId) }
  });
  
  if (!aula) {
    throw new Error('Aula não encontrada');
  }
  
  const aluno = await prisma.aluno.findUnique({
    where: { idaluno: parseInt(alunoId) }
  });
  
  if (!aluno) {
    throw new Error('Aluno não encontrado');
  }
  
  const participation = await prisma.alunoaula.findFirst({
    where: {
      aulaidaula: parseInt(aulaId),
      alunoidaluno: parseInt(alunoId)
    }
  });
  
  if (!participation) {
    throw new Error('Aluno não participa nesta aula');
  }

  const existing = await prisma.presenca.findFirst({
    where: {
      aulaidaula: parseInt(aulaId),
      alunoidaluno: parseInt(alunoId)
    }
  });
  
  if (existing) {
    return prisma.presenca.update({
      where: { idpresenca: existing.idpresenca },
      data: { presente, datahora: new Date() }
    });
  }
  
  return prisma.presenca.create({
    data: {
      aulaidaula: parseInt(aulaId),
      alunoidaluno: parseInt(alunoId),
      presente
    },
    include: {
      aluno: {
        include: { utilizador: true }
      }
    }
  });
}

export async function getPresencasByAluno(alunoId) {
  return prisma.presenca.findMany({
    where: { alunoidaluno: parseInt(alunoId) },
    include: {
      aula: {
        include: {
          pedidodeaula: true,
          estadoaula: true,
          sala: true
        }
      }
    },
    orderBy: { datahora: 'desc' }
  });
}

export async function getPresencasByDateRange(dataInicio, dataFim) {
  return prisma.presenca.findMany({
    where: {
      datahora: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim)
      }
    },
    include: {
      aula: {
        include: {
          pedidodeaula: true,
          estadoaula: true,
          sala: true
        }
      },
      aluno: {
        include: { utilizador: true }
      }
    },
    orderBy: { datahora: 'desc' }
  });
}