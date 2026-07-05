#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Pick a free port for the API -------------------------------------------
# The backend wants 4000 (or PORT from the shell / backend/.env). If that port
# is already taken, fall back to the next free one so a stray process doesn't
# stop the app from starting. Whatever port we settle on is handed to both the
# backend (PORT) and the frontend proxy (BACKEND_PORT) so they stay in sync.

port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | grep -q "[:.]${port}[[:space:]]"
  else
    # Bash fallback: a successful connection means something is listening.
    (exec 3<>"/dev/tcp/127.0.0.1/$port") >/dev/null 2>&1 && return 0 || return 1
  fi
}

find_free_port() {
  local port="$1" max=$(( $1 + 50 ))
  while [ "$port" -le "$max" ]; do
    if ! port_in_use "$port"; then echo "$port"; return 0; fi
    port=$(( port + 1 ))
  done
  return 1
}

env_port="$(grep -E '^PORT=' "$ROOT/backend/.env" 2>/dev/null | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
DESIRED_PORT="${PORT:-${env_port:-4000}}"

if ! BACKEND_PORT="$(find_free_port "$DESIRED_PORT")"; then
  echo "!! Couldn't find a free port near $DESIRED_PORT. Free one up or run with PORT=<port>." >&2
  exit 1
fi

if [ "$BACKEND_PORT" != "$DESIRED_PORT" ]; then
  echo "==> Port $DESIRED_PORT is already in use — starting the API on $BACKEND_PORT instead."
fi

echo "==> Installing dependencies (first run only)"
( cd "$ROOT/backend" && { [ -d node_modules ] || npm install; } )
( cd "$ROOT/frontend" && { [ -d node_modules ] || npm install; } )

echo "==> Starting API on http://localhost:$BACKEND_PORT"
( cd "$ROOT/backend" && PORT="$BACKEND_PORT" npm start ) &
BACKEND_PID=$!

echo "==> Starting dashboard on http://localhost:5173"
( cd "$ROOT/frontend" && BACKEND_PORT="$BACKEND_PORT" npm run dev ) &
FRONTEND_PID=$!

cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo ""
echo "Open http://localhost:5173 in your browser (Vite prints the exact URL if 5173 is taken)."
echo "Press Ctrl+C to stop."

wait
