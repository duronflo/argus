#!/bin/sh
set -eu

LOG_DIR="${WATCHTOWER_LOG_DIR:-/var/log/watchtower}"
LOG_FILE="${WATCHTOWER_LOG_FILE:-$LOG_DIR/watchtower.log}"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

echo "[$(date -Iseconds)] Watchtower startet – Logdatei: $LOG_FILE" | tee -a "$LOG_FILE"
/watchtower "$@" 2>&1 | tee -a "$LOG_FILE"
