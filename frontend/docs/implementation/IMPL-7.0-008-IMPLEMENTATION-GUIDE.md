# IMPL-7.0-008 UI Integration - Implementation Guide

**Status**: Foundation Complete, UI Components In Progress
**Date**: 2025-12-17
**Branch**: impl-7.0-ui-integration

---

## ✅ Completed Foundation (100%)

### 1. State Management - `useHDCState.ts` ✅
**Added 16 new state variables + exposed `placedInServiceMonth`**:

```typescript
// Basis Adjustments (v7.0.7)
const [loanFeesPercent, setLoanFeesPercent] = useState(1.0);
const [legalStructuringCosts, setLegalStructuringCosts] = useState(150000);
const [organizationCosts, setOrganizationCosts] = useState(50000);

// LIHTC Structure (v7.0.5)
const [lihtcEnabled, setLihtcEnabled] = useState(true);
const [applicableFraction, setApplicableFraction] = useState(100);
const [creditRate, setCreditRate] = useState(4.0);
const [ddaQctBoost, setDdaQctBoost] = useState(false);
const [placedInServiceMonth, setPlacedInServiceMonth] = useState(7);

// State LIHTC (v7.0.3)
const [stateLIHTCEnabled, setStateLIHTCEnabled] = useState(false);
const [syndicationRate, setSyndicationRate] = useState(85);
const [investorHasStateLiability, setInvestorHasStateLiability] = useState(true);

// Preferred Equity (v7.0.6)
const [prefEquityEnabled, setPrefEquityEnabled] = useState(false);
const [prefEquityPct, setPrefEquityPct] = useState(0);
const [prefEquityTargetMOIC, setPrefEquityTargetMOIC] = useState(1.7);
const [prefEquityAccrualRate, setPrefEquityAccrualRate] = useState(12);
const [prefEquityOzEligible, setPrefEquityOzEligible] = useState(false);
```

### 2. Type Definitions - `types/HDCCalculator/index.ts` ✅
**Added all new parameters to `CalculationParams` interface**.

### 3. Calculation Modules ✅ (from previous tasks)
- `preferredEquityCalculations.ts` - 66/66 tests passing
- `depreciableBasisUtility.ts` - 41/41 tests passing
- `stateLIHTCCalculations.ts` - Complete
- `lihtcCreditCalculations.ts` - Complete
- `warningTypes.ts` - Complete

---

## 🔨 Remaining UI Components

### Priority 1: Modify Existing Components

#### A. BasicInputsSection.tsx - Add Basis Adjustments

**Location**: After Interest Reserve section (line ~311)
**Add these fields**:

```tsx
{/* Basis Adjustments (v7.0.7) */}
<div className="hdc-input-group" style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--hdc-mercury)'}}>
  <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)', fontWeight: 600}}>
    Depreciable Basis Adjustments
    <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem', fontWeight: 'normal' }}>
      (Optional: Loan fees, legal, organization costs)
    </span>
  </label>

  <div className="mt-2" style={{background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--hdc-mercury)'}}>
    {/* Loan Fees */}
    <div className="hdc-input-group">
      <label className="hdc-input-label" style={{fontSize: '0.875rem'}}>
        Loan Origination Fees (%)
      </label>
      <input
        type="number"
        step="0.1"
        min="0"
        max="3"
        value={loanFeesPercent}
        onChange={(e) => setLoanFeesPercent(Number(e.target.value))}
        className="hdc-input"
        disabled={isReadOnly}
      />
    </div>

    {/* Legal Costs */}
    <div className="hdc-input-group">
      <label className="hdc-input-label" style={{fontSize: '0.875rem'}}>
        Legal & Structuring Costs
      </label>
      <input
        type="number"
        step="10000"
        value={legalStructuringCosts}
        onChange={(e) => setLegalStructuringCosts(Number(e.target.value))}
        className="hdc-input"
        disabled={isReadOnly}
      />
    </div>

    {/* Organization Costs */}
    <div className="hdc-input-group">
      <label className="hdc-input-label" style={{fontSize: '0.875rem'}}>
        Organization & Formation Costs
      </label>
      <input
        type="number"
        step="5000"
        value={organizationCosts}
        onChange={(e) => setOrganizationCosts(Number(e.target.value))}
        className="hdc-input"
        disabled={isReadOnly}
      />
    </div>

    {/* Calculated Total */}
    <div style={{marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--hdc-mercury)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600}}>
        <span>Total Adjustments:</span>
        <span>{formatCurrency(calculateTotalAdjustments())}</span>
      </div>
    </div>
  </div>
</div>
```

