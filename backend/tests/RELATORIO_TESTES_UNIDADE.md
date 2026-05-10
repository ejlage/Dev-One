# Relatório de Testes - Ent'Artes

**Data:** 2026-04-30  
**Versão do Projeto:** 1.0.0  
**Framework de Testes:** Vitest v1.6.1


cd backend && npm test
#ou
npx vitest run

---

## 1. Resumo Executivo

| Métrica | Valor |
|--------|-------|
| **Total de Testes** | 108 |
| **Testes Passados** | 108 |
| **Testes Falhados** | 0 |
| **Taxa de Sucesso** | 100% |
| **Tempo de Execução** | ~364ms |

---

## 2. Suite de Testes

### 2.1 Testes Unitários

| Ficheiro | Testes | Estado |
|----------|--------|--------|
| `validacao-data.test.js` | 25 | ✅ Passa |
| `validacao-pressao.test.js` | 24 | ✅ Passa |
| `pedidosaula.service.test.js` | 17 | ✅ Passa |

### 2.2 Testes de Integração

| Ficheiro | Testes | Estado |
|----------|--------|--------|
| `bpmn-integracao.test.js` | 22 | ✅ Passa |
| `pedidosaula.controller.test.js` | 20 | ✅ Passa |

---

## 3. Cobertura de Testes

### 3.1 Validações de Data e Hora

| Cenário | Descrição | Resultado |
|--------|----------|-----------|
| Data passada | Rejeitar data anterior a hoje | ✅ |
| Data hoje | Aceitar data de hoje | ✅ |
| Data futura | Aceitar data futura | ✅ |
| Hora passada (hoje) | Rejeitar hora anterior à atual | ✅ |
| Hora futura (hoje) | Aceitar hora posterior à atual | ✅ |
| Hora igual atual | Rejeitar hora exatamente igual | ✅ |
| Data vazia | Rejeitar string vazia | ✅ |
| Data null | Rejeitar null | ✅ |
| Hora inválida | Rejeitar formato inválido | ✅ |

### 3.2 Validações de Figurinos

| Cenário | Descrição | Resultado |
|--------|----------|-----------|
| Data início passada | Rejeitar para anúncios | ✅ |
| Data fim anterior | Rejeitar data fim ≤ início | ✅ |
| Figurino indisponível | Rejeitar quando ocupado | ✅ |
| Quantidade insuficiente | Rejeitar excesso | ✅ |

### 3.3 Testes de Pressão

| Cenário | Descrição | Resultado |
|--------|----------|-----------|
| Grupo lotação máxima | Rejeitar inscrição lotação cheia | ✅ |
| Grupo fechado | Rejeitar inscripciones | ✅ |
| Grupo arquivado | Rejeitar inscripciones | ✅ |
| Idade mínima | Rejeitar aluno jovem | ✅ |
| Nível insuficiente | Rejeitar nível baixo | ✅ |
| Aluno já inscrito | Rejeitar duplicado | ✅ |
| Conflito de horário | Rejeitar sobreposição | ✅ |
| Sala ocupada | Rejeitar reserva duplicada | ✅ |
| Professor ocupado | Rejeitar conflito professor | ✅ |

### 3.4 Fluxos BPMN

| Fluxo | Descrição | Resultado |
|-------|-----------|-----------|
| BPMN1-1 | Submeter pedido válido | ✅ |
| BPMN1-2 | Rejeitar data-passado | ✅ |
| BPMN1-3 | Rejeitar sem professor | ✅ |
| BPMN1-4 | Rejeitar sem disponibilidade | ✅ |
| BPMN1-5 | Rejeitar sem aluno (EE) | ✅ |
| BPMN1-6 | Aprovar pedido (DIREÇÃO) | ✅ |
| BPMN1-7 | Rejeitar pedido (DIREÇÃO) | ✅ |
| BPMN2-1 | Propor remarcação | ✅ |
| BPMN2-2 | Rejeitar remarcação data-passado | ✅ |
| BPMN2-3 | Professor aceita | ✅ |
| BPMN2-4 | Professor rejeita | ✅ |
| BPMN2-5 | EE confirma | ✅ |
| BPMN2-6 | EE rejeita | ✅ |
| BPMN2-7 | Expirar sugestão (3h) | ✅ |

### 3.5 Máquina de Estados

| Transição | De → Para | Resultado |
|----------|----------|----------|
| PENDENTE → CONFIRMADO | ✅ Permitido |
| PENDENTE → REJEITADO | ✅ Permitido |
| PENDENTE → CANCELADO | ✅ Permitido |
| PENDENTE → REALIZADO | ❌ Proibido |
| REJEITADO → CONFIRMADO | ❌ Proibido |

---

## 4. Código de Testes Criados

### 4.1 Estrutura de Ficheiros

```
backend/tests/
├── unit/
│   ├── validacao-data.test.js      (NOVO)
│   ├── validacao-pressao.test.js    (NOVO)
│   └── pedidosaula.service.test.js
└── integration/
    ├── bpmn-integracao.test.js    (NOVO)
    └── pedidosaula.controller.test.js
```

### 4.2 Ficheiros Principais

#### `validacao-data.test.js` (25 testes)
```javascript
describe('Validação de Data e Hora - Unit Tests', () => {
  // Testes de data não-passado
  // Testes de hora posterior atual
  // Testes de data+hora combinadas
  // Testes de figurinos (data início/fim)
  // Edge cases
});
```

#### `validacao-pressao.test.js` (24 testes)
```javascript
describe('Testes de Pressão - Grupos e Enrollment', () => {
  // Cenário: Grupo sem vagas
  // Cenário: Aluno não qualificado (idade/nível)
  // Cenário: Aluno já inscrito
  // Cenário: Conflito de horário
  // Cenário: Figurinos indisponíveis
  // Cenário: Autenticação/autorização
  // Cenário: Conflito de recursos
});
```

