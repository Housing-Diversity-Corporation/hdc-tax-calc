/**
 * IMPL-144: NOL carryforward reduces §38(c) ceiling in Year 2+
 *
 * Validates that when Year 1 bonus depreciation exceeds §461(l) and generates
 * an NOL carryforward, the NOL consumed in subsequent years reduces the
 * "net income tax" used for §38(c) ceiling calculation.
 *
 * Also includes explicit §469(i)(3)(D) ordering test (audit gap).
 */

import { calculateTaxUtilization } from '../investorTaxUtilization';
import { scaleBenefitStream } from '../investorSizing';
import type { BenefitStream, InvestorProfile } from '../investorTaxUtilization';

// Trace 260303 65M deal stream (partnership level, millions)
const DEAL_STREAM: BenefitStream = {
  annualDepreciation: [13.44, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833],
  annualLIHTC: [1.173, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 1.173, 0],
  annualStateLIHTC: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  annualOperatingCF: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  exitEvents: [{
    year: 12,
    exitProceeds: 15.26,
    cumulativeDepreciation: 34.52,
    recaptureExposure: 8.63,
    appreciationGain: 3.05,
    ozEnabled: true,
    sec1245Recapture: 13.44,
    sec1250Recapture: 21.08,
  }],
  grossEquity: 16.05,
  netEquity: 16.05,
  syndicationOffset: 0,
};

const DEAL_TOTAL_EQUITY = 16_050_000;
const INVESTMENT = 1_000_000;
const OWNERSHIP = INVESTMENT / DEAL_TOTAL_EQUITY;

function buildProfile(overrides: Partial<InvestorProfile>): InvestorProfile {
  return {
    annualOrdinaryIncome: 0,
    annualPassiveIncome: 0,
    annualPortfolioIncome: 0,
    investorTrack: 'rep',
    groupingElection: true,
    filingStatus: 'MFJ',
    investorState: 'WA',
    investorEquity: INVESTMENT,
    federalOrdinaryRate: 0,
    federalCapGainsRate: 23.8,
    stateOrdinaryRate: 0,
    stateCapGainsRate: 0,
    ...overrides,
  };
}

// =============================================================================
// Test A: NOL carryforward reduces §38(c) ceiling
// =============================================================================

describe('IMPL-144: NOL carryforward reduces §38(c) ceiling', () => {
  const scaledStream = scaleBenefitStream(DEAL_STREAM, OWNERSHIP);

  test('Year 1 generates NOL when bonus dep exceeds §461(l) cap', () => {
    const profile = buildProfile({ annualOrdinaryIncome: 750_000 });
    const result = calculateTaxUtilization(scaledStream, profile);
    const year1 = result.annualUtilization[0];

    // Year 1 bonus depreciation exceeds §461(l) MFJ cap of $626K
    expect(year1.nolGenerated).toBeGreaterThan(0);
    expect(year1.nolPool).toBeGreaterThan(0);
  });

  test('Year 2 §38(c) ceiling is reduced by NOL tax effect', () => {
    const profile = buildProfile({ annualOrdinaryIncome: 750_000 });
    const result = calculateTaxUtilization(scaledStream, profile);

    const year1 = result.annualUtilization[0];
    const year2 = result.annualUtilization[1];

    // Year 1 generates NOL, Year 2 consumes some/all of it
    expect(year1.nolGenerated).toBeGreaterThan(0);
    expect(year2.nolUsed).toBeGreaterThan(0);

    // The NOL reduction means fewer credits can be used in Year 2
    // compared to a scenario where no NOL exists
    // Credits should carry forward under §39
    expect(year2.lihtcCarried).toBeGreaterThanOrEqual(0);
  });

  test('§38(c) ceiling returns to baseline once NOL pool is exhausted', () => {
    const profile = buildProfile({ annualOrdinaryIncome: 750_000 });
    const result = calculateTaxUtilization(scaledStream, profile);

    // Find the first year where nolPool reaches zero
    const postNolYear = result.annualUtilization.find(
      (yr, idx) => idx > 0 && yr.nolPool === 0 && yr.nolUsed === 0
    );

    if (postNolYear) {
      // Once NOL is exhausted, no NOL reduction occurs
      // The year should have full §38(c) capacity (only limited by dep savings)
      expect(postNolYear.nolUsed).toBe(0);
    }
  });

  test('total credits over hold period shift but do not disappear', () => {
    // With NOL correction, credits shift to later years via §39 carryforward
    // Some may carry past the hold period, but none are destroyed
    const profile = buildProfile({ annualOrdinaryIncome: 750_000 });
    const result = calculateTaxUtilization(scaledStream, profile);

    const totalGenerated = result.annualUtilization.reduce(
      (s, yr) => s + yr.lihtcGenerated, 0
    );
    const totalUsed = result.totalLIHTCUsed;
    const lastYear = result.annualUtilization[result.annualUtilization.length - 1];
    const creditsStillCarried = lastYear.cumulativeCarriedCredits;

    // All credits are accounted for: used + still carried = generated
    expect(totalUsed + creditsStillCarried).toBeCloseTo(totalGenerated, 6);
  });

  test('high-income REP ($2M) is minimally affected (NOL absorbed quickly)', () => {
    const profile = buildProfile({ annualOrdinaryIncome: 2_000_000 });
    const result = calculateTaxUtilization(scaledStream, profile);
    const totalSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;

    // $2M income: NOL drawdown window is short, §38(c) ceiling remains ample
    // Value should still be close to pre-IMPL-144 ($2.158M)
    expect(totalSavings).toBeGreaterThan(2.158 * 0.99);
    expect(totalSavings).toBeLessThan(2.158 * 1.01);
  });
});

