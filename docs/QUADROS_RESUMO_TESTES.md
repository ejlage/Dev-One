# Quadros Resumo de Testes — Ent'Artes

> **Data da execução:** 2026-05-08
> **Projeto:** Ent'Artes — Sistema de Gestão de Escola de Dança

---

## 1. Visão Geral

| Framework | Tests | Passam | Falham | % Sucesso |
|-----------|-------|--------|--------|-----------|
| **Vitest** (backend) | 427 | 427 | 0 | 100% |
| **Playwright** (E2E) | 24 | 24* | 0* | 100%* |
| **Postman/Newman** | 28 | 28* | 0* | 100%* |
| **Total** | **479** | **479** | **0** | **100%** |

*\* Última execução documentada. Requer backend + frontend em execução.*

---

## 2. Testes Vitest (backend)

### 2.1 Resumo Geral

| Métrica | Valor |
|---------|-------|
| Ficheiros de teste | 29 |
| Total de testes | 427 |
| Testes passados | 427 |
| Testes falhados | 0 |
| Duração | 12.7s |

### 2.2 Distribuição por Categoria

| Categoria | Testes | % do Total |
|-----------|--------|------------|
| Unitários | 302 | 71% |
| Integração (BD real) | 46 | 11% |
| API (HTTP inject) | 39 | 9% |
| Contract | 14 | 3% |
| Edge (Segurança) | 26 | 6% |
| **Total** | **427** | **100%** |

### 2.3 Resultados por Ficheiro

#### Unitários (17 ficheiros, 302 testes)

| Ficheiro | Testes | Passam | Falham |
|----------|-------|--------|--------|
| `validacao-data.test.js` | 11 | 11 | 0 |
| `validacao-pressao.test.js` | 5 | 5 | 0 |
| `bpmn01-negative-edge.test.js` | 12 | 12 | 0 |
| `auth.service.test.js` | 22 | 22 | 0 |
| `users.service.test.js` | 32 | 32 | 0 |
| `pedidosaula.service.test.js` | 25 | 25 | 0 |
| `pedidosaula.controller.test.js` | 22 | 22 | 0 |
| `anuncios.service.test.js` | 13 | 13 | 0 |
| `aluguerFigurino.service.test.js` | 11 | 11 | 0 |
| `figurinos.service.test.js` | 42 | 42 | 0 |
| `eventos.service.test.js` | 14 | 14 | 0 |
| `turmas.service.test.js` | 25 | 25 | 0 |
| `notificacoes.service.test.js` | 7 | 7 | 0 |
| `audit.service.test.js` | 14 | 14 | 0 |
| `professor-aulas.service.test.js` | 13 | 13 | 0 |
| `salas.service.test.js` | 17 | 17 | 0 |
| `professor.service.test.js` | 17 | 17 | 0 |

#### Integração BD Real (6 ficheiros, 46 testes)

| Ficheiro | Testes | Passam | Falham |
|----------|-------|--------|--------|
| `prisma-bpmn01.test.js` (BPMN 1) | 6 | 6 | 0 |
| `prisma-bpmn02.test.js` (BPMN 2) | 6 | 6 | 0 |
| `prisma-bpmn03.test.js` (BPMN 3) | 5 | 5 | 0 |
| `prisma-bpmn04.test.js` (BPMN 4) | 6 | 6 | 0 |
| `bpmn-integracao.test.js` | 17 | 17 | 0 |
| `scheduler-integracao.test.js` | 6 | 6 | 0 |

#### API HTTP Inject (4 ficheiros, 39 testes)

| Ficheiro | Testes | Passam | Falham |
|----------|-------|--------|--------|
| `00-smoke.test.js` | 5 | 5 | 0 |
| `auth.api.test.js` | 15 | 15 | 0 |
| `eventos.api.test.js` | 10 | 10 | 0 |
| `notificacoes.api.test.js` | 9 | 9 | 0 |

#### Contract + Edge (2 ficheiros, 40 testes)

| Ficheiro | Testes | Passam | Falham |
|----------|-------|--------|--------|
| `resposta-shapes.test.js` | 14 | 14 | 0 |
| `entrada-api.test.js` | 26 | 26 | 0 |

---

## 3. Testes E2E Playwright

### 3.1 Resumo Geral

| Métrica | Valor |
|---------|-------|
| Ficheiros de teste | 5 |
| Testes | 24 |
| Duração | ~33s |

### 3.2 Resultados por Fluxo BPMN

| Ficheiro | Fluxo BPMN | Testes | Estado |
|----------|-----------|--------|--------|
| `bpmn1-pedido-aula.spec.js` | BPMN 1 — Marcação de Aula | 4 | ✅ |
| `bpmn2-remarcacao.spec.js` | BPMN 2 — Remarcação | 5 | ✅ |
| `bpmn3-aluguer-figurino.spec.js` | BPMN 3 — Aluguer de Figurino | 7 | ✅ |
| `bpmn4-criar-anuncio.spec.js` | BPMN 4 — Criar Anúncio | 4 | ✅ |
| `verificacao-completa.spec.js` | Verificação de Dashboards | 4 | ✅ |
| **Total** | | **24** | **✅** |

