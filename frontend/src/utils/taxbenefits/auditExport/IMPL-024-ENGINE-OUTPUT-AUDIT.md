# IMPL-024: Engine Output Audit & KPI Strip Foundation

**Date:** 2025-12-27
**Task:** IMPL-024 Step 1 - Comprehensive Output Inventory
**Purpose:** Document all calculation outputs for Deal Validation Strip ("Conductor's Dashboard")

---

## PART 1: COMPREHENSIVE OUTPUT INVENTORY

### 1.1 Core Result Interfaces

#### `InvestorAnalysisResults` (Primary Result Object)
**Source:** `types/taxbenefits/index.ts:100-159`
**Returned by:** `calculateFullInvestorAnalysis()` in `calculations.ts`

```typescript
interface InvestorAnalysisResults {
  // === CASH FLOW ARRAYS ===
  investorCashFlows: CashFlowItem[];     // Yearly cash flow details
  cashFlows: CashFlowItem[];             // Alias for investorCashFlows

  // === RETURN METRICS ===
  irr: number;                           // Internal Rate of Return (%)
  investorIRR: number;                   // Alias for irr
  multiple: number;                      // MOIC (Multiple on Invested Capital)
  equityMultiple: number;                // Alias for multiple
  leveragedROE: number;                  // Return on equity (uses multiple)
  unleveragedROE: number;                // Placeholder (0)

  // === INVESTMENT TOTALS ===
  totalInvestment: number;               // Initial equity investment ($M)
  investorEquity: number;                // Same as totalInvestment
  totalReturns: number;                  // All returns including exit ($M)

  // === TAX BENEFITS ===
  investorTaxBenefits: number;           // Sum of all tax benefits ($M)
  investorOperatingCashFlows: number;    // Sum of operating cash ($M)
  investorSubDebtInterest: number;       // Sum of sub-debt interest paid out
  investorSubDebtInterestReceived: number; // Interest received by investor

  // === EXIT VALUES ===
  exitValue: number;                     // Property exit value ($M)
  exitProceeds: number;                  // Net to investor after fees ($M)
  totalExitProceeds: number;             // Gross exit before splits ($M)
  exitFees: number;                      // Placeholder (0)

  // === DEBT AT EXIT ===
  remainingDebtAtExit: number;           // Senior + Phil debt balance ($M)
  subDebtAtExit: number;                 // HDC sub-debt PIK balance ($M)
  investorSubDebtAtExit: number;         // Investor sub-debt PIK balance ($M)
  outsideInvestorSubDebtAtExit: number;  // Outside investor balance ($M)
  pikAccumulatedInterest: number;        // Total PIK interest accrued ($M)

  // === OUTSIDE INVESTOR TRACKING ===
  outsideInvestorTotalCost?: number;     // Principal + all interest
  outsideInvestorCashPaid?: number;      // Cash interest paid
  outsideInvestorTotalInterest?: number; // Total interest (cash + PIK)

  // === PREFERRED EQUITY ===
  preferredEquityResult?: PreferredEquityResult;
  preferredEquityAtExit?: number;        // Amount paid to pref equity

  // === PARAMETERS ===
  holdPeriod: number;                    // Investment duration (years)
  interestReserveAmount: number;         // Interest reserve funded ($M)
  investorEquityPct?: number;            // Equity % for reference
  breakEvenYear?: number;                // When cumulative turns positive

  // === TAX PLANNING (Optional) ===
  depreciationSchedule?: DepreciationSchedule;
  repTaxCapacity?: REPTaxCapacityModel;
  nonRepCapacity?: NonREPCapacityModel;
  iraConversionPlan?: IRAConversionPlan;
  assetSaleAnalysis?: AssetSaleAnalysis;

  // === INVESTMENT PORTAL FIELDS ===
  investorUpfrontCash?: number;
  afterTaxIRR?: number;
  preTaxIRR?: number;
  afterTaxMultiple?: number;
  capitalRecoveryPct?: number;
  totalAfterTaxCashReturned?: number;
  totalTaxBenefit?: number;
  netTaxBenefit?: number;
  yearlyResults?: any[];
}
```

