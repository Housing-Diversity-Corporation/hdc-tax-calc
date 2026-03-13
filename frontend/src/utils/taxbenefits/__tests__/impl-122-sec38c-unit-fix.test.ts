/**
 * IMPL-122: Fix §38(c) dollar/millions unit mismatch in calculateTaxUtilization()
 *
 * Validates that the §38(c) credit ceiling and depreciation savings cap use
 * consistent units (millions) for REP+grouped (nonpassive) investors.
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

describe('IMPL-122: §38(c) unit mismatch fix in calculateTaxUtilization', () => {
  const scaledStream = scaleBenefitStream(DEAL_STREAM, OWNERSHIP);

  test('REP+grouped $750K/$1M/WA/MFJ: totalTaxSavings matches batch runner at $1.948M', () => {
    const profile = buildProfile({
      annualOrdinaryIncome: 750_000,
      investorTrack: 'rep',
      groupingElection: true,
    });

    const result = calculateTaxUtilization(scaledStream, profile);
    const totalSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;

    // Batch runner corrected value: $1.9477M
    // Pre-IMPL-122 engine (inflated): $2.120M — the §38(c) ceiling never bound
    expect(totalSavings).toBeCloseTo(1.948, 2);
    // Within ±1% of $1.948M
    expect(totalSavings).toBeGreaterThan(1.948 * 0.99);
    expect(totalSavings).toBeLessThan(1.948 * 1.01);
  });

  test('REP+grouped $2M/$1M/WA/MFJ: totalTaxSavings matches batch runner at $2.158M', () => {
    const profile = buildProfile({
      annualOrdinaryIncome: 2_000_000,
      investorTrack: 'rep',
      groupingElection: true,
    });

    const result = calculateTaxUtilization(scaledStream, profile);
    const totalSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;

    // Batch runner value: $2.158M
    // At $2M income, tax >> dep savings so the cap doesn't bind; §38(c) is the binding fix
    expect(totalSavings).toBeGreaterThan(2.158 * 0.99);
    expect(totalSavings).toBeLessThan(2.158 * 1.01);
  });

  test('non-rep passive $2M/$1M/WA/MFJ: unchanged at $2.316M (IMPL-121 value)', () => {
    const profile = buildProfile({
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 0,
      investorTrack: 'non-rep',
      groupingElection: false,
    });

    const result = calculateTaxUtilization(scaledStream, profile);
    const totalSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;

    // Passive path uses computeLIHTCPassive — not affected by §38(c) fix
    expect(totalSavings).toBeCloseTo(2.316, 1);
  });

  test('§38(c) ceiling actually binds for moderate income REP+grouped', () => {
    // At $750K income, Year 1 bonus dep savings ($213.5K) > federal tax ($190.6K)
    // The credit ceiling should limit LIHTC usage
    const profile = buildProfile({
      annualOrdinaryIncome: 750_000,
      investorTrack: 'rep',
      groupingElection: true,
    });

    const result = calculateTaxUtilization(scaledStream, profile);

    // totalLIHTCUsed should be less than totalLIHTC generated (ceiling binds)
    const totalLIHTCGenerated = result.annualUtilization.reduce(
      (s, yr) => s + yr.lihtcGenerated, 0
    );
    expect(result.totalLIHTCUsed).toBeLessThan(totalLIHTCGenerated);

    // Credits should carry forward (not all used)
    const lastYear = result.annualUtilization[result.annualUtilization.length - 1];
    expect(lastYear.lihtcCarried).toBeGreaterThan(0);
  });
});