**Add helper function**:
```typescript
const calculateTotalAdjustments = () => {
  const effectiveProjectCost = projectCost + predevelopmentCosts + interestReserveAmount;
  const investorEquity = effectiveProjectCost * (investorEquityPct / 100);
  const totalDebt = effectiveProjectCost - investorEquity;
  const loanFees = totalDebt * (loanFeesPercent / 100);
  return loanFees + legalStructuringCosts + organizationCosts;
};
```

**Props to add**:
```typescript
loanFeesPercent: number;
setLoanFeesPercent: (value: number) => void;
legalStructuringCosts: number;
setLegalStructuringCosts: (value: number) => void;
organizationCosts: number;
setOrganizationCosts: (value: number) => void;
// Also need investorEquityPct for calculation
investorEquityPct: number;
```

#### B. CapitalStructureSection.tsx - Add Preferred Equity

**Location**: After Outside Investor sub-debt section
**Add collapsible section**:

```tsx
{/* Preferred Equity (v7.0.6) */}
<div className="hdc-input-group" style={{marginTop: '1rem'}}>
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={prefEquityEnabled}
      onChange={(e) => setPrefEquityEnabled(e.target.checked)}
      disabled={isReadOnly}
      className="mr-2"
    />
    <span style={{fontWeight: 600}}>Preferred Equity Layer</span>
    <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem', fontWeight: 'normal' }}>
      (1.7x MOIC target, paid before common equity)
    </span>
  </label>

  {prefEquityEnabled && (
    <div className="mt-3 p-3 rounded" style={{background: 'white', border: '1px solid var(--hdc-mercury)'}}>
      {/* Preferred % Slider */}
      <div className="hdc-input-group">
        <label className="hdc-input-label">
          Preferred Equity (% of Total Equity)
        </label>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          value={prefEquityPct}
          onChange={(e) => setPrefEquityPct(Number(e.target.value))}
          disabled={isReadOnly}
          className="w-full"
        />
        <div className="flex justify-between text-xs mt-1">
          <span>0%</span>
          <span className="font-bold">{prefEquityPct}%</span>
          <span>40%</span>
        </div>
      </div>

      {/* Target MOIC */}
      <div className="hdc-input-group">
        <label className="hdc-input-label">Target MOIC</label>
        <input
          type="number"
          step="0.1"
          min="1.0"
          max="3.0"
          value={prefEquityTargetMOIC}
          onChange={(e) => setPrefEquityTargetMOIC(Number(e.target.value))}
          disabled={isReadOnly}
          className="hdc-input"
        />
      </div>

      {/* Accrual Rate */}
      <div className="hdc-input-group">
        <label className="hdc-input-label">Accrual Rate (%)</label>
        <input
          type="number"
          step="1"
          min="6"
          max="20"
          value={prefEquityAccrualRate}
          onChange={(e) => setPrefEquityAccrualRate(Number(e.target.value))}
          disabled={isReadOnly}
          className="hdc-input"
        />
      </div>

      {/* Display Amount */}
      <div style={{marginTop: '0.5rem', padding: '0.5rem', background: 'var(--hdc-pale-mint)', borderRadius: '4px'}}>
        <div style={{fontSize: '0.75rem', color: 'var(--hdc-faded-jade)'}}>
          Preferred Equity Amount
        </div>
        <div style={{fontSize: '1rem', fontWeight: 'bold'}}>
          {formatCurrency(calculatePrefEquityAmount())}
        </div>
      </div>
    </div>
  )}
</div>
```

