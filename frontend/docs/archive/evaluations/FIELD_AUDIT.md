# HDC Calculator Field Audit - Complete List

## All Fields from HDCInputsComponentProps

### Basic Inputs
- [x] projectCost
- [x] landValue
- [x] yearOneNOI
- [x] yearOneDepreciationPct
- [x] opexRatio
- [x] interestReserveEnabled
- [x] interestReserveMonths
- [x] interestReserveAmount (calculated)

### Timing Parameters
- [x] constructionDelayMonths
- [x] taxBenefitDelayMonths

### Capital Structure - Balance Settings
- [x] autoBalanceCapital
- [x] investorEquityRatio

### Capital Structure - Equity
- [x] investorEquityPct
- [x] philanthropicEquityPct

### Capital Structure - Senior Debt
- [x] seniorDebtPct
- [x] seniorDebtRate
- [x] seniorDebtAmortization

### Capital Structure - Philanthropic Debt
- [x] philDebtPct
- [x] philDebtRate
- [x] philDebtAmortization
- [x] philCurrentPayEnabled
- [x] philCurrentPayPct

### Capital Structure - HDC Sub-Debt
- [x] hdcSubDebtPct
- [x] hdcSubDebtPikRate
- [x] pikCurrentPayEnabled
- [x] pikCurrentPayPct

### Capital Structure - Investor Sub-Debt
- [x] investorSubDebtPct
- [x] investorSubDebtPikRate
- [x] investorPikCurrentPayEnabled
- [x] investorPikCurrentPayPct

### Capital Structure - Outside Investor Sub-Debt
- [x] outsideInvestorSubDebtPct
- [x] outsideInvestorSubDebtPikRate
- [x] outsideInvestorPikCurrentPayEnabled
- [x] outsideInvestorPikCurrentPayPct

### Tax Rates
- [x] federalTaxRate
- [x] stateTaxRate
- [x] ltCapitalGainsRate
- [x] niitRate
- [x] selectedState
- [x] stateCapitalGainsRate
- [x] depreciationRecaptureRate (hardcoded to 25)

### HDC Fees & Financing
- [x] hdcFeeRate
- [x] aumFeeEnabled
- [x] aumFeeRate
- [x] hdcAdvanceFinancing
- [x] taxAdvanceDiscountRate
- [x] advanceFinancingRate
- [x] taxDeliveryMonths

### Projections
- [x] holdPeriod
- [x] revenueGrowth
- [x] expenseGrowth
- [x] exitCapRate
- [x] investorPromoteShare

### Opportunity Zone
- [x] ozType
- [x] deferredCapitalGains
- [x] capitalGainsTaxRate
- [x] deferredGains (calculated from investor equity)

## Fields to Double-Check

Based on user feedback, these fields were not saving/loading correctly:
1. **landValue** - Fixed with ?? operator
2. **interestReserveEnabled** - Fixed with ?? operator
3. **taxBenefitDelayMonths** (tax loss realization delay) - Fixed with ?? operator
4. **outsideInvestorSubDebtPct** - Fixed with ?? operator
5. **philCurrentPayEnabled** (Philanthropic debt current pay) - Fixed with ?? operator

## Implementation Status
- ✅ All fields added to save function
- ✅ All fields added to load function with ?? operator
- ✅ CalculatorConfiguration interface updated
- ✅ Proper default values set