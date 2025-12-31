# HDC Calculator - Comprehensive Calculation Logic & Validation

## CRITICAL: READ THIS FIRST
This document contains the validated mathematical logic for the HDC Calculator. Many design decisions may appear unconventional but are INTENTIONAL based on the HDC business model. DO NOT modify this logic without complete understanding and explicit approval.

## Example Structure Note
All examples use HDC's standard teaching structure for consistency and easy mental math:
- **Capital Stack**: 65% Senior Debt / 30% Philanthropic Debt / 5% Investor Equity
- **Dollar Example**: $65M / $30M / $5M on $100M total project cost
- **LTV**: 95% debt / 5% equity

*Note: Actual deals vary based on project specifics, lender requirements, and market conditions. This standardized structure is used for documentation clarity.*

## Terminology Clarification
To ensure clarity in the UI and calculations:
- **Tax Benefit Fees**: HDC's 10% fee on all tax benefits (cash savings from depreciation losses, NOT on the depreciation losses themselves)
  - Example: $22.5M depreciation × 47.9% tax rate = $10.78M tax benefit × 10% = $1.08M HDC fee
  - **CRITICAL**: HDC fee does NOT reduce distributable operating cash - it's a fee on tax benefits only
  - Shown separately in Distributable Cash Flow table for clarity
- **AUM Fee**: Optional Assets Under Management fee (0-2% annually)
  - Fixed annual amount: Project Cost × AUM Rate
  - Paid from operating cash when available
  - Unpaid amounts defer (accumulate) without interest
  - Deferred amounts collected at exit from investor's share only
- **HDC Fees**: When used generically, refers to all fees HDC collects
- **Promote Share**: HDC's percentage of distributions after investor equity recovery (typically 35% HDC, 65% investor)

## Report Generation Standards

### PDF Report Requirements
1. **Full Dollar Display**: All monetary values displayed as complete dollar amounts with comma separators
   - Example: $45,000,000 not $45M or $45
2. **Timestamp Format**: Pacific Time (PT) in 24-hour military format
   - Format: "MM/DD/YYYY HH:MM PT"
   - Example: "12/29/2024 14:30 PT"
3. **Number Scaling**: Calculation engine works in millions, reports multiply by 1,000,000
   - No rounding occurs - exact precision maintained
4. **Available Reports**:
   - **Comprehensive Report**: Full landscape analysis with all sections
   - **Tax Report**: Focused tax strategy analysis with cash flows
   - **Professional Report**: Executive-focused summary

## Core Business Model: "Free Investment in Affordable Housing"

### The Free Investment Principle (MOST CRITICAL)
- **Premise**: Investor achieves a "free investment" in affordable housing
- **Mechanism**: 100% of ALL cash flows go to investor until full equity recovery
- **HDC Role**: Earns fees and eventual promote WITHOUT capital contribution
- **Result**: Investor gets their money back, then shares upside with HDC

### Key Unconventional Design Decisions
1. **HDC has $0 initial investment** - This is CORRECT, not a bug
2. **Tax benefits go 100% to investor** - Never split by promote
3. **AUM fees accrue as PIK debt** when cash insufficient - INTENTIONAL
4. **Year 1 special handling** for bonus depreciation - INTENTIONAL
5. **Philanthropic equity is a grant** - Never repaid, not HDC equity
6. **20% cost segregation** - Industry standard (updated Jan 2025), not tied to specific tax year
7. **10% HDC fee on tax benefits** - Within market range (0-15%) for tax monetization
8. **1.05x DSCR minimum** - Below typical (1.20-1.35x), assumes affordable housing
   - **IMPORTANT**: DSCR includes Senior Debt, Philanthropic Debt, AND Outside Investor current pay
9. **65% HDC / 35% Investor promote split** - Higher HDC share compensates for $0 investment
10. **No interest-only period** - Model assumes immediate amortization from day 1
11. **QCG investor equity excluded from depreciation** - IRS rule for OZ investments, reduces basis by ~20%
12. **Calculations in millions, display in dollars** - Engine works in millions for efficiency, reports multiply by 1,000,000 for exact dollar display

### DSCR (Debt Service Coverage Ratio) Cash Management System

**CRITICAL CHANGE (v2.0)**: DSCR is now an EXACT TARGET, not a minimum threshold.

#### Core Principle: Maintain Exactly 1.05x DSCR
- **Target**: Exactly 1.05x coverage (not minimum)
- **Purpose**: Meet philanthropic lender covenant while maximizing distributions
- **Method**: Distribute ALL cash above 1.05x, defer payments below 1.05x

**DSCR = NOI / Hard Debt Service**

**Hard Debt Service includes ONLY:**
1. **Senior Debt Service** - Interest-only or P&I amortization payments (configurable)
   - **Interest-Only Period (IO)**: Optional 0-10 year period with interest-only payments
   - **After IO Period**: Switches to P&I amortization for remaining term
   - **Timing**: IO period starts at "placed in service" (after construction)
   - **Exit Balance**: Higher remaining balance with IO period
   - **Interest Reserve Benefit**: IO payment reduces interest reserve requirement during lease-up
2. **Philanthropic Debt Service** - Interest-only loan with optional current pay:
   - Without current pay: All interest accrues as PIK (no payments)
   - With current pay: Portion of interest paid currently, remainder accrues as PIK
   - **CRITICAL FIX (Dec 2024)**: Current pay INCREASES interest reserve (was backwards)
   - Principal remains outstanding until exit (no amortization)

#### Payment Priority Waterfall (v2.0)

**Available Cash = NOI - (Hard Debt Service × 1.05)**

**Payment Priority (when distributing available cash):**
1. **Outside Investor Current Interest** - Honor external commitments first
2. **Other Sub-Debt Current Interest** - Investor sub-debt, HDC sub-debt
3. **HDC AUM Fee** - Ongoing management fee
4. **HDC Tax Benefit Fee** - 10% of tax benefits
5. **Catch-up on Deferrals** - In reverse priority order
6. **Distributions** - To equity per promote split

**Deferral Priority (when maintaining 1.05x DSCR):**
When insufficient cash, defer in this order:
1. **First**: HDC Tax Benefit fees
2. **Second**: HDC AUM fees
3. **Third**: Other sub-debt current pay
4. **Last**: Outside investor current pay

**Catch-up Priority (paying deferred amounts):**
When excess cash available, pay deferrals in REVERSE order:
1. **First**: Outside investor deferrals + interest
2. **Second**: Other sub-debt deferrals + interest
3. **Third**: HDC AUM deferrals + interest
4. **Fourth**: HDC Tax Benefit deferrals + interest

**Interest on Deferrals:**
- **HDC Deferrals**: User-defined rate (default 8% annually), compounds monthly
- **Sub-Debt Deferrals**: Stated rate + optional default premium (e.g., +2%)
- **Purpose**: Compensate for time value and discourage chronic deferrals

**Key Insight**: The 5% cushion on TOTAL debt service creates substantial protection. Example: If total hard debt = $4M/year and outside investor needs $400k/year, the 5% cushion ($200k) provides 50% coverage of outside investor needs.

**SOFT PAY (NOT included in DSCR):**
All sub-debts are treated as "soft pay" and paid from available cash after hard debt service:
- **Outside Investor Sub-Debt** - Paid first in priority order (configurable)
- **HDC Sub-Debt** - Paid second in priority order (configurable)
- **Investor Sub-Debt** - Paid third in priority order (configurable)
- **AUM fees** - Paid after all debt service

**Minimum requirement: 1.05x** - This ensures the property generates enough income to cover all HARD debt payments with a 5% cushion. Soft pay debts are paid only from available cash after meeting this requirement.

### Soft Pay Waterfall (Operating Cash Flow)

After hard debt service is paid, remaining cash flows through the soft pay waterfall:

**Available Cash = NOI - Hard Debt Service**

