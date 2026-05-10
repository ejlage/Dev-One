import * as professorAulasService from "../services/professor-aulas.service.js";

export const getAulas = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const aulas = await professorAulasService.getProfessorAulas(req.user.id);
    return reply.send({ success: true, data: aulas });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const updateStatus = async (req, reply) => {
  try {
    if (!req.user.normalizedRoles.includes("PROFESSOR")) {
      return reply.status(403).send({ success: false, error: "Acesso negado" });
    }
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['CONFIRMADA', 'REALIZADA', 'CANCELADA'].includes(status)) {
      return reply.status(400).send({ success: false, error: "Status inválido" });
    }

    const result = await professorAulasService.updateAulaStatus(id, status);
    return reply.send({ success: true, data: result });
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};
