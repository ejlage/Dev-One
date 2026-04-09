// T12 – Consultar Aulas
// ST49: GET /api/aulas


import { getAulas } from "../services/aulas.consultar.service.js";

// GET /api/aulas
export async function getAulasController(request, reply) {
  try {
    const aulas = await getAulas(request.query);
    return reply.send({ aulas, total: aulas.length });
  } catch (err) {
    return reply.code(err.statusCode ?? 500).send({ erro: err.message });
  }
}