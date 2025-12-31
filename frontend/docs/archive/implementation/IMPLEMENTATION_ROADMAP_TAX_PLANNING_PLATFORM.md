# Implementation Roadmap: HDC Tax Planning Platform

## EXECUTIVE SUMMARY
Transform HDC Calculator from "should I invest?" to "how do I optimize my multi-year wealth strategy?" - focusing on actionable, timeline-based tax planning for both REPs and passive investors.

---

## PHASE 1: CORE DATA STRUCTURE ENHANCEMENTS (Week 1-2)
*Foundation that everything else builds upon*

### 1.1 Multi-Year Loss Projection Model

#### Current State → Enhanced State
```typescript
// CURRENT: Single aggregated values
interface Current {
  year1TaxBenefit: number;  // $855,015
  totalTaxBenefit: number;   // $1,247,842
}

// ENHANCED: Detailed 10-year timeline
interface EnhancedDepreciationModel {
  schedule: Array<{
    year: number;
    month: number;  // For partial year calculations

    // Depreciation breakdown
    costSegregation: number;      // Year 1: 25% of building basis
    bonusDepreciation: number;     // Federal bonus portion
    straightLine: number;          // Years 2-10: Annual straight-line
    totalDepreciation: number;     // Sum for the year

    // Tax benefit calculation
    federalBenefit: number;        // Federal tax savings
    stateBenefit: number;          // State tax savings (with conformity)
    hdcFee: number;               // 10% HDC fee
    netBenefit: number;           // After HDC fee

    // Utilization tracking
    utilized: number;             // Amount used this year
    carryforward: number;         // Unused amount carrying forward
    source: 'current' | 'carryforward' | 'both';
  }>;

  // Summary metrics
  totalDepreciation: number;
  totalTaxBenefit: number;
  totalUtilized: number;
  remainingCarryforward: number;
}

// Implementation
function buildDepreciationSchedule(params: CalculationParams): EnhancedDepreciationModel {
  const buildingBasis = params.projectCost - params.landValue;
  const schedule = [];

  // Year 1: Cost segregation + bonus
  const year1CostSeg = buildingBasis * 0.25;  // Empirically validated 25%
  schedule.push({
    year: 1,
    costSegregation: year1CostSeg,
    bonusDepreciation: year1CostSeg,  // 100% bonus on segregated portion
    straightLine: 0,
    totalDepreciation: year1CostSeg,
    federalBenefit: year1CostSeg * params.federalTaxRate,
    stateBenefit: applyStateConformity(year1CostSeg, params.state),
    hdcFee: (year1CostSeg * params.effectiveTaxRate) * 0.10,
    netBenefit: calculateNetBenefit(year1CostSeg, params)
  });

  // Years 2-10: Straight-line on remaining basis
  const remainingBasis = buildingBasis * 0.75;
  const annualStraightLine = remainingBasis / 27.5;

  for (let year = 2; year <= 10; year++) {
    schedule.push({
      year,
      costSegregation: 0,
      bonusDepreciation: 0,
      straightLine: annualStraightLine,
      totalDepreciation: annualStraightLine,
      // ... calculate benefits
    });
  }

  return { schedule, ...calculateSummary(schedule) };
}
```

### 1.2 REP-Specific Tax Capacity Modeling (461(l) Tracking)

