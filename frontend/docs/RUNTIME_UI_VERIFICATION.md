# Runtime UI Verification via AppleScript + Chrome

**Version:** 1.1
**Created:** 2026-03-23
**Last Updated:** 2026-03-23

---

## When to Use This Procedure

Use this for any fix or feature where **the rendered UI output matters** and a unit test alone can't prove correctness:

- **React memoization fixes** — useMemo/useCallback dependency array changes. The engine may be correct but React serves stale cached results. Only the live UI proves the cache invalidates.
- **Display/formatting changes** — currency formatting, percentage rounding, conditional rendering. The component may compute correctly but render wrong.
- **Input → output wiring** — verifying that changing a dropdown/checkbox/slider actually propagates through the full chain to the KPI strip and Returns Buildup.
- **Investor track / tax profile switching** — the REP ↔ Non-REP flow touches tax rates, depreciation, utilization, and profile labels across multiple components.
- **Regression checks** — after any change to `useHDCCalculations.ts`, `calculations.ts`, `KPIStrip.tsx`, or `ReturnsBuiltupStrip.tsx`, verify the numbers still render correctly.

**Do NOT use this for:**
- Pure backend changes (use API tests)
- Engine-only logic changes with no UI impact (use vitest)
- Styling/CSS-only changes (visual inspection is faster)

---

## How It Works

AppleScript can execute JavaScript in a running Chrome tab. We use this to:
1. Read rendered text from the DOM (what the user actually sees)
2. Click dropdowns, checkboxes, and buttons (simulate user interaction)
3. Capture before/after metrics to verify changes propagate

No Playwright, no Puppeteer, no test accounts, no separate browser. It drives the Chrome session you already have open and logged into.

---

## Setup (One-Time)

### 1. Enable AppleScript JavaScript in Chrome

**Chrome menu bar → View → Developer → Allow JavaScript from Apple Events**

This is a Chrome security setting that persists across restarts. You only need to do this once. If Chrome updates and resets it, re-enable it.

### 2. Verify it works

```bash
osascript -e '
tell application "Google Chrome"
  execute front window'\''s active tab javascript "document.title"
  return result
end tell
'
```

If this returns the page title, you're set. If it errors with "AppleScript is turned off", redo step 1.

---

## Prerequisites (Each Session)

Before Claude Code can run this procedure, these must all be true:

| Requirement | How to verify | How to fix |
|---|---|---|
| Frontend dev server on port 5173 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` → 200 | `cd frontend && npm run dev` |
| Backend on port 8080 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/public/health` → 200 or 403 | `cd backend && ./dev.sh` |
| Chrome open with `localhost:5173` tab | Run Step 1 below — should return page content | Open Chrome, navigate to `http://localhost:5173` |
| Logged in (valid JWT in localStorage) | Run the auth check below — should return token length > 0 | Log in via Google OAuth in Chrome |
| AppleScript JS enabled | Run the verify command above — should return page title | Chrome → View → Developer → Allow JavaScript from Apple Events |

### Auth Check

```bash
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var token = localStorage.getItem(\"authToken\");
            if (!token) return \"NO TOKEN — log in first\";
            return \"Token OK (\" + token.length + \" chars, starts: \" + token.substring(0,20) + \"...)\";
          })();
        "
        return result
      end if
    end repeat
  end repeat
  return "NO TAB — open localhost:5173 in Chrome"
end tell
'
```

**If this returns "NO TOKEN":** Log in to the app in Chrome (Google OAuth). The token persists in localStorage until you log out or it expires.

**If this returns "NO TAB":** Open Chrome and navigate to `http://localhost:5173`.

### API Auth (for deal data fetches)

Some tests need to fetch deal data via the API (e.g., loading a specific trace). The JWT from the Chrome tab works as a Bearer token:

```bash
# Extract the token
TOKEN=$(osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "localStorage.getItem(\"authToken\")"
        return result
      end if
    end repeat
  end repeat
end tell
')

# Use it for API calls
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/deal-conduits/configurations/all | python3 -m json.tool | head -20
```

**Token lifetime:** Google OAuth tokens used by this app typically last several hours. If API calls start returning 403, log in again in Chrome and re-extract.

---

## Quick Reference: AppleScript Pattern

Every command follows this template. Copy-paste and change only the JavaScript inside:

```bash
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            // YOUR JAVASCRIPT HERE
            return \"result\";
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
'
```

**Rules:**
- Wrap JS in an IIFE `(function() { ... })();` — AppleScript needs a return value
- No `async/await` — AppleScript JS doesn't support it
- Use `\\\"` for quotes inside the JS string
- Use `\\n` or `String.fromCharCode(10)` for newlines
- Add `sleep 1` between steps (e.g., open dropdown → select option)
- **Use `ArrowDown` keyboard dispatch to open Radix dropdowns** — `click()` is unreliable (see Step 4)

---

## Step-by-Step Procedures

### Step 1: Verify page state

