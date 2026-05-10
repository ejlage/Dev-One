import * as aulasService from "../services/aulas.service.js";

export const getAllAulas = async (req, reply) => {
  try {
    const aulas = await aulasService.getAllAulas();
    return reply.send({ success: true, data: aulas });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getAulaById = async (req, reply) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.getAulaById(id);

    if (!aula) {
      return reply.status(404).send({ success: false, error: "Aula não encontrada" });
    }

    return reply.send({ success: true, data: aula });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const createAula = async (req, reply) => {
  try {
    const aula = await aulasService.createAula(req.body);
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

export const cancelAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.cancelAula(id);
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

export const joinAula = async (req, reply) => {
  try {
    const { id } = req.params;
    const { alunoId } = req.body;
    const result = await aulasService.joinAula(id, alunoId);
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
    
    if (pedido && pedido.encarregadoeducacao) {
      const { createNotificacao } = await import('../services/notificacoes.service.js');
      await createNotificacao(
        pedido.encarregadoeducacao.utilizadoriduser,
        `O professor sugeriu uma nova data para a aula: ${new Date(novaData).toLocaleDateString('pt-PT')}`,
        'SUGESTAO_NOVA_DATA'
      );
    }
    
    return reply.send({ success: true, data: pedido });
  } catch (err) {
    return reply.status(400).send({ success: false, error: err.message });
  }
};