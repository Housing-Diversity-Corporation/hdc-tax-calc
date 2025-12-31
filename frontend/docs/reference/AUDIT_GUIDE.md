# HDC Calculator Audit Guide

## For Financial Auditors

### 1. System Architecture
- **Single Source of Truth**: All calculations happen in `/src/utils/HDCCalculator/calculations.ts`
- **No Duplicate Logic**: UI components only display results, never calculate
- **Version Controlled**: Full git history of all calculation changes

### 2. Key Files to Review

#### Core Calculation Engine
- `/src/utils/HDCCalculator/calculations.ts` - The entire math engine
- `/src/utils/HDCCalculator/HDC_CALCULATION_LOGIC.md` - Business rules documentation

#### Test Coverage
- `/src/utils/HDCCalculator/__tests__/` - All test scenarios
- Run `npm test -- --coverage` to generate coverage report

#### Data Flow
1. User inputs → State management (`useHDCState.ts`)
2. State → Calculation engine (`calculations.ts`)
3. Results → Display components (read-only)

### 3. Payment Waterfall Priority

The system enforces strict payment priority:
1. Outside Investor Sub-Debt (Priority 1)
2. Other Sub-Debt - HDC & Investor (Priority 2)
3. HDC AUM Fee (Priority 3)
4. HDC Tax Benefit Fee (Priority 4)
5. Equity distributions (Priority 5)

### 4. DSCR Covenant Management

- Target: 1.05x coverage ratio
- Enforced before ANY soft payments
- Automatic deferrals when covenant at risk
- All deferrals accrue interest

### 5. Interest Accrual

All deferred amounts accrue at specified rates:
- Sub-debt PIK: Individual rates per debt type
- Deferred fees: HDC Deferred Interest Rate (default 8%)
- Compound annually

### 6. Tax Calculations

#### Depreciation
- Year 1: Bonus depreciation (configurable %)
- Years 2-27.5: Straight-line
- All benefits flow through at investor's effective tax rate

#### OZ Benefits
- 10% step-up (standard) or 30% (rural) at Year 5
- Year 5 tax payment on adjusted gains
- Year 10: Full tax exemption on appreciation

### 7. Audit Trace Generation

Use the audit trace generator:
```typescript
import { generateFullAuditPackage } from './utils/HDCCalculator/auditTrace';

const auditPackage = generateFullAuditPackage(calculationParams);
// Exports complete calculation trace with formulas
```

### 8. Testing & Validation

Run comprehensive tests:
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suites
npm test calculations.test.ts
npm test oz-year5-tax.test.ts
npm test dscr-management.test.ts
```

### 9. Key Validations to Perform

1. **DSCR Compliance**
   - Verify all years maintain ≥1.05x coverage
   - Check deferral triggers are correct

2. **Interest Calculations**
   - Verify PIK compounds correctly
   - Check deferred fee interest accrual

3. **Tax Benefits**
   - Validate depreciation schedules
   - Confirm OZ step-up calculations
   - Check effective tax rate application

4. **Payment Waterfall**
   - Confirm priority order is maintained
   - Verify catch-up payments only for current pay portions
   - Check intentional PIK remains deferred

5. **Exit Calculations**
   - Verify all deferred amounts are collected
   - Check waterfall distribution is correct
   - Validate IRR calculations

### 10. Common Audit Queries

**Q: Where does the 1.05x DSCR target come from?**
A: Industry standard for senior debt covenants, enforced in calculations.ts lines 400-450

**Q: How is interest compounded on PIK debt?**
A: Annually, added to principal balance, see calculations.ts line 350-380

**Q: What happens when cash is insufficient?**
A: Payment waterfall automatically defers in priority order (reverse of payment order)

**Q: How are catch-up payments handled?**
A: Only deferred current pay portions are caught up, not intentional PIK

## Data Integrity Checks

1. **Input Validation**
   - All percentages between 0-100
   - Positive values for costs and rates
   - Hold period ≥ 1 year

2. **Calculation Verification**
   - Total sources = Total uses
   - Cash flows balance each year
   - IRR convergence check

3. **Output Consistency**
   - Year-over-year growth rates applied correctly
   - Cumulative returns match annual cash flows
   - Exit proceeds include all deferred amounts

## Regulatory Compliance

- **Tax Calculations**: Based on current IRS code
- **OZ Regulations**: Follows Treasury Reg §1.1400Z-2
- **Interest Rates**: Market-based and documented
- **Fee Structures**: Transparent and auditable

## Contact for Audit Support

For technical questions about the calculation engine:
- Review: `/src/utils/HDCCalculator/HDC_CALCULATION_LOGIC.md`
- Tests: `/src/utils/HDCCalculator/__tests__/`
- Git history: Shows all calculation changes with explanations