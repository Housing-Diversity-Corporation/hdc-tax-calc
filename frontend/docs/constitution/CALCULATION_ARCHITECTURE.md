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

## History

| Date | Change | Reference |
|------|--------|-----------|
| 2026-01-18 | Initial creation | IMPL-057 audit findings |
