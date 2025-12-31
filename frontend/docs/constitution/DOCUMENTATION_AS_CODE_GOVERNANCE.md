# Documentation as Code: How .md Files Govern HDC Calculator Logic

## The Critical Role of Documentation in Maintaining Calculation Integrity

### Overview: Documentation as the Source of Truth

The HDC Calculator implements a "Documentation as Code" philosophy where .md files serve as:
1. **Business Logic Authority**: Defining WHAT calculations should do
2. **Implementation Guide**: Explaining HOW calculations work
3. **Validation Reference**: Providing test cases and expected outcomes
4. **Change Control**: Tracking why decisions were made

---

## The Documentation Hierarchy

### Level 1: Core Business Logic
**File**: `HDC_CALCULATION_LOGIC.md`
```
Purpose: Master authority on all calculation rules
Governs:
- Recovery target ($10M equity, not $10.5M total)
- Tax benefit flow (90% to investor after 10% HDC fee)
- Waterfall priorities (debt → AUM → recovery → promote)
- PIK accrual rules

Code Implementation:
- calculations.ts must match these rules exactly
- Any deviation is a BUG, not a feature
- Tests validate against these documented rules
```

### Level 2: Strategic Decisions
**Files**:
- `HDC_RECOVERY_TARGET_RATIONALE.md`
- `AUM_FEE_RECOVERY_ANALYSIS.md`
- `WHY_HDC_MODEL_WORKS_DETAILED.md`

```
Purpose: Explain WHY certain decisions were made
Governs:
- Why recovery excludes HDC fee and AUM
- Why 1.5% AUM is optimal
- Why 65/35 promote split

Code Impact:
- Prevents "helpful" developers from "fixing" what seems illogical
- Provides context for parameter bounds
- Guides UI/UX decisions on what to make configurable
```

### Level 3: Partner-Specific Terms
**Files**:
- `STRATEGIC_PARTNERS_LEVERAGE_MODEL.md`
- `LEVERAGE_SUPERCHARGE_ANALYSIS.md`

```
Purpose: Document actual partner terms and structures
Governs:
- Amazon: 4% for 20 years (2% current, 2% PIK)
- Ballmer: 0% for 60 years (!)
- Leverage targets: 95% LTV

Code Implementation:
- Must support both current pay and PIK portions
- Must handle 0% interest edge cases
- Must calculate correctly over 60-year terms
```

### Level 4: Regulatory Compliance
**Files**:
- `REGULATORY_COMPLIANCE_AUDIT.md`
- `TAX_LOSS_METHODOLOGY_AUDIT.md`

```
Purpose: Document regulatory requirements and simplifications
Governs:
- 27.5-year depreciation schedule
- Passive loss limitations (assumed RE Professional)
- State conformity assumptions
- AMT considerations (currently ignored)

Code Protection:
- Documents intentional simplifications
- Prevents "corrections" that break the model
- Provides audit trail for regulators
```

### Level 5: Test Coverage
**Files**:
- `COMPLETE_TEST_COVERAGE_MATRIX.md`
- `YEAR_1_CALCULATION_VALIDATION.md`

```
Purpose: Ensure every calculation is tested
Governs:
- All 85 formulas have explicit tests
- Edge cases are documented and tested
- Expected outcomes are defined

Code Quality:
- New features must update test matrix
- Changes must pass all documented tests
- Test failures indicate logic violations
```

---

## How Documentation Governs Code: The Process

### 1. Before Coding: Read the Docs
```javascript
// WRONG APPROACH:
function calculateRecoveryTarget(equity, hdcFee) {
  return equity + hdcFee; // Seems logical but WRONG!
}

// CORRECT APPROACH:
// Per HDC_CALCULATION_LOGIC.md line 178:
// "Recovery tracks against Investor Equity only, not total investment"
function calculateRecoveryTarget(equity, hdcFee) {
  return equity; // HDC fee excluded per documentation
}
```

### 2. During Coding: Reference Documentation
```typescript
// calculations.ts should have comments like:
export function calculateTaxBenefit(depreciation: number, taxRate: number) {
  // Per HDC_CALCULATION_LOGIC.md Section 3.2:
  // "HDC takes 10% of gross tax benefits"
  const grossBenefit = depreciation * taxRate;
  const hdcFee = grossBenefit * 0.10; // FIXED per documentation
  return grossBenefit - hdcFee;
}
```

### 3. After Coding: Validate Against Docs
```typescript
// Test files should reference documentation:
describe('Recovery Target Calculation', () => {
  it('should exclude HDC fee from recovery target per HDC_RECOVERY_TARGET_RATIONALE.md', () => {
    // Test implementation
    const recoveryTarget = calculateRecoveryTarget(10, 0.5);
    expect(recoveryTarget).toBe(10); // Not 10.5!
  });
});
```

---

## Documentation-Driven Development (DDD) Rules

### Rule 1: Documentation Before Code
```
Process:
1. Update .md file with new business rule
2. Get stakeholder approval on documentation
3. THEN implement in code
4. Write tests that reference the documentation

Never:
- Code first, document later
- Make "logical improvements" without documentation
- Ignore documented edge cases
```

