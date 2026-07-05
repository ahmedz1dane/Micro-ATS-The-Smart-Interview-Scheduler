#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Installing dependencies (first run only)"
( cd "$ROOT/backend" && { [ -d node_modules ] || npm install; } )
( cd "$ROOT/frontend" && { [ -d node_modules ] || npm install; } )

echo "==> Starting API on http://localhost:4000"
( cd "$ROOT/backend" && npm start ) &
BACKEND_PID=$!

echo "==> Starting dashboard on http://localhost:5173"
( cd "$ROOT/frontend" && npm run dev ) &
FRONTEND_PID=$!

cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo ""
echo "Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop."

wait
