#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     AI Personal OS - Database Setup      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📦 Installing new Database packages..."
cd "$DIR/backend"
npm install --silent
echo "✅ Packages installed"

echo ""
echo "🗄️ Initializing SQLite Database via Prisma..."
npx prisma generate
npx prisma db push

echo ""
echo "🎉 Database successfully created at backend/prisma/dev.db"
echo "   Now you can run the app again using start.sh!"
echo ""
