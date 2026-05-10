import * as salasService from "../services/salas.service.js";

export const getAllSalas = async (req, reply) => {
  try {
    const salas = await salasService.getAllSalas();
    return reply.send({ success: true, data: salas });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getSalaById = async (req, reply) => {
  try {
    const { id } = req.params;
    const sala = await salasService.getSalaById(parseInt(id));
    if (!sala) {
      return reply.status(404).send({ success: false, error: "Sala não encontrada" });
    }
    return reply.send({ success: true, data: sala });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const createSala = async (req, reply) => {
  try {
    const sala = await salasService.createSala(req.body);
    return reply.status(201).send({ success: true, data: sala });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const updateSala = async (req, reply) => {
  try {
    const { id } = req.params;
    const sala = await salasService.updateSala(parseInt(id), req.body);
    return reply.send({ success: true, data: sala });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const deleteSala = async (req, reply) => {
  try {
    const { id } = req.params;
    await salasService.deleteSala(parseInt(id));
    return reply.send({ success: true, data: { message: "Sala eliminada com sucesso" } });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getSalaAvailability = async (req, reply) => {
  try {
    const { id } = req.params;
    const { datainicio, datafim } = req.query;
    const availability = await salasService.getSalaAvailability(parseInt(id), { datainicio, datafim });
    return reply.send({ success: true, data: availability });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};