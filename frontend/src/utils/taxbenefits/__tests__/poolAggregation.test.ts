/**
 * Pool Aggregation Engine Tests (IMPL-085)
 *
 * Tests for aggregatePoolToBenefitStream(), scaleBenefitStreamToMillions(),
 * buildInvestorProfileFromTaxInfo(), and round-trip integration with
 * calculateTaxUtilization().
 */

import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';
import type { InvestorTaxInfo } from '../../../types/investorTaxInfo';
import { dealToBenefitStream } from '../dealBenefitProfile';
import {
  aggregatePoolToBenefitStream,
  scaleBenefitStreamToMillions,
  buildInvestorProfileFromTaxInfo,
} from '../poolAggregation';
import { calculateTaxUtilization } from '../investorTaxUtilization';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDBP(overrides: Partial<DealBenefitProfile> = {}): DealBenefitProfile {
  const holdPeriod = overrides.holdPeriod || 10;
  // Year 1 bonus + straight-line remainder (values in DOLLARS)
  const yearOneDepr = 16_000_000;
  const annualDepr = 2_000_000;
  const depreciationSchedule = [yearOneDepr, ...new Array(holdPeriod - 1).fill(annualDepr)];
  const cumulativeDepreciation = depreciationSchedule.reduce((s, v) => s + v, 0);

  return {
    dealConduitId: 1,
    dealName: 'Test Deal',
    propertyState: 'WA',
    fundYear: 2024,
    projectCost: 100_000_000,
    grossEquity: 5_000_000,
    netEquity: 4_500_000,
    syndicationProceeds: 500_000,
    costSegregationPercent: 20,
    depreciableBasis: cumulativeDepreciation,
    depreciationSchedule,
    lihtcSchedule: new Array(holdPeriod).fill(700_000),
    stateLihtcSchedule: new Array(holdPeriod).fill(300_000),
    operatingCashFlow: new Array(holdPeriod).fill(500_000),
    holdPeriod,
    projectedExitYear: (overrides.fundYear || 2024) + holdPeriod,
    exitProceeds: 15_000_000,
    cumulativeDepreciation,
    recaptureExposure: cumulativeDepreciation * 0.25,
    projectedAppreciation: 5_000_000,
    capitalGainsTax: 1_190_000,
    ozEnabled: false,
    pisMonth: 1,
    pisYear: 2024,
    seniorDebtPct: 65,
    philDebtPct: 10,
    equityPct: 5,
    stateLihtcPath: 'none',
    syndicationRate: 0,
    extractedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Deal B: smaller project, entering pool one year later
function createDealB(): DealBenefitProfile {
  return createMockDBP({
    dealConduitId: 2,
    dealName: '701 S Jackson',
    fundYear: 2025,
    projectCost: 60_000_000,
    grossEquity: 3_000_000,
    netEquity: 2_700_000,
    syndicationProceeds: 300_000,
    holdPeriod: 10,
    depreciationSchedule: [12_000_000, 3_000_000, 3_000_000, 3_000_000, 3_000_000, 3_000_000, 3_000_000, 3_000_000, 3_000_000, 3_000_000],
    lihtcSchedule: new Array(10).fill(500_000),
    stateLihtcSchedule: new Array(10).fill(200_000),
    operatingCashFlow: new Array(10).fill(400_000),
    exitProceeds: 10_000_000,
    cumulativeDepreciation: 39_000_000,
    recaptureExposure: 39_000_000 * 0.25,
    projectedAppreciation: 3_000_000,
    capitalGainsTax: 714_000,
  });
}

// =============================================================================
// aggregatePoolToBenefitStream
// =============================================================================

describe('aggregatePoolToBenefitStream', () => {
  describe('empty pool', () => {
    it('should return empty BenefitStream with zero-length arrays', () => {
      const result = aggregatePoolToBenefitStream([]);

      expect(result.benefitStream.annualDepreciation).toEqual([]);
      expect(result.benefitStream.annualLIHTC).toEqual([]);
      expect(result.benefitStream.annualStateLIHTC).toEqual([]);
      expect(result.benefitStream.annualOperatingCF).toEqual([]);
      expect(result.benefitStream.exitEvents).toEqual([]);
      expect(result.benefitStream.grossEquity).toBe(0);
      expect(result.benefitStream.netEquity).toBe(0);
      expect(result.benefitStream.syndicationOffset).toBe(0);
    });

    it('should return zeroed meta', () => {
      const result = aggregatePoolToBenefitStream([]);

      expect(result.meta.dealCount).toBe(0);
      expect(result.meta.consolidatedHorizon).toBe(0);
      expect(result.meta.totalGrossEquity).toBe(0);
    });
  });

  describe('single deal', () => {
    it('should produce BenefitStream matching dealToBenefitStream output', () => {
      const dbp = createMockDBP();
      const poolResult = aggregatePoolToBenefitStream([dbp]);
      const directStream = dealToBenefitStream(dbp);

      // Schedule arrays should match
      expect(poolResult.benefitStream.annualDepreciation).toEqual(directStream.annualDepreciation);
      expect(poolResult.benefitStream.annualLIHTC).toEqual(directStream.annualLIHTC);
      expect(poolResult.benefitStream.annualStateLIHTC).toEqual(directStream.annualStateLIHTC);
      expect(poolResult.benefitStream.annualOperatingCF).toEqual(directStream.annualOperatingCF);

      // Equity values should match
      expect(poolResult.benefitStream.grossEquity).toBe(directStream.grossEquity);
      expect(poolResult.benefitStream.netEquity).toBe(directStream.netEquity);
      expect(poolResult.benefitStream.syndicationOffset).toBe(directStream.syndicationOffset);

      // Exit event year and values should match
      expect(poolResult.benefitStream.exitEvents).toHaveLength(1);
      expect(poolResult.benefitStream.exitEvents[0].year).toBe(directStream.exitEvents[0].year);
      expect(poolResult.benefitStream.exitEvents[0].exitProceeds).toBe(directStream.exitEvents[0].exitProceeds);
    });

    it('should set meta correctly for single deal', () => {
      const dbp = createMockDBP({ fundYear: 2024, holdPeriod: 10 });
      const result = aggregatePoolToBenefitStream([dbp]);

      expect(result.meta.poolStartYear).toBe(2024);
      expect(result.meta.poolEndYear).toBe(2034);
      expect(result.meta.consolidatedHorizon).toBe(10);
      expect(result.meta.dealCount).toBe(1);
    });
  });

  describe('two deals, same fundYear', () => {
    it('should sum depreciation, LIHTC, and operating CF at each year', () => {
      const dealA = createMockDBP({ dealName: 'Deal A', fundYear: 2024 });
      const dealB = createMockDBP({ dealName: 'Deal B', fundYear: 2024, holdPeriod: 10 });
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      // Year 1: both deals contribute their year-1 depreciation
      expect(result.benefitStream.annualDepreciation[0]).toBe(
        dealA.depreciationSchedule[0] + dealB.depreciationSchedule[0]
      );

      // Year 2: both deals contribute their year-2 depreciation
      expect(result.benefitStream.annualDepreciation[1]).toBe(
        dealA.depreciationSchedule[1] + dealB.depreciationSchedule[1]
      );

      // LIHTC sums
      expect(result.benefitStream.annualLIHTC[0]).toBe(
        dealA.lihtcSchedule[0] + dealB.lihtcSchedule[0]
      );
    });

    it('should sum equity values across deals', () => {
      const dealA = createMockDBP({ grossEquity: 5_000_000, netEquity: 4_500_000, syndicationProceeds: 500_000 });
      const dealB = createMockDBP({ grossEquity: 3_000_000, netEquity: 2_700_000, syndicationProceeds: 300_000 });
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.benefitStream.grossEquity).toBe(8_000_000);
      expect(result.benefitStream.netEquity).toBe(7_200_000);
      expect(result.benefitStream.syndicationOffset).toBe(800_000);
    });

    it('should produce two exit events at the same year', () => {
      const dealA = createMockDBP({ dealName: 'Deal A', fundYear: 2024, holdPeriod: 10 });
      const dealB = createMockDBP({ dealName: 'Deal B', fundYear: 2024, holdPeriod: 10 });
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.benefitStream.exitEvents).toHaveLength(2);
      expect(result.benefitStream.exitEvents[0].year).toBe(10);
      expect(result.benefitStream.exitEvents[1].year).toBe(10);
    });
  });

  describe('two deals, staggered fundYears (calendar alignment)', () => {
    it('should offset Deal B schedules by one year', () => {
      const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024, holdPeriod: 10 });
      const dealB = createDealB(); // fundYear: 2025, holdPeriod: 10
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      // Consolidated horizon: 2024 to 2035 = 11 years
      expect(result.meta.consolidatedHorizon).toBe(11);
      expect(result.meta.poolStartYear).toBe(2024);
      expect(result.meta.poolEndYear).toBe(2035);

      // Calendar Year 1 (2024): only Deal A contributes
      expect(result.benefitStream.annualDepreciation[0]).toBe(dealA.depreciationSchedule[0]);

      // Calendar Year 2 (2025): Deal A year 2 + Deal B year 1
      expect(result.benefitStream.annualDepreciation[1]).toBe(
        dealA.depreciationSchedule[1] + dealB.depreciationSchedule[0]
      );

      // Calendar Year 11 (2034): only Deal B year 10
      expect(result.benefitStream.annualDepreciation[10]).toBe(
        dealB.depreciationSchedule[9]
      );
    });

    it('should offset LIHTC schedules correctly', () => {
      const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024, holdPeriod: 10 });
      const dealB = createDealB();
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      // Calendar Year 1: only Deal A LIHTC
      expect(result.benefitStream.annualLIHTC[0]).toBe(700_000);

      // Calendar Year 2: Deal A + Deal B LIHTC
      expect(result.benefitStream.annualLIHTC[1]).toBe(700_000 + 500_000);
    });

    it('should produce exit events at different calendar years', () => {
      const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024, holdPeriod: 10 });
      const dealB = createDealB(); // fundYear: 2025, holdPeriod: 10
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.benefitStream.exitEvents).toHaveLength(2);
      // Deal A exits at calendar year 10 (offset 0 + holdPeriod 10)
      // Deal B exits at calendar year 11 (offset 1 + holdPeriod 10)
      const exitYears = result.benefitStream.exitEvents.map(e => e.year);
      expect(exitYears).toContain(10);
      expect(exitYears).toContain(11);
    });
  });

  describe('exit event ordering', () => {
    it('should sort exit events chronologically by calendar year', () => {
      // Deal B enters later but has shorter hold, exits first
      const dealA = createMockDBP({ dealName: 'Long Deal', fundYear: 2024, holdPeriod: 15 });
      const dealB = createMockDBP({ dealName: 'Short Deal', fundYear: 2026, holdPeriod: 5 });
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.benefitStream.exitEvents).toHaveLength(2);
      // Short Deal exits at calendar year 7 (offset 2 + holdPeriod 5)
      // Long Deal exits at calendar year 15 (offset 0 + holdPeriod 15)
      expect(result.benefitStream.exitEvents[0].dealId).toBe('Short Deal');
      expect(result.benefitStream.exitEvents[0].year).toBe(7);
      expect(result.benefitStream.exitEvents[1].dealId).toBe('Long Deal');
      expect(result.benefitStream.exitEvents[1].year).toBe(15);
    });

    it('should maintain stable order for same-year exits', () => {
      const dealA = createMockDBP({ dealName: 'Deal A', fundYear: 2024, holdPeriod: 10 });
      const dealB = createMockDBP({ dealName: 'Deal B', fundYear: 2024, holdPeriod: 10 });
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.benefitStream.exitEvents[0].year).toBe(10);
      expect(result.benefitStream.exitEvents[1].year).toBe(10);
    });
  });

  describe('three+ deals with varied fundYears', () => {
    it('should correctly aggregate three deals across calendar grid', () => {
      const dealA = createMockDBP({ dealName: 'Deal A', fundYear: 2024, holdPeriod: 10 });
      const dealB = createDealB(); // fundYear: 2025, holdPeriod: 10
      const dealC = createMockDBP({
        dealName: 'Deal C',
        fundYear: 2026,
        holdPeriod: 8,
        depreciationSchedule: [8_000_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000],
        lihtcSchedule: new Array(8).fill(400_000),
        stateLihtcSchedule: new Array(8).fill(100_000),
        operatingCashFlow: new Array(8).fill(300_000),
        grossEquity: 2_000_000,
        netEquity: 1_800_000,
        syndicationProceeds: 200_000,
      });
      const result = aggregatePoolToBenefitStream([dealA, dealB, dealC]);

      // Horizon: 2024 to max(2034, 2035, 2034) = 2035, so 11 years
      expect(result.meta.consolidatedHorizon).toBe(11);
      expect(result.meta.dealCount).toBe(3);

      // Calendar Year 1 (2024): only Deal A
      expect(result.benefitStream.annualDepreciation[0]).toBe(16_000_000);

      // Calendar Year 2 (2025): Deal A yr2 + Deal B yr1
      expect(result.benefitStream.annualDepreciation[1]).toBe(2_000_000 + 12_000_000);

      // Calendar Year 3 (2026): Deal A yr3 + Deal B yr2 + Deal C yr1
      expect(result.benefitStream.annualDepreciation[2]).toBe(2_000_000 + 3_000_000 + 8_000_000);

      // Three exit events
      expect(result.benefitStream.exitEvents).toHaveLength(3);
    });
  });

  describe('meta accuracy', () => {
    it('should report correct deal summaries with calendar offsets', () => {
      const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024 });
      const dealB = createDealB();
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.meta.dealSummaries).toHaveLength(2);
      expect(result.meta.dealSummaries[0]).toEqual(expect.objectContaining({
        dealName: 'Trace 4001',
        fundYear: 2024,
        calendarOffset: 0,
      }));
      expect(result.meta.dealSummaries[1]).toEqual(expect.objectContaining({
        dealName: '701 S Jackson',
        fundYear: 2025,
        calendarOffset: 1,
      }));
    });

    it('should report correct total equity', () => {
      const dealA = createMockDBP({ grossEquity: 5_000_000, netEquity: 4_500_000 });
      const dealB = createDealB(); // grossEquity: 3_000_000, netEquity: 2_700_000
      const result = aggregatePoolToBenefitStream([dealA, dealB]);

      expect(result.meta.totalGrossEquity).toBe(8_000_000);
      expect(result.meta.totalNetEquity).toBe(7_200_000);
    });
  });

  describe('config overrides', () => {
    it('should respect poolStartYear override', () => {
      const deal = createMockDBP({ fundYear: 2025 });
      const result = aggregatePoolToBenefitStream([deal], { poolStartYear: 2024 });

      // With override, deal has offset 1 instead of 0
      expect(result.meta.poolStartYear).toBe(2024);
      expect(result.meta.consolidatedHorizon).toBe(11); // 2035 - 2024
      // Year 1 (2024) has no deal contribution
      expect(result.benefitStream.annualDepreciation[0]).toBe(0);
      // Year 2 (2025) has the deal's year 1
      expect(result.benefitStream.annualDepreciation[1]).toBe(deal.depreciationSchedule[0]);
    });
  });
});

