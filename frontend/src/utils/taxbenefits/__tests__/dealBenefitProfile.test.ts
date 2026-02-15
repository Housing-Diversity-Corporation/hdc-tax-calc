/**
 * Deal Benefit Profile Tests
 *
 * Tests for extracting deal benefit profiles from calculator results
 * and converting them back to BenefitStream format.
 */

import { extractDealBenefitProfile, dealToBenefitStream } from '../dealBenefitProfile';
import { calculateTaxUtilization, InvestorProfile } from '../investorTaxUtilization';
import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';
import type { CalculationParams, InvestorAnalysisResults, CashFlowItem } from '../../../types/taxbenefits';
import type { DepreciationSchedule, DepreciationYear } from '../depreciationSchedule';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create mock CalculationParams with sensible defaults
 * Based on a $100M project, 5% equity, 10-year hold
 */
function createMockCalculationParams(overrides: Partial<CalculationParams> = {}): CalculationParams {
  return {
    dealName: 'Test Project Alpha',
    selectedState: 'CA',
    fundEntryYear: 2024,
    projectCost: 100_000_000,
    holdPeriod: 10,
    ozEnabled: false,
    placedInServiceMonth: 6,
    seniorDebtPct: 65,
    philanthropicDebtPct: 30,
    investorEquityPct: 5,
    yearOneDepreciationPct: 25,
    stateLIHTCIntegration: {
      creditPath: 'direct_use',
      syndicationRate: 0.85,
      grossCredit: 3_000_000,
      netProceeds: 2_550_000,
      yearlyCredits: Array(11).fill(272_727),
      totalCreditBenefit: 3_000_000,
      treatment: 'tax_benefit',
      warnings: [],
    },
    // Required fields from CalculationParams
    landValue: 10_000_000,
    yearOneNOI: 6_000_000,
    noiGrowthRate: 2,
    exitCapRate: 5.5,
    seniorDebtRate: 5.5,
    seniorDebtAmortization: 30,
    seniorDebtIOYears: 3,
    philanthropicDebtRate: 2,
    federalTaxRate: 37,
    stateTaxRate: 13.3,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 13.3,
    investorTrack: 'non-rep',
    filingStatus: 'married',
    ...overrides,
  } as CalculationParams;
}

/**
 * Create mock InvestorAnalysisResults
 */
function createMockInvestorAnalysisResults(overrides: Partial<InvestorAnalysisResults> = {}): InvestorAnalysisResults {
  return {
    totalInvestment: 5_000_000, // $5M for 5% equity on $100M project
    exitProceeds: 15_000_000,
    exitValue: 120_000_000,
    adjustedBasis: 115_000_000,
    syndicatedEquityOffset: 1_000_000,
    stateLIHTCSyndicationProceeds: 1_000_000,
    totalReturns: 20_000_000,
    multiple: 4.0,
    irr: 0.15,
    ...overrides,
  } as InvestorAnalysisResults;
}

/**
 * Create mock DepreciationSchedule
 */
