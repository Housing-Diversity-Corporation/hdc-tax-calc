# HDC Calculator Configuration Fields Documentation

## ⚠️ IMPORTANT: Keep This Document Updated
**When adding ANY new input field to the HDC Calculator, you MUST update:**

### 1. **CalculatorConfiguration Interface**
   - File: `/src/services/calculatorService.ts`
   - Add the new field to the interface

### 2. **Save Function**
   - File: `/src/components/HDCCalculator/HDCInputsComponent.tsx`
   - Function: `handleSaveConfiguration`
   - Add the field to the `currentConfig` object

### 3. **Load Function**
   - File: `/src/components/HDCCalculator/HDCInputsComponent.tsx`
   - Function: `handlePresetSelect` (saved configs section)
   - Add the field loading with appropriate defaults

### 4. **Component Props**
   - File: `/src/components/HDCCalculator/HDCInputsComponent.tsx`
   - Interface: `HDCInputsComponentProps`
   - Add the field and its setter

### 5. **This Documentation**
   - Add the new field to the list below

---

## 📋 Complete List of Configuration Fields

Last Updated: 2025-09-20 (v1.6 - Added Predevelopment Costs)

### Basic Inputs
- [ ] `configurationName` - Name of saved configuration
- [ ] `projectCost` - Total project cost
- [ ] `predevelopmentCosts` - Predevelopment costs (architecture, engineering, permits, etc.)
- [ ] `landValue` - Land value
- [ ] `yearOneNOI` - Year 1 Net Operating Income
- [ ] `yearOneDepreciationPct` - Year 1 depreciation percentage
- [ ] `opexRatio` - Operating expense ratio
- [ ] `holdPeriod` - Investment hold period

### Growth & Exit Parameters
- [ ] `revenueGrowth` - Revenue growth rate
- [ ] `expenseGrowth` - Expense growth rate
- [ ] `exitCapRate` - Exit capitalization rate

### Capital Structure - Equity
- [ ] `investorEquityPct` - Investor equity percentage
- [ ] `philanthropicEquityPct` - Philanthropic equity percentage

### Capital Structure - Senior Debt
- [ ] `seniorDebtPct` - Senior debt percentage
- [ ] `seniorDebtRate` - Senior debt interest rate
- [ ] `seniorDebtAmortization` - Senior debt amortization period
- [ ] `seniorDebtIOYears` - Senior debt interest-only period (0-10 years, default 0)

### Capital Structure - Philanthropic Debt
- [ ] `philDebtPct` - Philanthropic debt percentage
- [ ] `philDebtRate` - Philanthropic debt interest rate
- [ ] `philDebtAmortization` - Philanthropic debt amortization period
- [ ] `philCurrentPayEnabled` - Whether philanthropic debt has current pay
- [ ] `philCurrentPayPct` - Philanthropic debt current pay percentage

### Capital Structure - HDC Sub-Debt
- [ ] `hdcSubDebtPct` - HDC subordinate debt percentage
- [ ] `hdcSubDebtPikRate` - HDC sub-debt PIK interest rate
- [ ] `pikCurrentPayEnabled` - Whether HDC sub-debt has current pay
- [ ] `pikCurrentPayPct` - HDC sub-debt current pay percentage

### Capital Structure - Investor Sub-Debt
- [ ] `investorSubDebtPct` - Investor subordinate debt percentage
- [ ] `investorSubDebtPikRate` - Investor sub-debt PIK interest rate
- [ ] `investorPikCurrentPayEnabled` - Whether investor sub-debt has current pay
- [ ] `investorPikCurrentPayPct` - Investor sub-debt current pay percentage

### Capital Structure - Outside Investor Sub-Debt
- [ ] `outsideInvestorSubDebtPct` - Outside investor sub-debt percentage
- [ ] `outsideInvestorSubDebtPikRate` - Outside investor sub-debt PIK rate
- [ ] `outsideInvestorPikCurrentPayEnabled` - Whether outside investor sub-debt has current pay
- [ ] `outsideInvestorPikCurrentPayPct` - Outside investor sub-debt current pay percentage

