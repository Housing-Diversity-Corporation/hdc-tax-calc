# Calculation Architecture Decision: HDC Calculator vs Tax Strategy App

## RECOMMENDED APPROACH: ENHANCED HDC CALCULATOR

### Core Principle: Single Source of Truth
**All calculations should be done in an enhanced HDC Calculator**, with the Tax Strategy App as a specialized UI layer that consumes and visualizes this data.

## ARCHITECTURAL DECISION

### ✅ ENHANCE HDC CALCULATOR (Recommended)

```typescript
// HDC Calculator becomes the calculation engine for BOTH apps
hdc-map-frontend/src/utils/HDCCalculator/
├── calculations.ts           // Existing + Enhanced
├── depreciationSchedule.ts   // NEW: Multi-year schedule
├── taxCapacity.ts            // NEW: REP/Non-REP capacity
├── passiveLoss.ts            // NEW: Passive loss tracking
├── stateConformity.ts        // NEW: State adjustments
├── iraConversion.ts          // NEW: IRA optimization
├── assetTiming.ts            // NEW: Asset sale timing
└── index.ts                  // Unified exports
```

### Why This Approach:

#### 1. **Single Source of Truth**
```typescript
// One calculation engine, multiple consumers
const results = calculateFullInvestorAnalysis(params);

// HDC Calculator UI uses:
results.irr;
results.exitProceeds;
results.year1TaxBenefit;

// Tax Strategy App uses:
results.depreciationSchedule;
results.repTaxCapacity;
results.conversionPlan;
```

#### 2. **No Data Synchronization Issues**
```typescript
// BAD: Separate calculations (Don't do this)
const hdcResults = hdcCalculator.calculate(params);
const taxResults = taxStrategyCalculator.calculate(params);
// Risk: Different results for same inputs

// GOOD: Single calculation (Do this)
const results = enhancedHDCCalculator.calculate(params);
// Both apps use same results
```

#### 3. **Easier Testing & Validation**
```typescript
// Test once, use everywhere
describe('Enhanced HDC Calculator', () => {
  it('should calculate depreciation schedule correctly', () => {
    const results = calculate(params);
    expect(results.depreciationSchedule).toBeDefined();
    expect(results.year1TaxBenefit).toBe(855_015);
  });
});
```

## IMPLEMENTATION STRUCTURE

### Enhanced HDC Calculator Output

```typescript
// Extend existing InvestorAnalysisResults
interface EnhancedInvestorAnalysisResults extends InvestorAnalysisResults {
  // Existing fields (unchanged)
  investorCashFlows: CashFlowItem[];
  exitProceeds: number;
  irr: number;
  multiple: number;

  // NEW: Tax Strategy fields
  depreciationSchedule: DepreciationYear[];      // Multi-year breakdown
  repTaxCapacity: REPCapacityModel;             // 461(l) tracking
  nonRepCapacity: NonREPCapacityModel;          // Unlimited capacity
  stateConformityAdjustments: StateAdjustment[]; // State-specific
  carryforwardSchedule: CarryforwardYear[];     // Loss tracking

  // NEW: Planning scenarios (optional)
  iraConversionPlan?: IRAConversionPlan;        // If IRA params provided
  assetSaleTiming?: AssetSaleAnalysis;          // If asset params provided
}
```

### Calculation Flow

```typescript
// Enhanced calculation function in HDC Calculator
export const calculateFullInvestorAnalysis = (
  params: CalculationParams
): EnhancedInvestorAnalysisResults => {

  // EXISTING CALCULATIONS (unchanged)
  const cashFlows = calculateCashFlows(params);
  const irr = calculateIRR(cashFlows, params.investorEquity);
  const exitProceeds = calculateExitProceeds(params);

  // NEW TAX STRATEGY CALCULATIONS (added)
  const depreciationSchedule = buildDepreciationSchedule(params);
  const taxCapacity = params.investorTrack === 'rep'
    ? calculateREPCapacity(params, depreciationSchedule)
    : calculateNonREPCapacity(params, depreciationSchedule);
  const stateAdjustments = applyStateConformity(params.state, depreciationSchedule);
  const carryforward = projectCarryforward(depreciationSchedule, taxCapacity);

  // OPTIONAL PLANNING CALCULATIONS (if params provided)
  const iraConversionPlan = params.iraBalance
    ? optimizeIRAConversion(params, taxCapacity)
    : undefined;
  const assetSaleTiming = params.assetToSell
    ? analyzeAssetSaleTiming(params, taxCapacity)
    : undefined;

  return {
    // Existing fields
    investorCashFlows: cashFlows,
    exitProceeds,
    irr,
    multiple,

    // New tax strategy fields
    depreciationSchedule,
    repTaxCapacity: taxCapacity,
    nonRepCapacity: taxCapacity,
    stateConformityAdjustments: stateAdjustments,
    carryforwardSchedule: carryforward,

    // Optional planning
    iraConversionPlan,
    assetSaleTiming
  };
};
```

## APP RESPONSIBILITIES

### HDC Calculator App
**Role: Investment Analysis + Calculation Engine**