```typescript
interface REPTaxCapacityModel {
  // Annual 461(l) limitation tracking
  annualLimitations: Array<{
    year: number;

    // Income sources
    w2Income: number;
    businessIncome: number;
    rentalIncome: number;
    totalIncome: number;

    // 461(l) calculation
    excessBusinessLoss: number;      // Losses exceeding threshold
    section461lLimit: 626000;         // 2025 married filing jointly
    disallowedLoss: number;          // Amount over limit
    allowedLoss: number;             // Amount under limit

    // NOL tracking
    nolGenerated: number;            // Becomes NOL
    nolCarryforwardBeginning: number;
    nolUtilized: number;
    nolCarryforwardEnding: number;
  }>;

  // Planning capacity
  planningCapacity: {
    currentYearCapacity: number;     // Available for immediate use
    nolBank: number;                 // Total NOL carryforward
    totalCapacity: number;           // Current + NOL

    // Specific planning buckets
    iraConversionCapacity: number;   // Within 461(l) limit
    assetSaleCapacity: number;       // Can use NOLs
    businessIncomeOffset: number;    // Unlimited for business/rental
  };

  // Recommendations
  recommendations: {
    optimalIRAConversion: number;    // This year's recommended amount
    excessCapacityUse: string[];    // Suggestions for unused capacity
    nolStrategy: string;             // How to optimize NOL usage
  };
}

// Implementation for REPs
function calculateREPCapacity(params: REPParams): REPTaxCapacityModel {
  const limitations = [];
  let nolCarryforward = 0;

  for (let year = 1; year <= 10; year++) {
    const yearData = {
      year,
      w2Income: params.projectedW2[year],
      businessIncome: params.projectedBusiness[year],

      // Apply 461(l) to W-2 income
      excessBusinessLoss: Math.max(0, params.losses[year] - params.w2Income),
      disallowedLoss: Math.max(0, excessBusinessLoss - 626000),
      allowedLoss: Math.min(params.losses[year], 626000),

      // NOL tracking
      nolGenerated: disallowedLoss,
      nolCarryforwardBeginning: nolCarryforward,
      nolUtilized: calculateNOLUsage(params, year),
      nolCarryforwardEnding: nolCarryforward + disallowedLoss - nolUtilized
    };

    limitations.push(yearData);
    nolCarryforward = yearData.nolCarryforwardEnding;
  }

  return {
    annualLimitations: limitations,
    planningCapacity: calculatePlanningCapacity(limitations),
    recommendations: generateREPRecommendations(limitations)
  };
}
```

### 1.3 Non-REP Passive Loss Model (Unlimited Capacity)

```typescript
interface NonREPPassiveModel {
  // Unlimited passive gain offset capability
  passiveCapacity: {
    availableLosses: number;         // Total passive losses
    noAnnualLimit: true;             // Key differentiator

    // Capacity by gain type
    stockGainsCapacity: 'UNLIMITED';
    cryptoGainsCapacity: 'UNLIMITED';
    businessSaleCapacity: 'UNLIMITED';
    realEstateGainsCapacity: 'UNLIMITED';
  };

  // Utilization scenarios
  utilizationScenarios: Array<{
    gainAmount: number;              // $10M, $50M, $100M scenarios
    taxSavings: number;              // At capital gains rates
    percentCovered: number;          // % of gain eliminated
    remainingLosses: number;         // For future use
  }>;

  // Competitive advantage messaging
  advantages: {
    vsREP: string[];                 // "No $626K annual limit"
    vsTaxExempt: string[];          // "Better than muni bonds"
    immediateValue: number;          // Available today, not over time
  };
}

// Implementation for Non-REPs
function calculateNonREPCapacity(params: NonREPParams): NonREPPassiveModel {
  const totalLosses = params.depreciationSchedule.reduce((sum, year) =>
    sum + year.totalDepreciation, 0
  );

  // Calculate scenarios
  const scenarios = [10_000_000, 50_000_000, 100_000_000].map(gainAmount => ({
    gainAmount,
    taxSavings: Math.min(gainAmount, totalLosses) * params.capitalGainsRate,
    percentCovered: Math.min(100, (totalLosses / gainAmount) * 100),
    remainingLosses: Math.max(0, totalLosses - gainAmount)
  }));

  return {
    passiveCapacity: {
      availableLosses: totalLosses,
      noAnnualLimit: true,
      stockGainsCapacity: 'UNLIMITED',
      cryptoGainsCapacity: 'UNLIMITED',
      businessSaleCapacity: 'UNLIMITED',
      realEstateGainsCapacity: 'UNLIMITED'
    },
    utilizationScenarios: scenarios,
    advantages: {
      vsREP: [
        `No $626K annual limitation - use ${formatCurrency(totalLosses)} immediately`,
        'No NOL carryforward complexity',
        'Immediate full value realization'
      ],
      vsTaxExempt: [
        `${params.capitalGainsRate * 100}% tax savings vs 3% muni yield`,
        'Liquidity maintained',
        'No opportunity cost'
      ],
      immediateValue: totalLosses * params.capitalGainsRate
    }
  };
}
```

