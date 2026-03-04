/**
 * IMPL-090 through IMPL-093: Federal/State Depreciation Breakout Tests
 *
 * Validates:
 * - Type completeness (6 breakout fields + investorProfileLabel)
 * - Invariant: federal + state = combined (to the penny)
 * - Profile label construction
 * - Breakout math for NJ (0% bonus conformity), OR (100%), WA (0% state rate)
 * - Edge cases: no state, REP vs Non-REP
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { CalculationParams } from '../../../types/taxbenefits';

// Base params: $80M project, $10M land, 20% cost seg, 10-year hold
const baseParams: CalculationParams = {
  projectCost: 80000000,
  predevelopmentCosts: 0,
  landValue: 10000000,
  investorEquityPct: 20,
  yearOneNOI: 4000000,
  yearOneDepreciationPct: 25,
  effectiveTaxRate: 0, // Use split rates (federalTaxRate + stateTaxRate)
  revenueGrowth: 3,
  expenseGrowth: 3,
  exitCapRate: 6,
  hdcFeeRate: 0,
  hdcAdvanceFinancing: false,
  investorUpfrontCash: 16000000,
  totalTaxBenefit: 0,
  netTaxBenefit: 0,
  hdcFee: 0,
  investorPromoteShare: 35,
  opexRatio: 40,
  aumFeeEnabled: false,
  aumFeeRate: 0,
  seniorDebtPct: 60,
  philanthropicDebtPct: 10,
  seniorDebtRate: 6,
  philanthropicDebtRate: 3,
  seniorDebtAmortization: 30,
  philDebtAmortization: 30,
  philCurrentPayEnabled: false,
  philCurrentPayPct: 0,
  hdcSubDebtPct: 5,
  hdcSubDebtPikRate: 8,
  pikCurrentPayEnabled: false,
  pikCurrentPayPct: 50,
  holdPeriod: 10,
  constructionDelayMonths: 0,
  interestReserveEnabled: false,
  interestReserveMonths: 0,
  placedInServiceMonth: 7,
  federalTaxRate: 37,
  niitRate: 3.8,
};

function makeParams(overrides: Partial<CalculationParams>): CalculationParams {
  return { ...baseParams, ...overrides };
}

// ============================================================================
// IMPL-090: Type Completeness
// ============================================================================

describe('IMPL-090: Type Completeness', () => {
  const results = calculateFullInvestorAnalysis(makeParams({
    stateTaxRate: 10.75,
    bonusConformityRate: 0,
    investorState: 'NJ',
    investorTrack: 'non-rep',
  }));

  it('should have federalDepreciationBenefitYear1', () => {
    expect(typeof results.federalDepreciationBenefitYear1).toBe('number');
  });

  it('should have stateDepreciationBenefitYear1', () => {
    expect(typeof results.stateDepreciationBenefitYear1).toBe('number');
  });

  it('should have federalDepreciationBenefitHoldPeriod', () => {
    expect(typeof results.federalDepreciationBenefitHoldPeriod).toBe('number');
  });

  it('should have stateDepreciationBenefitHoldPeriod', () => {
    expect(typeof results.stateDepreciationBenefitHoldPeriod).toBe('number');
  });

  it('should have federalDepreciationBenefitTotal', () => {
    expect(typeof results.federalDepreciationBenefitTotal).toBe('number');
  });

  it('should have stateDepreciationBenefitTotal', () => {
    expect(typeof results.stateDepreciationBenefitTotal).toBe('number');
  });

  it('should have investorProfileLabel', () => {
    expect(typeof results.investorProfileLabel).toBe('string');
    expect(results.investorProfileLabel!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// IMPL-090: Profile Label Construction
// ============================================================================

describe('IMPL-090: Profile Label', () => {
  it('should produce "NJ Non-REP" for NJ non-rep investor', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 10.75,
      bonusConformityRate: 0,
      investorState: 'NJ',
      investorTrack: 'non-rep',
    }));
    expect(results.investorProfileLabel).toBe('NJ Non-REP');
  });

  it('should produce "OR REP" for OR rep investor', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 9.9,
      bonusConformityRate: 1,
      investorState: 'OR',
      investorTrack: 'rep',
    }));
    expect(results.investorProfileLabel).toBe('OR REP');
  });

  it('should produce "WA Non-REP" for WA non-rep investor', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 0,
      bonusConformityRate: 0,
      investorState: 'WA',
      investorTrack: 'non-rep',
    }));
    expect(results.investorProfileLabel).toBe('WA Non-REP');
  });

  it('should produce "Federal Only" when no investor state set', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 0,
      bonusConformityRate: 0,
      // No investorState, no selectedState
    }));
    expect(results.investorProfileLabel).toBe('Federal Only');
  });

  it('should omit track suffix when investorTrack is not set', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 10.75,
      bonusConformityRate: 0,
      investorState: 'NJ',
      // No investorTrack
    }));
    expect(results.investorProfileLabel).toBe('NJ');
  });
});

// ============================================================================
// IMPL-091: Federal + State = Combined Invariant
// ============================================================================

describe('IMPL-091: Federal + State = Combined Invariant', () => {
  describe('NJ Non-REP (10.75% state, 0% bonus conformity)', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 10.75,
      bonusConformityRate: 0,
      investorState: 'NJ',
      investorTrack: 'non-rep',
    }));

    it('federal + state total = investorTaxBenefits', () => {
      const fedTotal = results.federalDepreciationBenefitTotal!;
      const stateTotal = results.stateDepreciationBenefitTotal!;
      const combined = results.investorTaxBenefits;
      expect(fedTotal + stateTotal).toBeCloseTo(combined, 6);
    });

    it('federal + state Year 1 = year1Bonus + year1MACRS', () => {
      const fedY1 = results.federalDepreciationBenefitYear1!;
      const stateY1 = results.stateDepreciationBenefitYear1!;
      const combinedY1 = (results.year1BonusTaxBenefit || 0) + (results.year1MacrsTaxBenefit || 0);
      expect(fedY1 + stateY1).toBeCloseTo(combinedY1, 6);
    });

    it('federal + state hold period = years2ExitMacrsTaxBenefit', () => {
      const fedHP = results.federalDepreciationBenefitHoldPeriod!;
      const stateHP = results.stateDepreciationBenefitHoldPeriod!;
      const combinedHP = results.years2ExitMacrsTaxBenefit || 0;
      expect(fedHP + stateHP).toBeCloseTo(combinedHP, 6);
    });

    it('Year 1 + Hold Period = Total (federal)', () => {
      expect(results.federalDepreciationBenefitYear1! + results.federalDepreciationBenefitHoldPeriod!)
        .toBeCloseTo(results.federalDepreciationBenefitTotal!, 6);
    });

    it('Year 1 + Hold Period = Total (state)', () => {
      expect(results.stateDepreciationBenefitYear1! + results.stateDepreciationBenefitHoldPeriod!)
        .toBeCloseTo(results.stateDepreciationBenefitTotal!, 6);
    });

    it('state Year 1 should be much smaller than federal Year 1 (no bonus conformity)', () => {
      // NJ has 0% bonus conformity, so state gets NO bonus depreciation benefit in Year 1
      // State Year 1 = only the MACRS straight-line portion × state rate
      // Federal Year 1 = bonus + MACRS × (federal + NIIT rate)
      expect(results.federalDepreciationBenefitYear1!).toBeGreaterThan(results.stateDepreciationBenefitYear1! * 3);
    });
  });

  describe('OR Non-REP (9.9% state, 100% bonus conformity)', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 9.9,
      bonusConformityRate: 1,
      investorState: 'OR',
      investorTrack: 'non-rep',
    }));

    it('federal + state total = investorTaxBenefits', () => {
      const fedTotal = results.federalDepreciationBenefitTotal!;
      const stateTotal = results.stateDepreciationBenefitTotal!;
      const combined = results.investorTaxBenefits;
      expect(fedTotal + stateTotal).toBeCloseTo(combined, 6);
    });

    it('federal + state Year 1 = year1Bonus + year1MACRS', () => {
      const fedY1 = results.federalDepreciationBenefitYear1!;
      const stateY1 = results.stateDepreciationBenefitYear1!;
      const combinedY1 = (results.year1BonusTaxBenefit || 0) + (results.year1MacrsTaxBenefit || 0);
      expect(fedY1 + stateY1).toBeCloseTo(combinedY1, 6);
    });

    it('federal + state hold period = years2ExitMacrsTaxBenefit', () => {
      const fedHP = results.federalDepreciationBenefitHoldPeriod!;
      const stateHP = results.stateDepreciationBenefitHoldPeriod!;
      const combinedHP = results.years2ExitMacrsTaxBenefit || 0;
      expect(fedHP + stateHP).toBeCloseTo(combinedHP, 6);
    });

    it('state/federal ratio ≈ proportional to rates (100% conformity)', () => {
      // OR conforms to bonus, so all depreciation splits proportionally
      // Federal rate: 37 + 3.8 = 40.8, State rate: 9.9
      // Expected ratio: 9.9 / 40.8 ≈ 0.2426
      const ratio = results.stateDepreciationBenefitTotal! / results.federalDepreciationBenefitTotal!;
      const expectedRatio = 9.9 / 40.8;
      expect(ratio).toBeCloseTo(expectedRatio, 2);
    });
  });

  describe('WA Non-REP (0% state rate)', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 0,
      bonusConformityRate: 0,
      investorState: 'WA',
      investorTrack: 'non-rep',
    }));

    it('state fields should all be 0', () => {
      expect(results.stateDepreciationBenefitYear1).toBe(0);
      expect(results.stateDepreciationBenefitHoldPeriod).toBe(0);
      expect(results.stateDepreciationBenefitTotal).toBe(0);
    });

    it('federal total should equal combined total', () => {
      expect(results.federalDepreciationBenefitTotal!).toBeCloseTo(results.investorTaxBenefits, 6);
    });

    it('federal + state total = investorTaxBenefits', () => {
      expect(results.federalDepreciationBenefitTotal! + results.stateDepreciationBenefitTotal!)
        .toBeCloseTo(results.investorTaxBenefits, 6);
    });
  });

  describe('NJ REP (same rates as NJ Non-REP)', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 10.75,
      bonusConformityRate: 0,
      investorState: 'NJ',
      investorTrack: 'rep',
    }));

    it('federal + state total = investorTaxBenefits', () => {
      const fedTotal = results.federalDepreciationBenefitTotal!;
      const stateTotal = results.stateDepreciationBenefitTotal!;
      const combined = results.investorTaxBenefits;
      expect(fedTotal + stateTotal).toBeCloseTo(combined, 6);
    });

    it('profile label should be "NJ REP"', () => {
      expect(results.investorProfileLabel).toBe('NJ REP');
    });

    it('breakout values should match NJ Non-REP (same tax rates)', () => {
      const nonRepResults = calculateFullInvestorAnalysis(makeParams({
        stateTaxRate: 10.75,
        bonusConformityRate: 0,
        investorState: 'NJ',
        investorTrack: 'non-rep',
      }));
      // Same rates → same breakout (track doesn't affect depreciation calculation)
      expect(results.federalDepreciationBenefitTotal!)
        .toBeCloseTo(nonRepResults.federalDepreciationBenefitTotal!, 6);
      expect(results.stateDepreciationBenefitTotal!)
        .toBeCloseTo(nonRepResults.stateDepreciationBenefitTotal!, 6);
    });
  });
});

// ============================================================================
// IMPL-091: Breakout Math Verification
// ============================================================================

describe('IMPL-091: Breakout Math', () => {
  it('NJ: state Year 1 bonus component should be near-zero (0% conformity)', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 10.75,
      bonusConformityRate: 0,
      investorState: 'NJ',
      investorTrack: 'non-rep',
    }));

    // With 0% bonus conformity, state gets NO bonus depreciation benefit
    // State Year 1 only gets the MACRS straight-line portion
    // Federal Year 1 gets both bonus and MACRS
    const fedY1 = results.federalDepreciationBenefitYear1!;
    const stateY1 = results.stateDepreciationBenefitYear1!;

    // Federal Year 1 should dominate (bonus is large, state gets none of it)
    expect(fedY1).toBeGreaterThan(0);
    expect(stateY1).toBeGreaterThanOrEqual(0);
    // State Year 1 should be much smaller since it only gets straight-line MACRS
    expect(fedY1).toBeGreaterThan(stateY1);
  });

  it('OR: state Year 1 should be proportional (100% conformity)', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 9.9,
      bonusConformityRate: 1,
      investorState: 'OR',
      investorTrack: 'non-rep',
    }));

    // With 100% conformity, both bonus and MACRS split proportionally
    // Federal rate: 40.8, State rate: 9.9
    const fedY1 = results.federalDepreciationBenefitYear1!;
    const stateY1 = results.stateDepreciationBenefitYear1!;

    expect(fedY1).toBeGreaterThan(0);
    expect(stateY1).toBeGreaterThan(0);
    // Ratio should be approximately stateRate / federalRate
    const ratio = stateY1 / fedY1;
    expect(ratio).toBeCloseTo(9.9 / 40.8, 2);
  });

  it('all breakout values should be non-negative', () => {
    const scenarios = [
      { stateTaxRate: 10.75, bonusConformityRate: 0, investorState: 'NJ' },
      { stateTaxRate: 9.9, bonusConformityRate: 1, investorState: 'OR' },
      { stateTaxRate: 0, bonusConformityRate: 0, investorState: 'WA' },
    ];

    for (const scenario of scenarios) {
      const results = calculateFullInvestorAnalysis(makeParams({
        ...scenario,
        investorTrack: 'non-rep',
      }));

      expect(results.federalDepreciationBenefitYear1!).toBeGreaterThanOrEqual(0);
      expect(results.stateDepreciationBenefitYear1!).toBeGreaterThanOrEqual(0);
      expect(results.federalDepreciationBenefitHoldPeriod!).toBeGreaterThanOrEqual(0);
      expect(results.stateDepreciationBenefitHoldPeriod!).toBeGreaterThanOrEqual(0);
      expect(results.federalDepreciationBenefitTotal!).toBeGreaterThanOrEqual(0);
      expect(results.stateDepreciationBenefitTotal!).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================================
// IMPL-061 Restored: Temporal Invariant (Year 1 Bonus + Year 1 SL + Years 2-Exit = Total)
// ============================================================================

describe('IMPL-061 Restored: Temporal Invariant', () => {
  const scenarios = [
    { name: 'NJ Non-REP', stateTaxRate: 10.75, bonusConformityRate: 0, investorState: 'NJ', investorTrack: 'non-rep' as const },
    { name: 'OR Non-REP', stateTaxRate: 9.9, bonusConformityRate: 1, investorState: 'OR', investorTrack: 'non-rep' as const },
    { name: 'WA Non-REP', stateTaxRate: 0, bonusConformityRate: 0, investorState: 'WA', investorTrack: 'non-rep' as const },
    { name: 'NJ REP', stateTaxRate: 10.75, bonusConformityRate: 0, investorState: 'NJ', investorTrack: 'rep' as const },
  ];

  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      const results = calculateFullInvestorAnalysis(makeParams(scenario));

      it('year1Bonus + year1MACRS + years2Exit = investorTaxBenefits', () => {
        const y1Bonus = results.year1BonusTaxBenefit || 0;
        const y1Macrs = results.year1MacrsTaxBenefit || 0;
        const y2Exit = results.years2ExitMacrsTaxBenefit || 0;
        expect(y1Bonus + y1Macrs + y2Exit).toBeCloseTo(results.investorTaxBenefits, 6);
      });

      it('temporal fields are all non-negative', () => {
        expect(results.year1BonusTaxBenefit || 0).toBeGreaterThanOrEqual(0);
        expect(results.year1MacrsTaxBenefit || 0).toBeGreaterThanOrEqual(0);
        expect(results.years2ExitMacrsTaxBenefit || 0).toBeGreaterThanOrEqual(0);
      });

      it('Year 1 Bonus should be the largest single component', () => {
        // Bonus depreciation (25% cost seg × 100% in Year 1) dominates Year 1
        const y1Bonus = results.year1BonusTaxBenefit || 0;
        const y1Macrs = results.year1MacrsTaxBenefit || 0;
        expect(y1Bonus).toBeGreaterThan(y1Macrs);
      });
    });
  }
});

// ============================================================================
// Two-Tier Coexistence: Both invariants hold simultaneously
// ============================================================================

describe('Two-Tier Coexistence: Both invariants hold', () => {
  it('NJ: federal+state = total AND y1Bonus+y1MACRS+y2Exit = total', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 10.75,
      bonusConformityRate: 0,
      investorState: 'NJ',
      investorTrack: 'non-rep',
    }));
    const combined = results.investorTaxBenefits;

    // Jurisdictional invariant
    const fedState = results.federalDepreciationBenefitTotal! + results.stateDepreciationBenefitTotal!;
    expect(fedState).toBeCloseTo(combined, 6);

    // Temporal invariant
    const temporal = (results.year1BonusTaxBenefit || 0)
      + (results.year1MacrsTaxBenefit || 0)
      + (results.years2ExitMacrsTaxBenefit || 0);
    expect(temporal).toBeCloseTo(combined, 6);

    // Both sum to the same total
    expect(fedState).toBeCloseTo(temporal, 6);
  });

  it('WA: only temporal group relevant (state = 0), invariant still holds', () => {
    const results = calculateFullInvestorAnalysis(makeParams({
      stateTaxRate: 0,
      bonusConformityRate: 0,
      investorState: 'WA',
      investorTrack: 'non-rep',
    }));
    const combined = results.investorTaxBenefits;

    // State is 0, so federal = combined
    expect(results.stateDepreciationBenefitTotal).toBe(0);
    expect(results.federalDepreciationBenefitTotal!).toBeCloseTo(combined, 6);

    // Temporal invariant still holds
    const temporal = (results.year1BonusTaxBenefit || 0)
      + (results.year1MacrsTaxBenefit || 0)
      + (results.years2ExitMacrsTaxBenefit || 0);
    expect(temporal).toBeCloseTo(combined, 6);
  });
});
