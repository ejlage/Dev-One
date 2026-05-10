# Relatório de Conformidade — Testes E2E (BPMN 01–04)

## Sumário

| BPMN | Testes | Passam | Falham | Status |
|------|--------|--------|--------|--------|
| BPMN 01 — Pedido de Aula | 9 | 9 | 0 | ✅ |
| BPMN 02 — Remarcação de Aula | 5 | 5 | 0 | ✅ |
| BPMN 03 — Aluguer de Figurino | 2 | 2 | 0 | ✅ |
| BPMN 04 — Criar Anúncio | 2 | 2 | 0 | ✅ |
| **Total** | **18** | **18** | **0** | **✅** |

---

## BPMN 01 — Pedido de Aula (9/9 ✅)

| # | Teste | Fluxo | Resultado |
|---|-------|-------|-----------|
| 1 | Happy path (UI: criar → direção aprovar) | Principal | ✅ |
| 2 | Rejeição (UI: criar → direção rejeitar) | Alternativo | ✅ |
| 3 | Validação data passada (400) | Validação | ✅ |
| 4 | Validação campo obrigatório (400) | Validação | ✅ |
| 5 | Conflito mesmo slot ("reservado") | Validação | ✅ |
| 6 | Encarregado visualiza status Pendente | UI | ✅ |
| 7 | Direção visualiza lista Pendentes | UI | ✅ |
| 8 | BD verification: approve → CONFIRMADO + aula | BD | ✅ |
| 9 | BD verification: reject → REJEITADO + sugestao=null | BD | ✅ |

### Fluxos validados
- **Principal**: Encarregado cria pedido → Direção aprova via UI → estado CONFIRMADO, aula criada
- **Alternativo**: Encarregado cria pedido → Direção rejeita com motivo → estado REJEITADO
- **Validações**: data passada (400), campo obrigatório (400), conflito horário/sala ("reservado")
- **Visualização**: Encarregado vê "Pendente" na Agenda; Direção vê lista "Pedidos de Aula Pendentes"
- **Base de Dados**: verificação direta dos estados após approve/reject via API

---

## BPMN 02 — Remarcação de Aula (5/5 ✅)

| # | Teste | Fluxo | Resultado |
|---|-------|-------|-----------|
| 1 | Setup: criar pedido PENDENTE + cleanup | Setup | ✅ |
| 2 | Happy path: Direção remarca (UI) → Professor aceita → EE aceita → Aula remarcada | Principal | ✅ |
| 3 | Professor rejeita: Direção remarca (UI) → Professor rejeita → Sugestão cancelada | Alternativo (Prof) | ✅ |
| 4 | EE rejeita: Direção remarca (UI) → Professor aceita → EE rejeita → Aula CANCELADA | Alternativo (EE) | ✅ |
| 5 | BD verification: remarcação via API → data atualizada, sugestaoestado=null | BD | ✅ |

### Fluxos validados
- **Principal**: Direção propõe remarcação (UI) → Professor aceita (API) → EE aceita (API) → `data` atualizada, `sugestaoestado` limpo
- **Alternativo (Professor rejeita)**: Professor rejeita → `sugestaoestado` limpo, `novadata` limpo, pedido mantém estado/data original
- **Alternativo (EE rejeita)**: EE rejeita → pedido muda para Cancelado
- **Base de Dados**: verificação direta via API da remarcação e atualização da data

### Alterações efetuadas
- Corrigido `'CANCELADO'` → `'Cancelado'` e `'CONFIRMADO'` → `'Confirmado'` (DB usa Title Case)
- Adicionado cleanup do pedido de setup para evitar poluição entre testes
- Fix `novadata`/`novaHora` no frontend `api.ts` (já aplicado em sessão anterior)
- Teste 5 (BD verification) migrado para API (em vez de UI) por ser verificação de BD

---

## BPMN 03 — Aluguer de Figurino (2/2 ✅)

| # | Teste | Fluxo | Resultado |
|---|-------|-------|-----------|
| 1 | Encarregado solicita aluguer de figurino | Principal | ✅ |
| 2 | Direção aprova a reserva de figurino | Principal | ✅ |

### Fluxos validados
- **Setup automático**: Cria anúncio ALUGUER + aprova se nenhum existir com stock disponível
- **Principal**: Encarregado solicita (preenche datas) → Direção aprova na lista "Aprovação de Reservas"

---

## BPMN 04 — Criar Anúncio de Figurino (2/2 ✅)

| # | Teste | Fluxo | Resultado |
|---|-------|-------|-----------|
| 1 | Encarregado cria anúncio de aluguer | Principal | ✅ |
| 2 | Direção aprova o anúncio pendente | Principal | ✅ |

### Fluxos validados
- **Principal**: Encarregado cria anúncio (seleciona figurino, preenche valor/datas) → badge "Pendente" visível → Direção aprova → badge "Pendente" some

---

## Bugs Conhecidos (NÃO Corrigidos)

1. **Overlap temporal meia-noite**: Backend não deteta conflito quando `horainicio + duracaoaula` ultrapassa meia-noite (PostgreSQL `time` type não considera data). Serviço em `encarregado.service.js:submeterPedidoAula`.
2. **Fastify response schemas (várias rotas)**: `data: { type: "object" }` sem `additionalProperties: true` — resposta serializada como `data: {}`. Apenas corrigido para `encarregado.routes.js`.
3. **Card não mostra ID do pedido**: Cartão de aula/pedido não renderiza `idpedidoaula`. Testes não conseguem localizar pedido específico pelo ID na UI.
4. **`minutos_ocupados` não decrementado após remarcação/cancelamento**: Quando uma aula é remarcada ou cancelada, `minutos_ocupados` da disponibilidade original não é decrementado. Causa acumulação e falsos conflitos em execuções sequenciais.
5. **[Minor] 403 `/api/direcao/aulas/status`**: Direção logada mas recebe 403 ao tentar ler status de aulas (erro repetido no console, não crítico).
6. **[Minor] `eventSource.current?.close()`**: Erro no console ao fechar página de Aulas — não afeta testes.

---

## Ambiente de Teste

- **Frontend**: `http://localhost:5173` (Vite)
- **Backend**: `http://localhost:3000` (Fastify)
- **Base de Dados**: PostgreSQL `entartes` local
- **Playwright**: `@playwright/test@1.59.1`, modo headless=false, slowMo=700ms
- **Data do relatório**: 2026-05-08
