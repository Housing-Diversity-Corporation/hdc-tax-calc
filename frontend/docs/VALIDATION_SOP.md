# TAX BENEFITS CALCULATOR VALIDATION SOP

**Version 1.2**

Standard Operating Procedure

Housing Diversity Corporation
January 23, 2026

---

## Document Information

| Field | Value |
|-------|-------|
| Document Type | Standard Operating Procedure |
| Version | 1.2 |
| Created | 2026-01-19 |
| Updated | 2026-01-23 |
| Author | Brad Padden / Claude |
| Purpose | Repeatable process for validating HDC Tax Benefits Calculator accuracy |

---

## Table of Contents

1. Overview
2. Uncertainty Philosophy
3. Prerequisites
4. Architecture Principles
5. Spec-Driven Development (SDD)
6. Validation Categories
7. Category A: Input Sync
8. Category B: Depreciation
9. Category C: Tax Benefits
10. Category D: Federal LIHTC
11. Category E: State LIHTC
12. Category F: Operating Cash Flow
13. Category G: Exit Waterfall
14. Category H: OZ Benefits
15. Category I: IRR & Returns
16. Scenario Logging Protocol
17. Issue Tracking
18. Fix Workflow
19. Troubleshooting
20. Appendix: IRC References
21. Appendix: Quick Reference Card

---

## 1. Overview

### Purpose

This SOP defines the process for validating that the HDC Tax Benefits Calculator:

- **Syncs correctly** - App inputs match Excel export
- **Calculates correctly** - Results match IRC rules and financial conventions
- **Maintains architecture** - Single source of truth (calculation engine)

### When to Run

- Before major releases
- After significant calculation changes
- Quarterly audit cycle
- When discrepancies are reported

### Estimated Time

| Scope | Time |
|-------|------|
| Full audit (Categories A-I) | 4-6 hours |
| Quick validation (A, B, I only) | 1-2 hours |
| Single category | 30-60 minutes |

---

## 2. Uncertainty Philosophy

### Root Sum Square, Not Cumulative

Validation follows metrology principles. If individual components are validated:

- Depreciation calculation ✓
- Federal LIHTC schedule ✓
- State LIHTC with variable duration ✓
- OZ benefits ✓
- Syndication proceeds ✓
- MOIC denominator (net equity) ✓

Then combined error is bounded by root sum square (RSS), not worst-case linear accumulation.

### Component Testing Strategy

We test **representative scenarios** that exercise key code paths:

| Approach | Purpose |
|----------|---------|
| Baseline scenario | Core calculation paths |
| State variations | Conformity handling |
| Toggle combinations | Feature interactions |
| Edge cases | Boundary conditions |

Novel combinations should work correctly if components are validated - barring integration bugs (which scenario testing catches).

### What This Is Not

- Not exhaustive permutation testing
- Not "Institutional Certification" (made-up term)
- Not a substitute for Sidley/Novogradac validation

The real validation is:
- **Sidley Austin** reviews tax logic
- **Novogradac** validates LIHTC math
- **Trace 4001 actuals** match projections

Our scenario testing is **quality control**, not certification.

---

## 3. Prerequisites

### Tools Required

- HDC Tax Benefits Calculator (web app)
- Excel or Python (for export analysis)
- Calculator (for hand verification)
- This SOP document
- IRC references (or project knowledge)

### Baseline Test Scenario

Use consistent inputs across all validation:

| Parameter | Value | Notes |
|-----------|-------|-------|
| Project Cost | $100M | Round number for easy math |
| Land Value | $20M | 20% of project |
| Property State | WA | No state income tax |
| Investor State | WA | Matches property for simplicity |
| Closing Month | July (7) | Mid-year for proration test |
| Hold Period | 10 years | Standard OZ hold |
| Senior Debt | 65% @ 5% | Standard leverage |
| Senior Debt Amort | 35 years | Standard amortization |
| Cost Segregation | 25% | Platform default |
| Bonus Depreciation | 100% | OBBBA permanent |
| Federal Tax Rate | 37% | Top bracket |
| NIIT Rate | 3.8% | Standard |
| Investor Track | REP | Real Estate Professional |
| LIHTC | Enabled, 4% | Tax-exempt bond rate |
| OZ | Enabled | Full benefits |
| Deferred Gain | $35M | Matches investment |
| Pref Return | 8% | Standard |
| Exit Cap Rate | 6% | Conservative exit |
| NOI Growth | 3% | Annual growth rate |