---

## PHASE 2: REP PLANNING DASHBOARDS (Week 3-4)
*Specific tools for sophisticated REP tax planning*

### 2.1 IRA Conversion Planning Component

```typescript
interface IRAConversionPlanner {
  // Current IRA status
  currentIRA: {
    traditionalBalance: number;
    basis: number;
    taxableAmount: number;
  };

  // Optimized conversion schedule
  conversionSchedule: Array<{
    year: number;

    // Conversion calculation
    recommendedConversion: number;    // Within 461(l) capacity
    hdcLossesAvailable: number;      // From HDC investment
    taxOffset: number;               // Tax eliminated
    netTaxCost: number;              // After HDC offset

    // Account projections
    iraBalanceBeginning: number;
    conversionAmount: number;
    iraGrowth: number;               // Assumed growth rate
    iraBalanceEnding: number;

    rothBalanceBeginning: number;
    rothAddition: number;            // This year's conversion
    rothGrowth: number;              // Tax-free growth
    rothBalanceEnding: number;
  }>;

  // Long-term impact
  projectedOutcome: {
    totalConverted: number;
    totalTaxSaved: number;
    year20RothValue: number;         // Tax-free value in retirement
    year30RothValue: number;
    lifetimeAdvantage: number;       // vs keeping traditional
  };

  // Visual elements
  charts: {
    conversionTimeline: ChartData;   // Bar chart of annual conversions
    accountBalances: ChartData;      // Stacked area of IRA/Roth
    taxSavings: ChartData;          // Cumulative tax saved
  };
}

// React Component
const IRAConversionPlanner: React.FC = () => {
  const [iraBalance, setIraBalance] = useState(2_000_000);
  const [targetYears, setTargetYears] = useState(5);

  const conversionPlan = useMemo(() =>
    calculateOptimalConversions({
      iraBalance,
      targetYears,
      hdcLosses: hdcResults.depreciationSchedule,
      section461lLimit: 626_000
    }), [iraBalance, targetYears, hdcResults]
  );

  return (
    <div className="conversion-planner">
      <h2>IRA → Roth Conversion Optimizer</h2>

      <div className="input-section">
        <label>Traditional IRA Balance</label>
        <input
          type="number"
          value={iraBalance}
          onChange={(e) => setIraBalance(Number(e.target.value))}
        />

        <label>Target Conversion Period</label>
        <select value={targetYears} onChange={(e) => setTargetYears(Number(e.target.value))}>
          <option value={3}>3 Years (Aggressive)</option>
          <option value={5}>5 Years (Balanced)</option>
          <option value={7}>7 Years (Conservative)</option>
        </select>
      </div>

      <div className="conversion-schedule">
        {conversionPlan.schedule.map(year => (
          <YearCard key={year.year}>
            <h3>Year {year.year}</h3>
            <div>Convert: {formatCurrency(year.recommendedConversion)}</div>
            <div>Tax Saved: {formatCurrency(year.taxOffset)}</div>
            <div>Roth Balance: {formatCurrency(year.rothBalanceEnding)}</div>
          </YearCard>
        ))}
      </div>

      <div className="long-term-impact">
        <h3>30-Year Projection</h3>
        <div className="metric">
          <span>Tax-Free Roth Value:</span>
          <span className="value">{formatCurrency(conversionPlan.year30RothValue)}</span>
        </div>
        <div className="metric">
          <span>Lifetime Tax Advantage:</span>
          <span className="value">{formatCurrency(conversionPlan.lifetimeAdvantage)}</span>
        </div>
      </div>
    </div>
  );
};
```

### 2.2 Asset Sale Timing Optimizer