function createMockDepreciationSchedule(overrides: Partial<DepreciationSchedule> = {}): DepreciationSchedule {
  // Standard 10-year schedule with Year 1 spike
  const year1Depreciation = 16_000_000; // 20% x $80M depreciable basis
  const annualStraightLine = 2_327_273; // ($80M - $16M) / 27.5 years

  const schedule: DepreciationYear[] = [];
  let cumulativeDepreciation = 0;

  for (let year = 1; year <= 10; year++) {
    const totalDepreciation = year === 1 ? year1Depreciation : annualStraightLine;
    cumulativeDepreciation += totalDepreciation;

    schedule.push({
      year,
      costSegregation: year === 1 ? 20_000_000 : 0,
      bonusDepreciation: year === 1 ? 16_000_000 : 0,
      straightLineDepreciation: year === 1 ? 0 : annualStraightLine,
      totalDepreciation,
      federalBenefit: totalDepreciation * 0.37,
      stateBenefit: totalDepreciation * 0.133,
      stateConformityAdjustment: 0,
      totalTaxBenefit: totalDepreciation * (0.37 + 0.133),
      hdcFee: totalDepreciation * (0.37 + 0.133) * 0.10,
      netBenefit: totalDepreciation * (0.37 + 0.133) * 0.90,
      cumulativeDepreciation,
      cumulativeTaxBenefit: cumulativeDepreciation * (0.37 + 0.133),
      cumulativeNetBenefit: cumulativeDepreciation * (0.37 + 0.133) * 0.90,
    });
  }

  const totalDepreciation = cumulativeDepreciation;

  return {
    schedule,
    totalDepreciation,
    totalTaxBenefit: totalDepreciation * (0.37 + 0.133),
    totalHDCFees: totalDepreciation * (0.37 + 0.133) * 0.10,
    totalNetBenefit: totalDepreciation * (0.37 + 0.133) * 0.90,
    year1Spike: year1Depreciation,
    averageAnnualBenefit: totalDepreciation * (0.37 + 0.133) / 10,
    breakEvenYear: 3,
    annualBenefitAfterYear1: annualStraightLine * (0.37 + 0.133),
    ...overrides,
  };
}

/**
 * Create mock CashFlowItem array
 */
function createMockCashFlows(holdPeriod: number = 10): CashFlowItem[] {
  const cashFlows: CashFlowItem[] = [];

  for (let year = 1; year <= holdPeriod; year++) {
    cashFlows.push({
      year,
      federalLIHTCCredit: 700_000, // $700K/year
      stateLIHTCCredit: 300_000, // $300K/year
      operatingCashFlow: 500_000, // $500K/year
      noi: 6_000_000 * Math.pow(1.02, year - 1),
      debtServicePayments: 4_000_000,
      cashAfterDebtService: 2_000_000,
    } as CashFlowItem);
  }

  return cashFlows;
}

/**
 * Create mock InvestorProfile for round-trip testing
 */
function createMockInvestorProfile(overrides: Partial<InvestorProfile> = {}): InvestorProfile {
  return {
    annualPassiveIncome: 2_000_000,
    annualOrdinaryIncome: 1_000_000,
    annualPortfolioIncome: 500_000,
    filingStatus: 'MFJ',
    investorTrack: 'non-rep',
    groupingElection: false,
    federalOrdinaryRate: 37,
    federalCapGainsRate: 0.238,
    investorState: 'CA',
    stateOrdinaryRate: 0.133,
    stateCapGainsRate: 0.133,
    investorEquity: 5_000_000,
    ...overrides,
  };
}

const TEST_CONDUIT_ID = 42;

// =============================================================================
// Test Group 1: extractDealBenefitProfile()
// =============================================================================

