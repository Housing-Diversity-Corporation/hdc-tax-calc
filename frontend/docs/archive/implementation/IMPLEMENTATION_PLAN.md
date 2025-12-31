# HDC Tax Planning Platform - Implementation Plan

## 🎯 OBJECTIVE
Enhance HDC Calculator with comprehensive tax planning calculations, then build Tax Strategy UI layer on top.

---

## 📁 FILE STRUCTURE TO CREATE

```
hdc-map-frontend/src/
├── utils/HDCCalculator/
│   ├── calculations.ts                 [ENHANCE]
│   ├── depreciationSchedule.ts         [CREATE]
│   ├── taxCapacity.ts                  [CREATE]
│   ├── passiveLoss.ts                  [CREATE]
│   ├── stateConformity.ts              [CREATE]
│   ├── iraConversion.ts                [CREATE]
│   ├── assetTiming.ts                  [CREATE]
│   └── types/
│       └── taxPlanning.ts              [CREATE]
│
├── components/TaxStrategy/
│   ├── TaxStrategyMain.tsx             [CREATE]
│   ├── DepreciationTimeline.tsx        [CREATE]
│   ├── REPCapacityDashboard.tsx        [CREATE]
│   ├── PassiveCapacityDashboard.tsx    [CREATE]
│   ├── IRAConversionPlanner.tsx        [CREATE]
│   ├── AssetSaleOptimizer.tsx          [CREATE]
│   └── ScenarioPlanner.tsx             [CREATE]
│
├── hooks/HDCCalculator/
│   └── useHDCCalculations.ts           [ENHANCE]
│
└── types/HDCCalculator/
    └── index.ts                         [ENHANCE]
```

---

## 📅 WEEK 1: CORE CALCULATION ENGINE
*Build foundation calculations in HDC Calculator*

### Day 1-2: Depreciation Schedule Generator

#### Task 1.1: Create `depreciationSchedule.ts`
```typescript
// src/utils/HDCCalculator/depreciationSchedule.ts

import { CalculationParams } from '../../types/HDCCalculator';

export interface DepreciationYear {
  year: number;
  bonusDepreciation: number;
  straightLineDepreciation: number;
  totalDepreciation: number;
  federalTaxBenefit: number;
  stateTaxBenefit: number;
  hdcFee: number;
  netBenefit: number;
}

export function buildDepreciationSchedule(params: CalculationParams): DepreciationYear[] {
  const buildingBasis = params.projectCost - params.landValue;
  const schedule: DepreciationYear[] = [];

  // Year 1: 25% cost segregation with bonus depreciation
  const costSegAmount = buildingBasis * 0.25;
  const year1Depreciation = costSegAmount; // 100% bonus on segregated portion

  schedule.push({
    year: 1,
    bonusDepreciation: year1Depreciation,
    straightLineDepreciation: 0,
    totalDepreciation: year1Depreciation,
    federalTaxBenefit: year1Depreciation * (params.federalTaxRate / 100),
    stateTaxBenefit: year1Depreciation * (params.stateTaxRate / 100),
    hdcFee: year1Depreciation * params.effectiveTaxRate * 0.10,
    netBenefit: calculateNetBenefit(year1Depreciation, params)
  });

  // Years 2-10: Straight-line depreciation
  const remainingBasis = buildingBasis * 0.75;
  const annualStraightLine = remainingBasis / 27.5;

  for (let year = 2; year <= Math.min(params.holdPeriod || 10, 10); year++) {
    schedule.push({
      year,
      bonusDepreciation: 0,
      straightLineDepreciation: annualStraightLine,
      totalDepreciation: annualStraightLine,
      // ... calculate benefits
    });
  }

  return schedule;
}
```

#### Task 1.2: Update types
```typescript
// src/types/HDCCalculator/index.ts
// ADD to existing InvestorAnalysisResults:

export interface InvestorAnalysisResults {
  // ... existing fields ...

  // NEW: Tax planning fields
  depreciationSchedule?: DepreciationYear[];
  repTaxCapacity?: REPTaxCapacityModel;
  nonRepCapacity?: NonREPCapacityModel;
}
```

### Day 3-4: REP Tax Capacity Model (461(l) Tracking)

