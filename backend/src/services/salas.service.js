import prisma from "../config/db.js";

export const getAllSalas = async () => {
  const salas = await prisma.sala.findMany({
    include: {
      estadosala: true,
      tiposala: true
    }
  });
  return salas;
};

export const getSalaById = async (id) => {
  const sala = await prisma.sala.findUnique({
    where: { idsala: id },
    include: {
      estadosala: true,
      tiposala: true
    }
  });
  return sala;
};

export const createSala = async (data) => {
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

export const updateSala = async (id, data) => {
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

export const deleteSala = async (id) => {
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