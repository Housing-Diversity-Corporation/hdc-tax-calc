#!/usr/bin/env bash
# =============================================================
# HDC Tax Calc — End of Session
# Run this when you're done working on a machine.
# =============================================================

echo "=========================================="
echo "  HDC Tax Calc — Wrapping Up Session"
echo "=========================================="

# Show what's changed
echo ""
git status --short

if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit. You're good."
  exit 0
fi

echo ""
read -p "Commit and push these changes? [y/N] " yn
if [[ ! "$yn" =~ ^[Yy]$ ]]; then
  echo "Skipped. Remember to commit and push before switching machines!"
  exit 0
fi

echo ""
read -p "Commit message: " msg
if [ -z "$msg" ]; then
  echo "No message provided. Aborting."
  exit 1
fi

git add -A
git commit -m "$msg"
git push

echo ""
echo "✅ Changes pushed to GitHub. Safe to switch machines."