### Interest Reserve
- [ ] `interestReserveEnabled` - Whether interest reserve is enabled
- [ ] `interestReserveMonths` - Number of months for interest reserve
- [ ] `interestReserveAmount` - Calculated interest reserve amount

### Tax Rates
- [ ] `federalTaxRate` - Federal ordinary income tax rate
- [ ] `selectedState` - Selected state for tax calculations
- [ ] `stateCapitalGainsRate` - State capital gains tax rate
- [ ] `ltCapitalGainsRate` - Long-term capital gains rate
- [ ] `niitRate` - Net Investment Income Tax rate
- [ ] `depreciationRecaptureRate` - Depreciation recapture rate (default: 25%)
- [ ] `deferredGains` - Calculated deferred gains amount

### HDC Fees & Compensation
- [ ] `hdcFeeRate` - HDC fee rate on tax benefits
- [ ] `aumFeeEnabled` - Whether AUM fee is enabled
- [ ] `aumFeeRate` - AUM fee rate percentage
- [ ] `investorPromoteShare` - Investor's share of promote (vs HDC)

### Tax Timing & Financing
- [x] `constructionDelayMonths` - Construction period before building placed in service (affects NOI)
- [x] `taxBenefitDelayMonths` - Delay in tax benefit realization from investment date
- [x] `hdcAdvanceFinancing` - Whether HDC provides advance financing for delayed tax benefits
- [x] `taxAdvanceDiscountRate` - Tax advance discount rate
- [x] `advanceFinancingRate` - Advance financing interest rate
- [x] `taxDeliveryMonths` - Months until tax benefits realized

### Opportunity Zone Settings
- [x] `ozType` - Type of OZ (standard or rural)
- [x] `deferredCapitalGains` - Amount of deferred capital gains
- [x] `capitalGainsTaxRate` - Total capital gains tax rate

### Investor Tax Strategy (Added 2025-09-20)
- [ ] `investorTrack` - Investor track: 'rep' (Real Estate Professional) or 'non-rep' (Non-REP)
- [ ] `passiveGainType` - Type of passive gains to offset: 'short-term' or 'long-term' (only for Non-REPs)

### Tax Planning Analysis (Added 2025-09-20, ALWAYS ENABLED)
- [x] `includeDepreciationSchedule` - Tax planning analysis (ALWAYS TRUE - core feature)
- [ ] `w2Income` - REP's annual W-2 income (subject to §461(l) limitation)
- [ ] `businessIncome` - REP's business/rental income (no §461(l) limitation)
- [ ] `iraBalance` - Traditional IRA balance for conversion planning (REP)
- [ ] `passiveIncome` - Non-REP's annual passive income (unlimited offset capacity)
- [ ] `assetSaleGain` - Non-REP's capital gains to offset (stocks, crypto, fund exits)

### Additional Settings
- [x] `stateTaxRate` - State ordinary income tax rate
- [x] `autoBalanceCapital` - Whether to auto-balance capital structure
- [x] `investorEquityRatio` - Ratio for auto-balancing equity

---

## 🔍 How to Test After Adding a Field

1. Add the new field value in the UI
2. Save the configuration with a descriptive name
3. Change the field value to something else
4. Load the saved configuration
5. Verify the field value was restored correctly

## 🐛 Common Issues

1. **Field not saving**: Check `handleSaveConfiguration` in HDCInputsComponent
2. **Field not loading**: Check `handlePresetSelect` in HDCInputsComponent
3. **TypeScript errors**: Update the `CalculatorConfiguration` interface
4. **Default values**: Ensure proper defaults in load function for backward compatibility

---

## 📝 Notes

- Always use optional chaining (`?.`) when setting values that might not exist in older configs
- Provide sensible defaults for backward compatibility
- Calculated fields (like `interestReserveAmount`) may not need direct setters
- Some fields are auto-calculated based on others (like `deferredGains`)