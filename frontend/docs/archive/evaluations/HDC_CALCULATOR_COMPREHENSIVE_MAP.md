# HDC Calculator Comprehensive Map & Tax Strategy Integration Analysis

## 1. INPUT PARAMETERS & DATA TYPES

### Basic Project Inputs
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| projectCost | number | Default: $86M | Total project cost |
| landValue | number | Default: $10M | Land value (non-depreciable) |
| yearOneNOI | number | Default: $5.113M | Year 1 Net Operating Income |
| yearOneDepreciationPct | number | 0-100%, Default: 25% | Bonus depreciation percentage |
| opexRatio | number | 0-100%, Default: 25% | Operating expense ratio |
| holdPeriod | number | 10-30 years, Default: 10 | Investment hold period |

### Growth & Exit Parameters
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| revenueGrowth | number | Default: 3% | Annual revenue growth rate |
| expenseGrowth | number | Default: 3% | Annual expense growth rate |
| exitCapRate | number | Default: 6% | Exit capitalization rate |

### Capital Structure
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| investorEquityPct | number | 0-100%, Default: 14% | Investor equity percentage |
| philanthropicEquityPct | number | 0-100%, Default: 0% | Philanthropic equity percentage |
| seniorDebtPct | number | 0-100%, Default: 66% | Senior debt percentage |
| seniorDebtRate | number | Default: 5% | Senior debt interest rate |
| seniorDebtAmortization | number | 15-60 years, Default: 35 | Senior debt amortization period |
| philDebtPct | number | 0-100%, Default: 20% | Philanthropic debt percentage |
| philDebtRate | number | Default: 0% | Philanthropic debt rate |
| philDebtAmortization | number | 15-60 years, Default: 60 | Phil debt amortization |
| philCurrentPayEnabled | boolean | Default: false | Phil debt current pay toggle |
| philCurrentPayPct | number | 0-100%, Default: 50% | Phil debt current pay percentage |

### Sub-Debt Structure
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| hdcSubDebtPct | number | 0-100%, Default: 2% | HDC subordinate debt percentage |
| hdcSubDebtPikRate | number | Default: 8% | HDC sub-debt PIK rate |
| pikCurrentPayEnabled | boolean | Default: false | HDC sub-debt current pay toggle |
| pikCurrentPayPct | number | 0-100%, Default: 50% | HDC current pay percentage |
| investorSubDebtPct | number | 0-100%, Default: 2.5% | Investor sub-debt percentage |
| investorSubDebtPikRate | number | Default: 8% | Investor sub-debt PIK rate |
| investorPikCurrentPayEnabled | boolean | Default: false | Investor current pay toggle |
| investorPikCurrentPayPct | number | 0-100%, Default: 50% | Investor current pay percentage |
| outsideInvestorSubDebtPct | number | 0-100%, Default: 0% | Outside investor sub-debt |
| outsideInvestorSubDebtPikRate | number | Default: 8% | Outside investor PIK rate |
| outsideInvestorPikCurrentPayEnabled | boolean | Default: false | Outside investor current pay |
| outsideInvestorPikCurrentPayPct | number | 0-100%, Default: 0% | Outside investor current pay % |

### Tax Parameters
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| federalTaxRate | number | 10-37%, Default: 37% | Federal ordinary income tax rate |
| selectedState | string | Default: 'NY' | Selected state for taxes |
| stateTaxRate | number | 0-13.3%, Default: 10.9% | State ordinary income tax rate |
| stateCapitalGainsRate | number | 0-13.3%, Default: 10.9% | State capital gains rate |
| ltCapitalGainsRate | number | 0-20%, Default: 20% | Federal LTCG rate |
| niitRate | number | Default: 3.8% | Net Investment Income Tax |
| depreciationRecaptureRate | number | Default: 25% | Depreciation recapture rate |

### HDC Fees & Compensation
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| hdcFeeRate | number | 0-15%, Default: 10% | HDC fee on tax benefits |
| aumFeeEnabled | boolean | Default: false | AUM fee toggle |
| aumFeeRate | number | 0-2%, Default: 1% | Assets Under Management fee |
| investorPromoteShare | number | 0-100%, Default: 35% | Investor's share of promote |

