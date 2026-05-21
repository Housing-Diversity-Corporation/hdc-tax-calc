# HDC Composable Capital Sources — Architecture Spec
## v1.2 | May 2026
## Status: Design — Not yet implemented

---

## OVERVIEW

Replace the existing fixed-field capital structure
(~15 named percentage/dollar inputs) with a composable
`CapitalSource` object of which N can be added per deal.

**Core design principle:**
`sourceType` is a display label and default-setter only.
Engine behavior is driven exclusively by flags.
Adding a new source sub-type = adding a UI template
that pre-sets flags. No engine code change required.

**Safety principle:**
Old fixed-field path preserved and run in parallel
during migration. New source-based path must produce
identical outputs before old path is deprecated.

---

## THE CAPITAL SOURCE OBJECT

```typescript
type RateType =
  | 'fixed'        // standard amortizing debt
  | 'floating'     // index + spread
  | 'zero'         // grants, equity, deferred fees
  | 'pik_full'     // 100% PIK — all interest accrues
  | 'pik_partial'  // split: currentPayPct current,
                   // remainder accrues

type CapitalSource = {
  // ── Identity ──────────────────────────────────────
  id: string           // UI key (uuid or index)
  label: string        // "HDC 1st Mortgage",
                       // "Mets Contribution", etc.
  sourceType: string   // display convention only —
                       // not a dispatch key.
                       // Suggested values (open, not
                       // enforced by engine):
                       // 'senior_debt' | 'soft_debt' |
                       // 'pab' | 'lp_equity' | 'grant' |
                       // 'deferred_dev_fee' | 'pik_debt' |
                       // 'accrued_interest' | 'cdfi_loan' |
                       // 'home_soft' | 'htf_soft' |
                       // 'state_soft' | 'seller_carryback' |
                       // 'sponsor_note' | 'other'

  // ── Amount ────────────────────────────────────────
  amount: number            // dollar amount (always)
  amountBasis:
    | 'dollars'             // direct dollar input
    | 'pct_project_cost'    // % × effectiveProjectCost
    | 'pct_eligible_basis'  // % × lihtcEligibleBasis
                            // (for PAB)
  amountPct?: number        // if pct_project_cost or
                            // pct_eligible_basis

  // ── Rate / Payment structure ─────────────────────
  rate: number              // total annual interest rate
                            // 0 for grants, equity, DDF

  // Payment breakdown — must sum to 100%
  // These three flags fully describe payment behavior.
  // rateType is a UI convenience only (sets defaults).

  hardPayPct: number
  // % of annual interest that is HARD current pay.
  // Included in DSCR. Non-payment = default.
  // Senior debt: 100%. Soft debt: typically 0%.

  softPayPct: number
  // % of annual interest that is SOFT current pay.
  // NOT included in DSCR.
  // Paid from operating cash flow if available.
  // If insufficient cash → automatically accrues.
  // No default event triggered.
  // HPD 3rd mortgage: ~2.5%. HDC 2nd: ~12.5%.

  pikPct: number
  // % of annual interest that always accrues as PIK.
  // Never paid currently — adds to balance each period.
  // Remaining after hard + soft pay.

  // Constraint: hardPayPct + softPayPct + pikPct = 100

  amortYears?: number       // applies to hard pay only
  ioPeriodYears?: number    // IO before amortization

  // ── Engine behavior flags ─────────────────────────
  // These are the ONLY things the engine dispatches on.
  // sourceType is ignored by the engine.

  isEquity: boolean
  // True: MOIC denominator. No debt service.
  // No repayment at exit. Not in DSCR.
  // Examples: LP equity, phil equity

  isGrant: boolean
  // True: no repayment ever. No interest.
  // Included in sources display only.
  // Examples: Mets contribution, Amazon HEF

  dscrIncluded: boolean
  // True: source's annual debt service included
  // in DSCR numerator. Hard debt only.
  // Examples: senior mortgage, PAB

  forgivenessEnabled: boolean
  // True: excluded from exit debt payoff calculation.
  // Forgiven at end of regulatory period.
  // Examples: HPD 3rd mortgage, HDC 2nd mortgage

  forgivenessTriggerType?: string
  // 'silent_expected' | 'regulatory' | 'not_applicable'

  affectsEligibleBasis: boolean
  // True: this source may trigger §42(d)(5)
  // eligible basis exclusion. Applies to federal
  // funding sources (HOME, HTF).
  // Requires counsel confirmation.

  autoAccrueIfInsufficientCashFlow: boolean
  // Derived — true when softPayPct > 0.
  // Not stored explicitly. Any source with softPayPct > 0
  // automatically accrues the unpaid soft portion
  // when operating cash flow is insufficient.
  // No separate flag needed.

  // ── Waterfall / Priority ──────────────────────────
  waterfallPriority: number
  // Exit waterfall tier. Lower = more senior.
  // 1 = senior debt (first out)
  // 2 = PAB
  // 3 = HDC sub / soft debt
  // 4 = deferred dev fee
  // 5 = investor sub
  // 6 = preferred return
  // 7 = promote
  // 8 = LP distribution

  cashSweepPriority?: number
  // Operating cash flow sweep order.
  // Only relevant for sources that get current pay
  // from operations. Lower = paid first.

  // ── Sources & Uses display ────────────────────────
  includeIn100PctSum: boolean
  // True: included in the sources-uses balance check.
  // False for items the engine derives (e.g.
  // interest reserve — computed, not entered).
}
```

