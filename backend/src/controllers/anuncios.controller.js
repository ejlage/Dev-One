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
    const anuncio = await anunciosService.updateAnuncio(parseInt(id), req.body);
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const deleteAnuncio = async (req, reply) => {
  try {
    const { id } = req.params;
    await anunciosService.deleteAnuncio(parseInt(id));
    return reply.send({ success: true, data: { message: "Anúncio eliminado com sucesso" } });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
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
    const anuncio = await anunciosService.rejectAnuncio(parseInt(id), userId);
    return reply.send({ success: true, data: anuncio });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};