```typescript
interface AssetSaleOptimizer {
  // Asset details
  asset: {
    type: 'stock' | 'real_estate' | 'business' | 'crypto';
    currentValue: number;
    basis: number;
    gain: number;
    holdingPeriod: number;
  };

  // Timing analysis
  timingScenarios: Array<{
    sellYear: number;

    // Tax capacity
    hdcLossesAvailable: number;      // Cumulative by this year
    nolAvailable: number;            // NOL carryforward available
    totalOffsetCapacity: number;     // Combined capacity

    // Tax impact
    gainRealized: number;            // Projected gain if sold
    taxWithoutHDC: number;          // Normal tax liability
    taxWithHDC: number;             // After HDC offset
    taxSavings: number;             // Benefit from HDC

    // Coverage analysis
    coveragePercent: number;         // % of gain covered
    excessCapacity: number;         // Unused losses

    // NPV analysis
    npvOfWaiting: number;           // Time value consideration
    recommendation: 'SELL' | 'WAIT' | 'PARTIAL';
    reasoning: string;
  }>;

  // Optimal strategy
  optimalStrategy: {
    recommendedYear: number;
    primaryReason: string;
    alternativeOptions: Array<{
      strategy: string;
      benefit: string;
      consideration: string;
    }>;
  };
}

// React Component
const AssetSaleOptimizer: React.FC = () => {
  const [assetValue, setAssetValue] = useState(5_000_000);
  const [assetBasis, setAssetBasis] = useState(1_000_000);

  const saleAnalysis = useMemo(() =>
    analyzeOptimalSaleTiming({
      asset: { value: assetValue, basis: assetBasis },
      hdcSchedule: hdcResults.depreciationSchedule,
      repCapacity: repTaxCapacity
    }), [assetValue, assetBasis, hdcResults, repTaxCapacity]
  );

  return (
    <div className="sale-optimizer">
      <h2>Asset Sale Timing Analysis</h2>

      <div className="timeline-view">
        {saleAnalysis.timingScenarios.map(scenario => (
          <TimelineCard
            key={scenario.sellYear}
            year={scenario.sellYear}
            recommended={scenario.recommendation === 'SELL'}
          >
            <div className="coverage-meter">
              <ProgressBar percent={scenario.coveragePercent} />
              <span>{scenario.coveragePercent}% gain covered</span>
            </div>

            <div className="tax-impact">
              <div>Tax Savings: {formatCurrency(scenario.taxSavings)}</div>
              <div>Net Tax: {formatCurrency(scenario.taxWithHDC)}</div>
            </div>

            <div className="recommendation">
              <Badge type={scenario.recommendation}>
                {scenario.recommendation}
              </Badge>
              <p>{scenario.reasoning}</p>
            </div>
          </TimelineCard>
        ))}
      </div>

      <div className="optimal-strategy">
        <Alert type="success">
          <h3>Recommended Strategy</h3>
          <p>Sell in Year {saleAnalysis.optimalStrategy.recommendedYear}</p>
          <p>{saleAnalysis.optimalStrategy.primaryReason}</p>
        </Alert>
      </div>
    </div>
  );
};
```

---

## PHASE 3: COMPREHENSIVE PLANNING INTERFACE (Week 5-6)
*Unified dashboard bringing everything together*

### 3.1 Multi-Year Planning Dashboard

```typescript
// Main Planning Dashboard Component
const TaxPlanningDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(1);
  const [planningMode, setPlanningMode] = useState<'overview' | 'conversions' | 'sales'>('overview');

  return (
    <div className="planning-dashboard">
      {/* Year selector timeline */}
      <YearTimeline
        years={[1,2,3,4,5,6,7,8,9,10]}
        selected={selectedYear}
        onSelect={setSelectedYear}
        highlights={getHighlightYears()} // Key planning years
      />

      {/* Mode tabs */}
      <TabBar>
        <Tab active={planningMode === 'overview'} onClick={() => setPlanningMode('overview')}>
          Overview
        </Tab>
        <Tab active={planningMode === 'conversions'} onClick={() => setPlanningMode('conversions')}>
          IRA Conversions
        </Tab>
        <Tab active={planningMode === 'sales'} onClick={() => setPlanningMode('sales')}>
          Asset Sales
        </Tab>
      </TabBar>

      {/* Dynamic content based on mode */}
      <div className="dashboard-content">
        {planningMode === 'overview' && (
          <YearOverview year={selectedYear}>
            <DepreciationCard />
            <TaxCapacityCard />
            <RecommendationsCard />
          </YearOverview>
        )}

        {planningMode === 'conversions' && (
          <ConversionPlanning year={selectedYear} />
        )}

        {planningMode === 'sales' && (
          <AssetSalePlanning year={selectedYear} />
        )}
      </div>

      {/* Floating action panel */}
      <ActionPanel>
        <Button onClick={runScenario}>Run Scenario</Button>
        <Button onClick={exportPlan}>Export Plan</Button>
        <Button onClick={shareWithAdvisor}>Share with Advisor</Button>
      </ActionPanel>
    </div>
  );
};
```