### 3.3 Fluxos BPMN Cobertos

| BPMN | Atores | Transições |
|------|--------|------------|
| **BPMN 1** | EE → Direção | Pendente → Confirmado / Rejeitado |
| **BPMN 2** | Direção → Professor → EE | AGUARDA_PROFESSOR → AGUARDA_EE → Confirmado |
| **BPMN 3** | EE/Professor → Direção | Pendente → Aprovado (aluguer) |
| **BPMN 4** | EE/Professor → Direção | Pendente → Aprovado (anúncio) |

### 3.4 Pré-requisitos de Execução

```bash
cd e2e
npx playwright test                    # Todos os 24 testes
npx playwright test bpmn1-pedido-aula  # BPMN 1 apenas
```

- Backend em `localhost:3000`
- Frontend em `localhost:5173`
- PostgreSQL com seed (`npm run seed` em `backend/`)

---

## 4. Testes Postman/Newman

### 4.1 Resumo Geral

| Métrica | Valor |
|---------|-------|
| Coleção | `EntArtes_BPMN_Flows.json` |
| Environment | `EntArtes_Environment.json` |
| Requests | 28 |
| Test scripts | 28 |

### 4.2 Distribuição por Fluxo

| Fluxo | Requests | Test Scripts |
|-------|---------|--------------|
| **BPMN 1** — Pedido de Aula | 7 | 7 |
| **BPMN 2** — Remarcação de Aula | 9 | 9 |
| **BPMN 3** — Aluguer de Figurino | 6 | 6 |
| **BPMN 4** — Criar Anúncio de Figurino | 6 | 6 |
| **Total** | **28** | **28** |

### 4.3 Execução

```bash
cd postman
newman run EntArtes_BPMN_Flows.json -e EntArtes_Environment.json
# Fluxo específico:
newman run EntArtes_BPMN_Flows.json -e EntArtes_Environment.json \
  --folder "BPMN 1 — Pedido de Aula"
```

---

## 5. Cobertura Funcional

### 5.1 Por Funcionalidade

| Funcionalidade | Vitest | E2E | Postman | Total |
|---------------|--------|-----|---------|-------|
| Autenticação (login, register, token) | 37 | — | — | 37 |
| Gestão de Utilizadores (CRUD, roles) | 32 | — | — | 32 |
| **BPMN 1** — Pedido de Aula | 76 | 4 | 7 | 87 |
| **BPMN 2** — Remarcação de Aula | 6 | 5 | 9 | 20 |
| **BPMN 3** — Aluguer de Figurino | 16 | 7 | 6 | 29 |
| **BPMN 4** — Anúncios Marketplace | 19 | 4 | 6 | 29 |
| Figurinos (stock, estados, lookup) | 42 | — | — | 42 |
| Turmas/Grupos (CRUD, inscrições) | 25 | — | — | 25 |
| Eventos (CRUD, publicação) | 24 | — | — | 24 |
| Auditoria | 14 | — | — | 14 |
| Aulas Professor | 13 | — | — | 13 |
| Notificações (CRUD, leitura) | 16 | — | — | 16 |
| Scheduler (auto-rejeição 3h) | 6 | — | — | 6 |
| Segurança (SQLi, XSS, edge cases) | 26 | — | — | 26 |
| Validação de dados (datas, horas) | 11 | — | — | 11 |
| Formato de resposta (contract) | 14 | — | — | 14 |
| Smoke tests (endpoints públicos) | 5 | — | — | 5 |
| E2E — Verificação de Dashboards | — | 4 | — | 4 |
| **Total** | **427** | **24** | **28** | **479** |

### 5.2 Por Tipo de Teste

```
          ╱╲
         ╱ E2E ╲             24 testes  (5%)
        ╱────────╲
       ╱  Postman ╲          28 testes  (6%)
      ╱────────────╲
     ╱   Edge/Sec  ╲         26 testes  (6%)
    ╱────────────────╲
   ╱     Contract     ╲       14 testes  (3%)
  ╱────────────────────╲
 ╱     API (inject)     ╲     39 testes  (9%)
╱──────────────────────────╲
╱  Integração (BD real)      ╲  46 testes (11%)
╱──────────────────────────────╲
╱   Unitários (mocks)            ╲ 302 testes (71%)
╱──────────────────────────────────╲
```

---

## 6. Comandos Rápidos

```bash
# Vitest (backend)
cd backend && npm test                         # Todos os 427 testes
cd backend && npx vitest run --reporter=verbose # Output detalhado

# E2E Playwright
cd e2e && npx playwright test                  # Todos os 24 testes

# Postman/Newman
cd postman && newman run EntArtes_BPMN_Flows.json \
  -e EntArtes_Environment.json                 # 28 requests
```

---

*Documento gerado em 2026-05-08*
*Ent'Artes — Sistema de Gestão de Escola de Dança*
