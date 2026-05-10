#!/usr/bin/env node
/**
 * RNF03 — Benchmark de Tempo de Resposta
 *
 * Mede os tempos de resposta dos endpoints críticos do Ent'Artes.
 * Testa cada endpoint N vezes e reporta estatísticas.
 *
 * Uso: node tests/performance/benchmark.js
 */
import http from "http";

const BASE_URL = "http://localhost:3000";
const SAMPLES = 100;
const ENDPOINTS = [
  { name: "GET /api/health",          method: "GET",  path: "/api/health" },
  { name: "GET /api/public/eventos",  method: "GET",  path: "/api/public/eventos" },
  { name: "GET /api/public/modalidades", method: "GET", path: "/api/public/modalidades" },
  { name: "GET /api/public/disponibilidades", method: "GET", path: "/api/public/disponibilidades" },
  { name: "POST /api/auth/login (válido)", method: "POST", path: "/api/auth/login", body: JSON.stringify({ email: "direcao@entartes.pt", password: "password123" }) },
];

function request(method, path, body) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const options = { hostname: "localhost", port: 3000, path, method, headers: { "Content-Type": "application/json" } };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const end = process.hrtime.bigint();
        const elapsedMs = Number(end - start) / 1_000_000;
        resolve({ status: res.statusCode, elapsedMs, body: data });
      });
    });
    req.on("error", () => resolve({ status: 0, elapsedMs: -1, body: "" }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 0, elapsedMs: -1, body: "" }); });
    if (body) req.write(body);
    req.end();
  });
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runBenchmark() {
  console.log("=".repeat(72));
  console.log("  RNF03 — Benchmark de Tempo de Resposta");
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  ${SAMPLES} amostras por endpoint, url: ${BASE_URL}`);
  console.log("=".repeat(72));

  for (const ep of ENDPOINTS) {
    const times = [];
    let failures = 0;

    console.log(`\n  ${ep.name}`);
    process.stdout.write("  ");

    for (let i = 0; i < SAMPLES; i++) {
      try {
        const result = await request(ep.method, ep.path, ep.body);
        times.push(result.elapsedMs);
        if (result.status >= 400) failures++;
      } catch (err) {
        failures++;
      }
      if ((i + 1) % 25 === 0) process.stdout.write(".");
    }

    times.sort((a, b) => a - b);
    const min = times[0] ?? 0;
    const max = times[times.length - 1] ?? 0;
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const p50 = times.length > 0 ? percentile(times, 50) : 0;
    const p95 = times.length > 0 ? percentile(times, 95) : 0;
    const p99 = times.length > 0 ? percentile(times, 99) : 0;

    console.log("");
    console.log(`    ┌─────────────┬────────────┐`);
    console.log(`    │ Mínimo      │ ${min.toFixed(1).padStart(8)} ms │`);
    console.log(`    │ Média       │ ${avg.toFixed(1).padStart(8)} ms │`);
    console.log(`    │ Mediana(P50)│ ${p50.toFixed(1).padStart(8)} ms │`);
    console.log(`    │ P95         │ ${p95.toFixed(1).padStart(8)} ms │`);
    console.log(`    │ P99         │ ${p99.toFixed(1).padStart(8)} ms │`);
    console.log(`    │ Máximo      │ ${max.toFixed(1).padStart(8)} ms │`);
    console.log(`    │ Falhas      │ ${String(failures).padStart(8)}   │`);
    console.log(`    └─────────────┴────────────┘`);
  }

  console.log("\n" + "=".repeat(72));
  console.log("  Benchmark concluído.");
  console.log("=".repeat(72));
}

runBenchmark().catch(console.error);