---

## HOW THE ENGINE USES FLAGS (NOT SOURCEYPE)

### Interest accrual loop (currently: named PIK vars)

```typescript
// OLD (fixed named variables):
hdcPikBalance += hdcPikBalance * hdcSubDebtPikRate;
investorPikBalance += investorPikBalance * investorSubDebtPikRate;
// ... repeat for each named debt type

// NEW (composable loop):
for (const source of capitalSources) {
  if (source.rate === 0) continue; // grants, equity, DDF

  const annualInterest = source.balance * source.rate;
  const hardPayDue  = annualInterest * (source.hardPayPct / 100);
  const softPayDue  = annualInterest * (source.softPayPct / 100);
  const pikDue      = annualInterest * (source.pikPct / 100);

  // Hard pay — deducted from operating CF (DSCR-counted)
  operatingCF -= hardPayDue;

  // Soft pay — paid if cash available, else accrues
  const softPayMade = Math.min(softPayDue, availableSoftPayCash);
  const softPayShortfall = softPayDue - softPayMade;
  operatingCF -= softPayMade;
  source.balance += softPayShortfall; // auto-accrues shortfall

  // PIK — always accrues
  source.balance += pikDue;
}
```

Same math as today. Explicit payment hierarchy.

### DSCR calculation (currently: hardcoded senior + PAB)

```typescript
// OLD:
const annualDebtService = seniorDebtService + pabDebtService;

// NEW — only hard pay counts:
const annualDebtService = capitalSources
  .reduce((sum, s) =>
    sum + (s.balance * s.rate * (s.hardPayPct / 100)), 0);
```

### Exit waterfall (currently: tier-by-tier hardcoded)

```typescript
// OLD:
remaining -= remainingSeniorDebt;
remaining -= remainingPhilDebt;  // unless forgiven
// ... etc

// NEW:
const sorted = capitalSources
  .filter(s => !s.isEquity && !s.isGrant)
  .filter(s => !s.forgivenessEnabled)
  .sort((a, b) => a.waterfallPriority - b.waterfallPriority);

for (const source of sorted) {
  remaining = Math.max(0, remaining - source.balance);
}
```

### 100%-sum check (currently: manual sum of percentages)

```typescript
// OLD: explicit sum of 9 percentages + manual grant %

// NEW: automatic
const totalDollar = capitalSources
  .filter(s => s.includeIn100PctSum)
  .reduce((sum, s) => sum + s.amount, 0);
const balanced = Math.abs(totalDollar - effectiveProjectCost) < 1000;
```

---

## SOURCE TYPE TEMPLATES (UI DEFAULTS)

When a user adds a new source and picks a type,
the UI pre-fills the flags. User can override any flag.