#### `bpmn-integracao.test.js` (22 testes)
```javascript
describe('BPMN1 - Fluxo de Pedido de Aula', () => {
  // Fluxo completo EE→DIREÇÃO
  // Validações de dados
  // Aprovações/rejeições
});

describe('BPMN2 - Fluxo de Remarcação', () => {
  // Proposta de remarcação
  // Aceites/rejeições (Professor/EE)
  // Expiração de sugestão
});

describe('Máquina de Estados', () => {
  // Transições válidas/inválidas
  // Estados de remarcação
});
```

---

## 5. Casos de Pressão Testados

### 5.1 Data e Hora

| ID | Caso de Teste | Entrada | Saída Esperada | Estado |
|----|--------------|--------|---------------|--------|
| CT-01 | Data passada | 2026-04-29 | Erro | ✅ |
| CT-02 | Hoje hora anterior | 2026-04-30 10:00 | Erro | ✅ |
| CT-03 | Hoje hora igual | 2026-04-30 12:00 | Erro | ✅ |
| CT-04 | Amanhã qualquer hora | 2026-05-01 08:00 | OK | ✅ |

### 5.2 Grupos e Enrollment

| ID | Caso de Teste | Entrada | Saída Esperada | Estado |
|----|--------------|--------|---------------|--------|
| CT-05 | Lotação esgotada | 10/10 alunos | Erro | ✅ |
| CT-06 | Grupo fechado | status=FECHADO | Erro | ✅ |
| CT-07 | Idade insuficiente | 7 anos (min=10) | Erro | ✅ |
| CT-08 | Nível insuficiente | INICIANTE (< INTERMEDIARIO) | Erro | ✅ |
| CT-09 | Aluno duplicado | alunoId=3 (já inscrito) | Erro | ✅ |
| CT-10 | Conflito horário | même dia/hora | Erro | ✅ |

### 5.3 Figurinos

| ID | Caso de Teste | Entrada | Saída Esperada | Estado |
|----|--------------|--------|---------------|--------|
| CT-11 | Figurino alugado | estado=ALUGADO | Erro | ✅ |
| CT-12 | Sem estoque | 请求 2 > disponivel 1 | Erro | ✅ |
| CT-13 | Data início passée | 2026-04-29 | Erro | ✅ |
| CT-14 | Data fim inválida | fim ≤ início | Erro | ✅ |

### 5.4 Autenticação

| ID | Caso de Teste | Entrada | Saída Esperada | Estado |
|----|--------------|--------|---------------|--------|
| CT-15 | Sem token | token=null | Erro | ✅ |
| CT-16 | Token expirado | token=expired | Erro | ✅ |
| CT-17 | Role não autorizado | ALUNO (sem permissão) | Erro | ✅ |

---

## 6. Fluxos BPMN Executados

### BPMN1: Pedido de Aula

```
ENCARREGADO     →    DIREÇÃO      →   Sistema
   │                │
   │─ Criar pedido ─→│
   │                │─ Aprovar──→ CONFIRMADA
   │                │                OU
   │                │─ Rejeitar──→ REJEITADA
```

**Testes:** 9

### BPMN2: Remarcação

```
DIREÇÃO        →   PROFESSOR    →   ENCARREGADO
    │                │                │
    │─ Sugerir ──→│                │
    │             │─ Aceitar ──→│
    │             │  OU         │
    │             │─ Rejeitar ─→│──────→ CANCELADO
    │             │            │
    │             │            ←─ Confirmar ─ CONFIRMADA
    │             │            OU
    │             │            ←─ Rejeitar ─ CANCELADO
```

**Testes:** 13

---

## 7. Notas para Defesa

### 7.1 Pontos Fortes

1. **Validação em DUAS camadas:** Frontend (UI) + Backend (API) - máxima segurança
2. **Validações de tempo real:** Data/hora >= momento atual impede erros por input человека
3. **Testes de pressão:** Cobrem cenários de borda e edge cases críticos
4. **Máquina de estados:** Garante transições válidas (BPMN)
5. **Feedback detalhado:** Mensagens de erro específicas para cada caso

### 7.2 Decisões de Design

| Decisão | Justificativa |
|--------|-------------|
| Validação no frontend + backend | Backend é a "linha de defesa final" - não confiar só no frontend |
| Data/hora atual vs "hoje 00:00" | "Hoje" significa "agora" não "início do dia" |
| Erros em português | UI em pt-PT, mensagens também |
|edge cases incluídos | Dados reais podem ter formatos inválidos |

### 7.3 возможных Improvements

| Área | Suggestão |
|------|-----------|
| Testes E2E | Adicionar Playwright para testes UI |
| Cobertura | Adicionar istanbul/nyc |
| Fixtures | Criar dados de teste em ficheiros separados |
| Mocks | Usar vi.mock() para Prisma |

---

## 8. Execução

```bash
# Todos os testes
cd backend && npm test

# Apenas unitários
npx vitest run tests/unit/

# Apenas integração  
npx vitest run tests/integration/

# Com coverage
npx vitest run --coverage
```

---

## 9. Conclusão

**Resultado Final: 108/108 testes passaram (100%)**

Os testes implementados cobrem:
- ✅ Validações de data e hora
- ✅ Cenários de pressão (gruposCheios, aluno não qualificado, conflitos)
- ✅ Fluxos BPMN (pedido, remarcação)
- ✅ Máquina de estados
- ✅ Autenticação e autorização
- ✅ edge cases e formatos inválidos

Os validadores implementados impedem que utilizadores criem recursos com datas no passado, garantindo integridade dos dados e evitando problemas operacionais.

---

*Relatório gerado automaticamente em 2026-04-30*
