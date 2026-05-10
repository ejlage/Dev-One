// @ts-check
const { expect } = require('@playwright/test');
const { execSync } = require('child_process');

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:3000';
const DB_URL = 'postgresql://entartes:entartes_dev_password@localhost:5432/entartes';

const USERS = {
  encarregado: { email: 'encarregado1@entartes.pt', password: 'password123', nome: 'encarregado1' },
  professor:   { email: 'professor1@entartes.pt',   password: 'password123', nome: 'professor1'   },
  direcao:     { email: 'direcao@entartes.pt',      password: 'password123', nome: 'Direção'      },
  aluno:       { email: 'miguel.silva@email.pt',    password: 'password123', nome: 'Aluno'       },
};

/** Login via UI and wait for dashboard */
async function login(page, role) {
  const user = USERS[role];
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('#email', { timeout: 8_000 });
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

/** Click a sidebar nav link by its visible text */
async function navTo(page, label) {
  await page.click(`text="${label}"`);
  await page.waitForTimeout(600);
}

/** Logout: just clear localStorage and reload */
async function logout(page) {
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`);
  await page.waitForURL(/login/);
}

/** Wait for a toast message containing text */
async function waitForToast(page, text) {
  await page.waitForSelector(`text="${text}"`, { timeout: 8_000 });
}

/** Get a JWT token for use in direct API calls */
async function getToken(role) {
  const user = USERS[role];
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const json = await res.json();
  return json.token;
}

// ── Database helpers ──────────────────────────────────────────────

/** Run a SQL query on the test DB. Returns rows as array of objects. */
function dbQuery(query) {
  const out = execSync(`psql "${DB_URL}" -t --csv -c "${query.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    timeout: 10_000,
    stdio: 'pipe',
  });
  const lines = out.trim().split('\n').filter(Boolean);
  if (!lines.length || (lines.length === 1 && !lines[0].includes(','))) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = vals[i] ? vals[i].trim() : null; });
    return row;
  });
}

/** Run a scalar SQL query returning the first column of the first row. */
function dbScalar(query) {
  const out = execSync(`psql "${DB_URL}" -t -A -c "${query.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    timeout: 10_000,
    stdio: 'pipe',
  });
  return out.trim();
}

// ── Data setup helpers ────────────────────────────────────────────

/**
 * Find a future disponibilidade slot via public API.
 * Returns the first slot with available capacity, or null.
 */
async function findSlot() {
  const res = await fetch(`${API}/api/public/disponibilidades`);
  if (!res.ok) return null;
  const { data } = await res.json();
  if (!data || !data.length) return null;
  const today = new Date().toISOString().split('T')[0];
  return data.find(s => s.data > today && s.maxDuracao > 0) || data.find(s => s.data > today) || null;
}

/**
 * Build a future time string (1h from now, HH:MM).
 */
function futureTime() {
  const now = new Date();
  const h = (now.getHours() + 1) % 24;
  const m = now.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

let _pedidoCallCount = 0;

/**
 * Create a PENDENTE pedido de aula via API as encarregado.
 * @returns {{ success: boolean, data?: any, pedidoId?: number, error?: string }}
 */
async function criarPedidoPendente() {
  const token = await getToken('encarregado');
  const slot = await findSlot();
  if (!slot) return { success: false, error: 'Sem disponibilidades futuras' };

  /* Each call offsets 60 min so pedidos don't overlap; cap within slot duration */
  const [sh, sm] = (slot.horaInicio || '10:00').split(':').map(Number);
  const [eh, em] = (slot.horaFim || '20:00').split(':').map(Number);
  const slotLen = Math.max(60, eh * 60 + em - sh * 60 - sm);
  const offsetMin = ((_pedidoCallCount++) * 60) % slotLen;
  const totalMin = sh * 60 + sm + offsetMin;
  const safeTime = `${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;

  const body = {
    data: slot.data,
    horainicio: safeTime,
    duracaoaula: slot.maxDuracao > 0 ? Math.min(slot.maxDuracao, 60) : 60,
    disponibilidade_mensal_id: parseInt(slot.id),
    salaidsala: 1,
    privacidade: false,
  };

  const res = await fetch(`${API}/api/encarregado/aulas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error || 'Erro ao criar pedido' };
  // Extract pedidoId from the raw response
  const raw = json.data || json;
  const pedidoId = raw.idpedidoaula || raw.id || (Array.isArray(raw) ? raw[0]?.idpedidoaula : null);
  return { success: true, data: json, pedidoId: pedidoId ? Number(pedidoId) : undefined };
}

/**
 * Approve a pedido via Direção API. Returns the API response.
 */
async function approvePedidoApi(pedidoId) {
  const token = await getToken('direcao');
  const res = await fetch(`${API}/api/direcao/aulas/${pedidoId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  return res.json();
}

/**
 * Reject a pedido via Direção API.
 */
async function rejectPedidoApi(pedidoId, motivo = 'Horário indisponível') {
  const token = await getToken('direcao');
  const res = await fetch(`${API}/api/direcao/aulas/${pedidoId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ motivo }),
  });
  return res.json();
}

/**
 * Create a CONFIRMADA aula via API (pedido + approvação).
 * @returns {{ success: boolean, pedidoId?: number, error?: string }}
 */
async function criarAulaConfirmada() {
  const pedido = await criarPedidoPendente();
  if (!pedido.success || !pedido.pedidoId) return { success: false, error: pedido.error || 'Falha ao criar pedido' };
  const result = await approvePedidoApi(pedido.pedidoId);
  if (!result.success) return { success: false, error: result.error || 'Falha ao aprovar pedido' };
  return { success: true, pedidoId: pedido.pedidoId };
}

module.exports = {
  login, logout, navTo, waitForToast, getToken,
  criarPedidoPendente, criarAulaConfirmada, approvePedidoApi, rejectPedidoApi,
  findSlot, futureTime, dbQuery, dbScalar,
  USERS, BASE, API,
};
