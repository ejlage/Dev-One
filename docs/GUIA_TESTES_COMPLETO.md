# Guia Completo de Testes — Ent'Artes

## 1. Introdução

O projeto **Ent'Artes** é uma plataforma de gestão para uma escola de dança, com funcionalidades que incluem marcação de aulas, gestão de figurinos, anúncios e eventos. Dada a complexidade dos fluxos de negócio — envolvendo múltiplos atores (Encarregado de Educação, Professor, Direção, Aluno) e transições de estado — foi implementada uma suite completa de testes automatizados para garantir a fiabilidade e robustez do sistema.

Este documento descreve a arquitetura, tipos, tecnologias e casos de teste implementados, servindo como guia de referência para desenvolvimento, manutenção e defesa académica do projeto.

---

## 2. Objetivo dos Testes

Os testes foram implementados com os seguintes objetivos:

### 2.1 Garantir a conformidade com os diagramas BPMN

Cada fluxo de negócio modelado em BPMN tem testes específicos que validam:
- Transições de estado corretas (Pendente → Confirmado → Realizado)
- Permissões de acesso por role (Encarregado, Professor, Direção)
- Sequência de passos entre atores

### 2.2 Validar regras de negócio

- Datas e horas não podem ser no passado
- Duração mínima e máxima das aulas
- Conflitos de horário (professor e sala)
- Disponibilidade de stock de figurinos
- Limites de inscrição em grupos

### 2.3 Prevenir regressões

Sempre que uma nova funcionalidade é adicionada ou alterada, a suite de testes garante que o comportamento existente não é quebrado.

### 2.4 Documentar o comportamento esperado

Os nomes dos testes seguem o padrão `deve_[ação]_quando_[condição]`, funcionando como documentação viva do sistema.

---

## 3. Arquitetura dos Testes

A arquitetura dos testes está organizada em **três camadas**, seguindo a Pirâmide de Testes:

```
        ╱╲
       ╱ E2E ╲           ← Playwright (24 testes)
      ╱────────╲
     ╱ Integração ╲       ← Vitest + BD real (54 testes)
    ╱──────────────╲
   ╱     API         ╲    ← Vitest + app.inject() (39 testes)
  ╱────────────────────╲
 ╱   Unitários          ╲ ← Vitest + Mocks (338 testes)
╱──────────────────────────╲
╱ Contract + Edge            ╲ ← Vitest (38 testes)
╱──────────────────────────────╲
╱   Postman/Newman               ╲ ← Testes de API (28 testes)
╱──────────────────────────────────╲
```

### 3.1 Camada Unitária (Vitest + Mocks)

Testa funções e serviços individuais de forma isolada. As dependências com a base de dados são **mocked** com `vi.fn()` e `vi.mock()`.

```
Teste → Serviço → [Mock Prisma] → resultado controlado
```

### 3.2 Camada de Integração (Vitest + BD real)

Testa a interação entre componentes usando **base de dados PostgreSQL real**. Os testes fazem assertions sobre o estado da BD após cada operação.

```
Teste → Serviço → Prisma → PostgreSQL → verificar estado BD
```

### 3.3 Camada de API (Vitest + `app.inject()`)

Usa o `buildApp()` do Fastify para injetar requests HTTP diretamente, sem servidor HTTP real. Testa autenticação, autorização e validação de input.

```
Teste → app.inject() → Routes → Controller → Service → Prisma
```

### 3.4 Camada E2E (Playwright)

Testa o sistema completo através do browser, simulando interações reais do utilizador.

```
Teste → Browser → Frontend React → API Backend → PostgreSQL
```

### 3.5 Camada Postman/Newman

Coleções de testes de API executáveis via Postman (GUI) ou Newman (CLI), ideais para validação manual e demonstração.

---

## 4. Tipos de Testes

