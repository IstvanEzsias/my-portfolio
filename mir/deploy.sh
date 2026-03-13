#!/bin/bash
# ============================================================
# MIR — Deploy script
# Run on the VPS: bash deploy.sh
# ============================================================
set -e

REPO="IstvanEzsias/my-portfolio"
APP_DIR="/opt/mir"

echo "🚀 MIR Deploy"
echo "=============="

# Pull latest code
if [ -d "$APP_DIR" ]; then
  echo "📥 Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "📥 Cloning repository..."
  git clone "https://github.com/$REPO.git" "$APP_DIR"
  cd "$APP_DIR"
fi

# Ensure .env exists
if [ ! -f "$APP_DIR/mir/.env" ]; then
  echo "⚠️  No .env found. Copying .env.example..."
  cp "$APP_DIR/mir/.env.example" "$APP_DIR/mir/.env"
  echo "❗ Edit $APP_DIR/mir/.env and add your GEMINI_API_KEY, then re-run deploy.sh"
  exit 1
fi

cd "$APP_DIR/mir"

echo "🐳 Building and starting containers..."
docker compose pull --ignore-pull-failures 2>/dev/null || true
docker compose up --build -d

echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "✅ MIR deployed!"
echo "   Health: http://localhost:3001/api/health"