#### `CashFlowItem` (Per-Year Detail)
**Source:** `types/taxbenefits/index.ts:15-71`

```typescript
interface CashFlowItem {
  year: number;

  // === INCOME ===
  noi: number;                          // Net Operating Income ($M)
  revenue?: number;                     // Calculated revenue (IMPL-020a)
  opex?: number;                        // Operating expenses (IMPL-020a)
  effectiveOccupancy?: number;          // Occupancy % during lease-up

  // === INTEREST RESERVE ===
  interestReserveDraw?: number;         // Amount drawn from reserve
  interestReserveBalance?: number;      // Remaining reserve balance
  excessReserveDistribution?: number;   // Excess distributed at stabilization

  // === DEBT SERVICE ===
  hardDebtService?: number;             // Senior + Phil only
  debtServicePayments: number;          // Total debt service
  debtService?: number;                 // Alias for reporting

  // === CASH WATERFALL ===
  cashAfterDebtService: number;         // NOI - debt service
  aumFeeAmount: number;                 // AUM fee due
  aumFeePaid?: number;                  // Actually paid
  aumFeeAccrued?: number;               // Deferred (PIK)
  cashAfterDebtAndFees: number;         // Available for distribution

  // === TAX BENEFITS ===
  taxBenefit: number;                   // Depreciation tax benefit
  federalLIHTCCredit?: number;          // Federal LIHTC (IMPL-021b)
  stateLIHTCCredit?: number;            // State LIHTC (IMPL-018)
  ozYear5TaxPayment?: number;           // OZ Year 5 tax due

  // === OPERATING CASH FLOW ===
  operatingCashFlow: number;            // Investor's share of operations
  totalCashFlow: number;                // Total to investor this year
  cumulativeReturns: number;            // Running total

  // === SUB-DEBT INTEREST ===
  subDebtInterest: number;              // HDC sub-debt current pay
  hdcSubDebtPIKAccrued?: number;        // HDC sub-debt PIK
  investorSubDebtInterestReceived?: number; // Investor receives
  investorSubDebtPIKAccrued?: number;   // Investor PIK accrual
  investorPikBalance?: number;          // Investor cumulative PIK
  outsideInvestorCurrentPay?: number;   // Outside investor cash
  outsideInvestorPIKAccrued?: number;   // Outside investor PIK

  // === DSCR METRICS ===
  dscr?: number;                        // Actual DSCR (hard debt)
  operationalDSCR?: number;             // Before reserve draw
  targetDscr?: number;                  // Target (1.05x)
  dscrWithCurrentPay?: number;          // Including all current pay

  // === COVENANT PROTECTION (IMPL-020a) ===
  freeCash?: number;                    // NOI - hardDebtService
  hardDscr?: number;                    // NOI / hardDebtService
  totalSubDebtInterestNet?: number;     // Net sub-debt outflow
  totalSubDebtInterestGross?: number;   // Gross for display
  cashAfterSubDebt?: number;            // After sub-debt payments
  subDebtDscr?: number;                 // Including sub-debt
  finalCash?: number;                   // After all obligations
  dscrShortfallPct?: number;            // % reduction for 1.05x

  // === TIER 2: PHIL CONVERSION ===
  philConvertedToPIK?: boolean;         // Phil converted for protection
  stage2DSCR?: number;                  // DSCR after conversion

  // === TIER 3: COVENANT STATUS ===
  covenantStatus?: 'COMPLIANT' | 'VIOLATION' | 'CRITICAL';
  cashInfusionRequired?: boolean;
  annualCashShortfall?: number;
}
```

#### `HDCAnalysisResults`
**Source:** `types/taxbenefits/index.ts:161-194`