### Timing Parameters
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| constructionDelayMonths | number | 0-36, Default: 0 | Construction period before NOI |
| taxBenefitDelayMonths | number | 0-36, Default: 0 | Tax benefit realization delay |
| hdcAdvanceFinancing | boolean | Default: false | HDC advance financing toggle |
| taxAdvanceDiscountRate | number | Default: 20% | Tax advance discount rate |
| advanceFinancingRate | number | Default: 8% | Advance financing interest rate |
| taxDeliveryMonths | number | Default: 12 | Months to tax benefit delivery |

### Opportunity Zone Parameters
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| ozType | string | 'standard' or 'rural' | OZ type |
| deferredCapitalGains | number | Default: $0 | Deferred capital gains amount |
| capitalGainsTaxRate | number | Default: 23.8% | Total capital gains tax rate |

### Interest Reserve
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| interestReserveEnabled | boolean | Default: false | Interest reserve toggle |
| interestReserveMonths | number | 1-24, Default: 12 | Interest reserve period |

### New Tax Strategy Parameters
| Parameter | Type | Range/Default | Description |
|-----------|------|---------------|-------------|
| investorTrack | string | 'rep' or 'non-rep' | Real Estate Professional status |
| passiveGainType | string | 'short-term' or 'long-term' | Type of passive gains |

## 2. CALCULATION FUNCTIONS & DEPENDENCIES

### Core Financial Calculations
```
calculateIRR(cashFlows, initialInvestment, holdPeriod)
├── Uses Newton-Raphson method
├── Handles negative and positive cash flows
└── Returns percentage (e.g., 15.5 for 15.5%)

calculateMonthlyPayment(principal, annualRate, years)
├── Standard amortization formula
├── Handles zero interest special case
└── Returns monthly payment amount

calculateRemainingBalance(principal, annualRate, years, paymentsMade)
├── Iterative principal reduction tracking
└── Returns remaining loan balance
```

### Main Analysis Functions
```
calculateFullInvestorAnalysis(params: CalculationParams)
├── Calculates investor cash flows year by year
├── Handles waterfall distributions
├── Manages PIK interest compounding
├── Applies tax benefit timing
├── Calculates DSCR for each year
├── Dependencies:
│   ├── calculateMonthlyPayment()
│   ├── calculateRemainingBalance()
│   └── calculateIRR()
└── Returns: InvestorAnalysisResults

calculateHDCAnalysis(params: HDCCalculationParams)
├── Calculates HDC-specific cash flows
├── Manages promote structures
├── Tracks AUM fee accruals
├── Handles philanthropic equity
├── Dependencies:
│   └── calculateMonthlyPayment()
└── Returns: HDCAnalysisResults
```

### Validation Functions
```
validatePIKInterestCalculation(params)
├── Ensures PIK calculations are correct
└── Guards against calculation errors

validateHDCZeroInvestment()
├── Confirms HDC has $0 initial investment
└── Critical business rule validation
```

## 3. OUTPUT VALUES & GENERATION

### Investor Analysis Outputs
| Output | Calculation | Description |
|--------|-------------|-------------|
| investorCashFlows | Year-by-year array | Annual cash flow details |
| exitProceeds | Exit value - debt - fees | Net proceeds at exit |
| totalInvestment | Initial equity investment | Total capital invested |
| totalReturns | Sum of all cash flows + exit | Total returns over hold period |
| multiple | totalReturns / totalInvestment | Equity multiple |
| irr | calculateIRR() | Internal Rate of Return |
| investorTaxBenefits | Sum of annual tax benefits | Total tax benefits received |
| investorOperatingCashFlows | Sum of operating cash flows | Operating period cash flows |
| remainingDebtAtExit | calculateRemainingBalance() | Debt balance at exit |
| dscr | NOI / Total Debt Service | Debt Service Coverage Ratio |

