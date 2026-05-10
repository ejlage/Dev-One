# Resultados de Benchmark e Teste de Carga

**Data:** 2026-05-07  
**Infraestrutura:** PC local (Intel) — PostgreSQL + Backend no mesmo host  
**Ferramentas:** Node.js http nativo, 0 dependências externas

---

## RNF03 — Benchmark de Tempo de Resposta

**Script:** `backend/tests/performance/benchmark.js`  
**Método:** 100 requests sequenciais por endpoint, medidos com `hrtime`

| Endpoint | Mínimo | Média | P50 | P95 | P99 | Máximo | Falhas |
|----------|--------|-------|-----|-----|-----|--------|--------|
| `GET /api/health` | 0.1ms | **0.4ms** | 0.2ms | 0.6ms | 1.0ms | 10.0ms | 0 |
| `GET /api/public/eventos` | 0.7ms | **1.4ms** | 1.0ms | 1.7ms | 2.3ms | 28.4ms | 0 |
| `GET /api/public/modalidades` | 0.4ms | **0.7ms** | 0.6ms | 1.0ms | 1.2ms | 2.2ms | 0 |
| `GET /api/public/disponibilidades` | 0.3ms | **0.8ms** | 0.5ms | 0.7ms | 0.8ms | 32.2ms | 0 |
| `POST /api/auth/login` | 49.3ms | **51.1ms** | 50.7ms | 52.9ms | 53.8ms | 59.1ms | 0 |

**Total:** 500 requests, 0 falhas, 0% erro rate.

**Conclusão:** Tempos de resposta excelentes. Os endpoints GET respondem em <2ms (média). O login é ~51ms devido ao bcrypt (custo computacional propositado para segurança). Todos os valores estão dentro do expectável para uma aplicação web.

---

## RNF12 — Teste de Carga (Utilizadores Simultâneos)

**Script:** `backend/tests/performance/load-test.js`  
**Método:** N users concorrentes × 10 requests cada, em Promise.all

### GET /api/health

| Users | Requests | Duração | Throughput | Média | P95 | Erro |
|-------|----------|---------|------------|-------|-----|------|
| 5 | 50 | 31ms | 1.623 req/s | 2.1ms | 8.4ms | 0% |
| 10 | 100 | 17ms | 5.802 req/s | 1.5ms | 3.1ms | 0% |
| 20 | 200 | 28ms | 7.201 req/s | 2.3ms | 4.5ms | 0% |

### GET /api/public/eventos

| Users | Requests | Duração | Throughput | Média | P95 | Erro |
|-------|----------|---------|------------|-------|-----|------|
| 5 | 50 | 35ms | 1.449 req/s | 3.2ms | 14.2ms | 0% |
| 10 | 100 | 52ms | 1.920 req/s | 4.5ms | 6.1ms | 0% |
| 20 | 200 | 78ms | 2.562 req/s | 7.1ms | 11.3ms | 0% |

### GET /api/public/modalidades

| Users | Requests | Duração | Throughput | Média | P95 | Erro |
|-------|----------|---------|------------|-------|-----|------|
| 5 | 50 | 13ms | 3.955 req/s | 1.1ms | 2.7ms | 0% |
| 10 | 100 | 23ms | 4.300 req/s | 2.2ms | 3.4ms | 0% |
| 20 | 200 | 43ms | 4.686 req/s | 3.8ms | 5.8ms | 0% |

### POST /api/auth/login (bcrypt ~60ms cada)

| Users | Requests | Duração | Throughput | Média | P95 | Erro |
|-------|----------|---------|------------|-------|-----|------|
| 5 | 50 | 765ms | 65 req/s | 72.9ms | 103.4ms | 0% |
| 10 | 100 | 1.630ms | 61 req/s | 156.4ms | 198.1ms | 0% |
| 20 | 200 | 3.010ms | 66 req/s | 286.5ms | 318.8ms | 0% |

**Total:** 1.750 requests (350 por endpoint), 0 falhas, 0% erro rate.

---

## Análise

| Aspeto | Resultado |
|--------|-----------|
| **Throughput máximo (GET)** | ~7.200 req/s (health) |
| **Throughput login** | ~65 req/s (limitado por bcrypt) |
| **Latência GET (20 users)** | <10ms média, <15ms P95 |
| **Latência login (20 users)** | ~287ms média, ~319ms P95 |
| **Erro rate** | **0% em todos os cenários** |
| **Escalabilidade horizontal** | JWT stateless → sem estado partilhado. Basta adicionar instâncias. |

### Gargalo Identificado
O **bcrypt** no login é o único gargalo — ~65 req/s independentemente da concorrência. Isto é esperado e **desejado** (custo computacional propositado para dificultar ataques de força bruta). Para produção com alta carga de login, pode-se:
1. Aumentar o número de instâncias do backend
2. Usar um proxy reverso (nginx) para round-robin

### Conclusão
O sistema Ent'Artes lida eficientemente com **20+ utilizadores simultâneos** com latência abaixo de 10ms em endpoints GET e **0% de erro**. O RNF03 (tempo de resposta) e RNF12 (capacidade) estão validados.

**Nota:** O teste de carga é limitado pela máquina local (single host, single instance). Em produção com múltiplas instâncias e PostgreSQL tuning, a capacidade será significativamente maior.