```typescript
const HDCCalculatorApp = () => {
  const results = calculateFullInvestorAnalysis(params);

  return (
    <div>
      {/* Focus on investment metrics */}
      <IRRDisplay value={results.irr} />
      <CashFlowTable data={results.investorCashFlows} />
      <ExitAnalysis proceeds={results.exitProceeds} />

      {/* Basic tax info */}
      <TaxBenefitSummary
        year1={results.year1TaxBenefit}
        total={results.totalTaxBenefit}
      />
    </div>
  );
};
```

### Tax Strategy App
**Role: Tax Planning UI + Visualizations**

```typescript
const TaxStrategyApp = () => {
  // Get same results from HDC Calculator
  const results = useHDCCalculator(params);

  return (
    <div>
      {/* Focus on tax planning */}
      <DepreciationTimeline data={results.depreciationSchedule} />
      <REPCapacityDashboard capacity={results.repTaxCapacity} />
      <IRAConversionPlanner plan={results.iraConversionPlan} />
      <AssetSaleOptimizer timing={results.assetSaleTiming} />

      {/* Scenarios and what-if analysis */}
      <ScenarioPlanner baseResults={results} />
    </div>
  );
};
```

## SHARED STATE MANAGEMENT

```typescript
// Zustand store shared between both apps
const useCalculatorStore = create((set) => ({
  // Input parameters (shared)
  params: defaultParams,

  // Calculation results (shared)
  results: null,

  // Actions
  updateParams: (newParams) => set({ params: newParams }),

  calculate: () => {
    const results = calculateFullInvestorAnalysis(get().params);
    set({ results });
  }
}));

// Both apps use same store
const HDCCalculatorApp = () => {
  const { results } = useCalculatorStore();
  // Display investment metrics
};

const TaxStrategyApp = () => {
  const { results } = useCalculatorStore();
  // Display tax planning features
};
```

## ADVANTAGES OF THIS APPROACH

### 1. **Consistency**
- Both apps always show same numbers
- No risk of calculation divergence
- Single point to fix bugs

### 2. **Performance**
- Calculate once, use twice
- Shared caching of results
- No duplicate computations

### 3. **Maintainability**
- All calculation logic in one place
- Easier to test and validate
- Clear separation of concerns

### 4. **Scalability**
- Easy to add new calculations
- Both apps automatically get updates
- Can add more consumer apps later

## FILE STRUCTURE

```
hdc-map-frontend/
├── src/
│   ├── utils/
│   │   └── HDCCalculator/           # CALCULATION ENGINE
│   │       ├── calculations.ts      # Core calculations (enhanced)
│   │       ├── depreciationSchedule.ts  # NEW
│   │       ├── taxCapacity.ts       # NEW
│   │       ├── passiveLoss.ts       # NEW
│   │       ├── stateConformity.ts   # NEW
│   │       ├── iraConversion.ts     # NEW
│   │       └── assetTiming.ts       # NEW
│   │
│   ├── components/
│   │   ├── HDCCalculator/           # HDC CALCULATOR UI
│   │   │   ├── HDCCalculatorMain.tsx
│   │   │   └── [existing components]
│   │   │
│   │   └── TaxStrategy/             # TAX STRATEGY UI
│   │       ├── TaxStrategyMain.tsx
│   │       ├── DepreciationTimeline.tsx
│   │       ├── REPCapacityDashboard.tsx
│   │       ├── IRAConversionPlanner.tsx
│   │       └── AssetSaleOptimizer.tsx
│   │
│   └── hooks/
│       └── HDCCalculator/
│           └── useHDCCalculations.ts  # Shared hook (enhanced)
```

## IMPLEMENTATION STEPS

### Week 1: Enhance Core Calculator
```typescript
// Add to calculations.ts
export const calculateFullInvestorAnalysis = (params) => {
  // ... existing code ...

  // Add new calculations
  const depreciationSchedule = buildDepreciationSchedule(params);
  const taxCapacity = calculateTaxCapacity(params);

  return {
    ...existingResults,
    depreciationSchedule,
    taxCapacity
  };
};
```

### Week 2: Build Tax Strategy UI
```typescript
// New Tax Strategy components consume enhanced data
const TaxStrategyApp = () => {
  const results = useHDCCalculator(params);

  // All calculations already done
  // Just display and interact with results
  return <TaxPlanningDashboard data={results} />;
};
```

## ALTERNATIVE APPROACH (NOT Recommended)

### ❌ Separate Calculation Engines

```typescript
// DON'T DO THIS - Creates synchronization issues
const hdcResults = hdcCalculator.calculate(params);
const taxResults = taxStrategyCalculator.calculate(params);

// Problems:
// - Two sources of truth
// - Potential inconsistencies
// - Duplicate code
// - Harder to maintain
// - More testing required
```

## DECISION SUMMARY

### Do This: ✅
1. **Enhance HDC Calculator** with all new calculations
2. **Tax Strategy App** focuses on UI/visualization
3. **Share state** between both apps
4. **Single calculation** serves both apps

### Benefits:
- **Single source of truth**
- **No sync issues**
- **Easier maintenance**
- **Better performance**
- **Consistent results**

### Timeline Impact:
- **Week 1-2**: Enhance HDC Calculator
- **Week 3-4**: Build Tax Strategy UI
- **Total: 4 weeks** (vs 6-8 weeks for separate engines)

This approach leverages your existing HDC Calculator investment, maintains consistency, and provides a cleaner architecture for long-term maintenance.