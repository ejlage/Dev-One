#!/bin/bash
# ============================================================
# Script: status.sh
# Descrição: Verifica o estado dos serviços do Ent'Artes
#            (PostgreSQL, Backend, Frontend) e monitoriza
#            o endpoint de saúde /api/health.
# Uso:     ./scripts/status.sh              # estado geral
#          ./scripts/status.sh --watch      # modo watch (atualiza a cada 5s)
#          ./scripts/status.sh --simple     # output só com códigos (para scripts)
#          ./scripts/status.sh --help       # ajuda
# ============================================================
set -euo pipefail

BACKEND_PORT=3000
FRONTEND_PORT=5173
BACKEND_URL="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

check_port() {
    local port=$1
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0
    elif netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0
    else
        return 1
    fi
}

check_http() {
    local url=$1
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
    echo "$code"
}

check_pg() {
    if command -v pg_isready &> /dev/null; then
        pg_isready -q 2>/dev/null && return 0 || return 1
    elif command -v psql &> /dev/null; then
        psql -h localhost -U entartes -d entartes -c "SELECT 1" -q 2>/dev/null && return 0 || return 1
    else
        check_port 5432 && return 0 || return 1
    fi
}

get_pid() {
    local pattern=$1
    pgrep -f "$pattern" 2>/dev/null | head -1
}

get_uptime() {
    local pid=$1
    if [ -n "$pid" ]; then
        local elapsed
        elapsed=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')
        echo "$elapsed"
    else
        echo "-"
    fi
}

print_status() {
    local name=$1
    local port=$2
    local status=$3
    local pid=$4
    local http_code=$5
    local uptime=$6

    local status_str=""
    local pid_str=""
    local http_str=""
    local uptime_str=""

    case "$status" in
        running)  status_str="${GREEN}● Running${NC}" ;;
        partial)  status_str="${YELLOW}● Degraded${NC}" ;;
        stopped)  status_str="${RED}● Stopped${NC}" ;;
    esac

    [ -n "$pid" ] && pid_str="PID $pid" || pid_str="-"
    [ "$http_code" != "000" ] && http_str="$http_code" || http_str="-"
    [ "$uptime" != "-" ] && uptime_str="${CYAN}uptime ${uptime}${NC}" || uptime_str=""

    printf "  %-18s %-18s  %-10s  HTTP %-5s  %s  %s\n" \
        "$name" "$status_str" "$pid_str" "$http_str" "$uptime_str"
}

do_status() {
    echo ""
    echo -e " ${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e " ${BOLD}║         Ent'Artes — Estado dos Serviços           ║${NC}"
    echo -e " ${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # PostgreSQL
    if check_pg; then
        print_status "PostgreSQL" "5432" "running" "$(get_pid "postgres" | head -1)" "-" "-"
    else
        print_status "PostgreSQL" "5432" "stopped" "-" "-" "-"
    fi

    # Backend
    if check_port $BACKEND_PORT; then
        local pid_backend
        pid_backend=$(get_pid "node.*server.js")
        local http_backend
        http_backend=$(check_http "${BACKEND_URL}/api/health")
        if [ "$http_backend" = "200" ]; then
            print_status "Backend" "$BACKEND_PORT" "running" "$pid_backend" "$http_backend" "$(get_uptime "$pid_backend")"
        else
            print_status "Backend" "$BACKEND_PORT" "partial" "$pid_backend" "$http_backend" "$(get_uptime "$pid_backend")"
        fi
    else
        print_status "Backend" "$BACKEND_PORT" "stopped" "-" "-" "-"
    fi

    # Backend health detail
    if check_port $BACKEND_PORT; then
        local health
        health=$(curl -s --max-time 3 "${BACKEND_URL}/api/health" 2>/dev/null || echo '{"status":"error"}')
        local health_status
        health_status=$(echo "$health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        local uptime_str
        uptime_str=$(echo "$health" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4)
        echo ""
        echo -e "  ${CYAN}Health API:${NC} status=${health_status:-unknown}  uptime=${uptime_str:-unknown}"
    fi

    # Frontend
    if check_port $FRONTEND_PORT; then
        local pid_frontend
        pid_frontend=$(get_pid "vite")
        local http_frontend
        http_frontend=$(check_http "$FRONTEND_URL")
        print_status "Frontend" "$FRONTEND_PORT" "running" "$pid_frontend" "$http_frontend" "$(get_uptime "$pid_frontend")"
    else
        print_status "Frontend" "$FRONTEND_PORT" "stopped" "-" "-" "-"
    fi

    echo ""
}

do_simple() {
    local all_ok=0
    check_pg || all_ok=1
    check_port $BACKEND_PORT || all_ok=1
    local http
    http=$(check_http "${BACKEND_URL}/api/health")
    [ "$http" != "200" ] && all_ok=1
    echo "$all_ok"
    exit $all_ok
}

do_watch() {
    while true; do
        clear 2>/dev/null || true
        do_status
        echo -e "  ${YELLOW}A atualizar a cada 5s... (Ctrl+C para sair)${NC}"
        sleep 5
    done
}

case "${1:-}" in
    --help|-h)
        echo "Uso: ./scripts/status.sh [--watch|--simple|--help]"
        echo "  (sem args)  Estado detalhado dos serviços"
        echo "  --watch     Modo monitorização contínua (5s)"
        echo "  --simple    Output só com código (0=ok, 1=erro)"
        exit 0
        ;;
    --watch|-w)
        do_watch
        ;;
    --simple|-s)
        do_simple
        ;;
    *)
        do_status
        ;;
esac
