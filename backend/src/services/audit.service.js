import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Regista uma ação de auditoria na base de dados.
 * Deve ser chamada por todos os serviços nas operações CRUD principais.
 *
 * @param {number} utilizadorId - ID do utilizador que executou a ação
 * @param {string} utilizadorNome - Nome do utilizador (para consulta rápida sem JOIN)
 * @param {string} acao - Tipo de ação: CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, CANCEL, etc.
 * @param {string} entidade - Nome da entidade: PedidoAula, Evento, Anuncio, Figurino, Utilizador, etc.
 * @param {number|null} entidadeId - ID do registo afetado (opcional)
 * @param {string|null} detalhes - Descrição adicional (opcional, max 1000 chars)
 */
export async function createAuditLog(utilizadorId, utilizadorNome, acao, entidade, entidadeId = null, detalhes = null) {
  try {
    await prisma.audit_log.create({
      data: {
        utilizadorid: utilizadorId,
        utilizadornome: utilizadorNome,
        acao,
        entidade,
        entidadeid: entidadeId,
        detalhes: detalhes ? String(detalhes).substring(0, 1000) : null,
      }
    });
  } catch (err) {
    console.error('[Audit] Erro ao registar log:', err.message);
    // Nunca deixar falhar a operação principal por causa da auditoria
  }
}

/**
 * Retorna logs de auditoria com filtros opcionais.
 *
 * @param {Object} filters
 * @param {number} [filters.utilizadorId]
 * @param {string} [filters.acao]
 * @param {string} [filters.entidade]
 * @param {string} [filters.dataInicio] - ISO date string
 * @param {string} [filters.dataFim] - ISO date string
 * @param {number} [filters.limit=100]
 * @param {number} [filters.offset=0]
 */
export async function getAuditLogs(filters = {}) {
  const where = {};
  if (filters.utilizadorId) where.utilizadorid = filters.utilizadorId;
  if (filters.acao) where.acao = { equals: filters.acao, mode: 'insensitive' };
  if (filters.entidade) where.entidade = { equals: filters.entidade, mode: 'insensitive' };
  if (filters.dataInicio || filters.dataFim) {
    where.data = {};
    if (filters.dataInicio) where.data.gte = new Date(filters.dataInicio);
    if (filters.dataFim) where.data.lte = new Date(filters.dataFim + 'T23:59:59.999Z');
  }

  const [total, data] = await Promise.all([
    prisma.audit_log.count({ where }),
    prisma.audit_log.findMany({
      where,
      orderBy: { data: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })
  ]);

  return {
    success: true,
    data: data.map(log => ({
      id: log.idaudit,
      utilizadorId: log.utilizadorid,
      utilizadorNome: log.utilizadornome,
      acao: log.acao,
      entidade: log.entidade,
      entidadeId: log.entidadeid,
      detalhes: log.detalhes,
      data: log.data.toISOString(),
    })),
    total,
    limit: filters.limit || 100,
    offset: filters.offset || 0,
  };
}