// =============================================================================
// scaleBenefitStreamToMillions
// =============================================================================

describe('scaleBenefitStreamToMillions', () => {
  it('should divide all values by 1,000,000', () => {
    const dbp = createMockDBP();
    const result = aggregatePoolToBenefitStream([dbp]);
    const scaled = scaleBenefitStreamToMillions(result.benefitStream);

    // $16M depreciation year 1 → 16
    expect(scaled.annualDepreciation[0]).toBe(16);

    // $2M depreciation year 2 → 2
    expect(scaled.annualDepreciation[1]).toBe(2);

    // $700K LIHTC → 0.7
    expect(scaled.annualLIHTC[0]).toBe(0.7);

    // $5M grossEquity → 5
    expect(scaled.grossEquity).toBe(5);

    // Exit event values scaled
    expect(scaled.exitEvents[0].exitProceeds).toBe(15);
    expect(scaled.exitEvents[0].recaptureExposure).toBeCloseTo(
      dbp.recaptureExposure / 1_000_000
    );
  });

  it('should handle empty stream', () => {
    const empty = aggregatePoolToBenefitStream([]);
    const scaled = scaleBenefitStreamToMillions(empty.benefitStream);

    expect(scaled.annualDepreciation).toEqual([]);
    expect(scaled.grossEquity).toBe(0);
  });
});