```typescript
interface HDCAnalysisResults {
  // === CASH FLOWS ===
  hdcCashFlows: HDCCashFlowItem[];      // HDC yearly detail

  // === RETURN METRICS ===
  hdcMultiple: number;                  // HDC's MOIC
  hdcIRR: number;                       // HDC's IRR
  totalHDCReturns: number;              // Total returns to HDC
  hdcInitialInvestment: number;         // Always $0 (HDC is sponsor)

  // === EXIT PROCEEDS ===
  hdcExitProceeds: number;              // Net exit to HDC
  hdcPromoteProceeds: number;           // Promote share at exit
  philanthropicEquityRepayment: number; // Phil equity repaid
  hdcSubDebtRepayment: number;          // Sub-debt principal + PIK

  // === INCOME STREAMS ===
  hdcFeeIncome: number;                 // Tax benefit fees (0% now)
  hdcPhilanthropicIncome: number;       // From phil operations
  hdcOperatingPromoteIncome: number;    // Operating promote
  hdcAumFeeIncome: number;              // AUM fees collected
  hdcSubDebtCurrentPayIncome: number;   // Sub-debt current pay
  hdcSubDebtPIKAccrued: number;         // Sub-debt PIK accrued

  // === ADDITIONAL PROPERTIES ===
  hdcTaxBenefitFromFees?: number;
  hdcAumFees?: number;
  hdcPromoteShare?: number;
  hdcSubDebtInterest?: number;
  hdcSubDebtAtExit?: number;
  accumulatedAumFeesAtExit?: number;    // ⚠️ CRITICAL: Deferred AUM
  hdcDeferredTaxFeesAtExit?: number;    // Deferred tax benefit fees
  exitValue?: number;
  remainingDebt?: number;
  outsideInvestorSubDebtAtExit?: number;
  grossExitProceeds?: number;
  blendedDebtRate?: number;             // HDC Platform Mode
  totalDebtAmount?: number;
}
```

#### `HDCCashFlowItem` (HDC Per-Year)
**Source:** `types/taxbenefits/index.ts:73-92`

```typescript
interface HDCCashFlowItem {
  year: number;
  noi: number;
  debtServicePayments: number;
  cashAfterDebtService: number;
  aumFeeAmount: number;
  aumFeeIncome: number;                 // Actually received
  aumFeeAccrued: number;                // Deferred
  cashAfterDebtAndAumFee: number;
  hdcFeeIncome: number;                 // Tax benefit fee (0%)
  philanthropicShare: number;
  hdcSubDebtCurrentPay: number;
  hdcSubDebtPIKAccrued: number;
  promoteShare: number;
  totalCashFlow: number;
  cumulativeReturns: number;
  pikBalance: number;
  dscr?: number;
  operatingCashFlow?: number;
}
```

### 1.2 Supporting Result Interfaces

#### `PreferredEquityResult`
**Source:** `preferredEquityCalculations.ts:76-115`

```typescript
interface PreferredEquityResult {
  principal: number;                    // Invested amount
  targetAmount: number;                 // principal × MOIC
  accruedBalance: number;               // Priority tracking
  paymentAtExit: number;                // Actual payment
  achievedMOIC: number;                 // payment / principal
  achievedIRR: number;                  // Annualized return
  moicShortfall: number;                // target - achieved
  dollarShortfall: number;              // targetAmount - payment
  schedule: PreferredEquityYearlyAccrual[];
  targetAchieved: boolean;
  metadata: {
    prefEquityPct: number;
    targetMOIC: number;
    targetIRR: number;
    accrualRate: number;
    holdPeriod: number;
  };
}
```

#### `DepreciationSchedule`
**Source:** `depreciationSchedule.ts:36-50`

```typescript
interface DepreciationSchedule {
  schedule: DepreciationYear[];         // Year-by-year detail
  totalDepreciation: number;
  totalTaxBenefit: number;
  totalHDCFees: number;
  totalNetBenefit: number;
  year1Spike: number;                   // Year 1 amount
  averageAnnualBenefit: number;
  breakEvenYear: number;                // Payback year
  annualBenefitAfterYear1: number;
}
```

#### `LIHTCCreditSchedule`
**Source:** `lihtcCreditCalculations.ts:69-90`

