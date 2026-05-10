import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getEncarregadoAulas = async (encarregadoUserId) => {
  const aulas = await prisma.$queryRaw`
    SELECT
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.maxparticipantes,
      pa.estadoidestado,
      e.tipoestado as estado_nome,
      pa.privacidade,
      pa.sugestaoestado,
      pa.novadata,
      s.nomesala as sala_nome,
      m.nome as modalidade_nome,
      u.nome as professor_nome,
      u.iduser as professor_id
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    LEFT JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    LEFT JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    LEFT JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    LEFT JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    WHERE pa.encarregadoeducacaoutilizadoriduser = ${encarregadoUserId}
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;

  const statusMap = {
    'PENDENTE': 'PENDENTE',
    'CONFIRMADO': 'CONFIRMADA',
    'APROVADO': 'APROVADA',
    'REJEITADO': 'REJEITADA',
    'REALIZADO': 'REALIZADA',
    'CANCELADO': 'CANCELADA',
    'CONCLUÍDO': 'CONCLUÍDA',
  };
  const normalize = (s) => statusMap[s.toUpperCase()] || s.toUpperCase();

  return aulas.map(a => ({
    id: String(a.idpedidoaula),
    data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
    horaInicio: a.horainicio instanceof Date ? a.horainicio.toISOString().substring(11, 16) : (a.horainicio ? String(a.horainicio).substring(0, 5) : ''),
    duracao: (() => { if (!a.duracaoaula) return 60; if (a.duracaoaula instanceof Date) return a.duracaoaula.getUTCHours() * 60 + a.duracaoaula.getUTCMinutes(); const [h, m] = String(a.duracaoaula).split(':'); return parseInt(h) * 60 + parseInt(m || '0'); })(),
    status: normalize(a.estado_nome || ''),
    modalidade: a.modalidade_nome || '',
    estudioNome: a.sala_nome || '',
    professorId: String(a.professor_id || ''),
    professorNome: a.professor_nome || '',
    alunoId: '',
    alunoNome: '',
    privacidade: a.privacidade || false,
    maxParticipantes: a.maxparticipantes || 0,
    sugestaoestado: a.sugestaoestado || null,
    novadata: a.novadata ? new Date(a.novadata).toISOString().split('T')[0] : null,
    novaData: a.novadata ? new Date(a.novadata).toISOString().split('T')[0] : null,
  }));
};

export const getGruposAbertos = async () => {
  const statusMap = {
    'PENDENTE': 'PENDENTE',
    'CONFIRMADO': 'CONFIRMADA',
    'APROVADO': 'APROVADA',
    'REJEITADO': 'REJEITADA',
    'REALIZADO': 'REALIZADA',
    'CANCELADO': 'CANCELADA',
    'CONCLUÍDO': 'CONCLUÍDA',
  };
  const normalize = (s) => statusMap[s.toUpperCase()] || s.toUpperCase();

  const grupos = await prisma.$queryRaw`
    SELECT
      pa.idpedidoaula,
      pa.data,
      pa.horainicio,
      pa.duracaoaula,
      pa.maxparticipantes,
      pa.privacidade,
      s.nomesala as sala_nome,
      mp.modalidadeidmodalidade,
      m.nome as modalidade_nome,
      u.nome as professor_nome,
      u.iduser as professor_id,
      e.tipoestado as estado_nome,
      pa.estadoidestado
    FROM pedidodeaula pa
    JOIN estado e ON pa.estadoidestado = e.idestado
    JOIN sala s ON pa.salaidsala = s.idsala
    JOIN disponibilidade_mensal dm ON pa.disponibilidade_mensal_id = dm.iddisponibilidade_mensal
    JOIN modalidadeprofessor mp ON dm.modalidadesprofessoridmodalidadeprofessor = mp.idmodalidadeprofessor
    JOIN modalidade m ON mp.modalidadeidmodalidade = m.idmodalidade
    JOIN utilizador u ON dm.professorutilizadoriduser = u.iduser
    WHERE pa.privacidade = false
    AND LOWER(e.tipoestado) = 'pendente'
    ORDER BY pa.data DESC, pa.horainicio DESC
  `;
  return grupos.map((g) => ({
    id: String(g.idpedidoaula),
    data: g.data ? new Date(g.data).toISOString().split('T')[0] : '',
    horaInicio: g.horainicio instanceof Date ? g.horainicio.toISOString().substring(11, 16) : (g.horainicio ? String(g.horainicio).substring(0, 5) : ''),
    horaFim: '',
    duracao: (() => { if (!g.duracaoaula) return 60; if (g.duracaoaula instanceof Date) return g.duracaoaula.getUTCHours() * 60 + g.duracaoaula.getUTCMinutes(); const [h, m] = String(g.duracaoaula).split(':'); return parseInt(h) * 60 + parseInt(m || '0'); })(),
    maxParticipantes: g.maxparticipantes || 10,
    privacidade: g.privacidade || false,
    estudioId: '',
    estudioNome: g.sala_nome || '',
    modalidade: g.modalidade_nome || '',
    professorId: String(g.professor_id || ''),
    professorNome: g.professor_nome || '',
    status: normalize(g.estado_nome || '')
  }));
};

export const createPedidoAula = async (data, encarregadoUserId) => {
  const {
    data: dataAula,
    horainicio,
    duracaoaula,
    disponibilidade_mensal_id,
    salaidsala,
    privacidade
  } = data;

  const estadoPendente = await prisma.$queryRaw`
    SELECT idestado FROM estado WHERE LOWER(tipoestado) = 'pendente'
  `;

  if (!estadoPendente || estadoPendente.length === 0) {
    throw new Error('Estado PENDENTE não encontrado');
  }

  const dataStr = new Date(dataAula).toISOString().split('T')[0];
  const horaStr = horainicio || '09:00';
  const duracaoStr = String(duracaoaula || 60);
  const slotId = disponibilidade_mensal_id ? parseInt(disponibilidade_mensal_id) : null;

  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO pedidodeaula
    (data, horainicio, duracaoaula, maxparticipantes, datapedido, privacidade,
     disponibilidade_mensal_id, grupoidgrupo, estadoidestado, salaidsala,
     encarregadoeducacaoutilizadoriduser)
    VALUES (
      $1::date,
      $2::time,
      $3::interval,
      10,
      NOW(),
      $4,
      $5,
      3,
      $6,
      $7,
      $8
    )
    RETURNING idpedidoaula, data, horainicio, duracaoaula, privacidade
  `, dataStr, horaStr, duracaoStr + ' minutes', privacidade || false, slotId, estadoPendente[0].idestado, parseInt(salaidsala), encarregadoUserId);

  if (slotId && duracaoaula) {
    const duracaoMin = parseInt(duracaoaula) || 60;
    await prisma.$queryRawUnsafe(`
      UPDATE disponibilidade_mensal
      SET minutos_ocupados = minutos_ocupados + $1
      WHERE iddisponibilidade_mensal = $2
    `, duracaoMin, slotId);
  }

  return result;
};

export const participarAula = async (pedidoId, alunoId, encarregadoUserId) => {
  const pedidos = await prisma.$queryRaw`
    SELECT data, horainicio, duracaoaula, disponibilidade_mensal_id, salaidsala, privacidade
    FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}
  `;
  if (!pedidos || pedidos.length === 0) throw new Error("Pedido não encontrado");
  const p = pedidos[0];

  const result = await createPedidoAula({
    data: new Date(p.data).toISOString().split('T')[0],
    horainicio: p.horainicio instanceof Date ? p.horainicio.toISOString().substring(11, 16) : String(p.horainicio).substring(0, 5),
    duracaoaula: (() => { if (!p.duracaoaula) return 60; if (p.duracaoaula instanceof Date) return p.duracaoaula.getUTCHours() * 60 + p.duracaoaula.getUTCMinutes(); const [h, m] = String(p.duracaoaula).split(':'); return parseInt(h) * 60 + parseInt(m || '0'); })(),
    disponibilidade_mensal_id: p.disponibilidade_mensal_id,
    salaidsala: p.salaidsala,
    privacidade: p.privacidade,
  }, encarregadoUserId);
  return result;
};
