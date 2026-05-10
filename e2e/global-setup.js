// @ts-check
/**
 * Playwright global setup: reset test data before each run.
 * Clears accumulated minutos_ocupados so availability slots show as free.
 * Creates professor1 disponibilidades if none exist (fresh DB).
 */
const { execSync } = require('child_process');

const DB_URL = 'postgresql://entartes:entartes_dev_password@localhost:5432/entartes';
const API = 'http://localhost:3000';

function sql(query) {
  execSync(`psql "${DB_URL}" -c "${query}"`, { stdio: 'pipe' });
}

function sqlScalar(query) {
  const out = execSync(`psql "${DB_URL}" -t -c "${query}"`, { encoding: 'utf8' });
  return out.trim();
}

async function ensureDisponibilidades() {
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'professor1@entartes.pt', password: 'password123' }),
  });
  const { token } = await loginRes.json();
  if (!token) { console.warn('[Setup] Could not login as professor1 — skipping slot creation'); return; }

  const mpRow = sqlScalar(`SELECT idmodalidadeprofessor FROM modalidadeprofessor WHERE professorutilizadoriduser = (SELECT iduser FROM utilizador WHERE email = 'professor1@entartes.pt') LIMIT 1;`);
  const mpId = parseInt(mpRow);
  if (!mpId) { console.warn('[Setup] No modalidadeprofessor for professor1'); return; }

  const today = new Date().toISOString().split('T')[0];
  sql(`DELETE FROM pedidodeaula WHERE disponibilidade_mensal_id IN (SELECT iddisponibilidade_mensal FROM disponibilidade_mensal WHERE professorutilizadoriduser = 24 AND data < '${today}'::date);`);
  sql(`DELETE FROM disponibilidade_mensal WHERE professorutilizadoriduser = 24 AND data < '${today}'::date;`);

  const created = [];
  for (let i = 2; i <= 8; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const data = d.toISOString().split('T')[0];
    const res = await fetch(`${API}/api/professor/disponibilidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ modalidadesprofessoridmodalidadeprofessor: mpId, data, horainicio: '10:00', horafim: '11:00', salaid: 1 }),
    });
    if (res.ok) created.push(data);
  }
  console.log(`[Setup] Created ${created.length} future disponibilidades for professor1`);
}

module.exports = async function globalSetup() {
  sql('UPDATE disponibilidade_mensal SET minutos_ocupados = 0;');
  // Complete cleanup: delete ALL pedidos and transactions from previous runs
  // This avoids "Este horário já está reservado" when future-dated pedidos survive
  sql('DELETE FROM transacaofigurino;');
  sql('DELETE FROM alunoaula;');
  sql('DELETE FROM aula;');
  sql('DELETE FROM pedidodeaula;');
  await ensureDisponibilidades();
  console.log('[Setup] Test data reset complete');
};
