#!/bin/bash
set -e

VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${AZUL}========================================"
echo -e "   Ent'Artes — Setup Inicial"
echo -e "========================================${RESET}"
echo ""

# 1. Verificar pré-requisitos
echo -e "${AMARELO}[1/5] A verificar pré-requisitos...${RESET}"
command -v node >/dev/null 2>&1 || { echo -e "${VERMELHO}✗ Node.js não encontrado. Instala em https://nodejs.org${RESET}"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${VERMELHO}✗ PostgreSQL não encontrado. Instala PostgreSQL 14+${RESET}"; exit 1; }
echo -e "${VERDE}✓ Node.js $(node -v) e PostgreSQL encontrados${RESET}"
echo ""

# 2. Criar base de dados e utilizador
echo -e "${AMARELO}[2/5] A configurar PostgreSQL...${RESET}"
psql -U postgres -c "CREATE USER entartes WITH PASSWORD 'entartes_dev_password';" 2>/dev/null || echo "  (utilizador já existe)"
psql -U postgres -c "CREATE DATABASE entartes OWNER entartes;" 2>/dev/null || echo "  (base de dados já existe)"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE entartes TO entartes;" 2>/dev/null
echo -e "${VERDE}✓ Base de dados configurada${RESET}"
echo ""

# 3. Configurar .env
echo -e "${AMARELO}[3/5] A configurar variáveis de ambiente...${RESET}"
if [ ! -f "$ROOT/backend/.env" ]; then
    cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
    echo -e "${VERDE}✓ .env criado a partir de .env.example${RESET}"
else
    echo -e "${VERDE}✓ .env já existe${RESET}"
fi
echo ""

# 4. Instalar dependências
echo -e "${AMARELO}[4/5] A instalar dependências...${RESET}"
cd "$ROOT/backend" && npm install --silent
echo -e "${VERDE}✓ Backend${RESET}"
cd "$ROOT/frontend" && npm install --silent
echo -e "${VERDE}✓ Frontend${RESET}"
echo ""

# 5. Base de dados — schema + seed
echo -e "${AMARELO}[5/5] A criar tabelas e dados de seed...${RESET}"
cd "$ROOT/backend"
npx prisma db push --accept-data-loss 2>&1 | tail -3
node src/seed.js
echo -e "${VERDE}✓ Tabelas criadas e seed executado${RESET}"
echo ""

echo -e "${AZUL}========================================"
echo -e "   Setup concluído!"
echo -e "========================================"
echo ""
echo -e "Para iniciar o projeto:"
echo -e "  ${VERDE}./scripts/start-services.sh${RESET}"
echo ""
echo -e "Ou manualmente:"
echo -e "  Backend:  cd backend && npm run dev   → http://localhost:3000"
echo -e "  Frontend: cd frontend && npm run dev  → http://localhost:5173"
echo ""
echo -e "Credenciais de teste (todas com password: password123):"
echo -e "  Direção:      direcao@entartes.pt"
echo -e "  Professor:    joao.santos@entartes.pt"
echo -e "  Professor:    maria.pereira@entartes.pt"
echo -e "  Encarregado:  pedro.oliveira@email.pt"
echo -e "  Aluno:        miguel.silva@email.pt"
echo -e "${AZUL}========================================${RESET}"