**Payment Priority (Configurable):**
1. **First Priority** - Default: Outside Investor Sub-Debt current pay
2. **Second Priority** - Default: HDC Sub-Debt current pay
3. **Third Priority** - Default: Investor Sub-Debt current pay (this is income to investor)

**Key Mechanics:**
- Each sub-debt is paid in priority order from available cash
- If insufficient cash, unpaid amounts accrue to PIK balance
- PIK balances compound annually at the specified interest rate
- Priority order can be configured by user (ensures no payment conflicts)
- Current pay only applies in Year 2+ (Year 1 all interest accrues to PIK)

**PIK Compounding Effect:**
- PIK interest compounds on itself (interest on interest)
- Example: 14% PIK rate → ~14.7% annualized effective rate over 10 years
- Formula: Effective Rate = (Total Repayment ÷ Principal)^(1/years) - 1
- This higher effective rate reflects the true economic cost of PIK debt

### Interest Reserve Calculation

The interest reserve ensures positive cash flow during construction/lease-up:

**Interest Reserve Amount = Monthly Debt Service × Reserve Months**

**Included in Reserve:**
1. **Senior Debt Service** - IO payment if IO period covers reserve, otherwise P&I payment
   - **Optimization**: If interest reserve period ≤ IO period, uses lower IO payment
   - **Example**: 12-month reserve with 3-year IO uses IO payment (not P&I)
   - **Benefit**: Reduces interest reserve requirement by (P&I - IO) × reserve months
2. **Philanthropic Debt Service** - If not current pay enabled
3. **HDC Sub-Debt Current Pay** - Current pay portion only (if enabled)
4. **Outside Investor Sub-Debt Current Pay** - Current pay portion only (if enabled)

**NOT Included:**
- **Investor Sub-Debt Current Pay** - This is income to investor, not an expense

**Key Points:**
- Interest reserve is added to project cost
- All capital structure percentages apply to the increased project cost
- Prevents negative distributable cash flow during stabilization
- Ensures all debt obligations can be met during lease-up

### Exit Distribution Waterfall (CRITICAL ORDER)

The exit proceeds are distributed in strict order:

1. **Senior Debt Repayment** - First priority
2. **Philanthropic Debt Repayment** - Second priority (if any remains)
3. **All Sub-Debt Repayment** - Third priority, includes:
   - HDC Sub-Debt (with accumulated PIK interest and AUM fees)
   - Investor Sub-Debt (with accumulated PIK interest)
   - **Outside Investor Sub-Debt** (with accumulated PIK interest) - CRITICAL: Must be paid BEFORE promote split
4. **Promote Split** - Only AFTER all debt is paid:
   - Remaining proceeds split per promote agreement (typically 65% investor / 35% HDC)
   - This ensures Outside Investor Sub-Debt reduces both HDC and investor proceeds proportionally

**IMPORTANT**: Outside Investor Sub-Debt must be deducted from exit value before calculating promote. Failure to do so would overstate HDC's promote proceeds.

### Tax Loss Calculation Methodology (CRITICAL SIMPLIFICATIONS)

**IMPORTANT**: The model uses simplified tax loss calculations that may vary ±30-40% from actual results:

1. **Simplified Loss Calculation**: Model uses ONLY depreciation for tax losses
   - Does NOT include: Interest expense deductions (~$1.8M/year on typical project)
   - Does NOT include: Operating losses during lease-up
   - Does NOT include: Management fee deductions
   - Does NOT net against: Rental income that offsets losses
   - **Rationale**: Conservative simplification assuming depreciation exceeds net income

2. **Real Estate Professional Status**: Assumes ALL investors qualify per IRC §469(c)(7)
   - Allows unlimited passive loss deductions against ordinary income
   - No passive activity loss limitations applied
   - No $25,000 special allowance phase-out modeling
   - **Impact**: Critical assumption for high tax benefit realization

3. **State Tax Conformity**: Assumes 100% state conformity with federal depreciation
   - No adjustments for non-conforming states (CA, NY, others)
   - All states assumed to accept federal bonus depreciation
   - No state-specific depreciation schedules
   - **Impact**: May overstate benefits by 20-30% in non-conforming states

4. **No AMT Adjustments**: Model ignores Alternative Minimum Tax
   - Depreciation is an AMT preference item
   - Could reduce benefits by 15-20% for high-income investors
   - No modeling of AMT crossover points

5. **Instant Loss Utilization**: Assumes investors have sufficient other income
   - No modeling of loss carryforwards
   - No consideration of income limitations
   - Assumes 100% current-year utilization
   - **Impact**: May overstate Year 1-5 benefits if income insufficient

6. **Excess Capacity Calculation**: Simplified approach
   - Does not consider investor's actual other income
   - No tracking of unused losses for carryforward
   - Excess shown is theoretical, not actionable

**BOTTOM LINE**: These simplifications make the model easier to use but less precise. Actual tax benefits could be 30-40% higher (if including all deductions) or 30-40% lower (if limited by passive loss rules, AMT, or state non-conformity). Investors should consult tax advisors for precise calculations.

---

## Interest Reserve & Effective Project Cost

### CRITICAL: Interest Reserve Increases Total Capital Requirement
When interest reserve is enabled (for Year 1 lease-up):

1. **Calculate Interest Reserve Amount (S-Curve Adjusted):**
   ```
   Base Senior Debt = Project Cost × Senior Debt %
   Base Phil Debt = Project Cost × Phil Debt % (if current pay enabled)
   Base Outside Investor = Project Cost × Outside Investor % (if current pay enabled)

   For each month in reserve period:
     S-curve Occupancy = 1 / (1 + exp(-10 × (progress - 0.5)))
     Monthly NOI = Stabilized NOI × Occupancy / 12
     Monthly Shortfall = Max(0, Total Debt Service - Monthly NOI)

   Interest Reserve = Sum of all monthly shortfalls
   ```

   **KEY CHANGE (Dec 2024):** Interest reserve now sized to actual shortfall considering S-curve NOI ramp-up, not worst-case zero income

2. **Determine Effective Project Cost:**
   ```
   Effective Project Cost = Base Project Cost + Interest Reserve Amount
   ```

3. **Apply Capital Structure to EFFECTIVE Cost:**
   ```
   ALL percentages apply to Effective Project Cost:
   - Senior Debt Amount = Effective Cost × Senior Debt %
   - Phil Debt Amount = Effective Cost × Phil Debt %
   - Investor Equity = Effective Cost × Investor Equity %
   - HDC Sub-debt = Effective Cost × HDC Sub-debt %
   - All other capital components...
   ```

**IMPORTANT:** This creates a circular dependency that's resolved iteratively:
- Initial debt calculations determine interest reserve needed
- Interest reserve increases project cost
- Higher project cost increases all capital components proportionally
- The UI must show amounts based on EFFECTIVE project cost

**EXAMPLE:**
- Base Project Cost: $100M
- Senior Debt: 65% = $65M initially
- Interest Reserve calculated: $3.0M
- Effective Project Cost: $103M
- Senior Debt (final): 65% × $103M = $66.95M
- ALL other components scale similarly

**SAFEGUARD:** Interest reserve is funded proportionally through the capital structure, not just by senior debt.

---

## Opportunity Zone (OZ) Tax Treatment

### Tax Calculation Standards (Established January 2025)

**Step 6 Validation Standards** - These calculation parameters are validated and documented per Step 6 Tax Benefits Validation (see [STEP_6_TAX_BENEFITS_VALIDATION.md](../archive/validation-steps/STEP_6_TAX_BENEFITS_VALIDATION.md)):

#### 1. Cost Segregation Percentage: 20%
- **Definition**: Portion of building basis eligible for 100% bonus depreciation under §168(k)
- **Standard**: 20% (updated January 2025 from previous 25%)
- **Rationale**: Aligns with 2025 industry standards for multifamily residential
- **Variability**: Parameter is adjustable based on actual cost segregation study results
- **Typical Range**: 15-40% depending on property type and cost seg study
- **Application**: Used in Year 1 calculation only; remaining 80% depreciates via 27.5-year MACRS