#### Task 1.3: Create `taxCapacity.ts`
```typescript
// src/utils/HDCCalculator/taxCapacity.ts

export interface REPTaxCapacityModel {
  annualLimitations: Array<{
    year: number;
    w2Income: number;
    section461lLimit: number;
    allowedLoss: number;
    disallowedLoss: number;
    nolGenerated: number;
    nolCarryforward: number;
  }>;

  totalCapacity: {
    currentYear: number;
    nolBank: number;
    iraConversionCapacity: number;
  };
}

export function calculateREPCapacity(
  params: CalculationParams,
  depreciationSchedule: DepreciationYear[]
): REPTaxCapacityModel {
  const SECTION_461L_LIMIT = 626000; // 2025 MFJ
  const limitations = [];
  let nolCarryforward = 0;

  depreciationSchedule.forEach((yearData, index) => {
    const excessLoss = Math.max(0, yearData.totalDepreciation - SECTION_461L_LIMIT);

    limitations.push({
      year: index + 1,
      w2Income: params.w2Income || 0,
      section461lLimit: SECTION_461L_LIMIT,
      allowedLoss: Math.min(yearData.totalDepreciation, SECTION_461L_LIMIT),
      disallowedLoss: excessLoss,
      nolGenerated: excessLoss,
      nolCarryforward: nolCarryforward + excessLoss
    });

    nolCarryforward += excessLoss;
  });

  return {
    annualLimitations: limitations,
    totalCapacity: {
      currentYear: limitations[0]?.allowedLoss || 0,
      nolBank: nolCarryforward,
      iraConversionCapacity: Math.min(SECTION_461L_LIMIT, limitations[0]?.allowedLoss || 0)
    }
  };
}
```

### Day 5: Non-REP Passive Loss Model

#### Task 1.4: Create `passiveLoss.ts`
```typescript
// src/utils/HDCCalculator/passiveLoss.ts

export interface NonREPCapacityModel {
  totalPassiveLosses: number;
  unlimitedCapacity: true;
  scenarioAnalysis: Array<{
    gainAmount: number;
    percentCovered: number;
    taxSavings: number;
  }>;
}

export function calculateNonREPCapacity(
  params: CalculationParams,
  depreciationSchedule: DepreciationYear[]
): NonREPCapacityModel {
  const totalLosses = depreciationSchedule.reduce(
    (sum, year) => sum + year.totalDepreciation, 0
  );

  // Analyze common scenarios
  const scenarios = [1_000_000, 5_000_000, 10_000_000, 50_000_000].map(gain => ({
    gainAmount: gain,
    percentCovered: Math.min(100, (totalLosses / gain) * 100),
    taxSavings: Math.min(gain, totalLosses) * (params.ltCapitalGainsRate / 100)
  }));

  return {
    totalPassiveLosses: totalLosses,
    unlimitedCapacity: true,
    scenarioAnalysis: scenarios
  };
}
```

---

## 📅 WEEK 2: ENHANCED PLANNING FEATURES
*Add IRA conversion, asset timing, state conformity*

### Day 1-2: IRA Conversion Optimizer

#### Task 2.1: Create `iraConversion.ts`
```typescript
// src/utils/HDCCalculator/iraConversion.ts

export interface IRAConversionPlan {
  schedule: Array<{
    year: number;
    recommendedConversion: number;
    hdcLossOffset: number;
    taxSaved: number;
    rothBalance: number;
  }>;
  totalConverted: number;
  totalTaxSaved: number;
  year30RothValue: number;
}

export function optimizeIRAConversion(
  params: CalculationParams & { iraBalance?: number },
  repCapacity: REPTaxCapacityModel
): IRAConversionPlan | undefined {
  if (!params.iraBalance) return undefined;

  const schedule = [];
  let remainingIRA = params.iraBalance;
  let rothBalance = 0;
  const targetYears = 5; // Default 5-year conversion

  for (let year = 1; year <= targetYears && remainingIRA > 0; year++) {
    const yearCapacity = repCapacity.annualLimitations[year - 1];
    const conversionAmount = Math.min(
      remainingIRA,
      yearCapacity.allowedLoss,
      remainingIRA / (targetYears - year + 1) // Spread evenly
    );

    rothBalance += conversionAmount;
    remainingIRA -= conversionAmount;

    schedule.push({
      year,
      recommendedConversion: conversionAmount,
      hdcLossOffset: conversionAmount,
      taxSaved: conversionAmount * (params.effectiveTaxRate / 100),
      rothBalance
    });
  }

  return {
    schedule,
    totalConverted: params.iraBalance - remainingIRA,
    totalTaxSaved: schedule.reduce((sum, y) => sum + y.taxSaved, 0),
    year30RothValue: rothBalance * Math.pow(1.07, 30) // 7% growth assumption
  };
}
```

