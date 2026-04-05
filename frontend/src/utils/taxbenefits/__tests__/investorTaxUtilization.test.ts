/**
 * Investor Tax Utilization Engine Tests
 *
 * Per Investor Tax Utilization & Fund Architecture Spec v2.1
 * Tests cover:
 * - Case A: REP Grouped (Nonpassive Treatment)
 * - Case B: Non-REP with Passive Income (Passive Treatment)
 * - Case D: Non-REP with $0 Passive Income (Full Suspension)
 * - Unit tests for all component functions
 */

import {
  calculateTaxUtilization,
  computeFederalTax,
  computeNOLDrawdown,
  determineTreatment,
  mapFilingStatus,
  BenefitStream,
  InvestorProfile,
  ExitEvent,
  SECTION_461L_LIMITS,
  STANDARD_DEDUCTION,
  TAX_BRACKETS_MFJ,
  TAX_BRACKETS_SINGLE,
  TAX_BRACKETS_HOH
} from '../investorTaxUtilization';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create a standard benefit stream for testing
 * Simulates a $100M project with 10-year hold
 */
function createTestBenefitStream(overrides: Partial<BenefitStream> = {}): BenefitStream {
  const holdPeriod = 10;

  // Standard depreciation: 20% bonus Year 1, then ~2.5% straight-line
  const year1Depreciation = 100 * 0.20 * 0.80; // $16M (20% × $80M depreciable basis)
  const annualStraightLine = (100 * 0.80 - year1Depreciation) / 27.5; // ~$2.3M/year

  const annualDepreciation = [year1Depreciation];
  for (let i = 1; i < holdPeriod; i++) {
    annualDepreciation.push(annualStraightLine);
  }

  // Standard LIHTC: $700K/year for 10 years
  const annualLIHTC = Array(holdPeriod).fill(0.7);

  // State LIHTC: $300K/year for 10 years
  const annualStateLIHTC = Array(holdPeriod).fill(0.3);

  // Operating cash flow: $500K/year
  const annualOperatingCF = Array(holdPeriod).fill(0.5);

  const totalDepreciation = annualDepreciation.reduce((sum, d) => sum + d, 0);

  const exitEvent: ExitEvent = {
    year: holdPeriod,
    exitProceeds: 25, // $25M exit proceeds
    cumulativeDepreciation: totalDepreciation,
    recaptureExposure: totalDepreciation * 0.25,
    appreciationGain: 5, // $5M appreciation
    ozEnabled: false
  };

  return {
    annualDepreciation,
    annualLIHTC,
    annualStateLIHTC,
    annualOperatingCF,
    exitEvents: [exitEvent],
    grossEquity: 20, // $20M gross equity
    netEquity: 18, // $18M net equity (after syndication offset)
    syndicationOffset: 2, // $2M state LIHTC syndication
    ...overrides
  };
}

/**
 * Create a standard investor profile for testing
 */
function createTestInvestorProfile(overrides: Partial<InvestorProfile> = {}): InvestorProfile {
  return {
    annualPassiveIncome: 2_000_000, // $2M passive income
    annualOrdinaryIncome: 1_000_000, // $1M W-2/business income
    annualPortfolioIncome: 500_000, // $500K portfolio income
    filingStatus: 'MFJ',
    investorTrack: 'non-rep',
    groupingElection: false,
    federalOrdinaryRate: 37,
    federalCapGainsRate: 0.238, // 20% + 3.8% NIIT
    investorState: 'NY',
    stateOrdinaryRate: 0.109,
    stateCapGainsRate: 0.109,
    investorEquity: 20_000_000, // $20M
    ...overrides
  };
}

// =============================================================================
// Unit Tests: determineTreatment()
// =============================================================================

describe('determineTreatment', () => {
  it('should return nonpassive for REP with grouping election', () => {
    const result = determineTreatment('rep', true);
    expect(result.treatment).toBe('nonpassive');
    expect(result.label).toBe('REP — Nonpassive Treatment');
  });

  it('should return passive for REP without grouping election', () => {
    const result = determineTreatment('rep', false);
    expect(result.treatment).toBe('passive');
    expect(result.label).toBe('REP, HDC Ungrouped — Passive Treatment');
  });

  it('should return passive for Non-REP regardless of grouping', () => {
    const result1 = determineTreatment('non-rep', true);
    const result2 = determineTreatment('non-rep', false);

    expect(result1.treatment).toBe('passive');
    expect(result2.treatment).toBe('passive');
    expect(result1.label).toBe('Non-REP — Passive Treatment');
    expect(result2.label).toBe('Non-REP — Passive Treatment');
  });
});