| Tipo | Framework | O que testa | Base de Dados | Quantidade |
|------|-----------|-------------|---------------|-----------|
| **Unitários (isolados)** | Vitest | Funções individuais, serviços com mocks | Mock | 268 |
| **Integração (BD real)** | Vitest | Fluxos completos com Prisma | PostgreSQL real | 54 |
| **API (HTTP inject)** | Vitest | Endpoints, auth, validações | PostgreSQL real | 39 |
| **Contract/Edge** | Vitest | Formatos de resposta, entradas maliciosas | Mock/Real | 38 |
| **E2E (Playwright)** | Playwright | Fluxos BPMN completos no browser | PostgreSQL real | 24 |
| **API (Postman)** | Newman | Endpoints isolados e fluxos BPMN | PostgreSQL real | 28 |
| **Total** | | | | **451+** |

### 4.1 Testes Unitários

Testam funções individuais com dependências mockadas:

- `validacao-data.test.js` (11) — Validações de data/hora, conflitos de horário e sala (testa `encarregado.service.js`)
- `validacao-pressao.test.js` (5) — Inscrição em turma (`enrollAluno`): duplicados, entidades inexistentes
- `bpmn01-negative-edge.test.js` (12) — Transições de estado inválidas, operações em dados inexistentes, conversão de tipos
- `pedidosaula.service.test.js` (25) — CRUD de pedidos, transições de estado, submissão, estados
- `pedidosaula.controller.test.js` (22) — Controller, validação de input, serialização, formatação
- `auth.service.test.js` (22) — Register, login, validateToken, tokenVersion, forgot/reset password
- `users.service.test.js` (32) — CRUD utilizadores, tokenVersion em desativação, roles
- `anuncios.service.test.js` (13) — CRUD anúncios, aprovação/rejeição
- `aluguerFigurino.service.test.js` (11) — Transações, stock, disponibilidade
- `figurinos.service.test.js` (42) — CRUD figurinos, stock, estados, lookup data
- `eventos.service.test.js` (14) — CRUD eventos, publicação, destaque
- `turmas.service.test.js` (25) — CRUD turmas, inscrições, fechar/arquivar
- `notificacoes.service.test.js` (7) — Criação, leitura, marcação como lida
- `audit.service.test.js` (14) — Auditoria: createAuditLog, getAuditLogs com filtros e paginação
- `professor-aulas.service.test.js` (13) — Aulas do professor: getProfessorAulas, updateAulaStatus

### 4.2 Testes de Integração (BD real)

Testam fluxos completos com dados reais:

- `prisma-bpmn01.test.js` (8) — Pedido de aula: criar, aprovar, rejeitar, notificar, fluxo completo
- `prisma-bpmn02.test.js` (8) — Remarcação: propor, aceitar/rejeitar (Professor e EE), fluxo completo
- `prisma-bpmn03.test.js` (5) — Aluguer de figurino: solicitar, aprovar, rejeitar
- `prisma-bpmn04.test.js` (6) — Gestão de anúncios: criar, aprovar, rejeitar
- `scheduler-integracao.test.js` (6) — Scheduler, auto-rejeição após 3h
- `bpmn-integracao.test.js` (21) — Fluxos BPMN completos integrados

### 4.3 Testes de API (HTTP inject)

Testam os endpoints com autenticação real:

- `00-smoke.test.js` (5) — Smoke tests: públicos, auth, disponibilidades
- `auth.api.test.js` (15) — Register, login, forgot/reset password, tokenVersion
- `eventos.api.test.js` (10) — CRUD eventos com auth
- `notificacoes.api.test.js` (9) — Notificações via API

### 4.4 Testes Contract/Edge

- `resposta-shapes.test.js` — Verifica que todos os endpoints retornam o formato correto `{ success, data }` ou `{ success, error }`
- `entrada-api.test.js` — SQL injection, XSS, caracteres especiais, concorrência

### 4.5 Testes E2E (Playwright)

Testam os 4 fluxos BPMN no browser:

| Ficheiro | Fluxo | Testes |
|----------|-------|--------|
| `bpmn1-pedido-aula.spec.js` | BPMN 1 — Marcação de Aula | 4 |
| `bpmn2-remarcacao.spec.js` | BPMN 2 — Remarcação | 5 |
| `bpmn3-aluguer-figurino.spec.js` | BPMN 3 — Aluguer de Figurino | 7 |
| `bpmn4-criar-anuncio.spec.js` | BPMN 4 — Criar Anúncio | 4 |
| `verificacao-completa.spec.js` | Dashboards por role | 4 |