### Day 3-4: Asset Sale Timing & State Conformity

#### Task 2.2: Create `assetTiming.ts`
```typescript
// src/utils/HDCCalculator/assetTiming.ts

export interface AssetSaleAnalysis {
  scenarios: Array<{
    sellYear: number;
    lossesAvailable: number;
    percentCovered: number;
    taxSavings: number;
    recommendation: 'SELL' | 'WAIT';
  }>;
  optimalYear: number;
}

export function analyzeAssetSaleTiming(
  params: CalculationParams & { assetGain?: number },
  taxCapacity: REPTaxCapacityModel | NonREPCapacityModel
): AssetSaleAnalysis | undefined {
  if (!params.assetGain) return undefined;

  // Implementation...
}
```

#### Task 2.3: Create `stateConformity.ts`
```typescript
// src/utils/HDCCalculator/stateConformity.ts

const STATE_CONFORMITY = {
  'CA': 0.0,   // No bonus depreciation
  'NY': 0.5,   // Partial conformity
  'PA': 0.0,   // No conformity
  'DEFAULT': 1.0 // Full conformity
};

export function applyStateConformity(
  state: string,
  federalDepreciation: number
): number {
  const conformityRate = STATE_CONFORMITY[state] ?? STATE_CONFORMITY.DEFAULT;
  return federalDepreciation * conformityRate;
}
```

### Day 5: Integration into Main Calculator

#### Task 2.4: Enhance `calculations.ts`
```typescript
// src/utils/HDCCalculator/calculations.ts
// ENHANCE the main calculation function:

import { buildDepreciationSchedule } from './depreciationSchedule';
import { calculateREPCapacity, calculateNonREPCapacity } from './taxCapacity';
import { optimizeIRAConversion } from './iraConversion';
import { analyzeAssetSaleTiming } from './assetTiming';

export const calculateFullInvestorAnalysis = (params: CalculationParams): InvestorAnalysisResults => {
  // EXISTING CALCULATIONS
  const existingResults = currentCalculationLogic(params);

  // NEW TAX PLANNING CALCULATIONS
  const depreciationSchedule = buildDepreciationSchedule(params);

  const taxCapacity = params.investorTrack === 'rep'
    ? calculateREPCapacity(params, depreciationSchedule)
    : calculateNonREPCapacity(params, depreciationSchedule);

  const iraConversionPlan = params.iraBalance
    ? optimizeIRAConversion(params, taxCapacity as REPTaxCapacityModel)
    : undefined;

  const assetSaleAnalysis = params.assetGain
    ? analyzeAssetSaleTiming(params, taxCapacity)
    : undefined;

  return {
    ...existingResults,

    // Add new fields
    depreciationSchedule,
    repTaxCapacity: params.investorTrack === 'rep' ? taxCapacity : undefined,
    nonRepCapacity: params.investorTrack !== 'rep' ? taxCapacity : undefined,
    iraConversionPlan,
    assetSaleAnalysis
  };
};
```

---

## 📅 WEEK 3: TAX STRATEGY UI
*Build visualization layer*

### Day 1-2: Main Tax Strategy Component

