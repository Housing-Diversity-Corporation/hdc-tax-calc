#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Scenario: tax-calc app smoke test (stub — proves the shared engine drives 5173)
#
#   bash frontend/scripts/scenarios/smoke.sh
#
# Verifies the app is reachable, mounted, and on a recognizable view. This is a
# starter scenario; add app-specific checks (and data-testids) as needed. The
# engine (ui-verify-engine.sh) is a byte-identical copy of the Map repo's
# scripts/ui-verify.sh — only this scenario's selectors/URL are app-specific.
# ─────────────────────────────────────────────────────────────────────────────
set -u
export UI_VERIFY_URL="${UI_VERIFY_URL:-http://localhost:5173}"   # tax-calc frontend
cd "$(dirname "$0")/.." || exit 1
source ui-verify-engine.sh

ui_preflight || exit 1

# App mounted: #root has rendered content
ui_expect "app mounted" "document.querySelector('#root') && document.querySelector('#root').children.length > 0" 15

# On a recognizable tax-calc view (login or an authed screen)
ui_expect "recognizable view" "['Sign in','Sign In','Available Investment','Tax Benefits Calculator','Investor Tax Profile','AHF Fund'].some(function(s){return document.body.innerText.indexOf(s)>-1;})" 10

ui_report "tax-calc-smoke"
