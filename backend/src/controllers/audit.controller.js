import { getAuditLogs } from "../services/audit.service.js";

export const listLogs = async (req, reply) => {
  try {
    const { utilizadorId, acao, entidade, dataInicio, dataFim, limit, offset } = req.query;
    const result = await getAuditLogs({
      utilizadorId: utilizadorId ? parseInt(utilizadorId) : undefined,
      acao,
      entidade,
      dataInicio,
      dataFim,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });
    return reply.send(result);
  } catch (err) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};