### Rule 2: Every Magic Number Has a Source
```javascript
// BAD:
const hdcFeeRate = 0.10; // Why 10%?

// GOOD:
// Per HDC_CALCULATION_LOGIC.md line 94:
// "HDC Fee fixed at 10% of gross tax benefits"
const hdcFeeRate = 0.10;

// BETTER:
const HDC_FEE_RATE = 0.10; // See HDC_CALCULATION_LOGIC.md line 94
```

### Rule 3: Documentation Contradictions = Bugs
```
If code doesn't match documentation:
1. Code is WRONG (99% of cases)
2. Documentation needs update (1% - requires approval)

Never:
- Assume code is right
- Create undocumented behaviors
- Add "features" not in documentation
```

---

## Practical Examples: Docs Preventing Bugs

### Example 1: The AUM Fee Trap
```javascript
// Developer thinks: "AUM fees should be part of recovery"
// Documentation says NO!

// WRONG (seems logical):
const recoveryTarget = equity + hdcFee + aumFees;

// CORRECT (per AUM_FEE_RECOVERY_ANALYSIS.md):
const recoveryTarget = equity; // AUM is operating expense
```

### Example 2: The Ballmer 0% Edge Case
```javascript
// Developer thinks: "Division by zero protection"
// Documentation says: "0% for 60 years is correct"

// WRONG (defensive but breaks model):
const ballmerRate = Math.max(0.001, actualRate); // Never zero!

// CORRECT (per STRATEGIC_PARTNERS_LEVERAGE_MODEL.md):
const ballmerRate = 0; // 0% is the actual term!
```

### Example 3: The Tax Benefit Simplification
```javascript
// Developer thinks: "Should include all tax losses"
// Documentation says: "Intentionally simplified"

// WRONG (technically correct but not the model):
const taxLoss = depreciation + interestExpense + operatingLoss;

// CORRECT (per TAX_LOSS_METHODOLOGY_AUDIT.md):
const taxLoss = depreciation; // Intentional simplification documented
```

---

## The Documentation Update Protocol

### When to Update Documentation

1. **Business Rule Changes**
   - Client requests different fee structure
   - Regulatory changes require new calculations
   - Strategic partner terms change

2. **Bug Fixes That Change Logic**
   - If fix changes expected outcomes
   - If fix reveals undocumented assumption
   - If fix requires new test cases

3. **New Features**
   - Document BEFORE coding
   - Include rationale for decisions
   - Update test matrix

### Documentation Change Process

```
1. Identify Change Need
   ↓
2. Update Relevant .md Files
   ↓
3. Get Stakeholder Review
   ↓
4. Update Code to Match
   ↓
5. Update Tests to Validate
   ↓
6. Commit with Reference to Doc Changes
```

### Git Commit Messages Should Reference Docs

```bash
# GOOD commit messages:
git commit -m "Update recovery calculation per HDC_CALCULATION_LOGIC.md line 178"
git commit -m "Add Ballmer 0% terms per STRATEGIC_PARTNERS_LEVERAGE_MODEL.md"
git commit -m "Fix AUM accrual per AUM_FEE_RECOVERY_ANALYSIS.md section 3"

# BAD commit messages:
git commit -m "Fix calculation"
git commit -m "Update recovery logic"
git commit -m "Change fee structure"
```

---

## The Living Documentation Principle

### Documentation Evolves But Never Disappears

```
Version Control for Docs:
- Keep historical versions
- Document WHY changes were made
- Never delete, only supersede

Example in HDC_CALCULATION_LOGIC.md:
## Version History
- v1.6: Added OZ basis step-up
- v1.5: Changed AUM from 2% to 1.5%
- v1.4: Added interest reserve logic
```

### The Test of Good Documentation

Ask these questions:
1. Could a new developer understand the logic?
2. Could an auditor verify compliance?
3. Could a stakeholder see their requirements?
4. Could you remember why in 2 years?

If any answer is NO, documentation needs improvement.

---

## Critical Files and Their Governance Role

### Must-Read Before Any Changes:
1. **HDC_CALCULATION_LOGIC.md** - Core business rules
2. **WHY_HDC_MODEL_WORKS_DETAILED.md** - Understanding the model
3. **REGULATORY_COMPLIANCE_AUDIT.md** - What's required vs. simplified

### Consult for Specific Features:
1. **TAX_LOSS_METHODOLOGY_AUDIT.md** - Tax calculations
2. **AUM_FEE_RECOVERY_ANALYSIS.md** - Fee structures
3. **STRATEGIC_PARTNERS_LEVERAGE_MODEL.md** - Partner terms
4. **LEVERAGE_SUPERCHARGE_ANALYSIS.md** - Leverage calculations

### Reference for Testing:
1. **COMPLETE_TEST_COVERAGE_MATRIX.md** - What needs testing
2. **YEAR_1_CALCULATION_VALIDATION.md** - Critical year 1 logic

---

## The Bottom Line: Code Serves Documentation

In the HDC Calculator:
- **Documentation defines the truth**
- **Code implements the documentation**
- **Tests validate against documentation**
- **Changes start with documentation**

This ensures that the sophisticated financial logic, partner terms, and regulatory requirements are:
- Preserved across developer changes
- Validated through testing
- Auditable by stakeholders
- Maintainable over time

**Remember**: In HDC Calculator, if it's not documented, it shouldn't be coded. If it contradicts documentation, it's a bug.