```typescript
interface LIHTCCreditSchedule {
  annualCredit: number;                 // Full year credit
  year1Credit: number;                  // Prorated
  years2to10Credit: number;             // Per year
  year11Credit: number;                 // Catch-up
  totalCredits: number;                 // 10 × annual
  yearlyBreakdown: YearlyCredit[];
  metadata: LIHTCMetadata;
}
```

#### `StateLIHTCIntegrationResult`
**Source:** `types/taxbenefits/index.ts:546-563`

```typescript
interface StateLIHTCIntegrationResult {
  creditPath: 'syndicated' | 'direct_use' | 'none';
  syndicationRate: number;              // 0.0-1.0
  grossCredit: number;
  netProceeds: number;                  // For syndication path
  yearlyCredits: number[];              // 11-year schedule
  totalCreditBenefit: number;
  treatment: 'capital_stack' | 'tax_benefit' | 'none';
  warnings: string[];
}
```

### 1.3 Hook Exposed Values
**Source:** `useHDCCalculations.ts:725-776`

The hook returns a comprehensive object that includes:

```typescript
// Direct from hook return:
{
  // === DEPRECIATION ===
  depreciableBasis: number;
  yearOneDepreciation: number;
  remainingDepreciableBasis: number;
  annualStraightLineDepreciation: number;
  years2to10Depreciation: number;
  total10YearDepreciation: number;

  // === TAX CALCULATIONS ===
  isConformingState: boolean;
  effectiveTaxRateForDepreciation: number;
  totalTaxBenefit: number;
  hdcFee: number;
  netTaxBenefit: number;
  totalCapitalGainsRate: number;
  deferredGainsTaxDue: number;
  ozStepUpPercent: number;
  taxableGainsAfterStepUp: number;
  stepUpTaxSavings: number;

  // === ADVANCE FINANCING ===
  investorUpfrontCash: number;
  hdcAdvanceOutlay: number;

  // === INVESTMENT CALCULATIONS ===
  investorEquity: number;
  year1TaxBenefit: number;
  year1HdcFee: number;
  year1NetBenefit: number;
  freeInvestmentHurdle: number;
  totalNetTaxBenefits: number;
  investmentRecovered: number;
  totalNetTaxBenefitsAfterCG: number;
  interestReserveAmount: number;
  effectiveProjectCost: number;

  // === ANALYSIS RESULTS ===
  mainAnalysisResults: InvestorAnalysisResults;
  hdcAnalysisResults: HDCAnalysisResults;

  // === CONVENIENCE ALIASES ===
  investorCashFlows: CashFlowItem[];
  exitProceeds: number;
  totalInvestment: number;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;

  hdcCashFlows: HDCCashFlowItem[];
  hdcExitProceeds: number;
  hdcTotalReturns: number;
  hdcMultiple: number;
  hdcIRR: number;

  // === OZ BENEFITS ===
  ozBenefitStatus: {
    status: string;
    message: string;
    effectiveSavings: number;
    showProjectSelector: boolean;
    jurisdictionName: string;
    jurisdictionRate: number;
    ozConformity: string;
  };

  // === LIHTC ===
  lihtcEligibleBasis: number;
  lihtcResult: LIHTCCreditSchedule | null;
  stateLIHTCResult: StateLIHTCCalculationResult | null;
  stateLIHTCIntegration: StateLIHTCIntegrationResult | null;

  // === OZ DEFERRAL ===
  ozDeferralNPV: number;

  // === UNIFIED BENEFITS (IMPL-020a) ===
  unifiedBenefitsSummary: {
    total10YearBenefits: number;
    benefitMultiple: number;
    excessBenefits: number;
  };
}
```

---

## PART 2: STAKEHOLDER MAPPING

### 🏦 BANK/SENIOR DEBT - "Can they get paid?"

