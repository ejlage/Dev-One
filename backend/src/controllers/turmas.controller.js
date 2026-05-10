import * as turmasService from "../services/turmas.service.js";

export const getAllTurmas = async (req, reply) => {
  try {
    const turmas = await turmasService.getAllTurmas();
    return reply.send({ success: true, data: turmas });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const getTurmaById = async (req, reply) => {
  try {
    const { id } = req.params;
    const turma = await turmasService.getTurmaById(parseInt(id));
    if (!turma) {
      return reply.status(404).send({ success: false, error: "Turma não encontrada" });
    }
    return reply.send({ success: true, data: turma });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const createTurma = async (req, reply) => {
  try {
    const turma = await turmasService.createTurma(req.body, req.user.id, req.user.nome);
    return reply.status(201).send({ success: true, data: turma });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const updateTurma = async (req, reply) => {
  try {
    const { id } = req.params;
    const turma = await turmasService.updateTurma(parseInt(id), req.body, req.user.id, req.user.nome);
    return reply.send({ success: true, data: turma });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const deleteTurma = async (req, reply) => {
  try {
    const { id } = req.params;
    await turmasService.deleteTurma(parseInt(id));
    return reply.send({ success: true, data: { message: "Turma eliminada com sucesso" } });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const enrollAluno = async (req, reply) => {
  try {
    const { id } = req.params;
    const { alunoId } = req.body;
    const enrollment = await turmasService.enrollAluno(parseInt(id), parseInt(alunoId), req.user.id, req.user.nome);
    return reply.status(201).send({ success: true, data: enrollment });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const removeAluno = async (req, reply) => {
  try {
    const { id, alunoId } = req.params;
    await turmasService.removeAluno(parseInt(id), parseInt(alunoId), req.user.id, req.user.nome);
    return reply.send({ success: true, data: { message: "Aluno removido da turma" } });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const closeTurma = async (req, reply) => {
  try {
    const { id } = req.params;
    const result = await turmasService.closeTurma(parseInt(id), req.user.id, req.user.nome);
    return reply.send({ success: true, data: result });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};

export const archiveTurma = async (req, reply) => {
  try {
    const { id } = req.params;
    const result = await turmasService.archiveTurma(parseInt(id), req.user.id, req.user.nome);
    return reply.send({ success: true, data: result });
  } catch (error) {
    return reply.status(400).send({ success: false, error: error.message });
  }
};