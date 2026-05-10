#!/bin/bash
# ============================================================
# Script: backup-db.sh
# Descrição: Cria backup da base de dados PostgreSQL do Ent'Artes
#            usando pg_dump, com compressão e rotação automática.
# Uso:     ./scripts/backup-db.sh                  # backup manual
#          ./scripts/backup-db.sh --cron            # silencioso (para cron)
#          ./scripts/backup-db.sh --list            # listar backups
#          ./scripts/backup-db.sh --clean           # limpar backups antigos
#          ./scripts/backup-db.sh --help            # ajuda
# ============================================================
set -euo pipefail

# === CONFIGURAÇÃO ============================================
BACKUP_DIR="/home/ugrt/Documents/Opencode/backups/db"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="entartes"
DB_USER="entartes"
DB_PASSWORD="entartes_dev_password"
RETENTION_DAYS=30          # dias a manter backups
COMPRESS=true              # comprimir com gzip
# ============================================================

SCRIPT_NAME=$(basename "$0")
MODE="${1:-manual}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[${SCRIPT_NAME}]${NC} $1"; }
warn()  { echo -e "${YELLOW}[${SCRIPT_NAME}]${NC} $1"; }
error() { echo -e "${RED}[${SCRIPT_NAME}]${NC} $1" >&2; }

show_help() {
    cat <<EOF
Uso: ./scripts/${SCRIPT_NAME} [OPÇÃO]

Opções:
  (sem argumentos)   Criar backup manual com output verbose
  --cron             Criar backup silencioso (para agendamento cron)
  --list             Listar backups existentes
  --clean            Limpar backups mais antigos que ${RETENTION_DAYS} dias
  --help             Mostrar esta ajuda

Exemplos:
  ./scripts/${SCRIPT_NAME}
  ./scripts/${SCRIPT_NAME} --cron
  0 3 * * * /home/ugrt/Documents/Opencode/Entartes/scripts/${SCRIPT_NAME} --cron
EOF
    exit 0
}

ensure_dir() {
    mkdir -p "$BACKUP_DIR"
}

list_backups() {
    ensure_dir
    echo "Backups disponíveis em: ${BACKUP_DIR}"
    echo ""
    if [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "  (nenhum backup encontrado)"
    else
        ls -lhS "$BACKUP_DIR"/*.sql.gz 2>/dev/null || ls -lhS "$BACKUP_DIR"/*.sql 2>/dev/null || echo "  (nenhum backup encontrado)"
    fi
    exit 0
}

clean_old_backups() {
    ensure_dir
    local count=0
    if [ -d "$BACKUP_DIR" ]; then
        while IFS= read -r -d '' file; do
            rm -f "$file"
            count=$((count + 1))
        done < <(find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -print0 2>/dev/null || true)
        while IFS= read -r -d '' file; do
            rm -f "$file"
            count=$((count + 1))
        done < <(find "$BACKUP_DIR" -name "*.sql" -mtime "+${RETENTION_DAYS}" -print0 2>/dev/null || true)
    fi
    if [ "$count" -gt 0 ]; then
        log "Removidos $count backup(s) com mais de ${RETENTION_DAYS} dias"
    fi
    exit 0
}

# Verificar dependências
if ! command -v pg_dump &> /dev/null; then
    error "pg_dump não encontrado. Instala o PostgreSQL cliente."
    error "  sudo apt install postgresql-client    # Ubuntu/Debian"
    error "  sudo dnf install postgresql           # Fedora"
    exit 1
fi

# Processar modos
case "${MODE}" in
    --help|-h)
        show_help
        ;;
    --list|-l)
        list_backups
        ;;
    --clean)
        clean_old_backups
        ;;
    --cron)
        CRON_MODE=true
        ;;
    *)
        CRON_MODE=false
        ;;
esac

ensure_dir

# Timestamp e nome do ficheiro
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="${DB_NAME}_${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# Export PGPASSWORD para o pg_dump (apenas neste processo)
export PGPASSWORD="${DB_PASSWORD}"

# Executar pg_dump
if [ "$CRON_MODE" = true ]; then
    # Modo cron — silencioso
    if [ "$COMPRESS" = true ]; then
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "${FILEPATH}.gz" 2>/dev/null
    else
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$FILEPATH" 2>/dev/null
    fi
else
    # Modo manual — verbose
    log "A criar backup da base de dados..."
    log "  Base de dados: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    log "  Destino: ${FILEPATH}"

    if [ "$COMPRESS" = true ]; then
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --verbose 2>&1 | gzip > "${FILEPATH}.gz"
        FINAL_PATH="${FILEPATH}.gz"
    else
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --verbose > "$FILEPATH"
        FINAL_PATH="$FILEPATH"
    fi

    # Verificar resultado
    if [ -f "$FINAL_PATH" ]; then
        SIZE=$(du -h "$FINAL_PATH" | cut -f1)
        log " Backup concluído: ${FINAL_PATH} (${SIZE})"
    else
        error "Falha ao criar backup!"
        exit 1
    fi
fi

# Limpar backups antigos (apenas em modo cron)
if [ "$CRON_MODE" = true ]; then
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.sql" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
fi

# Limpar variável de ambiente
unset PGPASSWORD

if [ "$CRON_MODE" = false ]; then
    log "Backup concluído com sucesso!"
fi
