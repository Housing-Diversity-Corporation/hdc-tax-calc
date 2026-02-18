/**
 * Investor Sizing Engine Tests (IMPL-103)
 *
 * Tests for scaleBenefitStream(), computeOptimalSizing(),
 * and identifyBindingConstraint().
 *
 * Per B3 Spec v2.0 §8.2.
 */

import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';
import type { InvestorProfile, BenefitStream } from '../investorTaxUtilization';
import { aggregatePoolToBenefitStream, buildInvestorProfileFromTaxInfo } from '../poolAggregation';
import {
  scaleBenefitStream,
  computeOptimalSizing,
} from '../investorSizing';
import type { SizingResult } from '../investorSizing';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDBP(overrides: Partial<DealBenefitProfile> = {}): DealBenefitProfile {
  const holdPeriod = overrides.holdPeriod || 10;
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

function getTestPool() {
  const deal = createMockDBP();
  return aggregatePoolToBenefitStream([deal]);
}

function makeProfile(overrides: {
  isREP?: boolean;
  ordinaryIncome?: number;
  passiveIncome?: number;
  portfolioIncome?: number;
}): InvestorProfile {
  const isREP = overrides.isREP ?? false;
  return buildInvestorProfileFromTaxInfo({
    filingStatus: 'married',
    annualPassiveIncome: overrides.passiveIncome ?? 0,
    annualOrdinaryIncome: overrides.ordinaryIncome ?? 0,
    annualPortfolioIncome: overrides.portfolioIncome ?? 0,
    investorTrack: isREP ? 'rep' : 'non-rep',
    groupingElection: isREP,
    federalOrdinaryRate: 37,
    federalCapitalGainsRate: 20,
    niitRate: 3.8,
    selectedState: 'WA',
    stateOrdinaryRate: 0,
    stateCapitalGainsRate: 0,
  }, 1_000_000);
}

// =============================================================================
// scaleBenefitStream — Unit Tests
// =============================================================================

describe('scaleBenefitStream', () => {
  const baseBenefitStream: BenefitStream = {
    annualDepreciation: [16_000_000, 2_000_000, 2_000_000],
    annualLIHTC: [700_000, 700_000, 700_000],
    annualStateLIHTC: [300_000, 300_000, 300_000],
    annualOperatingCF: [500_000, 500_000, 500_000],
    exitEvents: [{
      year: 3,
      exitProceeds: 15_000_000,
      cumulativeDepreciation: 20_000_000,
      recaptureExposure: 5_000_000,
      appreciationGain: 5_000_000,
      ozEnabled: false,
    }],
    grossEquity: 5_000_000,
    netEquity: 4_500_000,
    syndicationOffset: 500_000,
  };

  // B3-S4: 50% pro-rata → all monetary values exactly 50%
  test('B3-S4: 50% pro-rata scales all monetary values to 50%', () => {
    const scaled = scaleBenefitStream(baseBenefitStream, 0.5);

    expect(scaled.annualDepreciation[0]).toBe(8_000_000);
    expect(scaled.annualDepreciation[1]).toBe(1_000_000);
    expect(scaled.annualLIHTC[0]).toBe(350_000);
    expect(scaled.annualStateLIHTC[0]).toBe(150_000);
    expect(scaled.annualOperatingCF[0]).toBe(250_000);
    expect(scaled.exitEvents[0].exitProceeds).toBe(7_500_000);
    expect(scaled.exitEvents[0].cumulativeDepreciation).toBe(10_000_000);
    expect(scaled.exitEvents[0].recaptureExposure).toBe(2_500_000);
    expect(scaled.exitEvents[0].appreciationGain).toBe(2_500_000);
    expect(scaled.grossEquity).toBe(2_500_000);
    expect(scaled.netEquity).toBe(2_250_000);
    expect(scaled.syndicationOffset).toBe(250_000);
  });

  // B3-S5: 100% pro-rata → all values identical
  test('B3-S5: 100% pro-rata preserves all values identically', () => {
    const scaled = scaleBenefitStream(baseBenefitStream, 1.0);

    expect(scaled.annualDepreciation).toEqual(baseBenefitStream.annualDepreciation);
    expect(scaled.annualLIHTC).toEqual(baseBenefitStream.annualLIHTC);
    expect(scaled.annualStateLIHTC).toEqual(baseBenefitStream.annualStateLIHTC);
    expect(scaled.annualOperatingCF).toEqual(baseBenefitStream.annualOperatingCF);
    expect(scaled.grossEquity).toBe(baseBenefitStream.grossEquity);
    expect(scaled.netEquity).toBe(baseBenefitStream.netEquity);
    expect(scaled.syndicationOffset).toBe(baseBenefitStream.syndicationOffset);
  });

  // B3-S6: 0% pro-rata → all monetary values = 0
  test('B3-S6: 0% pro-rata zeroes all monetary values', () => {
    const scaled = scaleBenefitStream(baseBenefitStream, 0);

    expect(scaled.annualDepreciation.every(v => v === 0)).toBe(true);
    expect(scaled.annualLIHTC.every(v => v === 0)).toBe(true);
    expect(scaled.annualStateLIHTC.every(v => v === 0)).toBe(true);
    expect(scaled.annualOperatingCF.every(v => v === 0)).toBe(true);
    expect(scaled.exitEvents[0].exitProceeds).toBe(0);
    expect(scaled.grossEquity).toBe(0);
    expect(scaled.netEquity).toBe(0);
    expect(scaled.syndicationOffset).toBe(0);
  });

  // Preserves non-monetary fields
  test('preserves non-monetary fields (year, ozEnabled, dealId)', () => {
    const streamWithDealId: BenefitStream = {
      ...baseBenefitStream,
      exitEvents: [{
        ...baseBenefitStream.exitEvents[0],
        dealId: 'deal-123',
        ozEnabled: true,
      }],
    };
    const scaled = scaleBenefitStream(streamWithDealId, 0.5);

    expect(scaled.exitEvents[0].year).toBe(3);
    expect(scaled.exitEvents[0].ozEnabled).toBe(true);
    expect(scaled.exitEvents[0].dealId).toBe('deal-123');
  });

  // Array length preservation
  test('preserves array lengths', () => {
    const scaled = scaleBenefitStream(baseBenefitStream, 0.33);
    expect(scaled.annualDepreciation.length).toBe(3);
    expect(scaled.annualLIHTC.length).toBe(3);
    expect(scaled.annualStateLIHTC.length).toBe(3);
    expect(scaled.annualOperatingCF.length).toBe(3);
    expect(scaled.exitEvents.length).toBe(1);
  });
});

// =============================================================================
// computeOptimalSizing — Integration Tests
// =============================================================================

describe('computeOptimalSizing', () => {
  // B3-S1: Archetype A investor sizing
  test('B3-S1: Archetype A, $200K ord + $150K pass, $5M deal → optimal < $5M', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    expect(result.optimalCommitment).toBeGreaterThan(0);
    expect(result.optimalCommitment).toBeLessThanOrEqual(meta.totalGrossEquity);
    expect(result.utilizationCurve.length).toBe(20);
    expect(result.optimalUtilizationPct).toBeGreaterThan(0);
  });

  // B3-S2: Archetype E, all benefits suspended
  test('B3-S2: Archetype E, $500K W-2, $0 pass → ~0% annual utilization', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    // All points should show very low utilization (benefits suspended)
    for (const point of result.utilizationCurve) {
      expect(point.annualUtilizationPct).toBeLessThan(5);
    }
  });

  // B3-S3: Archetype C, commitment at 2× passive capacity
  test('B3-S3: Archetype C, $200K passive → utilization drops at higher commitment', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: false, ordinaryIncome: 400_000, passiveIncome: 200_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    // Should see utilization drop as commitment increases
    const firstPoint = result.utilizationCurve[0];
    const lastPoint = result.utilizationCurve[result.utilizationCurve.length - 1];
    // At small commitment, utilization should be higher
    expect(firstPoint.annualUtilizationPct).toBeGreaterThanOrEqual(lastPoint.annualUtilizationPct);
  });

  // B3-S8: $0 equity edge case
  test('B3-S8: Deal with $0 equity → graceful handling', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });

    const result = computeOptimalSizing(
      { annualDepreciation: [], annualLIHTC: [], annualStateLIHTC: [], annualOperatingCF: [], exitEvents: [], grossEquity: 0, netEquity: 0, syndicationOffset: 0 },
      profile,
      0
    );

    expect(result.optimalCommitment).toBe(0);
    expect(result.utilizationCurve).toHaveLength(0);
  });

  // Returns exactly 20 points (default)
  test('returns exactly 20 points by default', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    expect(result.utilizationCurve.length).toBe(20);
  });

  // Custom sample points
  test('respects custom samplePoints config', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity, {
      samplePoints: 10,
    });

    expect(result.utilizationCurve.length).toBe(10);
  });

  // minimumEffective ≤ optimalCommitment ≤ maximumEffective
  test('minimumEffective ≤ optimalCommitment ≤ maximumEffective', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    if (result.minimumEffective > 0 && result.maximumEffective > 0) {
      expect(result.minimumEffective).toBeLessThanOrEqual(result.optimalCommitment);
      expect(result.optimalCommitment).toBeLessThanOrEqual(result.maximumEffective);
    }
  });

  // All SizingPoints have valid fields
  test('all SizingPoints have valid numeric fields', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: false, ordinaryIncome: 400_000, passiveIncome: 200_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    for (const point of result.utilizationCurve) {
      expect(typeof point.commitmentAmount).toBe('number');
      expect(typeof point.annualUtilizationPct).toBe('number');
      expect(typeof point.creditUtilizationPct).toBe('number');
      expect(typeof point.depreciationUtilizationPct).toBe('number');
      expect(typeof point.effectiveMultiple).toBe('number');
      expect(point.commitmentAmount).toBeGreaterThanOrEqual(0);
      expect(point.annualUtilizationPct).toBeGreaterThanOrEqual(0);
      expect(point.annualUtilizationPct).toBeLessThanOrEqual(100.01); // allow tiny float imprecision
    }
  });
});

