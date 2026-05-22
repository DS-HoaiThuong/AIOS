#!/bin/bash
set -e

echo ""
echo "AI Personal OS - PostgreSQL Database Setup"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DIR/backend"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set."
  echo "Set DATABASE_URL to your PostgreSQL connection string before running this script."
  exit 1
fi

if [ -z "$DIRECT_URL" ]; then
  echo "DIRECT_URL is not set; Prisma will use DATABASE_URL for direct operations if supported."
fi

echo "Installing backend dependencies..."
npm install --silent

echo ""
echo "Generating Prisma client..."
npx prisma generate

echo ""
echo "Applying Prisma schema to PostgreSQL..."
npx prisma db push

echo ""
echo "Database schema is ready."
