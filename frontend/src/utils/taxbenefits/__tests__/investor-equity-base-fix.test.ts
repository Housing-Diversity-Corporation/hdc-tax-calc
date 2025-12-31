/**
 * Integration test for Depreciable Basis Calculation
 *
 * IMPL-7.0-012: Investor equity is a FUNDING SOURCE, not a cost exclusion.
 * The depreciable basis calculation now excludes only:
 * - Land value (standard real estate rule)
 *
 * Investor equity is NOT excluded from depreciable basis.
 *
 * Formula: Depreciable Basis = Project Cost + Predevelopment - Land Value
 */

import { calculateDepreciableBasis, calculateDepreciableBasisBreakdown } from '../depreciableBasisUtility';

describe('Depreciable Basis - IMPL-7.0-012 Verification', () => {

  test('Depreciable basis excludes only land value (investor equity NOT excluded)', () => {
    // Trace 4001 configuration
    const projectCost = 67_000_000;
    const predevelopmentCosts = 0;
    const landValue = 3_514_000;
    const investorEquityPct = 5;
    const interestReserve = 1_909_000;

    const result = calculateDepreciableBasis({
      projectCost,
      predevelopmentCosts,
      landValue,
      investorEquityPct,
      interestReserve
    });

    // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
    // Depreciable Basis = $67,000,000 - $3,514,000 = $63,486,000
    const expectedDepreciableBasis = projectCost - landValue;

    expect(result).toBe(expectedDepreciableBasis);
    expect(result).toBe(63_486_000);
  });

  test('Same basis regardless of investor equity percentage', () => {
    // Since investor equity is NOT excluded, different equity percentages
    // should result in the SAME depreciable basis
    const projectCost = 67_000_000;
    const landValue = 3_514_000;

    const testCases = [
      { equityPct: 5 },
      { equityPct: 10 },
      { equityPct: 20 },
      { equityPct: 30 },
    ];

    const expectedBasis = projectCost - landValue; // $63,486,000

    testCases.forEach(({ equityPct }) => {
      const result = calculateDepreciableBasis({
        projectCost,
        predevelopmentCosts: 0,
        landValue,
        investorEquityPct: equityPct,
        interestReserve: 0
      });

      expect(result).toBe(expectedBasis);
    });
  });

  test('Interest reserve does NOT affect depreciable basis', () => {
    // IMPL-7.0-012: Interest reserve affects equity calculation for other purposes
    // but does NOT affect depreciable basis
    const projectCost = 67_000_000;
    const landValue = 3_514_000;
    const investorEquityPct = 5;
    const interestReserve = 1_909_000;

    const basisWithInterestReserve = calculateDepreciableBasis({
      projectCost,
      predevelopmentCosts: 0,
      landValue,
      investorEquityPct,
      interestReserve
    });

    const basisWithoutInterestReserve = calculateDepreciableBasis({
      projectCost,
      predevelopmentCosts: 0,
      landValue,
      investorEquityPct,
      interestReserve: 0
    });

    // Both should be the same: $67M - $3.514M = $63.486M
    expect(basisWithInterestReserve).toBe(63_486_000);
    expect(basisWithoutInterestReserve).toBe(63_486_000);
    expect(basisWithInterestReserve).toBe(basisWithoutInterestReserve);
  });

  test('Breakdown function provides correct component details', () => {
    const projectCost = 67_000_000;
    const landValue = 3_514_000;
    const investorEquityPct = 5;
    const interestReserve = 1_909_000;

    const breakdown = calculateDepreciableBasisBreakdown({
      projectCost,
      predevelopmentCosts: 0,
      landValue,
      investorEquityPct,
      interestReserve
    });

    // Verify breakdown components
    expect(breakdown.totalProjectCost).toBe(67_000_000);
    expect(breakdown.landValue).toBe(3_514_000);
    expect(breakdown.depreciableBasis).toBe(63_486_000);

    // Investor equity is calculated but NOT excluded from basis
    const effectiveProjectCost = projectCost + interestReserve;
    const expectedInvestorEquity = effectiveProjectCost * (investorEquityPct / 100);
    expect(breakdown.investorEquity).toBe(expectedInvestorEquity);
    expect(breakdown.investorEquity).toBe(3_445_450);

    // Verify that basis = totalProjectCost - landValue (no equity subtraction)
    expect(breakdown.depreciableBasis).toBe(breakdown.totalProjectCost - breakdown.landValue);
  });
});
