import * as encarregadoService from "../services/encarregado.service.js";
import prisma from "../config/db.js";

function formatDisponibilidade(d) {
  return {
    id: String(d.iddisponibilidade_mensal),
    professorId: String(d.professorutilizadoriduser),
    professorNome: d.professor_nome || '',
    data: d.data ? new Date(d.data).toISOString().split('T')[0] : '',
    horaInicio: d.horainicio instanceof Date ? d.horainicio.toISOString().substring(11, 16) : String(d.horainicio).substring(0, 5),
    horaFim: d.horafim instanceof Date ? d.horafim.toISOString().substring(11, 16) : String(d.horafim).substring(0, 5),
    modalidadeId: String(d.idmodalidadeprofessor),
    modalidade: d.modalidades_nome || '',
  };
}

export const getAulas = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const aulas = await encarregadoService.getEncarregadoAulas(req.user.id);
    return reply.send({ success: true, data: aulas });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getDisponibilidades = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { getAllDisponibilidadesMensais } = await import("../services/aluno.service.js");
    const disponibilidades = await getAllDisponibilidadesMensais();
    return reply.send({ success: true, data: disponibilidades.map(formatDisponibilidade) });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getAulasOpen = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const grupos = await encarregadoService.getGruposAbertos();
    return reply.send({ success: true, data: grupos });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const participar = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { alunoId } = req.body;
    if (!alunoId) return reply.status(400).send({ success: false, error: "alunoId obrigatório" });
    const result = await encarregadoService.marcarAula(
      parseInt(req.params.pedidoId), parseInt(alunoId), req.user.id
    );
    return reply.status(201).send({ success: true, data: result });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const cancelarParticipacao = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const result = await encarregadoService.cancelarParticipacaoAula(
      req.params.pedidoId, req.user.id
    );
    return reply.send({ success: true, data: result });
  } catch (err) {
    const message = err.message || '';
    if (message.includes('encontrado') || message.includes('permissão') || message.includes('Só pode')) {
      return reply.status(400).send({ success: false, error: message });
    }
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const submeterPedidoAula = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ENCARREGADO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { data, horainicio, duracaoaula, disponibilidade_mensal_id, professor_utilizador_id, alunoutilizadoriduser, salaidsala, privacidade } = req.body;

    if (!data || !horainicio || !salaidsala) {
      return reply.status(400).send({ success: false, error: "Campos obrigatórios em falta" });
    }

    const result = await encarregadoService.submeterPedidoAula(
      { data, horainicio, duracaoaula, disponibilidade_mensal_id, professor_utilizador_id, alunoutilizadoriduser, salaidsala, privacidade },
      req.user.id
    );

    const row = Array.isArray(result) && result.length > 0 ? result[0] : result;
    return reply.status(201).send({ success: true, data: row });
  } catch (err) {
    const message = err.message || '';
    if (message.includes('passado') || message.includes('hora') || message.includes('obrigatório') || message.includes('formato') || message.includes('reservado')) {
      return reply.status(400).send({ success: false, error: message });
    }
    return reply.status(500).send({ success: false, error: err.message });
  }
};
