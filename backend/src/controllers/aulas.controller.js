import * as aulasService from "../services/aulas.service.js";

export const listarAulas = async (req, reply) => {
  try {
    const aulas = await aulasService.listarAulas();
    return reply.send({ success: true, data: aulas });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getAulaById = async (req, reply) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.consultarAula(id);

    if (!aula) {
      return reply.status(404).send({ success: false, error: "Aula não encontrada" });
    }

    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const obterAulaDoPedido = async (req, reply) => {
  try {
    const { pedidoId } = req.params;
    const aula = await aulasService.obterAulaDoPedido(pedidoId);

    if (!aula) {
      return reply.send({ success: true, data: null, message: "Nenhuma aula encontrada para este pedido" });
    }

    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const criarAula = async (req, reply) => {
  try {
    const aula = await aulasService.criarAula(req.body);
    return reply.status(201).send({ success: true, data: aula });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const updateAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.updateAula(id, req.body);

    if (!aula) {
      return reply.status(404).send({ success: false, error: "Aula não encontrada" });
    }

    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const deleteAula = async (req, reply) => {
  try {
    const { id } = req.params;
    await aulasService.deleteAula(id);
    return reply.send({ success: true, data: { message: "Aula eliminada" } });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const confirmAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.confirmAula(id);
    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const cancelarAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.cancelarAula(id);
    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const remarcarAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const { data, hora } = req.body;
    const aula = await aulasService.remarcarAula(id, data, hora);
    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const inserirAlunoAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const { alunoId } = req.body;
    const result = await aulasService.inserirAlunoAula(id, alunoId);
    return reply.status(201).send({ success: true, data: result });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const responderSugestaoProfessor = async (req, reply) => {
  try {
    const { id } = req.params;
    const { aceitar } = req.body;
    if (aceitar === undefined) {
      return reply.status(400).send({ success: false, error: 'Campo "aceitar" é obrigatório' });
    }
    const resultado = await aulasService.responderSugestaoProfessor(id, aceitar, req.user.id);
    return reply.send({ success: true, data: resultado });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const responderSugestaoEE = async (req, reply) => {
  try {
    const { id } = req.params;
    const { aceitar } = req.body;
    if (aceitar === undefined) {
      return reply.status(400).send({ success: false, error: 'Campo "aceitar" é obrigatório' });
    }
    const resultado = await aulasService.responderSugestaoEE(id, aceitar, req.user.id);
    return reply.send({ success: true, data: resultado });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const sugerirNovaData = async (req, reply) => {
  try {
    const { id } = req.params;
    const { novaData } = req.body;
    if (!novaData) {
      return reply.status(400).send({ success: false, error: 'novaData é obrigatório' });
    }
    const pedido = await aulasService.sugerirNovaData(id, novaData);
    return reply.send({ success: true, data: pedido });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const responderSugestaoDirecao = async (req, reply) => {
  try {
    const { id } = req.params;
    const { aceitar, novaData } = req.body;
    if (aceitar === undefined) {
      return reply.status(400).send({ success: false, error: 'Campo "aceitar" é obrigatório' });
    }
    const resultado = await aulasService.responderSugestaoDirecao(id, aceitar, req.user.id, novaData);
    return reply.send({ success: true, data: resultado });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};

export const pedirRemarcacao = async (req, reply) => {
  try {
    const { id } = req.params;
    const resultado = await aulasService.pedirRemarcacao(id, req.user.id);
    return reply.send({ success: true, data: resultado });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};