#### 2. Capital Gains Rate Composition (OZ Year 5 Tax)
- **Formula**: Federal LTCG (20%) + NIIT (3.8%) + State Capital Gains Rate
- **Conforming State Example (Oregon)**: 20% + 3.8% + 9.9% = 33.7%
- **Non-Conforming State**: 20% + 3.8% + 0% = 23.8% (if state doesn't tax capital gains)
- **Bug Fix (January 2025)**: Added state capital gains component (previously omitted)
- **Impact**: More accurate Year 5 OZ tax calculation, especially for high-tax states
- **Source Authority**: Tax Foundation state conformity data + Novogradac OZ guidance

**Validation Note**: These standards are cross-referenced with six sigma accuracy tests (±0.1%) using Trace 4001 parameters. All calculations verified against independent hand calculations.

### CRITICAL: Two Separate Tax Calculations
The calculator handles TWO distinct tax situations that must NOT be conflated:

#### 1. OZ Deferred Capital Gains Tax (Year 5 Payment)
- **What**: Tax on PREVIOUS investment gains being rolled into OZ fund
- **Source**: Qualified capital gains from investor's prior investment/sale
- **Amount**: 100% of investor equity (in OZ funds, all equity = qualified gains)
- **Tax Rate**: Capital gains rate = Federal LTCG (20%) + NIIT (3.8%) + State Cap Gains
  - **Example (Oregon)**: 20% + 3.8% + 9.9% = 33.7%
  - **BUG FIX (Jan 2025)**: Now includes state capital gains component (was 23.8% federal+NIIT only)
- **Timing**: Due Year 5 after OZ investment
- **Step-Up Benefits (Key OZ Legislation Feature)**:
  - **Standard OZ**: 10% basis step-up (reduces taxable gains by 10%)
  - **Rural OZ**: 30% basis step-up (reduces taxable gains by 30%)
- **Calculation**:
  ```
  Taxable Gains = Deferred Gains × (1 - StepUp%)
  Year 5 Tax = Taxable Gains × CapGainsRate
  Tax Savings = Deferred Gains × StepUp% × CapGainsRate
  ```
- **IRR Impact**: Reduces Year 5 cash outflow, improving overall investor returns
- **Example**: $7M deferred gains with 10% step-up saves $166,600 in Year 5

#### 2. Depreciation Tax Benefits
- **What**: Tax savings from THIS property's depreciation
- **Source**: Depreciation deductions from current OZ property investment
- **Tax Rate**: Investor's ordinary income rate (37% federal + state)
- **Timing**: Annual throughout hold period (Year 1 bonus + straight-line)
- **Use**: Offsets investor's OTHER income (as real estate professionals)
- **Calculation**: `Annual Benefit = Depreciation × OrdinaryRate - HDCFee`

### Key Implementation Points:
1. **Always OZ**: Calculator assumes all investments are OZ (no toggle needed)
2. **Auto-population**:
   - Deferred gains = Investor equity (100% qualified gains in OZ fund)
   - NIIT auto-applied for 20% LTCG bracket investors
   - Capital gains rate = LTCG + NIIT + State (auto-calculated)
3. **State conformity**: Currently assumes conforming states (both federal and state deferred)
4. **Simplified UI**: Single dropdown for Standard vs Rural OZ selection
5. **Clear separation**:
   - Tax Planning section: Depreciation benefits only (ordinary income rate)
   - OZ section: Year 5 deferred gains tax only (capital gains rate)

### Future Enhancements:
- Non-conforming state handling (e.g., California requires immediate state tax payment)
- Acquisition bridge loan for tax benefit delay period
- 30-year full step-up to FMV provision

---

## UI/UX Structure (v1.6 Updates)

### Consolidated Tax Configuration
**Section: "Investor Tax Rates"** (formerly split into two sections)
- Federal Tax Rate (dropdown): For depreciation benefit calculations
- Long-Term Capital Gains Rate (dropdown): For OZ tax calculations
- NIIT Rate (auto-applied): 3.8% for 20% LTCG bracket, 0% otherwise
- Target State (dropdown): Conforming states with rates

**Removed Redundancies:**
- Eliminated "Deferred Gains" display field (auto-calculated from investor equity)
- Removed OZ Investment checkbox (always enabled)
- Combined "Investor Tax Profile" and "Tax Offset Rates" into single section

### Opportunity Zone Configuration
**Section: "Opportunity Zone Details"**
- Single dropdown: Standard OZ (10%) vs Rural OZ (30%)
- Year 5 Tax Payment display: Clean grid showing calculations
- All values auto-populated from investor equity and tax settings

---

## S-Curve Lease-Up Model (Dec 2024 Update)

### CRITICAL: Yearly Occupancy Uses Monthly Average, Not Midpoint

**The Problem:** Using midpoint of year (month 6 of 12) gave only 15.9% occupancy for Year 1
**The Solution:** Average all 12 monthly occupancy values for accurate yearly occupancy

### S-Curve Formula:
```
Occupancy(t) = 1 / (1 + exp(-10 × (progress - 0.5)))
where progress = month / total_lease_up_months
```

### Yearly Occupancy Calculation:
```javascript
// Year 1 (months 1-12 of 18-month lease-up)
let totalOccupancy = 0;
for (month = 1; month <= 12; month++) {
  progress = month / 18;
  occupancy = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
  totalOccupancy += occupancy;
}
yearlyAverage = totalOccupancy / 12;  // ≈31% for Year 1
```

### Impact:
- **Year 1 NOI**: Now ~31% of stabilized (was 15.9%)
- **Interest Reserve**: Sized to actual shortfall, not worst-case
- **Cash Flow**: More realistic during lease-up period

---

## Complete Order of Operations (Validated Mathematically)

### STEP 0: CALCULATE EFFECTIVE PROJECT COST

**CRITICAL: This calculation must happen FIRST as it affects all downstream calculations**

```
1. Calculate Interest Reserve Amount (S-Curve Adjusted):
   - Senior Debt Service = Amortized monthly payment on (Base Cost × Senior %)
   - Phil Debt Service = (Base Cost × Phil % × Rate × Current Pay %) / 12 (interest-only if current pay)
   - Outside Investor Current Pay = (Base Cost × OI % × PIK Rate × Current Pay %) / 12

   For each month in reserve period:
     - Calculate S-curve occupancy
     - Calculate monthly NOI = Stabilized NOI × Occupancy / 12
     - Monthly shortfall = Max(0, Total Debt Service - Monthly NOI)

   Interest Reserve = Sum of all monthly shortfalls (not worst-case)

2. Calculate Effective Project Cost:
   Effective Project Cost = Base Project Cost + Predevelopment Costs + Interest Reserve

3. Apply Capital Structure to Effective Project Cost:
   - Investor Equity = Effective Project Cost × Investor Equity %
   - Philanthropic Equity = Effective Project Cost × Phil Equity %
   - Senior Debt = Effective Project Cost × Senior Debt %
   - All other debt components scale similarly
```

**KEY POINT:** The interest reserve increases the total project cost, which then increases all capital components proportionally. This ensures the interest reserve is funded through the entire capital structure, not just debt.

### STEP 1: CALCULATE DEPRECIATION BASIS

**CRITICAL: Must use Effective Project Cost for investor equity calculation**

```
Depreciable Basis Calculation:
1. Total Project Cost (for basis) = Base Project Cost + Predevelopment Costs
   Note: Interest reserve is NOT included in depreciable basis (financing cost)

2. Investor Equity (for exclusion) = Effective Project Cost × Investor Equity %
   CRITICAL: Use EFFECTIVE project cost here, not base

3. Depreciable Basis = Total Project Cost - Land Value - Investor Equity
   - Land is never depreciable
   - Investor equity (QCGs in OZ) cannot be depreciated per IRS rules
```

**IMPACT OF INTEREST RESERVE:**
- When interest reserve increases → Effective project cost increases
- Higher effective cost → Higher investor equity amount
- Higher investor equity → Lower depreciable basis
- Lower basis → Lower depreciation → Lower tax benefits

This creates a natural economic trade-off: more leverage requires more interest reserve, which reduces tax benefits.

### STEP 2: CALCULATE OPERATING PERFORMANCE
```
Year 1:
- Revenue = NOI / (1 - OpEx Ratio)  [OpEx Ratio is one-time setting]
- Expenses = Revenue × OpEx Ratio
- NOI = Revenue - Expenses

Years 2-10:
- Revenue(n) = Revenue(n-1) × (1 + Revenue Growth)
- Expenses(n) = Expenses(n-1) × (1 + Expense Growth)  [Independent growth]
- NOI(n) = Revenue(n) - Expenses(n)
```

**VALIDATION PERFORMED:**
- OpEx Ratio = 25%, NOI = $1M → Revenue = $1.333M, Expenses = $333K ✓
- Year 2 with 3% growth each → Revenue = $1.373M, Expenses = $343K ✓

**SAFEGUARD:** OpEx Ratio ONLY applies Year 1. Do NOT apply annually.

---

### STEP 3: CALCULATE TAX BENEFITS & HDC FEES

#### Timing Parameters (UPDATED)
The system supports THREE independent timing parameters:

##### 1. Construction/Development Period (`constructionDelayMonths`)
- **Purpose**: Models time between investment and building placed in service
- **Range**: 0-36 months
- **Effects**:
  - NO rental income (NOI) during construction
  - NO depreciation during construction (building not yet in service)
  - Interest reserve should cover debt payments
  - After placed in service: NOI begins, depreciation starts

##### 2. Tax Benefit Realization Delay (`taxBenefitDelayMonths`)
- **Purpose**: Models delay between investment and when investor receives tax benefits
- **Range**: 0-24 months
- **Effects**:
  - Tax benefits delayed from investment date
  - Independent of building status (can be operational)
  - Common reasons: K-1 processing, tax year timing, partnership structure
  - HDC advance financing available when > 0

##### 3. Interest Reserve Period (`interestReserveMonths`)
- **Purpose**: Covers debt service during non-revenue period
- **Range**: 1-18 months
- **Effects**:
  - Funds added to project cost
  - Covers senior and philanthropic debt payments
  - Independent of construction/tax delays

#### Example Timeline Scenarios:

**Scenario A: Ground-Up Development**
- Construction: 18 months
- Tax Delay: 6 months
- Interest Reserve: 24 months
- Result: No NOI for 18 months, tax benefits start month 7, reserve covers 24 months debt

**Scenario B: Value-Add Acquisition**
- Construction: 0 months (already operational)
- Tax Delay: 12 months (partnership structure)
- Interest Reserve: 0 months
- Result: Immediate NOI, tax benefits delayed 1 year, operations cover debt

**Scenario C: Stabilized with Quick Close**
- Construction: 0 months
- Tax Delay: 0 months
- Interest Reserve: 0 months
- Result: Immediate NOI and tax benefits

#### Legacy Tax Benefit Delay Documentation
The system supports delaying tax benefit realization by 0-36 months:

**Key Concept**: Property depreciates immediately upon acquisition but investor may not receive tax benefits until later.

**Implementation:**
```
1. Depreciation Schedule (UNCHANGED):
   - Year 1: Bonus depreciation + partial MACRS (mid-month convention)
   - Years 2-27.5: Straight-line over 27.5 years (IRS Pub 946, Table A-6)
   - Depreciation accrues from property acquisition

2. Tax Benefit Realization (DELAYED):
   If taxBenefitDelayMonths = 0:
     - Benefits realized immediately as calculated

   If taxBenefitDelayMonths > 0:
     - Calculate delay in years: delayYears = floor(delayMonths / 12)
     - Calculate partial year: partialMonths = 12 - (delayMonths % 12)

     For each year's depreciation:
       - Shift benefit realization by delayYears
       - Apply partial year factor if applicable

   Example (12-month delay):
     - Year 1 depreciation: $1.8M
     - Year 1 tax benefit: $0 (delayed)
     - Year 2 tax benefit: $1.8M × tax rate (Year 1's benefit)
     - Year 3 tax benefit: Year 2's depreciation × tax rate
     - And so on...

3. HDC Advance Financing Override:
   If hdcAdvanceFinancing = true:
     - Ignore delay for investor cash flows
     - HDC provides immediate cash advance
     - Additional financing costs apply
```

**Impact on Returns:**
- Delays reduce IRR due to time value of money
- Total benefits remain the same (just timing changes)
- Multiple typically decreases slightly
- HDC advance can mitigate impact but adds cost

---

#### CRITICAL: Year 1 HDC Fee Calculation (Multi-Step Process)
```
Step 1: Calculate Depreciable Basis
- Effective Project Cost = Base Project Cost + Predevelopment + Interest Reserve
- Investor Equity = Effective Project Cost × Investor Equity %
- Depreciable Basis = (Base Project Cost + Predevelopment) - Land Value - Investor Equity
- Note: Interest reserve affects investor equity but is NOT in depreciable basis
- Example: $50M base + $2M predev + $1.8M reserve = $53.8M effective
          Investor equity: $53.8M × 20% = $10.76M
          Depreciable: ($50M + $2M) - $10M land - $10.76M equity = $31.24M

Step 2: Calculate Year 1 Depreciation
- Year 1 Depreciation = Depreciable Basis × Bonus Depreciation %
- Bonus Rate typically 25% (but can vary based on tax code)
- Example: $40M × 25% = $10M depreciation

Step 3: Determine Effective Tax Rate
- Federal Rate + State Rate (if conforming state)
- Example: 37% federal + 10.9% CA = 47.9% effective

Step 4: Calculate Year 1 Tax Benefit
- Tax Benefit = Year 1 Depreciation × Effective Tax Rate
- Example: $10M × 47.9% = $4.79M tax benefit

Step 5: Calculate Year 1 HDC Fee (CRITICAL)
- HDC Fee = Tax Benefit × 10% (FIXED RATE)
- Example: $4.79M × 10% = $479,000 HDC fee
- This appears as "Tax Benefit Fees" in HDC Cash Flow Model

Step 6: Calculate Net to Investor
- Net = Tax Benefit - HDC Fee
- Example: $4.79M - $479K = $4.311M to investor
```

#### Years 2-27.5 (Straight-Line Depreciation)
```
- Remaining Basis = Depreciable Basis - Year 1 Depreciation
- Annual Depreciation = Remaining Basis / 27.5 years (IRS MACRS for residential rental)
- Annual Tax Benefit = Annual Depreciation × Effective Tax Rate
- Annual HDC Fee = Annual Tax Benefit × 10%
- Net to Investor = Annual Tax Benefit - Annual HDC Fee
```

**VALIDATION EXAMPLE (Complete) - Updated Jan 2025:**
- Project: $100M, Land: $20M, Investor Equity: $5M (QCG excluded)
- Depreciable Basis: $100M - $20M - $5M = $75M (with QCG exclusion)
- Year 1: 20% cost seg = $15M bonus depreciation
- Remaining Basis: $75M × 80% = $60M
- Year 1 Partial MACRS: ($60M / 27.5) × (5.5/12) = $1.0M (July, mid-month convention)
- Total Year 1 Depreciation: $15M + $1.0M = $16M
- Tax Rate: 47.9% (37% fed + 10.9% state)
- Year 1 Tax Benefit: $16M × 47.9% = $7.66M
- Year 1 HDC Fee: $7.66M × 10% = $766K ✓
- Year 1 Net to Investor: $6.90M ✓

**CRITICAL SAFEGUARDS:**
1. Land value MUST be subtracted from project cost
2. HDC fee rate is ALWAYS 10% of tax benefits
3. Tax benefits NEVER split by promote - HDC gets fee only
4. Effective tax rate includes state ONLY if conforming state
5. Year 1 calculation uses bonus depreciation, not straight-line

---

### STEP 3: DEBT SERVICE & CASH FLOW
```
Each Year:
1. Calculate Debt Service:
   - Senior Debt = Monthly Payment × 12
   - Phil Debt = Current Pay portion OR Full Payment
   - Total Debt Service = Senior + Phil

2. Calculate DSCR:
   - DSCR = NOI / Total Debt Service
   - Must be ≥ 1.05 at stabilization (underwriting requirement)

3. Calculate Available Cash:
   - Cash After Debt = NOI - Debt Service
   - Cash After AUM = Cash After Debt - AUM Fee
   - Distributable Cash = Max(0, Cash After AUM)

4. Year 5 OZ Tax Payment (if OZ enabled):
   - Taxable Gains = Deferred Gains × (1 - StepUp%)
   - OZ Tax Due = Taxable Gains × Capital Gains Rate
   - Net Cash Flow = Distributable Cash - OZ Tax Due + Tax Benefits
   - Note: Depreciation benefits typically exceed OZ tax payment
```

**VALIDATION PERFORMED:**
- $65M senior @ 6%, 30yr = $4.674M/yr debt service ✓
- NOI $6.5M → DSCR = 1.17 ✓
- Cash available = $926K ✓

**SAFEGUARD:** Interest reserve covers debt during lease-up. Don't double-count.

---

### STEP 4: WATERFALL DISTRIBUTION (CRITICAL LOGIC)

#### Phase 1: Investor Recovery (Free Investment)
```
While (Equity Not Recovered):
  - ALL tax benefits → Investor (100%)
  - ALL operating cash → Investor (100%)
  - HDC Promote = $0
  - Track: Deferred HDC Promote for potential catch-up
```

#### Phase 2: HDC Catch-up (If Applicable)
```
After Equity Recovered, If HDC Deferred Fees > 0:
  - Tax benefits → Investor (100%)
  - Operating cash → HDC until caught up
  - Then normal split on remainder
```

#### Phase 3: Normal Promote Split
```
After Recovery & Catch-up:
  - Tax benefits → Investor (100%)  [NEVER SPLIT]
  - Operating cash → Split per promote (e.g., 35% Investor, 65% HDC)
  - Exit proceeds → Split per promote
```

**VALIDATION PERFORMED:**
- $5M equity, Year 1 recovery = $8.08M → Phase 1 complete, move to promote ✓
- Year 2 distribution = $1M → HDC gets 65% of $1M = $650K ✓

**SAFEGUARD:** Free investment MUST be achieved before HDC promote begins.

---

### STEP 5: PIK DEBT CALCULATIONS (COMPOUND INTEREST)

```
CORRECT Implementation:
Year 1: Balance = Principal
        Interest = Balance × Rate
        Current Pay = Interest × Current% (if enabled)
        PIK Accrual = Interest - Current Pay
        New Balance = Balance + PIK Accrual

Year 2: Interest = NEW BALANCE × Rate  [NOT original principal]
        ... compound from there
```

**CRITICAL FIX:** We fixed using initial principal → now uses current balance

**VALIDATION PERFORMED:**
- $5M PIK @ 8%, 50% current
- Year 1: $400K interest, $200K paid, $200K accrued, Balance = $5.2M ✓
- Year 2: $416K interest (on $5.2M), not $400K ✓

**SAFEGUARD:** ALWAYS calculate interest on current balance, not original.

---

## Sub-Debt Types and Treatment

### Three Types of Subordinated Debt
The HDC Calculator supports three distinct types of sub-debt, each with different economic impacts:

1. **HDC Sub-Debt**
   - Principal: % of effective project cost
   - Interest: PIK accrual (compounds annually)
   - Current Pay Option: Can pay portion as cash (reduces compounding)
   - Impact: Interest reduces investor cash flow
   - Exit: Full repayment to HDC

2. **Investor Sub-Debt**
   - Principal: % of effective project cost
   - Interest: PIK accrual (compounds annually)
   - Current Pay Option: Can pay portion as cash (reduces compounding)
   - Impact: Interest RECEIVED by investor (offsets cost)
   - Exit: Full repayment to investor (essentially returns to investor)

3. **Outside Investor Sub-Debt**
   - Principal: % of effective project cost
   - Interest: PIK accrual (compounds annually)
   - Current Pay Option: Can pay portion as cash (reduces compounding)
   - Impact: Interest paid to third party (reduces investor cash flow)
   - Exit: Full repayment to outside investor

### Sub-Debt Cash Flow Treatment
During the hold period:
- **Year 1**: All sub-debt interest accrues as PIK (no current pay)
- **Year 2+**: Current pay begins if enabled
- **Current Pay**: Reduces cash available to equity investors
- **PIK Accrual**: Compounds on remaining balance

### Total Cost of Outside Investor Debt
The calculator tracks:
- **Cash Interest Paid**: Sum of all current pay amounts
- **PIK Interest Accrued**: Compounded interest not paid as current
- **Total Interest Cost**: Cash paid + PIK accrued

## Outside Investor Sub-Debt - Validated Implementation (Sep 2025)

### Calculation Accuracy (Validated with $5.877M @ 14% / 50% Current Pay)

**Year-by-Year PIK Accumulation:**
```
Year 1: $5,877,050 × 14% = $822,787 interest
        Current Pay: $411,393 (reduces investor CF)
        PIK Accrual: $411,393 (adds to balance)
        New Balance: $6,288,443

Year 2: $6,288,443 × 14% = $880,382 interest (compounds on growing balance)
        Current Pay: $440,191 (reduces investor CF)
        PIK Accrual: $440,191 (adds to balance)
        New Balance: $6,728,635
```

**Key Validation Points:**
- ✅ Interest calculates exactly on principal and accumulated PIK
- ✅ Current pay reduces investor operating CF dollar-for-dollar
- ✅ PIK compounds annually on growing balance
- ✅ 5-year growth factor: 1.403x (40.3% total PIK accumulation)

### DSCR Integration & Waterfall Priority

**Payment Priority (Highest to Lowest):**
1. Senior Debt Service (always paid)
2. Philanthropic Debt Interest (always paid)
3. 1.05x DSCR Target Reserve
4. **Outside Investor Current Pay** (highest soft payment priority)
5. Other Sub-Debt Current Pay (HDC/Investor)
6. HDC Fees (Tax Benefit and AUM)

**Deferral Order (First to Last):**
1. HDC Tax Benefit Fees (first to defer)
2. HDC AUM Fees
3. HDC/Investor Sub-Debt Current Pay
4. **Outside Investor Current Pay (last to defer)**

**Stressed Scenario Behavior:**
When NOI < Required for all payments:
- Hard debt paid in full
- 1.05x DSCR maintained
- HDC fees defer first
- Outside investor defers only if absolutely necessary

### Impact on Distributable Cash Flow

**Current Pay Percentage Impact (Validated):**
| Current Pay % | Annual Payment | CF Reduction |
|--------------|----------------|--------------|
| 0%  | $0 | $0 |
| 25% | $205,697 | $205,697 |
| 50% | $411,393 | $411,393 |
| 75% | $617,090 | $617,090 |
| 100% | $822,787 | $822,787 |

**Finding:** Exact dollar-for-dollar reduction in investor operating cash flow
- **Total Repayment at Exit**: Principal + all accumulated interest

---

### STEP 6: EXIT CALCULATIONS

```
Exit Value = Final NOI / Exit Cap Rate

Debt Payoff Priority:
1. Senior Debt (remaining amortized balance)
2. Phil Debt (PIK balance if current pay, else amortized)
3. HDC Sub-debt (full PIK balance)
4. Investor Sub-debt (full PIK balance)
5. Outside Investor Sub-debt (full PIK balance)

Gross Proceeds = Exit Value - ALL Debts

CRITICAL: AUM Fee Settlement at Exit
- Gross proceeds are split per promote (e.g., 35% investor, 65% HDC)
- Accumulated unpaid AUM fees are deducted from INVESTOR'S share only
- HDC receives: Their promote share PLUS accumulated AUM fees
- Investor receives: Their promote share MINUS accumulated AUM fees

This ensures AUM fees are fully borne by the investor, not shared via promote split
```

**VALIDATION PERFORMED:**
- Exit Value $200M, Total Debt $82M → Net $118M ✓
- 65/35 split → HDC $76.7M, Investor $41.3M ✓

**SAFEGUARD:** ALL debt types must be paid before any distribution.

---

## HDC-Specific Calculations

### HDC Cash Flows Include:
1. **Tax Benefit Fees** - 10% of all depreciation tax benefits (Year 1 bonus + ongoing)
   - Year 1: Calculated from bonus depreciation (see STEP 2 above)
   - Years 2+: Calculated from straight-line depreciation
   - Displayed as "Tax Benefits from Fees" in HDC Analysis
   - Implementation: hdcAnalysis.ts lines 128-131
2. **AUM Fee Income** (when cash available)
   - Optional 0-2% annual fee on assets under management
   - Accrues as PIK debt when cash insufficient
   - Accumulated fees collected at exit from investor's share
3. **HDC Sub-Debt Interest** (if HDC sub-debt enabled)
   - PIK interest on HDC subordinated debt
   - **COMPOUNDS ANNUALLY**: Interest calculated on current balance, not original principal
   - Example: $10M at 8% → Year 1: $10.8M → Year 2: $11.66M → Year 3: $12.59M
   - Current pay option reduces compounding if enabled (paid portion doesn't compound)
4. **Promote Share** of operating cash (AFTER investor recovery)
   - Typically 65% HDC / 35% investor split after hurdle
   - **CRITICAL (Jan 2025)**: Equity recovery tracked using investor's `cumulativeReturns` from main calculation engine
   - Phase 1: 0% until `cumulativeReturns >= investorEquity` (net of HDC fees)
   - Phase 2: Catch-up for deferred promote (if applicable)
   - Phase 3: Normal promote split
   - **Single Source of Truth**: Uses investor equity value from main engine (includes interest reserve)
   - Implementation: hdcAnalysis.ts lines 265-297
5. **Exit Proceeds with Catch-up (Dec 2024 Update)**:
   - HDC gets catch-up for any deferred fees before normal promote split
   - Catch-up includes: Deferred tax benefit fees + Accumulated unpaid AUM fees
   - Distribution order:
     a. First dollars to HDC until catch-up satisfied
     b. Remaining proceeds split per promote (e.g., 65% HDC / 35% investor)
   - This ensures HDC eventually receives all earned fees despite DSCR deferrals
   - Promote share of net exit value
   - HDC sub-debt repayment (principal + accumulated PIK)
   - Accumulated AUM fees

### HDC Does NOT Include:
- Philanthropic equity (separate grant entity)
- Initial investment (always $0)
- Tax benefit promote (always 100% to investor)

---

## Investor Initial Investment & IRR Calculation

### CRITICAL FIX (January 2025): Initial Investment = Investor Equity ONLY

**Previous Error (FIXED):** Initial investment incorrectly included total HDC fees as upfront cost
**Correct Approach:** Initial investment equals investor equity contribution only

### Initial Investment Calculation:
```
Initial Investment = Investor Equity

WHERE:
Investor Equity = Effective Project Cost × Investor Equity %
Effective Project Cost = Base Project Cost + Predevelopment + Interest Reserve
```

**KEY PRINCIPLE:** HDC tax benefit fees (10% of depreciation benefits) are NOT upfront costs. They are paid annually from operating cash flows as tax benefits are realized.

### Why This Matters:
1. **Capital Stack Accuracy**: Initial investment represents actual cash needed to close
   - Senior debt + Phil debt + Sub-debt + Investor equity + Predevelopment = Total project cost
   - HDC fees are NOT part of the capital stack

2. **IRR Calculation**:
   ```
   Year 0: -Initial Investment (investor equity only)
   Years 1-10: Annual cash flows (tax benefits - HDC fees - operating distributions)
   Year 10: Exit proceeds + Sub-debt repayment
   ```

3. **No Double-Counting**: HDC fees were being:
   - ❌ WRONG: Added to initial investment AND deducted from annual cash flows
   - ✅ CORRECT: Deducted ONLY from annual cash flows (lines 1080-1082 in calculations.ts)

### HDC Fee Treatment in Cash Flows:
```typescript
// Year-by-year deduction (calculations.ts:1080-1082)
totalCashFlow = yearlyTaxBenefit + operatingCashFlow
                - hdcSubDebtCurrentPay
                + investorSubDebtInterestReceived
                - outsideInvestorCurrentPay
                - aumFeePaid
                - hdcTaxBenefitFeePaidInCash  // ← Deducted here
                + excessReserveDistribution
```

### Single Source of Truth:
All UI displays of investor equity now source from `mainAnalysisResults.investorEquity`:
- Capital Structure "Investor Equity (%)" label
- Free Investment Analysis "Investor Equity"
- Investor Analysis "Initial Investment"

**Implementation**: calculations.ts:255, calculations.ts:1174, calculations.ts:1213

---

## Promote Hurdle & Equity Recovery Tracking

### CRITICAL FIX (January 2025): Single Source of Truth for Equity Recovery

**Previous Error (FIXED):** HDC analysis recalculated investor equity using `baseProjectCost`, which excluded interest reserve, causing promote to trigger at wrong time.

**Correct Approach:** HDC analysis uses investor equity from main calculation engine (single source of truth).

### How Equity Recovery Works:

1. **Investor receives 100% of all cash flows** until equity recovered:
   - Tax benefits (net of HDC's 10% fee)
   - Operating cash flow (after debt service, AUM fees)
   - This is the "Free Investment" principle

2. **Recovery tracked via `cumulativeReturns`**:
   ```typescript
   // From investor cash flows (calculations.ts:1082-1085)
   totalCashFlow = yearlyTaxBenefit + operatingCashFlow
                   - hdcSubDebtCurrentPay + investorSubDebtInterestReceived
                   - outsideInvestorCurrentPay - aumFeePaid
                   - hdcTaxBenefitFeePaidInCash + excessReserveDistribution;
   cumulativeReturns += totalCashFlow;
   ```

3. **Promote triggers when**:
   ```typescript
   if (investorCumulativeReturns >= investorEquity) {
     hurdleMet = true;
     // HDC gets promote share of operating cash flow
     hdcPromoteShareOfCF = cashAfterDebtAndAumFee * (hdcPromoteShare / 100);
   }
   ```

### Key Implementation Details:

- **HDC analysis receives**: `investorEquity` from `mainAnalysisResults.investorEquity` (includes interest reserve)
- **HDC analysis accesses**: `investorCashFlows[year].cumulativeReturns` for hurdle check
- **No duplicate calculations**: HDC analysis does NOT recalculate equity or recovery
- **Tax benefits**: Always go 100% to investor, even after hurdle met (no promote on tax benefits)
- **Operating cash**: Split per promote (e.g., 65% HDC / 35% investor) after hurdle met

### Why This Matters:

**Example:**
- Investor Equity: $4.5M (includes $200K interest reserve)
- Year 1 Tax Benefit (net): $5.3M
- Year 1 Recovery: 118% ✓

If HDC analysis used `baseProjectCost` ($4.3M equity), it would think hurdle requires only $4.3M, causing promote to trigger too early or calculate incorrectly.

**Implementation**: hdcAnalysis.ts:65-67, hdcAnalysis.ts:267, hdcAnalysis.ts:276-278

---

## Implementation Safeguards

### 1. Code Comments Required
Every calculation must reference this document:
```typescript
// See HDC_CALCULATION_LOGIC.md Step 4: Waterfall Distribution
// Tax benefits ALWAYS 100% to investor per free investment principle
```

### 2. Test Coverage Requirements
- Each step must have mathematical validation tests
- Edge cases: DSCR < 1.0, negative cash flow, PIK accumulation
- Business logic tests: Free investment, HDC $0 investment

### 3. Change Protocol
Before modifying ANY calculation:
1. Review this complete document
2. Understand WHY current logic exists
3. Document proposed change with mathematical proof
4. Get explicit approval for business logic changes
5. Update this document FIRST, then code

### 4. Red Flags to Watch For
If you're about to:
- Give HDC promote before investor recovery → STOP
- Split tax benefits by promote → STOP
- Give HDC an initial investment → STOP
- Treat philanthropic equity as HDC equity → STOP
- Use original principal for PIK interest → STOP

---

## Known Edge Cases & Handling

### Small HDC Sub-debt Percentages (< 2%)
**Issue:** When HDC sub-debt is set to very small percentages (especially 1%), the resulting principal amount can be so small that floating-point precision issues occur in validation checks.

**Example:**
- Project Cost: $50M
- HDC Sub-debt: 1% = $500K principal
- After calculations, very small balances can trigger false validation errors

**Solution:**
- Skip PIK validation for principals < $100
- Use relative tolerance instead of absolute tolerance for small values
- Implemented in `validatePIKInterestCalculation` (calculationGuards.ts)

**DO NOT REMOVE THIS FIX** - It prevents application crashes for valid but edge-case inputs.

---

## Mathematical Validation Summary

| Component | Test Case | Expected | Result |
|-----------|-----------|----------|---------|
| OpEx Ratio | 40% ratio, $6.5M NOI | $4.33M expenses | ✓ |
| Tax Benefits | $18.75M depreciation, 47.9% rate | $8.08M to investor | ✓ |
| DSCR | $6.5M NOI, $5.574M debt | 1.17 ratio | ✓ |
| Waterfall | $5M equity, $8.08M recovered | Phase 1 complete | ✓ |
| PIK Interest | $30M @ 3%, Year 2 | $900K on $30M | ✓ |
| Exit Split | $118M net, 65/35 | $76.7M HDC | ✓ |
| OZ Standard | $5M deferred, 10% step-up, 34.7% rate | $1.56M Year 5 tax | ✓ |
| OZ Rural | $5M deferred, 30% step-up, 34.7% rate | $1.21M Year 5 tax | ✓ |

---

## Version History
- v1.0 (2024-01): Initial implementation with comprehensive validation
- Key Fix: PIK current pay calculation using dynamic balance
- Key Fix: Tax benefits 100% to investor, not split by promote
- Key Addition: HDC promote calculation after equity recovery
- v1.1 (2024-01): AUM Fee Accrual & Interest Reserve Updates
- v1.2 (2024-01): Critical Updates and Clarifications
  - **Tax Planning Capacity**: Now deducts Year 5 OZ tax payment from excess benefits for accurate net planning capacity
  - **Outside Investor Sub-Debt**: Properly deducted from exit value BEFORE promote split calculation (affects both HDC and investor proportionally)
  - **HDC Fee Clarification**: Documented that HDC's 10% fee is on tax BENEFITS (cash savings), not depreciation losses
  - **Outside Investor Metrics**: Added multiple on capital and annualized effective rate for clearer cost understanding
- Key Fix: AUM fees now accrue as PIK debt when cash insufficient
- Key Fix: Interest reserve properly increases effective project cost
- Key Addition: All capital structure percentages apply to effective cost when interest reserve enabled
- v1.2 (2024-01): AUM Fee Exit Distribution Fix
- Critical Fix: Accumulated AUM fees at exit are now deducted from investor's share only
- Previous bug: AUM fees were reducing gross proceeds, causing the promote split to incorrectly share the burden
- Now correct: HDC receives full AUM fees plus their promote share; investor bears full AUM fee cost
- v1.3 (2024-01): Terminology Clarification
- UI Update: "HDC Fees" clarified to "Tax Benefit Fees (10% of depreciation)" in UI
- v1.4 (2025-09): Outside Investor Sub-Debt Feature
- New Feature: Added third type of sub-debt for outside investors
- Tracks total cost including cash interest paid and PIK accrued
- Properly reduces investor cash flows and exit proceeds
- Documentation: Added terminology section to clarify different fee types
- Consistency: All references to the 10% depreciation fee now use "Tax Benefit Fee" terminology
- v1.4 (2024-01): Year 1 HDC Fee Calculation Documentation
- Critical Addition: Detailed 6-step calculation process for Year 1 HDC Fee
- Added complete validation example with real numbers
- Documented critical safeguards to prevent cascading errors
- Added code implementation references for traceability
- v1.5 (2025-09): Timing Parameters & HDC Display Fixes
- New Feature: Three independent timing parameters (construction, tax benefit, interest reserve)
- Fixed: HDC Analysis display showing zeros for income sources (property name mismatches)
- Enhanced: Documentation for HDC income sources and waterfall distribution
- Added: Clear separation between construction delay (affects NOI) and tax benefit delay
- v1.5 (2024-01): Small HDC Sub-debt Percentage Edge Case Fix
- Critical Fix: Application crash when HDC sub-debt set to exactly 1%
- v2.0 (2025-09): Major Improvements & Bug Fixes
  - **Fixed Year 1 Tax Benefit Double-Counting**: Removed duplicate display in InvestorCashFlowSection
  - **S-Curve Lease-Up Implementation**: Changed from midpoint (15.9%) to monthly average (~31%) for Year 1
  - **Interest Reserve Optimization**: Now sized to actual shortfall considering S-curve NOI (40-50% reduction)
  - **Fixed Philanthropic Debt Current Pay Logic**: Correctly excludes from interest reserve calculation
  - **Exit Proceeds Catch-Up Logic**: HDC now properly receives catch-up for deferred fees at exit
  - **Cash Flow Table Transparency**: Added OZ Year 5 Tax Payment column with explanatory notes
  - **Documentation Cleanup**: Removed 40 obsolete test files, updated all core documentation
- v2.1 (2025-09): Outside Investor Sub-Debt Validation
  - **Comprehensive Testing**: Validated all Outside Investor calculations with real-world parameters
  - **PIK Compounding**: Confirmed correct annual compounding on growing balance
  - **DSCR Integration**: Validated waterfall priority and deferral order
  - **Cash Flow Impact**: Confirmed dollar-for-dollar reduction from current pay
  - **Documentation**: Added detailed validation report and test coverage
- Root Cause: Very small principal amounts (< $100) cause floating-point precision issues in PIK validation
- Solution: Skip validation for amounts < $100 and use relative tolerance for small value comparisons
- Edge Case: When HDC sub-debt is 1% or other very small percentages
- Implementation: Modified validatePIKInterestCalculation in calculationGuards.ts
- v1.6 (2025-09): Opportunity Zone Integration & Tax Calculation Separation
- New Feature: Added Opportunity Zone basis step-up calculations per OBBBA 2025
- Standard OZ: 10% basis step-up after 5 years
- Rural OZ: 30% basis step-up after 5 years (simplified from QROF terminology)
- Auto-populates deferred gains from investor equity (100% qualified gains in OZ fund)
- Critical Fix: Separated depreciation tax benefits from OZ deferred gains tax
- Depreciation benefits: Use ordinary income rate, offset investor's OTHER income
- OZ deferred gains: Use capital gains rate, due Year 5 on rolled-over gains
- UI/UX Improvements:
  - Combined "Investor Tax Profile" and "Tax Offset Rates" into single "Investor Tax Rates" section
  - Removed OZ Investment checkbox (always enabled for OZ calculator)
- v1.7 (2025-09-22): OZ Depreciation Rule & Fee Clarifications
  - **Critical OZ Rule**: Documented that Qualified Capital Gains cannot be included in depreciable basis
  - **Formula Update**: Depreciable Basis = Project Cost - Land Value - Investor Equity
  - **HDC Fee Clarification**: HDC fee on tax benefits does NOT reduce distributable operating cash
  - **AUM Fee Documentation**: Fixed annual amount, deferred amounts don't compound
  - **PIK Interest**: Documented compound interest mechanics for sub-debt
  - **UI Updates**:
    - Distributable Cash Flow shows "AUM Paid" (actual cash paid)
    - HDC Cash Flow shows "AUM Def." column for deferred amounts
    - Added "Total Deferred AUM" summary display
  - Eliminated redundant "Deferred Gains" field display
  - NIIT auto-applies for high-income investors
  - Renamed section to "Opportunity Zone Details"
  - Cleaned up Year 5 tax payment display (removed background shading)
- Implementation: OpportunityZoneSection.tsx, TaxRatesSection.tsx, TaxPlanningCapacitySection.tsx

## Critical Code Implementation References

### Year 1 HDC Fee Calculation Chain:
1. **Depreciation Calculation**: `/hooks/HDCCalculator/useHDCCalculations.ts` lines 69-92
   - Calculates depreciable basis ((project cost + predevelopment costs) - land value)
   - Applies Year 1 bonus depreciation percentage
   - Calculates remaining basis for straight-line

2. **Tax Benefit Calculation**: `/hooks/HDCCalculator/useHDCCalculations.ts` lines 96-103
   - Applies effective tax rate to depreciation
   - Calculates HDC's 10% fee on tax benefits

3. **HDC Cash Flow Model**: `/utils/HDCCalculator/hdcAnalysis.ts` lines 128-136
   - Receives Year 1 depreciation from calculations
   - Applies effective tax rate
   - Calculates Year 1 HDC Fee (10% of tax benefit)
   - Records in HDC cash flow for Year 1

### Critical Dependencies:
- Land value MUST be set correctly (affects depreciable basis)
- Year One Depreciation % slider (typically 25% for bonus)
- Federal and State tax rates (determines effective rate)
- HDC Fee Rate (fixed at 10% but parameterized)

## Tax Planning Analysis Framework (ALWAYS ENABLED)

### Overview
The Tax Planning Analysis is the core feature of the HDC Calculator and is ALWAYS ENABLED.
It provides sophisticated modeling for two investor types:
1. **Real Estate Professionals (REPs)** - Subject to §461(l) limitations
2. **Non-REPs** - Unlimited passive loss offset capability

### REP Tax Planning Calculations

#### §461(l) Limitation Framework
```
Annual W-2 Offset Limit = $626,000 (married filing jointly)
Business Income Offset = Unlimited
Excess Losses → Net Operating Loss (NOL) Carryforward
```

#### REP Capacity Calculation
1. **W-2 Income Offset**:
   - Limited to min($626,000, W-2 Income)
   - Excess becomes NOL carryforward

2. **Business Income Offset**:
   - No limitation on business/rental income
   - Full offset available immediately

3. **IRA Conversion Planning**:
   - Converts Traditional IRA → Roth IRA
   - Uses available tax capacity
   - 10-year conversion strategy to match OZ hold

### Non-REP Tax Planning Calculations

#### Passive Activity Loss Rules
```
Passive Losses can ONLY offset Passive Gains
BUT: No annual limitation on offset amount
Perfect for: Stock sales, crypto gains, fund distributions
```

#### Non-REP Capacity Calculation
1. **Passive Income Offset**:
   - UNLIMITED annual capacity
   - Immediate full utilization
   - No carryforward complexity

2. **Capital Gains Strategy**:
   - Time large gain events with HDC investment
   - Eliminate taxes on entire gain amount
   - Works for both short-term and long-term gains

### Depreciation Schedule Integration

#### CRITICAL OZ RULE: Qualified Capital Gains Exclusion
**In Opportunity Zone investments, investor equity from Qualified Capital Gains (QCGs) CANNOT be included in depreciable basis per IRS rules.**

Since this is an OZ investment platform where 100% of investor equity comes from QCGs:
```
Depreciable Basis = (Project Cost + Predevelopment Costs) - Land Value - Investor Equity
```

This reduces the depreciable basis by the investor's equity percentage (typically 20% of project cost).

#### 10-Year Schedule Calculation
```
Year 1: 25% Bonus Depreciation (Cost Segregation) on REDUCED basis
Years 2-10: Straight-line on remaining REDUCED basis
Example: $50M project, 20% investor equity, $5M land
  Old (incorrect): ($50M - $5M) = $45M depreciable
  New (correct): ($50M - $5M - $10M QCGs) = $35M depreciable
  Impact: 22% reduction in depreciation benefits
```

#### Tax Benefit Flow
1. Calculate annual depreciation
2. Apply effective tax rate (Federal + State)
3. Subtract HDC fee (10%)
4. Apply to investor's tax situation
5. Track cumulative benefits

### Break-Even Analysis

#### Free Investment Calculation
```
If Year 1 Net Benefit ≥ Investor Equity → Free Investment (Year 1)
Otherwise:
  Remaining = Investor Equity - Year 1 Benefit
  Years to Break-Even = 1 + (Remaining / Annual Benefit Years 2+)
```

### State Conformity Adjustments
- Some states don't conform to federal bonus depreciation
- Adjustment applied to state tax benefit calculation
- Tracked separately in depreciation schedule

## Contact for Questions
Before making changes, consult with:
- Finance team for business logic
- Original implementation team for context
- Review finance-validation-agent.ts for detailed test cases

---

## v2.1 Changelog (January 2025)

### Major Enhancement: 1.05x DSCR Target Cash Management System

#### Core Changes
1. **DSCR Target Model**
   - Changed from "minimum 1.05" to "EXACTLY 1.05" DSCR
   - System distributes ALL cash above 1.05x coverage
   - Protects philanthropic lender covenant while maximizing distributions

2. **Payment Priority Waterfall**
   ```
   Priority Order (when paying):
   1. Outside Investor Sub-Debt Current Pay (highest priority)
   2. Other Sub-Debt Current Pay (HDC, Investor)
   3. HDC AUM Fee
   4. HDC Tax Benefit Fee
   5. Equity Distributions
   ```

3. **Deferral Mechanism**
   ```
   Deferral Order (when cash constrained):
   1. HDC Tax Benefit Fee (first to defer)
   2. HDC AUM Fee
   3. Other sub-debt current pay
   4. Outside investor current pay (last to defer)
   ```

4. **Multiple DSCR Checkpoints**
   - **Hard DSCR**: NOI ÷ (Senior + Philanthropic Debt)
   - **Sub DSCR**: NOI ÷ (Hard Debt + All Sub-Debt)
   - **Final DSCR**: Maintained at exactly 1.05x through cash management

5. **Enhanced UI Display**
   - New column structure showing progressive DSCR impact
   - Color coding for payment status (orange = partial, red = deferred)
   - Clear visibility of cash flow through waterfall

#### Implementation Files Modified
- `/src/utils/HDCCalculator/calculations.ts` - Core waterfall logic
- `/src/types/HDCCalculator/index.ts` - Added targetDscr field
- `/src/components/HDCCalculator/results/DistributableCashFlowTable.tsx` - New UI
- `/src/utils/HDCCalculator/hdcAnalysis.ts` - Deferred fee tracking

#### Key Benefits
- **Covenant Compliance**: Always maintains 1.05 DSCR
- **Cash Optimization**: Distributes maximum possible while safe
- **Transparency**: Clear priorities and automatic mechanisms
- **Investor Protection**: Outside investors paid first, caught up first

---

END OF DOCUMENT - DO NOT MODIFY WITHOUT APPROVAL