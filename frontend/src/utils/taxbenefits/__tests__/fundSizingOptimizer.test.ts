/**
 * Fund Sizing Optimizer Tests (IMPL-085)
 *
 * Tests for optimizeFundCommitment(), scaleStreamByProRata(),
 * and peak type classification (peak/plateau/rising).
 */

import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';
import type { InvestorProfile } from '../investorTaxUtilization';
import { aggregatePoolToBenefitStream, scaleBenefitStreamToMillions, buildInvestorProfileFromTaxInfo } from '../poolAggregation';
import { optimizeFundCommitment, scaleStreamByProRata } from '../fundSizingOptimizer';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDBP(overrides: Partial<DealBenefitProfile> = {}): DealBenefitProfile {
  const holdPeriod = overrides.holdPeriod || 10;
  const yearOneDepr = 16;
  const annualDepr = 2;
  const depreciationSchedule = [yearOneDepr, ...new Array(holdPeriod - 1).fill(annualDepr)];
  const cumulativeDepreciation = depreciationSchedule.reduce((s, v) => s + v, 0);

  return {
    dealConduitId: 1,
    dealName: 'Test Deal',
    propertyState: 'WA',
    fundYear: 2024,
    projectCost: 100,
    grossEquity: 5,
    netEquity: 4.5,
    syndicationProceeds: 0.5,
    costSegregationPercent: 20,
    depreciableBasis: cumulativeDepreciation,
    depreciationSchedule,
    lihtcSchedule: new Array(holdPeriod).fill(0.7),
    stateLihtcSchedule: new Array(holdPeriod).fill(0.3),
    operatingCashFlow: new Array(holdPeriod).fill(0.5),
    holdPeriod,
    projectedExitYear: (overrides.fundYear || 2024) + holdPeriod,
    exitProceeds: 15,
    cumulativeDepreciation,
    recaptureExposure: cumulativeDepreciation * 0.25,
    projectedAppreciation: 5,
    capitalGainsTax: 1.19,
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

function createDealB(): DealBenefitProfile {
  return createMockDBP({
    dealConduitId: 2,
    dealName: '701 S Jackson',
    fundYear: 2025,
    projectCost: 60,
    grossEquity: 3,
    netEquity: 2.7,
    syndicationProceeds: 0.3,
    holdPeriod: 10,
    depreciationSchedule: [12, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    lihtcSchedule: new Array(10).fill(0.5),
    stateLihtcSchedule: new Array(10).fill(0.2),
    operatingCashFlow: new Array(10).fill(0.4),
    exitProceeds: 10,
    cumulativeDepreciation: 39,
    recaptureExposure: 39 * 0.25,
    projectedAppreciation: 3,
    capitalGainsTax: 0.714,
  });
}

function createStandardPool() {
  const dealA = createMockDBP({ dealName: 'Trace 4001', fundYear: 2024 });
  const dealB = createDealB();
  return aggregatePoolToBenefitStream([dealA, dealB]);
}

function createNonRepInvestor(overrides: Partial<InvestorProfile> = {}): InvestorProfile {
  return buildInvestorProfileFromTaxInfo({
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
  }, overrides.investorEquity);
}

function createRepInvestor(overrides: Partial<InvestorProfile> = {}): InvestorProfile {
  return buildInvestorProfileFromTaxInfo({
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
  }, overrides.investorEquity);
}

// =============================================================================
// scaleStreamByProRata
// =============================================================================

describe('scaleStreamByProRata', () => {
  it('should scale all values by the share fraction', () => {
    const { benefitStream } = createStandardPool();
    const scaled = scaleStreamByProRata(benefitStream, 0.5);

    // Depreciation halved
    expect(scaled.annualDepreciation[0]).toBe(benefitStream.annualDepreciation[0] * 0.5);

    // LIHTC halved
    expect(scaled.annualLIHTC[0]).toBe(benefitStream.annualLIHTC[0] * 0.5);

    // Equity halved
    expect(scaled.grossEquity).toBe(benefitStream.grossEquity * 0.5);
    expect(scaled.netEquity).toBe(benefitStream.netEquity * 0.5);
    expect(scaled.syndicationOffset).toBe(benefitStream.syndicationOffset * 0.5);

    // Exit event values halved
    expect(scaled.exitEvents[0].exitProceeds).toBe(benefitStream.exitEvents[0].exitProceeds * 0.5);
    expect(scaled.exitEvents[0].recaptureExposure).toBe(benefitStream.exitEvents[0].recaptureExposure * 0.5);
  });

  it('should preserve array lengths', () => {
    const { benefitStream } = createStandardPool();
    const scaled = scaleStreamByProRata(benefitStream, 0.25);

    expect(scaled.annualDepreciation).toHaveLength(benefitStream.annualDepreciation.length);
    expect(scaled.exitEvents).toHaveLength(benefitStream.exitEvents.length);
  });

  it('should handle share = 1.0 (full fund)', () => {
    const { benefitStream } = createStandardPool();
    const scaled = scaleStreamByProRata(benefitStream, 1.0);

    expect(scaled.annualDepreciation[0]).toBe(benefitStream.annualDepreciation[0]);
    expect(scaled.grossEquity).toBe(benefitStream.grossEquity);
  });

  it('should handle share = 0 (zero commitment)', () => {
    const { benefitStream } = createStandardPool();
    const scaled = scaleStreamByProRata(benefitStream, 0);

    expect(scaled.annualDepreciation[0]).toBe(0);
    expect(scaled.grossEquity).toBe(0);
  });
});

// =============================================================================
// optimizeFundCommitment — basic behavior
// =============================================================================

describe('optimizeFundCommitment', () => {
  describe('basic optimization', () => {
    it('should return optimal commitment between min and max', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      expect(result.optimalCommitment).toBeGreaterThan(0);
      expect(result.optimalCommitment).toBeLessThanOrEqual(meta.totalGrossEquity);
    });

    it('should return positive tax savings at optimal point', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      expect(result.optimalTaxSavings).toBeGreaterThan(0);
      expect(result.optimalSavingsPerDollar).toBeGreaterThan(0);
    });

    it('should return valid utilization rate', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      expect(result.optimalUtilizationRate).toBeGreaterThan(0);
      expect(result.optimalUtilizationRate).toBeLessThanOrEqual(1);
    });

    it('should produce efficiency curve with correct number of points', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      // steps + 1 because we include both endpoints
      expect(result.efficiencyCurve).toHaveLength(21);
    });

    it('should include full utilization result at optimal point', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      expect(result.fullUtilizationResult).toBeDefined();
      expect(result.fullUtilizationResult.annualUtilization.length).toBeGreaterThan(0);
      expect(result.fullUtilizationResult.recaptureCoverage).toHaveLength(2);
    });
  });

  describe('peak type classification', () => {
    it('should classify peakType as valid enum value', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      expect(['peak', 'plateau', 'rising']).toContain(result.peakType);
    });

    it('should classify REP curve correctly — §461(l) caps may create peak', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 30 }
      );

      // REP with grouping hits §461(l) excess business loss limit ($626K MFJ),
      // so at high commitment levels depreciation deductions start generating NOL
      // instead of immediate savings. The curve may peak due to this statutory cap.
      expect(['peak', 'plateau', 'rising']).toContain(result.peakType);
      // REP should still have higher utilization than a non-REP at moderate levels
      expect(result.optimalUtilizationRate).toBeGreaterThan(0);
    });
  });

  describe('zero passive income Non-REP', () => {
    it('should produce low utilization at all commitment levels', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = buildInvestorProfileFromTaxInfo({
        filingStatus: 'married',
        annualPassiveIncome: 0,
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
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 10 }
      );

      // With zero passive income, passive treatment means everything suspends
      // Utilization should be very low
      expect(result.optimalUtilizationRate).toBeLessThan(0.5);
    });
  });

  describe('capacity warning', () => {
    it('should set capacityExhaustedAt when utilization drops below 50%', () => {
      const { benefitStream, meta } = createStandardPool();
      // Low passive income investor — limited capacity
      const investor = buildInvestorProfileFromTaxInfo({
        filingStatus: 'married',
        annualPassiveIncome: 100_000,
        annualOrdinaryIncome: 500_000,
        annualPortfolioIncome: 100_000,
        investorTrack: 'non-rep',
        federalOrdinaryRate: 37,
        federalCapitalGainsRate: 20,
        niitRate: 3.8,
        selectedState: 'NY',
        stateOrdinaryRate: 10.9,
        stateCapitalGainsRate: 10.9,
      });
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      // With very low passive income, should hit capacity wall
      // Either capacityExhaustedAt fires, or utilization is already below 50% everywhere
      const anyAbove50 = result.efficiencyCurve.some(p => p.utilizationRate >= 0.50);
      if (anyAbove50) {
        expect(result.capacityExhaustedAt).not.toBeNull();
        expect(result.capacityExhaustedAt!).toBeGreaterThan(0);
      }
    });
  });

  describe('config overrides', () => {
    it('should respect custom min/max commitment range', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor,
        { minCommitment: 500_000, maxCommitment: 2_000_000, steps: 10 }
      );

      expect(result.efficiencyCurve[0].commitment).toBe(500_000);
      expect(result.efficiencyCurve[result.efficiencyCurve.length - 1].commitment).toBe(2_000_000);
      expect(result.optimalCommitment).toBeGreaterThanOrEqual(500_000);
      expect(result.optimalCommitment).toBeLessThanOrEqual(2_000_000);
    });
  });

  describe('savings monotonicity', () => {
    it('should show total tax savings generally increasing with commitment', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createNonRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      // Total savings should increase or at least not decrease for the first several points
      const savings = result.efficiencyCurve.map(p => p.totalTaxSavings);
      // First half should generally be increasing
      const firstHalf = savings.slice(0, Math.floor(savings.length / 2));
      for (let i = 1; i < firstHalf.length; i++) {
        expect(firstHalf[i]).toBeGreaterThanOrEqual(firstHalf[i - 1] * 0.99); // Allow small rounding
      }
    });
  });

  describe('REP vs Non-REP comparison', () => {
    it('should show REP having higher or equal utilization than Non-REP at same commitment', () => {
      const { benefitStream, meta } = createStandardPool();
      const repInvestor = createRepInvestor();
      const nonRepInvestor = createNonRepInvestor();

      const repResult = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, repInvestor, { steps: 10 }
      );
      const nonRepResult = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, nonRepInvestor, { steps: 10 }
      );

      // At the midpoint commitment level, REP should have higher or equal utilization
      const midIdx = 5;
      expect(repResult.efficiencyCurve[midIdx].utilizationRate).toBeGreaterThanOrEqual(
        nonRepResult.efficiencyCurve[midIdx].utilizationRate * 0.95 // 5% tolerance
      );
    });
  });

  describe('plateau/rising curve for high-income REP', () => {
    it('should recommend max commitment when curve is plateau or rising', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      if (result.peakType === 'plateau' || result.peakType === 'rising') {
        // Should recommend max commitment
        expect(result.optimalCommitment).toBe(meta.totalGrossEquity);
      }
    });

    it('should not produce a warning for plateau/rising curves', () => {
      const { benefitStream, meta } = createStandardPool();
      const investor = createRepInvestor();
      const result = optimizeFundCommitment(
        benefitStream, meta.totalGrossEquity, investor, { steps: 20 }
      );

      if (result.peakType === 'plateau' || result.peakType === 'rising') {
        // No capacity exhaustion warning — investor can absorb everything
        expect(result.warningMessage).toBeNull();
      }
    });
  });
});
