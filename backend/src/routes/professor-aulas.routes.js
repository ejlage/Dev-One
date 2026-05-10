import * as professorAulasService from "../services/professor-aulas.service.js";
import { verifyToken } from "../middleware/auth.middleware.js";

export default async function professorAulasRoutes(fastify) {
  fastify.addHook("onRequest", async (req, reply) => {
    return verifyToken(req, reply);
  });

  fastify.get("/aulas", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
        return reply.status(403).send({ success: false, error: "Acesso negado" });
      }
      const aulas = await professorAulasService.getProfessorAulas(req.user.id);
      const formatted = aulas.map(a => ({
        id: String(a.idpedidoaula),
        data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
        horaInicio: a.horainicio ? String(a.horainicio).substring(0, 5) : '',
        duracao: a.duracaoaula ? parseInt(String(a.duracaoaula).split(':')[0]) : 60,
        status: a.estado_nome || '',
        modalidade: a.modalidade_nome || '',
        sala: a.sala_nome || '',
        alunoId: String(a.aluno_id || ''),
        alunoNome: a.aluno_nome || '',
        privacidade: a.privacidade || false
      }));
      return reply.send({ success: true, data: formatted });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.put("/aulas/:id/status", async (req, reply) => {
    try {
      if (req.user.role !== "PROFESSOR") {
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
  });
}