| Need | Available Field | Location | Status |
|------|-----------------|----------|--------|
| Hard DSCR | `cashFlow.dscr` | CashFlowItem | ✅ Available |
| Hard DSCR | `cashFlow.hardDscr` | CashFlowItem (IMPL-020a) | ✅ Available |
| Operational DSCR | `cashFlow.operationalDSCR` | CashFlowItem | ✅ Available |
| Target DSCR | `cashFlow.targetDscr` | CashFlowItem (always 1.05) | ✅ Available |
| DSCR with sub-debt | `cashFlow.dscrWithCurrentPay` | CashFlowItem | ✅ Available |
| Sub-debt DSCR | `cashFlow.subDebtDscr` | CashFlowItem (IMPL-020a) | ✅ Available |
| DSCR shortfall % | `cashFlow.dscrShortfallPct` | CashFlowItem (IMPL-020a) | ✅ Available |
| Covenant status | `cashFlow.covenantStatus` | CashFlowItem | ✅ Available |
| Cash shortfall | `cashFlow.annualCashShortfall` | CashFlowItem | ✅ Available |
| NOI | `cashFlow.noi` | CashFlowItem | ✅ Available |
| Hard debt service | `cashFlow.hardDebtService` | CashFlowItem | ✅ Available |
| Remaining debt at exit | `mainAnalysisResults.remainingDebtAtExit` | InvestorAnalysisResults | ✅ Available |
| **MIN DSCR across years** | ⚠️ Not pre-calculated | Need to derive | 🟡 Easy derive |
| **AVG DSCR across years** | ⚠️ Not pre-calculated | Need to derive | 🟡 Easy derive |

**Recommendation:** Add `minDSCR` and `avgDSCR` to results, or derive in UI (trivial loop).

---

### 👤 INVESTOR - "Is this attractive?"

| Need | Available Field | Location | Status |
|------|-----------------|----------|--------|
| IRR | `mainAnalysisResults.irr` | InvestorAnalysisResults | ✅ Available |
| MOIC/Multiple | `mainAnalysisResults.multiple` | InvestorAnalysisResults | ✅ Available |
| Total investment | `mainAnalysisResults.totalInvestment` | InvestorAnalysisResults | ✅ Available |
| Total returns | `mainAnalysisResults.totalReturns` | InvestorAnalysisResults | ✅ Available |
| Exit proceeds | `mainAnalysisResults.exitProceeds` | InvestorAnalysisResults | ✅ Available |
| Tax benefits (total) | `mainAnalysisResults.investorTaxBenefits` | InvestorAnalysisResults | ✅ Available |
| Operating cash (total) | `mainAnalysisResults.investorOperatingCashFlows` | InvestorAnalysisResults | ✅ Available |
| Break-even year | `mainAnalysisResults.breakEvenYear` | InvestorAnalysisResults | ✅ Available |
| Year 1 tax benefit | `cashFlows[0].taxBenefit` | CashFlowItem | ✅ Available |
| Cumulative returns | `cashFlow.cumulativeReturns` | CashFlowItem | ✅ Available |
| Preferred equity payment | `mainAnalysisResults.preferredEquityAtExit` | InvestorAnalysisResults | ✅ Available |
| Pref equity achieved MOIC | `preferredEquityResult.achievedMOIC` | PreferredEquityResult | ✅ Available |
| LIHTC credits total | `lihtcResult.totalCredits` | LIHTCCreditSchedule | ✅ Available |
| State LIHTC benefit | `stateLIHTCIntegration.totalCreditBenefit` | StateLIHTCIntegrationResult | ✅ Available |
| Unified benefits | `unifiedBenefitsSummary.total10YearBenefits` | Hook return | ✅ Available |
| **Payback period (years)** | Same as breakEvenYear | | ✅ Available |

**Recommendation:** All investor metrics available. Consider adding `freeInvestmentAchieved: boolean`.

---

### 🏢 HDC - "What do we earn?"

