# HDC Calculator - Calculation Flow Order

## Critical: Order of Operations

The calculation flow MUST follow this specific order to ensure proper results:

### Step 1: Calculate Interest Reserve
**Purpose**: Determine additional funding needed during construction/lease-up

```
Interest Reserve = Monthly Debt Service × Reserve Months

Included in Monthly Service:
- Senior Debt P&I
- Philanthropic Debt (if not current pay)
- Outside Investor Sub-Debt current pay portion (if enabled)
- HDC Sub-Debt current pay portion (if enabled)

NOT Included:
- Investor Sub-Debt (income to investor, not expense)
```

### Step 2: Calculate Effective Project Cost
**Purpose**: Determine total capital needed including reserves

```
Effective Project Cost = Base Project Cost + Predevelopment + Interest Reserve
```

### Step 3: Apply Capital Structure
**Purpose**: Calculate actual dollar amounts for each capital component

```
All percentages apply to EFFECTIVE project cost:
- Investor Equity = Effective Cost × Investor %
- Philanthropic Equity = Effective Cost × Phil %
- Senior Debt = Effective Cost × Senior %
- All sub-debts scale similarly
```

### Step 4: Calculate Depreciable Basis
**Purpose**: Determine amount eligible for depreciation deductions

```
Depreciable Basis = (Base Cost + Predevelopment) - Land Value - Investor Equity

Key Points:
- Interest reserve is NOT depreciable (financing cost)
- Investor equity (QCGs) must be excluded per IRS OZ rules
- Use EFFECTIVE cost for investor equity calculation
```

### Step 5: Calculate Depreciation & Tax Benefits
**Purpose**: Determine annual tax deductions and cash benefits

```
Year 1 Depreciation = Bonus + Partial MACRS (mid-month convention)
Annual Depreciation = Remaining Basis / 27.5 years (IRS MACRS)
Tax Benefit = Depreciation × Tax Rate
Net Benefit = Tax Benefit - (HDC Fee of 10%)
```

## Impact of Interest Reserve

When interest reserve increases (e.g., from enabling Outside Investor Current Pay):

1. **Effective Project Cost ↑** - More total capital needed
2. **Investor Equity Amount ↑** - Same % of larger cost
3. **Depreciable Basis ↓** - Higher equity exclusion
4. **Year 1 Depreciation ↓** - Lower basis to depreciate
5. **Year 1 Tax Benefit ↓** - Less depreciation
6. **Free Investment Hurdle ↑** - Higher equity to recover
7. **Year 1 Coverage % ↓** - Lower benefit / higher hurdle

## Example Calculation

```
Base Scenario:
- Project Cost: $50M
- Investor Equity: 20%
- No interest reserve

Effective Cost: $50M
Investor Equity: $50M × 20% = $10M
Depreciable Basis: $50M - $5M land - $10M equity = $35M
Year 1 Depreciation: $35M × 25% = $8.75M
Year 1 Tax Benefit: $8.75M × 47.85% = $4.19M
Year 1 Net Benefit: $4.19M - $0.42M fee = $3.77M
Coverage: $3.77M / $10M = 37.7%

With Interest Reserve ($2M):
- Same parameters + $2M reserve

Effective Cost: $52M
Investor Equity: $52M × 20% = $10.4M
Depreciable Basis: $50M - $5M land - $10.4M equity = $34.6M
Year 1 Depreciation: $34.6M × 25% = $8.65M
Year 1 Tax Benefit: $8.65M × 47.85% = $4.14M
Year 1 Net Benefit: $4.14M - $0.41M fee = $3.73M
Coverage: $3.73M / $10.4M = 35.9%
```

## Implementation Notes

### useHDCCalculations.ts
- Interest reserve calculated FIRST as standalone useMemo
- Effective project cost calculated immediately after
- Depreciation calculations use effective cost for equity
- Investment calculations use pre-calculated values

### calculations.ts & hdcAnalysis.ts
- Both files implement same logic independently
- Interest reserve included in effective project cost
- Proper exclusion of investor equity from basis

### UI Components
- BasicInputsSection calculates and displays reserve
- CapitalStructureSection shows amounts based on effective cost
- FreeInvestmentAnalysisSection shows coverage with proper hurdle

## Testing Verification

Run these tests to verify implementation:
```bash
npm test -- interest-reserve-impact.test.ts
npm test -- critical-business-rules.test.ts
npm test -- oz-depreciation-rule.test.ts
```

## Common Mistakes to Avoid

1. **DON'T** include interest reserve in depreciable basis
2. **DON'T** use base cost for investor equity calculation
3. **DON'T** calculate depreciation before interest reserve
4. **DON'T** forget to include current pay portions in reserve
5. **DON'T** include Investor Sub-Debt current pay in reserve

## Summary

The calculation flow is designed to create realistic economic trade-offs:
- More leverage → Higher interest reserve needed
- Higher reserve → Larger effective project cost
- Larger cost → More investor equity needed
- More equity → Less depreciable basis
- Less basis → Lower tax benefits
- Lower benefits → Longer time to free investment

This ensures the model properly reflects the cost of leverage and maintains mathematical consistency throughout all calculations.