### 3.2 Scenario Planning Components

```typescript
interface ScenarioPlanner {
  scenarios: Array<{
    id: string;
    name: string;
    parameters: ScenarioParams;
    results: ScenarioResults;
  }>;

  comparison: {
    baseCase: ScenarioResults;
    alternatives: ScenarioResults[];
    bestCase: ScenarioResults;
    recommendation: string;
  };
}

// Scenario Component
const ScenarioPlanner: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([baseScenario]);

  const addScenario = (template?: 'aggressive' | 'conservative' | 'custom') => {
    const newScenario = createScenarioFromTemplate(template);
    setScenarios([...scenarios, newScenario]);
  };

  return (
    <div className="scenario-planner">
      <div className="scenario-toolbar">
        <Button onClick={() => addScenario('aggressive')}>
          + Aggressive Strategy
        </Button>
        <Button onClick={() => addScenario('conservative')}>
          + Conservative Strategy
        </Button>
        <Button onClick={() => addScenario('custom')}>
          + Custom Scenario
        </Button>
      </div>

      <div className="scenario-grid">
        {scenarios.map(scenario => (
          <ScenarioCard key={scenario.id} scenario={scenario}>
            <ScenarioInputs
              params={scenario.parameters}
              onChange={(params) => updateScenario(scenario.id, params)}
            />
            <ScenarioResults results={scenario.results} />
          </ScenarioCard>
        ))}
      </div>

      <ComparisonView scenarios={scenarios} />
    </div>
  );
};
```

---

## PHASE 4: INTEGRATION & DATA FLOW (Week 7)
*Connect everything seamlessly*

### 4.1 Enhanced State Management

```typescript
// Zustand store for planning features
interface TaxPlanningStore {
  // Core HDC data
  hdcResults: InvestorAnalysisResults;

  // Enhanced planning data
  depreciationSchedule: EnhancedDepreciationModel;
  repTaxCapacity: REPTaxCapacityModel;
  nonRepCapacity: NonREPPassiveModel;

  // Planning scenarios
  iraConversionPlan: IRAConversionPlanner | null;
  assetSalePlan: AssetSaleOptimizer | null;
  activeScenarios: Scenario[];

  // Actions
  actions: {
    // Data updates
    updateHDCResults: (results: InvestorAnalysisResults) => void;
    generateDepreciationSchedule: () => void;
    calculateTaxCapacity: () => void;

    // Planning actions
    createIRAConversionPlan: (params: IRAParams) => void;
    analyzeAssetSale: (asset: Asset) => void;
    runScenario: (params: ScenarioParams) => void;

    // Export/Share
    exportPlanningReport: () => PlanningReport;
    generateAdvisorPackage: () => AdvisorPackage;
  };
}

// Integration with existing HDC Calculator
const useTaxPlanningIntegration = () => {
  const hdcResults = useHDCCalculator();
  const planningStore = useTaxPlanningStore();

  // Auto-update planning data when HDC results change
  useEffect(() => {
    if (hdcResults) {
      planningStore.actions.updateHDCResults(hdcResults);
      planningStore.actions.generateDepreciationSchedule();
      planningStore.actions.calculateTaxCapacity();
    }
  }, [hdcResults]);

  return planningStore;
};
```

### 4.2 Data Export & Professional Sharing