**Add helper**:
```typescript
const calculatePrefEquityAmount = () => {
  const effectiveProjectCost = projectCost + predevelopmentCosts + interestReserveAmount;
  const totalEquity = effectiveProjectCost * (investorEquityPct + philanthropicEquityPct) / 100;
  return totalEquity * (prefEquityPct / 100);
};
```

### Priority 2: New Result Components

#### C. WarningBanner.tsx (Top of Results)

```tsx
import React from 'react';
import { Warning } from '../../../utils/HDCCalculator/warningTypes';
import '../results/WarningsPanel.css';

interface WarningBannerProps {
  warnings: Warning[];
  onDismiss?: (id: string) => void;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ warnings, onDismiss }) => {
  if (!warnings || warnings.length === 0) return null;

  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const regularWarnings = warnings.filter(w => w.severity === 'warning');

  return (
    <div style={{marginBottom: '1rem'}}>
      {criticalWarnings.length > 0 && (
        <div className="warning-banner critical">
          <div className="warning-icon">⚠️</div>
          <div>
            <div className="warning-title">Critical Issues ({criticalWarnings.length})</div>
            {criticalWarnings.map(w => (
              <div key={w.id} className="warning-message">{w.message}</div>
            ))}
          </div>
        </div>
      )}

      {regularWarnings.length > 0 && (
        <div className="warning-banner warning">
          <div className="warning-icon">ℹ️</div>
          <div>
            <div className="warning-title">Warnings ({regularWarnings.length})</div>
            {regularWarnings.map(w => (
              <div key={w.id} className="warning-message">
                {w.message}
                {onDismiss && (
                  <button onClick={() => onDismiss(w.id)} className="dismiss-btn">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### D. PreferredEquitySection.tsx (Results)

```tsx
import React from 'react';
import { PreferredEquityResult } from '../../../utils/HDCCalculator/preferredEquityCalculations';

interface PreferredEquitySectionProps {
  result: PreferredEquityResult | null;
  formatCurrency: (value: number) => string;
}