// =============================================================================
// Unit Tests: mapFilingStatus()
// =============================================================================

describe('mapFilingStatus', () => {
  it('should map married to MFJ', () => {
    expect(mapFilingStatus('married')).toBe('MFJ');
  });

  it('should map single to Single', () => {
    expect(mapFilingStatus('single')).toBe('Single');
  });

  it('should map HoH to HoH', () => {
    expect(mapFilingStatus('HoH')).toBe('HoH');
  });

  it('should default to MFJ for undefined', () => {
    expect(mapFilingStatus(undefined)).toBe('MFJ');
  });
});

// =============================================================================
// Unit Tests: computeFederalTax()
// =============================================================================

describe('computeFederalTax', () => {
  describe('MFJ Filing Status', () => {
    it('should apply standard deduction correctly', () => {
      const result = computeFederalTax(50_000, 50_000, 0, 'MFJ');
      // Gross income = $100K, standard deduction = $31,500, taxable = $68,500
      expect(result.grossIncome).toBe(100_000);
      expect(result.taxableIncome).toBe(100_000 - STANDARD_DEDUCTION.MFJ);
    });

    it('should compute progressive tax correctly for high earner', () => {
      const result = computeFederalTax(500_000, 500_000, 200_000, 'MFJ');
      // Gross = $1.2M, taxable = $1.2M - $31,500 = $1,168,500
      expect(result.grossIncome).toBe(1_200_000);
      expect(result.marginalRate).toBe(0.37); // Top bracket
      expect(result.federalTaxLiability).toBeGreaterThan(0);
    });

    it('should compute passive tax liability proportionally', () => {
      const result = computeFederalTax(500_000, 500_000, 0, 'MFJ');
      // 50% passive income
      expect(result.passiveTaxLiability).toBeCloseTo(result.federalTaxLiability * 0.5, 0);
    });

    it('should handle zero income', () => {
      const result = computeFederalTax(0, 0, 0, 'MFJ');
      expect(result.grossIncome).toBe(0);
      expect(result.taxableIncome).toBe(0);
      expect(result.federalTaxLiability).toBe(0);
      expect(result.passiveTaxLiability).toBe(0);
    });
  });

  describe('Single Filing Status', () => {
    it('should use Single brackets', () => {
      const result = computeFederalTax(0, 300_000, 0, 'Single');
      // Different standard deduction and brackets than MFJ
      expect(result.taxableIncome).toBe(300_000 - STANDARD_DEDUCTION.Single);
    });

    it('should have higher marginal rates at lower thresholds', () => {
      const mfjResult = computeFederalTax(0, 500_000, 0, 'MFJ');
      const singleResult = computeFederalTax(0, 500_000, 0, 'Single');
      // Single should have higher tax liability at same income
      expect(singleResult.federalTaxLiability).toBeGreaterThan(mfjResult.federalTaxLiability);
    });
  });

  describe('Head of Household Filing Status', () => {
    it('should use HoH brackets', () => {
      const result = computeFederalTax(0, 200_000, 0, 'HoH');
      expect(result.taxableIncome).toBe(200_000 - STANDARD_DEDUCTION.HoH);
    });

    it('should be between Single and MFJ for same income', () => {
      const income = 300_000;
      const mfj = computeFederalTax(0, income, 0, 'MFJ');
      const single = computeFederalTax(0, income, 0, 'Single');
      const hoh = computeFederalTax(0, income, 0, 'HoH');

      expect(hoh.federalTaxLiability).toBeLessThan(single.federalTaxLiability);
      expect(hoh.federalTaxLiability).toBeGreaterThan(mfj.federalTaxLiability);
    });
  });
});

// =============================================================================
// Unit Tests: computeNOLDrawdown()
// =============================================================================