| Need | Available Field | Location | Status |
|------|-----------------|----------|--------|
| HDC IRR | `hdcAnalysisResults.hdcIRR` | HDCAnalysisResults | ✅ Available |
| HDC Multiple | `hdcAnalysisResults.hdcMultiple` | HDCAnalysisResults | ✅ Available |
| HDC Total Returns | `hdcAnalysisResults.totalHDCReturns` | HDCAnalysisResults | ✅ Available |
| AUM Fee Income | `hdcAnalysisResults.hdcAumFeeIncome` | HDCAnalysisResults | ✅ Available |
| Tax Benefit Fee | `hdcAnalysisResults.hdcFeeIncome` | HDCAnalysisResults | ✅ (0% now) |
| Promote Income | `hdcAnalysisResults.hdcOperatingPromoteIncome` | HDCAnalysisResults | ✅ Available |
| Sub-debt current pay | `hdcAnalysisResults.hdcSubDebtCurrentPayIncome` | HDCAnalysisResults | ✅ Available |
| Sub-debt PIK accrued | `hdcAnalysisResults.hdcSubDebtPIKAccrued` | HDCAnalysisResults | ✅ Available |
| Sub-debt at exit | `hdcAnalysisResults.hdcSubDebtAtExit` | HDCAnalysisResults | ✅ Available |
| Exit proceeds | `hdcAnalysisResults.hdcExitProceeds` | HDCAnalysisResults | ✅ Available |
| Promote at exit | `hdcAnalysisResults.hdcPromoteProceeds` | HDCAnalysisResults | ✅ Available |
| **Deferred AUM at exit** | `hdcAnalysisResults.accumulatedAumFeesAtExit` | HDCAnalysisResults | ✅ Available |
| Deferred tax fees at exit | `hdcAnalysisResults.hdcDeferredTaxFeesAtExit` | HDCAnalysisResults | ✅ Available |
| **Annual AUM paid** | `hdcCashFlows[year].aumFeeIncome` | HDCCashFlowItem | ✅ Available |
| **Annual AUM deferred** | `hdcCashFlows[year].aumFeeAccrued` | HDCCashFlowItem | ✅ Available |
| **Cumulative deferred** | ⚠️ Not pre-calculated | Need to derive | 🟡 Easy derive |

**Recommendation:** Add running cumulative deferred tracking if needed for chart, otherwise trivial to derive.

---

### 💰 SUB DEBT / PREF EQUITY - "Are they made whole?"

| Need | Available Field | Location | Status |
|------|-----------------|----------|--------|
| **HDC Sub-debt at exit** | `mainAnalysisResults.subDebtAtExit` | InvestorAnalysisResults | ✅ Available |
| **Investor sub-debt at exit** | `mainAnalysisResults.investorSubDebtAtExit` | InvestorAnalysisResults | ✅ Available |
| **Outside investor at exit** | `mainAnalysisResults.outsideInvestorSubDebtAtExit` | InvestorAnalysisResults | ✅ Available |
| Outside investor total cost | `mainAnalysisResults.outsideInvestorTotalCost` | InvestorAnalysisResults | ✅ Available |
| Outside investor cash paid | `mainAnalysisResults.outsideInvestorCashPaid` | InvestorAnalysisResults | ✅ Available |
| PIK accumulated interest | `mainAnalysisResults.pikAccumulatedInterest` | InvestorAnalysisResults | ✅ Available |
| **Pref equity principal** | `preferredEquityResult.principal` | PreferredEquityResult | ✅ Available |
| **Pref equity target** | `preferredEquityResult.targetAmount` | PreferredEquityResult | ✅ Available |
| **Pref equity payment** | `preferredEquityResult.paymentAtExit` | PreferredEquityResult | ✅ Available |
| **Pref equity shortfall** | `preferredEquityResult.dollarShortfall` | PreferredEquityResult | ✅ Available |
| Pref achieved MOIC | `preferredEquityResult.achievedMOIC` | PreferredEquityResult | ✅ Available |
| Pref target achieved | `preferredEquityResult.targetAchieved` | PreferredEquityResult | ✅ Available |
| Annual sub-debt PIK | `cashFlow.hdcSubDebtPIKAccrued` | CashFlowItem | ✅ Available |
| Annual investor PIK | `cashFlow.investorSubDebtPIKAccrued` | CashFlowItem | ✅ Available |
| Annual outside PIK | `cashFlow.outsideInvestorPIKAccrued` | CashFlowItem | ✅ Available |
| **Sub-debt "made whole" status** | ⚠️ Not pre-calculated | Need to derive | 🟡 Easy derive |

