#!/bin/bash

# ===========================================
# Ent'Artes - Script de Startup Completo
# ===========================================

# Cores para output
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
RESET='\033[0m'

echo -e "${AZUL}========================================${RESET}"
echo -e "${AZUL}   Ent'Artes - Iniciar Serviços${RESET}"
echo -e "${AZUL}========================================${RESET}"
echo ""

# ===========================================
# 1. Iniciar PostgreSQL
# ===========================================
echo -e "${AMARELO}[1/3] A iniciar PostgreSQL...${RESET}"

if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ PostgreSQL já está a correr${RESET}"
else
    systemctl start postgresql
    sleep 2
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${VERDE}✓ PostgreSQL iniciado${RESET}"
    else
        echo -e "${VERMELHO}✗ Erro ao iniciar PostgreSQL${RESET}"
        exit 1
    fi
fi
echo ""

# ===========================================
# 2. Iniciar Backend
# ===========================================
echo -e "${AMARELO}[2/3] A iniciar Backend...${RESET}"

if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ Backend já está a correr (porta 3000)${RESET}"
else
    cd "$(dirname "$0")/../backend"
    nohup node src/server.js > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    sleep 3
    
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${VERDE}✓ Backend iniciado (PID: $BACKEND_PID)${RESET}"
    else
        echo -e "${VERMELHO}✗ Erro ao iniciar Backend${RESET}"
        tail -10 /tmp/backend.log
        exit 1
    fi
fi
echo ""

# ===========================================
# 3. Iniciar Frontend
# ===========================================
echo -e "${AMARELO}[3/3] A iniciar Frontend...${RESET}"

if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ Frontend já está a correr (porta 5173)${RESET}"
else
    cd "$(dirname "$0")/../frontend"
    nohup npm run dev -- --host > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    sleep 3
    
    if lsof -i :5173 > /dev/null 2>&1; then
        echo -e "${VERDE}✓ Frontend iniciado (PID: $FRONTEND_PID)${RESET}"
    else
        echo -e "${VERMELHO}✗ Erro ao iniciar Frontend${RESET}"
        tail -10 /tmp/frontend.log
        exit 1
    fi
fi
echo ""

# ===========================================
# Resumo Final
# ===========================================
echo -e "${AZUL}========================================${RESET}"
echo -e "${AZUL}         Serviços a Correr${RESET}"
echo -e "${AZUL}========================================${RESET}"
echo -e "${VERDE}✓ PostgreSQL${RESET}   - localhost:5432"
echo -e "${VERDE}✓ Backend API${RESET}   - http://localhost:3000"
echo -e "${VERDE}✓ Frontend Web${RESET}  - http://localhost:5173"
echo ""
echo -e "${AZUL}========================================${RESET}"
echo -e "${AZUL}   Logs disponíveis em:${RESET}"
echo -e "${AZUL}   /tmp/backend.log${RESET}"
echo -e "${AZUL}   /tmp/frontend.log${RESET}"
echo -e "${AZUL}========================================${RESET}"