```typescript
interface PlanningReport {
  // Executive summary
  executiveSummary: {
    totalTaxSavings: number;
    recommendedStrategy: string;
    keyMilestones: Milestone[];
  };

  // Detailed schedules
  schedules: {
    depreciation: DepreciationSchedule;
    taxCapacity: TaxCapacitySchedule;
    conversionPlan?: IRAConversionSchedule;
    assetSales?: AssetSaleSchedule;
  };

  // Scenario analysis
  scenarios: ScenarioComparison;

  // Professional notes
  assumptions: string[];
  disclaimers: string[];
  methodology: string;
}

// Export functionality
const exportPlanningReport = async (): Promise<void> => {
  const report = generateComprehensiveReport();

  // Multiple format options
  const format = await selectExportFormat(); // PDF, Excel, JSON

  switch(format) {
    case 'PDF':
      await generatePDF(report);
      break;
    case 'Excel':
      await generateExcel(report);
      break;
    case 'JSON':
      await downloadJSON(report);
      break;
  }
};

// Advisor sharing
const shareWithAdvisor = async (advisorEmail: string): Promise<void> => {
  const package = {
    report: generateComprehensiveReport(),
    interactiveLink: generateSecureLink(),
    expiresIn: '30 days',
    permissions: ['view', 'comment', 'download']
  };

  await sendAdvisorPackage(advisorEmail, package);
};
```

---

## PHASE 5: USER EXPERIENCE ENHANCEMENTS (Week 8)
*Polish and optimize the interface*

### 5.1 Progressive Disclosure Interface

```typescript
// Wizard-based planning flow
const PlanningWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({});

  const steps = [
    { title: 'Investor Profile', component: InvestorProfileStep },
    { title: 'HDC Investment', component: HDCInvestmentStep },
    { title: 'Tax Situation', component: TaxSituationStep },
    { title: 'Planning Goals', component: PlanningGoalsStep },
    { title: 'Strategy Review', component: StrategyReviewStep }
  ];

  return (
    <WizardContainer>
      <ProgressBar current={step} total={steps.length} />

      <StepContent>
        {React.createElement(steps[step - 1].component, {
          data: wizardData,
          onUpdate: (data) => setWizardData({...wizardData, ...data}),
          onNext: () => setStep(step + 1),
          onBack: () => setStep(step - 1)
        })}
      </StepContent>

      <NavigationButtons>
        <Button onClick={() => setStep(step - 1)} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={() => setStep(step + 1)} disabled={step === steps.length}>
          Next
        </Button>
      </NavigationButtons>
    </WizardContainer>
  );
};

// REP vs Non-REP branching
const TaxSituationStep: React.FC<StepProps> = ({ data, onUpdate, onNext }) => {
  return (
    <div>
      <h2>Are you a Real Estate Professional?</h2>

      <OptionCard
        selected={data.investorType === 'rep'}
        onClick={() => onUpdate({ investorType: 'rep' })}
      >
        <h3>Yes - Real Estate Professional</h3>
        <ul>
          <li>750+ hours in real estate</li>
          <li>Can offset W-2 income (with limits)</li>
          <li>Subject to §461(l) limitation</li>
        </ul>
      </OptionCard>

      <OptionCard
        selected={data.investorType === 'non-rep'}
        onClick={() => onUpdate({ investorType: 'non-rep' })}
      >
        <h3>No - Passive Investor</h3>
        <ul>
          <li>Unlimited passive gain offset</li>
          <li>No annual limitations</li>
          <li>Perfect for large capital gains</li>
        </ul>
      </OptionCard>

      {data.investorType && (
        <div className="next-step">
          <p>Great! Let's optimize your {data.investorType === 'rep' ? 'REP' : 'passive'} strategy.</p>
          <Button onClick={onNext}>Continue</Button>
        </div>
      )}
    </div>
  );
};
```

### 5.2 Mobile-Responsive Planning Tools

