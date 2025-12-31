# Comprehensive Cash Management & Waterfall Guide

**Version 2.1** | January 2025 | HDC Calculator

> **Purpose**: This guide provides a complete end-to-end understanding of how cash flows through the HDC system, from NOI generation through debt service, DSCR management, fee payments, and final distributions.

## Example Structure Note
All examples use HDC's standard teaching structure for consistency and easy mental math:
- **Capital Stack**: 65% Senior Debt / 30% Philanthropic Debt / 5% Investor Equity
- **Dollar Example**: $65M / $30M / $5M on $100M total project cost
- **LTV**: 95% debt / 5% equity

*Note: Actual deals vary based on project specifics, lender requirements, and market conditions. This standardized structure is used for documentation clarity.*

---

## Table of Contents

1. [Overview & Core Concepts](#overview--core-concepts)
2. [Annual Operating Cash Flow Waterfall](#annual-operating-cash-flow-waterfall)
3. [DSCR Calculation System](#dscr-calculation-system)
4. [Payment Priority & Deferral System](#payment-priority--deferral-system)
5. [Sub-Debt Types & Treatment](#sub-debt-types--treatment)
6. [HDC Fee Structure](#hdc-fee-structure)
7. [Exit Distribution Waterfall](#exit-distribution-waterfall)
8. [Complete Examples](#complete-examples)
9. [Quick Reference Tables](#quick-reference-tables)

---

## Overview & Core Concepts

### The Cash Flow Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANNUAL CASH CYCLE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Revenue (Rent)                                                      │
│       ↓                                                              │
│  Less: Operating Expenses                                           │
│       ↓                                                              │
│  = NET OPERATING INCOME (NOI) ←─── Starting Point                   │
│       ↓                                                              │
│  Less: Hard Debt Service (Senior + Phil)                            │
│       ↓                                                              │
│  = Available Cash for Soft Payments                                 │
│       ↓                                                              │
│  [DSCR Cash Management System - Maintains 1.05x]                    │
│       ↓                                                              │
│  Pay: Sub-Debt Current Interest (Priority Order)                    │
│  Pay: HDC AUM Fee                                                   │
│  Pay: HDC Tax Benefit Fee                                           │
│  Pay: Catch-up on Deferrals (Reverse Priority)                     │
│       ↓                                                              │
│  = Distributable Cash to Equity                                     │
│       ↓                                                              │
│  Phase 1: 100% to Investor (until equity recovered)                │
│  Phase 2: Catch-up to HDC (deferred promote if applicable)         │
│  Phase 3: Split per promote % (typically 65% Investor / 35% HDC)   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **NOI is King**: All cash flows begin with Net Operating Income
2. **Hard Debt First**: Senior and Philanthropic debt ALWAYS paid first
3. **1.05x DSCR Target**: System maintains EXACTLY 1.05x coverage, not minimum
4. **Priority Waterfall**: Clear payment order with automatic deferrals
5. **Free Investment**: Investor gets 100% until equity recovered
6. **Tax Benefits Never Split**: Always 100% to investor (less HDC's 10% fee)

### Three Types of Debt

```
┌──────────────────┬──────────────────┬─────────────────────────────┐
│   DEBT TYPE      │  DSCR INCLUDED?  │       PAYMENT TIMING        │
├──────────────────┼──────────────────┼─────────────────────────────┤
│ Senior Debt      │       YES        │ Monthly P&I (amortizing)    │
│ Phil Debt        │       YES        │ Interest-only (current pay) │
│ Sub-Debt (All)   │        NO        │ Soft pay from excess cash   │
└──────────────────┴──────────────────┴─────────────────────────────┘
```

---

## Annual Operating Cash Flow Waterfall

### Step-by-Step Flow with DSCR Integration

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: CALCULATE NET OPERATING INCOME (NOI)                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Rental Revenue                                    $6,500,000          │
│  Less: Operating Expenses (40% OpEx)             -$2,600,000          │
│  ──────────────────────────────────────────────────────────           │
│  NET OPERATING INCOME (NOI)                        $3,900,000          │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: PAY HARD DEBT SERVICE (ALWAYS FIRST)                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Senior Debt Service (65% @ 6%, 30yr)            -$4,674,000          │
│  Philanthropic Debt Service (30% @ 3%, IO)         -$900,000          │
│  ──────────────────────────────────────────────────────────           │
│  Total Hard Debt Service                          -$5,574,000          │
│                                                                         │
│  Cash Remaining After Hard Debt                   -$1,674,000          │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: CALCULATE DSCR CHECKPOINT #1 (HARD DSCR)                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Hard DSCR = NOI ÷ Hard Debt Service                                  │
│            = $3,900,000 ÷ $5,574,000                                  │
│            = 0.70x                                   ⚠ STRESSED        │
│                                                                         │
│  Status: Below 1.05x target → Deferrals required                      │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: APPLY 1.05x DSCR BUFFER                                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Required for 1.05x DSCR = $5,574,000 × 1.05      = $5,852,700       │
│  Actual NOI Available                              = $3,900,000       │
│  ──────────────────────────────────────────────────────────           │
│  Shortfall for 1.05x Target                       = -$1,952,700       │
│                                                                         │
│  Note: All soft payments will be deferred                              │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: PAY SOFT OBLIGATIONS (PRIORITY WATERFALL)                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Available Cash for Soft Pay:                              $0         │
│                                                                         │
│  Priority 1: Outside Investor Sub-Debt Current Pay                    │
│    Required: $0  →  Paid: $0                          ✗ DEFERRED     │
│                                                                         │
│  Priority 2: Other Sub-Debt Current Pay (HDC/Investor)               │
│    Required: $0  →  Paid: $0                          ✗ DEFERRED     │
│                                                                         │
│  Priority 3: HDC AUM Fee (1.5% of $100M)                             │
│    Required: $1,500,000  →  Paid: $0                  ✗ DEFERRED     │
│    Deferred: $1,500,000  (accrues with 8% interest)                  │
│                                                                         │
│  Priority 4: HDC Tax Benefit Fee                                      │
│    Required: $500,000  →  Paid: $0                    ✗ DEFERRED     │
│    Deferred: $500,000  (accrues with 8% interest)                    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ STEP 6: VERIFY FINAL DSCR = 1.05x                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  NOI                                                  $3,900,000       │
│  Less: Soft payments made                                    $0       │
│  ──────────────────────────────────────────────────────────           │
│  Effective NOI for DSCR                               $3,900,000      │
│                                                                         │
│  Final DSCR = $3,900,000 ÷ $5,574,000 = 0.70x        ⚠ BELOW TARGET  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ STEP 7: DISTRIBUTE REMAINING CASH (NONE IN THIS EXAMPLE)              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Distributable Cash to Equity:                            $0          │
│                                                                         │
│  Note: All available cash used for debt service and fees              │
│        System perfectly maintained 1.05x DSCR target                  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## DSCR Calculation System

### Multiple DSCR Checkpoints

The system calculates DSCR at multiple points to provide transparency and control:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DSCR CALCULATION MATRIX                            │
├───────────────┬────────────────────┬──────────────┬─────────────────┤
│  DSCR TYPE    │    FORMULA         │   PURPOSE    │  TYPICAL VALUE  │
├───────────────┼────────────────────┼──────────────┼─────────────────┤
│               │  NOI               │ Measures raw │                 │
│ Hard DSCR     │  ───────────────   │ property     │   1.10 - 1.30x  │
│               │  Senior + Phil     │ performance  │                 │
│               │                    │              │                 │
├───────────────┼────────────────────┼──────────────┼─────────────────┤
│               │  NOI               │ Shows impact │                 │
│ Sub DSCR      │  ───────────────   │ if all sub-  │   0.90 - 1.10x  │
│               │  Hard + Sub-Debt   │ debt counted │                 │
│               │                    │              │                 │
├───────────────┼────────────────────┼──────────────┼─────────────────┤
│               │  NOI - Soft Pay    │ Tracks DSCR  │                 │
│ Operational   │  ───────────────   │ before cash  │   1.05 - 1.15x  │
│ DSCR          │  Hard Debt         │ management   │                 │
│               │                    │              │                 │
├───────────────┼────────────────────┼──────────────┼─────────────────┤
│               │  NOI - Soft Pay    │ After cash   │                 │
│ Final DSCR    │  ───────────────   │ management   │   EXACTLY 1.05x │
│               │  Hard Debt         │ system       │                 │
│               │                    │              │                 │
└───────────────┴────────────────────┴──────────────┴─────────────────┘
```

### DSCR Covenant vs Target

```
COVENANT (Lender Requirement):
┌─────────────────────────────────────────┐
│  DSCR must be ≥ 1.05x                  │
│  "At least 5% cushion above debt"      │
└─────────────────────────────────────────┘

TARGET (HDC System):
┌─────────────────────────────────────────┐
│  DSCR maintained at EXACTLY 1.05x      │
│  "Distribute all excess above 1.05x"    │
└─────────────────────────────────────────┘

Why the difference?
→ Covenant sets MINIMUM acceptable
→ Target MAXIMIZES distributions while staying safe
→ System distributes ALL cash above 1.05x requirement
```

### DSCR-Driven Cash Management

```
┌────────────────────────────────────────────────────────────────┐
│           IF DSCR > 1.05x → DISTRIBUTE EXCESS                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NOI: $6,500,000                                               │
│  Hard Debt: $5,574,000                                         │
│  Raw DSCR: 1.17x → 16% excess available                       │
│                                                                 │
│  Required for 1.05x: $5,852,700                               │
│  Available for distribution: $647,300                          │
│  → Pay soft obligations up to $647,300                         │
│  → Distribute remainder to equity                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│           IF DSCR < 1.05x → DEFER PAYMENTS                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NOI: $5,500,000                                               │
│  Hard Debt: $5,574,000                                         │
│  Raw DSCR: 0.987x → Below 1.05x target!                       │
│                                                                 │
│  Required for 1.05x: $5,852,700                               │
│  Shortfall: $352,700                                          │
│  → Begin deferring soft payments (see priority order)          │
│  → HDC fees defer first to protect DSCR                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Payment Priority & Deferral System

### The Complete Priority Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PRIORITY WATERFALL                        │
│                  (When cash is SUFFICIENT - 1.05x DSCR met)         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIER 0: ALWAYS PAID (Not subject to deferral)              │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  1. Senior Debt Service (P&I)                               │   │
│  │  2. Philanthropic Debt Service (Interest-only or PIK)       │   │
│  │  3. DSCR Buffer (5% above debt = NOI - Hard Debt × 1.05)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIER 1: SOFT PAYMENTS (Priority order, deferrable)          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Priority 1: Outside Investor Sub-Debt Current Pay          │   │
│  │              → External commitment, highest priority         │   │
│  │                                                              │   │
│  │  Priority 2: Other Sub-Debt Current Pay                     │   │
│  │              → HDC Sub-Debt current interest                 │   │
│  │              → Investor Sub-Debt current interest            │   │
│  │                                                              │   │
│  │  Priority 3: HDC AUM Fee                                     │   │
│  │              → Ongoing management fee (% of AUM)             │   │
│  │                                                              │   │
│  │  Priority 4: HDC Tax Benefit Fee                             │   │
│  │              → Configurable % of annual tax benefits         │   │
│  │              → (Default 10% at market launch)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIER 2: CATCH-UP PAYMENTS (If deferred amounts exist)       │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Priority 1: Outside Investor Deferrals + Interest           │   │
│  │  Priority 2: Other Sub-Debt Deferrals + Interest             │   │
│  │  Priority 3: HDC AUM Deferrals + Interest                    │   │
│  │  Priority 4: HDC Tax Benefit Deferrals (8% interest)         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIER 3: EQUITY DISTRIBUTIONS (Waterfall within this tier)   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Phase 1: 100% to Investor (until equity recovered)         │   │
│  │  Phase 2: 100% to HDC (catch-up for deferred promote)       │   │
│  │  Phase 3: Split per promote (65% Inv / 35% HDC typical)     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Deferral Order (When Cash is INSUFFICIENT)

```
┌─────────────────────────────────────────────────────────────────┐
│            DEFERRAL ORDER (First to Last)                        │
│         "Who gets deferred first when cash is tight?"            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. HDC Tax Benefit Fee                  ←── First to defer     │
│     └─→ Collected at exit with 8% compounded interest           │
│                                                                   │
│  2. HDC AUM Fee                          ←── Second to defer    │
│     └─→ Accrues with interest (typically 8%)                    │
│                                                                   │
│  3. Other Sub-Debt Current Pay           ←── Third to defer     │
│     └─→ HDC/Investor sub-debt → Accrues as PIK                  │
│                                                                   │
│  4. Outside Investor Current Pay         ←── LAST to defer      │
│     └─→ Protected external commitment                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

RATIONALE:
• HDC fees defer first → Protects lender relationships
• Outside investor defers last → Honors external commitments
• Investor interests protected throughout
```

### Interest on Deferred Amounts

```
┌────────────────────────┬──────────────────┬─────────────────────┐
│   DEFERRED ITEM        │  INTEREST RATE   │      COMPOUNDS?     │
├────────────────────────┼──────────────────┼─────────────────────┤
│ HDC Tax Benefit Fees   │      0%          │         No          │
│ HDC AUM Fees           │   8% (typical)   │    Yes, monthly     │
│ Sub-Debt Current Pay   │  Debt rate + 2%  │  Yes, as PIK debt   │
│ Outside Investor       │  Debt rate + 2%  │  Yes, as PIK debt   │
└────────────────────────┴──────────────────┴─────────────────────┘

NOTE: Unpaid sub-debt current pay becomes PIK and compounds
```

---

## Sub-Debt Types & Treatment

### Three Distinct Sub-Debt Types

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SUB-DEBT COMPARISON MATRIX                        │
├────────────────────┬─────────────────┬──────────────┬───────────────┤
│                    │   HDC SUB-DEBT  │  INVESTOR SD │  OUTSIDE INV  │
├────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Principal Source   │ % of proj cost  │ % of proj    │ % of proj     │
│                    │                 │ cost         │ cost          │
├────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Interest Type      │ PIK accrual     │ PIK accrual  │ PIK accrual   │
│                    │ (compounds)     │ (compounds)  │ (compounds)   │
├────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Current Pay Option │ Yes (reduces    │ Yes (reduces │ Yes (reduces  │
│                    │ compounding)    │ compounding) │ compounding)  │
├────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Cash Flow Impact   │ Reduces         │ INCREASES    │ Reduces       │
│                    │ investor CF     │ investor CF  │ investor CF   │
│                    │                 │ (income!)    │               │
├────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Exit Repayment     │ To HDC          │ To Investor  │ To Outside    │
│                    │                 │ (returns)    │ Party         │
├────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Payment Priority   │ Priority 2      │ Priority 2   │ Priority 1    │
│                    │ (with others)   │ (with HDC)   │ (HIGHEST)     │
└────────────────────┴─────────────────┴──────────────┴───────────────┘
```

### Sub-Debt Cash Flow Treatment

**Year 1: ALL PIK (No current pay)**
```
┌─────────────────────────────────────────────────────────────┐
│  Principal: $5,000,000 @ 12% PIK rate                       │
│  Year 1 Interest: $5,000,000 × 0.12 = $600,000             │
│  Current Pay: $0 (disabled in Year 1)                       │
│  PIK Accrual: $600,000                                      │
│  New Balance: $5,600,000                                    │
└─────────────────────────────────────────────────────────────┘
```

**Year 2+: Current Pay Enabled at 50%**
```
┌─────────────────────────────────────────────────────────────┐
│  Starting Balance: $5,600,000 @ 12% PIK rate                │
│  Year 2 Interest: $5,600,000 × 0.12 = $672,000             │
│  Current Pay: $672,000 × 50% = $336,000 (paid as cash)     │
│  PIK Accrual: $672,000 × 50% = $336,000 (added to balance) │
│  New Balance: $5,936,000                                    │
└─────────────────────────────────────────────────────────────┘

INVESTOR IMPACT:
• If HDC Sub-Debt: Reduces investor distributable cash by $336,000
• If Outside Investor: Reduces investor distributable cash by $336,000
• If Investor Sub-Debt: INCREASES investor cash flow by $336,000 (!)
```

### Investor Sub-Debt: The Unique Case

**Why it's different:**
```
Investor Sub-Debt is INCOME to the investor, not an expense!

Example:
┌────────────────────────────────────────────────────────────┐
│  Investor contributes $10M equity                          │
│  Deal includes $5M "Investor Sub-Debt" at 12%              │
│                                                             │
│  Economic Reality:                                          │
│  • Investor effectively has $15M in the deal               │
│  • $10M as equity (gets promote share)                     │
│  • $5M as debt (gets interest + principal back)            │
│                                                             │
│  Cash Flow Impact:                                          │
│  • Current Pay INCREASES investor's cash flow              │
│  • PIK balance is REPAID to investor at exit               │
│  • Creates leveraged return on investor's capital          │
└────────────────────────────────────────────────────────────┘
```

---

## HDC Fee Structure

### Two Types of HDC Fees

```
┌──────────────────────────────────────────────────────────────────┐
│                     HDC FEE STRUCTURE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. TAX BENEFIT FEE                                              │
│     ├─ Rate: Configurable (default 10% at market launch)        │
│     ├─ Applied to: Tax benefits (not depreciation itself)        │
│     ├─ Timing: Annual as tax benefits realized                   │
│     ├─ Deferral: Can defer if cash insufficient (8% interest)    │
│     └─ Recovery: Collected at exit if deferred                   │
│                                                                   │
│  2. AUM FEE (Optional)                                           │
│     ├─ Rate: 0-2% (user configurable)                           │
│     ├─ Applied to: Project cost (AUM = Assets Under Mgmt)        │
│     ├─ Timing: Fixed annual amount                               │
│     ├─ Deferral: Can defer if cash insufficient (8% interest)    │
│     └─ Recovery: Collected at exit with accrued interest         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

NOTE: The tax benefit fee rate is a configurable parameter that can be
adjusted based on market conditions and deal structure. While initially
set at 10% for market launch, it can be modified per deal.
```

### Tax Benefit Fee Calculation

```
STEP 1: Calculate Depreciation
┌─────────────────────────────────────────────────────────┐
│  Depreciable Basis: $40M                                │
│  Year 1 Bonus (25%): $10M depreciation                 │
│  Years 2+ (straight-line): ~$1.1M/year                  │
└─────────────────────────────────────────────────────────┘

STEP 2: Calculate Tax Benefit
┌─────────────────────────────────────────────────────────┐
│  Year 1 Depreciation: $10M                              │
│  Effective Tax Rate: 47.9% (37% fed + 10.9% state)     │
│  Tax Benefit: $10M × 47.9% = $4.79M                    │
└─────────────────────────────────────────────────────────┘

STEP 3: Calculate HDC Fee (configurable % of tax benefit)
┌─────────────────────────────────────────────────────────┐
│  Tax Benefit: $4.79M                                    │
│  HDC Fee Rate: 10% (configurable parameter)            │
│  HDC Fee: $4.79M × 10% = $479,000                      │
│  Net to Investor: $4.79M - $479K = $4.311M             │
└─────────────────────────────────────────────────────────┘

CRITICAL: HDC fee is on the TAX BENEFIT (cash savings from
depreciation), NOT on the depreciation deduction itself.

NOTE: In this example we use 10%, but the rate is adjustable
per deal structure and market conditions.
```

### AUM Fee Calculation

```
PROJECT: $50M cost, 1.5% AUM fee enabled

Annual AUM Fee = $50M × 1.5% = $750,000 per year

PAYMENT SCENARIOS:

Scenario A: Cash Sufficient
┌────────────────────────────────────────────┐
│  Available cash: $850,000                  │
│  AUM fee: $750,000 → PAID IN FULL          │
│  Deferred balance: $0                      │
└────────────────────────────────────────────┘

Scenario B: Cash Insufficient
┌────────────────────────────────────────────┐
│  Available cash: $500,000                  │
│  AUM fee: $750,000 → Paid $500,000         │
│  Deferred: $250,000                        │
│  Deferred balance accrues 8% interest      │
│  Year 2 deferred = $270,000 + new deferral │
└────────────────────────────────────────────┘

EXIT COLLECTION:
┌────────────────────────────────────────────┐
│  Accumulated deferred AUM: $2.5M           │
│  Collected from investor's exit proceeds   │
│  BEFORE promote split calculation          │
└────────────────────────────────────────────┘
```

### Critical Distinction: Operating Cash vs Tax Benefits

```
┌─────────────────────────────────────────────────────────────┐
│  COMMON CONFUSION: Do HDC fees reduce operating cash?       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ AUM FEE: YES - Paid from operating cash flow            │
│     → Reduces distributable cash to equity                  │
│     → Shows in "AUM Paid" column of cash flow table         │
│                                                              │
│  ✗ TAX BENEFIT FEE: NO - It's a fee ON tax benefits        │
│     → Does NOT reduce operating cash flow                   │
│     → Investor receives net tax benefit (gross - fee %)     │
│     → Shows separately in tax benefit section               │
│     → Fee rate is configurable (default 10%)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Exit Distribution Waterfall

### Complete Exit Distribution Order

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXIT WATERFALL (7 TIERS)                       │
│                 Sale Price / Refinance Proceeds                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 1: SENIOR DEBT PAYOFF                                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Outstanding senior loan balance                         │ │
│  │  • Must be paid first (lien priority)                      │ │
│  │  • Typically amortized down from original balance          │ │
│  └────────────────────────────────────────────────────────────┘ │
│            ↓ Remaining proceeds continue                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 2: PHILANTHROPIC DEBT PAYOFF                          │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Full principal balance (interest-only loan)             │ │
│  │  • No amortization during hold period                      │ │
│  │  • Original amount remains outstanding                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│            ↓ Remaining proceeds continue                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 3: OUTSIDE INVESTOR SUB-DEBT                          │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Principal + accumulated PIK interest                    │ │
│  │  • Highest priority among sub-debts                        │ │
│  │  • External commitment honored first                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│            ↓ Remaining proceeds continue                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 4: HDC SUB-DEBT                                       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Principal + accumulated PIK interest                    │ │
│  │  • Repaid to HDC                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│            ↓ Remaining proceeds continue                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 5: INVESTOR SUB-DEBT                                  │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Principal + accumulated PIK interest                    │ │
│  │  • Returns to investor (was their money)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│            ↓ Remaining proceeds continue                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 6: HDC DEFERRED FEE CATCH-UP                          │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Deferred tax benefit fees (8% interest)                 │ │
│  │  • Accumulated AUM fees (with 8% interest)                 │ │
│  │  • CRITICAL: Paid BEFORE promote split                     │ │
│  │  • Ensures HDC receives all earned fees                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│            ↓ Remaining proceeds continue                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER 7: EQUITY PROMOTE SPLIT                               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • Remaining proceeds after ALL obligations                │ │
│  │  • Split per promote agreement                             │ │
│  │  • Typical: 65% Investor / 35% HDC                         │ │
│  │                                                             │ │
│  │  INVESTOR RECEIVES:                                         │ │
│  │  ├─ 65% of remaining proceeds                              │ │
│  │  ├─ + Investor sub-debt repayment (Tier 5)                 │ │
│  │  └─ LESS: Already paid outside investor debt (Tier 3)      │ │
│  │                                                             │ │
│  │  HDC RECEIVES:                                              │ │
│  │  ├─ 35% of remaining proceeds                              │ │
│  │  ├─ + HDC sub-debt repayment (Tier 4)                      │ │
│  │  └─ + Deferred fee catch-up (Tier 6)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Exit Example with Numbers

```
GIVEN:
┌────────────────────────────────────────────────────────┐
│  Exit Value: $200,000,000 (property sale)              │
│  Senior Debt Balance: $52,000,000                      │
│  Philanthropic Debt: $30,000,000                       │
│  Outside Investor Sub-Debt + PIK: $0                   │
│  HDC Sub-Debt + PIK: $0                                │
│  Investor Sub-Debt + PIK: $0                           │
│  Deferred Tax Benefit Fees: $3,000,000                 │
│  Deferred AUM Fees (with interest): $5,000,000         │
│  Promote Split: 65% Investor / 35% HDC                 │
└────────────────────────────────────────────────────────┘

WATERFALL CALCULATION:
┌──────────────────────────────────────────────────────────────┐
│  Gross Exit Proceeds                         $200,000,000    │
│                                                               │
│  Tier 1: Senior Debt                         -$52,000,000    │
│  Remaining:                                  $148,000,000    │
│                                                               │
│  Tier 2: Philanthropic Debt                  -$30,000,000    │
│  Remaining:                                  $118,000,000    │
│                                                               │
│  Tier 3: Outside Investor Sub-Debt                      $0   │
│  Remaining:                                  $118,000,000    │
│                                                               │
│  Tier 4: HDC Sub-Debt                                   $0   │
│  Remaining:                                  $118,000,000    │
│                                                               │
│  Tier 5: Investor Sub-Debt                              $0   │
│  Remaining:                                  $118,000,000    │
│                                                               │
│  Tier 6: HDC Deferred Fee Catch-Up            -$8,000,000    │
│    • Tax benefit fees: $3,000,000                            │
│    • AUM fees + interest: $5,000,000                         │
│  Remaining:                                  $110,000,000    │
│                                                               │
│  Tier 7: Promote Split                                       │
│    • Investor (65%): $71,500,000                             │
│    • HDC (35%): $38,500,000                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘

FINAL DISTRIBUTION:
┌──────────────────────────────────────────────────────────────┐
│  INVESTOR RECEIVES:                                           │
│    Promote share:                            $71,500,000     │
│    Investor sub-debt repayment:                       $0     │
│    ─────────────────────────────────────────────────────     │
│    TOTAL TO INVESTOR:                        $71,500,000     │
│                                                               │
│  HDC RECEIVES:                                                │
│    Promote share:                            $38,500,000     │
│    HDC sub-debt repayment:                            $0     │
│    Deferred fee catch-up:                     $8,000,000     │
│    ─────────────────────────────────────────────────────     │
│    TOTAL TO HDC:                             $46,500,000     │
│                                                               │
│  OUTSIDE INVESTOR RECEIVES:                                   │
│    Sub-debt repayment:                                $0     │
│                                                               │
└──────────────────────────────────────────────────────────────┘

VERIFICATION:
Total Distributed: $71.5M + $46.5M = $118M ✓
(Plus $82M to lenders = $200M total) ✓
```

---

## Complete Examples

### Example 1: Strong Performance Year

```
SCENARIO: Year 5, Strong NOI, All Payments Made

PROJECT:
• NOI: $6,500,000
• Senior Debt: 65% @ 6%, 30yr → $4,674,000/yr
• Phil Debt: 30% @ 3%, IO → $900,000/yr
• Outside Inv Sub-Debt: 0%
• HDC Sub-Debt: 0%
• AUM Fee: 1.5% → $1,500,000/yr
• Investor Equity: 5% → Already recovered (Year 1)

CASH FLOW:
┌─────────────────────────────────────────────────────────┐
│  NOI                                       $6,500,000    │
│  Less: Senior Debt                        -$4,674,000    │
│  Less: Phil Debt                            -$900,000    │
│  ──────────────────────────────────────────────────     │
│  Cash After Hard Debt                        $926,000    │
│                                                          │
│  Hard DSCR Check: $6.5M ÷ $5.574M = 1.17x  ✓ HEALTHY   │
│                                                          │
│  Required for 1.05x DSCR:                                │
│    $5,574,000 × 1.05 = $5,852,700                       │
│  Actual NOI: $6,500,000                                  │
│  Available for Soft Pay: $647,300                        │
│                                                          │
│  Soft Payment Waterfall:                                 │
│    Outside Investor Current Pay: $0         N/A          │
│    Other Sub-Debt Current Pay: $0           N/A          │
│    HDC AUM Fee: $1,500,000                  ⚠ PARTIAL   │
│    HDC Tax Benefit Fee: $500,000            ✗ DEFERRED  │
│  ──────────────────────────────────────────────────     │
│  Total Soft Payments:                        -$647,300   │
│                                                          │
│  AUM Fee Paid: $647,300                                 │
│  AUM Fee Deferred: $852,700                             │
│  Tax Fee Deferred: $500,000                             │
│                                                          │
│  Distributable to Equity:                          $0    │
│                                                          │
│  Final DSCR: $6.5M - $647.3K = $5.853M ÷ $5.574M        │
│            = 1.05x                           ✓ TARGET    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Example 2: Stressed Year with Deferrals

```
SCENARIO: Year 2, Lower NOI, Deferrals Required

PROJECT: (Same as Example 1)
• NOI: $5,500,000 (stress scenario)
• Same debt structure

CASH FLOW:
┌─────────────────────────────────────────────────────────┐
│  NOI                                       $5,500,000    │
│  Less: Senior Debt                        -$4,674,000    │
│  Less: Phil Debt                            -$900,000    │
│  ──────────────────────────────────────────────────     │
│  Cash After Hard Debt                       -$74,000     │
│                                                          │
│  Hard DSCR: $5.5M ÷ $5.574M = 0.987x       ⚠ STRESSED  │
│                                                          │
│  Required for 1.05x DSCR:                                │
│    $5,574,000 × 1.05 = $5,852,700                       │
│  Actual NOI: $5,500,000                                  │
│  Available for Soft Pay: $0 (shortfall)                  │
│                                                          │
│  DEFERRAL CASCADE:                                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Priority 1: Outside Inv (N/A)                     │  │
│  │   Available: $0 → Pay $0                          │  │
│  │                                                   │  │
│  │ Priority 2: Other Sub-Debt (N/A)                 │  │
│  │   Available: $0 → Pay $0                          │  │
│  │                                                   │  │
│  │ Priority 3: HDC AUM ($1.5M required)             │  │
│  │   Available: $0 → Pay $0             ✗ DEFERRED  │  │
│  │   Deferred: $1.5M (accrues 8% interest)          │  │
│  │                                                   │  │
│  │ Priority 4: HDC Tax Fee ($500K required)         │  │
│  │   Available: $0 → Pay $0             ✗ DEFERRED  │  │
│  │   Deferred: $500K (8% interest)                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Total Paid: $0                                          │
│  Total Deferred: $2,000,000                              │
│                                                          │
│  Final DSCR: $5.5M - $0 = $5.5M ÷ $5.574M               │
│            = 0.987x                          ⚠ STRESSED  │
│                                                          │
│  DEFERRED BALANCE TRACKING:                              │
│  ├─ HDC AUM (with 8%): +$1.5M → Year 3 = $1.62M        │
│  └─ HDC Tax Fee: +$500K → Year 3 = $540K (8% interest)  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Example 3: Recovery Year - Catch-Up Payments

```
SCENARIO: Year 6, Strong Recovery, Paying Back Deferrals

STARTING CONDITIONS:
• Current year NOI: $7,000,000
• Accumulated deferrals from Years 2-5:
  - HDC AUM: $7,000,000 (with accrued interest @ 8%)
  - HDC Tax Fees: $2,000,000 (compounds at 8% annually)
  - Total Deferred: ~$9,000,000

CASH FLOW:
┌─────────────────────────────────────────────────────────┐
│  NOI                                       $7,000,000    │
│  Less: Hard Debt                          -$5,574,000    │
│  ──────────────────────────────────────────────────     │
│  Cash After Hard Debt                      $1,426,000    │
│                                                          │
│  Required for 1.05x DSCR: $5,852,700                     │
│  Available for Soft Pay: $1,147,300                      │
│                                                          │
│  CURRENT YEAR OBLIGATIONS (Priority):                    │
│    Outside Investor Current Pay: $0         N/A          │
│    Other Sub-Debt Current Pay: $0           N/A          │
│    HDC AUM Fee (current): $1,500,000        ⚠ PARTIAL   │
│    HDC Tax Fee (current): $500,000          ✗ DEFERRED  │
│  ──────────────────────────────────────────────────     │
│  Subtotal Current Obligations:            -$1,147,300    │
│  Remaining for Catch-Up:                           $0    │
│                                                          │
│  CATCH-UP WATERFALL (Reverse Priority):                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 1. Outside Investor Deferrals                     │  │
│  │    Available: $0 → No payment           ✗ $0     │  │
│  │                                                   │  │
│  │ 2. Other Sub-Debt Deferrals                      │  │
│  │    Available: $0 → No payment           ✗ $0     │  │
│  │                                                   │  │
│  │ 3. HDC AUM Deferrals                             │  │
│  │    Available: $0 → No payment           ✗ $0     │  │
│  │    Still Deferred: $7M → $7.56M (compounds)      │  │
│  │                                                   │  │
│  │ 4. HDC Tax Deferrals                             │  │
│  │    Available: $0 → No payment           ✗ $0     │  │
│  │    Still Deferred: $2M → $2.5M                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Distributable to Equity: $0                             │
│                                                          │
│  NOTE: Will take several years to clear all deferrals   │
│        OR collected in lump sum at exit                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Payment Priority Cheat Sheet

```
┌─────┬──────────────────────────┬──────────┬───────────┬─────────────┐
│ #   │ PAYMENT TYPE             │ DSCR?    │ DEFER?    │ INTEREST?   │
├─────┼──────────────────────────┼──────────┼───────────┼─────────────┤
│ 1   │ Senior Debt              │ YES      │ Never     │ N/A         │
│ 2   │ Phil Debt                │ YES      │ Never     │ N/A         │
│ 3   │ DSCR Buffer (5%)         │ YES      │ Never     │ N/A         │
├─────┼──────────────────────────┼──────────┼───────────┼─────────────┤
│ 4   │ Outside Inv Sub-Debt CP  │ NO       │ Last      │ Debt + 2%   │
│ 5   │ Other Sub-Debt CP        │ NO       │ 3rd       │ Debt + 2%   │
│ 6   │ HDC AUM Fee              │ NO       │ 2nd       │ 8%          │
│ 7   │ HDC Tax Benefit Fee      │ NO       │ 1st       │ 0%          │
├─────┼──────────────────────────┼──────────┼───────────┼─────────────┤
│ 8   │ Catch-Up: Outside Inv    │ NO       │ N/A       │ As above    │
│ 9   │ Catch-Up: Other SD       │ NO       │ N/A       │ As above    │
│ 10  │ Catch-Up: HDC AUM        │ NO       │ N/A       │ As above    │
│ 11  │ Catch-Up: HDC Tax Fee    │ NO       │ N/A       │ As above    │
├─────┼──────────────────────────┼──────────┼───────────┼─────────────┤
│ 12  │ Equity Distribution      │ NO       │ N/A       │ N/A         │
└─────┴──────────────────────────┴──────────┴───────────┴─────────────┘

CP = Current Pay
SD = Sub-Debt
```

### DSCR Quick Reference

```
┌──────────────────┬───────────────────────┬─────────────────────┐
│ DSCR TYPE        │ WHAT IT MEASURES      │ TARGET/THRESHOLD    │
├──────────────────┼───────────────────────┼─────────────────────┤
│ Hard DSCR        │ Property strength     │ > 1.10 (ideal)      │
│ Operational DSCR │ Before cash mgmt      │ > 1.05 (minimum)    │
│ Final DSCR       │ After cash mgmt       │ = 1.05 (exactly)    │
│ Sub DSCR         │ Hypothetical w/ sub   │ Informational only  │
└──────────────────┴───────────────────────┴─────────────────────┘

FORMULA: DSCR = (NOI - Soft Payments) ÷ Hard Debt Service

WHERE:
• Hard Debt = Senior + Philanthropic only
• Soft Payments = Everything paid after hard debt
• Target = Maintain exactly 1.05x through cash management
```

### Exit Waterfall Quick Checklist

```
☐ 1. Senior Debt Payoff           (Lien priority)
☐ 2. Philanthropic Debt Payoff    (Full principal)
☐ 3. Outside Investor Sub-Debt    (Principal + PIK)
☐ 4. HDC Sub-Debt                 (Principal + PIK)
☐ 5. Investor Sub-Debt            (Principal + PIK → to investor)
☐ 6. HDC Deferred Fee Catch-Up    (All accumulated fees)
☐ 7. Promote Split                (Remaining proceeds)

COMMON MISTAKE:
✗ Splitting promote BEFORE paying deferred fees
✓ Pay deferred fees BEFORE promote split
```

### Sub-Debt Type Quick Comparison

```
┌─────────────────────┬──────────┬──────────┬──────────────┐
│                     │   HDC    │ INVESTOR │  OUTSIDE     │
├─────────────────────┼──────────┼──────────┼──────────────┤
│ Investor CF Impact  │ Negative │ Positive │ Negative     │
│ Exit Repayment To   │ HDC      │ Investor │ Outside      │
│ Current Pay Priority│ 2        │ 2        │ 1 (highest)  │
│ Deferral Priority   │ 3        │ 3        │ 4 (last)     │
└─────────────────────┴──────────┴──────────┴──────────────┘

KEY INSIGHT: Investor Sub-Debt is INCOME to investor!
```

---

## Cross-References

### Related Documentation

- **HDC_CALCULATION_LOGIC.md**: Complete calculation methodology
- **EXIT_CATCHUP_WATERFALL_DOCUMENTATION.md**: Exit-specific details
- **CONFIGURATION_FIELDS.md**: Parameter definitions

### Code Implementation References

```
┌────────────────────────────────────────────────────────────────┐
│ WATERFALL LOGIC                                                 │
├────────────────────────────────────────────────────────────────┤
│ • calculations.ts (lines 508-810)                              │
│   → Main operating cash flow waterfall                         │
│   → DSCR calculation and management                            │
│   → Payment priority enforcement                               │
│                                                                 │
│ • hdcAnalysis.ts (lines 260-350)                               │
│   → Exit waterfall distribution                                │
│   → Deferred fee catch-up calculation                          │
│   → Promote split logic                                        │
│                                                                 │
│ DISPLAY COMPONENTS                                              │
│ • DistributableCashFlowTable.tsx                               │
│   → Annual cash flow waterfall display                         │
│ • HDCCashFlowSection.tsx                                       │
│   → HDC fee tracking and deferrals                             │
│ • DSCRAnalysisSection.tsx                                      │
│   → DSCR calculations and checkpoints                          │
└────────────────────────────────────────────────────────────────┘
```

---

## Version History

- **v2.1** (January 2025): Complete waterfall guide created
  - Consolidated operating and exit waterfall documentation
  - Added ASCII diagrams for visual clarity
  - Included comprehensive examples with numbers
  - Created quick reference tables
  - Added DSCR calculation details throughout

---

## Questions or Issues?

For questions about the waterfall system:
1. Check this guide first
2. Review HDC_CALCULATION_LOGIC.md for mathematical details
3. Consult test files for validation scenarios
4. Contact development team if changes needed

**CRITICAL**: Do not modify waterfall logic without understanding complete implications!

---

*End of Comprehensive Waterfall Guide*
