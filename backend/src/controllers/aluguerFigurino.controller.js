import prisma from "../config/db.js";
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

export const submeterPedidoReserva = async (req, reply) => {
  try {
    const transacao = await aluguerService.registarTransacao(req.body, req.user.id, req.user.nome);
    return reply.status(201).send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const avaliarPedidoReserva = async (req, reply) => {
  try {
    const { id } = req.params;
    const { decisao, estadoidestado, motivorejeicao } = req.body;

    let resolvedEstadoId = estadoidestado;
    if (!resolvedEstadoId && decisao) {
      const estadoMap = {
        'aprovar': 'Aprovado',
        'aprovar': 'Aprovado',
        'rejeitar': 'Rejeitado',
        'recusar': 'Rejeitado',
        'cancelar': 'Cancelado',
        'pendente': 'Pendente',
        'confirmar': 'Confirmado',
      };
      const estadoNome = estadoMap[decisao.toLowerCase()] || decisao;
      const estado = await prisma.estado.findFirst({
        where: { tipoestado: { equals: estadoNome, mode: 'insensitive' } },
      });
      if (estado) {
        resolvedEstadoId = estado.idestado;
      }
    }

    if (!resolvedEstadoId) {
      return reply.status(400).send({ success: false, error: 'É necessário fornecer o estado (decisao ou estadoidestado)' });
    }

    const transacao = await aluguerService.avaliarPedidoReserva(
      parseInt(id),
      resolvedEstadoId,
      req.user.id,
      req.user.nome,
      motivorejeicao
    );
    return reply.send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const confirmarReserva = async (req, reply) => {
  try {
    const { id } = req.params;
    const transacao = await aluguerService.confirmarReserva(parseInt(id), req.user.id);
    return reply.send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const cancelarReserva = async (req, reply) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body || {};
    const transacao = await aluguerService.cancelarReserva(parseInt(id), req.user.id, motivo);
    return reply.send({ success: true, data: transacao });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const devolverAluguer = async (req, reply) => {
  try {
    const { id } = req.params;
    const transacao = await aluguerService.devolverAluguer(parseInt(id));
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