export const PreferredEquitySection: React.FC<PreferredEquitySectionProps> = ({ result, formatCurrency }) => {
  if (!result || result.principal === 0) return null;

  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">Preferred Equity Returns</h3>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Principal Invested:</span>
        <span className="hdc-result-value">{formatCurrency(result.principal)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Target Amount (@ {result.metadata.targetMOIC}x):</span>
        <span className="hdc-result-value">{formatCurrency(result.targetAmount)}</span>
      </div>

      <div className="hdc-result-row summary highlight">
        <span className="hdc-result-label">Payment at Exit:</span>
        <span className="hdc-result-value hdc-value-positive">{formatCurrency(result.paymentAtExit)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Achieved MOIC:</span>
        <span className="hdc-result-value">{result.achievedMOIC.toFixed(2)}x</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Achieved IRR:</span>
        <span className="hdc-result-value">{result.achievedIRR.toFixed(2)}%</span>
      </div>

      {!result.targetAchieved && (
        <div className="warning-box" style={{marginTop: '0.5rem'}}>
          <strong>Shortfall:</strong> {formatCurrency(result.dollarShortfall)}
          ({result.moicShortfall.toFixed(2)}x below target)
        </div>
      )}
    </div>
  );
};
```

#### E. LIHTCCreditSchedule.tsx (Results)

```tsx
import React from 'react';
import { LIHTCResult } from '../../../utils/HDCCalculator/lihtcCreditCalculations';

interface LIHTCCreditScheduleProps {
  result: LIHTCResult | null;
  formatCurrency: (value: number) => string;
}

export const LIHTCCreditSchedule: React.FC<LIHTCCreditScheduleProps> = ({ result, formatCurrency }) => {
  if (!result) return null;

  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">LIHTC Credit Schedule</h3>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Year 1 Credit:</span>
        <span className="hdc-result-value hdc-value-positive">{formatCurrency(result.year1Credit)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Annual Credit (Years 2-10):</span>
        <span className="hdc-result-value">{formatCurrency(result.annualCredit)}</span>
      </div>

      <div className="hdc-result-row summary">
        <span className="hdc-result-label">Total 10-Year Credits:</span>
        <span className="hdc-result-value hdc-value-positive">{formatCurrency(result.total10YearCredits)}</span>
      </div>

      {/* Expandable Schedule */}
      <details style={{marginTop: '0.5rem'}}>
        <summary style={{cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem'}}>
          View Credit Schedule
        </summary>
        <table style={{width: '100%', marginTop: '0.5rem', fontSize: '0.8rem'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--hdc-mercury)'}}>
              <th>Year</th>
              <th>Credit</th>
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {result.schedule.map((year) => (
              <tr key={year.year}>
                <td>Year {year.year}</td>
                <td>{formatCurrency(year.credit)}</td>
                <td>{formatCurrency(year.cumulativeCredits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};
```

### Priority 3: Wiring

#### F. HDCInputsComponent.tsx

Add new props and pass to sections:

```typescript
// Add to props destructuring
const {
  // ... existing props ...
  loanFeesPercent, setLoanFeesPercent,
  legalStructuringCosts, setLegalStructuringCosts,
  organizationCosts, setOrganizationCosts,
  prefEquityEnabled, setPrefEquityEnabled,
  prefEquityPct, setPrefEquityPct,
  prefEquityTargetMOIC, setPrefEquityTargetMOIC,
  prefEquityAccrualRate, setPrefEquityAccrualRate,
  // ... etc
} = props;
```

#### G. HDCResultsComponent.tsx

Add WarningBanner at top and PreferredEquitySection after OutsideInvestorSection:

```tsx
<div className="hdc-results">
  <WarningBanner warnings={warningsResult?.warnings || []} />

  {/* ... existing sections ... */}

  <PreferredEquitySection
    result={preferredEquityResult}
    formatCurrency={formatCurrency}
  />

  {/* ... rest of sections ... */}
</div>
```

---

## 🧪 Testing Checklist

- [ ] All 963 existing tests still pass
- [ ] New state variables accessible in components
- [ ] Basis adjustments calculate correctly
- [ ] Preferred equity displays when enabled
- [ ] Warnings display at top of results
- [ ] LIHTC schedule renders correctly
- [ ] Auto-balance respects preferred equity %
- [ ] Waterfall order: Senior → Phil → Preferred → Sub → Common

---

## 📝 Notes

- **Waterfall Integration**: Not yet implemented in `calculations.ts`. Need to insert preferred equity payment between phil debt and sub-debt.
- **State LIHTC Section**: Can reuse existing `InvestorTaxAndOZSection` state selector with additional fields.
- **LIHTC Structure Section**: New component needed after `CapitalStructureSection`.
- **Placed in Service Month**: Already exists, just needs UI dropdown added to LIHTC section.

---

## 🎯 Next Steps for Completion

1. Add Basis Adjustments to BasicInputsSection.tsx (use template above)
2. Add Preferred Equity to CapitalStructureSection.tsx (use template above)
3. Create 3 new result components (WarningBanner, PreferredEquitySection, LIHTCCreditSchedule)
4. Wire all props through HDCInputsComponent and HDCResultsComponent
5. Test with existing scenarios
6. Integrate waterfall in calculations.ts

**Estimated Time**: 2-3 hours for experienced developer with templates provided.

---

*Implementation guide created by Claude Code on 2025-12-17*
