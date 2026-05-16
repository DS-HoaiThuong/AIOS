#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     AI Personal OS - Setup & Launch      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi
echo "✅ Node $(node -v) | npm $(npm -v)"

# Backend
echo ""
echo "📦 [1/2] Installing Backend..."
cd "$DIR/backend" && npm install --silent
echo "✅ Backend ready"

# Frontend
echo ""
echo "📦 [2/2] Installing Frontend..."
cd "$DIR/frontend" && npm install --silent
echo "✅ Frontend ready"

# Launch
echo ""
echo "🚀 Launching..."
echo "   Backend  → http://localhost:5001"
echo "   Frontend → http://localhost:3000"
echo "   Press Ctrl+C to stop."
echo ""

cd "$DIR/backend" && npx ts-node src/index.ts &
cd "$DIR/frontend" && npx next dev &

trap "kill %1 %2 2>/dev/null; exit 0" INT TERM
wait