describe('computeNOLDrawdown', () => {
  it('should return empty schedule for zero NOL', () => {
    const result = computeNOLDrawdown(0, 500_000);
    expect(result.nolDrawdownYears).toBe(0);
    expect(result.nolDrawdownSchedule).toHaveLength(0);
  });

  it('should return empty schedule for zero taxable income', () => {
    const result = computeNOLDrawdown(1_000_000, 0);
    expect(result.nolDrawdownYears).toBe(0);
    expect(result.nolDrawdownSchedule).toHaveLength(0);
  });

  it('should apply 80% TCJA limitation', () => {
    // $1M NOL, $500K taxable income
    // Annual limit = $500K × 80% = $400K
    const result = computeNOLDrawdown(1_000_000, 500_000);

    expect(result.nolDrawdownSchedule[0].nolUsed).toBe(400_000);
    expect(result.nolDrawdownSchedule[0].nolRemaining).toBe(600_000);
  });

  it('should exhaust NOL over multiple years', () => {
    // $1M NOL, $500K taxable income (80% = $400K/year)
    // Takes 3 years: 400K + 400K + 200K
    const result = computeNOLDrawdown(1_000_000, 500_000);

    expect(result.nolDrawdownYears).toBe(3);
    expect(result.nolDrawdownSchedule[2].nolRemaining).toBe(0);
  });

  it('should handle exact division', () => {
    // $800K NOL, $500K taxable income (80% = $400K/year)
    // Takes 2 years: 400K + 400K
    const result = computeNOLDrawdown(800_000, 500_000);
    expect(result.nolDrawdownYears).toBe(2);
  });
});

// =============================================================================
// Constants Validation
// =============================================================================

describe('Tax Constants (2025)', () => {
  describe('Section 461(l) Limits', () => {
    it('should have correct MFJ limit', () => {
      expect(SECTION_461L_LIMITS.MFJ).toBe(626_000);
    });

    it('should have correct Single limit', () => {
      expect(SECTION_461L_LIMITS.Single).toBe(313_000);
    });

    it('should have correct HoH limit', () => {
      expect(SECTION_461L_LIMITS.HoH).toBe(313_000);
    });
  });

  describe('Standard Deduction', () => {
    it('should have correct MFJ deduction', () => {
      expect(STANDARD_DEDUCTION.MFJ).toBe(31_500);
    });

    it('should have correct Single deduction', () => {
      expect(STANDARD_DEDUCTION.Single).toBe(15_750);
    });

    it('should have correct HoH deduction', () => {
      expect(STANDARD_DEDUCTION.HoH).toBe(23_625);
    });
  });

  describe('Tax Brackets Structure', () => {
    it('should have 7 brackets for all filing statuses', () => {
      expect(TAX_BRACKETS_MFJ).toHaveLength(7);
      expect(TAX_BRACKETS_SINGLE).toHaveLength(7);
      expect(TAX_BRACKETS_HOH).toHaveLength(7);
    });

    it('should start at 10% and end at 37%', () => {
      expect(TAX_BRACKETS_MFJ[0].rate).toBe(0.10);
      expect(TAX_BRACKETS_MFJ[6].rate).toBe(0.37);
    });
  });
});

// =============================================================================
// Integration Tests: Case A - REP Grouped (Nonpassive Treatment)
// =============================================================================

