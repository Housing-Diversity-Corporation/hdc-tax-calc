# HDC Platform — UI Navigation Map

**Location:** `frontend/docs/UI_NAVIGATION_MAP.md`
**Purpose:** Living reference for CC runtime UI verification via AppleScript/osascript.
**Last updated:** 2026-04-06 (IMPL-154: passive character split verification recipe)

---

## App Architecture

- **No URL routing** — the app uses React state (`currentView`) for all navigation. Every page is at `localhost:5173/`.
- **Auth:** Google OAuth via `authToken` in localStorage (NOT `token`).
- **Chrome window:** The app may move between Chrome windows. Always find the correct tab first:
  ```applescript
  repeat with i from 1 to (count of windows)
    repeat with j from 1 to (count of tabs of window i)
      if URL of tab j of window i contains "localhost:5173" then ...
  ```
- **AppleScript JS from Apple Events:** Must be enabled in Chrome: View → Developer → Allow JavaScript from Apple Events. Gets disabled on Chrome restart.
- **Reusable verification harness:** Source `frontend/scripts/ui-verify.sh` at the start of any runtime verification session. Provides `ui_ensure_fund_detail`, `ui_run_js`, `ui_check_panels`, `ui_select_profile`, `ui_check_text`, `ui_reload`, etc. Always use the harness — do not reinvent AppleScript snippets from scratch.

---

## View Map

| `currentView` | Component | Description |
|---|---|---|
| `calculator` | HDCCalculatorMain | Screen 1 — main calculator (default after login) |
| `tax-profile` | InvestorTaxProfilePage | Screen 3 — investor tax profile form |
| `investments` | AvailableInvestments | Deal/pool listing page |
| `investor-analysis` | InvestorAnalysis | Per-deal analysis (click a deal) |
| `fund-detail` | FundDetail | Pooled fund analysis (click a pool) — **requires pool in DB** |

---

## Navigation Patterns

### Navbar dropdown (OZ Benefits menu)
```applescript
tell tab 1 of window N
  execute javascript "document.querySelector('.navbar-center button').click();"
end tell
delay 1
tell tab 1 of window N
  -- items[0]=OZ Benefits, items[1]=Tax Benefits Calculator, items[2]=Available Investments
  execute javascript "var items = Array.from(document.querySelectorAll('[data-radix-collection-item]')); items[2].click();"
end tell
```

### Profile menu (avatar popover)
```applescript
tell tab 1 of window N
  execute javascript "document.querySelector('.navbar-right button').dispatchEvent(new MouseEvent('mouseenter', {bubbles:true})); document.querySelector('.navbar-right button').click();"
end tell
delay 1
tell tab 1 of window N
  execute javascript "var pop = document.querySelector('[data-radix-popper-content-wrapper]'); var btn = Array.from(pop.querySelectorAll('button')).find(function(b){return b.innerText.indexOf('Tax Profile')>-1}); btn.click();"
end tell
```

### View Fund Details (on investments page)
```applescript
execute javascript "var vfd = Array.from(document.querySelectorAll('*')).find(function(e){return e.innerText === 'View Fund Details' && e.children.length === 0}); if(vfd) vfd.click();"
```

---

## Key Selectors

| Element | Selector | Notes |
|---|---|---|
| Navbar center button | `.navbar-center button` | Opens OZ Benefits dropdown |
| Nav dropdown items | `[data-radix-collection-item]` | Index 0=OZ, 1=Calculator, 2=Investments |
| Profile avatar | `.navbar-right button` | Hover to open popover |
| Profile popover | `[data-radix-popper-content-wrapper]` | Contains Account, Tax Profile, Settings |
| IRA balance input | `#ira-balance` | Screen 3 Step 0 |
| Grouping election | `#grouping-election` | Checkbox, Screen 3 Step 1 |
| AMT exposure checkbox | `#amt-exposure` | Checkbox, Screen 3 — `InvestorTaxProfilePage.tsx:835-846`. Inside `div.space-y-2.p-3.border.rounded-md.bg-muted/30`. Label: "This investor has material AMT exposure from non-HDC sources". Visible for all investor tracks. (IMPL-157) |
| Update Profile btn | Button with text `Update Profile` | Screen 3 save |
| View Fund Details | Badge with exact text `View Fund Details` | Investments page, inside pool card |

---

## Screen 3 Section Map (InvestorTaxProfilePage)

