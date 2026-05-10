import prisma from "../config/db.js";

/**
 * Obtém todas as salas.
 * 
 * @returns {Promise<any>} {Promise<object[]>}
 */

  const salas = await prisma.sala.findMany({
    include: {
      estadosala: true,
      tiposala: true
    }
  });
  return salas;
};

/**
 * Obtém sala pelo ID.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<object|null>}
 */

  const sala = await prisma.sala.findUnique({
    where: { idsala: id },
    include: {
      estadosala: true,
      tiposala: true
    }
  });
  return sala;
};

/**
 * Cria sala.
 * @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

  const { nomesala, capacidade, estadosalaidestadosala, tiposalaidtiposala } = data;

  const sala = await prisma.sala.create({
    data: {
      nomesala: parseInt(nomesala),
      capacidade: parseInt(capacidade),
      estadosalaidestadosala: parseInt(estadosalaidestadosala),
      tiposalaidtiposala: parseInt(tiposalaidtiposala)
    },
    include: {
      estadosala: true,
      tiposala: true
    }
  });

  return sala;
};

/**
 * Atualiza sala.
 * @param {string|number} id @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

  const { nomesala, capacidade, estadosalaidestadosala, tiposalaidtiposala } = data;

  const existingSala = await prisma.sala.findUnique({
    where: { idsala: id }
  });

  if (!existingSala) {
    throw new Error("Sala não encontrada");
  }

  const updateData = {};
  if (nomesala !== undefined) updateData.nomesala = parseInt(nomesala);
  if (capacidade !== undefined) updateData.capacidade = parseInt(capacidade);
  if (estadosalaidestadosala !== undefined) updateData.estadosalaidestadosala = parseInt(estadosalaidestadosala);
  if (tiposalaidtiposala !== undefined) updateData.tiposalaidtiposala = parseInt(tiposalaidtiposala);

  const sala = await prisma.sala.update({
    where: { idsala: id },
    data: updateData,
    include: {
      estadosala: true,
      tiposala: true
    }
  });

  return sala;
};

/**
 * Elimina sala.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<void>}
 */

  const existingSala = await prisma.sala.findUnique({
    where: { idsala: id }
  });

  if (!existingSala) {
    throw new Error("Sala não encontrada");
  }

  await prisma.sala.delete({
    where: { idsala: id }
  });

  return { message: "Sala eliminada com sucesso" };
};

export const getSalaAvailability = async (id, data) => {
  const { datainicio, datafim } = data;

  const sala = await prisma.sala.findUnique({
    where: { idsala: id }
  });

  if (!sala) {
    throw new Error("Sala não encontrada");
  }

  const startDate = new Date(datainicio);
  const endDate = new Date(datafim);

  const aulas = await prisma.aula.findMany({
    where: {
      salaidsala: id,
      pedidodeaula: {
        data: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    include: {
      pedidodeaula: true
    }
  });

  const disponibilidade = [];
  let d = new Date(startDate);
  while (d <= endDate) {
    const dayAulas = aulas.filter(a => {
      const aulaDate = new Date(a.pedidodeaula.data);
      return aulaDate.toDateString() === d.toDateString();
    });
    disponibilidade.push({
      data: d.toISOString().split("T")[0],
      aulas: dayAulas.length,
      livre: dayAulas.length === 0
    });
    d.setDate(d.getDate() + 1);
  }

  return {
    sala: { idsala: sala.idsala, nomesala: sala.nomesala },
    periodo: { datainicio, datafim },
    disponibilidade
  };
};

/**
 * Consultar disponibilidade de sala para uma data/hora/duração específicas
 * @param {number} salaId - ID da sala
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {string} hora - Hora no formato HH:MM
 * @param {number} duracao - Duração em minutos
 * @returns {Promise<object>} Dados da disponibilidade
 */
export const consultarSalaDisponivel = async (salaId, data, hora, duracao) => {
  const [horaH, horaM] = hora.split(':').map(Number);
  const horaInicioMinutos = horaH * 60 + horaM;
  const horaFimMinutos = horaInicioMinutos + duracao;

  const sala = await prisma.sala.findUnique({
    where: { idsala: parseInt(salaId) }
  });

  if (!sala) {
    throw new Error("Sala não encontrada");
  }

  // Buscar aulas/confirmações na mesma data
  const reservas = await prisma.$queryRaw`
    SELECT pa.idpedidoaula, pa.horainicio, pa.duracaoaula, pa.data, e.tipoestado
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    WHERE pa.salaidsala = ${parseInt(salaId)}
    AND pa.data = ${data}::date
    AND LOWER(e.tipoestado) IN ('pendente', 'confirmado', 'aprovado')
  `;

  // Verificar conflitos
  for (const reserva of reservas) {
    const resHoraInicio = reserva.horainicio instanceof Date 
      ? reserva.horainicio.getHours() * 60 + reserva.horainicio.getMinutes()
      : parseInt(String(reserva.horainicio).split(':')[0]) * 60 + parseInt(String(reserva.horainicio).split(':')[1]);
    
    const resDuracao = reserva.duracaoaula instanceof Date
      ? reserva.duracaoaula.getHours() * 60 + reserva.duracaoaula.getMinutes()
      : parseInt(String(reserva.duracaoaula).split(':')[0]) * 60 + parseInt(String(reserva.duracaoaula).split(':')[1]);

    const resHoraFim = resHoraInicio + resDuracao;

    // Verificar sobreposição
    if (horaInicioMinutos < resHoraFim && horaFimMinutos > resHoraInicio) {
      return {
        disponivel: false,
        sala: { id: sala.idsala, nome: sala.nomesala },
        data,
        hora,
        duracao,
        conflito: {
          idPedido: reserva.idpedidoaula,
          horaInicio: `${Math.floor(resHoraInicio / 60).toString().padStart(2, '0')}:${(resHoraInicio % 60).toString().padStart(2, '0')}`,
          horaFim: `${Math.floor(resHoraFim / 60).toString().padStart(2, '0')}:${(resHoraFim % 60).toString().padStart(2, '0')}`
        },
        mensagem: "Sala já está ocupada neste horário"
      };
    }
  }

  return {
    disponivel: true,
    sala: { id: sala.idsala, nome: sala.nomesala },
    data,
    hora,
    duracao,
    mensagem: "Sala disponível para o horário solicitado"
  };
};