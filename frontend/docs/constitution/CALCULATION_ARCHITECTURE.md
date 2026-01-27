# Calculation Architecture

**Version:** 1.0
**Date:** 2026-01-18
**Status:** Active

---

## Single Source of Truth

All financial calculations must occur in the core engine (`calculations.ts` and related calculation files in `utils/taxbenefits/`).

**Hooks and UI components must never perform financial math** — they consume and display values only.

---

## Why This Matters

- Single source of truth prevents divergent results
- One place to audit, test, and validate
- Institutional credibility requires traceable calculations
- Prevents bugs like IMPL-057 (duplicate calculation producing different result)

---

## Architecture Pattern

```
calculations.ts → useHDCCalculations.ts → Component.tsx
↑                    ↑                    ↑
MATH HERE          PASS VALUES          DISPLAY ONLY
```

---

## Layer Responsibilities

| Layer | Location | Responsibility | Math Allowed? |
|-------|----------|----------------|---------------|
| **Core Engine** | `utils/taxbenefits/calculations.ts` | All financial calculations | Yes |
| **Supporting Calculators** | `utils/taxbenefits/*.ts` | Specialized calculations (depreciation, LIHTC, etc.) | Yes |
| **Hooks** | `hooks/useHDC*.ts` | Pass values from engine to components | No |
| **Components** | `components/taxbenefits/*` | Display and format values | No |

---

## Calculation Accuracy Standard

The platform must reflect **actual tax rules, IRS regulations, and statutory provisions** — never guessed or assumed values.

**Examples:**
- OZ step-up: IRC §1400Z-2 as amended by OBBBA (10% standard, 30% rural)
- LIHTC: IRC §42 (11-year credit period)
- MACRS: IRS Publication 946 depreciation tables
- State conformity: Verified state-by-state data

**When Uncertain:**
- Flag for verification rather than assume
- Reference authoritative sources (IRC, Treasury Regs, IRS guidance)
- Document source in formula map

---

## Violations

If you find financial math outside the core engine:
1. Do not add more math to fix it
2. Trace where the correct value exists in the engine
3. Wire the consumer to use the engine value
4. Delete the redundant calculation

---

## Sign Convention Standard

Cash flows use the following sign convention:
- **Positive:** Cash outflows FROM the project (payments to investors, debt service, fees)
- **Negative:** Cash inflows TO the project (rare in operating phase)

When implementing waterfall handlers, a payment should return a **positive** value
to be deducted from remaining cash:

```typescript
// CORRECT: Payment deducts from remaining cash
return paid;

// WRONG: This would ADD to remaining cash (ISS-052 bug)
return -paid;
```

---

## Override Anti-Pattern

Avoid "safety" overrides that defeat intended calculations:

```typescript
// BAD: Override wipes out the S-curve we just calculated (ISS-053 bug)
if (year === interestReservePeriodYears) {
  effectiveOccupancy = 1.0;  // Defeats S-curve!
}
```

If a calculation is complex enough to implement, trust it. Overrides should only
apply to edge cases, not default behavior.

---

## DSCR Display Standard

DSCR KPIs should reflect **stabilized operations**, not lease-up periods (ISS-054):

- When interest reserve is enabled, Year 1 may have DSCR < 1.0x (covered by reserve)
- Display the DSCR from the first **stabilized year** (effectiveOccupancy ≥ 99%)
- This aligns with lender underwriting practice (loans sized to stabilized NOI)

Functions: `findStabilizedYear()` and `calculateStabilizedDSCR()` in KPIStrip.tsx

---

## History

| Date | Change | Reference |
|------|--------|-----------|
| 2026-01-18 | Initial creation | IMPL-057 audit findings |
| 2026-01-27 | Added Sign Convention Standard | ISS-052 |
| 2026-01-27 | Added Override Anti-Pattern | ISS-053 |
| 2026-01-27 | Added DSCR Display Standard | ISS-054 |
