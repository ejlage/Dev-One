import prisma from "../config/db.js";

const mapEvento = (e) => ({
  id: String(e.idevento),
  titulo: e.titulo,
  descricao: e.descricao || '',
  data: e.dataevento ? e.dataevento.toISOString().split('T')[0] : '',
  local: e.localizacao || '',
  imagem: e.imagem || '',
  linkBilhetes: e.linkbilhetes || '',
  publicado: e.publicado,
  destaque: e.destaque,
  datacriacao: e.datacriacao,
  criadopor: e.direcaoutilizadoriduser ? String(e.direcaoutilizadoriduser) : null,
});

export const getAllEventos = async () => {
  const eventos = await prisma.evento.findMany({ orderBy: { dataevento: 'asc' } });
  return eventos.map(mapEvento);
};

export const getEventoById = async (id) => {
  const evento = await prisma.evento.findUnique({ where: { idevento: id } });
  return evento ? mapEvento(evento) : null;
};

export const createEvento = async (data, userId) => {
  const { titulo, descricao, data: dataevento, local, imagem, linkBilhetes, destaque } = data;
  const evento = await prisma.evento.create({
    data: {
      titulo,
      descricao: descricao || '',
      dataevento: new Date(dataevento),
      localizacao: local || '',
      imagem: imagem || '',
      linkbilhetes: linkBilhetes || '',
      destaque: destaque === true || destaque === 'true',
      publicado: false,
      direcaoutilizadoriduser: userId ? parseInt(userId) : null,
    },
  });
  return mapEvento(evento);
};

export const updateEvento = async (id, data) => {
  const exists = await prisma.evento.findUnique({ where: { idevento: id } });
  if (!exists) throw new Error("Evento não encontrado");

  const updateData = {};
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.data !== undefined) updateData.dataevento = new Date(data.data);
  if (data.local !== undefined) updateData.localizacao = data.local;
  if (data.imagem !== undefined) updateData.imagem = data.imagem;
  if (data.linkBilhetes !== undefined) updateData.linkbilhetes = data.linkBilhetes;
  if (data.destaque !== undefined) updateData.destaque = data.destaque === true || data.destaque === 'true';
  if (data.publicado !== undefined) updateData.publicado = data.publicado === true || data.publicado === 'true';

  const evento = await prisma.evento.update({ where: { idevento: id }, data: updateData });
  return mapEvento(evento);
};

export const deleteEvento = async (id) => {
  const exists = await prisma.evento.findUnique({ where: { idevento: id } });
  if (!exists) throw new Error("Evento não encontrado");
  await prisma.evento.delete({ where: { idevento: id } });
  return { message: "Evento eliminado com sucesso" };
};

export const publishEvento = async (id) => {
  const exists = await prisma.evento.findUnique({ where: { idevento: id } });
  if (!exists) throw new Error("Evento não encontrado");
  const evento = await prisma.evento.update({
    where: { idevento: id },
    data: { publicado: true },
  });
  return mapEvento(evento);
};
