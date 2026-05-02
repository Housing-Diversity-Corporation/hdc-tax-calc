#!/usr/bin/env bash
# =============================================================
# HDC Tax Calc — Start of Session
# Run this when you sit down at a machine to work.
# =============================================================
set -e

echo "=========================================="
echo "  HDC Tax Calc — Starting Session"
echo "=========================================="

# Pull latest from GitHub
echo ""
echo "Pulling latest from GitHub..."
git pull --rebase || { echo "❌ Pull failed — resolve conflicts before continuing."; exit 1; }
echo "✅ Code is up to date."

# Check for uncommitted changes from a previous session
if [ -n "$(git status --porcelain)" ]; then
  echo ""
  echo "⚠️  You have uncommitted changes from a previous session:"
  git status --short
  echo ""
  echo "You may want to commit these before starting new work."
fi

echo ""
echo "Ready. Start the dev servers in separate terminals:"
echo "  Frontend:  cd frontend && npm run dev"
echo "  Backend:   cd backend && ./dev.sh"
echo ""