Confirms Chrome has the app loaded and shows what deal/view is active.

```bash
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var lines = document.body.innerText.split(String.fromCharCode(10)).slice(0, 15);
            return lines.join(\" | \");
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
'
```

### Step 2: Capture KPI Strip + Returns Buildup values

The core metric capture. Returns a JSON object with all key values.

```bash
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var all = document.body.innerText;
            var m = {};

            var bar = all.match(/([0-9.]+)x\\s*\\/\\s*([0-9.]+)%/);
            if (bar) { m.MOIC = bar[1] + \"x\"; m.IRR = bar[2] + \"%\"; }

            var y1 = all.match(/Year\\s*1\\s*Tax\\s*Savings\\s*\\$([0-9,.]+M?)/i);
            if (y1) m.year1TaxSavings = y1[1];

            var dep = all.match(/Depreciation Benefits[^$]*\\$([0-9,.]+M?)\\s*[|]?\\s*([0-9.]+)x/);
            if (dep) m.depreciationBenefits = dep[1] + \" (\" + dep[2] + \")\";

            var oz = all.match(/OZ Benefits[^$]*\\$([0-9,.]+M?)\\s*[|]?\\s*([0-9.]+)x/);
            if (oz) m.ozBenefits = oz[1] + \" (\" + oz[2] + \")\";

            var exit = all.match(/Exit Proceeds[^$]*\\$([0-9,.]+M?)\\s*[|]?\\s*([0-9.]+)x/);
            if (exit) m.exitProceeds = exit[1] + \" (\" + exit[2] + \")\";

            var label = all.match(/(WA|NJ|GA|OR|CA|NY|TX|FL)\\s*(REP|Non-REP)/i);
            if (label) m.profileLabel = label[0];

            return JSON.stringify(m);
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
' | python3 -m json.tool
```

### Step 3: List all combobox selectors (find the one you need)

Dropdown indices shift when the page layout changes. Always run this first to find the right index.

```bash
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var combos = document.querySelectorAll(\"button[role=combobox]\");
            var r = [];
            for (var i = 0; i < combos.length; i++) {
              r.push(i + \": \" + combos[i].textContent.trim().substring(0, 50));
            }
            return r.join(\" || \");
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
'
```

**Known combobox positions (as of 2026-03-23, may shift):**
- **Index 0:** Deal/preset selector (e.g., "Trace 260303 65M")
- **Index 12:** Investor track selector ("Track 1: Real Estate Professional (REP)")
- **Index 1:** State selector ("Washington")

### Step 4: Open a dropdown and select an option

Radix Select renders options in a portal with animation delay. `click()` alone is unreliable — the portal often closes before options render. **Use the keyboard approach:** `ArrowDown` on a focused combobox forces synchronous popover mount.

```bash
# Step 4a: Open the dropdown with ArrowDown (change index as needed)
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var combo = document.querySelectorAll(\"button[role=combobox]\")[12];
            combo.scrollIntoView({block: \"center\"});
            combo.focus();
            combo.dispatchEvent(new KeyboardEvent(\"keydown\", {key: \"ArrowDown\", code: \"ArrowDown\", bubbles: true}));
            return \"opened: \" + combo.textContent.trim();
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
'

sleep 1

# Step 4b: Select the target option by text match
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var opts = document.querySelectorAll(\"[role=option]\");
            for (var i = 0; i < opts.length; i++) {
              if (opts[i].textContent.indexOf(\"Non-REP\") >= 0) {
                opts[i].click();
                return \"Selected: \" + opts[i].textContent.trim();
              }
            }
            return \"not found in \" + opts.length + \" options\";
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
'
```

Change `\"Non-REP\"` to whatever option text you're targeting. Change `[12]` to the combobox index from Step 3.

**Why keyboard instead of click?** `combo.click()` worked initially but fails intermittently. Radix Select portals animate in asynchronously — the options aren't in the DOM when the next AppleScript command runs. `ArrowDown` on a focused combobox forces synchronous mount, so options are immediately clickable.

### Step 6: Toggle a checkbox

```bash
# List checkboxes
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "
          (function() {
            var cbs = document.querySelectorAll(\"input[type=checkbox]\");
            var r = [];
            for (var i = 0; i < cbs.length; i++) {
              var label = cbs[i].parentElement ? cbs[i].parentElement.textContent.trim().substring(0,50) : \"\";
              r.push(i + \": \" + label + \" [\" + (cbs[i].checked ? \"ON\" : \"OFF\") + \"]\");
            }
            return r.join(\" || \");
          })();
        "
        return result
      end if
    end repeat
  end repeat
end tell
'

# Click checkbox by index (change 0 to target index)
osascript -e '
tell application "Google Chrome"
  repeat with w in every window
    repeat with t in every tab of w
      if URL of t contains "localhost:5173" then
        execute t javascript "(function() { var cb = document.querySelectorAll(\"input[type=checkbox]\")[0]; cb.click(); return \"Checked: \" + cb.checked; })();"
        return result
      end if
    end repeat
  end repeat
end tell
'
```