describe('extractDealBenefitProfile', () => {
  describe('basic extraction', () => {
    it('should produce a valid DBP with all required fields populated', () => {
      const inputs = createMockCalculationParams();
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      // Identity fields
      expect(dbp.dealConduitId).toBe(TEST_CONDUIT_ID);
      expect(dbp.dealName).toBe('Test Project Alpha');
      expect(dbp.propertyState).toBe('CA');
      expect(dbp.fundYear).toBe(2024);

      // Economics
      expect(dbp.projectCost).toBe(100_000_000);
      expect(dbp.grossEquity).toBe(5_000_000);

      // Schedules should have correct length
      expect(dbp.depreciationSchedule).toHaveLength(10);
      expect(dbp.lihtcSchedule).toHaveLength(10);
      expect(dbp.stateLihtcSchedule).toHaveLength(10);
      expect(dbp.operatingCashFlow).toHaveLength(10);

      // Exit values
      expect(dbp.holdPeriod).toBe(10);
      expect(dbp.exitProceeds).toBe(15_000_000);

      // Structure
      expect(dbp.seniorDebtPct).toBe(65);
      expect(dbp.philDebtPct).toBe(30);
      expect(dbp.equityPct).toBe(5);

      // Timestamps
      expect(dbp.extractedAt).toBeDefined();
      expect(new Date(dbp.extractedAt).getTime()).not.toBeNaN();
    });

    it('should extract schedule arrays with correct values', () => {
      const inputs = createMockCalculationParams();
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      // Check depreciation values
      expect(dbp.depreciationSchedule[0]).toBe(16_000_000); // Year 1 spike
      expect(dbp.depreciationSchedule[1]).toBeCloseTo(2_327_273, -2); // Straight-line

      // Check LIHTC values
      expect(dbp.lihtcSchedule[0]).toBe(700_000);
      expect(dbp.stateLihtcSchedule[0]).toBe(300_000);
      expect(dbp.operatingCashFlow[0]).toBe(500_000);
    });
  });

  describe('new fields (IMPL-084)', () => {
    it('should populate costSegregationPercent from yearOneDepreciationPct', () => {
      const inputs = createMockCalculationParams({ yearOneDepreciationPct: 25 });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.costSegregationPercent).toBe(25);
    });

    it('should populate depreciableBasis from depreciation schedule sum', () => {
      const inputs = createMockCalculationParams();
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      // depreciableBasis = sum of all annual depreciation values
      const expectedBasis = depSchedule.schedule.reduce((sum, yr) => sum + yr.totalDepreciation, 0);
      expect(dbp.depreciableBasis).toBe(expectedBasis);
    });

    it('should calculate projectedExitYear as fundYear + holdPeriod', () => {
      const inputs = createMockCalculationParams({ fundEntryYear: 2024, holdPeriod: 10 });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.projectedExitYear).toBe(2034);
    });
  });

  describe('fallback values', () => {
    it('should use fallbacks for missing optional fields', () => {
      const inputs = createMockCalculationParams({
        dealName: undefined,
        fundEntryYear: undefined,
        ozEnabled: undefined,
      });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.dealName).toBe('Unnamed Deal');
      expect(dbp.fundYear).toBe(new Date().getFullYear());
      expect(dbp.ozEnabled).toBe(false);
    });

    it('should default propertyState to WA when selectedState is undefined', () => {
      const inputs = createMockCalculationParams({ selectedState: undefined });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.propertyState).toBe('WA');
    });
  });

  describe('equity calculations', () => {
    it('should calculate net equity correctly from totalInvestment and syndicatedEquityOffset', () => {
      const inputs = createMockCalculationParams();
      const results = createMockInvestorAnalysisResults({
        totalInvestment: 5_000_000,
        syndicatedEquityOffset: 1_000_000,
      });
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.grossEquity).toBe(5_000_000);
      expect(dbp.netEquity).toBe(4_000_000); // 5M - 1M offset
    });

    it('should handle zero syndicatedEquityOffset', () => {
      const inputs = createMockCalculationParams();
      const results = createMockInvestorAnalysisResults({
        totalInvestment: 5_000_000,
        syndicatedEquityOffset: undefined,
      });
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.grossEquity).toBe(5_000_000);
      expect(dbp.netEquity).toBe(5_000_000); // No offset
    });
  });

  describe('recapture exposure', () => {
    it('should calculate recapture exposure as 25% of cumulative depreciation', () => {
      const inputs = createMockCalculationParams();
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule({
        totalDepreciation: 8_000_000,
      });
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.cumulativeDepreciation).toBe(8_000_000);
      expect(dbp.recaptureExposure).toBe(2_000_000); // 25% of 8M
    });
  });

  describe('philanthropicDebtPct mapping', () => {
    it('should map philanthropicDebtPct to philDebtPct correctly', () => {
      const inputs = createMockCalculationParams({
        philanthropicDebtPct: 30,
      });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.philDebtPct).toBe(30);
    });
  });

  describe('state LIHTC integration', () => {
    it('should extract stateLihtcPath and syndicationRate from stateLIHTCIntegration', () => {
      const inputs = createMockCalculationParams({
        stateLIHTCIntegration: {
          creditPath: 'syndicated',
          syndicationRate: 0.92,
          grossCredit: 3_000_000,
          netProceeds: 2_760_000,
          yearlyCredits: [],
          totalCreditBenefit: 0,
          treatment: 'capital_stack',
          warnings: [],
        },
      });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.stateLihtcPath).toBe('syndicated');
      expect(dbp.syndicationRate).toBe(0.92);
    });

    it('should default to none and 0 when stateLIHTCIntegration is undefined', () => {
      const inputs = createMockCalculationParams({
        stateLIHTCIntegration: undefined,
      });
      const results = createMockInvestorAnalysisResults();
      const depSchedule = createMockDepreciationSchedule();
      const cashFlows = createMockCashFlows();

      const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

      expect(dbp.stateLihtcPath).toBe('none');
      expect(dbp.syndicationRate).toBe(0);
    });
  });
});

