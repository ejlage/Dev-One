# Setup para Windows — Ent'Artes Backend

## Pré-requisitos

### 1. Node.js
- Descarregar de https://nodejs.org (versão LTS)
- Verificar instalação:
  ```powershell
  node --version
  npm --version
  ```

### 2. PostgreSQL
- Descarregar de https://www.postgresql.org/download/windows/
- Durante a instalação, guardar a password do utilizador `postgres`
- Anotar a porta (por defeito: **5432**)

---

## Passos de Instalação

### 1. Criar base de dados no PostgreSQL

1. Abrir **pgAdmin** (incluído no PostgreSQL) ou **psql**

2. Criar utilizador e base de dados:

```sql
-- No pgAdmin ou psql, executar:
CREATE USER entartes WITH PASSWORD 'entartes_dev_password';
CREATE DATABASE entartes OWNER entartes;
GRANT ALL PRIVILEGES ON DATABASE entartes TO entartes;
```

### 2. Configurar o projeto

```powershell
# Entrar na pasta backend
cd backend

# Criar ficheiro .env a partir do exemplo
copy .env.example .env

# Abrir o .env no bloco de notas e verificar a DATABASE_URL
# Se o PostgreSQL estiver a usar porta diferente de 5432, ajustar:
# DATABASE_URL="postgresql://entartes:entartes_dev_password@localhost:<PORTA>/entartes?connection_limit=5"
notepad .env
```

### 3. Instalar dependências

```powershell
npm install
```

### 4. Sincronizar base de dados

```powershell
npx prisma db push
```

### 5. Povoar base de dados com dados de teste

```powershell
npm run seed
```

Deverá ver algo como:
```
🌱 A inicializar base de dados...
→ estadosala
  ✓ Disponível
  ✓ Ocupada
  ✓ Em Manutenção
...
✅ Seed concluído!
```

### 6. Iniciar o servidor

```powershell
npm run dev
```

Deverá ver:
```
Server listening at http://0.0.0.0:3000
Servidor a correr em http://localhost:3000
```

---

## Credenciais de Login (depois do seed)

| Email | Password | Role |
|---|---|---|
| direcao@entartes.pt | password123 | Direção |
| joao.santos@entartes.pt | password123 | Professor |
| maria.pereira@entartes.pt | password123 | Professor |
| carlos.ferreira@entartes.pt | password123 | Professor |
| ana.rodrigues@entartes.pt | password123 | Professor |
| pedro.oliveira@email.pt | password123 | Encarregado de Educação |
| miguel.silva@email.pt | password123 | Aluno |

---

## Problemas Comuns

### "module not found" ao npm install
→ Verificar que o Node.js está corretamente instalado
→ Tentar: `npm cache clean --force` e depois `npm install`

### "port 5432 already in use"
→ O PostgreSQL pode estar a usar porta diferente. Verificar no pgAdmin.

### "authentication failed" na base de dados
→ Verificar se a password no `.env` é igual à password definida no PostgreSQL

### Erro ao `npx prisma db push`
→ Confirmar que a base de dados `entartes` foi criada com o utilizador correto

---

## Resumo Rápido (copy-paste)

```powershell
cd backend
copy .env.example .env
npm install
npx prisma db push
npm run seed
npm run dev
```