### 4.6 Testes Postman/Newman

28 testes de API organizados por fluxo BPMN:

| Fluxo | Quantidade | Descrição |
|-------|-----------|-----------|
| BPMN 1 — Pedido de Aula | 7 | Submeter, aprovar, rejeitar, notificações |
| BPMN 2 — Remarcação | 9 | Propor, aceitar (Professor), aceitar (EE), rejeitar |
| BPMN 3 — Aluguer de Figurino | 6 | Solicitar, aprovar, rejeitar |
| BPMN 4 — Criar Anúncio | 6 | Criar, aprovar, rejeitar |

---

## 5. Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| **Vitest** | 1.6.1 | Testes unitários e de integração |
| **Playwright** | 1.52+ | Testes E2E com browser |
| **Postman** | — | Testes de API manuais |
| **Newman** | — | CLI para Postman |
| **Fastify** | 4.x | `app.inject()` para testes HTTP |
| **Prisma** | — | ORM para testes de integração |
| **bcrypt** | — | Hash de passwords em testes |
| **jsonwebtoken** | — | Geração de tokens em testes |
| **PostgreSQL** | 14 | Base de dados para testes |

### 5.1 Porquê Vitest e não Jest?

| Característica | Vitest | Jest |
|---------------|--------|------|
| Velocidade | ⚡ Extremamente rápido | 🐢 Mais lento |
| Integração com Vite | ✅ Nativa | ❌ Requer configuração |
| Suporte ESM | ✅ Nativo | ⚠️ Parcial |
| API | ✅ Compatível com Jest | — |
| TypeScript | ✅ Nativo | ⚠️ Requer ts-jest |

### 5.2 Porquê Playwright e não Cypress?

| Característica | Playwright | Cypress |
|---------------|-----------|---------|
| Multi-browser | ✅ Chrome, Firefox, Safari | ⚠️ Chrome apenas |
| Velocidade | ⚡ Mais rápido | 🐢 Mais lento |
| Testes em background | ✅ Nativo | ❌ Limitado |
| Mobile | ✅ Nativo | ❌ Limitado |
| Network mocking | ✅ Avançado | ⚠️ Básico |

---

## 6. Estrutura de Pastas

