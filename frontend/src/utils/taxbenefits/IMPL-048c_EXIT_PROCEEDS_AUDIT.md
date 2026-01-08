# IMPL-048c: Exit Proceeds Audit

**Date:** 2026-01-06
**Status:** ✅ AUDIT COMPLETE - NO ISSUES FOUND

## Summary

The exit waterfall calculation logic is sound. All components flow correctly through the waterfall and to the Returns Buildup Strip.

---

## Exit Waterfall Priority Order

**Location:** `calculations.ts` lines 1330-1454

### Step 1: Calculate Exit Value
```typescript
const exitValue = finalYearNOI / (paramExitCapRate / 100);  // Line 1331
```

### Step 2: Pay Off All Debt (in order)

| Priority | Debt Type | Source | Line |
|----------|-----------|--------|------|
| 1 | Senior Debt | Amortized balance | 1341-1343 |
| 2 | Philanthropic Debt | Principal + PIK | 1346 |
| 3 | HDC Sub-Debt | PIK balance | 1351 |
| 4 | Investor Sub-Debt | PIK balance → **returned to investor** | 1354 |
| 5 | Outside Investor Sub-Debt | PIK balance | 1357 |

### Step 3: Preferred Equity (if enabled)
```typescript
preferredEquityAtExit = preferredEquityResult.paymentAtExit;  // Line 1377
```

### Step 4: Calculate Gross Exit Proceeds
```typescript
// After all debt payoff
grossExitProceedsBeforePrefEquity = exitValue - remainingDebt - subDebtAtExit
                                    - investorSubDebtAtExit - outsideInvestorSubDebtAtExit;
grossExitProceeds = grossExitProceedsBeforePrefEquity - preferredEquityAtExit;
```

### Step 5: Return-of-Capital Waterfall (IMPL-029)
```typescript
// 1. Return investor's equity basis first (100% to investor)
returnOfCapital = Math.min(grossExitProceeds, investorEquityBasis);

// 2. Split remaining profit per promote percentage
profit = Math.max(0, grossExitProceeds - investorEquityBasis);
investorProfitShare = profit * (investorPromoteShare / 100);

// 3. Total investor share before fees
investorShareOfGross = returnOfCapital + investorProfitShare;
```

### Step 6: Deduct Deferred Fees
```typescript
totalDeferredHDCFees = accumulatedAumFees;
exitProceeds = Math.max(0, investorShareOfGross - totalDeferredHDCFees);  // Line 1409
```

---

## Key Question: Is `investorSubDebtAtExit` Separate from `exitProceeds`?

**Answer: YES - they are distinct cash flows to the investor.**

| Component | What It Is | Source |
|-----------|-----------|--------|
| `exitProceeds` | Investor's share of **equity** proceeds after all claims | Line 1409 |
| `investorSubDebtAtExit` | Investor's **sub-debt** principal + PIK returned | Line 1354 |

Both are added to IRR and totalReturns **separately**:
```typescript
// IRR calculation (line 1537)
cashFlowArray[cashFlowArray.length - 1] += exitProceeds + investorSubDebtAtExit + ...

// totalReturns (line 1551)
const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + ...
```

**Why separate?**
- `investorSubDebtAtExit` is the investor's own sub-debt investment coming back with interest
- `exitProceeds` is the investor's share of property appreciation (equity upside)
- They represent different sources of return

---

## Returns Buildup Strip Mapping

All exit components correctly flow to the strip:

| Strip Row | Calculation Field | Category |
|-----------|-------------------|----------|
| "Exit Proceeds (net)" | `results.exitProceeds` | Exit |
| "Sub-Debt Repayment (Principal + PIK)" | `results.investorSubDebtAtExit` | Exit |

---

## Insufficient Proceeds Handling

### Debt Payoff Validation
```typescript
validateExitDebtPayoff(exitValue, seniorDebt, philDebt, hdcSubDebt, investorSubDebt, netProceeds);
```
- Throws error if debt can't be paid off before equity distribution
- Located in `calculationGuards.ts` lines 132-152

### Fee Shortfall Handling
```typescript
if (totalDeferredHDCFees > investorShareOfGross) {
  // Critical error logged with recommendations
  // exitProceeds becomes $0 (Math.max(0, ...))
}
```
- Lines 1416-1453 log detailed warnings
- Recommends: enable AUM current pay, reduce fee rates, shorter hold period

### Safety Guards
- All calculations use `Math.max(0, ...)` to prevent negative values
- Investor never receives negative exit proceeds

---

## Component Reconciliation

After IMPL-048b fixes, the strip components should sum to `totalReturns`:

**totalReturns formula:**
```
totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + exitOnlyOzBenefits + remainingLIHTCCredits
```

**Strip components map to:**

| Formula Component | Strip Display |
|-------------------|---------------|
| `cumulativeReturns` contains: | |
| - yearlyTaxBenefit | Depreciation Benefits |
| - operatingCashFlow + excessReserve | Operating Cash Flow |
| - federalLIHTCCredit | Federal LIHTC (partial) |
| - stateLIHTCCredit | State LIHTC Credits |
| - investorSubDebtInterestReceived | Sub-Debt Interest |
| - ozRecaptureAvoided | OZ Benefits (partial) |
| `exitProceeds` | Exit Proceeds (net) |
| `investorSubDebtAtExit` | Sub-Debt Repayment |
| `exitOnlyOzBenefits` (deferral + appreciation) | OZ Benefits (partial) |
| `remainingLIHTCCredits` | Federal LIHTC (partial) |

---

## Conclusion

**No issues found.** The exit proceeds calculation:
1. Correctly follows waterfall priority order
2. Separates `exitProceeds` (equity) from `investorSubDebtAtExit` (debt return)
3. Handles insufficient proceeds with validation and warnings
4. All components correctly flow to the Returns Buildup Strip

The IMPL-048b fixes ensure the strip components sum exactly to `totalReturns`.