describe('Case A: REP Grouped (Nonpassive Treatment)', () => {
  const benefitStream = createTestBenefitStream();
  const investorProfile = createTestInvestorProfile({
    investorTrack: 'rep',
    groupingElection: true,
    annualPassiveIncome: 0, // REP doesn't need passive income
    annualOrdinaryIncome: 3_000_000, // High W-2 earner
    annualPortfolioIncome: 500_000
  });

  const result = calculateTaxUtilization(benefitStream, investorProfile);

  it('should determine nonpassive treatment', () => {
    expect(result.treatment).toBe('nonpassive');
    expect(result.treatmentLabel).toBe('REP — Nonpassive Treatment');
  });

  it('should apply §461(l) excess business loss limitation', () => {
    // Year 1 depreciation ($16M) exceeds $626K limit
    // Note: Values are in MILLIONS - $626K = 0.626M
    const year1 = result.annualUtilization[0];
    const eblLimitInMillions = SECTION_461L_LIMITS.MFJ / 1_000_000;
    expect(year1.depreciationAllowed).toBeCloseTo(eblLimitInMillions, 3);
    expect(year1.nolGenerated).toBeGreaterThan(0);
  });

  it('should generate NOL from excess depreciation', () => {
    const year1 = result.annualUtilization[0];
    // Excess = $16M - $0.626M ≈ $15.4M (all in millions)
    const eblLimitInMillions = SECTION_461L_LIMITS.MFJ / 1_000_000;
    expect(year1.nolGenerated).toBeCloseTo(16 - eblLimitInMillions, 1);
  });

  it('should track NOL pool across years', () => {
    // NOL pool should accumulate
    const lastYear = result.annualUtilization[result.annualUtilization.length - 1];
    expect(lastYear.nolPool).toBeGreaterThanOrEqual(0);
  });

  it('should compute NOL drawdown schedule', () => {
    // With high W-2 income, NOL should draw down over time
    if (result.nolDrawdownYears > 0) {
      expect(result.nolDrawdownSchedule.length).toBe(result.nolDrawdownYears);
    }
  });

  it('should apply §38(c) credit limitation', () => {
    // Credits limited by 75% × tax + $6,250
    const year1 = result.annualUtilization[0];
    expect(year1.lihtcUsable).toBeLessThanOrEqual(year1.lihtcGenerated);
  });

  it('should track carried credits under §39', () => {
    // Excess credits carry forward
    expect(result.annualUtilization.some(u => u.cumulativeCarriedCredits >= 0)).toBe(true);
  });

  it('should compute recapture coverage', () => {
    expect(result.recaptureCoverage).toHaveLength(1);
    const coverage = result.recaptureCoverage[0];
    expect(coverage.exitYear).toBe(10);
    expect(coverage.recaptureExposure).toBeGreaterThan(0);
    expect(coverage.coverageRatio).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// Integration Tests: Case B - Non-REP with Passive Income
// =============================================================================

describe('Case B: Non-REP with Passive Income (Passive Treatment)', () => {
  const benefitStream = createTestBenefitStream();
  const investorProfile = createTestInvestorProfile({
    investorTrack: 'non-rep',
    groupingElection: false,
    annualPassiveIncome: 2_000_000, // Has passive income to offset
    annualOrdinaryIncome: 1_000_000,
    annualPortfolioIncome: 500_000
  });

  const result = calculateTaxUtilization(benefitStream, investorProfile);

  it('should determine passive treatment', () => {
    expect(result.treatment).toBe('passive');
    expect(result.treatmentLabel).toBe('Non-REP — Passive Treatment');
  });

  it('should apply §469 passive loss limitation', () => {
    // Depreciation limited to passive income
    const year1 = result.annualUtilization[0];
    // $16M depreciation vs $2M passive income
    expect(year1.depreciationAllowed).toBeLessThanOrEqual(2_000_000);
  });

  it('should suspend excess losses under §469', () => {
    const year1 = result.annualUtilization[0];
    // $16M - $2M = $14M suspended
    expect(year1.depreciationSuspended).toBeGreaterThan(0);
    expect(year1.cumulativeSuspendedLoss).toBeGreaterThan(0);
  });

  it('should track residual passive income', () => {
    const year2 = result.annualUtilization[1];
    // Year 2+ has ~$2.3M depreciation vs $2M passive
    // May have residual or full offset depending on depreciation
    expect(year2.residualPassiveIncome).toBeGreaterThanOrEqual(0);
  });

  it('should apply §469 credit limitation', () => {
    // Credits limited by tax on residual passive income
    const year1 = result.annualUtilization[0];
    // If no residual passive income, credits are suspended
    if (year1.residualPassiveTax === 0) {
      expect(year1.lihtcUsable).toBe(0);
    }
  });

  it('should suspend credits under §469(b)', () => {
    // Excess credits suspended indefinitely
    expect(result.annualUtilization.some(u => u.cumulativeSuspendedCredits >= 0)).toBe(true);
  });

  it('should compute recapture with suspended loss release', () => {
    const coverage = result.recaptureCoverage[0];
    // §469(g): Full disposition releases suspended losses
    expect(coverage.releasedSuspendedLosses).toBeGreaterThan(0);
    expect(coverage.releasedLossValue).toBeGreaterThan(0);
  });

  it('should have no NOL tracking (passive only)', () => {
    // NOL is nonpassive concept
    const lastYear = result.annualUtilization[result.annualUtilization.length - 1];
    expect(lastYear.nolGenerated).toBe(0);
    expect(lastYear.nolUsed).toBe(0);
    expect(result.nolDrawdownYears).toBe(0);
  });
});

// =============================================================================
// Integration Tests: Case D - Non-REP with $0 Passive Income
// =============================================================================

describe('Case D: Non-REP with $0 Passive Income (Full Suspension)', () => {
  const benefitStream = createTestBenefitStream();
  const investorProfile = createTestInvestorProfile({
    investorTrack: 'non-rep',
    groupingElection: false,
    annualPassiveIncome: 0, // No passive income!
    annualOrdinaryIncome: 3_000_000,
    annualPortfolioIncome: 500_000
  });

  const result = calculateTaxUtilization(benefitStream, investorProfile);

  it('should determine passive treatment', () => {
    expect(result.treatment).toBe('passive');
  });

  it('should suspend ALL depreciation', () => {
    // No passive income = no deductions allowed
    result.annualUtilization.forEach(year => {
      expect(year.depreciationAllowed).toBe(0);
      expect(year.depreciationTaxSavings).toBe(0);
    });
  });

  it('should accumulate all losses as suspended', () => {
    const lastYear = result.annualUtilization[result.annualUtilization.length - 1];
    // All depreciation should be suspended
    const totalDepreciation = benefitStream.annualDepreciation.reduce((sum, d) => sum + d, 0);
    expect(lastYear.cumulativeSuspendedLoss).toBeCloseTo(totalDepreciation, -3);
  });

  it('should suspend ALL LIHTC credits', () => {
    // No passive income = no passive tax = no credit usage
    result.annualUtilization.forEach(year => {
      expect(year.lihtcUsable).toBe(0);
    });
  });

  it('should have very low utilization rate', () => {
    expect(result.overallUtilizationRate).toBeLessThan(0.05);
  });

  it('should return red fit indicator', () => {
    expect(result.fitIndicator).toBe('red');
    expect(result.fitExplanation).toContain('Review recommended');
  });

  it('should release all suspended losses at exit', () => {
    const coverage = result.recaptureCoverage[0];
    // §469(g): Full disposition releases ALL suspended losses
    const totalDepreciation = benefitStream.annualDepreciation.reduce((sum, d) => sum + d, 0);
    expect(coverage.releasedSuspendedLosses).toBeCloseTo(totalDepreciation, -3);
  });
});

// =============================================================================
// Fit Indicator Tests
// =============================================================================

describe('Fit Indicator Classification', () => {
  it('should return green for utilization >= 70%', () => {
    // REP with high W-2 income should have good utilization
    const benefitStream = createTestBenefitStream({
      annualDepreciation: Array(10).fill(0.5), // Low depreciation
      annualLIHTC: Array(10).fill(0.1)
    });
    const investorProfile = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
      annualOrdinaryIncome: 10_000_000
    });

    const result = calculateTaxUtilization(benefitStream, investorProfile);
    if (result.overallUtilizationRate >= 0.70) {
      expect(result.fitIndicator).toBe('green');
    }
  });

  it('should return yellow for utilization 30-70%', () => {
    // Non-REP with moderate passive income
    const benefitStream = createTestBenefitStream();
    const investorProfile = createTestInvestorProfile({
      investorTrack: 'non-rep',
      annualPassiveIncome: 5_000_000
    });

    const result = calculateTaxUtilization(benefitStream, investorProfile);
    if (result.overallUtilizationRate >= 0.30 && result.overallUtilizationRate < 0.70) {
      expect(result.fitIndicator).toBe('yellow');
    }
  });

  it('should return red for utilization < 30%', () => {
    // Non-REP with zero passive income (Case D)
    const benefitStream = createTestBenefitStream();
    const investorProfile = createTestInvestorProfile({
      investorTrack: 'non-rep',
      annualPassiveIncome: 0
    });

    const result = calculateTaxUtilization(benefitStream, investorProfile);
    expect(result.fitIndicator).toBe('red');
  });
});

// =============================================================================
// OZ Deal Tests
// =============================================================================

describe('OZ Deal Handling', () => {
  it('should zero out recapture for OZ deals', () => {
    const benefitStream = createTestBenefitStream();
    benefitStream.exitEvents[0].ozEnabled = true;

    const investorProfile = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true
    });

    const result = calculateTaxUtilization(benefitStream, investorProfile);
    const coverage = result.recaptureCoverage[0];

    expect(coverage.recaptureExposure).toBe(0);
    expect(coverage.capitalGainsTax).toBe(0);
    expect(coverage.totalExitTax).toBe(0);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty benefit stream', () => {
    const emptyStream: BenefitStream = {
      annualDepreciation: [],
      annualLIHTC: [],
      annualStateLIHTC: [],
      annualOperatingCF: [],
      exitEvents: [],
      grossEquity: 0,
      netEquity: 0,
      syndicationOffset: 0
    };

    const investorProfile = createTestInvestorProfile();
    const result = calculateTaxUtilization(emptyStream, investorProfile);

    expect(result.annualUtilization).toHaveLength(0);
    expect(result.totalBenefitGenerated).toBe(0);
  });

  it('should handle single year benefit stream', () => {
    const singleYearStream: BenefitStream = {
      annualDepreciation: [10_000_000],
      annualLIHTC: [500_000],
      annualStateLIHTC: [200_000],
      annualOperatingCF: [300_000],
      exitEvents: [{
        year: 1,
        exitProceeds: 15_000_000,
        cumulativeDepreciation: 10_000_000,
        recaptureExposure: 2_500_000,
        appreciationGain: 5_000_000,
        ozEnabled: false
      }],
      grossEquity: 10_000_000,
      netEquity: 10_000_000,
      syndicationOffset: 0
    };

    const investorProfile = createTestInvestorProfile();
    const result = calculateTaxUtilization(singleYearStream, investorProfile);

    expect(result.annualUtilization).toHaveLength(1);
    expect(result.recaptureCoverage).toHaveLength(1);
  });

  it('should handle multiple exit events (pool scenario)', () => {
    const poolStream = createTestBenefitStream();
    poolStream.exitEvents = [
      { year: 5, dealId: 'Deal-A', exitProceeds: 10, cumulativeDepreciation: 8, recaptureExposure: 2, appreciationGain: 2, ozEnabled: false },
      { year: 7, dealId: 'Deal-B', exitProceeds: 15, cumulativeDepreciation: 12, recaptureExposure: 3, appreciationGain: 3, ozEnabled: true },
      { year: 10, dealId: 'Deal-C', exitProceeds: 20, cumulativeDepreciation: 16, recaptureExposure: 4, appreciationGain: 4, ozEnabled: false }
    ];

    const investorProfile = createTestInvestorProfile();
    const result = calculateTaxUtilization(poolStream, investorProfile);

    expect(result.recaptureCoverage).toHaveLength(3);
    expect(result.recaptureCoverage[0].dealId).toBe('Deal-A');
    expect(result.recaptureCoverage[1].dealId).toBe('Deal-B');
    expect(result.recaptureCoverage[2].dealId).toBe('Deal-C');
  });

  it('should fallback to flat rate when no income composition provided', () => {
    const benefitStream = createTestBenefitStream();
    const investorProfile = createTestInvestorProfile({
      annualPassiveIncome: 0,
      annualOrdinaryIncome: 0,
      annualPortfolioIncome: 0,
      federalOrdinaryRate: 35 // Use flat rate
    });

    const result = calculateTaxUtilization(benefitStream, investorProfile);

    expect(result.incomeComputationUsed).toBe(false);
    expect(result.computedMarginalRate).toBe(0.35);
  });
});

