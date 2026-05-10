import * as figurinosService from "../services/figurinos.service.js";

export const getAllFigurinos = async (req, reply) => {
  try {
    const figurinos = await figurinosService.getAllFigurinos();
    return reply.send({ success: true, data: figurinos });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getFigurinoById = async (req, reply) => {
  try {
    const { id } = req.params;
    const figurino = await figurinosService.getFigurinoById(parseInt(id));
    if (!figurino) {
      return reply.status(404).send({ success: false, error: "Figurino não encontrado" });
    }
    return reply.send({ success: true, data: figurino });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const createFigurino = async (req, reply) => {
  try {
    const figurino = await figurinosService.createFigurino(req.body);
    return reply.status(201).send({ success: true, data: figurino });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const updateFigurino = async (req, reply) => {
  try {
    const { id } = req.params;
    const figurino = await figurinosService.updateFigurino(parseInt(id), req.body);
    return reply.send({ success: true, data: figurino });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const deleteFigurino = async (req, reply) => {
  try {
    const { id } = req.params;
    await figurinosService.deleteFigurino(parseInt(id));
    return reply.send({ success: true, data: { message: "Figurino eliminado com sucesso" } });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const updateFigurinoStatus = async (req, reply) => {
  try {
    const { id } = req.params;
    const { estadoId } = req.body;
    const figurino = await figurinosService.updateFigurinoStatus(parseInt(id), estadoId);
    return reply.send({ success: true, data: figurino });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};