// =============================================================================
// Test Group 2: dealToBenefitStream()
// =============================================================================

describe('dealToBenefitStream', () => {
  describe('basic conversion', () => {
    it('should produce a valid BenefitStream with all required fields', () => {
      const dbp: DealBenefitProfile = {
        dealConduitId: 1,
        dealName: 'Test Deal',
        propertyState: 'CA',
        fundYear: 2024,
        projectCost: 100_000_000,
        grossEquity: 5_000_000,
        netEquity: 4_000_000,
        syndicationProceeds: 1_000_000,
        depreciationSchedule: [16_000_000, 2_300_000, 2_300_000],
        lihtcSchedule: [700_000, 700_000, 700_000],
        stateLihtcSchedule: [300_000, 300_000, 300_000],
        operatingCashFlow: [500_000, 500_000, 500_000],
        holdPeriod: 10,
        exitProceeds: 15_000_000,
        cumulativeDepreciation: 20_600_000,
        recaptureExposure: 5_150_000,
        projectedAppreciation: 5_000_000,
        capitalGainsTax: 1_190_000,
        ozEnabled: false,
        pisMonth: 6,
        pisYear: 2024,
        seniorDebtPct: 65,
        philDebtPct: 30,
        equityPct: 5,
        stateLihtcPath: 'direct',
        syndicationRate: 0.85,
        extractedAt: new Date().toISOString(),
      };

      const stream = dealToBenefitStream(dbp);

      // All required fields should be present
      expect(stream.annualDepreciation).toBeDefined();
      expect(stream.annualLIHTC).toBeDefined();
      expect(stream.annualStateLIHTC).toBeDefined();
      expect(stream.annualOperatingCF).toBeDefined();
      expect(stream.exitEvents).toBeDefined();
      expect(stream.grossEquity).toBeDefined();
      expect(stream.netEquity).toBeDefined();
      expect(stream.syndicationOffset).toBeDefined();

      // Type checks
      expect(Array.isArray(stream.annualDepreciation)).toBe(true);
      expect(Array.isArray(stream.exitEvents)).toBe(true);
      expect(typeof stream.grossEquity).toBe('number');
    });
  });

  describe('exit event construction', () => {
    it('should construct exit event with correct ExitEvent interface fields', () => {
      const dbp: DealBenefitProfile = {
        dealConduitId: 1,
        dealName: 'Test Deal',
        propertyState: 'CA',
        fundYear: 2024,
        projectCost: 100_000_000,
        grossEquity: 5_000_000,
        netEquity: 4_000_000,
        syndicationProceeds: 1_000_000,
        depreciationSchedule: [],
        lihtcSchedule: [],
        stateLihtcSchedule: [],
        operatingCashFlow: [],
        holdPeriod: 10,
        exitProceeds: 15_000_000,
        cumulativeDepreciation: 8_000_000,
        recaptureExposure: 2_000_000,
        projectedAppreciation: 5_000_000,
        capitalGainsTax: 1_190_000,
        ozEnabled: true,
        pisMonth: 6,
        pisYear: 2024,
        seniorDebtPct: 65,
        philDebtPct: 30,
        equityPct: 5,
        stateLihtcPath: 'direct',
        syndicationRate: 0.85,
        extractedAt: new Date().toISOString(),
      };

      const stream = dealToBenefitStream(dbp);

      expect(stream.exitEvents).toHaveLength(1);
      const exitEvent = stream.exitEvents[0];

      expect(exitEvent.year).toBe(10);
      expect(exitEvent.exitProceeds).toBe(15_000_000);
      expect(exitEvent.cumulativeDepreciation).toBe(8_000_000);
      expect(exitEvent.recaptureExposure).toBe(2_000_000);
      expect(exitEvent.appreciationGain).toBe(5_000_000);
      expect(exitEvent.ozEnabled).toBe(true);
    });
  });

  describe('equity values', () => {
    it('should preserve equity values correctly', () => {
      const dbp: DealBenefitProfile = {
        dealConduitId: 1,
        dealName: 'Test Deal',
        propertyState: 'CA',
        fundYear: 2024,
        projectCost: 100_000_000,
        grossEquity: 5_000_000,
        netEquity: 4_000_000,
        syndicationProceeds: 1_000_000,
        depreciationSchedule: [],
        lihtcSchedule: [],
        stateLihtcSchedule: [],
        operatingCashFlow: [],
        holdPeriod: 10,
        exitProceeds: 15_000_000,
        cumulativeDepreciation: 8_000_000,
        recaptureExposure: 2_000_000,
        projectedAppreciation: 5_000_000,
        capitalGainsTax: 1_190_000,
        ozEnabled: false,
        pisMonth: 6,
        pisYear: 2024,
        seniorDebtPct: 65,
        philDebtPct: 30,
        equityPct: 5,
        stateLihtcPath: 'direct',
        syndicationRate: 0.85,
        extractedAt: new Date().toISOString(),
      };

      const stream = dealToBenefitStream(dbp);

      expect(stream.grossEquity).toBe(5_000_000);
      expect(stream.netEquity).toBe(4_000_000);
      expect(stream.syndicationOffset).toBe(1_000_000);
    });
  });

  describe('schedule arrays', () => {
    it('should pass through schedule arrays correctly', () => {
      const depreciationSchedule = [16_000_000, 2_300_000, 2_300_000, 2_300_000, 2_300_000];
      const lihtcSchedule = [700_000, 700_000, 700_000, 700_000, 700_000];
      const stateLihtcSchedule = [300_000, 300_000, 300_000, 300_000, 300_000];
      const operatingCashFlow = [500_000, 500_000, 500_000, 500_000, 500_000];

      const dbp: DealBenefitProfile = {
        dealConduitId: 1,
        dealName: 'Test Deal',
        propertyState: 'CA',
        fundYear: 2024,
        projectCost: 100_000_000,
        grossEquity: 5_000_000,
        netEquity: 4_000_000,
        syndicationProceeds: 1_000_000,
        depreciationSchedule,
        lihtcSchedule,
        stateLihtcSchedule,
        operatingCashFlow,
        holdPeriod: 5,
        exitProceeds: 15_000_000,
        cumulativeDepreciation: 25_200_000,
        recaptureExposure: 6_300_000,
        projectedAppreciation: 5_000_000,
        capitalGainsTax: 1_190_000,
        ozEnabled: false,
        pisMonth: 6,
        pisYear: 2024,
        seniorDebtPct: 65,
        philDebtPct: 30,
        equityPct: 5,
        stateLihtcPath: 'direct',
        syndicationRate: 0.85,
        extractedAt: new Date().toISOString(),
      };

      const stream = dealToBenefitStream(dbp);

      expect(stream.annualDepreciation).toEqual(depreciationSchedule);
      expect(stream.annualLIHTC).toEqual(lihtcSchedule);
      expect(stream.annualStateLIHTC).toEqual(stateLihtcSchedule);
      expect(stream.annualOperatingCF).toEqual(operatingCashFlow);
    });
  });
});