```
projeto/
│
├── backend/tests/                       # Testes Vitest
│   ├── setup.js                         # Configuração global (env vars, mocks)
│   ├── vitest.config.js                 # Configuração Vitest
│   │
│   ├── helpers/
│   │   ├── db.js                        # PrismaClient para testes
│   │   ├── auth-utils.js                # Geração de tokens JWT para testes
│   │   └── seed-utils.js                # Utilitários de seed
│   │
│   ├── unit/
│   │   ├── auth.service.test.js         # Testes de autenticação (22)
│   │   ├── users.service.test.js        # Testes de gestão de utilizadores (32)
│   │   ├── pedidosaula.service.test.js  # Testes de pedidos de aula (25)
│   │   ├── pedidosaula.controller.test.js # Testes de controller (22)
│   │   ├── notificacoes.service.test.js # Testes de notificações (7)
│   │   ├── audit.service.test.js        # Testes de auditoria (14)
│   │   ├── professor-aulas.service.test.js # Testes de aulas professor (13)
│   │   ├── anuncios.service.test.js     # Testes de anúncios (13)
│   │   ├── aluguerFigurino.service.test.js # Testes de aluguer (11)
│   │   ├── figurinos.service.test.js    # Testes de figurinos (42)
│   │   ├── turmas.service.test.js       # Testes de turmas (25)
│   │   ├── eventos.service.test.js      # Testes de eventos (14)
│   │   ├── validacao-data.test.js       # Validações de data/hora (11)
│   │   ├── validacao-pressao.test.js    # Testes de pressão (5)
│   │   ├── salas.service.test.js        # Testes de salas (17)
│   │   ├── professor.service.test.js    # Testes de professores (17)
│   │   └── bpmn01-negative-edge.test.js # Negative/Edge cases BPMN01 (12)
│   │
│   ├── integration/
│   │   ├── prisma-bpmn01.test.js        # BPMN 1 — Pedido de Aula (8)
│   │   ├── prisma-bpmn02.test.js        # BPMN 2 — Remarcação (8)
│   │   ├── prisma-bpmn03.test.js        # BPMN 3 — Aluguer Figurino (5)
│   │   ├── prisma-bpmn04.test.js        # BPMN 4 — Anúncios (6)
│   │   ├── bpmn-integracao.test.js      # Fluxos BPMN integrados (21)
│   │   └── scheduler-integracao.test.js # Testes do scheduler (6)
│   │
│   ├── api/
│   │   ├── 00-smoke.test.js             # Smoke tests (5)
│   │   ├── auth.api.test.js             # Testes de API auth (15)
│   │   ├── eventos.api.test.js          # Testes de API eventos (10)
│   │   └── notificacoes.api.test.js     # Testes de API notificações (9)
│   │
│   ├── contract/
│   │   └── resposta-shapes.test.js      # Formato das respostas
│   │
│   └── edge/
│       └── entrada-api.test.js          # SQL injection, XSS, concorrência
│
├── e2e/                                 # Testes E2E Playwright
│   ├── playwright.config.js             # Configuração Playwright
│   ├── global-setup.js                  # Setup global (reset BD, criar dados)
│   ├── helpers.js                       # Utilitários (login, nav, toast)
│   ├── package.json                     # Dependências Playwright
│   │
│   ├── bpmn1-pedido-aula.spec.js        # BPMN 1 — 4 testes
│   ├── bpmn2-remarcacao.spec.js         # BPMN 2 — 5 testes
│   ├── bpmn3-aluguer-figurino.spec.js   # BPMN 3 — 7 testes
│   ├── bpmn4-criar-anuncio.spec.js      # BPMN 4 — 4 testes
│   └── verificacao-completa.spec.js     # Dashboards — 4 testes
│
└── postman/                             # Testes Postman/Newman
    ├── EntArtes_BPMN_Flows.json         # Coleção principal (28 requests, 4 fluxos BPMN)
    └── EntArtes_Environment.json        # Environment padrão (19 variáveis)
```

---

## 7. Execução dos Testes

### 7.1 Pré-requisitos

- PostgreSQL com dados de seed (`npm run seed` no diretório `backend/`)
- Backend configurado (`.env` com `DATABASE_URL` e `JWT_SECRET`)
- Node.js 18+

### 7.2 Vitest (Unitários + Integração + API)

```bash
# Backend
cd backend

# Executar todos os testes
npm test

# Ou diretamente
npx vitest run

# Modo watch (re-executa ao guardar)
npx vitest

# Output detalhado
npx vitest run --reporter=verbose

# Ficheiro específico
npx vitest run tests/unit/auth.service.test.js

# Filtrar por nome
npx vitest run --reporter=verbose --grep "tokenVersion"

# Com coverage
npx vitest run --coverage
```

### 7.3 Playwright (E2E)

```bash
# E2E
cd e2e

# Instalar browsers (primeira vez)
npx playwright install chromium

# Executar todos os testes
npx playwright test

# Fluxo específico
npx playwright test bpmn1-pedido-aula

# Com UI (debug visual)
npx playwright test --ui

# Com debug
npx playwright test --debug
```

**Pré-requisitos para E2E:**
- Backend em `localhost:3000`
- Frontend em `localhost:5173`
- PostgreSQL com dados de seed

### 7.4 Postman/Newman

```bash
# Newman
cd postman

# Executar coleção completa
newman run EntArtes_BPMN_Flows.json \
  -e EntArtes_Environment.json

# Output detalhado
newman run EntArtes_BPMN_Flows.json \
  -e EntArtes_Environment.json --verbose

# Relatório HTML
newman run EntArtes_BPMN_Flows.json \
  -e EntArtes_Environment.json \
  -r htmlextra --reporter-htmlextra-export relatorio.html

# Fluxo específico (executa apenas uma pasta)
newman run EntArtes_BPMN_Flows.json \
  -e EntArtes_Environment.json \
  --folder "BPMN 1 — Pedido de Aula"
```

---

## 8. Base de Dados de Teste

### 8.1 Configuração

Os testes de integração e API usam a **mesma base de dados PostgreSQL** que o ambiente de desenvolvimento:

```env
DATABASE_URL="postgresql://entartes:entartes_dev_password@localhost:5432/entartes"
```

### 8.2 Setup global (`tests/setup.js`)

```javascript
beforeAll(() => {
  process.env.JWT_SECRET = 'entartes_secret_key_2026_dev';
});

afterAll(() => {
  // Limpeza de env vars
});

beforeEach(() => {
  vi.clearAllMocks();
});
```

### 8.3 Helpers (`tests/helpers/db.js`)

```javascript
cleanTestTables()     // TRUNCATE tabelas de teste (pedidos, aulas, etc.)
getEstadoId(tipo)     // Lookup de ID de estado por nome
getSalaId(nome)       // Lookup de ID de sala por nome
getUserId(email)      // Lookup de ID de utilizador por email
getAlunoId(userId)    // Lookup de ID de aluno por utilizador
getModalidadeId(nome)  // Lookup de ID de modalidade por nome
```

### 8.4 Limpeza entre testes

Os testes E2E usam `global-setup.js` que:
1. Reseta `minutos_ocupados` das disponibilidades
2. Remove pedidos com mais de 5 minutos
3. Cria disponibilidades futuras para os próximos 7 dias (via `ensureDisponibilidades()`)
4. Rejeita pedidos PENDENTE com mais de 5 minutos para evitar conflitos entre execuções

Os testes de integração com BD real usam `cleanTestTables()` que faz `TRUNCATE ... RESTART IDENTITY CASCADE` das tabelas de dados voláteis (pedidos, aulas, transações, notificações, disponibilidades).

---

## 9. Coverage e Resultados

### 9.1 Última Execução (2026-05-07)

```
 Test Files  25 passed (25)
      Tests  427 passed (427)  (Vitest)
   Start at  22:03:53
   Duration  4.17s
     
  24 E2E tests (Playwright) — 33s
  28 Postman/Newman requests
```

### 9.2 Distribuição por Tipo

| Tipo | Testes | % |
|------|--------|---|
| **Vitest Unitários** | 268 | 59% |
| **Vitest Integração** | 54 | 12% |
| **Vitest API** | 39 | 9% |
| **Vitest Contract/Edge** | 38 | 8% |
| **Playwright E2E** | 24 | 5% |
| **Postman/Newman** | 28 | 6% |
| **Total** | **451+** | **99%** |

### 9.3 Por Categoria Funcional

| Categoria | Testes | Framework |
|-----------|--------|-----------|
| Validação de dados | 11 | Vitest |
| Testes de pressão | 5 | Vitest |
| Negative/Edge cases | 12 | Vitest |
| BPMN Integração | 21 | Vitest |
| Pedidos de aula (service) | 25 | Vitest |
| Controller | 22 | Vitest |
| Auth service | 22 | Vitest |
| Users service | 32 | Vitest |
| Figurinos service | 42 | Vitest |
| Turmas service | 25 | Vitest |
| Anúncios service | 13 | Vitest |
| Eventos service | 14 | Vitest |
| Aluguer service | 11 | Vitest |
| Notificações service | 7 | Vitest |
| Auditoria service | 14 | Vitest |
| Aulas professor service | 13 | Vitest |
| API auth | 15 | Vitest |
| API eventos | 10 | Vitest |
| API notificações | 9 | Vitest |
| Smoke tests | 5 | Vitest |
| Contract (formato resposta) | 12 | Vitest |
| Edge (segurança) | 26 | Vitest |
| E2E BPMN 1-4 | 20 | Playwright |
| E2E Verificação dashboards | 4 | Playwright |
| Postman API | 28 | Newman |

### 9.4 Fluxos BPMN com Cobertura

| BPMN | Fluxo | Testes Unitários | Testes Integração | Testes E2E | Postman |
|------|-------|-----------------|-------------------|------------|---------|
| **BPMN 1** | Marcação de Aula | 52+ | 8 | 4 | 7 |
| **BPMN 2** | Remarcação | 5+ | 8 | 5 | 9 |
| **BPMN 3** | Aluguer de Figurino | 11+ | 5 | 7 | 6 |
| **BPMN 4** | Criar Anúncio | 13+ | 6 | 4 | 6 |