```typescript
// Responsive grid system
const ResponsiveGrid = styled.div`
  display: grid;
  gap: 1rem;

  /* Mobile: Single column */
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  /* Tablet: Two columns */
  @media (min-width: 769px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Desktop: Three columns */
  @media (min-width: 1025px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// Mobile-optimized planning view
const MobilePlanningView: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <MobileContainer>
      <SwipeableViews>
        <YearView year={1} />
        <YearView year={2} />
        <YearView year={3} />
      </SwipeableViews>

      <CollapsibleSections>
        <Section
          title="Tax Capacity"
          expanded={expandedSection === 'capacity'}
          onToggle={() => setExpandedSection('capacity')}
        >
          <CompactCapacityView />
        </Section>

        <Section
          title="IRA Planning"
          expanded={expandedSection === 'ira'}
          onToggle={() => setExpandedSection('ira')}
        >
          <CompactIRAView />
        </Section>
      </CollapsibleSections>

      <FloatingActionButton onClick={openQuickActions}>
        <PlusIcon />
      </FloatingActionButton>
    </MobileContainer>
  );
};
```

---

## IMPLEMENTATION PRIORITIES & TIMELINE

### Week 1-2: Foundation
✅ Multi-year depreciation schedule
✅ REP tax capacity model with 461(l) tracking
✅ Non-REP passive loss model
✅ Core data structures

### Week 3-4: REP Planning Tools
✅ IRA conversion optimizer
✅ Asset sale timing analyzer
✅ NOL tracking and optimization

### Week 5-6: Unified Interface
✅ Multi-year planning dashboard
✅ Scenario planning tools
✅ Visual timeline interface

### Week 7: Integration
✅ State management enhancement
✅ Data export capabilities
✅ Advisor sharing features

### Week 8: Polish
✅ Progressive disclosure wizard
✅ Mobile responsiveness
✅ User testing and refinement

---

## SUCCESS METRICS

### User Engagement
- **Time in planning tools**: Target 15+ minutes per session
- **Scenarios created**: Average 3+ per user
- **Report exports**: 40% of users export plans

### Planning Effectiveness
- **IRA conversion adoption**: 30% of REPs create conversion plan
- **Asset sale optimization**: 25% use timing analyzer
- **Multi-year view usage**: 80% explore beyond year 1

### Business Impact
- **Conversion to investment**: 20% increase
- **Average investment size**: 15% increase
- **Advisor referrals**: 2x increase

---

## TECHNICAL CONSIDERATIONS

### Performance Optimization
```typescript
// Memoize expensive calculations
const depreciationSchedule = useMemo(() =>
  buildDepreciationSchedule(params),
  [params.projectCost, params.landValue, params.bonusRate]
);

// Lazy load planning components
const IRAPlanner = lazy(() => import('./components/IRAPlanner'));
const AssetOptimizer = lazy(() => import('./components/AssetOptimizer'));

// Virtualize long lists
const YearList = () => (
  <VirtualList
    height={600}
    itemCount={30}
    itemSize={100}
    renderItem={({ index }) => <YearCard year={index + 1} />}
  />
);
```

### Testing Strategy
```typescript
describe('Tax Planning Platform', () => {
  describe('Depreciation Schedule', () => {
    it('should calculate 25% cost segregation in year 1', () => {
      const schedule = buildDepreciationSchedule(mockParams);
      expect(schedule[0].costSegregation).toBe(buildingBasis * 0.25);
    });
  });

  describe('REP Capacity', () => {
    it('should apply 461(l) limitation correctly', () => {
      const capacity = calculateREPCapacity(mockREPParams);
      expect(capacity.annualLimitations[0].allowedLoss).toBeLessThanOrEqual(626000);
    });
  });

  describe('IRA Conversion', () => {
    it('should optimize within annual capacity', () => {
      const plan = optimizeIRAConversion(mockIRAParams);
      plan.schedule.forEach(year => {
        expect(year.recommendedConversion).toBeLessThanOrEqual(year.hdcLossesAvailable);
      });
    });
  });
});
```

---

## CONCLUSION

This implementation transforms the HDC Calculator into a comprehensive tax planning platform that:

1. **Provides timeline visibility** - 10-year depreciation schedules show exactly when losses occur
2. **Enables sophisticated planning** - IRA conversions, asset sales, NOL optimization
3. **Differentiates REP vs Non-REP** - Tailored strategies for each investor type
4. **Supports real decision-making** - Scenario analysis and timing optimization
5. **Facilitates advisor collaboration** - Professional reports and sharing capabilities

The phased approach allows for rapid initial deployment (2 weeks for core features) while building toward the full vision over 8 weeks. Each phase delivers immediate value while laying groundwork for subsequent enhancements.

The focus on REP planning (IRA conversions, 461(l) management) and passive investor advantages (unlimited capacity) directly addresses the needs of high-net-worth finance professionals who are the primary target market.