### HDC Analysis Outputs
| Output | Calculation | Description |
|--------|-------------|-------------|
| hdcCashFlows | Year-by-year array | Annual HDC cash flows |
| hdcExitProceeds | Promote share of exit | HDC's exit proceeds |
| hdcPromoteProceeds | Exit promote calculation | Promote at exit |
| totalHDCReturns | Sum of all HDC income | Total HDC returns |
| hdcMultiple | Returns / Investment ($0) | HDC equity multiple (∞) |
| hdcIRR | calculateIRR() on HDC flows | HDC's IRR |
| hdcFeeIncome | Sum of tax benefit fees | Total fee income |
| hdcAumFeeIncome | Sum of AUM fees | AUM fee income |

### Tax Calculations
| Output | Calculation | Description |
|--------|-------------|-------------|
| year1TaxBenefit | Depreciation × Tax Rate | Year 1 tax benefit |
| year1NetBenefit | Tax Benefit - HDC Fee | Net after HDC fee |
| totalTaxBenefit | Sum of all depreciation benefits | Total tax benefits |
| effectiveTaxRate | Federal + State rates | Combined tax rate |
| depreciationSchedule | Bonus + Straight-line | Depreciation timeline |

## 4. STATE MANAGEMENT & DATA FLOW

### State Management Structure
```
useHDCState() Hook
├── Basic State (projectCost, NOI, etc.)
├── Capital Structure State (equity, debt percentages)
├── Tax State (rates, deductions)
├── Timing State (delays, periods)
├── Validation State (errors, warnings)
└── UI State (expanded sections)

useHDCCalculations() Hook
├── Consumes state from useHDCState()
├── Calculates derived values
├── Runs validation checks
├── Dependencies:
│   ├── calculateFullInvestorAnalysis()
│   ├── calculateHDCAnalysis()
│   └── validation functions
└── Returns calculation results
```

### Data Flow Pattern
```
User Input → State Setters → useHDCState
    ↓
State Values → useHDCCalculations
    ↓
Calculation Functions → Results
    ↓
Results → UI Components → Display
```

## 5. VALIDATION RULES & CONSTRAINTS

### Capital Structure Validation
- Total capital structure must equal 100%
- Minimum DSCR: 1.05x
- Auto-balance maintains equity ratio when debt changes

### Business Rule Validations
- HDC initial investment must be $0
- Philanthropic debt is always interest-only
- Tax benefits go 100% to investor (never split by promote)
- Outside investor sub-debt paid before promote split

### Input Range Validations
- Percentages: 0-100%
- Interest rates: 0-20%
- Hold period: 10-30 years
- Construction delay: 0-36 months
- Tax delay: 0-36 months

## 6. TAX STRATEGY APP INTEGRATION POINTS

### Direct Outputs That Feed Tax Strategy
| HDC Output | Tax Strategy Usage |
|------------|-------------------|
| year1TaxBenefit | Initial tax loss for offset calculations |
| annualStraightLineDepreciation | Ongoing tax losses for multi-year planning |
| effectiveTaxRate | Tax savings calculations |
| investorTaxBenefits (array) | Year-by-year tax benefit timeline |
| depreciationSchedule | Detailed depreciation for tax planning |
| totalTaxBenefit | Total tax optimization potential |

### Key Integration Parameters
| Parameter | Purpose in Tax Strategy |
|-----------|------------------------|
| investorTrack ('rep'/'non-rep') | Determines passive loss limitations |
| passiveGainType | Type of gains to offset |
| federalTaxRate | Federal tax savings calculation |
| stateTaxRate | State tax savings calculation |
| ltCapitalGainsRate | Capital gains offset calculations |
| niitRate | Net investment income tax planning |

## 7. ADDITIONAL CALCULATIONS NEEDED FOR TAX STRATEGY

### Missing Tax Strategy Calculations
1. **Passive Activity Loss Limitations**
   - Need to model $25,000 special allowance
   - Phase-out for high-income non-REPs
   - Carryforward tracking

2. **Alternative Minimum Tax (AMT)**
   - Depreciation preference items
   - AMT crossover calculations
   - Parallel tax calculations