// =============================================================================
// buildInvestorProfileFromTaxInfo
// =============================================================================

describe('buildInvestorProfileFromTaxInfo', () => {
  it('should map full InvestorTaxInfo to InvestorProfile', () => {
    const taxInfo: InvestorTaxInfo = {
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 1_000_000,
      annualPortfolioIncome: 500_000,
      groupingElection: true,
      investorTrack: 'rep',
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'CA',
      stateOrdinaryRate: 13.3,
      stateCapitalGainsRate: 13.3,
    };

    const profile = buildInvestorProfileFromTaxInfo(taxInfo, 5_000_000);

    expect(profile.filingStatus).toBe('MFJ');
    expect(profile.annualPassiveIncome).toBe(2_000_000);
    expect(profile.annualOrdinaryIncome).toBe(1_000_000);
    expect(profile.annualPortfolioIncome).toBe(500_000);
    expect(profile.investorTrack).toBe('rep');
    expect(profile.groupingElection).toBe(true);
    expect(profile.federalOrdinaryRate).toBe(37);
    expect(profile.federalCapGainsRate).toBeCloseTo(0.238);
    expect(profile.investorState).toBe('CA');
    expect(profile.stateOrdinaryRate).toBeCloseTo(0.133);
    expect(profile.investorEquity).toBe(5_000_000);
  });

  it('should handle missing income fields (default to 0)', () => {
    const taxInfo: InvestorTaxInfo = {};
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.annualPassiveIncome).toBe(0);
    expect(profile.annualOrdinaryIncome).toBe(0);
    expect(profile.annualPortfolioIncome).toBe(0);
  });

  it('should default investorTrack to non-rep when missing', () => {
    const taxInfo: InvestorTaxInfo = {};
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.investorTrack).toBe('non-rep');
  });

  it('should default filingStatus to MFJ when missing', () => {
    const taxInfo: InvestorTaxInfo = {};
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.filingStatus).toBe('MFJ');
  });

  it('should map single filingStatus correctly', () => {
    const taxInfo: InvestorTaxInfo = { filingStatus: 'single' };
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.filingStatus).toBe('Single');
  });

  it('should map HoH filingStatus correctly', () => {
    const taxInfo: InvestorTaxInfo = { filingStatus: 'HoH' };
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.filingStatus).toBe('HoH');
  });

  it('should default investorEquity to 0 when not provided', () => {
    const taxInfo: InvestorTaxInfo = {};
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.investorEquity).toBe(0);
  });

  it('should use fallback rates when rates are missing', () => {
    const taxInfo: InvestorTaxInfo = {};
    const profile = buildInvestorProfileFromTaxInfo(taxInfo);

    expect(profile.federalOrdinaryRate).toBe(37);
    expect(profile.federalCapGainsRate).toBeCloseTo(0.238); // (20 + 3.8) / 100
    expect(profile.investorState).toBe('NY');
    expect(profile.stateOrdinaryRate).toBeCloseTo(0.109);
    expect(profile.stateCapGainsRate).toBeCloseTo(0.109);
  });
});