---

## 10. Casos de Teste Relevantes

### 10.1 Testes de Autenticação e Segurança

| Teste | Descrição |
|-------|-----------|
| `deve rejeitar token revogado (tokenVersion mismatch)` | Token com `tokenVersion` desatualizada é rejeitado |
| `deve retornar 401 após desativar utilizador` | Token perde validade quando Direção desativa user |
| `deve retornar 401 após alterar role` | Token perde validade quando role é alterada |
| `deve rejeitar token inválido/expirado` | Token com assinatura errada é rejeitado |
| `deve rejeitar utilizador inativo` | Login de user com `estado: false` é bloqueado |

### 10.2 Testes de Validação de Dados

| Teste | Descrição |
|-------|-----------|
| `deve rejeitar data no passado` | Data anterior a hoje é rejeitada |
| `deve rejeitar hora no passado (se for hoje)` | Hora anterior à atual é rejeitada |
| `deve aceitar duração mínima de 30 min` | Duração válida no limite inferior |
| `deve rejeitar duração acima do máximo do slot` | Duração superior ao disponível |
| `deve validar campos obrigatórios` | Nome, email, password, data, hora em falta |

### 10.3 Testes de Pressão e Concorrência

| Teste | Descrição |
|-------|-----------|
| `deve rejeitar inscrição em grupo com lotação máxima` | Grupo cheio rejeita novo aluno |
| `deve rejeitar inscrição em grupo fechado/arquivado` | Apenas grupos abertos aceitam inscrições |
| `deve rejeitar aluno já inscrito no mesmo grupo` | Prevenção de duplicados |
| `deve rejeitar pedido com conflito de horário` | Professor ou sala já ocupados |
| `deve rejeitar transação sem stock disponível` | Figurino sem stock não pode ser alugado |

### 10.4 Testes de Transições de Estado (BPMN)

| Teste | Descrição |
|-------|-----------|
| `Encarregado submete pedido → estado Pendente` | Transição inicial do BPMN 1 |
| `Direção aprova pedido → estado Confirmado` | Aprovação muda estado |
| `Direção rejeita pedido → estado Rejeitado` | Rejeição com motivo |
| `Direção propõe nova data → AGUARDA_PROFESSOR` | Início do BPMN 2 |
| `Professor aceita → AGUARDA_EE` | Transição intermédia |
| `EE aceita → data atualizada` | Conclusão do BPMN 2 |
| `Não pode aprovar pedido já rejeitado` | Imutabilidade de estados finais |

### 10.5 Testes de Notificações

| Teste | Descrição |
|-------|-----------|
| `Notificação criada após aprovação do pedido` | AULA_APROVADA |
| `Notificação na transição de remarcação` | SUGESTAO_REMARCACAO |
| `Notificação após aprovação de anúncio` | ANUNCIO_APROVADO |
| `Deve retornar notificações por utilizador` | Filtro correto por userId |

### 10.6 Testes de Permissões (RBAC)

| Teste | Descrição |
|-------|-----------|
| `GET /api/users — 401 sem token` | Rota protegida sem auth |
| `POST /api/users — 403 sem role DIRECAO` | Apenas Direção cria users |
| `PUT /api/users/:id — 403 sem permissão` | User não pode alterar outro |
| `POST /api/eventos — 401 sem auth` | Rota protegida |

### 10.7 Testes de Segurança (Edge Cases)

| Teste | Descrição |
|-------|-----------|
| SQL Injection no nome | `Robert'); DROP TABLE alunos;--` |
| XSS no nome | `<script>alert("XSS")</script>` |
| Caracteres especiais | `João González Müller 中文` |
| Caracteres de escape | `Test\nNewline\tTab\r\n` |
| Telemóvel alfanumérico | `ABCDEFGHIJ` |
| Concorrência (2 registos simultâneos) | Dois emails quase iguais |

### 10.8 Testes de Formato de Resposta (Contract)

| Teste | Descrição |
|-------|-----------|
| `GET /api/... — formato { success, data }` | Sucesso sempre com `data` |
| `GET /api/... com erro — formato { success, error }` | Erro sempre com `error` |
| `POST /api/... — formato { success, message }` | Criação com `message` |