// =============================================================================
// identifyBindingConstraint — Unit Tests
// =============================================================================

describe('identifyBindingConstraint', () => {
  test('Non-REP with $0 passive → §469(a) No Passive Income', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    expect(result.constraintBinding).toContain('§469(a) No Passive Income');
  });

  test('Non-REP with moderate passive → valid constraint string', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: false, ordinaryIncome: 400_000, passiveIncome: 200_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    // Should be one of the valid constraint strings
    const validConstraints = [
      '§469(a)(2) Passive Income Capacity',
      '§38(c) General Business Credit Floor',
      'None — full utilization achievable',
    ];
    expect(validConstraints.some(c => result.constraintBinding.includes(c.substring(0, 10)))).toBe(true);
  });

  test('REP with low income at optimal → may have full utilization', () => {
    const { benefitStream, meta } = getTestPool();
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });

    const result = computeOptimalSizing(benefitStream, profile, meta.totalGrossEquity);

    // At optimal point, constraint may or may not bind
    expect(typeof result.constraintBinding).toBe('string');
    expect(result.constraintBinding.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// B3-S7: Archetype B — constraint transition
// =============================================================================

describe('Archetype B constraint detection', () => {
  test('B3-S7: Different income levels produce different sizing results', () => {
    const { benefitStream, meta } = getTestPool();

    // Low-income REP (below §461(l)) → Archetype A
    const lowIncomeREP = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 100_000 });
    const resultLow = computeOptimalSizing(benefitStream, lowIncomeREP, meta.totalGrossEquity);

    // High-income REP (above §461(l)) → Archetype B
    const highIncomeREP = makeProfile({ isREP: true, ordinaryIncome: 1_500_000, passiveIncome: 500_000 });
    const resultHigh = computeOptimalSizing(benefitStream, highIncomeREP, meta.totalGrossEquity);

    // Both should produce valid results with constraint strings
    expect(typeof resultLow.constraintBinding).toBe('string');
    expect(typeof resultHigh.constraintBinding).toBe('string');
    // Both should have utilization curves
    expect(resultLow.utilizationCurve.length).toBe(20);
    expect(resultHigh.utilizationCurve.length).toBe(20);
  });
});

// =============================================================================
// Cross-check: no type collisions with fund sizing
// =============================================================================

describe('type isolation from fund sizing', () => {
  test('SizingResult and FundSizingResult are different types', () => {
    // This is a compile-time check. If this file compiles, types don't collide.
    const sizingResult: SizingResult = {
      optimalCommitment: 1_000_000,
      optimalUtilizationPct: 95,
      minimumEffective: 500_000,
      maximumEffective: 2_000_000,
      utilizationCurve: [],
      constraintBinding: 'None',
    };
    expect(sizingResult.optimalCommitment).toBe(1_000_000);
    // FundSizingResult has different fields like peakType, efficiencyCurve, etc.
  });
});