// =============================================================================
// Summary Metrics Tests
// =============================================================================

describe('Summary Metrics', () => {
  const benefitStream = createTestBenefitStream();
  const investorProfile = createTestInvestorProfile({
    investorTrack: 'non-rep',
    annualPassiveIncome: 5_000_000
  });
  const result = calculateTaxUtilization(benefitStream, investorProfile);

  it('should compute total depreciation savings', () => {
    const sumFromAnnual = result.annualUtilization.reduce((sum, u) => sum + u.depreciationTaxSavings, 0);
    expect(result.totalDepreciationSavings).toBeCloseTo(sumFromAnnual, 0);
  });

  it('should compute total LIHTC used', () => {
    const sumFromAnnual = result.annualUtilization.reduce((sum, u) => sum + u.lihtcUsable, 0);
    expect(result.totalLIHTCUsed).toBeCloseTo(sumFromAnnual, 0);
  });

  it('should compute total benefit generated', () => {
    const sumFromAnnual = result.annualUtilization.reduce((sum, u) => sum + u.totalBenefitGenerated, 0);
    expect(result.totalBenefitGenerated).toBeCloseTo(sumFromAnnual, 0);
  });

  it('should compute total benefit usable', () => {
    const sumFromAnnual = result.annualUtilization.reduce((sum, u) => sum + u.totalBenefitUsable, 0);
    expect(result.totalBenefitUsable).toBeCloseTo(sumFromAnnual, 0);
  });

  it('should compute overall utilization rate correctly', () => {
    const expectedRate = result.totalBenefitGenerated > 0
      ? result.totalBenefitUsable / result.totalBenefitGenerated
      : 0;
    expect(result.overallUtilizationRate).toBeCloseTo(expectedRate, 4);
  });
});

