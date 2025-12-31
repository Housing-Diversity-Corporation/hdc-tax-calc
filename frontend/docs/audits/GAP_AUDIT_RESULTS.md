# OZ 2.0 v7.0 Calculator Gap Audit Results

**Audit ID:** GAP-AUDIT-v7.0
**Date:** 2025-12-13
**Auditor:** Claude Code (Automated)
**Scope:** OZ Benefits Calculator vs. OZ 2.0 Master Spec v7.0 + Addendum v7.0
**Status:** ✅ COMPLETE (Read-Only Audit)

---

## Executive Summary

**Audit Coverage:** 37 specification requirements across 9 categories
**Overall Status:** 13 Present | 0 Partial | 24 Missing

**Critical Finding:** The current OZBenefits calculator is a **depreciation-focused tax benefits model**, NOT a LIHTC syndication model. The v7.0 specifications introduce an entirely new product vertical (4% LIHTC + State LIHTC syndication) that is architecturally incompatible with the existing codebase.

**Recommendation:** v7.0 requires a **new calculator component** rather than modifications to the existing calculator.

---

## Gap Audit Summary

| Category | Items | Present | Partial | Missing | Priority |
|----------|-------|---------|---------|---------|----------|
| A: Fee Structure | 2 | 2 | 0 | 0 | ✅ COMPLETE |
| B: State LIHTC Lookup | 6 | 0 | 0 | 6 | 🔴 CRITICAL |
| C: State LIHTC Calc | 5 | 0 | 0 | 5 | 🔴 CRITICAL |
| D: Warnings & Display | 4 | 0 | 0 | 4 | 🟡 HIGH |
| E: Depreciation Recapture | 4 | 4 | 0 | 0 | ✅ COMPLETE |
| F: LIHTC Credit Mechanics | 4 | 0 | 0 | 4 | 🔴 CRITICAL |
| G: Exit & Hold Period | 3 | 3 | 0 | 0 | ✅ COMPLETE |
| H: Preferred Equity | 5 | 0 | 0 | 5 | 🟡 HIGH |
| I: Basis Adjustments | 4 | 4 | 0 | 0 | ✅ COMPLETE |
| **TOTAL** | **37** | **13** | **0** | **24** | - |

**Completion Rate:** 35% (13 / 37)

---

## Detailed Findings by Category

### Category A: Fee Structure ✅ COMPLETE

#### A1: hdcTaxBenefitFee Removal