Screen 3 is a long scrolling form with no URL anchors or tab navigation. All fields render top-to-bottom in a single scroll container. Locate fields by their `id` selector and use `scrollIntoView()`.

| Section | Known Selectors | Approximate Position |
|---|---|---|
| IRA balance | `#ira-balance` | Top of form (Step 0) |
| Investor track / grouping | `#grouping-election` | Mid-form (Step 1) |
| AMT exposure | `#amt-exposure` | Near bottom of form, inside bordered muted box |
| Save button | Button with text `Update Profile` | Bottom of form |

**Scroll strategy:** No programmatic scroll anchors exist. To reach a specific field via AppleScript:
```javascript
document.querySelector('#amt-exposure').scrollIntoView({block: 'center'});
```

**Note:** New selectors added to Screen 3 should be documented here with their `id` and approximate form position.

---

## React Input Limitation

**AppleScript CANNOT reliably set React controlled input values.** The native value setter + `input` event pattern does NOT trigger React's synthetic onChange in React 18. Workarounds:
- Use DB updates directly for setting profile values
- Radix UI select/combobox `.click()` on `[role="option"]` DOES work
- Checkbox `.click()` works for toggling state but may not persist through save

---

## Panel Detection Patterns

```applescript
execute javascript "
  var text = document.body.innerText;
  JSON.stringify({
    hasSizing: text.indexOf('Investment Sizing') > -1,
    hasFit: text.indexOf('Investor Fit') > -1,
    hasOptEff: text.indexOf('Optimal (Efficiency)') > -1,
    has461REP: text.indexOf('461(l) REP') > -1,
    hasIRAPanel: text.indexOf('IRA Conversion Opportunity') > -1,
    hasNonpassive: text.indexOf('Nonpassive') > -1,
    hasPassive: text.indexOf('Passive') > -1,
    hasTaxUtil: text.indexOf('Tax Utilization') > -1,
    hasAmtNote: text.indexOf('AMT Exposure Note') > -1
  });
"
```

**AMT advisor note (IMPL-157):** `hasAmtNote` detects the amber advisory box in `SizingOptimizerPanel.tsx:417-431`. Renders when `hasMaterialAmtExposure === true` (prop from FundDetail → SizingOptimizerPanel). Located below the utilization-adjusted IRR display, above the Lifetime Coverage section. Contains §38(c)(4)(B)(iii) exemption language. The note is informational only — it does not affect sizing metrics.

---

## Database Tables

| Table | Purpose | API path |
|---|---|---|
| `tax_benefits.investor_tax_info` | Investor portal profiles | `/api/investor/tax-info` |
| `tax_benefits.input_investor_profile` | Calculator profiles (deal-conduit) | N/A (internal) |
| `tax_benefits.investment_pools` | Fund pools | `/api/pools` |
| `tax_benefits.pool_memberships` | Pool ↔ deal links | N/A (via pool API) |
| `tax_benefits.deal_benefit_profiles` | DBP snapshots | `/api/deal-benefit-profiles` |

**Critical:** `investor_tax_info` and `input_investor_profile` are DIFFERENT tables with different schemas. The investor portal reads from `investor_tax_info`. The calculator reads from `input_investor_profile`.

---

## Prerequisites for FundDetail (Screen 2)

1. At least one row in `investment_pools` with `status='active'`
2. At least one `pool_memberships` row linking a `deal_benefit_profiles` record
3. An investor profile in `investor_tax_info` (loaded automatically)

Without a pool, FundDetail cannot render. The "View Fund Details" button only appears on the investments page when pools exist.

---

## Known Issues

| Issue | Workaround |
|---|---|
| DBP units | All dollar fields in `deal_benefit_profiles` are stored in millions. `aggregatePoolToBenefitStream()` in `poolAggregation.ts` converts to dollars (×1M). Any new code reading DBP values must go through this layer. Fixed in IMPL-148. |
| Page reload goes to calculator (default view) | Must re-navigate via navbar |
| Chrome window/tab may shift between sessions | Always find tab by URL first |
| `authToken` (not `token`) in localStorage | Use `localStorage.getItem('authToken')` |
| Profile name doesn't update when DB fields change | Name is a separate column |
| Chrome blocks programmatic downloads | `doc.save()`, `window.open()`, and anchor-click download triggers are silently suppressed when executed from AppleScript's JavaScript evaluation context. This is a Chrome security restriction on non-user-gesture script, not a code bug. Workaround: verify PDF generation runs without errors via `import()` + function call in console, and confirm the download mechanism matches existing working exports (e.g., Screen 3 reports use the same `jspdf doc.save()` pattern). Real user clicks trigger downloads correctly. Do not spend time debugging "broken downloads" in AppleScript — they cannot be verified this way. |

