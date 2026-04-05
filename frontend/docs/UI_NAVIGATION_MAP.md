# HDC Platform — UI Navigation Map

**Location:** `frontend/docs/UI_NAVIGATION_MAP.md`
**Purpose:** Living reference for CC runtime UI verification via AppleScript/osascript.
**Last updated:** 2026-04-04 (IMPL-145/146/147 session)

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
| Update Profile btn | Button with text `Update Profile` | Screen 3 save |
| View Fund Details | Badge with exact text `View Fund Details` | Investments page, inside pool card |

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
    hasTaxUtil: text.indexOf('Tax Utilization') > -1
  });
"
```

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
