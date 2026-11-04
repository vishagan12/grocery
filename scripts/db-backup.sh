#!/usr/bin/env bash
# =====================================================================
# Weekly Automated Supabase PostgreSQL Backup Script
# Project: Sri Amman Supermarket Quick-Commerce
# Features:
#   - Safe dump using pg_dump with custom compressed archive format (-Fc)
#   - Automated 30-day rotation and cleanup
#   - Pre-flight credentials verification
# =====================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "Starting database backup..."

# Verify DB connection URL or standard PG env vars
if [ -z "${DATABASE_URL:-}" ] && [ -z "${PGHOST:-}" ]; then
  log "ERROR: Neither DATABASE_URL nor PGHOST is defined."
  log "Provide Supabase PostgreSQL connection string via DATABASE_URL or standard PG env vars."
  exit 1
fi

# Run pg_dump
if [ -n "${DATABASE_URL:-}" ]; then
  log "Dumping database from DATABASE_URL..."
  pg_dump --clean --if-exists --no-owner --no-privileges -Fc "${DATABASE_URL}" -f "${BACKUP_FILE}"
else
  log "Dumping database from PGHOST=${PGHOST} PGDATABASE=${PGDATABASE:-postgres}..."
  pg_dump --clean --if-exists --no-owner --no-privileges -Fc -f "${BACKUP_FILE}"
fi

BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
log "Backup completed successfully: ${BACKUP_FILE} (Size: ${BACKUP_SIZE})"

# Retention management: Prune backups older than 30 days
log "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "supabase_backup_*.dump" -type f -mtime +"${RETENTION_DAYS}" -delete
log "Retention prune complete."

exit 0
