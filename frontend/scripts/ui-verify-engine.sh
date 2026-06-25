#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# HDC Runtime UI Verification Engine  (app-agnostic — share by manual copy)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Drives a Chrome tab via AppleScript JS. NO app-specific logic lives here, so
# this file can be copied verbatim into any HDC frontend repo. The only per-app
# input is UI_VERIFY_URL (the tab to drive); scenarios set it.
#
#   export UI_VERIFY_URL=http://localhost:5174   # Map app   (tax-calc: 5173)
#   source scripts/ui-verify.sh
#   ui_eval "1+1"                                  # -> 2
#   ui_expect "label" "<js predicate>" [timeout]   # poll-until-true assertion
#   ui_click  "[data-testid=foo]"                  # click first match
#   ui_report "scenario-name"                      # print PASS/FAIL summary + exit code
#
# Design notes:
#   - AppleScript `execute javascript` CANNOT await Promises, so async DOM waits
#     are done by POLLING from bash (ui_expect / ui_wait). Wrap a whole scenario
#     in one script so the many osascript pings stay invisible to the caller.
#   - Output is two-tier: pass = one line; fail = only the failing checks.
#   - Prereqs: Chrome open with a UI_VERIFY_URL tab, logged in, and
#     Chrome → View → Developer → "Allow JavaScript from Apple Events" enabled.
# ═══════════════════════════════════════════════════════════════════════════════

UI_VERIFY_URL="${UI_VERIFY_URL:-http://localhost:5174}"   # per-app default; scenarios override
# host:port token used to locate the tab (strip scheme + any trailing path)
_UI_MATCH="${UI_VERIFY_URL#*://}"; _UI_MATCH="${_UI_MATCH%%/*}"

_UI_PASS=0; _UI_FAIL=0; _UI_FAILMSGS=()

# Compile the AppleScript driver once and reuse it for every eval (faster polling).
_UI_SCPT="$(mktemp /tmp/uiv_driver.XXXXXX.scpt)"
cat > "$_UI_SCPT" << 'SCPTEOF'
on run argv
  set jsCode to item 1 of argv
  set matchToken to item 2 of argv
  tell application "Google Chrome"
    set ft to missing value
    set fw to missing value
    repeat with i from 1 to (count of windows)
      repeat with j from 1 to (count of tabs of window i)
        if URL of tab j of window i contains matchToken then
          set ft to j
          set fw to i
          exit repeat
        end if
      end repeat
      if ft is not missing value then exit repeat
    end repeat
    if ft is missing value then return "ERROR_NO_TAB"
    -- drive the tab WITHOUT activating it (don't steal the user's focus)
    tell tab ft of window fw to return (execute javascript jsCode)
  end tell
end run
SCPTEOF
# Clean up the compiled driver when the sourcing shell exits.
trap '[ -n "$_UI_SCPT" ] && rm -f "$_UI_SCPT"' EXIT

# ─── Core: run JS in the matched tab, echo its result ────────────────────────
ui_eval() {
  osascript "$_UI_SCPT" "$1" "$_UI_MATCH"
}

# ─── Poll a JS predicate until truthy or timeout (seconds, default 8) ────────
#     Returns 0 if it became true, 1 on timeout. Eval errors count as "not yet".
ui_wait() {
  local js="$1" timeout="${2:-8}"
  local tries=$(( timeout * 4 )) i=0   # 0.25s interval
  while [ "$i" -lt "$tries" ]; do
    if [ "$(ui_eval "Boolean($js) ? 'T' : 'F'" 2>/dev/null)" = "T" ]; then return 0; fi
    sleep 0.25; i=$((i+1))
  done
  return 1
}

# ─── Assertion: wait for predicate, record pass/fail ─────────────────────────
#     ui_expect "human label" "<js predicate>" [timeout]
ui_expect() {
  local label="$1" js="$2" timeout="${3:-8}"
  if ui_wait "$js" "$timeout"; then
    _UI_PASS=$((_UI_PASS+1))
  else
    _UI_FAIL=$((_UI_FAIL+1)); _UI_FAILMSGS+=("$label")
  fi
}

# ─── Click first element matching a CSS selector ─────────────────────────────
ui_click() {
  ui_eval "(function(){var e=document.querySelector('$1'); if(e){e.click(); return 'ok';} return 'no_el';})()" >/dev/null
}

# ─── Final report + process exit code (0 = all pass) ─────────────────────────
ui_report() {
  local name="$1" total=$(( _UI_PASS + _UI_FAIL ))
  if [ "$_UI_FAIL" -eq 0 ]; then
    echo "PASS ${name} — ${_UI_PASS}/${total} checks"
    return 0
  fi
  echo "FAIL ${name} — ${_UI_FAIL}/${total} checks failed:"
  local m; for m in "${_UI_FAILMSGS[@]}"; do echo "  ✗ ${m}"; done
  return 1
}

# ─── Preflight: confirm a reachable, JS-enabled tab exists ───────────────────
ui_preflight() {
  local r; r="$(ui_eval "'ok'")"
  if [ "$r" = "ERROR_NO_TAB" ]; then
    echo "FAIL preflight — no Chrome tab matching '${_UI_MATCH}'. Open ${UI_VERIFY_URL}."; return 1
  fi
  if [ "$r" != "ok" ]; then
    echo "FAIL preflight — JS not executing (enable Chrome → View → Developer → Allow JavaScript from Apple Events). Got: ${r}"; return 1
  fi
  return 0
}
