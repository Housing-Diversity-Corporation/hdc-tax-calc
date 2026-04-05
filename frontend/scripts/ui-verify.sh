#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# HDC Runtime UI Verification Harness
# ═══════════════════════════════════════════════════════════════════════════════
#
# Reusable functions for AppleScript-driven Chrome UI verification.
# Source this file at the start of any runtime verification session:
#
#   source frontend/scripts/ui-verify.sh
#
# Then use the functions:
#
#   ui_ensure_fund_detail        # Navigate to Fund Detail (idempotent)
#   ui_read_page_text 500        # Read first N chars of page text
#   ui_run_js "..."              # Execute JS in the app tab
#   ui_check_text "IRA Conversion"  # Check if text exists on page
#   ui_click_text "View Fund Details" # Click element with exact text
#   ui_select_profile 0          # Select profile by index (0-based)
#   ui_wait 3                    # Wait N seconds
#
# Prerequisites:
#   - Chrome open with localhost:5173 tab
#   - Logged in (authToken in localStorage)
#   - AppleScript JS enabled (Chrome → View → Developer → Allow JS from Apple Events)
#   - Frontend dev server running on :5173
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Core: Execute JS in the localhost:5173 tab ──────────────────────────────
ui_run_js() {
  local js="$1"
  # Write AppleScript to temp file to avoid heredoc/quoting issues
  local tmpscpt
  tmpscpt=$(mktemp /tmp/ui_verify.XXXXXX.scpt)
  cat > "$tmpscpt" << 'SCPTEOF'
on run argv
  set jsCode to item 1 of argv
  tell application "Google Chrome"
    set foundTab to missing value
    set foundWin to missing value
    repeat with i from 1 to (count of windows)
      repeat with j from 1 to (count of tabs of window i)
        if URL of tab j of window i contains "localhost:5173" then
          set foundTab to j
          set foundWin to i
          exit repeat
        end if
      end repeat
      if foundTab is not missing value then exit repeat
    end repeat
    if foundTab is missing value then return "ERROR_NO_TAB"
    set active tab index of window foundWin to foundTab
    tell tab foundTab of window foundWin
      set r to execute javascript jsCode
    end tell
    return r
  end tell
end run
SCPTEOF
  osascript "$tmpscpt" "$js"
  local rc=$?
  rm -f "$tmpscpt"
  return $rc
}

# ─── Reload the page ─────────────────────────────────────────────────────────
ui_reload() {
  ui_run_js 'location.reload(); "reloading"' > /dev/null
  ui_wait "${1:-5}"
  echo "OK: reloaded, now on $(ui_current_view)"
}

# ─── Read page text (first N chars) ─────────────────────────────────────────
ui_read_page_text() {
  local n="${1:-300}"
  ui_run_js "document.body.innerText.substring(0, $n)"
}

# ─── Check if text exists on page ───────────────────────────────────────────
ui_check_text() {
  local needle="$1"
  ui_run_js "document.body.innerText.indexOf('${needle}') > -1 ? 'YES' : 'NO'"
}

# ─── Wait N seconds ─────────────────────────────────────────────────────────
ui_wait() {
  sleep "${1:-2}"
}

# ─── Detect current view ────────────────────────────────────────────────────
ui_current_view() {
  ui_run_js "
    (function(){
      var t = document.body.innerText;
      if(t.indexOf('Back') > -1 && t.indexOf('AHF Fund') > -1) return 'fund-detail';
      if(t.indexOf('Available Investment') > -1) return 'investments';
      if(t.indexOf('Tax Benefits Calculator') > -1) return 'calculator';
      if(t.indexOf('Investor Tax Profile') > -1) return 'tax-profile';
      if(t.indexOf('Sign in') > -1) return 'login';
      return 'unknown';
    })()
  "
}

# ─── Navigate to investments page ────────────────────────────────────────────
ui_goto_investments() {
  local current
  current=$(ui_current_view)
  if [ "$current" = "investments" ]; then return 0; fi

  ui_run_js "document.querySelector('.navbar-center button').click();" > /dev/null
  ui_wait 1.5
  ui_run_js "var items = Array.from(document.querySelectorAll('[data-radix-collection-item]')); if(items.length>2) items[2].click();" > /dev/null
  ui_wait 2

  current=$(ui_current_view)
  if [ "$current" = "investments" ]; then
    echo "OK: on investments page"
  else
    echo "WARN: expected investments, got ${current}"
  fi
}

# ─── Click element by exact text match ───────────────────────────────────────
ui_click_text() {
  local text="$1"
  ui_run_js "
    (function(){
      var all = document.querySelectorAll('span, div, button, a');
      for(var i=0;i<all.length;i++){
        if(all[i].innerText.trim() === '${text}' && all[i].children.length === 0){
          all[i].scrollIntoView();
          all[i].click();
          return 'clicked';
        }
      }
      return 'not_found';
    })()
  "
}

# ─── Navigate to Fund Detail (idempotent) ───────────────────────────────────
ui_ensure_fund_detail() {
  local current
  current=$(ui_current_view)

  if [ "$current" = "fund-detail" ]; then
    echo "OK: already on fund-detail"
    return 0
  fi

  if [ "$current" = "login" ]; then
    echo "ERROR: on login page — log in manually first"
    return 1
  fi

  # Step 1: get to investments
  if [ "$current" != "investments" ]; then
    ui_goto_investments
    ui_wait 1
  fi

  # Step 2: click View Fund Details
  local result
  result=$(ui_click_text "View Fund Details")
  if [ "$result" != "clicked" ]; then
    echo "ERROR: could not click View Fund Details (${result})"
    return 1
  fi
  ui_wait 5

  # Verify
  current=$(ui_current_view)
  if [ "$current" = "fund-detail" ]; then
    echo "OK: on fund-detail"
  else
    echo "WARN: expected fund-detail, got ${current}"
  fi
}

# ─── Select investor profile by index (0-based) ─────────────────────────────
ui_select_profile() {
  local idx="${1:-0}"
  ui_run_js "var trigger = document.querySelector('button[role=\"combobox\"]'); if(trigger) trigger.click();" > /dev/null
  ui_wait 1.5
  ui_run_js "var options = document.querySelectorAll('[role=\"option\"]'); if(options.length > ${idx}) options[${idx}].click();" > /dev/null
  ui_wait 3
  echo "OK: selected profile index ${idx}"
}

# ─── Read panel presence on Fund Detail ──────────────────────────────────────
ui_check_panels() {
  ui_run_js "
    (function(){
      var t = document.body.innerText;
      return JSON.stringify({
        sizing: t.indexOf('Investment Sizing') > -1,
        fit: t.indexOf('Investor Fit') > -1,
        ira: t.indexOf('IRA Conversion') > -1,
        taxUtil: t.indexOf('Tax Utilization') > -1,
        exportBtn: t.indexOf('Export Summary') > -1,
        annualToggle: t.indexOf('Annual Efficiency') > -1,
        lifetimeToggle: t.indexOf('Lifetime Coverage') > -1,
        nonpassive: t.indexOf('Nonpassive') > -1,
        passive: t.indexOf('Passive Treatment') > -1
      });
    })()
  "
}

# ─── Quick status report ────────────────────────────────────────────────────
ui_status() {
  echo "=== UI Verification Status ==="
  echo "View: $(ui_current_view)"
  echo "Dev server: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173)"
  echo "Backend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/public/health 2>/dev/null || echo 'down')"
}

echo "UI verification harness loaded. Run 'ui_status' to check prerequisites."