// =============================================================================
// Test Group 3: Round-Trip with Tax Utilization Engine
// =============================================================================

describe('Round-trip: DBP -> BenefitStream -> calculateTaxUtilization', () => {
  it('should produce valid tax utilization result from a realistic DBP', () => {
    // Create realistic inputs
    const inputs = createMockCalculationParams();
    const results = createMockInvestorAnalysisResults();
    const depSchedule = createMockDepreciationSchedule();
    const cashFlows = createMockCashFlows(10);

    // Extract DBP
    const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);

    // Convert back to BenefitStream
    const benefitStream = dealToBenefitStream(dbp);

    // Scale values to millions for the tax utilization engine
    // The engine expects values in millions, but our mock data is in dollars
    const scaledBenefitStream = {
      ...benefitStream,
      annualDepreciation: benefitStream.annualDepreciation.map(v => v / 1_000_000),
      annualLIHTC: benefitStream.annualLIHTC.map(v => v / 1_000_000),
      annualStateLIHTC: benefitStream.annualStateLIHTC.map(v => v / 1_000_000),
      annualOperatingCF: benefitStream.annualOperatingCF.map(v => v / 1_000_000),
      exitEvents: benefitStream.exitEvents.map(e => ({
        ...e,
        exitProceeds: e.exitProceeds / 1_000_000,
        cumulativeDepreciation: e.cumulativeDepreciation / 1_000_000,
        recaptureExposure: e.recaptureExposure / 1_000_000,
        appreciationGain: e.appreciationGain / 1_000_000,
      })),
      grossEquity: benefitStream.grossEquity / 1_000_000,
      netEquity: benefitStream.netEquity / 1_000_000,
      syndicationOffset: benefitStream.syndicationOffset / 1_000_000,
    };

    // Create investor profile
    const investorProfile = createMockInvestorProfile();

    // Run through tax utilization engine
    const result = calculateTaxUtilization(scaledBenefitStream, investorProfile);

    // Verify result is valid
    expect(result).toBeDefined();
    expect(result.annualUtilization).toBeDefined();
    expect(result.annualUtilization.length).toBeGreaterThan(0);
    expect(result.overallUtilizationRate).toBeGreaterThanOrEqual(0);
    expect(result.overallUtilizationRate).toBeLessThanOrEqual(1);

    // Verify treatment determination
    expect(['nonpassive', 'passive']).toContain(result.treatment);
    expect(result.treatmentLabel).toBeDefined();

    // Verify fit indicator
    expect(['green', 'yellow', 'red']).toContain(result.fitIndicator);
  });

  it('should handle REP with grouping election (nonpassive treatment)', () => {
    const inputs = createMockCalculationParams();
    const results = createMockInvestorAnalysisResults();
    const depSchedule = createMockDepreciationSchedule();
    const cashFlows = createMockCashFlows(10);

    const dbp = extractDealBenefitProfile(inputs, results, depSchedule, cashFlows, TEST_CONDUIT_ID);
    const benefitStream = dealToBenefitStream(dbp);

    // Scale to millions
    const scaledBenefitStream = {
      ...benefitStream,
      annualDepreciation: benefitStream.annualDepreciation.map(v => v / 1_000_000),
      annualLIHTC: benefitStream.annualLIHTC.map(v => v / 1_000_000),
      annualStateLIHTC: benefitStream.annualStateLIHTC.map(v => v / 1_000_000),
      annualOperatingCF: benefitStream.annualOperatingCF.map(v => v / 1_000_000),
      exitEvents: benefitStream.exitEvents.map(e => ({
        ...e,
        exitProceeds: e.exitProceeds / 1_000_000,
        cumulativeDepreciation: e.cumulativeDepreciation / 1_000_000,
        recaptureExposure: e.recaptureExposure / 1_000_000,
        appreciationGain: e.appreciationGain / 1_000_000,
      })),
      grossEquity: benefitStream.grossEquity / 1_000_000,
      netEquity: benefitStream.netEquity / 1_000_000,
      syndicationOffset: benefitStream.syndicationOffset / 1_000_000,
    };

    // REP with grouping election
    const investorProfile = createMockInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
    });

    const result = calculateTaxUtilization(scaledBenefitStream, investorProfile);

    expect(result.treatment).toBe('nonpassive');
    expect(result.treatmentLabel).toContain('REP');
  });
});