| sourceType | isEquity | isGrant | dscrIncluded | forgivenessEnabled | rateType | affectsEligBasis |
|---|---|---|---|---|---|---|
| senior_debt | false | false | true | false | fixed | false |
| soft_debt | false | false | false | true | pik_partial | false |
| pab | false | false | true | false | fixed | false |
| lp_equity | true | false | false | false | zero | false |
| grant | false | true | false | false | zero | false |
| deferred_dev_fee | false | false | false | false | zero | false |
| pik_debt | false | false | false | false | pik_full | false |
| accrued_interest | false | true | false | false | zero | false |
| home_soft | false | false | false | true | pik_partial | true |
| htf_soft | false | false | false | true | pik_partial | true |
| cdfi_loan | false | false | false | false | fixed | false |
| state_soft | false | false | false | true | pik_partial | false |
| seller_carryback | false | false | true | false | fixed | false |

User can always override any flag. sourceType is just
a starting point.

---

## MIGRATION STRATEGY — NO BROKEN CALCULATIONS

This is the key to not disrupting the program.

### Phase 1 — Parallel implementation (no user-facing change)

1. Write `legacyToSources(params): CapitalSource[]`
   Converts all existing fixed fields to an equivalent
   source array. Examples:

   ```typescript
   // seniorDebt → CapitalSource
   if (params.seniorDebtPct > 0) sources.push({
     label: 'Senior Debt',
     sourceType: 'senior_debt',
     amountBasis: 'pct_project_cost',
     amountPct: params.seniorDebtPct,
     amount: params.seniorDebtPct/100 * effectiveProjectCost,
     rateType: 'fixed',
     rate: params.seniorDebtRate,
     amortYears: params.seniorDebtAmortYears,
     dscrIncluded: true,
     forgivenessEnabled: false,
     isEquity: false,
     isGrant: false,
     waterfallPriority: 1,
     includeIn100PctSum: true,
     // ... other flags
   });
   ```

2. Write `calculateWithSources(sources, otherParams)`
   New engine function using the composable loop.

3. Run BOTH in every test:
   ```typescript
   const legacyResult = calculateLegacy(params);
   const sources = legacyToSources(params);
   const sourceResult = calculateWithSources(sources, params);

   // Must match within $1 tolerance
   expect(sourceResult.lpIRR).toBeCloseTo(legacyResult.lpIRR, 4);
   expect(sourceResult.moic).toBeCloseTo(legacyResult.moic, 4);
   // ... every output field
   ```

4. Run against ALL existing validation scenarios
   (VALIDATION_SCENARIOS.md). Pass rate must be 100%.

5. No user-facing change yet. Users still see the
   old fixed-field UI.

### Phase 2 — UI migration (composable inputs)

Only begins after Phase 1 passes 100%.

1. Replace fixed capital structure panel with
   dynamic source list.
2. On save: store `capitalSources[]` (new format).
3. On load old config: run `legacyToSources()` to
   convert automatically. User sees their existing
   deal in the new format.
4. Old fixed fields become read-only legacy (kept
   for 1 release, then removed).

### Phase 3 — Deprecate legacy path

After Phase 2 ships and is validated:
1. Remove old fixed-field inputs from UI.
2. Remove legacy engine path.
3. Remove `legacyToSources()` migration function.

---

## QUEENSWOOD SOURCES (after migration)

What Queenswood looks like in the new model:

```
Source 1: HDC 1st Mortgage Perm
  sourceType: senior_debt
  amount: $31,435,000
  rate: 6.40%
  hardPayPct: 100  softPayPct: 0  pikPct: 0
  amortYears: 35
  dscrIncluded: true
  forgivenessEnabled: false
  waterfallPriority: 1

Source 2: HDC 2nd Mortgage
  sourceType: soft_debt
  amount: $20,000,000
  rate: 4.72%
  hardPayPct: 0   softPayPct: 12.5   pikPct: 87.5
  dscrIncluded: false
  forgivenessEnabled: true
  forgivenessTriggerType: silent_expected
  waterfallPriority: 3

Source 3: HPD 3rd Mortgage
  sourceType: home_soft (or htf_soft — pending Megan Riess)
  amount: $98,613,137
  rate: 4.72%
  hardPayPct: 0   softPayPct: 2.5   pikPct: 97.5
  dscrIncluded: false
  forgivenessEnabled: true
  forgivenessTriggerType: silent_expected
  affectsEligibleBasis: true  — pending counsel
  waterfallPriority: 3

Source 4: LP Equity (LIHTC)
  sourceType: lp_equity
  amount: $117,835,505
  rate: 0
  hardPayPct: 0  softPayPct: 0  pikPct: 0
  isEquity: true
  waterfallPriority: 8

Source 5: Mets Contribution
  sourceType: grant
  label: Mets Contribution
  amount: $5,000,000
  rate: 0
  hardPayPct: 0  softPayPct: 0  pikPct: 0
  isGrant: true

Source 6: Deferred Developer Fee
  sourceType: deferred_dev_fee
  amount: $9,978,379
  rate: 0
  hardPayPct: 0  softPayPct: 0  pikPct: 0
  cashSweepPriority: 4
  waterfallPriority: 4

Source 7: Capitalized Accrued Interest
  sourceType: accrued_interest
  amount: $21,594,160
  rate: 0
  hardPayPct: 0  softPayPct: 0  pikPct: 0
  isGrant: true
  includeIn100PctSum: true
```

Sum = $304,456,181 = 100% of project cost. ✓

DSCR includes only Source 1 (hardPayPct = 100%).
Sources 2 and 3 soft pay auto-accrues when
operating CF is insufficient.
Sources 2 and 3 forgiven at exit — excluded from
exit waterfall debt payoff.

---

## IMPL SEQUENCE

| IMPL | Scope | Risk | Duration |
|---|---|---|---|
| IMPL-A | CapitalSource type definition + `legacyToSources()` migration function | Zero — no engine change | 1 day |
| IMPL-B | `calculateWithSources()` engine function + parallel validation suite | Medium — new engine path, validated against legacy | 2-3 days |
| IMPL-C | UI: dynamic source list replacing fixed inputs | Low — display only, engine unchanged | 2 days |
| IMPL-D | Saved config migration: load old → convert to sources | Low | 1 day |
| IMPL-E | Excel/PDF export: dynamic source rows | Low | 1 day |
| IMPL-F | Deprecate legacy path after 100% validation | Low after B passes | 1 day |

**Total: ~9 days. No calculation changes until Phase 1**
**(IMPL-B) passes 100% parallel validation.**

---

## RELATIONSHIP TO IMPL-188 AND IMPL-189

With this architecture:
- IMPL-188 (grant field) is replaced by Source type = 'grant'
- IMPL-189 (DDF + accrued interest fields) is replaced by
  Source types 'deferred_dev_fee' and 'accrued_interest'

**Recommendation:** ship IMPL-187c1 now (standalone bug fix).
Hold IMPL-188 and IMPL-189. Build composable sources instead.
Queenswood gets all 7 sources modeled correctly once
IMPL-C (dynamic UI) ships.

---

## RESOLVED DESIGN DECISIONS

All three open questions are closed.

**Q1 — Amount entry: percentage or dollars?**
Support both. Each source declares amountBasis:
- `'pct_project_cost'` — existing behavior for debt
  and equity. User enters %, dollar computed.
  Recomputes automatically when project cost changes.
- `'dollars'` — grants, DDF, accrued interest.
  Fixed amounts unaffected by project cost changes.
- `'pct_eligible_basis'` — PAB only.
Both work in the 100%-sum check.

**Q2 — autoAccrueIfInsufficientCashFlow behavior?**
Resolved by payment structure redesign. Flag removed.
Any source with `softPayPct > 0` automatically
accrues the unpaid soft portion when operating CF
is insufficient. Implicit, not stored.

**Q3 — Waterfall priority: free integer or constrained?**
Free integer. Constrained tiers assume every deal
fits the same structure — real deals don't. CDFI mezz,
co-equal soft debt, split equity all require flexibility.

Two sources at the same priority = pro-rata
distribution at that tier (e.g. HDC 2nd and HPD 3rd
both at priority 3 on Queenswood).

UI mitigation: visual waterfall preview — a sorted
list of sources by waterfallPriority showing the
exact exit distribution order. User sees the waterfall
before saving. Prevents ordering errors without
constraining deal structure.

---

*HDC Composable Capital Sources Spec v1.2 | May 2026*
*Internal — proprietary trade secret*