### Step 7: Wait, then re-capture metrics

```bash
sleep 3  # Wait for React recalculation
# Then re-run Step 2 to capture new values
```

---

## Full Test Sequence Example: Investor Track Verification

Run these in order. The `sleep` between steps is critical — React needs time to recalculate.

```bash
echo "=== BEFORE ==="
# Run Step 2 (capture metrics) → save output

echo "=== SWITCH TO NON-REP ==="
# Run Step 4 (open combobox 12)
sleep 1
# Run Step 5 (select "Non-REP")
sleep 3
# Run Step 2 (capture metrics) → compare

echo "=== SWITCH TO REP + GROUPED ==="
# Run Step 4 (open combobox 12)
sleep 1
# Run Step 5 (select "REP", change match text)
sleep 1
# Run Step 6 (toggle grouping election checkbox)
sleep 3
# Run Step 2 (capture metrics) → compare
```

### Expected results (WA investor, Trace 260303 65M, as of 2026-03-24)

*Updated post-IMPL-134: OZ double-count fix reduced MOIC/IRR for OZ tracks. Non-OZ baseline added.*

| Metric | WA REP (ungrouped) | WA Non-REP | WA REP + Grouped | Non-OZ (REP Ungrouped) |
|---|---|---|---|---|
| Profile Label | WA REP | WA Non-REP | WA REP | WA REP |
| Effective Rate | 40.8% | 40.8% | 37% | 40.8% |
| MOIC | 3.32x | 3.32x | 3.24x | 2.56x |
| IRR | 22.20% | 22.20% | 21.12% | 20.05% |
| Year 1 Tax Savings | $5.48M | $5.48M | $4.97M | $5.48M |
| Depreciation Benefits | $13.37M (0.83x) | $13.37M (0.83x) | $12.12M (0.76x) | $13.37M (0.83x) |
| OZ Benefits | $9.41M (0.59x) | $9.41M (0.59x) | $9.41M (0.59x) | — |
| Exit Proceeds | $15.26M (0.95x) | $15.26M (0.95x) | $15.26M (0.95x) | $15.26M (0.95x) |

**Key observations:**
- REP ungrouped → Non-REP: same rate (40.8%), same numbers, but label must change. This catches stale useMemo cache.
- REP grouped → Non-REP: rate drops 37% → 40.8%. Depreciation increases ~9.3% (40.8/37 ratio). MOIC/IRR increase.
- OZ Benefits and Exit Proceeds are rate-independent — they should NOT change.
- IMPL-134: OZ MOIC reduced ~13% (3.83x → 3.32x) due to removal of double-counted ozRecaptureAvoided + ozExitAppreciation from returns. OZ Benefits display values preserved ($9.41M) — only the summation into totalReturns/IRR was corrected.
- Non-OZ baseline (2.56x / 20.05%) confirms exit tax subtraction path is unaffected.

---

## What to Report

For each state, report these values from the KPI strip and Returns Buildup:

| Field | Source |
|---|---|
| Profile Label | "WA REP" or "WA Non-REP" in sticky header |
| MOIC | `X.XXx` in collapsed bar or "Total Multiple" row |
| IRR | `XX.XX%` in collapsed bar or "IRR" row |
| Year 1 Tax Savings | `$X.XXM` in KPI strip |
| Depreciation Benefits | `$X.XXM (X.XXx)` in Returns Buildup |
| OZ Benefits | `$X.XXM (X.XXx)` in Returns Buildup |
| Exit Proceeds | `$X.XXM (X.XXx)` in Returns Buildup |

**"Tests pass" is not sufficient.** Report the actual rendered values for each state and confirm the deltas match expectations.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Executing JavaScript through AppleScript is turned off` | Chrome → View → Developer → Allow JavaScript from Apple Events |
| `missing value` returned | The JS returned `undefined`. Wrap in IIFE and add explicit `return`. |
| `NO TAB` or tab not found | Open `http://localhost:5173` in Chrome (not Safari/Arc). |
| `NO TOKEN` | Log in to the app in Chrome via Google OAuth. |
| API returns 403 | Token expired. Log in again in Chrome, re-extract with auth check. |
| Combobox index shifted | Re-run Step 3 to find the current index. Layout changes shift indices. |
| Dropdown opens but `"not found in 0 options"` | Radix portal didn't mount. Use the keyboard approach (Step 4a) — `ArrowDown` forces synchronous popover. Never rely on `click()` alone. |
| Values don't change after switch | The bug you're testing for — check useMemo dependency arrays. |
| Checkbox index shifted | Re-run Step 6 (list checkboxes) to find the current index. REP-only checkboxes appear/disappear on track switch. |
| `sleep` not long enough | Increase to `sleep 5`. Complex deals with LIHTC/OZ take longer to recalculate. |
