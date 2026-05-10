# Guia de Arquitetura do Backend — Ent'Artes

**Projeto:** Ent'Artes — Escola de Dança  
**Data:** 2026-05-10  
**Versão:** 1.0  

---

## 1. Visão Geral da Arquitetura

O backend segue uma arquitetura de **3 camadas (Three-Tier)**:

```
Routes → Controllers → Services → Prisma → PostgreSQL
```

### Camadas

| Camada | Responsabilidade | Exemplo |
|-------|---------------|---------|
| **Routes** | Definição de endpoints HTTP, validação de schema, autenticação | `aulas.routes.js` |
| **Controllers** | Lógica de request/response, parsing de parâmetros | `aulas.controller.js` |
| **Services** | Lógica de negócio, acesso a dados | `aulas.service.js` |
| **Prisma** | ORM para acesso ao PostgreSQL | Schema `schema.prisma` |

---

## 2. Middleware de Autenticação

### 2.1 auth.middleware.js

Responsável pela verificação de tokens JWT e extração do utilizador.

```javascript
// Funções principais:
verifyToken(req, reply)  // Verifica token JWT
hasRole(role, ...allowed) // Verifica role do utilizador
```

**Funcionalidades:**
- Decodificação do token JWT
- Consulta do utilizador na BD (`estado`, `tokenVersion`, `role`)
- Validação de estado (`estado=false` → 401 "Utilizador desativado")
- Validação de `tokenVersion` (invalidação de sessões)
- Suporte a múltiplas roles (`availableRoles`)

### 2.2 role.middleware.js (NOVO — 2026-05-06)

Middleware de autorização granular baseado em roles permitidas.

```javascript
authorizeRole(...roles)
// Exemplo de uso:
fastify.get("/rota", { onRequest: [verifyToken, authorizeRole("DIRECAO")] }, handler)
```

**Funcionalidades:**
- Aceita uma ou mais roles permitidas
- Usa `availableRoles` se presente (multi-role), caso contrário usa `role` único
- Retorna 403 se a role ativa não está nas permitido

**Exemplo de uso:**

```javascript
// Em rotas:
import { authorizeRole } from "./middleware/role.middleware.js";

fastify.post("/aulas", {
  onRequest: [verifyToken, authorizeRole("DIRECAO", "PROFESSOR")]
}, controller handler);
```

---

## 3. Sistema de Multi-Role

### 3.1 Funcionamento

Um utilizador pode ter múltiplas roles simultâneas (ex: Professor + Direção).

### 3.2 Fluxo no Login

1. Consulta às tabelas de perfil: `direcao`, `professor`, `encarregadoeducacao`, `aluno`
2. Constrói array de roles encontradas
3. Retorna:
   - `role`: string (se 1 role) ou array (se múltiplas)
   - `availableRoles`: array com todas as roles

### 3.3 Frontend

- `DashboardLayout.tsx`: Role switcher dropdown
- `AuthContext.tsx`: `activeRole`, `setActiveRole()`, `hasRole()`
- `roleUtils.ts`: Helpers para manipulação de roles

---

## 4. Sistema de Invalidação de Sessões

### 4.1 tokenVersion

Campo na tabela `utilizador` que, quando alterado, invalida todos os tokens ativos.

### 4.2 Funcionamento

1. No login: `tokenVersion` é incluído no payload do JWT
2. Em cada request: o `tokenVersion` do token é comparado com o da BD
3. Se divergem: 401 "Token expirado — a sua role ou estado foi alterado"

### 4.3 Uso

```javascript
// Para invalidar todas as sessões de um utilizador:
await prisma.utilizador.update({
  where: { iduser: userId },
  data: { tokenVersion: { increment: 1 } }
});
```

---

## 5. Estrutura de Ficheiros

```
backend/src/
├── config/
│   └── db.js              # Configuração Prisma
├── controllers/           # Lógica de request/response
│   ├── aulas.controller.js
│   ├── auth.controller.js
│   └── ...
├── middleware/
│   ├── auth.middleware.js   # verifyToken, hasRole
│   └── role.middleware.js   # authorizeRole (NOVO)
├── routes/                # Definição de endpoints
│   ├── aulas.routes.js
│   ├── auth.routes.js
│   └── ...
├── services/              # Lógica de negócio
│   ├── aulas.service.js
│   ├── auth.service.js
│   └── ...
├── utils/
│   └── jwt.js             # Utils JWT
└── server.js             # Ponto de entrada
```

---

## 6. Autenticação e Autorização

### 6.1 autenticação

- **JWT com expiração:** 1 hora
- **Segredo:** configurável via `.env` (`JWT_SECRET`)
- **Validações:**
  - Token válido (verifica assinatura)
  - Utilizador existe
  - Utilizador ativa (`estado=true`)
  - `tokenVersion` coincide

### 6.2 Autorização

- **Níveis:**
  1. Middleware `verifyToken` ( autenticação)
  2. Função `hasRole()` (verificação de role)
  3. Middleware `authorizeRole()` (autorização granular)

---

## 7. Justificação da Arquitectura

### 7.1 Three-Tier vs MVC

| Aspeto | Three-Tier | MVC |
|--------|-----------|-----|
| Separação | Routes/Controllers/Services | Controller/Model/View |
| Frontend | Separado (React) | same app |
| Escalabilidade | Horizontal native | Coupled |

### 7.2 Prisma vs Raw SQL

| Prisma | Raw SQL |
|--------|-------|
| Type safety | Flexibilidade total |
| Migrations easy | Controlo total |
| Relations automáticas | joins manuais |

---

## 8. Testes

| Tipo | Quantidade | Cobertura |
|------|----------|----------|
| Vitest (Unit/Integração) | ~150 | Services, Controllers, Validações |
| E2E (Playwright) | 14 | Fluxos BPMN 1-4 |
| Postman | 35 | API endpoints |

---

## 9. Referências

- Schema Prisma: `backend/prisma/schema.prisma`
- Seed: `backend/prisma/seed_completa.sql`
- Documentação BPMN: `Planeamento/Diagramas/`
- Testes: `backend/tests/`

---

*Documento criado a 2026-05-10 como parte da atualização de documentação para a disciplina de PDS.*