### Export Process

1. Set baseline scenario in app
2. Click Export → Audit Export (Excel)
3. Save with timestamp: `HDC_Audit_YYYY-MM-DD_XX.xlsx`

---

## 4. Architecture Principles

### Single Source of Truth

| Layer | Should Do | Should NOT Do |
|-------|-----------|---------------|
| calculations.ts (engine) | All financial math | — |
| Hooks (useHDC*.ts) | Pass engine values, prepare inputs | Calculate financial values |
| Components (*Section.tsx) | Display values | Calculate financial values |
| Export sheets (*Sheet.ts) | Write Excel formula strings | Calculate in TypeScript |

### Audit-First Principle

**Before prescribing fixes:**

1. Audit current codebase state
2. Never assume architecture is simpler than it might be
3. Trace data flow from source to display
4. Identify where values diverge from expected

**Why:** LLMs confidently generate plausible details when uncertain. Audit-first prevents wasted effort on specs that conflict with existing architecture.

### Key Concepts

- **Property State ≠ Investor State** - Where property is located vs where investor files taxes
- **OZ Conformity ≠ State Income Tax** - Whether state recognizes OZ benefits vs whether state has income tax
- **REP Benefits** - Use 37% federal rate only (NIIT doesn't apply to REP depreciation)
- **Monthly Compounding** - Debt service uses monthly compounding (standard mortgage math)

---

## 5. Spec-Driven Development (SDD)

### Core Mantra

**"Tight on outcomes, loose on implementation."**

### Role Division

| Role | Responsibility |
|------|----------------|
| Human | Define problem, approve scope, provide domain knowledge |
| Chat (Claude) | Research, draft specs, validate results |
| CC (Claude Code) | Audit codebase, implement solutions, maintain tests |

### Spec Writing Principles

**DO:**
- Define the problem clearly
- Specify acceptance criteria (how we verify)
- Provide research data (values, sources)

**DON'T:**
- Prescribe which files to edit
- Write code snippets
- Estimate LOC changes

CC knows the codebase better than the spec writer. Let CC determine implementation.

### Example: Good vs Bad Spec

**Bad (Prescriptive):**
```
Edit stateProfiles.types.ts line 65-101:
Add creditDurationYears?: number;
Then update stateLIHTCCalculations.ts line 315...
```

**Good (Outcome-focused):**
```
Problem: Nebraska credit duration hardcoded as 10 years; actual is 6 years.
Outcome: Nebraska generates 6-year schedule, Georgia unchanged at 10 years.
Acceptance: NE shows 7 entries (6 + catch-up), totaling 6× annual credit.
```

---

## 6. Validation Categories

| Category | Focus | Priority |
|----------|-------|----------|
| A: Input Sync | App inputs = Export values | Critical |
| B: Depreciation | IRC §168 compliance | Critical |
| C: Tax Benefits | Rate application, conformity | High |
| D: Federal LIHTC | IRC §42 compliance | High |
| E: State LIHTC | Variable duration, syndication | High |
| F: Operating CF | NOI, DSCR, debt service | High |
| G: Exit Waterfall | Exit value, distribution | High |
| H: OZ Benefits | IRC §1400Z compliance | High |
| I: IRR & Returns | Cash flow → IRR | Critical |

**Recommended Order:** A → B → C → D → E → F → G → H → I

---

## 7. Category A: Input Sync

### Purpose

Verify that values entered in the app UI are correctly passed to the Excel export.

### Method

1. Set baseline scenario in app
2. Export Excel
3. Compare Inputs sheet to app values

### Verification Checklist

| Input | App Value | Excel Cell | Match? |
|-------|-----------|------------|--------|
| Project Cost | $100M | Inputs!B4 | |
| Land Value | $20M | Inputs!B5 | |
| Property State | WA | Inputs!B8 | |
| Investor State | WA | Inputs!B49 | |
| Federal Tax Rate | 37% | Inputs!B44 | |
| State Tax Rate | 0% | Inputs!B46 | |
| Is REP | 1 | Inputs!B51 | |
| LIHTC Enabled | 1 | Inputs!B58 | |
| Cost Seg % | 25% | Inputs!B47 | |
| Bonus Depr % | 100% | Inputs!B48 | |

### Common Issues

- **ISS-001 pattern:** Export using wrong prop (e.g., Property State instead of Investor State)
- **ISS-002 pattern:** Toggle values not passed to export params

### Pass Criteria

All inputs match exactly. Any mismatch = investigate root cause.

---

## 8. Category B: Depreciation

### Purpose

Verify depreciation follows IRC §168 rules.

### IRC Rules

| Rule | IRC Section | Formula |
|------|-------------|---------|
| Depreciable Basis | §168 | Project Cost - Land Value |
| Cost Seg Split | §168(k) | Depreciable Basis × Cost Seg % |
| 27.5-Year Portion | §168(c) | Depreciable Basis × (1 - Cost Seg %) |
| Year 1 Bonus | §168(k) | Cost Seg Amount × Bonus % |
| Year 1 MACRS | §168(d)(2) | (27.5 Portion / 27.5) × ((12 - PIS Month + 0.5) / 12) |
| Years 2+ MACRS | §168(b)(3) | 27.5 Portion / 27.5 |

### Hand Calculation (Baseline Scenario)

```
Depreciable Basis = $100M - $20M = $80M
Cost Seg (25%) = $80M × 0.25 = $20M
27.5-Year Portion = $80M × 0.75 = $60M

Year 1 Bonus = $20M × 100% = $20M
Year 1 MACRS = ($60M / 27.5) × (5.5/12) = $2.182M × 0.4583 = $1.0M
Year 1 Total = $20M + $1.0M = $21M

Years 2-10 MACRS = $60M / 27.5 = $2.182M per year
Total 10-Year = $21M + ($2.182M × 9) = $40.64M
```

### Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Depreciable Basis | $80M | | |
| Cost Seg Portion | $20M | | |
| 27.5-Year Portion | $60M | | |
| Year 1 Bonus | $20M | | |
| Year 1 MACRS | $1.0M | | |
| Year 1 Total | $21M | | |
| Years 2-10 MACRS | $2.182M/yr | | |
| Total 10-Year | $40.64M | | |

### Pass Criteria

All values match hand calculation within $1K tolerance.

---

## 9. Category C: Tax Benefits

### Purpose

Verify tax benefit calculations apply correct rates.

### Rules

| Investor Type | Effective Rate | Why |
|---------------|----------------|-----|
| REP (Real Estate Professional) | 37% federal only | NIIT doesn't apply to REP active income per §469(c)(7) |
| Passive Investor | 37% + 3.8% NIIT = 40.8% | Passive income subject to NIIT per §1411 |
| + State Tax | Add state rate | Only if state conforms to bonus depreciation |

### Hand Calculation (REP, WA - No State Tax)

```
Effective Rate = 37% (federal only, NIIT excluded for REP)

Year 1 Tax Benefit = Year 1 Depreciation × Effective Rate
                   = $21M × 37% = $7.77M

Years 2-10 Tax Benefit = Annual MACRS × Effective Rate
                       = $2.182M × 37% = $0.807M per year

Total 10-Year Tax Benefits = $7.77M + ($0.807M × 9) = $15.04M
```

### Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Effective Rate (displayed) | 40.8% | | |
| Effective Rate (applied) | 37% | | |
| Year 1 Tax Benefit | $7.77M | | |
| Years 2-10 Tax Benefit | $0.807M/yr | | |
| Total 10-Year | $15.04M | | |

### Critical Note

The UI may display 40.8% effective rate (Fed + NIIT) but REP calculations should use 37% only. Verify by checking: Tax Benefit / Depreciation = Rate Applied

---

## 10. Category D: Federal LIHTC

### Purpose

Verify Federal LIHTC calculations follow IRC §42.

### IRC Rules

| Rule | IRC Section | Formula |
|------|-------------|---------|
| Eligible Basis | §42(d) | Development Cost - Land - Ineligible |
| DDA/QCT Boost | §42(d)(5)(B) | 130% if applicable |
| Qualified Basis | §42(c) | Eligible Basis × Boost × Applicable Fraction |
| Annual Credit | §42(a) | Qualified Basis × Credit Rate (4% or 9%) |
| Year 1 Proration | §42(f)(2) | Based on PIS month |
| Credit Period | §42(f)(1) | 10 years |
| Year 11 Catch-up | §42(f)(1) | Remainder from proration |

### Hand Calculation (Baseline Scenario)

```
Eligible Basis = $100M - $20M = $80M
DDA/QCT Boost = None (1.0x)
Qualified Basis = $80M × 100% = $80M
Annual Credit = $80M × 4% = $3.2M

Year 1 Proration (July PIS):
  Proration Factor = (13 - 7) / 12 = 6/12 = 0.5
  Year 1 Credit = $3.2M × 0.5 = $1.6M

Years 2-10 Credit = $3.2M per year (full annual)
Year 11 Catch-up = $3.2M × (1 - 0.5) = $1.6M

Total = $1.6M + ($3.2M × 9) + $1.6M = $32M
Validation: 10 × Annual Credit = $32M ✓
```

### DDA/QCT Boost Calculation

When DDA/QCT enabled:

```
Eligible Basis = $80M (pre-boost)
Qualified Basis = $80M × 130% = $104M (post-boost)
Annual Credit = $104M × 4% = $4.16M
```

### Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Eligible Basis | $80M | | |
| DDA/QCT Boost | 0% or 30% | | |
| Qualified Basis | $80M or $104M | | |
| Annual Credit | $3.2M or $4.16M | | |
| Year 1 Proration | 0.5 | | |
| Year 1 Credit | $1.6M or $2.08M | | |
| Year 11 Catch-up | $1.6M or $2.08M | | |
| Total Credits | $32M or $41.6M | | |

---

## 11. Category E: State LIHTC

### Purpose

Verify State LIHTC calculations handle variable duration, syndication paths, and state-specific rules.

### Program Types

| Type | Description | Example |
|------|-------------|---------|
| Piggyback | Auto % of federal credit | GA (100%), NE (100%) |
| Supplement | Additional allocation | — |
| Standalone | Independent program | CA |
| Grant | Not a credit | — |

### Variable Duration

**Critical:** Not all states use 10-year credit periods.

| State | Duration | Catch-Up Year |
|-------|----------|---------------|
| GA | 10 years | Year 11 |
| NE | 6 years | Year 7 |
| WI | 6 years | Year 7 |
| IN | 5 years | Year 6 |

### Syndication Paths

| Path | MOIC Denominator | When Proceeds Received |
|------|------------------|------------------------|
| Direct | Gross equity | N/A (investor uses credits) |
| Syndicated Y0 | Net equity (gross - proceeds) | At close |
| Syndicated Y1 | Gross equity | Year 1 cash flow |
| Syndicated Y2 | Gross equity | Year 2 cash flow |

### Hand Calculation: GA vs NE Comparison

**Georgia (10-year):**
```
State Annual Credit = $3.2M
State Total Credits = $3.2M × 10 = $32M
Syndication Proceeds (75%) = $32M × 75% = $24M
Net Equity = $35M - $24M = $11M
MOIC = $111.68M / $11M = 10.15x
```

**Nebraska (6-year):**
```
State Annual Credit = $3.2M
State Total Credits = $3.2M × 6 = $19.2M
Syndication Proceeds (75%) = $19.2M × 75% = $14.4M
Net Equity = $35M - $14.4M = $20.6M
MOIC = $111.68M / $20.6M = 5.42x
```

### Verification Checklist

| Check | GA Expected | NE Expected | Excel Value | Match? |
|-------|-------------|-------------|-------------|--------|
| State Credit Duration | 10 | 6 | | |
| State Annual Credit | $3.2M | $3.2M | | |
| State Total Credits | $32M | $19.2M | | |
| Year 7 State Credit | $3.2M | $1.6M (catch-up) | | |
| Year 8 State Credit | $3.2M | $0 | | |
| Syndication Proceeds | $24M | $14.4M | | |
| Net Equity | $11M | $20.6M | | |

### UI Label Verification

For Nebraska (6-year program), verify dynamic labels:

| Element | Expected |
|---------|----------|
| Duration warning | "⚠ 6-year credit period (not standard 10 years)" |
| Annual credit label | "Years 2-6" |
| Catch-up label | "Year 7 Catch-Up" |
| Total label | "6-Year Gross Credits" |
| Excel totals note | "Fed: 10yr, State: 6yr" |

---

## 12. Category F: Operating Cash Flow

### Purpose

Verify NOI projections, debt service calculations, and DSCR metrics.

### Key Formulas

| Metric | Formula |
|--------|---------|
| NOI Year N | Stabilized NOI × (1 + Growth Rate)^(N-1) |
| Debt Service | PMT with monthly compounding |
| DSCR | NOI / Debt Service |
| Cash After Debt | NOI - Debt Service |
| Available for Soft Pay | NOI - (Debt Service × Min DSCR Requirement) |

### Debt Service Calculation (Monthly Compounding)

**CRITICAL:** Platform uses monthly compounding (standard mortgage convention), NOT annual.

```
Monthly Rate = Annual Rate / 12 = 5% / 12 = 0.4167%
Number of Months = Amort Years × 12 = 35 × 12 = 420

Monthly Payment = Principal × [r(1+r)^n] / [(1+r)^n - 1]
                = $65M × [0.004167 × (1.004167)^420] / [(1.004167)^420 - 1]
                = $0.3280M per month

Annual Debt Service = Monthly × 12 = $3.9365M
```

### Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Stabilized NOI | $5.113M | | |
| Year 10 NOI | $6.671M | | |
| Debt Service (Annual) | $3.9365M | | |
| Year 1 DSCR | 1.299 | | |
| Year 10 DSCR | 1.695 | | |
| Min DSCR Requirement | 1.05x | | |

---

## 13. Category G: Exit Waterfall

### Purpose

Verify exit value calculation and equity distribution waterfall.

### Key Formulas

| Metric | Formula |
|--------|---------|
| Exit Value | Final Year NOI / Exit Cap Rate |
| Net After Debt | Exit Value - Outstanding Debt |
| Pref Target | Investment × Pref Rate × Hold Years |

### Waterfall Steps

1. **Return of Capital (ROC)** - Investor gets initial investment back first
2. **Preferred Return** - Investor gets accrued preferred return (8% × years)
3. **Catch-Up** - Sponsor catches up to promote split
4. **Promote Split** - Remaining split per agreement

### Hand Calculation

```
Exit Value = $6.671M / 6% = $111.19M

Debt at Exit (Year 10 EOY balance): ~$56.12M
Net After Debt = $111.19M - $56.12M = $55.07M

Waterfall:
  Step 1 - Investor ROC: $35.00M
  Remaining: $55.07M - $35.00M = $20.07M
  Step 2 - Pref Target: $35M × 8% × 10 = $28.00M
  Pref Paid: ~$10.04M (partial - operating distributions paid rest)
  Investor Exit Proceeds = ROC + Pref Paid = $35M + $10.04M = $45.04M
```

### Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Exit Value | $111.19M | | |
| Senior Debt at Exit | ~$56.12M | | |
| Net After Debt | $55.07M | | |
| Investor ROC | $35.00M | | |
| Pref Target | $28.00M | | |
| Investor Exit Total | $45.04M | | |

---

## 14. Category H: OZ Benefits

### Purpose

Verify Opportunity Zone tax benefit calculations per IRC §1400Z.

### OZ Benefit Components

| Benefit | IRC Section | Timing | Formula |
|---------|-------------|--------|---------|
| Deferral | §1400Z-2(a) | Year 0 | Defer cap gains tax until 2026 |
| Step-Up | §1400Z-2(b)(2)(B) | Year 5 | 10% basis increase (grandfathered) |
| Exclusion | §1400Z-2(c) | Year 10+ | Exclude post-investment appreciation |
| Recapture Avoided | §1250 | Exit | Avoid depreciation recapture |

### Tax Rates Applied

| Rate Type | Rate | Use |
|-----------|------|-----|
| Capital Gains (Long-term) | 20% | Base rate |
| NIIT | 3.8% | Added to cap gains |
| Combined Cap Gains | 23.8% | Step-up, exclusion |
| §1250 Recapture | 25% | Unrecaptured depreciation |

### Hand Calculation

**1. Year 5 Step-Up Savings**
```
Deferred Gain: $35M
Step-Up %: 10% (grandfathered for investments before 12/31/2026)
Basis Increase: $35M × 10% = $3.5M
Tax Savings: $3.5M × 23.8% = $0.833M
```

**2. Year 10 Appreciation Exclusion**
```
Exit Proceeds to Investor: $45.04M
Original Investment: $35.00M
Appreciation: $45.04M - $35.00M = $10.04M
Exclusion Value: $10.04M × 23.8% = $2.39M
```

**3. Recapture Avoided**
```
Total Depreciation (10 years): $40.64M
§1250 Recapture Rate: 25%
Recapture Avoided: $40.64M × 25% = $10.16M
```

### Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Deferred Gain | $35M | | |
| Step-Up % | 10% | | |
| Step-Up Savings (Y5) | $0.833M | | |
| Appreciation | $10.04M | | |
| Appreciation Exclusion | $2.39M | | |
| Total Depreciation | $40.64M | | |
| Recapture Avoided | $10.16M | | |

---

## 15. Category I: IRR & Returns

### Purpose

Verify IRR calculation from component cash flows and returns buildup.

### Cash Flow Components

| Component | Years | Source Sheet |
|-----------|-------|--------------|
| Initial Investment | 0 | Negative (outflow) |
| Tax Benefits | 1-10 | Tax_Benefits |
| Federal LIHTC | 1-11 | LIHTC |
| State LIHTC Syndication | 0, 1, or 2 | Capital return |
| Operating Cash | 1-10 | Operating_CF → Waterfall |
| Exit Proceeds | 10 | Exit |
| OZ Step-Up | 5 | OZ calculation |
| OZ Appreciation Exclusion | 10 | OZ calculation |
| OZ Recapture Avoided | 10 | OZ calculation |

### Returns Buildup Verification

The Summary sheet includes a Returns Buildup section. Verify sum equals Total Returns:

| Component | Expected | Excel Value | Match? |
|-----------|----------|-------------|--------|
| Federal LIHTC | $32.0M | | |
| Depreciation Benefits | $15.04M | | |
| OZ Step-Up | $0.83M | | |
| OZ Appreciation Exclusion | $2.39M | | |
| OZ Recapture Avoided | $10.16M | | |
| Operating Cash Flow | varies | | |
| Exit Proceeds | $45.04M | | |
| **TOTAL RETURNS** | ~$111.68M | | |
| Validation | ✓ MATCH | | |

### Final Verification Checklist

| Check | Expected | Excel Value | Match? |
|-------|----------|-------------|--------|
| Total Investment | $35M | | |
| Total Returns | ~$111.68M | | |
| MOIC | ~3.19x | | |
| IRR | ~21.8% | | |
| Returns Buildup Sum | = Total Returns | | |

### Pass Criteria

- IRR within 0.5% of independent calculation
- MOIC within 0.05x
- Returns Buildup sums to Total Returns (validation check in export)

---

## 16. Scenario Logging Protocol

### Purpose

Maintain single source of truth for validated scenarios.

### Location

`frontend/docs/VALIDATION_SCENARIOS.md`

### After Each Validation Session

1. **Document scenario** with config, MOIC, IRR, date
2. **Update summary counts** in tracker
3. **Log any bugs found** with ISS-XXX ID
4. **Commit** with session reference

### Scenario Entry Format

```markdown
| # | Scenario | Config | MOIC | IRR | Date | Notes |
|---|----------|--------|------|-----|------|-------|
| 14 | NE 6-Year State LIHTC | NE property, WA investor, synd Y0 75% | 5.42x | 40.8% | 2026-01-22 | IMPL-079 + ISS-024 |
```

### Validation Points to Include

For complex scenarios, document specific checks:

```markdown
**Scenario 14 Validation Points:**
- State Credit Duration = 6 (not 10)
- State credits Years 1-7 only (Year 7 = catch-up)
- Years 8-10 show $0 state credits (fed only)
- Totals label shows "Fed: 10yr, State: 6yr"
```

---

## 17. Issue Tracking

### Issue ID Format

`ISS-XXX` where XXX is sequential number

### Severity Definitions

| Severity | Definition |
|----------|------------|
| Critical | Incorrect financial calculations affecting investor returns |
| High | Incorrect values that could mislead but don't affect core returns |
| Medium | Display issues, missing audit trail, documentation gaps |
| Low | Cosmetic, non-functional issues |

### Issue Template

```markdown
## ISS-XXX: [Brief Description]

**Category:** A/B/C/D/E/F/G/H/I
**Severity:** Critical / High / Medium / Low
**Status:** Open / Investigating / Fixed / Closed

**Description:** [What's wrong]
**Expected:** [What should happen]
**Actual:** [What's happening]
**Root Cause:** [Why it's happening]
**Fix:** [IMPL-XXX reference]
```

### Recent Issues (2026-01-22)

| Issue | Description | Root Cause | Fix |
|-------|-------------|------------|-----|
| ISS-021 | Eligible vs Qualified Basis display | Labels swapped in export | lihtcSheet.ts |
| ISS-022 | Tax Planning using wrong tax benefit value | Hook value instead of engine | calculations.ts |
| ISS-023 | Time to Recovery using gross equity | Should use net equity for Y0 synd | calculations.ts |
| ISS-024 | creditDurationYears not passed to export | Object not passed to export params | HDCResultsComponent.tsx + lihtcSheet.ts |

---

## 18. Fix Workflow

### IMPL ID Format

`IMPL-XXX` where XXX is sequential number

### Fix Process

1. **Audit** - Understand current state before prescribing fixes
2. **Document** - Create outcome-focused IMPL specification
3. **Implement** - CC makes code changes
4. **Restart** - Restart dev server to load changes
5. **Test** - All tests pass
6. **Verify** - Fresh export validates
7. **Update** - Add to IMPLEMENTATION_TRACKER.md

### SDD Workflow

```
Human writes spec (outcomes)
    → CC audits codebase
    → CC creates implementation plan
    → CC implements
    → Human validates via export
```

---

## 19. Troubleshooting

### Fix Reported Complete But Not Reflected

**First question:** "Did you restart the dev server?"

Code changes require recompile. If CC reports fix complete but export still shows old behavior:

1. Stop dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh browser (Cmd+Shift+R)
4. Re-export and verify

### Export Shows Different Values Than UI

Possible causes:

1. **Stale build** - Restart dev server
2. **Object not passed to export** - Common pattern (see ISS-024)
3. **Hardcoded values in export** - Audit export sheet logic
4. **Calculation vs display mismatch** - Trace from engine to export

### UI Warning Correct But Calculation Wrong

The display layer may read a field correctly while the calculation layer doesn't receive it. Trace data flow:

```
JSON data → getProgram() → calculation function → schedule generation
```

Each handoff point can drop or ignore fields.

### MOIC Unexpectedly High or Low

Check net equity calculation:

| Path | MOIC Denominator |
|------|------------------|
| No syndication | Gross equity |
| Syndicated Y0 | Net equity (gross - proceeds) |
| Syndicated Y1+ | Gross equity |

A small denominator creates high MOIC. Verify syndication proceeds and timing.

---

## 20. Appendix: IRC References

### Depreciation (IRC §168)

- §168(a) - General MACRS rule
- §168(b)(3) - 27.5-year residential rental property
- §168(c) - Recovery periods
- §168(d)(2) - Mid-month convention for real property
- §168(k) - 100% bonus depreciation (OBBBA permanent for LIHTC/OZ)

### LIHTC (IRC §42)

- §42(a) - Credit calculation formula
- §42(c) - Qualified basis definition
- §42(d) - Eligible basis definition
- §42(d)(5)(B) - DDA/QCT 130% boost
- §42(f)(1) - 10-year credit period
- §42(f)(2) - First-year proration rule

### Tax Rates

- §1 - Ordinary income rates (37% top bracket 2024+)
- §1(h) - Capital gains rates (20% top bracket)
- §1250 - Depreciation recapture (25% unrecaptured gain)
- §1411 - Net Investment Income Tax (3.8%)
- §469(c)(7) - Real Estate Professional exception from passive rules

### Opportunity Zones (IRC §1400Z)

- §1400Z-2(a) - Deferral election mechanics
- §1400Z-2(b)(2)(B) - 10% step-up at 5 years (expired 12/31/2026, grandfathered)
- §1400Z-2(c) - Permanent exclusion of post-investment appreciation at 10+ years

---

## 21. Appendix: Quick Reference Card

### Baseline Scenario

```
Project: $100M | Land: $20M | State: WA/WA | Month: July
Debt: 65% @ 5%, 35yr amort | Cost Seg: 25% | Bonus: 100%
LIHTC: 4% | Exit Cap: 6% | NOI Growth: 3%
OZ: Enabled, $35M deferred gain, 10% step-up (grandfathered)
```

### Key Formulas

```
Depreciable Basis = Project - Land
Year 1 MACRS = (Basis / 27.5) × ((12 - Month + 0.5) / 12)
Tax Benefit = Depreciation × Effective Rate (37% REP, 40.8% Passive)
LIHTC Annual = Qualified Basis × 4%
Debt Service = PMT(monthly rate, months, principal) × 12
Exit Value = Final NOI / Cap Rate
OZ Step-Up = Deferred Gain × 10% × 23.8%
```

### State LIHTC Duration

| State | Duration | Catch-Up |
|-------|----------|----------|
| GA | 10 years | Year 11 |
| NE | 6 years | Year 7 |
| Standard | 10 years | Year 11 |

### Pass Thresholds

| Metric | Tolerance |
|--------|-----------|
| Dollar values | ±$1K |
| Percentages | ±0.05% |
| Ratios | ±0.01x |
| IRR | ±0.5% |
| DSCR | exact match (NOI / DS) |

### Excel Sheet Map

| Sheet | Contains |
|-------|----------|
| Inputs | All input parameters |
| Capital_Stack | Sources and uses |
| Debt_Schedule | Amortization by year |
| Depreciation | Bonus + MACRS schedule |
| Tax_Benefits | Annual tax benefits |
| LIHTC | Credit schedule (Fed + State) |
| Operating_CF | NOI, DSCR, cash flow |
| Waterfall | Operating distributions |
| Exit | Exit value and waterfall |
| Investor_Returns | Combined investor cash flows |
| HDC_Returns | Sponsor returns |
| Summary | Dashboard + Returns Buildup |
| Validation | 48-point automated checks |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-19 | Initial creation from audit session |
| 1.1 | 2026-01-19 | Added Categories E, F, G; Added Python scripts; Added debt service monthly compounding detail |
| 1.2 | 2026-01-23 | Added: Uncertainty Philosophy, SDD Methodology, State LIHTC Category (E), Scenario Logging Protocol, Troubleshooting section, ISS-021 through ISS-024, Audit-First Principle |

---

*End of Document*