3. **State Non-Conformity Adjustments**
   - State-specific depreciation schedules
   - Non-conforming state adjustments
   - State-specific loss limitations

4. **Multi-Year Tax Planning**
   - Loss carryforward optimization
   - Timing of gain recognition
   - Tax bracket management

5. **Portfolio-Level Analysis**
   - Multiple property aggregation
   - Cross-property loss utilization
   - Consolidated tax planning

## 8. DATA GAPS & RECOMMENDATIONS

### Critical Data Gaps
1. **Interest Expense Deductions** - Currently not included in tax losses
2. **Operating Losses During Lease-Up** - Not modeled
3. **Management Fee Deductions** - Not included
4. **Rental Income Offset** - Losses not netted against income
5. **AMT Calculations** - Completely missing
6. **State Conformity Logic** - Assumes 100% conformity

### Integration Recommendations
1. **Create Tax Strategy Service**
   - Separate module for tax-specific calculations
   - Import core data from HDC Calculator
   - Add missing tax calculations

2. **Enhance Data Models**
   - Add PassiveActivityLoss interface
   - Add AMTCalculation interface
   - Add StateConformity interface

3. **Build Bridge Functions**
   ```typescript
   interface TaxStrategyBridge {
     hdcResults: InvestorAnalysisResults;
     taxProfile: InvestorTaxProfile;
     calculateOptimalStrategy(): TaxStrategy;
     projectTaxSavings(): TaxSavingsTimeline;
   }
   ```

4. **Add Tax Strategy Outputs**
   - Optimal loss utilization timeline
   - Tax savings by year
   - Break-even analysis
   - After-tax IRR comparison

### Priority Implementation Path
1. **Phase 1**: Direct data integration (use existing HDC outputs)
2. **Phase 2**: Add passive loss limitation logic
3. **Phase 3**: Implement AMT calculations
4. **Phase 4**: Add state non-conformity adjustments
5. **Phase 5**: Build portfolio-level analysis

## 9. TECHNICAL ARCHITECTURE RECOMMENDATIONS

### Proposed Tax Strategy Module Structure
```
/src/utils/TaxStrategy/
├── calculations.ts         # Core tax calculations
├── passiveLoss.ts         # Passive activity loss rules
├── amt.ts                  # AMT calculations
├── stateConformity.ts     # State-specific adjustments
├── optimizer.ts            # Tax optimization algorithms
└── bridge.ts              # HDC Calculator integration

/src/hooks/TaxStrategy/
├── useTaxStrategy.ts      # Main tax strategy hook
├── usePassiveLoss.ts      # Passive loss tracking
└── useAMT.ts              # AMT calculations

/src/components/TaxStrategy/
├── TaxStrategyAnalyzer.tsx    # Main component
├── PassiveLossTracker.tsx     # Loss limitation UI
├── AMTCalculator.tsx          # AMT analysis
└── TaxSavingsTimeline.tsx    # Visual timeline
```

### Data Flow for Integration
```
HDC Calculator Results
        ↓
Tax Strategy Bridge (bridge.ts)
        ↓
Tax Strategy Calculations
        ↓
Optimization Engine
        ↓
Tax Strategy Recommendations
```

## 10. VALIDATION & TESTING REQUIREMENTS

### Critical Test Scenarios
1. REP vs Non-REP investor paths
2. High-income phase-out scenarios
3. AMT crossover points
4. State conformity variations
5. Multi-year carryforward tracking
6. Portfolio aggregation logic

### Integration Test Points
- HDC Calculator → Tax Strategy data transfer
- Tax benefit timing alignment
- Depreciation schedule consistency
- Capital gains offset calculations
- After-tax return calculations

## CONCLUSION

The HDC Calculator provides a robust foundation for tax strategy analysis with comprehensive depreciation and tax benefit calculations. The main gaps are in specialized tax rules (passive loss limitations, AMT, state conformity) which should be implemented in a separate Tax Strategy module that consumes HDC Calculator outputs. The integration should be seamless with clear data bridges and consistent calculation methodologies.