# Capital Stack Standards

**Version:** 1.0
**Date:** 2026-01-24
**Status:** Active
**Session:** ISS-025 through ISS-038b

---

## 1. Unit Convention

All dollar values are stored internally as **millions ($M)**.

| Location | Unit | Example |
|----------|------|---------|
| State (useHDCState.ts) | $M | `projectCost = 100` means $100M |
| Calculations (calculations.ts) | $M | All arithmetic in millions |
| Export (inputsSheet.ts) | $M | Labels include "($M)" |
| UI Display | $M | Format via `formatCurrency()` |

**Why This Matters:**
- Prevents off-by-1M errors from unit confusion
- Simpler arithmetic (no dividing by 1,000,000)
- Consistent display across UI and exports

**Common Mistake:**
```typescript
// WRONG: Dividing by 1M when already in $M
eligibleBasis / 1000000  // Double-divided!

// CORRECT: Already in millions
eligibleBasis  // Use directly
```

**Reference:** ISS-027, ISS-028

---

## 2. PAB-Senior Debt Coordination

When Private Activity Bonds (PAB) are enabled, they replace conventional Senior Debt while maintaining the user's total must-pay leverage target.

**State Variables:**
- `mustPayDebtTarget` — User's intended Senior + PAB combined leverage (%)
- `seniorDebtPct` — Actual Senior Debt (adjusts when PAB changes)
- `pabFundingAmount` — PAB amount in $M (from eligible basis calc)
- `pabPctOfProject` — PAB as % of project cost (derived)

**Coordination Logic:**

| Event | Action |
|-------|--------|
| PAB enabled | Store `seniorDebtPct` as `mustPayDebtTarget`; reduce Senior by PAB% |
| PAB % changes | Adjust Senior: `mustPayDebtTarget - pabPct` |
| PAB disabled | Restore Senior to `mustPayDebtTarget` |
| User changes Senior (PAB off) | Update `mustPayDebtTarget` to match |

**Example:**
```
Initial: Senior = 65%, PAB = disabled
User enables PAB at 30% of eligible basis → PAB = 21.4% of project
Result: Senior = 43.6%, PAB = 21.4%, Total Must-Pay = 65%
```

**Why This Matters:**
- PABs are pari passu with Senior (same priority)
- Total must-pay leverage should stay constant
- Equity shouldn't change just because funding source changed

**Reference:** ISS-032

---

## 3. DSCR Breakdown Definitions

Two distinct DSCR metrics when Phil Current Pay or PAB is enabled:

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Must-Pay DSCR** | NOI / (Senior DS + PAB DS) | True hard floor (lender covenant) |
| **Phil DSCR** | NOI / (Senior DS + PAB DS + Phil Current Pay) | Includes soft-pay (Amazon 1.05x) |

**Relationship:**
- Must-Pay DSCR ≥ Phil DSCR (always)
- When Phil Current Pay = 0: Must-Pay DSCR = Phil DSCR
- Year 1 may show equal values if current pay starts Year 2+

**Display Rules:**
- Show breakdown only when `pabEnabled || philCurrentPayEnabled`
- Operating_CF sheet: 3 columns (Must-Pay DS, Must-Pay DSCR, Phil DSCR)
- Summary sheet: Min Must-Pay DSCR with note "(Senior + PAB only)"

**Reference:** IMPL-081, ISS-037, ISS-038b

---

## 4. Export Prop Drilling Pattern

New parameters must flow through the complete prop chain to reach the export:

```
useHDCState.ts → HDCCalculatorMain.tsx → HDCResultsComponent.tsx → ExportAuditButton.tsx → export sheets
```

**Checklist for New Export Params:**

1. **useHDCState.ts** — Define state and return from hook
2. **HDCCalculatorMain.tsx** — Destructure from hook, pass to HDCResultsComponent
3. **HDCResultsComponent.tsx** — Add to props interface, include in exportParams object
4. **inputsSheet.ts** (or relevant sheet) — Add row to export

**Common Failure Mode:**
- Param defined in useHDCState ✓
- Passed to HDCInputsComponent ✓
- NOT passed to HDCResultsComponent ✗ ← **BREAKS EXPORT**

**Debugging:**
If export shows `0` or missing value:
1. Console.log at each prop drilling point
2. Check HDCResultsComponent props interface
3. Verify ExportAuditButton params object

**Reference:** ISS-030, ISS-034, ISS-035

---

## History

| Date | Change | Reference |
|------|--------|-----------|
| 2026-01-24 | Initial creation | Session ISS-025 through ISS-038b |