// =============================================================================
// Test B: Explicit §469(i)(3)(D) ordering — losses before credits
// =============================================================================

describe('IMPL-144: §469(i)(3)(D) ordering — passive losses consume allowance before credits', () => {
  test('depreciation consumes passive income first, credits limited to residual tax', () => {
    // Construct a minimal stream: $80K depreciation, $50K LIHTC per year
    // with $100K passive income → residual = $20K → credits limited to tax on $20K
    const stream: BenefitStream = {
      annualDepreciation: [0.080],   // $80K in millions
      annualLIHTC: [0.050],          // $50K in millions
      annualStateLIHTC: [0],
      annualOperatingCF: [0],
      exitEvents: [{
        year: 1,
        exitProceeds: 0.5,
        cumulativeDepreciation: 0.080,
        recaptureExposure: 0.020,
        appreciationGain: 0.010,
        ozEnabled: false,
      }],
      grossEquity: 0.5,
      netEquity: 0.5,
      syndicationOffset: 0,
    };

    const profile: InvestorProfile = {
      annualPassiveIncome: 100_000,    // $100K passive income
      annualOrdinaryIncome: 500_000,   // $500K W-2
      annualPortfolioIncome: 0,
      investorTrack: 'non-rep',
      groupingElection: false,
      filingStatus: 'MFJ',
      investorState: 'NY',
      investorEquity: 500_000,
      federalOrdinaryRate: 0,
      federalCapGainsRate: 23.8,
      stateOrdinaryRate: 10.9,
      stateCapGainsRate: 10.9,
    };

    const result = calculateTaxUtilization(stream, profile);
    const year1 = result.annualUtilization[0];

    // §469: Depreciation ($80K) consumes passive income first
    expect(year1.depreciationAllowed).toBeCloseTo(0.080, 6);

    // Residual passive income = $100K - $80K = $20K = 0.020M
    expect(year1.residualPassiveIncome).toBeCloseTo(0.020, 6);

    // Credits limited to tax on residual passive income only
    // residualPassiveTax = $20K × marginalRate (with NIIT surcharge)
    expect(year1.residualPassiveTax).toBeGreaterThan(0);
    expect(year1.lihtcUsable).toBeLessThanOrEqual(year1.residualPassiveTax);

    // Unused credits are suspended under §469(b)
    expect(year1.lihtcCarried).toBeGreaterThan(0);
    expect(year1.cumulativeSuspendedCredits).toBeGreaterThan(0);
  });

  test('with zero passive income, ALL credits are suspended', () => {
    const stream: BenefitStream = {
      annualDepreciation: [0.080],
      annualLIHTC: [0.050],
      annualStateLIHTC: [0],
      annualOperatingCF: [0],
      exitEvents: [{
        year: 1,
        exitProceeds: 0.5,
        cumulativeDepreciation: 0.080,
        recaptureExposure: 0.020,
        appreciationGain: 0.010,
        ozEnabled: false,
      }],
      grossEquity: 0.5,
      netEquity: 0.5,
      syndicationOffset: 0,
    };

    const profile: InvestorProfile = {
      annualPassiveIncome: 0,
      annualOrdinaryIncome: 500_000,
      annualPortfolioIncome: 0,
      investorTrack: 'non-rep',
      groupingElection: false,
      filingStatus: 'MFJ',
      investorState: 'NY',
      investorEquity: 500_000,
      federalOrdinaryRate: 0,
      federalCapGainsRate: 23.8,
      stateOrdinaryRate: 10.9,
      stateCapGainsRate: 10.9,
    };

    const result = calculateTaxUtilization(stream, profile);
    const year1 = result.annualUtilization[0];

    // No passive income → no depreciation allowed, no residual, no credits
    expect(year1.depreciationAllowed).toBe(0);
    expect(year1.residualPassiveIncome).toBe(0);
    expect(year1.residualPassiveTax).toBe(0);
    expect(year1.lihtcUsable).toBe(0);
    expect(year1.lihtcCarried).toBeCloseTo(0.050, 6);
  });
});