#### Task 3.1: Create `TaxStrategyMain.tsx`
```typescript
// src/components/TaxStrategy/TaxStrategyMain.tsx

import React, { useState } from 'react';
import { useHDCCalculations } from '../../hooks/HDCCalculator/useHDCCalculations';
import DepreciationTimeline from './DepreciationTimeline';
import REPCapacityDashboard from './REPCapacityDashboard';
import IRAConversionPlanner from './IRAConversionPlanner';

export const TaxStrategyMain: React.FC = () => {
  const { results, params, updateParams } = useHDCCalculations();
  const [activeTab, setActiveTab] = useState<'timeline' | 'capacity' | 'planning'>('timeline');

  if (!results?.depreciationSchedule) {
    return <div>Run HDC Calculator first to see tax strategies</div>;
  }

  return (
    <div className="tax-strategy-container">
      <div className="tab-navigation">
        <button
          className={activeTab === 'timeline' ? 'active' : ''}
          onClick={() => setActiveTab('timeline')}
        >
          Depreciation Timeline
        </button>
        <button
          className={activeTab === 'capacity' ? 'active' : ''}
          onClick={() => setActiveTab('capacity')}
        >
          Tax Capacity
        </button>
        <button
          className={activeTab === 'planning' ? 'active' : ''}
          onClick={() => setActiveTab('planning')}
        >
          Planning Tools
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'timeline' && (
          <DepreciationTimeline schedule={results.depreciationSchedule} />
        )}

        {activeTab === 'capacity' && params.investorTrack === 'rep' && (
          <REPCapacityDashboard capacity={results.repTaxCapacity} />
        )}

        {activeTab === 'capacity' && params.investorTrack !== 'rep' && (
          <PassiveCapacityDashboard capacity={results.nonRepCapacity} />
        )}

        {activeTab === 'planning' && (
          <div className="planning-tools">
            <IRAConversionPlanner
              plan={results.iraConversionPlan}
              onUpdateIRABalance={(balance) => updateParams({ iraBalance: balance })}
            />
            <AssetSaleOptimizer
              analysis={results.assetSaleAnalysis}
              onUpdateAsset={(gain) => updateParams({ assetGain: gain })}
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

### Day 3-4: Depreciation Timeline Component

#### Task 3.2: Create `DepreciationTimeline.tsx`
```typescript
// src/components/TaxStrategy/DepreciationTimeline.tsx

import React from 'react';
import { DepreciationYear } from '../../utils/HDCCalculator/depreciationSchedule';
import { formatCurrency } from '../../utils/HDCCalculator';

interface Props {
  schedule: DepreciationYear[];
}

