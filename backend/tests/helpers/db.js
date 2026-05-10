import { PrismaClient } from "@prisma/client";

const dbBase = (process.env.DATABASE_URL || 'postgresql://entartes:entartes_dev_password@localhost:5432/entartes');
const dbUrl = dbBase.includes('?') ? dbBase : dbBase + '?connection_limit=1';

const prisma = new PrismaClient({
  log: ['error'],
  datasources: { db: { url: dbUrl } },
});

const TEST_TABLES = [
  'alunopedidoaula',
  'presenca',
  'alunoaula',
  'alunogrupo',
  'transacaofigurino',
  'anuncio',
  'aula',
  'pedidodeaula',
  'notificacao',
  'disponibilidade_mensal',
];

export async function cleanTestTables() {
  // Single TRUNCATE with CASCADE avoids FK race conditions between sequential DELETEs
  // RESTART IDENTITY resets auto-increment sequences for deterministic IDs
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "alunopedidoaula", "presenca", "alunoaula", "alunogrupo",
      "transacaofigurino", "anuncio", "aula", "pedidodeaula",
      "notificacao", "disponibilidade_mensal"
    RESTART IDENTITY CASCADE
  `);
}

const estadoCache = {};
export async function getEstadoId(tipo) {
  if (!estadoCache[tipo]) {
    const row = await prisma.estado.findFirst({
      where: { tipoestado: { equals: tipo, mode: 'insensitive' } },
    });
    if (!row) throw new Error(`Estado "${tipo}" não encontrado. Execute seed primeiro.`);
    estadoCache[tipo] = row.idestado;
  }
  return estadoCache[tipo];
}

const salaCache = {};
export async function getSalaId(nome) {
  if (!salaCache[nome]) {
    const row = await prisma.sala.findFirst({ where: { nomesala: nome } });
    if (!row) throw new Error(`Sala "${nome}" não encontrada.`);
    salaCache[nome] = row.idsala;
  }
  return salaCache[nome];
}

const userCache = {};
export async function getUserId(email) {
  if (!userCache[email]) {
    const row = await prisma.utilizador.findUnique({ where: { email } });
    if (!row) throw new Error(`Utilizador "${email}" não encontrado.`);
    userCache[email] = row.iduser;
  }
  return userCache[email];
}

const alunoCache = {};
export async function getAlunoId(utilizadorId) {
  if (!alunoCache[utilizadorId]) {
    const row = await prisma.aluno.findUnique({ where: { utilizadoriduser: utilizadorId } });
    if (!row) throw new Error(`Aluno utilizadoriduser=${utilizadorId} não encontrado.`);
    alunoCache[utilizadorId] = row.idaluno;
  }
  return alunoCache[utilizadorId];
}

const modalidadeCache = {};
export async function getModalidadeId(nome) {
  if (!modalidadeCache[nome]) {
    const row = await prisma.modalidade.findFirst({ where: { nome } });
    if (!row) throw new Error(`Modalidade "${nome}" não encontrada.`);
    modalidadeCache[nome] = row.idmodalidade;
  }
  return modalidadeCache[nome];
}

export default prisma;
