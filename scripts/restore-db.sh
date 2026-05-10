#!/bin/bash
# ============================================================
# Script: restore-db.sh
# Descrição: Restaura a base de dados PostgreSQL do Ent'Artes
#            a partir de um backup criado pelo backup-db.sh.
# ATENÇÃO: Este script ELIMINA todos os dados atuais da BD!
# Uso:     ./scripts/restore-db.sh                        # restaurar com menu interativo
#          ./scripts/restore-db.sh <ficheiro.sql.gz>      # restaurar ficheiro específico
#          ./scripts/restore-db.sh --list                  # listar backups disponíveis
#          ./scripts/restore-db.sh --help                  # ajuda
# ============================================================
set -euo pipefail

# === CONFIGURAÇÃO ============================================
BACKUP_DIR="/home/ugrt/Documents/Opencode/backups/db"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="entartes"
DB_USER="entartes"
DB_PASSWORD="entartes_dev_password"
# ============================================================

SCRIPT_NAME=$(basename "$0")

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()    { echo -e "${GREEN}[${SCRIPT_NAME}]${NC} $1"; }
warn()   { echo -e "${YELLOW}[${SCRIPT_NAME}]${NC} $1"; }
error()  { echo -e "${RED}[${SCRIPT_NAME}]${NC} $1" >&2; }
header() { echo -e "\n${CYAN}=== $1 ===${NC}"; }

show_help() {
    cat <<EOF
Uso: ./scripts/${SCRIPT_NAME} [OPÇÃO|ficheiro]

Opções:
  (sem argumentos)       Menu interativo para escolher backup
  <ficheiro.sql.gz>      Restaurar ficheiro específico (caminho absoluto ou relativo)
  --list                 Listar backups disponíveis
  --help                 Mostrar esta ajuda

Exemplos:
  ./scripts/${SCRIPT_NAME}
  ./scripts/${SCRIPT_NAME} /home/user/backups/db/entartes_2026-05-07_03-00-01.sql.gz
  ./scripts/${SCRIPT_NAME} --list

ATENÇÃO: A restauração ELIMINA todos os dados atuais da base de dados!
EOF
    exit 0
}

ensure_dir() {
    mkdir -p "$BACKUP_DIR"
}

# Verificar dependências
if ! command -v psql &> /dev/null; then
    error "psql não encontrado. Instala o PostgreSQL cliente."
    error "  sudo apt install postgresql-client    # Ubuntu/Debian"
    error "  sudo dnf install postgresql           # Fedora"
    exit 1
fi

list_backups() {
    ensure_dir
    if [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        warn "Nenhum backup encontrado em ${BACKUP_DIR}"
        exit 0
    fi
    header "Backups disponíveis"
    ls -lhS "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print NR")", $5, $9}' || true
    echo ""
    exit 0
}

# Processar modos
case "${1:-}" in
    --help|-h) show_help ;;
    --list|-l) list_backups ;;
esac

# Se o primeiro argumento for um ficheiro, usar esse
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    # Modo interativo — mostrar backups disponíveis
    ensure_dir
    shopt -s nullglob
    backups=("$BACKUP_DIR"/*.sql.gz)
    shopt -u nullglob

    if [ ${#backups[@]} -eq 0 ]; then
        warn "Nenhum backup encontrado em ${BACKUP_DIR}"
        warn "Cria um backup primeiro: ./scripts/backup-db.sh"
        exit 1
    fi

    header "Backups disponíveis"
    for i in "${!backups[@]}"; do
        size=$(du -h "${backups[$i]}" | cut -f1)
        echo "  $((i+1)). ${backups[$i]##*/}  (${size})"
    done
    echo ""
    read -rp "Escolhe o número do backup a restaurar (ou 0 para cancelar): " choice
    if [[ ! "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#backups[@]}" ]; then
        warn "Operação cancelada."
        exit 0
    fi
    BACKUP_FILE="${backups[$((choice-1))]}"
elif [ ! -f "$BACKUP_FILE" ]; then
    # Tentar encontrar no diretório de backups
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        error "Ficheiro não encontrado: ${BACKUP_FILE}"
        error "Usa --list para ver backups disponíveis."
        exit 1
    fi
fi

# Confirmar restauração
header "AVISO: RESTAURAÇÃO DE BASE DE DADOS"
echo "  Ficheiro: ${BACKUP_FILE}"
echo "  Base de dados alvo: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "  Isto ELIMINARÁ todos os dados atuais da base de dados!"
echo ""
read -rp "Tens a certeza? (escreve 'SIM' para continuar): " confirmation
if [ "$confirmation" != "SIM" ]; then
    warn "Operação cancelada."
    exit 0
fi

echo ""
log "A preparar restauração..."

export PGPASSWORD="${DB_PASSWORD}"

# Verificar se o ficheiro contém --clean (self-contained) ou precisa de tratamento
if [[ "$BACKUP_FILE" == *.gz ]]; then
    DECOMPRESS_CMD="gunzip -c"
else
    DECOMPRESS_CMD="cat"
fi

# Verificar se o backup inclui comandos de cleanup
header "A restaurar base de dados"
if $DECOMPRESS_CMD "$BACKUP_FILE" | head -20 | grep -q "DROP TABLE\|DROP SCHEMA\|pg_dump"; then
    # Backup com --clean (já inclui DROP antes de CREATE)
    $DECOMPRESS_CMD "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
else
    # Backup sem --clean: precisa de drop manual primeiro
    warn "Backup sem --clean detected. A recriar base de dados..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" > /dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" > /dev/null 2>&1
    $DECOMPRESS_CMD "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
fi

unset PGPASSWORD

log " RESTAURAÇÃO CONCLUÍDA!"
log "Base de dados '${DB_NAME}' restaurada a partir de: ${BACKUP_FILE}"