---

## Download Verification Protocol

**Downloads cannot be verified via AppleScript.** For any IMPL that involves file downloads (PDF, Excel, CSV), runtime verification should confirm:

1. The generation function executes without errors (use Vite dynamic `import()` to call it directly — do NOT rely on button clicks triggering downloads)
2. The download mechanism matches an existing working export in the codebase
3. Note in the runtime verification report: "Download verified by code equivalence to [existing export]"

---

## Export Buttons

### Screen 2 Export (IMPL-151)
- Button label: "Export Summary"
- Render condition: `sizingResult && investorSizingResult` (requires active investor profile with completed sizing)
- Absent when no profile active or sizing not yet computed
- Component: shadcn `Button` in FundDetail profile selector row
- Trigger: `exportWealthManagerSummary()` from `frontend/src/utils/exportWealthManagerSummary.ts`
- Output: one-page portrait PDF, auto-downloads via `doc.save(filename)`
- NOTE: Cannot be verified via AppleScript download check — see Known Issues

### Screen 3 Exports (pre-existing)
- 3 PDF reports (`HDCProfessionalReport`, `HDCComprehensiveReport`, `HDCTaxReportJsPDF`) + 1 Excel export (`ExportAuditButton`)
- All use same jsPDF `doc.save()` / XLSX pattern
- Located in `frontend/src/components/taxbenefits/reports/`
- Confirmed working for real user clicks

---

## Per-IMPL Verification Recipes

Step-by-step runtime verification sequences for specific IMPLs. Each recipe lists the exact navigation path, what to check, and expected behavior.

### IMPL-157 — hasMaterialAmtExposure flag

**Screen 3 (checkbox):**
1. Navigate: Profile avatar popover → "Tax Profile" (or use direct injection — see RUNTIME_UI_VERIFICATION.md §Direct View Navigation)
2. Scroll to bottom of form → locate `#amt-exposure` checkbox inside bordered muted box
3. Toggle ON → confirm label reads "This investor has material AMT exposure from non-HDC sources"
4. Click "Update Profile" to persist (note: requires backend column — if column doesn't exist yet, field won't round-trip)

**Screen 2 (advisor note):**
1. Navigate: OZ Benefits dropdown → Available Investments → click "View Fund Details" on a pool card
2. Scroll to Investment Sizing panel (SizingOptimizerPanel)
3. With `hasMaterialAmtExposure === true`: confirm amber box appears below utilization-adjusted IRR, above Lifetime Coverage
4. Verify note text includes "§38(c)(4)(B)(iii) specifically exempts credits"
5. With `hasMaterialAmtExposure === false`: confirm amber box is absent
6. **Sizing metrics (MOIC, IRR, Year 1 Tax Reduction) must be identical in both states** — the flag is informational only

**Panel detection check:**
```javascript
document.body.innerText.indexOf('AMT Exposure Note') > -1  // true when note visible
```

### IMPL-154 — Passive Income Character Split (engine-only)

**No new UI elements in this IMPL.** Screen 3 fields for `annualPassiveOrdinaryIncome` / `annualPassiveLTCGIncome` ship in IMPL-155.

**Engine verification (unit tests):**
- 8 tests in `impl-154-passive-character-split.test.ts` verify all 5 spec scenarios
- Backward compat: character fields = 0 → legacy proportional allocation → identical output

**Runtime backward-compat check (Screen 2):**
1. Navigate: OZ Benefits dropdown → Available Investments → "View Fund Details"
2. Select any passive investor profile (e.g., "NJ 750-2700-1000 N-REP STPG")
3. Confirm Sizing panel renders: Year 1 Tax Reduction, Util-Adjusted IRR, Overall Utilization
4. Values must be identical to pre-IMPL-154 baseline — no change for profiles without character-split fields

**Future runtime verification (after IMPL-155):**
1. On Screen 3, set `annualPassiveLTCGIncome` > 0 for a profile
2. Navigate to Screen 2 → Sizing panel
3. Confirm effectivePassiveRate < 40.8% and §469 ceiling is lower than fully-ordinary baseline