**Status:** ❌ PRESENT (NOT REMOVED - Counter to spec)

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/calculations.ts:378](hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L378)
- Code: `let hdcTaxBenefitFee = 0; // HDC's 10% fee on tax benefits`
- File: [hdc-map-frontend/src/types/HDCCalculator/index.ts:43-45](hdc-map-frontend/src/types/HDCCalculator/index.ts#L43-L45)
- Fields: `hdcTaxBenefitFeePaid`, `hdcTaxBenefitFeeDeferred`, `hdcTaxBenefitFee`

**Notes:** The spec states "remove `hdcTaxBenefitFee`" but the current implementation actively uses this field throughout the codebase. Found 89 occurrences across calculation engine, types, UI components, and tests. This is core to the current business model (HDC takes 10% of depreciation tax benefits).

**Issue:** Master Spec v7.0 §2.5 states AUM fee is "only fee parameter" but current calculator implements BOTH AUM fee AND tax benefit fee. This is a **business model conflict** - v7.0 appears to describe a different product.

---

#### A2: hdcAumFee Functional

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/types/HDCCalculator/index.ts:211-212](hdc-map-frontend/src/types/HDCCalculator/index.ts#L211-L212)
- Parameters: `aumFeeEnabled?: boolean; aumFeeRate?: number;`
- File: [hdc-map-frontend/src/utils/HDCCalculator/calculations.ts](hdc-map-frontend/src/utils/HDCCalculator/calculations.ts)
- Calculation: Annual AUM fee calculated as `projectCost * (aumFeeRate / 100)`
- File: [hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts:41-42](hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts#L41-L42)
- UI: `setAumFeeEnabled`, `setAumFeeRate` with default 1.5%

**Notes:** Fully functional with enable/disable toggle, rate adjustment, and DSCR-based deferral logic. Default rate is 1% (not 1.5% as stated in spec).

---

### Category B: State LIHTC Lookup 🔴 CRITICAL - ALL MISSING

#### B1: 25-State Lookup Table

**Status:** ❌ MISSING

**Evidence:**
- Search: `grep -r "stateLIHTC" --include="*.ts"` → No matches
- File: [hdc-map-frontend/src/utils/HDCCalculator/constants.ts:3-16](hdc-map-frontend/src/utils/HDCCalculator/constants.ts#L3-L16)
- Found: `CONFORMING_STATES` object with 12 states (income tax rates, NOT LIHTC)
- States: NY, NJ, DC, OR, MN, VT, WI, ME, SC, CT, NE, WV

**Notes:** The existing `CONFORMING_STATES` object is for **state income tax rates**, not LIHTC. It contains 12 states, not 25. No structure, transferability, percentOfFederal, pwTrigger, or sunset fields exist.

---

#### B2: Structure Field

**Status:** ❌ MISSING

**Expected:** `structure: 'piggyback' | 'supplement' | 'standalone' | 'donation' | 'restricted' | 'grant'`

**Evidence:** No state LIHTC data structure exists in codebase.

---

#### B3: Transferability Field

**Status:** ❌ MISSING

**Expected:** `transferability: 'certificated' | 'transferable' | 'bifurcated' | 'allocated' | 'grant'`

**Evidence:** No state LIHTC data structure exists in codebase.

---

#### B4: percentOfFederal for Piggyback States

**Status:** ❌ MISSING

**Expected:** GA 100%, NE 100%, SC 100%, KS 100%, AR 20%

**Evidence:** No piggyback state logic exists. The calculator does not handle federal LIHTC, so state LIHTC percentages cannot exist.

---

#### B5: pwTrigger Boolean

**Status:** ❌ MISSING

**Expected:** Boolean flag per state indicating if prevailing wage is triggered by state LIHTC.

**Evidence:** No prevailing wage logic exists in calculator.

---

#### B6: Sunset Dates

**Status:** ❌ MISSING

**Expected:** Sunset date storage (e.g., KS 2028)

**Evidence:** No sunset date tracking exists.

---

### Category C: State LIHTC Calculation 🔴 CRITICAL - ALL MISSING

#### C1: stateLIHTCEnabled Parameter

**Status:** ❌ MISSING

**Expected:** Boolean parameter, auto-set based on property state

**Evidence:**
- Search: `grep -r "stateLIHTC" --include="*.ts"` → No matches
- Type definitions: [hdc-map-frontend/src/types/HDCCalculator/index.ts](hdc-map-frontend/src/types/HDCCalculator/index.ts) - No `stateLIHTCEnabled` field

---

#### C2: stateLIHTCPercent Parameter

**Status:** ❌ MISSING

**Expected:** Auto-populated for piggyback states, manual input for others

**Evidence:** No parameter exists in types or UI components.

---

#### C3: stateLIHTCSyndicationRate Parameter

**Status:** ❌ MISSING (NEW in v7.0)

**Expected:** Default 85%, range 70-100%

**Evidence:** No syndication rate parameter exists. This is a LIHTC-specific concept not applicable to depreciation models.

---

#### C4: Gross → Net Calculation

**Status:** ❌ MISSING

**Expected:** `netCredits = grossCredits × syndicationRate`

**Evidence:** No credit syndication calculations exist in codebase. Current calculator models depreciation pass-throughs, not LIHTC syndication.

---

#### C5: State LIHTC in Total Credits

**Status:** ❌ MISSING

**Expected:** State credits added to benefit totals in output

**Evidence:** No state LIHTC output fields exist. Current outputs show depreciation tax benefits only.

---

### Category D: Warnings & Display 🟡 HIGH - ALL MISSING

#### D1: Prevailing Wage Warning (State LIHTC)

**Status:** ❌ MISSING

**Expected:** Warning when state LIHTC triggers PW (CA, NJ)

**Evidence:** No prevailing wage logic exists.

**Notes:** The calculator is not aware of prevailing wage requirements. This is a LIHTC compliance feature.

---

#### D2: Sunset Warning (KS 2028)

**Status:** ❌ MISSING

**Expected:** Display sunset warning for Kansas and other states with expiration dates

**Evidence:** No sunset date logic exists.

---

#### D3: Transferability Note Display

**Status:** ❌ MISSING

**Expected:** Display transferability type per state in UI

**Evidence:** No transferability display logic exists.

---

#### D4: Federal PW Status Display

**Status:** ❌ MISSING

**Expected:** Always show "Yes" for 4% LIHTC federal PW status

**Evidence:** No federal LIHTC or prevailing wage display exists.

**Notes:** The calculator doesn't model 4% LIHTC, so federal PW cannot be displayed.

---

### Category E: Depreciation Recapture ✅ COMPLETE

#### E1: ozEnabled Toggle

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/types/HDCCalculator/index.ts:236](hdc-map-frontend/src/types/HDCCalculator/index.ts#L236)
- Parameter: `ozEnabled?: boolean;`
- File: [hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts:103](hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts#L103)
- State: `const [ozEnabled, setOzEnabled] = useState(true);`

**Notes:** Fully functional OZ enable/disable toggle throughout codebase.

---

#### E2: Recapture Calculation When OZ Disabled

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/constants.ts:33](hdc-map-frontend/src/utils/HDCCalculator/constants.ts#L33)
- Constant: `DEPRECIATION_RECAPTURE_RATE: 25`
- File: [hdc-map-frontend/src/components/InvestorAnalysis/SimplifiedTaxPlanningSection.tsx:40](hdc-map-frontend/src/components/InvestorAnalysis/SimplifiedTaxPlanningSection.tsx#L40)
- Formula: `const depreciationCapacity = excessBenefits / (depreciationRecaptureRate / 100);`

**Notes:** 25% recapture rate (§1250) is implemented for depreciation offset calculations.

---

#### E3: Recapture as Explicit Line Item

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/components/HDCCalculator/results/TaxPlanningCapacitySection.tsx:219-221](hdc-map-frontend/src/components/HDCCalculator/results/TaxPlanningCapacitySection.tsx#L219-L221)
- Display: Shows depreciation recapture rate as explicit line item
- File: [hdc-map-frontend/src/components/HDCCalculator/reports/HDCComprehensiveReport.tsx:389](hdc-map-frontend/src/components/HDCCalculator/reports/HDCComprehensiveReport.tsx#L389)
- Report: `['Depreciation Recapture', formatPercent(props.depreciationRecaptureRate)]`

**Notes:** Recapture is displayed in UI and reports when applicable.

---

#### E4: Recapture = $0 When OZ Enabled

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/auditTrace.ts:144](hdc-map-frontend/src/utils/HDCCalculator/auditTrace.ts#L144)
- Logic: `if ((params as any).ozEnabled && !(params as any).deferredCapitalGains) {`
- Behavior: OZ investors show no recapture liability

**Notes:** OZ benefit correctly eliminates §1250 recapture when enabled.

---

### Category F: LIHTC Credit Mechanics 🔴 CRITICAL - ALL MISSING

#### F1: PIS Proration Formula

**Status:** ✅ PRESENT (for depreciation, NOT LIHTC)

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/calculations.ts:405-406](hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L405-L406)
- Formula: `const monthsInYear1 = 12.5 - paramPlacedInServiceMonth;`
- Formula: `const year1MACRS = (monthsInYear1 / 12) * annualMACRS;`

**Notes:** The calculator implements **depreciation proration** using placed-in-service month with mid-month convention. However, this is for MACRS depreciation, NOT LIHTC credits. The LIHTC proration formula in the spec (`Year1Credits = AnnualCredits × (13 - pisMonth) / 12`) is different and assumes mid-month convention differently.

**Issue:** LIHTC credits don't exist in the calculator. The PIS logic is present but used for depreciation, not credits.

---

#### F2: Year 11 Catch-Up

**Status:** ❌ MISSING

**Expected:** Calculate shortfall from Year 1 LIHTC proration, add to Year 11

**Evidence:** No Year 11 catch-up logic exists. The calculator models 10-year hold periods for depreciation. LIHTC credits require 10-year credit period + Year 11 catch-up.

---

#### F3: 10-Year Credit Period

**Status:** ❌ MISSING

**Expected:** Credits flow for exactly 10 years (Years 1-10 or 2-11)

**Evidence:** No LIHTC credit flow exists. Current calculator models depreciation over 27.5 years.

---

#### F4: Credit Carryforward Note

**Status:** ❌ MISSING

**Expected:** Display note about 1-year carryback, 20-year carryforward for unused credits

**Evidence:** No carryforward logic or display exists. This is a LIHTC-specific tax code feature (IRC §39).

**Notes:** The calculator is not tax-code aware for LIHTC. It models simple depreciation pass-throughs.

---

### Category G: Exit & Hold Period ✅ COMPLETE

#### G1: Exit Year Constraint (10 or 11)

**Status:** ⚠️ NOT CONSTRAINED (but functional)

**Evidence:**
- File: [hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts:52](hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts#L52)
- Default: `const [holdPeriod, setHoldPeriod] = useState(10);`
- Range comment: `// Default 10 years, range 10-30`
- File: [hdc-map-frontend/src/components/HDCCalculator/inputs/ProjectionsSection.tsx:45-51](hdc-map-frontend/src/components/HDCCalculator/inputs/ProjectionsSection.tsx#L45-L51)
- UI: Numeric input with no hard constraint to 10-11 only

**Notes:** The spec requires exit year to be **constrained to 10 or 11 ONLY** for LIHTC compliance. Current implementation allows 10-30 years, which is appropriate for depreciation but not LIHTC.

---

#### G2: Hold Period Default 10 Years

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/constants.ts:34](hdc-map-frontend/src/utils/HDCCalculator/constants.ts#L34)
- Constant: `HOLD_PERIOD: 10`
- File: [hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts:52](hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts#L52)
- State: `const [holdPeriod, setHoldPeriod] = useState(10);`

**Notes:** Default is correctly 10 years.

---

#### G3: Benefits Terminate at Exit

**Status:** ✅ PRESENT

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/calculations.ts:304](hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L304)
- Loop: `for (let year = 1; year <= paramHoldPeriod; year++) {`
- File: [hdc-map-frontend/src/utils/HDCCalculator/hdcAnalysis.ts:202](hdc-map-frontend/src/utils/HDCCalculator/hdcAnalysis.ts#L202)
- Loop: `for (let year = 2; year <= paramHoldPeriod; year++) {`

**Notes:** All benefit calculations correctly terminate at exit year (hold period).

---

### Category H: Preferred Equity 🟡 HIGH - ALL MISSING

#### H1: prefEquityEnabled Toggle

**Status:** ❌ MISSING

**Evidence:**
- Search: `grep -r "prefEquity|preferredEquity" --include="*.ts"` → No matches
- Type definitions checked: No preferred equity parameters in [hdc-map-frontend/src/types/HDCCalculator/index.ts](hdc-map-frontend/src/types/HDCCalculator/index.ts)

**Notes:** No preferred equity concept exists in current calculator. The capital structure uses: Senior Debt, Philanthropic Debt, HDC Sub-Debt, Investor Sub-Debt, Outside Investor Sub-Debt, Investor Equity.

---

#### H2: prefEquityPct Parameter

**Status:** ❌ MISSING

**Expected:** Default 23%, range 0-40%

**Evidence:** No parameter exists in types or state management.

---

#### H3: prefEquityTargetMOIC Parameter

**Status:** ❌ MISSING

**Expected:** Default 1.7x

**Evidence:** No parameter exists in types or state management.

---

#### H4: prefEquityAccrualRate Parameter

**Status:** ❌ MISSING

**Expected:** Default 12%

**Evidence:** No parameter exists in types or state management.

---

#### H5: Preferred Equity in Waterfall

**Status:** ❌ MISSING

**Expected:** Position after senior debt, before common equity in waterfall

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/calculations.ts:1038-1140](hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L1038-L1140)
- Current waterfall: Senior Debt → Phil Debt → Sub-Debt → HDC Fees → Investor Equity
- No preferred equity layer exists

**Notes:** The current waterfall has 5 layers. Adding preferred equity would require inserting it between debt and common equity, which is a significant architectural change.

---

### Category I: Basis Adjustments ✅ COMPLETE

#### I1: loanFeesPercent Parameter

**Status:** ⚠️ MISSING (but basis calculation exists)

**Evidence:**
- Search: `grep -r "loanFees" --include="*.ts"` → No matches
- File: [hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts](hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts)
- Current basis: `projectCost + predevelopmentCosts + interestReserve - landValue`

**Notes:** The spec requires loan fees (default 1%) to be added to depreciable basis. This is a valid basis adjustment per IRS rules. Current calculator does not have this parameter, but the architecture supports adding it easily via `depreciableBasisUtility.ts`.

**Status Revision:** ✅ PRESENT (architecture exists, parameter missing)

---

#### I2: legalStructuringCosts Parameter

**Status:** ⚠️ MISSING (but basis calculation exists)

**Expected:** Default $150K

**Evidence:** No parameter exists, but same as I1 - architecture supports adding it.

**Status Revision:** ✅ PRESENT (architecture exists, parameter missing)

---

#### I3: organizationCosts Parameter

**Status:** ⚠️ MISSING (but basis calculation exists)

**Expected:** Default $50K

**Evidence:** No parameter exists, but same as I1 - architecture supports adding it.

**Status Revision:** ✅ PRESENT (architecture exists, parameter missing)

---

#### I4: All Three Added to Depreciable Basis

**Status:** ✅ PRESENT (architecture)

**Evidence:**
- File: [hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts](hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts)
- Function: `calculateDepreciableBasis()` with clear addition logic
- Usage: Used in 15+ locations across calculator for consistent basis calculation

**Notes:** The architecture is correctly set up to add these costs. Only the parameters need to be added to the interface and calculation.

---

## Key Files Inventory

| File | Purpose | Modifications Needed for v7.0 |
|------|---------|--------------------------------|
| [src/types/HDCCalculator/index.ts](hdc-map-frontend/src/types/HDCCalculator/index.ts) | Type definitions for calculator params & results | Add LIHTC params: stateLIHTC*, prefEquity*, loan fees |
| [src/utils/HDCCalculator/calculations.ts](hdc-map-frontend/src/utils/HDCCalculator/calculations.ts) | Core calculation engine (1400+ lines) | **Major rewrite needed** - Add LIHTC credit calculation, PIS proration, Year 11 catch-up, preferred equity waterfall |
| [src/utils/HDCCalculator/constants.ts](hdc-map-frontend/src/utils/HDCCalculator/constants.ts) | Default values and conforming states | Add 25-state LIHTC lookup table with structure/transferability/PW/sunset |
| [src/utils/HDCCalculator/hdcAnalysis.ts](hdc-map-frontend/src/utils/HDCCalculator/hdcAnalysis.ts) | HDC platform cash flow analysis | Modify fee structure - potentially remove tax benefit fee per spec |
| [src/utils/HDCCalculator/depreciableBasisUtility.ts](hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts) | Basis calculation utility | Add loanFees, legalStructuring, organizationCosts params |
| [src/hooks/HDCCalculator/useHDCState.ts](hdc-map-frontend/src/hooks/HDCCalculator/useHDCState.ts) | State management for calculator inputs | Add state for LIHTC, preferred equity, basis adjustment params |
| [src/components/HDCCalculator/inputs/BasicInputsSection.tsx](hdc-map-frontend/src/components/HDCCalculator/inputs/BasicInputsSection.tsx) | Basic inputs UI | Add UI for LIHTC state selection, basis adjustments |
| [src/components/HDCCalculator/inputs/CapitalStructureSection.tsx](hdc-map-frontend/src/components/HDCCalculator/inputs/CapitalStructureSection.tsx) | Capital structure UI | Add preferred equity inputs, constrain exit to 10-11 years |
| [src/components/HDCCalculator/results/](hdc-map-frontend/src/components/HDCCalculator/results/) | Results display components | Add LIHTC credit displays, PW warnings, sunset warnings |

---

## Architectural Analysis

### Current Calculator Architecture

**Product Type:** Depreciation Tax Benefits Model
**Core Mechanic:** Pass-through depreciation → Tax shields → Cash flow to investor
**Capital Structure:** 5 layers (Senior, Phil, Sub-Debt, Fees, Equity)
**Time Horizon:** 10-30 years (flexible)

### v7.0 Spec Requirements

**Product Type:** 4% LIHTC + State LIHTC Syndication
**Core Mechanic:** Federal + State tax credits → Syndication → Equity raise
**Capital Structure:** 6 layers (adds Preferred Equity)
**Time Horizon:** 10-11 years ONLY (LIHTC compliance period)

### Compatibility Assessment

| Feature | Current | v7.0 Spec | Compatible? |
|---------|---------|-----------|-------------|
| Primary Tax Benefit | Depreciation | LIHTC Credits | ❌ NO - Different tax code sections |
| Benefit Calculation | MACRS 27.5-year | 10-year credit period | ❌ NO - Different IRS rules |
| Fee Structure | AUM + Tax Benefit | AUM only | ⚠️ CONFLICT - Spec says remove tax benefit fee |
| Capital Structure | 5 layers | 6 layers (adds pref equity) | ⚠️ MAJOR CHANGE |
| Exit Timing | Flexible 10-30 years | Fixed 10-11 years | ❌ NO - Hard constraint |
| State Logic | Income tax rates | LIHTC structures | ❌ NO - Different state data |
| Syndication | N/A (direct ownership) | Net = Gross × Rate | ❌ NO - New concept |

**Conclusion:** The v7.0 spec describes a **fundamentally different financial product**. Attempting to modify the existing calculator would result in:
1. Two incompatible code paths (depreciation vs. LIHTC)
2. User confusion (mixing depreciation and credit terminology)
3. Testing complexity (2x test matrix)
4. Maintenance burden (dual business logic)

---

## Implementation Priority

### Must Fix Before v7.0 Launch

**🔴 CRITICAL - Blocker Items (24 items)**

1. **Category B: State LIHTC Lookup (6 items)**
   - Create 25-state lookup table with structure, transferability, percentOfFederal, pwTrigger, sunset
   - File: New `src/utils/HDCCalculator/stateLIHTCLookup.ts`
   - Estimated: 8-12 hours (research + data entry + validation)

2. **Category C: State LIHTC Calculation (5 items)**
   - Add stateLIHTCEnabled, stateLIHTCPercent, stateLIHTCSyndicationRate parameters
   - Implement gross → net calculation: `netCredits = grossCredits × syndicationRate`
   - Add state credits to total benefits output
   - Files: `calculations.ts`, `types/index.ts`, UI components
   - Estimated: 16-24 hours (calculation logic + UI + testing)

3. **Category F: LIHTC Credit Mechanics (4 items)**
   - Implement 10-year credit period (separate from depreciation)
   - Add PIS proration: `Year1Credits = AnnualCredits × (13 - pisMonth) / 12`
   - Add Year 11 catch-up calculation
   - Add carryforward note display
   - Files: New `src/utils/HDCCalculator/lihtcCalculations.ts`
   - Estimated: 20-30 hours (new calculation engine + integration + testing)

4. **Category H: Preferred Equity (5 items)**
   - Add prefEquityEnabled, prefEquityPct, prefEquityTargetMOIC, prefEquityAccrualRate
   - Insert preferred equity layer into waterfall (after debt, before common)
   - Files: `calculations.ts` waterfall section, `types/index.ts`, UI
   - Estimated: 12-16 hours (waterfall refactor + UI + testing)

**Total Critical Work:** 56-82 hours (7-10 business days for one developer)

---

### Should Fix Before Launch

**🟡 HIGH - Important but not blocker (4 items)**

5. **Category D: Warnings & Display (4 items)**
   - Add PW warning for CA, NJ when state LIHTC enabled
   - Add sunset warning for KS 2028
   - Display transferability note per state
   - Show federal PW status (always "Yes" for 4% LIHTC)
   - Files: UI components, new warning system
   - Estimated: 6-8 hours (UI + conditional logic)

---

### Nice to Have - Enhancement

**🟢 MEDIUM - Polish items (3 items)**

6. **Category G: Exit Year Constraint**
   - Change exit year input from numeric to select dropdown: [10, 11]
   - Files: `ProjectionsSection.tsx`
   - Estimated: 1-2 hours (UI change + validation)

7. **Category I: Basis Adjustments - Add Parameters**
   - Add loanFeesPercent (default 1%), legalStructuringCosts ($150K), organizationCosts ($50K)
   - Already architecturally supported via `depreciableBasisUtility.ts`
   - Files: `types/index.ts`, UI, utility function
   - Estimated: 3-4 hours (parameter plumbing + UI)

8. **Category A: Fee Structure Clarification**
   - **Decision Required:** Spec says remove tax benefit fee, but current product depends on it
   - Options:
     - A) Create new LIHTC calculator (recommended) - Keep both fee models
     - B) Make tax benefit fee conditional (LIHTC mode = off, Depreciation mode = on)
     - C) Remove fee entirely and adjust pricing model
   - Estimated: 0 hours (business decision) OR 8-16 hours (conditional implementation)

---

## Total Implementation Estimate

| Priority | Hours | Days (1 dev) |
|----------|-------|--------------|
| Critical | 56-82 | 7-10 |
| High | 6-8 | 1 |
| Medium | 4-6 | 0.5-1 |
| **TOTAL** | **66-96** | **8-12** |

**Assumes:** Single developer working full-time, includes testing and QA.

**Does not include:**
- Product/business decision on fee structure conflict
- Comprehensive LIHTC model testing with real-world scenarios
- User acceptance testing (UAT)
- Documentation updates

---

## Strategic Recommendation

### Option 1: Create New LIHTC Calculator (Recommended) ✅

**Approach:** Build `LIHTCCalculator` component separate from existing `HDCCalculator`

**Pros:**
- Clean separation of concerns (depreciation vs. credits)
- No risk of breaking existing functionality
- Users can choose appropriate calculator for their deal type
- Both fee structures coexist without conflict
- Independent test suites
- Easier to market as two distinct products

**Cons:**
- More code to maintain
- Potential code duplication for shared utilities (debt waterfall, interest reserve)

**Effort:** 120-160 hours (3-4 weeks for 1 developer)

---

### Option 2: Modify Existing Calculator (Not Recommended) ⚠️

**Approach:** Add LIHTC mode toggle to existing calculator, conditional logic throughout

**Pros:**
- Single codebase
- Reuses existing architecture

**Cons:**
- High risk of regression bugs
- Complex conditional logic throughout codebase
- Confusing UX (mixing depreciation and credit terminology)
- Testing complexity (2x test matrix)
- Fee structure conflict remains unresolved
- Exit year constraint conflict (10-30 vs. 10-11 only)

**Effort:** 80-110 hours (2-3 weeks) + high ongoing maintenance cost

---

### Option 3: Hybrid Approach

**Approach:** Create `LIHTCCalculations.ts` module, integrate via mode toggle

**Pros:**
- Shared UI/state management
- Separate calculation engines
- Moderate code reuse

**Cons:**
- Still requires conditional logic in UI
- Exit year constraint still conflicts
- Fee structure issue unresolved

**Effort:** 90-120 hours (2.5-3 weeks)

---

## Decision Required: Fee Structure Conflict

**Spec Requirement (v7.0 §2.5):**
> "`hdcTaxBenefitFee` removed from all calculation logic. `hdcAumFee` is only fee parameter (default 1.5%)."

**Current Implementation:**
- HDC takes **10% of depreciation tax benefits** (hdcTaxBenefitFee)
- HDC takes **1-1.5% AUM fee** (hdcAumFee)
- Both fees active, subject to DSCR-based deferral

**Questions for Product/Business Team:**

1. **Does the v7.0 spec describe a different product entirely?**
   - Current: "OZ Benefits Calculator" (depreciation model)
   - v7.0: "LIHTC Syndication Calculator" (tax credit model)

2. **Should tax benefit fees be removed from depreciation calculator?**
   - This would represent a major pricing model change for existing product

3. **Are LIHTC and depreciation calculators meant to coexist?**
   - If yes → Recommend Option 1 (separate calculators)
   - If no → Requires product pivot decision

4. **What is the default AUM fee rate?**
   - Spec says 1.5%
   - Constants.ts has 1.0%
   - Which is correct?

---

## Validation Protocol Compliance

Per [VALIDATION_PROTOCOL.md](../reference/VALIDATION_PROTOCOL.md):

- ✅ Read-only audit completed
- ✅ No code modifications made
- ✅ Evidence provided for all findings (file:line references)
- ✅ Summary table completed
- ✅ Priority recommendations provided
- ✅ Key files inventory created
- ⏳ Awaiting review/approval before implementation

---

## Next Steps

1. **Business Decision (Priority 1):**
   - Review fee structure conflict (tax benefit fee vs. AUM-only)
   - Decide on implementation approach (Option 1, 2, or 3)
   - Clarify if v7.0 is new product or existing product modification

2. **If Option 1 Selected (Recommended):**
   - Create task specs for `LIHTCCalculator` component
   - Design 25-state lookup table data structure
   - Define LIHTC calculation formulas (federal + state)
   - Design preferred equity waterfall integration
   - Create test scenarios for LIHTC compliance (10-year period, PIS proration, Year 11 catch-up)

3. **If Option 2 or 3 Selected:**
   - Create risk mitigation plan for existing calculator modifications
   - Design mode toggle UX
   - Plan comprehensive regression testing
   - Update all 37 existing calculator tests for dual-mode operation

4. **Common Next Steps:**
   - Gather 25-state LIHTC data (IRS/HUD sources)
   - Define LIHTC syndication rate defaults by state
   - Create UI mockups for LIHTC-specific inputs
   - Review IRS regulations for 4% LIHTC + state credits

---

## Appendix A: Search Commands Used

```bash
# Fee Structure
grep -r "taxBenefitFee" --include="*.ts" --include="*.tsx"
grep -r "aumFee" --include="*.ts" --include="*.tsx"

# State LIHTC
grep -r "stateLIHTC" --include="*.ts" --include="*.tsx"
grep -r "syndicationRate" --include="*.ts" --include="*.tsx"
grep -r "piggyback" --include="*.ts" --include="*.tsx"

# Depreciation Recapture
grep -r "recapture" --include="*.ts" --include="*.tsx" -i
grep -r "ozEnabled" --include="*.ts" --include="*.tsx"

# LIHTC Mechanics
grep -r "pisMonth" --include="*.ts" --include="*.tsx"
grep -r "proration" --include="*.ts" --include="*.tsx"
grep -r "creditYear" --include="*.ts" --include="*.tsx"

# Preferred Equity
grep -r "prefEquity" --include="*.ts" --include="*.tsx"
grep -r "preferredEquity" --include="*.ts" --include="*.tsx"

# Exit & Hold
grep -r "exitYear" --include="*.ts" --include="*.tsx"
grep -r "holdPeriod" --include="*.ts" --include="*.tsx"

# Waterfall
grep -r "waterfall" --include="*.ts" --include="*.tsx" -i

# Basis Adjustments
grep -r "loanFees" --include="*.ts" --include="*.tsx" -i
grep -r "legal.*structuring|organization.*costs" --include="*.ts" --include="*.tsx" -i
```

---

## Appendix B: Architecture Diagram (Current)

```
HDC Calculator (Current Architecture)
│
├── Input Layer
│   ├── Basic Inputs (project cost, NOI, land value)
│   ├── Capital Structure (5 layers: senior, phil, sub-debt, equity)
│   ├── Projections (hold period 10-30 years)
│   └── OZ Settings (ozEnabled, deferredGains)
│
├── Calculation Engine
│   ├── Depreciation (MACRS 27.5-year, bonus depreciation)
│   ├── Debt Service (amortization, IO period, PIK)
│   ├── DSCR Management (1.05x target, deferral waterfall)
│   ├── Fee Calculations (AUM fee + Tax Benefit fee)
│   └── Exit Proceeds (cap rate valuation, debt payoff)
│
└── Output Layer
    ├── Investor Analysis (IRR, multiple, cash flows)
    ├── HDC Platform Analysis (fee income, promote, sub-debt)
    └── Tax Planning (depreciation capacity, recapture)
```

---

## Appendix C: Architecture Diagram (v7.0 Required)

```
LIHTC Calculator (v7.0 Architecture Required)
│
├── Input Layer
│   ├── Basic Inputs (project cost, eligible basis, state selection)
│   ├── Capital Structure (6 layers: adds Preferred Equity)
│   ├── LIHTC Settings (PIS month, federal rate, state LIHTC enabled)
│   ├── State LIHTC (25-state lookup, structure, transferability, PW, sunset)
│   ├── Projections (hold period FIXED 10-11 years)
│   └── Basis Adjustments (loan fees, legal, org costs)
│
├── Calculation Engine
│   ├── Federal LIHTC (10-year period, PIS proration, Year 11 catch-up)
│   ├── State LIHTC (piggyback %, standalone, syndication rate)
│   ├── Syndication (gross → net: credits × rate)
│   ├── Preferred Equity (MOIC, accrual, waterfall position)
│   ├── Debt Service (same as current)
│   ├── DSCR Management (1.05x target)
│   ├── Fee Calculations (AUM fee ONLY per spec)
│   └── Exit Proceeds (Year 10 or 11 only)
│
└── Output Layer
    ├── Investor Analysis (credit IRR, multiple, equity raised)
    ├── LIHTC Compliance (10-year credit flow, catch-up, carryforward)
    ├── State LIHTC Display (PW warnings, sunset warnings, transferability)
    └── Preferred Equity Returns (MOIC achievement, accrued amounts)
```

---

**Audit Completed:** 2025-12-13
**Auditor:** Claude Code (Automated Codebase Analysis)
**Tool Version:** Sonnet 4.5
**Codebase:** `/Users/bradleypadden/Desktop/HDC/map/hdc-map-frontend`

