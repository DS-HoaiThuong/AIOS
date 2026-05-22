#!/bin/bash
set -e

echo ""
echo "AI Personal OS - Setup & Launch"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it from https://nodejs.org"
  exit 1
fi

echo "Node $(node -v) | npm $(npm -v)"

echo ""
echo "[1/2] Installing backend dependencies..."
cd "$DIR/backend"
npm install --silent
echo "Backend ready"

echo ""
echo "[2/2] Installing frontend dependencies..."
cd "$DIR/frontend"
npm install --silent
echo "Frontend ready"

echo ""
echo "Launching..."
echo "Backend  -> http://localhost:${BACKEND_PORT}"
echo "Frontend -> http://localhost:${FRONTEND_PORT}"
echo "Press Ctrl+C to stop."
echo ""

cd "$DIR/backend" && PORT="$BACKEND_PORT" npx ts-node src/index.ts &
cd "$DIR/frontend" && npx next dev -p "$FRONTEND_PORT" &

trap "kill %1 %2 2>/dev/null; exit 0" INT TERM
wait
