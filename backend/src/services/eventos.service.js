import prisma from "../config/db.js";
import { createNotificacao } from "./notificacoes.service.js";
import { createAuditLog } from "./audit.service.js";

async function notificarTodosUtilizadores(mensagem, tipo) {
  const users = await prisma.utilizador.findMany({ select: { iduser: true } });
  await Promise.all(users.map(u => createNotificacao(u.iduser, mensagem, tipo)));
}

const mapEvento = (e) => ({
  id: String(e.idevento),
  titulo: e.titulo,
  descricao: e.descricao || '',
  data: e.dataevento ? e.dataevento.toISOString().split('T')[0] : '',
  datafim: e.datafim ? e.datafim.toISOString().split('T')[0] : null,
  local: e.localizacao || '',
  imagem: e.imagem || '',
  linkBilhetes: e.linkbilhetes || '',
  publicado: e.publicado,
  destaque: e.destaque,
  datacriacao: e.datacriacao,
  criadopor: e.direcaoutilizadoriduser ? String(e.direcaoutilizadoriduser) : null,
});

/**
 * Obtém todos os eventos.
 * 
 * @returns {Promise<any>} {Promise<object[]>}
 */

  const eventos = await prisma.evento.findMany({ orderBy: { dataevento: 'asc' } });
  return eventos.map(mapEvento);
};

/**
 * Obtém evento pelo ID.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<object|null>}
 */

  const evento = await prisma.evento.findUnique({ where: { idevento: id } });
  return evento ? mapEvento(evento) : null;
};

/**
 * Cria evento.
 * @param {object} data @param {number} userId
 * @returns {Promise<any>} {Promise<object>}
 */

  const { titulo, descricao, data: dataevento, datafim, local, imagem, linkBilhetes, destaque, publicado } = data;
  const isPublicado = publicado === true || publicado === 'true';
  const evento = await prisma.evento.create({
    data: {
      titulo,
      descricao: descricao || '',
      dataevento: new Date(dataevento),
      datafim: datafim ? new Date(datafim) : null,
      localizacao: local || '',
      imagem: imagem || '',
      linkbilhetes: linkBilhetes || '',
      destaque: destaque === true || destaque === 'true',
      publicado: isPublicado,
      direcaoutilizadoriduser: userId ? parseInt(userId) : null,
    },
  });
  if (isPublicado) {
    await notificarTodosUtilizadores(`Novo evento: "${titulo}" — ${new Date(dataevento).toLocaleDateString('pt-PT')}`, 'EVENTO_PUBLICADO');
  }

  await createAuditLog(userId ? parseInt(userId) : null, userNome, 'CREATE', 'Evento', evento.idevento, `Evento '${titulo}' criado`);

  return mapEvento(evento);
};

/**
 * Atualiza evento.
 * @param {string|number} id @param {object} data
 * @returns {Promise<any>} {Promise<object>}
 */

  const exists = await prisma.evento.findUnique({ where: { idevento: id } });
  if (!exists) throw new Error("Evento não encontrado");

  const updateData = {};
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.data !== undefined) updateData.dataevento = new Date(data.data);
  if (data.datafim !== undefined) updateData.datafim = data.datafim ? new Date(data.datafim) : null;
  if (data.local !== undefined) updateData.localizacao = data.local;
  if (data.imagem !== undefined) updateData.imagem = data.imagem;
  if (data.linkBilhetes !== undefined) updateData.linkbilhetes = data.linkBilhetes;
  if (data.destaque !== undefined) updateData.destaque = data.destaque === true || data.destaque === 'true';
  if (data.publicado !== undefined) updateData.publicado = data.publicado === true || data.publicado === 'true';

  const evento = await prisma.evento.update({ where: { idevento: id }, data: updateData });

  const dataAlterou = data.data !== undefined &&
    exists.dataevento.toISOString().split('T')[0] !== new Date(data.data).toISOString().split('T')[0];
  if (dataAlterou && exists.publicado) {
    const novaData = new Date(data.data).toLocaleDateString('pt-PT');
    await notificarTodosUtilizadores(`O evento "${exists.titulo}" foi remarcado para ${novaData}`, 'EVENTO_REMARCADO');
  }

  await createAuditLog(userId ? parseInt(userId) : null, userNome, 'UPDATE', 'Evento', parseInt(id), 'Evento atualizado');

  return mapEvento(evento);
};

/**
 * Elimina evento.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<void>}
 */

  const exists = await prisma.evento.findUnique({ where: { idevento: id } });
  if (!exists) throw new Error("Evento não encontrado");
  await prisma.evento.delete({ where: { idevento: id } });

  await createAuditLog(userId ? parseInt(userId) : null, userNome, 'DELETE', 'Evento', parseInt(id), 'Evento removido');

  return { message: "Evento eliminado com sucesso" };
};

/**
 * Publica/despublica evento.
 * @param {string|number} id
 * @returns {Promise<any>} {Promise<object>}
 */

  const exists = await prisma.evento.findUnique({ where: { idevento: id } });
  if (!exists) throw new Error("Evento não encontrado");
  const isPublishing = !exists.publicado;
  const evento = await prisma.evento.update({
    where: { idevento: id },
    data: { publicado: !exists.publicado },
  });
  const dataStr = exists.dataevento.toLocaleDateString('pt-PT');
  await notificarTodosUtilizadores(`Novo evento: "${exists.titulo}" — ${dataStr}`, 'EVENTO_PUBLICADO');

  await createAuditLog(userId ? parseInt(userId) : null, userNome, 'UPDATE', 'Evento', parseInt(id), isPublishing ? 'Evento publicado' : 'Evento despublicado');

  return mapEvento(evento);
};
