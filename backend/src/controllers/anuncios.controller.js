import * as anunciosService from "../services/anuncios.service.js";

export const getAllAnuncios = async (req, reply) => {
  try {
    const anuncios = await anunciosService.getAllAnuncios();
    return reply.send({ success: true, data: anuncios });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getAnuncioById = async (req, reply) => {
  try {
    const { id } = req.params;
    const anuncio = await anunciosService.getAnuncioById(parseInt(id));
    if (!anuncio) {
      return reply.status(404).send({ success: false, error: "Anúncio não encontrado" });
    }
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const createAnuncio = async (req, reply) => {
  try {
    const anuncio = await anunciosService.createAnuncio(req.body);
    return reply.status(201).send({ success: true, data: anuncio });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const updateAnuncio = async (req, reply) => {
  try {
    const { id } = req.params;
    const anuncio = await anunciosService.updateAnuncio(parseInt(id), req.body, req.user.id, req.user.role);
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    const code = error.message === 'Sem permissão para editar este anúncio' ? 403 : 400;
    return reply.status(code).send({ success: false, error: error.message });
  }
};

export const deleteAnuncio = async (req, reply) => {
  try {
    const { id } = req.params;
    await anunciosService.deleteAnuncio(parseInt(id), req.user.id, req.user.role);
    return reply.send({ success: true, data: { message: "Anúncio eliminado com sucesso" } });
  } catch (error) {
    const code = error.message === 'Sem permissão para eliminar este anúncio' ? 403 : 400;
    return reply.status(code).send({ success: false, error: error.message });
  }
};

export const approveAnuncio = async (req, reply) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const anuncio = await anunciosService.approveAnuncio(parseInt(id), userId);
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const rejectAnuncio = async (req, reply) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { motivo } = req.body || {};
    const anuncio = await anunciosService.rejectAnuncio(parseInt(id), userId, motivo);
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const ressubmeterAnuncio = async (req, reply) => {
  try {
    const { id } = req.params;
    const anuncio = await anunciosService.ressubmeterAnuncio(parseInt(id), req.user.id, req.user.role);
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    const code = error.message.includes('permissão') ? 403 : 400;
    return reply.status(code).send({ success: false, error: error.message });
  }
};