---

## 11. Relação com BPMN e Diagrama de Sequência

### 11.1 Mapeamento BPMN → Testes

#### BPMN 1 — Pedido de Aula

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│    1.    │    │    2.    │    │    3.    │
│   EE     │───→│ Direção  │───→│  Aula    │
│ Submete  │    │  Aprova  │    │Confirmada│
└──────────┘    └──────────┘    └──────────┘
     │               │               │
      ▼               ▼               ▼
   Testes:          Testes:          Testes:
   validacao-data   prisma-bpmn01    prisma-bpmn01
   validacao-pressão                 BPMN1 (Postman)
   BPMN1 (Postman req 1-3)          bpmn1-e2e (4)
   bpmn1-e2e (setup)
```

| Passo BPMN | Teste Vitest | Teste E2E | Teste Postman |
|-----------|-------------|-----------|--------------|
| 1. EE submete pedido | `validacao-data.test.js` | Setup cria pendente | BPMN1 req 1-3 |
| 2. Direção aprova | `prisma-bpmn01.test.js` | BPMN1 Teste 2-3 | BPMN1 req 4 |
| 3. Notificação enviada | `prisma-bpmn01.test.js` | — | BPMN1 req 6 |
| Validação: data passada | `validacao-data.test.js` | — | BPMN1 req 7 |
| Validação: sem auth | `auth.api.test.js` | — | — |

#### BPMN 2 — Remarcação de Aula

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│    1.    │    │    2.    │    │    3.    │
│ Direção  │───→ Professor │───→    EE    │
│  Propõe  │    │  Aceita  │    │  Aceita  │
└──────────┘    └──────────┘    └──────────┘
     │               │               │
     ▼               ▼               ▼
   Testes:          Testes:          Testes:
   prisma-bpmn02    prisma-bpmn02    prisma-bpmn02
   BPMN2 req 1-3   BPMN2 req 4-6    BPMN2 req 7-9
   bpmn2-e2e (1)    bpmn2-e2e (2)    bpmn2-e2e (3)
```

| Passo BPMN | Teste Vitest | Teste E2E | Teste Postman |
|-----------|-------------|-----------|--------------|
| 1. Direção propõe | `prisma-bpmn02.test.js` | BPMN2 Teste 1-2 | BPMN2 req 1-3 |
| 2. Professor aceita | `prisma-bpmn02.test.js` | BPMN2 Teste 3 | BPMN2 req 4-6 |
| 3. Professor rejeita | `prisma-bpmn02.test.js` | — | — |
| 4. EE aceita | `prisma-bpmn02.test.js` | BPMN2 Teste 4 | BPMN2 req 7-8 |
| 5. EE rejeita | `prisma-bpmn02.test.js` | — | BPMN2 req 9 |
| Validação: data passada | `validacao-data.test.js` | — | — |

#### BPMN 3 — Aluguer de Figurino

```
┌──────────┐    ┌──────────┐
│    1.    │    │    2.    │
│ EE/Prof  │───→ Direção  │
│ Solicita │    │  Aprova  │
└──────────┘    └──────────┘
     │               │
      ▼               ▼
   Testes:          Testes:
   aluguerFigurino  prisma-bpmn03
   BPMN3 (Postman)  bpmn3-e2e (7)
   bpmn3-e2e (1-3)
```

#### BPMN 4 — Criar Anúncio

```
┌──────────┐    ┌──────────┐
│    1.    │    │    2.    │
│  EE/Prof │───→ Direção  │
│   Cria   │    │  Aprova  │
└──────────┘    └──────────┘
     │               │
     ▼               ▼
   Testes:          Testes:
   anuncios.service  prisma-bpmn04
   BPMN4 (Postman)  bpmn4-e2e (4)
   bpmn4-e2e (1-2)
```

### 11.2 Mapeamento Diagrama de Sequência → Métodos Testados

Os nomes dos métodos nos testes correspondem aos nomes nos diagramas de sequência:

| Método (Diagrama) | Onde é testado | Framework |
|-------------------|---------------|-----------|
| `autenticar(email, password)` | `auth.service.test.js` | Vitest |
| `submeterPedidoAula(dados)` | `pedidosaula.service.test.js`, `prisma-bpmn01.test.js` | Vitest |
| `avaliarPedido(id, aprovacao)` | `prisma-bpmn01.test.js` | Vitest |
| `consultarAula(id)` | `aulas.service.test.js` (via pedidosaula) | Vitest |
| `sugerirNovaData(aulaId, data)` | `prisma-bpmn02.test.js` | Vitest |
| `responderSugestaoProfessor(id, aceitar)` | `prisma-bpmn02.test.js` | Vitest |
| `responderSugestaoEE(id, aceitar)` | `prisma-bpmn02.test.js` | Vitest |
| `registarAnuncio(dados)` | `anuncios.service.test.js` | Vitest |
| `avaliarAnuncio(id, aprovacao, motivo)` | `prisma-bpmn04.test.js` | Vitest |
| `registarTransacao(dados)` | `aluguerFigurino.service.test.js` | Vitest |
| `avaliarPedidoReserva(id, estado)` | `prisma-bpmn03.test.js` | Vitest |
| `inserirAlunoAula(aulaId, alunoId)` | Testes de integração | Vitest |
| `verificarDisponibilidadeProfessor(profId)` | `validacao-pressao.test.js` | Vitest |

### 11.3 Cobertura de Transições de Estado

| Estado Atual | Ação | Estado Seguinte | Testado em |
|-------------|------|----------------|-----------|
| Pendente | Direção aprova | Confirmado | BPMN1 |
| Pendente | Direção rejeita | Rejeitado | BPMN1 |
| Pendente | 3h sem resposta | Rejeitado (auto) | scheduler |
| Confirmado | Professor realiza | Realizado | BPMN1 |
| Pendente | Direção remarca | AGUARDA_PROFESSOR | BPMN2 |
| AGUARDA_PROFESSOR | Professor aceita | AGUARDA_EE | BPMN2 |
| AGUARDA_PROFESSOR | Professor rejeita | Pendente (original) | BPMN2 |
| AGUARDA_EE | EE aceita | Confirmado (nova data) | BPMN2 |
| AGUARDA_EE | EE rejeita | Pendente (original) | BPMN2 |
| Pendente (anúncio) | Direção aprova | Aprovado | BPMN4 |
| Pendente (transação) | Direção aprova | Aprovado | BPMN3 |

---

## 12. Conclusão

A suite de testes do Ent'Artes oferece:

✅ **Mais de 451 testes automatizados** distribuídos por 3 frameworks (Vitest com 399 testes, Playwright com 24, Postman com 28)

✅ **Cobertura dos 4 fluxos BPMN** — desde a criação do pedido de aula até à gestão de anúncios

✅ **Validação de regras de negócio** — datas, horas, permissões, estados, conflitos

✅ **Testes de segurança** — SQL injection, XSS, tokenVersion, autenticação

✅ **Testes de pressão** — concorrência, limites, grupos lotados

✅ **Múltiplas camadas** — unitários (rápidos, isolados), integração (BD real), API (inject), contract/edge, E2E (browser)

✅ **Execução rápida** — 427 testes Vitest em ~13 segundos, 24 testes E2E em ~33 segundos

✅ **Documentação viva** — nomes dos testes em português seguem padrão `deve_[ação]_quando_[condição]`

### Lições Aprendidas

1. **Mock seletivo**: Mocks são essenciais para testes unitários, mas os testes de integração com BD real são mais fiáveis para validar queries Prisma
2. **Limpeza de dados**: O `TRUNCATE ... RESTART IDENTITY CASCADE` é essencial para testes de integração independentes
3. **Global setup E2E**: O `global-setup.js` que cria disponibilidades futuras evita falhas causadas por dados temporais
4. **TokenVersion**: A implementação de revogação de tokens por alteração de estado/role exigiu testes específicos em 3 camadas
5. **Paralelismo vs Isolamento**: Testes E2E devem ser sequenciais (workers=1) para evitar conflitos de estado

---

*Documento atualizado em 2026-05-08*
*Projeto Ent'Artes — Sistema de Gestão de Escola de Dança*
