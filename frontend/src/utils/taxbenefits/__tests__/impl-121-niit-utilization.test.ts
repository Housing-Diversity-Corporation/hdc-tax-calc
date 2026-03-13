/**
 * IMPL-121: NIIT-aware depreciation rate in calculateTaxUtilization()
 *
 * Validates that passive investors (non-rep, rep_ungrouped) get the 3.8% NIIT
 * surcharge applied to depreciation savings, while nonpassive (rep+grouped)
 * investors are unaffected.
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
    investorTrack: 'non-rep',
    groupingElection: false,
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

describe('IMPL-121: NIIT-aware depreciation in calculateTaxUtilization', () => {
  const scaledStream = scaleBenefitStream(DEAL_STREAM, OWNERSHIP);

  // Total depreciation at partnership level scaled by ownership
  const totalDep = DEAL_STREAM.annualDepreciation.reduce((s, v) => s + v, 0) * OWNERSHIP;
  const niitDelta = totalDep * 0.038; // Expected NIIT uplift in millions

  test('non-rep passive: NIIT applies — totalTaxSavings ≈ $2.316M', () => {
    const profile = buildProfile({
      annualPassiveIncome: 2_000_000,
      investorTrack: 'non-rep',
      groupingElection: false,
      investorState: 'WA',
    });

    const result = calculateTaxUtilization(scaledStream, profile);
    const totalSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;

    // With NIIT (40.8%): dep savings = totalDep × 0.408 + full LIHTC
    // totalDep ≈ 2.094M, LIHTC ≈ 1.462M → total ≈ 2.316M
    expect(totalSavings).toBeGreaterThan(2.28);
    expect(totalSavings).toBeLessThan(2.36);

    // Specifically: savings should be ~$0.080M more than flat 37% result ($2.236M)
    expect(totalSavings).toBeCloseTo(2.316, 1);
  });

  test('rep+grouped nonpassive: NIIT does NOT apply — totalTaxSavings ≈ $1.948M (unchanged)', () => {
    const profile = buildProfile({
      annualOrdinaryIncome: 750_000,
      annualPassiveIncome: 0,
      investorTrack: 'rep',
      groupingElection: true,
      investorState: 'WA',
    });

    const result = calculateTaxUtilization(scaledStream, profile);
    // Nonpassive path: IMPL-122 corrected §38(c) + dep savings cap → $1.948M
    // NIIT surcharge must NOT be applied (nonpassive is exempt)
    const totalSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;
    expect(totalSavings).toBeCloseTo(1.948, 2);
  });

  test('rep_ungrouped passive: NIIT applies — matches non-rep passive result', () => {
    const nonRepProfile = buildProfile({
      annualPassiveIncome: 2_000_000,
      investorTrack: 'non-rep',
      groupingElection: false,
      investorState: 'WA',
    });
    const repUngroupedProfile = buildProfile({
      annualPassiveIncome: 2_000_000,
      investorTrack: 'rep',
      groupingElection: false,
      investorState: 'WA',
    });

    const nonRepResult = calculateTaxUtilization(scaledStream, nonRepProfile);
    const repUngResult = calculateTaxUtilization(scaledStream, repUngroupedProfile);

    const nonRepSavings = nonRepResult.totalDepreciationSavings + nonRepResult.totalLIHTCUsed;
    const repUngSavings = repUngResult.totalDepreciationSavings + repUngResult.totalLIHTCUsed;

    // Both passive treatment + NIIT → identical results
    expect(repUngSavings).toBeCloseTo(nonRepSavings, 6);
  });

  test('territory resident (PR): NIIT does NOT apply even for passive', () => {
    const prProfile = buildProfile({
      annualPassiveIncome: 2_000_000,
      investorTrack: 'non-rep',
      groupingElection: false,
      investorState: 'PR',
    });
    const waProfile = buildProfile({
      annualPassiveIncome: 2_000_000,
      investorTrack: 'non-rep',
      groupingElection: false,
      investorState: 'WA',
    });

    const prResult = calculateTaxUtilization(scaledStream, prProfile);
    const waResult = calculateTaxUtilization(scaledStream, waProfile);

    const prSavings = prResult.totalDepreciationSavings + prResult.totalLIHTCUsed;
    const waSavings = waResult.totalDepreciationSavings + waResult.totalLIHTCUsed;

    // PR should be lower (no NIIT surcharge) by approximately totalDep × 3.8%
    expect(waSavings - prSavings).toBeCloseTo(niitDelta, 2);
  });
});