export const DepreciationTimeline: React.FC<Props> = ({ schedule }) => {
  const maxDepreciation = Math.max(...schedule.map(y => y.totalDepreciation));

  return (
    <div className="depreciation-timeline">
      <h2>10-Year Depreciation Schedule</h2>

      <div className="timeline-chart">
        {schedule.map((year) => (
          <div key={year.year} className="year-bar">
            <div className="bar-container">
              <div
                className="depreciation-bar"
                style={{
                  height: `${(year.totalDepreciation / maxDepreciation) * 200}px`,
                  backgroundColor: year.year === 1 ? '#4CAF50' : '#2196F3'
                }}
              >
                <span className="bar-value">
                  {formatCurrency(year.totalDepreciation)}
                </span>
              </div>
            </div>

            <div className="year-details">
              <div className="year-label">Year {year.year}</div>
              <div className="benefit-amount">
                Tax Benefit: {formatCurrency(year.netBenefit)}
              </div>
              {year.bonusDepreciation > 0 && (
                <div className="bonus-indicator">
                  25% Bonus
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="summary-metrics">
        <div className="metric">
          <span>Total Depreciation:</span>
          <span>{formatCurrency(schedule.reduce((sum, y) => sum + y.totalDepreciation, 0))}</span>
        </div>
        <div className="metric">
          <span>Total Tax Benefits:</span>
          <span>{formatCurrency(schedule.reduce((sum, y) => sum + y.netBenefit, 0))}</span>
        </div>
      </div>
    </div>
  );
};

export default DepreciationTimeline;
```

### Day 5: REP Capacity Dashboard

#### Task 3.3: Create `REPCapacityDashboard.tsx`
```typescript
// src/components/TaxStrategy/REPCapacityDashboard.tsx

import React from 'react';
import { REPTaxCapacityModel } from '../../utils/HDCCalculator/taxCapacity';

interface Props {
  capacity: REPTaxCapacityModel;
}

export const REPCapacityDashboard: React.FC<Props> = ({ capacity }) => {
  return (
    <div className="rep-capacity-dashboard">
      <h2>REP Tax Capacity Analysis</h2>

      <div className="capacity-summary">
        <div className="capacity-card">
          <h3>Current Year Capacity</h3>
          <div className="capacity-meter">
            <div className="available">{formatCurrency(capacity.totalCapacity.currentYear)}</div>
            <div className="limit">$626,000 §461(l) Limit</div>
          </div>
        </div>

        <div className="capacity-card">
          <h3>NOL Bank</h3>
          <div className="nol-amount">{formatCurrency(capacity.totalCapacity.nolBank)}</div>
          <p>Available for future use</p>
        </div>

        <div className="capacity-card">
          <h3>IRA Conversion Capacity</h3>
          <div className="conversion-amount">
            {formatCurrency(capacity.totalCapacity.iraConversionCapacity)}
          </div>
          <p>Optimal conversion this year</p>
        </div>
      </div>

      <div className="year-by-year">
        <h3>Annual Limitation Schedule</h3>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Loss Generated</th>
              <th>Allowed</th>
              <th>Disallowed (→NOL)</th>
              <th>NOL Balance</th>
            </tr>
          </thead>
          <tbody>
            {capacity.annualLimitations.map(year => (
              <tr key={year.year}>
                <td>{year.year}</td>
                <td>{formatCurrency(year.allowedLoss + year.disallowedLoss)}</td>
                <td>{formatCurrency(year.allowedLoss)}</td>
                <td>{formatCurrency(year.disallowedLoss)}</td>
                <td>{formatCurrency(year.nolCarryforward)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default REPCapacityDashboard;
```

---

## 📅 WEEK 4: INTEGRATION & TESTING
*Connect everything and ensure quality*

### Day 1-2: Hook Integration

#### Task 4.1: Update `useHDCCalculations.ts`
```typescript
// src/hooks/HDCCalculator/useHDCCalculations.ts
// ENHANCE to handle new parameters:

export const useHDCCalculations = () => {
  const [params, setParams] = useState<CalculationParams>({
    // existing params...

    // NEW params for tax planning
    investorTrack: 'rep',
    iraBalance: 0,
    assetGain: 0,
    w2Income: 0,
  });

  const results = useMemo(() => {
    return calculateFullInvestorAnalysis(params);
  }, [params]);

  const updateParams = (updates: Partial<CalculationParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  };

  return {
    params,
    results,
    updateParams
  };
};
```

### Day 3-4: Testing

#### Task 4.2: Create test suite
```typescript
// src/utils/HDCCalculator/__tests__/taxPlanning.test.ts

describe('Tax Planning Calculations', () => {
  describe('Depreciation Schedule', () => {
    it('should calculate 25% cost segregation in year 1', () => {
      const params = {
        projectCost: 86_000_000,
        landValue: 10_000_000,
        federalTaxRate: 37,
        stateTaxRate: 10.9,
        holdPeriod: 10
      };

      const schedule = buildDepreciationSchedule(params);
      expect(schedule[0].bonusDepreciation).toBe(19_000_000); // 25% of 76M
    });
  });

  describe('REP Tax Capacity', () => {
    it('should apply 461(l) limitation', () => {
      const capacity = calculateREPCapacity(mockParams, mockSchedule);
      expect(capacity.annualLimitations[0].allowedLoss).toBeLessThanOrEqual(626_000);
    });
  });

  describe('IRA Conversion', () => {
    it('should optimize within available capacity', () => {
      const plan = optimizeIRAConversion(
        { ...mockParams, iraBalance: 2_000_000 },
        mockREPCapacity
      );

      expect(plan.schedule[0].recommendedConversion).toBeLessThanOrEqual(626_000);
    });
  });
});
```

### Day 5: Documentation & Deployment

#### Task 4.3: Update documentation
```markdown
// Update README.md with new features

## Tax Planning Features

The HDC Calculator now includes comprehensive tax planning capabilities:

- **10-Year Depreciation Schedule**: Detailed year-by-year breakdown
- **REP Tax Capacity Analysis**: §461(l) limitation tracking and NOL management
- **Non-REP Passive Loss Tracking**: Unlimited capacity advantage
- **IRA Conversion Optimizer**: Strategic Roth conversion planning
- **Asset Sale Timing**: Optimal timing for capital gains
- **State Conformity Adjustments**: Accurate state-specific calculations
```

---

## 🚀 IMMEDIATE NEXT STEPS (START TODAY)

### 1. Create New Files Structure
```bash
# Run these commands to create the structure
mkdir -p src/utils/HDCCalculator/types
mkdir -p src/components/TaxStrategy

# Create new calculation files
touch src/utils/HDCCalculator/depreciationSchedule.ts
touch src/utils/HDCCalculator/taxCapacity.ts
touch src/utils/HDCCalculator/passiveLoss.ts
touch src/utils/HDCCalculator/iraConversion.ts
touch src/utils/HDCCalculator/assetTiming.ts
touch src/utils/HDCCalculator/stateConformity.ts
```

### 2. Start with `depreciationSchedule.ts`
This is the foundation everything else builds on. Implement the complete function today.

### 3. Update Types
Add the new interfaces to `src/types/HDCCalculator/index.ts`

### 4. Test as You Go
After implementing each function, test it with real values:
```typescript
const testParams = {
  projectCost: 86_000_000,
  landValue: 10_000_000,
  federalTaxRate: 37,
  stateTaxRate: 10.9
};

const schedule = buildDepreciationSchedule(testParams);
console.log('Year 1 Depreciation:', schedule[0]);
```

---

## 📊 PROGRESS TRACKING

### Week 1 Checklist
- [ ] depreciationSchedule.ts complete
- [ ] taxCapacity.ts complete
- [ ] passiveLoss.ts complete
- [ ] Types updated
- [ ] Basic tests passing

### Week 2 Checklist
- [ ] iraConversion.ts complete
- [ ] assetTiming.ts complete
- [ ] stateConformity.ts complete
- [ ] calculations.ts enhanced
- [ ] Integration tested

### Week 3 Checklist
- [ ] TaxStrategyMain.tsx complete
- [ ] DepreciationTimeline.tsx complete
- [ ] REPCapacityDashboard.tsx complete
- [ ] PassiveCapacityDashboard.tsx complete
- [ ] IRAConversionPlanner.tsx complete

### Week 4 Checklist
- [ ] All components integrated
- [ ] Test suite complete
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] User testing complete

---

## 🎯 SUCCESS CRITERIA

1. **Depreciation Schedule** shows 25% Year 1 spike, then straight-line
2. **REP Capacity** correctly applies $626K limitation
3. **Non-REP** shows unlimited passive gain offset capability
4. **IRA Planner** optimizes conversions within capacity
5. **All tests pass** with realistic scenarios
6. **UI is responsive** and intuitive

---

## 💡 TIPS FOR RAPID IMPLEMENTATION

1. **Start Simple**: Get basic calculations working first, enhance later
2. **Use Existing Patterns**: Copy structure from existing HDC Calculator files
3. **Test with Real Numbers**: Use actual $86M project, $10M land values
4. **Stub Complex Features**: Return mock data for complex features initially
5. **Focus on Core Path**: REP with IRA conversion is the killer feature

---

## 🚨 POTENTIAL BLOCKERS & SOLUTIONS

| Blocker | Solution |
|---------|----------|
| State conformity data unclear | Start with CA/NY/PA only, add others later |
| IRA conversion rules complex | Simplify to basic capacity matching initially |
| UI component library choice | Use existing HDC Calculator components/styles |
| Testing depreciation accuracy | Validate against CPA-provided examples |

---

## 📞 DAILY STANDUP QUESTIONS

1. What did you complete yesterday?
2. What will you complete today?
3. Any blockers?
4. Any insights/discoveries?

---

## 🎉 DEFINITION OF DONE

The feature is complete when:

1. ✅ All calculation functions implemented and tested
2. ✅ Tax Strategy UI displays all planning features
3. ✅ REP vs Non-REP paths work correctly
4. ✅ IRA conversion optimization produces valid plans
5. ✅ Documentation complete
6. ✅ Code reviewed and merged
7. ✅ Deployed to production

---

Start with **Day 1, Task 1.1** - Create the depreciation schedule generator. This is the foundation everything else builds upon.