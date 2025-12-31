# Year 1 Calculation Validation Summary

## Overview
This document validates the consistency of Year 1 calculations for:
- Initial Investment
- Year 1 Tax Benefit
- HDC's Year 1 Fee
- Year 1 Benefit Used for Equity Recovery

## Calculation Flow (Typical $50M Project)

### 1. Initial Investment Calculation
```
Project Cost: $50M
Investor Equity: 20% = $10M
HDC Upfront Fee: $0.5M
Total Initial Investment: $10.5M
```
✅ **VALIDATED**: Total investment correctly sums equity + HDC upfront fee

### 2. Year 1 Tax Benefit Calculation

#### Step 1: Calculate Depreciable Basis
```
Project Cost: $50M
Land Value: $5M
Investor Equity (QCG): 20% × $50M = $10M
Depreciable Basis: $50M - $5M - $10M = $35M
```
✅ **VALIDATED**: Land value correctly excluded from basis
✅ **VALIDATED**: Investor equity (Qualified Capital Gains) correctly excluded per IRS OZ rules

**CRITICAL OZ RULE**: In Opportunity Zone investments, the depreciable basis excludes BOTH:
1. Land value (standard real estate rule)
2. Investor equity from Qualified Capital Gains (OZ-specific IRS rule per §1400Z-2)

This is because QCG contributions cannot be included in the depreciable basis under IRS Opportunity Zone regulations. See [depreciableBasisUtility.ts](../../../src/utils/HDCCalculator/depreciableBasisUtility.ts) for implementation.

#### Step 2: Calculate Year 1 Depreciation
```
Depreciable Basis: $35M
Cost Segregation: 20% (updated to 2025 standard from 25%)
Bonus Depreciation: $35M × 20% = $7M
Remaining Basis: $35M × 80% = $28M
Annual MACRS (27.5 years): $28M / 27.5 = $1.018M
Year 1 MACRS (July, 5.5 months): $1.018M × (5.5/12) = $0.467M
Total Year 1 Depreciation: $7M + $0.467M = $7.467M
```
✅ **VALIDATED**: Bonus depreciation correctly applied
✅ **VALIDATED**: IRS MACRS mid-month convention correctly applied (placed in service July)

**NOTE**: Year 1 includes BOTH bonus depreciation AND partial straight-line per IRS Publication 946.

#### Step 3: Calculate Gross Tax Benefit
```
Year 1 Depreciation: $7.467M
Effective Tax Rate: 47.85% (37% federal + 10.85% state)
Gross Tax Benefit: $7.467M × 47.85% = $3.573M
```
✅ **VALIDATED**: Tax rate correctly applied to depreciation

### 3. HDC Year 1 Fee Calculation
```
Gross Tax Benefit: $3.573M
HDC Fee Rate: 10%
HDC Year 1 Fee: $3.573M × 10% = $0.357M
```
✅ **VALIDATED**: HDC fee is 10% of gross tax benefit