**Recommendation:** Add boolean flags: `hdcSubDebtFullyPaid`, `investorSubDebtFullyPaid`, `outsideInvestorFullyPaid`.

---

### ✓ EXIT VALIDATION - "Does everyone get paid?"

| Need | Available Field | Location | Status |
|------|-----------------|----------|--------|
| Exit value | `mainAnalysisResults.exitValue` | InvestorAnalysisResults | ✅ Available |
| Gross exit proceeds | `mainAnalysisResults.totalExitProceeds` | InvestorAnalysisResults | ✅ Available |
| Remaining debt | `mainAnalysisResults.remainingDebtAtExit` | InvestorAnalysisResults | ✅ Available |
| All sub-debt at exit | All three sub-debt fields | InvestorAnalysisResults | ✅ Available |
| Pref equity at exit | `mainAnalysisResults.preferredEquityAtExit` | InvestorAnalysisResults | ✅ Available |
| Investor net exit | `mainAnalysisResults.exitProceeds` | InvestorAnalysisResults | ✅ Available |
| HDC net exit | `hdcAnalysisResults.hdcExitProceeds` | HDCAnalysisResults | ✅ Available |
| Deferred fees at exit | `hdcAnalysisResults.accumulatedAumFeesAtExit` | HDCAnalysisResults | ✅ Available |
| **Exit waterfall validation** | ⚠️ Not pre-calculated | Would be useful | 🟡 Medium derive |
| **All stakeholders paid** | ⚠️ Not pre-calculated | Would be useful | 🟡 Medium derive |

**Recommendation:** Add an `exitWaterfallStatus` object with validation results.

---

## PART 3: FORMULA MAP VALIDATION

### 3A. Calculations NOT in Formula Map

After reviewing `calculations.ts`, the following are missing from `formulaMap.ts`:

1. **Interest Reserve Calculation** - Uses S-curve, called from `interestReserveCalculation.ts`
2. **Lease-up S-curve occupancy** - `calculateSCurve()` applied to NOI
3. **Phil Debt PIK accumulation** - Compound interest on phil debt
4. **Senior Debt IO vs P&I logic** - `seniorDebtIOYears` parameter handling
5. **Waterfall Phase transitions** - Equity recovery, catch-up, promote phases
6. **DSCR enforcement loop** - Priority-based payment processing
7. **Excess reserve distribution** - End of reserve period handling
8. **State LIHTC integration** - IMPL-018 credit path logic
9. **Federal LIHTC integration** - IMPL-021b credit flow

### 3B. Inaccurate/Outdated Formula Map Entries

| Formula ID | Issue | Correct Info |
|------------|-------|--------------|
| `calc-depr-y1-001` | Line 400 incorrect | Actually ~line 400-413 |
| `calc-basis-001` | Calls utility, not inline | Just documents delegation |
| `calc-aum-001` | Line 638 | Actually ~638-692 (more complex) |
| `calc-oz-y5-001` | Step-up helper call | Uses `getOzStepUpPercent()` |

### 3C. Documented but Not UI-Accessible

All documented formulas produce values that ARE accessible through:
- `mainAnalysisResults`
- `hdcAnalysisResults`
- `cashFlows` arrays
- `useHDCCalculations()` hook

No orphaned calculations found.

### 3D. Recommended Additions for Formula Map v1.1

```typescript
// New entries to add:
'calc-scurve-001'          // S-curve lease-up occupancy
'calc-intres-loop-001'     // Interest reserve monthly loop
'calc-senior-io-001'       // IO vs P&I decision logic
'calc-waterfall-phase-001' // Phase transition logic
'calc-dscr-enforce-001'    // 1.05x enforcement priority loop
'calc-state-lihtc-001'     // State LIHTC path selection
'calc-fed-lihtc-001'       // Federal LIHTC schedule integration
```

---

## PART 4: RECOMMENDATIONS

### 4A. What Can Display TODAY

The KPI strip can show **immediately** without any engine changes:

