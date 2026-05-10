import * as alunoService from "../services/aluno.service.js";

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
    if (!req.user.normalizedRoles.includes("ALUNO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const aulas = await alunoService.getAlunoAulas(req.user.id);
    return reply.send({ success: true, data: aulas });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getDisponibilidades = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("ALUNO")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const disponibilidades = await alunoService.getAllDisponibilidadesMensais();
    return reply.send({ success: true, data: disponibilidades.map(formatDisponibilidade) });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};