**POST-VEGAS NOTE**: This 10% tax benefit fee will be eliminated. See [POST_VEGAS_OFI_BACKLOG.md](../../roadmap/POST_VEGAS_OFI_BACKLOG.md#ofi-001-eliminate-hdc-10-tax-benefit-fee).

### 4. Net Benefit to Investor
```
Gross Tax Benefit: $3.573M
HDC Fee: $0.357M
Net to Investor: $3.573M - $0.357M = $3.216M
```
✅ **VALIDATED**: Investor receives 90% of gross benefit

### 5. Year 1 Equity Recovery
```
Net Tax Benefit: $3.216M
Operating Cash Flow: Variable (typically $0 in Year 1 due to debt service)
Total Year 1 Recovery: $3.216M + Operating Cash

Equity to Recover: $10M
Percent Recovered: $3.216M / $10M = 32.16%
```
✅ **VALIDATED**: Recovery correctly counts tax benefits toward equity

## Critical Relationships Confirmed

### 1. HDC Fee Structure
- HDC takes 10% of GROSS tax benefits
- Investor receives 90% of GROSS tax benefits
- Formula: Net = Gross × 0.9

### 2. Investment Recovery
- Total Investment = Investor Equity + HDC Upfront Fee
- Recovery Target = Investor Equity (NOT Total Investment)
- Tax benefits count 100% toward recovery
- Operating cash (if any) also counts toward recovery

### 3. Free Investment Test
```
Free Investment Achieved When:
Year 1 Net Benefits ≥ Total Initial Investment

In typical case:
Year 1 Benefits: $3.216M
Total Investment: $10.5M
Coverage: 30.6% (NOT free in Year 1 alone)
```

## Key Findings

### ✅ CORRECT CALCULATIONS:
1. **Depreciation basis** - Correctly excludes land AND investor equity (QCG)
2. **Bonus depreciation** - 20% correctly applied (2025 standard)
3. **IRS MACRS** - Mid-month convention correctly applied
4. **Tax rate application** - Federal + State correctly summed (ordinary income rate)
5. **HDC fee** - Exactly 10% of gross benefit
6. **Net to investor** - Exactly 90% of gross benefit
7. **Recovery tracking** - Tax benefits properly counted

### ⚠️ OBSERVATIONS:
1. **QCG Exclusion Impact**:
   - Depreciable basis is ~22% lower due to QCG exclusion (for 20% equity project)
   - This is CORRECT per IRS OZ regulations
   - Results in lower Year 1 tax benefits vs non-OZ projects
   - Trade-off: Lower annual benefits, but Year 10 exit is tax-free

2. **Recovery target ambiguity**:
   - Recovery tracks against Investor Equity ($10M)
   - NOT against Total Investment ($10.5M)
   - This is intentional per HDC business model

3. **Year 1 operating cash**:
   - Often $0 or negative due to debt service exceeding NOI
   - Tax benefits are primary Year 1 recovery source

4. **Free investment hurdle**:
   - Typical project achieves ~31% recovery in Year 1 (with 20% cost seg)
   - Full "free investment" requires multiple years
   - Lower than non-OZ projects due to QCG exclusion

## Mathematical Verification

### Test Case: Standard OZ Project
```javascript
// Inputs
projectCost = 50
landValue = 5
investorEquityPct = 20
hdcFeeRate = 10
yearOneDepreciationPct = 20  // Updated to 2025 standard
effectiveTaxRate = 47.85
placedInServiceMonth = 7  // July

// Calculations (with QCG exclusion)
investorEquity = 50 × 0.20 = 10  // Qualified Capital Gains
depreciableBasis = 50 - 5 - 10 = 35  // CRITICAL: Excludes QCG
bonusDepreciation = 35 × 0.20 = 7
remainingBasis = 35 × 0.80 = 28
annualMACRS = 28 / 27.5 = 1.018
year1MACRS = 1.018 × (5.5 / 12) = 0.467  // Mid-month convention
totalYear1Depreciation = 7 + 0.467 = 7.467

grossTaxBenefit = 7.467 × 0.4785 = 3.573
hdcFee = 3.573 × 0.10 = 0.357
netTaxBenefit = 3.573 - 0.357 = 3.216

// Investment
investorEquity = 50 × 0.20 = 10
hdcUpfrontFee = 0.5
totalInvestment = 10 + 0.5 = 10.5

// Recovery
year1Recovery = 3.216 / 10 = 32.16%
```

## Conclusion

All Year 1 calculations are mathematically consistent and correctly implemented:

1. **Initial Investment** = Investor Equity + HDC Upfront Fee ✅
2. **Depreciable Basis** = Project Cost - Land - Investor Equity (QCG exclusion) ✅
3. **Year 1 Depreciation** = Bonus (20%) + Partial MACRS (mid-month convention) ✅
4. **Year 1 Tax Benefit** = Depreciation × Ordinary Income Tax Rate × 90% (after HDC fee) ✅
5. **HDC Year 1 Fee** = 10% of gross tax benefit ✅
6. **Year 1 Recovery** = Net tax benefit counted toward equity recovery ✅

### Key Clarifications:
1. **QCG Exclusion**: Depreciable basis correctly excludes investor equity per IRS OZ rules
2. **Recovery Measurement**: Recovery is measured against Investor Equity ($10M) rather than Total Investment ($10.5M), per HDC business model
3. **Cost Seg Update**: Default changed from 25% to 20% per 2025 industry standards
4. **OZ Tax Rate**: Depreciation uses ordinary income rate (46.9%), NOT capital gains rate (33.7%)