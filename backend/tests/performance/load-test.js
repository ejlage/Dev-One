#!/usr/bin/env node
/**
 * RNF12 — Teste de Carga (Utilizadores Simultâneos)
 *
 * Simula múltiplos utilizadores a aceder aos endpoints críticos em
 * simultâneo. Testa com níveis crescentes de concorrência e reporta
 * throughput, latência e taxa de erro.
 *
 * Uso: node tests/performance/load-test.js
 */
import http from "http";

const BASE_URL = "http://localhost:3000";

const ENDPOINTS = [
  { name: "GET /api/health",          method: "GET",  path: "/api/health" },
  { name: "GET /api/public/eventos",  method: "GET",  path: "/api/public/eventos" },
  { name: "GET /api/public/modalidades", method: "GET", path: "/api/public/modalidades" },
  { name: "POST /api/auth/login",     method: "POST", path: "/api/auth/login", body: JSON.stringify({ email: "direcao@entartes.pt", password: "password123" }) },
];

const CONCURRENCY_LEVELS = [5, 10, 20];
const REQUESTS_PER_USER = 10;  // cada user faz N requests

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const options = { hostname: "localhost", port: 3000, path, method, headers: { "Content-Type": "application/json" } };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const end = process.hrtime.bigint();
        const elapsedMs = Number(end - start) / 1_000_000;
        resolve({ status: res.statusCode, elapsedMs });
      });
    });
    req.on("error", (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function simulateUser(ep) {
  const results = [];
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    try {
      const result = await request(ep.method, ep.path, ep.body);
      results.push(result);
    } catch {
      results.push({ status: 0, elapsedMs: -1 });
    }
  }
  return results;
}

async function runLoadTest() {
  console.log("=".repeat(72));
  console.log("  RNF12 — Teste de Carga (Utilizadores Simultâneos)");
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  Concorrência: ${CONCURRENCY_LEVELS.join(", ")} users`);
  console.log(`  Requests por user: ${REQUESTS_PER_USER}`);
  console.log("=".repeat(72));

  for (const ep of ENDPOINTS) {
    console.log(`\n  ${"=".repeat(50)}`);
    console.log(`  Endpoint: ${ep.name}`);
    console.log(`  ${"=".repeat(50)}`);

    for (const concurrency of CONCURRENCY_LEVELS) {
      const allTimes = [];
      let totalFailures = 0;
      let totalRequests = 0;

      const startAll = process.hrtime.bigint();

      // Lançar utilizadores em paralelo
      const users = [];
      for (let u = 0; u < concurrency; u++) {
        users.push(simulateUser(ep));
      }
      const userResults = await Promise.all(users);

      const endAll = process.hrtime.bigint();
      const durationMs = Number(endAll - startAll) / 1_000_000;

      // Agregar resultados
      for (const userRes of userResults) {
        for (const r of userRes) {
          totalRequests++;
          if (r.status >= 400 || r.status === 0) totalFailures++;
          else allTimes.push(r.elapsedMs);
        }
      }

      allTimes.sort((a, b) => a - b);
      const throughput = totalRequests / (durationMs / 1000);

      const min = allTimes[0] || 0;
      const max = allTimes[allTimes.length - 1] || 0;
      const avg = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
      const p50 = percentile(allTimes, 50);
      const p95 = percentile(allTimes, 95);
      const p99 = percentile(allTimes, 99);
      const errorRate = (totalFailures / totalRequests) * 100;

      console.log(`\n    ┌── ${concurrency} users concorrentes ─────────────────────────┐`);
      console.log(`    │ Total requests : ${String(totalRequests).padStart(8)}            │`);
      console.log(`    │ Duração        : ${durationMs.toFixed(0).padStart(8)} ms          │`);
      console.log(`    │ Throughput     : ${throughput.toFixed(1).padStart(8)} req/s      │`);
      console.log(`    ├────────────────────────────────────────┤`);
      console.log(`    │ Latência mín.  : ${min.toFixed(1).padStart(8)} ms          │`);
      console.log(`    │ Latência média : ${avg.toFixed(1).padStart(8)} ms          │`);
      console.log(`    │ Latência P50   : ${p50.toFixed(1).padStart(8)} ms          │`);
      console.log(`    │ Latência P95   : ${p95.toFixed(1).padStart(8)} ms          │`);
      console.log(`    │ Latência P99   : ${p99.toFixed(1).padStart(8)} ms          │`);
      console.log(`    │ Latência máx.  : ${max.toFixed(1).padStart(8)} ms          │`);
      console.log(`    ├────────────────────────────────────────┤`);
      console.log(`    │ Erro rate      : ${errorRate.toFixed(1).padStart(8)}%            │`);
      console.log(`    └────────────────────────────────────────┘`);
    }
  }

  console.log(`\n${"=".repeat(72)}`);
  console.log("  Teste de carga concluído.");
  console.log("=".repeat(72));
}

runLoadTest().catch(console.error);