**Bank Panel:**
- Current year DSCR: `investorCashFlows[currentYear-1].dscr`
- Target DSCR: `1.05x` (constant)
- Covenant status: `investorCashFlows[lastYear].covenantStatus`
- Shortfall: `investorCashFlows[year].annualCashShortfall`

**Investor Panel:**
- IRR: `mainAnalysisResults.irr`
- Multiple: `mainAnalysisResults.multiple`
- Year 1 benefit: `investorCashFlows[0].taxBenefit`
- Break-even: `mainAnalysisResults.breakEvenYear`

**HDC Panel:**
- HDC IRR: `hdcAnalysisResults.hdcIRR`
- HDC Multiple: `hdcAnalysisResults.hdcMultiple`
- Exit proceeds: `hdcAnalysisResults.hdcExitProceeds`
- Deferred AUM: `hdcAnalysisResults.accumulatedAumFeesAtExit`

**Sub-Debt Panel:**
- HDC sub-debt exit: `mainAnalysisResults.subDebtAtExit`
- Investor sub-debt exit: `mainAnalysisResults.investorSubDebtAtExit`
- Outside investor exit: `mainAnalysisResults.outsideInvestorSubDebtAtExit`
- Pref equity achieved: `preferredEquityResult?.achievedMOIC`

### 4B. CLOSE - Minor Enhancement Needed

| Need | Current State | Enhancement |
|------|---------------|-------------|
| Min DSCR across years | Per-year available | Derive: `Math.min(...cashFlows.map(cf => cf.dscr))` |
| Avg DSCR | Per-year available | Derive: `sum / count` |
| Cumulative deferred | Annual available | Derive: running sum |
| Free investment achieved | Break-even year | Derive: `breakEvenYear <= holdPeriod` |

**Recommendation:** These are trivial UI-side derivations. No engine change needed.

### 4C. MISSING - Would Need New Logic

| Need | Complexity | Recommendation |
|------|------------|----------------|
| Waterfall visualization | Medium | Create `exitWaterfallBreakdown` object |
| All-stakeholder status | Low | Add boolean validation flags |
| Traffic light status | Low | Derive from existing thresholds |
| Trend indicators | Low | Compare consecutive years |

### 4D. Existing Patterns to Follow

**Component:** [InvestmentSummarySection.tsx](src/components/taxbenefits/results/InvestmentSummarySection.tsx)
- Uses `hdc-section` wrapper
- Has `compact` mode prop
- Uses CSS variables

**Component:** [DSCRAnalysisSection.tsx](src/components/taxbenefits/results/DSCRAnalysisSection.tsx)
- Shows DSCR metrics
- Uses covenant status colors
- Pattern for status indicators

**Styling:** Use existing CSS classes:
- `.hdc-section`, `.hdc-section-header`
- `.hdc-result-row`, `.hdc-result-label`, `.hdc-result-value`
- `.hdc-value-positive`, `.hdc-value-negative`
- `.hdc-metric`, `.hdc-metric-label`, `.hdc-metric-value`

**Colors:**
- `var(--hdc-faded-jade)` - Primary teal
- `var(--hdc-sushi)` - Success green
- `var(--hdc-strikemaster)` - Warning/negative
- `var(--hdc-brown-rust)` - Important values

### 4E. Additional Findings

1. **Data completeness is excellent** - Engine outputs are comprehensive
2. **IMPL-020a added waterfall fields** - Pre-calculated for display
3. **All stakeholder views supported** - No major gaps
4. **Formula map is good but incomplete** - ~70% coverage
5. **Hook exposes everything needed** - No hidden calculations
6. **Formatting utilities exist** - Use `formatters.ts`

---

## SUMMARY: KPI STRIP FEASIBILITY

| Stakeholder | Data Available | UI Complexity | Priority |
|-------------|----------------|---------------|----------|
| Bank (DSCR) | 100% | Low | P1 |
| Investor | 100% | Low | P1 |
| HDC | 100% | Low | P1 |
| Sub-Debt | 95% | Low | P1 |
| Exit Validation | 90% | Medium | P2 |

**Verdict:** All essential KPI strip data is available. Implementation can proceed immediately with existing engine outputs. No engine modifications required for MVP.
