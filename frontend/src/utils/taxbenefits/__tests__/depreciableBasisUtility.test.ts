/**
 * IMPL-7.0-012: Depreciable Basis Utility Tests (Updated)
 *
 * Updated test suite reflecting the corrected formula:
 * - Investor equity is NOT excluded (it's a funding source, not a cost)
 * - Land and reserves ARE excluded
 * - Financing costs (loan fees, legal, org) ARE included
 *
 * @version 7.0.12
 * @date 2025-12-20
 */

import {
  calculateDepreciableBasis,
  calculateDepreciableBasisBreakdown,
  DepreciableBasisParams,
} from '../depreciableBasisUtility';

describe('Depreciable Basis Utility', () => {
  // ============================================================================
  // 1. BASELINE VALIDATION
  // ============================================================================

  describe('Baseline Validation', () => {
    it('should calculate baseline depreciable basis with recommended defaults', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000, // $50M
        landValue: 10000000, // $10M land
        investorEquityPct: 30,
        loanFeesPercent: 1.0, // Recommended default
        legalStructuringCosts: 150000, // Recommended default
        organizationCosts: 50000, // Recommended default
      };

      const result = calculateDepreciableBasis(params);

      // NEW FORMULA: Investor equity NOT excluded
      // Investor equity = $50M × 30% = $15M (for debt calc, NOT subtracted from basis)
      // Total debt = $50M - $15M = $35M
      // Loan fees = $35M × 1% = $350K
      // Basis = $50M + $350K + $150K legal + $50K org - $10M land
      // = $50M + $550K - $10M = $40,550,000
      const expectedBasis = 50000000 + 350000 + 150000 + 50000 - 10000000;
      expect(result).toBeCloseTo(expectedBasis, 0);
    });

    it('should calculate basis without adjustments when parameters omitted (backward compatibility)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000, // $50M
        landValue: 10000000, // $10M land
        investorEquityPct: 30,
        // No loan fees, legal costs, or org costs specified
      };

      const result = calculateDepreciableBasis(params);

      // NEW FORMULA: Investor equity NOT excluded
      // Basis = $50M + $0 - $10M land = $40,000,000
      expect(result).toBeCloseTo(40000000, 0);
    });

    it('should include predevelopment costs in depreciable basis', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        predevelopmentCosts: 2000000, // $2M predevelopment
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Total project cost = $50M + $2M = $52M
      // Effective project cost = $52M (no reserves in this case)
      // Investor equity = $52M * 30% = $15.6M (for debt calc only)
      // Total debt = $52M - $15.6M = $36.4M
      // Loan fees = $36.4M * 1% = $364K
      // Basis = $52M + $364K + $150K + $50K - $10M = $42,564,000
      expect(result).toBeCloseTo(42564000, 0);
    });

    it('should handle interest reserve correctly (included in equity calc, not basis)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        interestReserve: 1500000, // $1.5M interest reserve
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Total project cost = $50M (interest reserve NOT added to this)
      // Effective project cost = $50M + $1.5M = $51.5M (for equity calc)
      // Investor equity = $51.5M * 30% = $15.45M (for debt calc only)
      // Total debt = $51.5M - $15.45M = $36.05M
      // Loan fees = $36.05M * 1% = $360.5K
      // Basis = $50M + $360.5K + $150K + $50K - $10M = $40,560,500
      expect(result).toBeCloseTo(40560500, 0);
    });

    it('should exclude land value from depreciable basis', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 15000000, // Higher land value
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Investor equity = $50M * 30% = $15M (for debt calc only)
      // Total debt = $50M - $15M = $35M
      // Loan fees = $35M * 1% = $350K
      // Basis = $50M + $350K + $150K + $50K - $15M land = $35,550,000
      expect(result).toBeCloseTo(35550000, 0);
    });

    it('should NOT exclude investor equity from depreciable basis', () => {
      // Investor equity is a funding source, not a cost exclusion
      const params30: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const params40: DepreciableBasisParams = {
        ...params30,
        investorEquityPct: 40,
      };

      const result30 = calculateDepreciableBasis(params30);
      const result40 = calculateDepreciableBasis(params40);

      // Both should have nearly the same basis (small difference from loan fees)
      // The difference should only be in loan fees (lower debt = lower fees)
      const breakdown30 = calculateDepreciableBasisBreakdown(params30);
      const breakdown40 = calculateDepreciableBasisBreakdown(params40);

      // Loan fees difference: $350K - $300K = $50K
      expect(result30 - result40).toBeCloseTo(
        breakdown30.loanFees - breakdown40.loanFees,
        0
      );
    });

    it('should handle zero predevelopment and interest reserve', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        predevelopmentCosts: 0,
        landValue: 10000000,
        investorEquityPct: 30,
        interestReserve: 0,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Same as baseline test with recommended defaults
      expect(result).toBeCloseTo(40550000, 0);
    });
  });

  // ============================================================================
  // 2. PARAMETER RANGE TESTS
  // ============================================================================

  describe('Parameter Range Tests', () => {
    const baseParams: DepreciableBasisParams = {
      projectCost: 50000000,
      landValue: 10000000,
      investorEquityPct: 30,
      loanFeesPercent: 1.0,
      legalStructuringCosts: 150000,
      organizationCosts: 50000,
    };

    it('should handle minimum loan fees (0.5%)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        loanFeesPercent: 0.5,
      };

      const result = calculateDepreciableBasis(params);
      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total debt = $35M, loan fees = $35M * 0.5% = $175K
      expect(breakdown.loanFees).toBeCloseTo(175000, 0);
      expect(result).toBeCloseTo(40375000, 0); // $50M + $175K + $150K + $50K - $10M
    });

    it('should handle default loan fees (1.0%)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        loanFeesPercent: 1.0,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total debt = $35M, loan fees = $35M * 1% = $350K
      expect(breakdown.loanFees).toBeCloseTo(350000, 0);
    });

    it('should handle maximum loan fees (3.0%)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        loanFeesPercent: 3.0,
      };

      const result = calculateDepreciableBasis(params);
      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total debt = $35M, loan fees = $35M * 3% = $1.05M
      expect(breakdown.loanFees).toBeCloseTo(1050000, 0);
      expect(result).toBeCloseTo(41250000, 0); // $50M + $1.05M + $150K + $50K - $10M
    });

    it('should handle minimum legal costs ($50K)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        legalStructuringCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Basis = $50M + $350K + $50K + $50K - $10M = $40,450,000
      expect(result).toBeCloseTo(40450000, 0);
    });

    it('should handle default legal costs ($150K)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        legalStructuringCosts: 150000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      expect(breakdown.legalStructuringCosts).toBe(150000);
    });

    it('should handle maximum legal costs ($500K)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        legalStructuringCosts: 500000,
      };

      const result = calculateDepreciableBasis(params);

      // Basis = $50M + $350K + $500K + $50K - $10M = $40,900,000
      expect(result).toBeCloseTo(40900000, 0);
    });

    it('should handle minimum organization costs ($25K)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        organizationCosts: 25000,
      };

      const result = calculateDepreciableBasis(params);

      // Basis = $50M + $350K + $150K + $25K - $10M = $40,525,000
      expect(result).toBeCloseTo(40525000, 0);
    });

    it('should handle default organization costs ($50K)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        organizationCosts: 50000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      expect(breakdown.organizationCosts).toBe(50000);
    });

    it('should handle maximum organization costs ($150K)', () => {
      const params: DepreciableBasisParams = {
        ...baseParams,
        organizationCosts: 150000,
      };

      const result = calculateDepreciableBasis(params);

      // Basis = $50M + $350K + $150K + $150K - $10M = $40,650,000
      expect(result).toBeCloseTo(40650000, 0);
    });
  });

  // ============================================================================
  // 3. INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should calculate complete basis with all adjustments', () => {
      const params: DepreciableBasisParams = {
        projectCost: 100000000, // $100M
        predevelopmentCosts: 5000000, // $5M
        landValue: 20000000, // $20M
        investorEquityPct: 35, // 35%
        interestReserve: 3000000, // $3M
        loanFeesPercent: 1.5, // 1.5%
        legalStructuringCosts: 250000, // $250K
        organizationCosts: 100000, // $100K
      };

      const result = calculateDepreciableBasis(params);
      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total project cost = $100M + $5M = $105M
      // Effective project cost = $105M + $3M = $108M (includes reserves for equity/debt split)
      // Investor equity = $108M * 35% = $37.8M
      // Total debt = $108M - $37.8M = $70.2M
      // Loan fees = $70.2M * 1.5% = $1.053M
      // Basis adjustments = $1.053M + $250K + $100K = $1.403M
      // Depreciable basis = $105M + $1.403M - $20M = $86,403,000

      expect(breakdown.totalProjectCost).toBe(105000000);
      expect(breakdown.effectiveProjectCost).toBe(108000000);
      expect(breakdown.investorEquity).toBe(37800000);
      expect(breakdown.totalDebt).toBe(70200000);
      expect(breakdown.loanFees).toBeCloseTo(1053000, 0);
      expect(breakdown.basisAdjustments).toBeCloseTo(1403000, 0);
      expect(result).toBeCloseTo(86403000, 0);
    });

    it('should maintain consistency between calculate and breakdown functions', () => {
      const params: DepreciableBasisParams = {
        projectCost: 75000000,
        predevelopmentCosts: 3000000,
        landValue: 15000000,
        investorEquityPct: 32,
        interestReserve: 2000000,
        loanFeesPercent: 1.2,
        legalStructuringCosts: 200000,
        organizationCosts: 75000,
      };

      const directResult = calculateDepreciableBasis(params);
      const breakdown = calculateDepreciableBasisBreakdown(params);

      expect(directResult).toBe(breakdown.depreciableBasis);
    });

    it('should handle slate brief scenario (30% equity, $100M project)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 100000000,
        predevelopmentCosts: 0,
        landValue: 20000000,
        investorEquityPct: 30,
        interestReserve: 0,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Investor equity = $100M * 30% = $30M (for debt calc only)
      // Total debt = $100M - $30M = $70M
      // Loan fees = $70M * 1% = $700K
      // Basis = $100M + $700K + $150K + $50K - $20M = $80,900,000
      expect(result).toBeCloseTo(80900000, 0);
    });

    it('should handle high leverage scenario (20% equity)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 20, // High leverage
        loanFeesPercent: 1.5,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Investor equity = $50M * 20% = $10M
      // Total debt = $50M - $10M = $40M
      // Loan fees = $40M * 1.5% = $600K
      expect(breakdown.totalDebt).toBe(40000000);
      expect(breakdown.loanFees).toBeCloseTo(600000, 0);
    });

    it('should handle low leverage scenario (50% equity)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 50, // Low leverage
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Investor equity = $50M * 50% = $25M
      // Total debt = $50M - $25M = $25M
      // Loan fees = $25M * 1% = $250K
      expect(breakdown.totalDebt).toBe(25000000);
      expect(breakdown.loanFees).toBeCloseTo(250000, 0);
    });

    it('should handle large predevelopment costs (20% of project)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        predevelopmentCosts: 10000000, // 20% predevelopment
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);
      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total project cost = $50M + $10M = $60M
      // Investor equity = $60M * 30% = $18M (for debt calc only)
      // Total debt = $60M - $18M = $42M
      // Loan fees = $42M * 1% = $420K
      // Basis = $60M + $420K + $150K + $50K - $10M = $50,620,000

      expect(breakdown.totalProjectCost).toBe(60000000);
      expect(breakdown.loanFees).toBeCloseTo(420000, 0);
      expect(result).toBeCloseTo(50620000, 0);
    });

    it('should handle large interest reserve (10% of project)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        interestReserve: 5000000, // 10% reserve
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Effective project cost = $50M + $5M = $55M
      // Investor equity = $55M * 30% = $16.5M
      // Total debt = $55M - $16.5M = $38.5M
      // Loan fees = $38.5M * 1% = $385K

      expect(breakdown.effectiveProjectCost).toBe(55000000);
      expect(breakdown.investorEquity).toBe(16500000);
      expect(breakdown.totalDebt).toBe(38500000);
      expect(breakdown.loanFees).toBeCloseTo(385000, 0);
    });

    it('should handle high land value (40% of project cost)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 20000000, // 40% land
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Investor equity = $50M * 30% = $15M (for debt calc only)
      // Total debt = $50M - $15M = $35M
      // Loan fees = $35M * 1% = $350K
      // Basis = $50M + $350K + $150K + $50K - $20M = $30,550,000

      expect(result).toBeCloseTo(30550000, 0);
    });
  });

  // ============================================================================
  // 4. EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero land value', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 0, // No land value
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);

      // Investor equity = $50M * 30% = $15M (for debt calc only)
      // Total debt = $35M, loan fees = $350K
      // Basis = $50M + $350K + $150K + $50K - $0 = $50,550,000
      expect(result).toBeCloseTo(50550000, 0);
    });

    it('should handle zero investor equity (100% debt)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 0, // 100% debt
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Investor equity = $50M * 0% = $0
      // Total debt = $50M - $0 = $50M
      // Loan fees = $50M * 1% = $500K
      // Basis = $50M + $500K + $150K + $50K - $10M = $40,700,000

      expect(breakdown.investorEquity).toBe(0);
      expect(breakdown.totalDebt).toBe(50000000);
      expect(breakdown.loanFees).toBeCloseTo(500000, 0);
    });

    it('should handle 100% investor equity (no debt)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 100, // 100% equity
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Investor equity = $50M * 100% = $50M
      // Total debt = $50M - $50M = $0
      // Loan fees = $0 * 1% = $0
      // Basis = $50M + $0 - $10M = $40,000,000

      expect(breakdown.investorEquity).toBe(50000000);
      expect(breakdown.totalDebt).toBe(0);
      expect(breakdown.loanFees).toBe(0);
      expect(breakdown.depreciableBasis).toBe(40000000);
    });

    it('should cap negative depreciable basis at zero', () => {
      const params: DepreciableBasisParams = {
        projectCost: 10000000, // Small project
        landValue: 15000000, // Land value > project cost
        investorEquityPct: 50,
      };

      const result = calculateDepreciableBasis(params);

      // Basis = $10M + adjustments - $15M = negative → $0
      expect(result).toBe(0);
    });

    it('should handle zero loan fees', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 0, // No loan fees
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total debt = $35M, loan fees = $35M * 0% = $0
      expect(breakdown.loanFees).toBe(0);
    });

    it('should handle zero legal and org costs', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 0, // No loan fees
        legalStructuringCosts: 0,
        organizationCosts: 0,
      };

      const result = calculateDepreciableBasis(params);

      // Basis = $50M + $0 - $10M = $40,000,000
      expect(result).toBeCloseTo(40000000, 0);
    });

    it('should handle all adjustments at maximum values', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        predevelopmentCosts: 10000000,
        landValue: 10000000,
        investorEquityPct: 30,
        interestReserve: 5000000,
        loanFeesPercent: 3.0, // Max
        legalStructuringCosts: 500000, // Max
        organizationCosts: 150000, // Max
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Total project cost = $60M
      // Effective project cost = $65M
      // Investor equity = $65M * 30% = $19.5M
      // Total debt = $65M - $19.5M = $45.5M
      // Loan fees = $45.5M * 3% = $1.365M
      // Basis adjustments = $1.365M + $500K + $150K = $2.015M

      expect(breakdown.basisAdjustments).toBeCloseTo(2015000, 0);
    });
  });

  // ============================================================================
  // 5. MATHEMATICAL VALIDATION
  // ============================================================================

  describe('Mathematical Validation', () => {
    it('should satisfy: depreciableBasis = totalProjectCost + adjustments - landValue', () => {
      const params: DepreciableBasisParams = {
        projectCost: 75000000,
        predevelopmentCosts: 3000000,
        landValue: 15000000,
        investorEquityPct: 32,
        interestReserve: 2000000,
        loanFeesPercent: 1.2,
        legalStructuringCosts: 200000,
        organizationCosts: 75000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // NEW FORMULA: Investor equity NOT excluded
      const calculated =
        breakdown.totalProjectCost +
        breakdown.basisAdjustments -
        breakdown.landValue;

      expect(breakdown.depreciableBasis).toBeCloseTo(calculated, 0);
    });

    it('should satisfy: loanFees = totalDebt × (loanFeesPercent / 100)', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.5,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      const expectedLoanFees = breakdown.totalDebt * (1.5 / 100);
      expect(breakdown.loanFees).toBeCloseTo(expectedLoanFees, 0);
    });

    it('should satisfy: basisAdjustments = loanFees + legalCosts + orgCosts', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.5,
        legalStructuringCosts: 250000,
        organizationCosts: 100000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      const expected =
        breakdown.loanFees +
        breakdown.legalStructuringCosts +
        breakdown.organizationCosts;

      expect(breakdown.basisAdjustments).toBeCloseTo(expected, 0);
    });
  });

  // ============================================================================
  // 6. BREAKDOWN FUNCTION TESTS
  // ============================================================================

  describe('Breakdown Function', () => {
    it('should return all expected breakdown fields', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        predevelopmentCosts: 2000000,
        landValue: 10000000,
        investorEquityPct: 30,
        interestReserve: 1500000,
        loanFeesPercent: 1.2,
        legalStructuringCosts: 200000,
        organizationCosts: 75000,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      expect(breakdown).toHaveProperty('totalProjectCost');
      expect(breakdown).toHaveProperty('effectiveProjectCost');
      expect(breakdown).toHaveProperty('interestReserve');
      expect(breakdown).toHaveProperty('leaseUpReserve');
      expect(breakdown).toHaveProperty('totalDebt');
      expect(breakdown).toHaveProperty('loanFees');
      expect(breakdown).toHaveProperty('loanFeesPercent');
      expect(breakdown).toHaveProperty('legalStructuringCosts');
      expect(breakdown).toHaveProperty('organizationCosts');
      expect(breakdown).toHaveProperty('basisAdjustments');
      expect(breakdown).toHaveProperty('landValue');
      expect(breakdown).toHaveProperty('investorEquity');
      expect(breakdown).toHaveProperty('depreciableBasis');
      expect(breakdown).toHaveProperty('depreciableBasisPct');
      expect(breakdown).toHaveProperty('landPct');
      expect(breakdown).toHaveProperty('investorEquityPct');

      // All numeric values should be numbers
      expect(typeof breakdown.totalProjectCost).toBe('number');
      expect(typeof breakdown.effectiveProjectCost).toBe('number');
      expect(typeof breakdown.depreciableBasis).toBe('number');
    });

    it('should calculate percentage ratios correctly', () => {
      const params: DepreciableBasisParams = {
        projectCost: 50000000,
        predevelopmentCosts: 0,
        landValue: 10000000, // 20% of project
        investorEquityPct: 30,
      };

      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Land percentage = $10M / $50M = 20%
      expect(breakdown.landPct).toBeCloseTo(20, 1);

      // Investor equity percentage should match input
      expect(breakdown.investorEquityPct).toBe(30);

      // Depreciable basis percentage
      const expectedPct = (breakdown.depreciableBasis / 50000000) * 100;
      expect(breakdown.depreciableBasisPct).toBeCloseTo(expectedPct, 1);
    });
  });

  // ============================================================================
  // 7. ACCEPTANCE CRITERIA
  // ============================================================================

  describe('Acceptance Criteria', () => {
    it('ACCEPTANCE: Loan fees (1% recommended) added to basis', () => {
      const paramsWithout: DepreciableBasisParams = {
        projectCost: 100000000,
        landValue: 20000000,
        investorEquityPct: 30,
        loanFeesPercent: 0,
        legalStructuringCosts: 0,
        organizationCosts: 0,
      };

      const paramsWith: DepreciableBasisParams = {
        ...paramsWithout,
        loanFeesPercent: 1.0, // Recommended: 1%
      };

      const basisWithout = calculateDepreciableBasis(paramsWithout);
      const basisWith = calculateDepreciableBasis(paramsWith);
      const breakdown = calculateDepreciableBasisBreakdown(paramsWith);

      // Total debt = $100M - $30M = $70M
      // Loan fees = $70M * 1% = $700K
      expect(breakdown.loanFeesPercent).toBe(1.0);
      expect(breakdown.loanFees).toBeCloseTo(700000, 0);

      // Verify loan fees increase basis by $700K
      expect(basisWith - basisWithout).toBeCloseTo(700000, 0);
    });

    it('ACCEPTANCE: Legal costs ($150K recommended) added to basis', () => {
      const paramsWithout: DepreciableBasisParams = {
        projectCost: 100000000,
        landValue: 20000000,
        investorEquityPct: 30,
        loanFeesPercent: 0,
        legalStructuringCosts: 0,
        organizationCosts: 0,
      };

      const paramsWith: DepreciableBasisParams = {
        ...paramsWithout,
        legalStructuringCosts: 150000, // Recommended: $150K
      };

      const basisWithout = calculateDepreciableBasis(paramsWithout);
      const basisWith = calculateDepreciableBasis(paramsWith);
      const breakdown = calculateDepreciableBasisBreakdown(paramsWith);

      expect(breakdown.legalStructuringCosts).toBe(150000);

      // Verify legal costs increase basis by $150K
      expect(basisWith - basisWithout).toBeCloseTo(150000, 0);
    });

    it('ACCEPTANCE: Organization costs ($50K recommended) added to basis', () => {
      const paramsWithout: DepreciableBasisParams = {
        projectCost: 100000000,
        landValue: 20000000,
        investorEquityPct: 30,
        loanFeesPercent: 0,
        legalStructuringCosts: 0,
        organizationCosts: 0,
      };

      const paramsWith: DepreciableBasisParams = {
        ...paramsWithout,
        organizationCosts: 50000, // Recommended: $50K
      };

      const basisWithout = calculateDepreciableBasis(paramsWithout);
      const basisWith = calculateDepreciableBasis(paramsWith);
      const breakdown = calculateDepreciableBasisBreakdown(paramsWith);

      expect(breakdown.organizationCosts).toBe(50000);

      // Verify org costs increase basis by $50K
      expect(basisWith - basisWithout).toBeCloseTo(50000, 0);
    });

    it('ACCEPTANCE: All three adjustments work together correctly', () => {
      const params: DepreciableBasisParams = {
        projectCost: 100000000,
        landValue: 20000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const result = calculateDepreciableBasis(params);
      const breakdown = calculateDepreciableBasisBreakdown(params);

      // Investor equity = $100M * 30% = $30M (for debt calc only)
      // Total debt = $70M
      // Loan fees = $700K
      // Total adjustments = $700K + $150K + $50K = $900K
      // Basis = $100M + $900K - $20M = $80,900,000

      expect(breakdown.basisAdjustments).toBeCloseTo(900000, 0);
      expect(result).toBeCloseTo(80900000, 0);
    });

    it('ACCEPTANCE: Basis increases correctly when adjustments increase', () => {
      const baseParams: DepreciableBasisParams = {
        projectCost: 50000000,
        landValue: 10000000,
        investorEquityPct: 30,
        loanFeesPercent: 1.0,
        legalStructuringCosts: 150000,
        organizationCosts: 50000,
      };

      const baseBasis = calculateDepreciableBasis(baseParams);

      const enhancedParams: DepreciableBasisParams = {
        ...baseParams,
        loanFeesPercent: 2.0, // 2x recommended
        legalStructuringCosts: 300000, // 2x recommended
        organizationCosts: 100000, // 2x recommended
      };

      const enhancedBasis = calculateDepreciableBasis(enhancedParams);

      // Enhanced should be higher than base
      expect(enhancedBasis).toBeGreaterThan(baseBasis);

      // Calculate expected increase
      // Base: $350K + $150K + $50K = $550K adjustments
      // Enhanced: $700K + $300K + $100K = $1,100K adjustments
      // Increase = $550K
      const expectedIncrease = 550000;
      expect(enhancedBasis - baseBasis).toBeCloseTo(expectedIncrease, 0);
    });
  });
});
