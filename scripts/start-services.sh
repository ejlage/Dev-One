#!/bin/bash

# ===========================================
# Ent'Artes - Script de Startup
# ===========================================

# Cores para output
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
RESET='\033[0m'

echo -e "${AZUL}========================================${RESET}"
echo -e "${AZUL}   Ent'Artes - Sistema de Startup${RESET}"
echo -e "${AZUL}========================================${RESET}"
echo ""

# ===========================================
# 1. Verificar PostgreSQL
# ===========================================
echo -e "${AMARELO}[1/3] Verificando PostgreSQL...${RESET}"

if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ PostgreSQL já está a correr${RESET}"
else
    echo -e "${AMARELO}⚠ PostgreSQL não encontrado, a tentar iniciar...${RESET}"
    # Tentar encontrar PostgreSQL
    if command -v pg_ctl &> /dev/null; then
        pg_ctl start 2>/dev/null || echo -e "${AMARELO}⚠ PostgreSQL pode não estar instalado${RESET}"
    else
        echo -e "${AMARELO}⚠ certifique-se que o PostgreSQL está instalado${RESET}"
    fi
fi
echo ""

# ===========================================
# 2. Iniciar Backend
# ===========================================
echo -e "${AMARELO}[2/3] A iniciar Backend...${RESET}"

# Verificar se já está a correr
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ Backend já está a correr (porta 3000)${RESET}"
else
    cd "$(dirname "$0")/../backend"
    
    # Exportar variável da BD
    export PGPASSWORD="entartes_dev_password"
    
    # Criar diretório de logs
    mkdir -p logs
    
    # Iniciar em background usando nohup e loop para manter ativo
    nohup bash -c 'while true; do node src/server.js >> logs/backend.log 2>&1; echo "Backend restarting..." >> logs/backend.log; sleep 2; done' &
    BACKEND_PID=$!
    
    # Esperar que inicie
    sleep 4
    
    # Verificar se iniciou com sucesso
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${VERDE}✓ Backend iniciado${RESET}"
    else
        echo -e "${AMARELO}⚠ Backend a iniciar...${RESET}"
    fi
fi
echo ""

# ===========================================
# 3. Iniciar Frontend
# ===========================================
echo -e "${AMARELO}[3/3] A iniciar Frontend...${RESET}"

# Verificar se já está a correr
if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ Frontend já está a correr (porta 5173)${RESET}"
else
    FRONTEND_DIR="$(dirname "$0")/../frontend"
    
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        
        # Criar ficheiro de log
        LOG_FILE="../backend/logs/frontend.log"
        mkdir -p ../backend/logs
        
        # Iniciar em background
        nohup npm run dev -- --host 0.0.0.0 > "$LOG_FILE" 2>&1 &
        FRONTEND_PID=$!
        
        # Esperar que inicie
        sleep 4
        
        # Verificar se iniciou com sucesso
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${VERDE}✓ Frontend iniciado (PID: $FRONTEND_PID)${RESET}"
        else
            echo -e "${VERMELHO}✗ Erro ao iniciar Frontend${RESET}"
            cat "$LOG_FILE" | tail -5
        fi
    else
        echo -e "${VERMELHO}✗ Diretório do frontend não encontrado${RESET}"
    fi
fi
echo ""

# ===========================================
# Resumo Final
# ===========================================
echo -e "${AZUL}========================================${RESET}"
echo -e "${AZUL}         Serviços a Correr${RESET}"
echo -e "${AZUL}========================================${RESET}"

# Testar Backend
if curl -s -o /dev/null -w "" http://localhost:3000/api/auth/login -X POST 2>/dev/null; then
    echo -e "${VERDE}✓ Backend API${RESET}     - http://localhost:3000"
else
    echo -e "${VERMELHO}✗ Backend API${RESET}    - Erro"
fi

# Testar Frontend
if curl -s -o /dev/null -w "" http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${VERDE}✓ Frontend Web${RESET}    - http://localhost:5173"
else
    echo -e "${VERMELHO}✗ Frontend Web${RESET}   - Erro"
fi

echo ""
echo -e "${AZUL}========================================${RESET}"
echo -e "${AZUL}   Para parar os serviços use:${RESET}"
echo -e "${AZUL}   ./stop-services.sh${RESET}"
echo -e "${AZUL}========================================${RESET}"