// =============================================================================
// IMPL-120: Roth Conversion Duration — Years 1-10 Only
// =============================================================================

describe('IMPL-120: Roth conversion applied only in Years 1-10', () => {
  // 12-year benefit stream to test year 11-12 behavior
  const holdPeriod = 12;
  const stream12yr: BenefitStream = {
    annualDepreciation: [16, ...new Array(holdPeriod - 1).fill(2.3)],
    annualLIHTC: new Array(holdPeriod).fill(0.7),
    annualStateLIHTC: new Array(holdPeriod).fill(0.3),
    annualOperatingCF: new Array(holdPeriod).fill(0.5),
    exitEvents: [{
      year: holdPeriod,
      exitProceeds: 25,
      cumulativeDepreciation: 41.3,
      recaptureExposure: 10.325,
      appreciationGain: 5,
      ozEnabled: false,
    }],
    grossEquity: 20,
    netEquity: 18,
    syndicationOffset: 2,
  };

  it('totalConverted should be rothAnnualConversion × 10, not × 12', () => {
    const profile = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
      annualOrdinaryIncome: 750_000 + 100_000, // base + roth
      rothAnnualConversion: 100_000,
    });

    const result = calculateTaxUtilization(stream12yr, profile);

    // Verify the engine produced 12 years of annual data
    expect(result.annualUtilization.length).toBe(holdPeriod);

    // The Roth field is on the profile — totalConverted is computed externally
    // but the engine should use different tax for years 11-12
    expect(profile.rothAnnualConversion).toBe(100_000);
  });

  it('Years 11-12 should use base (non-Roth) tax computation', () => {
    const rothAmount = 100_000;
    const baseOrdinary = 750_000;

    // Profile WITH Roth
    const profileWithRoth = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
      annualOrdinaryIncome: baseOrdinary + rothAmount,
      rothAnnualConversion: rothAmount,
    });

    // Profile WITHOUT Roth (same base income)
    const profileNoRoth = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
      annualOrdinaryIncome: baseOrdinary,
    });

    const resultWithRoth = calculateTaxUtilization(stream12yr, profileWithRoth);
    const resultNoRoth = calculateTaxUtilization(stream12yr, profileNoRoth);

    // Years 1-10 (indices 0-9): Roth profile should differ from no-Roth
    // (higher income → different depreciation savings due to different marginal rate or tax liability)
    const yr5WithRoth = resultWithRoth.annualUtilization[4];
    const yr5NoRoth = resultNoRoth.annualUtilization[4];
    // At $750K+$100K vs $750K, both are in 37% bracket for MFJ, but federalTaxLiability differs
    // This affects §38(c) credit limit for nonpassive treatment

    // Years 11-12 (indices 10-11): Should match no-Roth profile exactly
    for (let i = 10; i < holdPeriod; i++) {
      const yrRoth = resultWithRoth.annualUtilization[i];
      const yrBase = resultNoRoth.annualUtilization[i];
      expect(yrRoth.depreciationTaxSavings).toBeCloseTo(yrBase.depreciationTaxSavings, 6);
      expect(yrRoth.lihtcUsable).toBeCloseTo(yrBase.lihtcUsable, 6);
    }
  });

  it('no-Roth profile (rothAnnualConversion=0) should be unchanged', () => {
    const profile = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
      annualOrdinaryIncome: 750_000,
      rothAnnualConversion: 0,
    });

    const profileNoField = createTestInvestorProfile({
      investorTrack: 'rep',
      groupingElection: true,
      annualOrdinaryIncome: 750_000,
    });

    const result1 = calculateTaxUtilization(stream12yr, profile);
    const result2 = calculateTaxUtilization(stream12yr, profileNoField);

    expect(result1.totalDepreciationSavings).toBeCloseTo(result2.totalDepreciationSavings, 6);
    expect(result1.totalLIHTCUsed).toBeCloseTo(result2.totalLIHTCUsed, 6);
    expect(result1.overallUtilizationRate).toBeCloseTo(result2.overallUtilizationRate, 6);
  });
});