// =============================================================================
// Round-trip Integration: aggregate → scale → calculateTaxUtilization
// =============================================================================

describe('pool aggregation round-trip with tax utilization engine', () => {
  it('should produce valid TaxUtilizationResult from two staggered deals', () => {
    const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024, holdPeriod: 10 });
    const dealB = createDealB();

    // Step 1: Aggregate
    const { benefitStream, meta } = aggregatePoolToBenefitStream([dealA, dealB]);
    expect(meta.consolidatedHorizon).toBe(11);

    // Step 2: Scale to millions
    const scaledStream = scaleBenefitStreamToMillions(benefitStream);

    // Step 3: Build investor profile
    const investorProfile = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 1_000_000,
      annualPortfolioIncome: 500_000,
      investorTrack: 'non-rep',
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    // Step 4: Run tax utilization engine
    const result = calculateTaxUtilization(scaledStream, investorProfile);

    // Verify structure
    expect(result.annualUtilization).toHaveLength(11); // Matches consolidated horizon
    expect(result.recaptureCoverage).toHaveLength(2);   // One per deal exit event
    expect(result.treatment).toBe('passive');            // Non-REP → passive

    // Verify non-zero results
    expect(result.totalDepreciationSavings).toBeGreaterThan(0);
    expect(result.totalBenefitGenerated).toBeGreaterThan(0);
    expect(result.overallUtilizationRate).toBeGreaterThan(0);
    expect(result.overallUtilizationRate).toBeLessThanOrEqual(1);

    // Verify fit indicator is valid
    expect(['green', 'yellow', 'red']).toContain(result.fitIndicator);
  });

  it('should produce valid result for REP with grouping election', () => {
    const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024 });
    const dealB = createDealB();

    const { benefitStream } = aggregatePoolToBenefitStream([dealA, dealB]);
    const scaledStream = scaleBenefitStreamToMillions(benefitStream);

    const investorProfile = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 5_000_000,
      annualPortfolioIncome: 1_000_000,
      investorTrack: 'rep',
      groupingElection: true,
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    const result = calculateTaxUtilization(scaledStream, investorProfile);

    expect(result.treatment).toBe('nonpassive');
    expect(result.annualUtilization).toHaveLength(11);
    expect(result.totalDepreciationSavings).toBeGreaterThan(0);
  });
});
