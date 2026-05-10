import * as aluguerService from "../services/aluguerFigurino.service.js";

export const getAllTransacoes = async (req, reply) => {
  try {
    const transacoes = await aluguerService.getAllTransacoes();
    return reply.send({ success: true, data: transacoes });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getTransacaoById = async (req, reply) => {
  try {
    const { id } = req.params;
    const transacao = await aluguerService.getTransacaoById(parseInt(id));
    if (!transacao) {
      return reply.status(404).send({ success: false, error: "Transação não encontrada" });
    }
    return reply.send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const createTransacao = async (req, reply) => {
  try {
    const transacao = await aluguerService.createTransacao(req.body);
    return reply.status(201).send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const updateTransacaoStatus = async (req, reply) => {
  try {
    const { id } = req.params;
    const { estadoidestado } = req.body;
    const transacao = await aluguerService.updateTransacaoStatus(
      parseInt(id),
      estadoidestado,
      req.user.id
    );
    return reply.send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const deleteTransacao = async (req, reply) => {
  try {
    const { id } = req.params;
    await aluguerService.deleteTransacao(parseInt(id));
    return reply.send({ success: true, data: { message: "Transação eliminada com sucesso" } });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getDisponibilidade = async (req, reply) => {
  try {
    const { anuncioId } = req.params;
    const disp = await aluguerService.getDisponibilidadeFigurino(parseInt(anuncioId));
    return reply.send({ success: true, data: disp });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getReservasByUser = async (req, reply) => {
  try {
    const { id: userId, role } = req.user;
    const reservas = await aluguerService.getReservasByUser(userId, role);
    return reply.send({ success: true, data: reservas });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getEstados = async (req, reply) => {
  try {
    const estados = await aluguerService.getEstados();
    return reply.send({ success: true, data: estados });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};