#!/usr/bin/env bash
# PostgreSQL local instalado sin sudo en ~/.local/opt/pgsql.
# Uso: scripts/dev-db.sh {start|stop|status|psql}
set -euo pipefail

PREFIX="${PGSQL_PREFIX:-$HOME/.local/opt/pgsql}"
export PATH="$PREFIX/usr/bin:$PATH"
export LD_LIBRARY_PATH="$PREFIX/usr/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PGDATA="${PGDATA:-$HOME/.local/share/pgsql/data}"
PORT="${PGPORT:-5432}"
LOG="$HOME/.local/share/pgsql/postgres.log"

case "${1:-start}" in
  start)
    if pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
      echo "PostgreSQL ya está corriendo en el puerto $PORT."
    else
      mkdir -p "$(dirname "$LOG")"
      pg_ctl -D "$PGDATA" -l "$LOG" -o "-p $PORT -k /tmp" -w start
    fi
    ;;
  stop)
    pg_ctl -D "$PGDATA" -m fast -w stop
    ;;
  status)
    pg_ctl -D "$PGDATA" status
    ;;
  psql)
    shift
    psql -h localhost -p "$PORT" -d "${PGDATABASE:-turnos}" "$@"
    ;;
  *)
    echo "Uso: $0 {start|stop|status|psql}" >&2
    exit 1
    ;;
esac
