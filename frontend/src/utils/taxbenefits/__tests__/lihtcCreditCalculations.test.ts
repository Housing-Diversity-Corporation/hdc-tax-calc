/**
 * Comprehensive test suite for LIHTC Credit Calculations
 *
 * Tests all aspects of federal LIHTC mechanics:
 * - Year 1 PIS proration (all 12 months)
 * - Year 11 catch-up calculations
 * - Total credits invariant (always = 10 × annual)
 * - DDA/QCT 130% boost
 * - Applicable fraction variations
 * - Credit rate variations (4% and 9%)
 * - Edge cases and validation
 * - Integration scenarios
 *
 * @version 7.0.0
 * @date 2025-12-16
 * @task IMPL-7.0-005
 */

import {
  calculateLIHTCSchedule,
  getYear1ProrationFactor,
  getMonthsInServiceYear1,
  getDDAQCTBoostMultiplier,
  calculateQualifiedBasis,
  calculateAnnualLIHTCCredit,
  calculateTotalLIHTCCredits,
  formatLIHTCSchedule,
  LIHTCValidationError,
  type LIHTCCalculationParams,
  type LIHTCCreditSchedule,
} from '../lihtcCreditCalculations';

describe('LIHTC Credit Calculations', () => {
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('Utility Functions', () => {
    describe('getYear1ProrationFactor', () => {
      it('should calculate 100% proration for January PIS', () => {
        expect(getYear1ProrationFactor(1)).toBe(1.0);
      });

      it('should calculate 50% proration for July PIS', () => {
        expect(getYear1ProrationFactor(7)).toBe(0.5);
      });

      it('should calculate 8.33% proration for December PIS', () => {
        expect(getYear1ProrationFactor(12)).toBeCloseTo(0.0833, 4);
      });

      it('should validate PIS month range', () => {
        expect(() => getYear1ProrationFactor(0)).toThrow(LIHTCValidationError);
        expect(() => getYear1ProrationFactor(13)).toThrow(LIHTCValidationError);
      });
    });

    describe('getMonthsInServiceYear1', () => {
      it('should return 12 months for January PIS', () => {
        expect(getMonthsInServiceYear1(1)).toBe(12);
      });

      it('should return 6 months for July PIS', () => {
        expect(getMonthsInServiceYear1(7)).toBe(6);
      });

      it('should return 1 month for December PIS', () => {
        expect(getMonthsInServiceYear1(12)).toBe(1);
      });
    });

    describe('getDDAQCTBoostMultiplier', () => {
      it('should return 1.3 when boost applies', () => {
        expect(getDDAQCTBoostMultiplier(true)).toBe(1.3);
      });

      it('should return 1.0 when boost does not apply', () => {
        expect(getDDAQCTBoostMultiplier(false)).toBe(1.0);
      });
    });

    describe('calculateQualifiedBasis', () => {
      it('should calculate qualified basis without boost', () => {
        const result = calculateQualifiedBasis(50000000, 1.0, 0.75);
        expect(result).toBe(37500000);
      });

      it('should calculate qualified basis with DDA/QCT boost', () => {
        const result = calculateQualifiedBasis(50000000, 1.3, 0.75);
        expect(result).toBe(48750000);
      });

      it('should handle 100% applicable fraction', () => {
        const result = calculateQualifiedBasis(50000000, 1.0, 1.0);
        expect(result).toBe(50000000);
      });
    });

    describe('calculateAnnualLIHTCCredit', () => {
      it('should calculate annual credit at 4% rate', () => {
        const result = calculateAnnualLIHTCCredit(37500000, 0.04);
        expect(result).toBe(1500000);
      });

      it('should calculate annual credit at 9% rate', () => {
        const result = calculateAnnualLIHTCCredit(37500000, 0.09);
        expect(result).toBe(3375000);
      });
    });

    describe('calculateTotalLIHTCCredits', () => {
      it('should always return 10x annual credit', () => {
        expect(calculateTotalLIHTCCredits(1500000)).toBe(15000000);
        expect(calculateTotalLIHTCCredits(3375000)).toBe(33750000);
      });
    });
  });

  // ============================================================================
  // ACCEPTANCE CRITERIA TESTS
  // ============================================================================

  describe('Acceptance Criteria', () => {
    it('ACCEPTANCE: July PIS should yield 50% Year 1 and 50% Year 11', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: true,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      // Year 1 should be 50% of annual credit
      expect(schedule.year1Credit).toBe(schedule.annualCredit * 0.5);

      // Year 11 should be 50% of annual credit
      expect(schedule.year11Credit).toBe(schedule.annualCredit * 0.5);

      // Total should equal 10 × annual credit
      expect(schedule.totalCredits).toBe(schedule.annualCredit * 10);
    });

    it('ACCEPTANCE: January PIS should yield 100% Year 1 and 0% Year 11', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: true,
        pisMonth: 1,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      // Year 1 should be 100% of annual credit
      expect(schedule.year1Credit).toBe(schedule.annualCredit);

      // Year 11 should be 0
      expect(schedule.year11Credit).toBe(0);

      // Total should equal 10 × annual credit
      expect(schedule.totalCredits).toBe(schedule.annualCredit * 10);
    });

    it('ACCEPTANCE: Total always equals 10 × annual credit', () => {
      const pisMonths = [1, 3, 5, 7, 9, 11, 12];

      pisMonths.forEach((pisMonth) => {
        const params: LIHTCCalculationParams = {
          eligibleBasis: 50000000,
          applicableFraction: 0.75,
          ddaQctBoost: false,
          pisMonth,
          creditRate: 0.04,
        };

        const schedule = calculateLIHTCSchedule(params);
        const expectedTotal = schedule.annualCredit * 10;

        expect(schedule.totalCredits).toBeCloseTo(expectedTotal, 2);
      });
    });

    it('ACCEPTANCE: DDA/QCT 130% boost applied correctly', () => {
      const baseParams: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const boostedParams: LIHTCCalculationParams = {
        ...baseParams,
        ddaQctBoost: true,
      };

      const baseSchedule = calculateLIHTCSchedule(baseParams);
      const boostedSchedule = calculateLIHTCSchedule(boostedParams);

      // Boosted credits should be 1.3x base credits
      expect(boostedSchedule.annualCredit).toBeCloseTo(baseSchedule.annualCredit * 1.3, 2);
      expect(boostedSchedule.totalCredits).toBeCloseTo(baseSchedule.totalCredits * 1.3, 2);
    });
  });

  // ============================================================================
  // PIS PRORATION TESTS (ALL 12 MONTHS)
  // ============================================================================

  describe('PIS Proration Tests', () => {
    const baseParams: Omit<LIHTCCalculationParams, 'pisMonth'> = {
      eligibleBasis: 50000000,
      applicableFraction: 0.75,
      ddaQctBoost: false,
      pisMonth: 1, // Will be overridden
      creditRate: 0.04,
    };

    const testCases = [
      { month: 1, name: 'January', monthsInService: 12, proration: 1.0 },
      { month: 2, name: 'February', monthsInService: 11, proration: 11 / 12 },
      { month: 3, name: 'March', monthsInService: 10, proration: 10 / 12 },
      { month: 4, name: 'April', monthsInService: 9, proration: 9 / 12 },
      { month: 5, name: 'May', monthsInService: 8, proration: 8 / 12 },
      { month: 6, name: 'June', monthsInService: 7, proration: 7 / 12 },
      { month: 7, name: 'July', monthsInService: 6, proration: 6 / 12 },
      { month: 8, name: 'August', monthsInService: 5, proration: 5 / 12 },
      { month: 9, name: 'September', monthsInService: 4, proration: 4 / 12 },
      { month: 10, name: 'October', monthsInService: 3, proration: 3 / 12 },
      { month: 11, name: 'November', monthsInService: 2, proration: 2 / 12 },
      { month: 12, name: 'December', monthsInService: 1, proration: 1 / 12 },
    ];

    testCases.forEach(({ month, name, monthsInService, proration }) => {
      it(`should calculate correct Year 1 credit for ${name} PIS (${monthsInService} months)`, () => {
        const params: LIHTCCalculationParams = {
          ...baseParams,
          pisMonth: month,
        };

        const schedule = calculateLIHTCSchedule(params);

        expect(schedule.metadata.pisMonth).toBe(month);
        expect(schedule.metadata.monthsInServiceYear1).toBe(monthsInService);
        expect(schedule.metadata.year1ProrationFactor).toBeCloseTo(proration, 4);
        expect(schedule.year1Credit).toBeCloseTo(schedule.annualCredit * proration, 2);
      });

      it(`should calculate correct Year 11 catch-up for ${name} PIS`, () => {
        const params: LIHTCCalculationParams = {
          ...baseParams,
          pisMonth: month,
        };

        const schedule = calculateLIHTCSchedule(params);

        // Year 11 should be (1 - proration) × annual credit
        const expectedYear11 = schedule.annualCredit * (1 - proration);
        expect(schedule.year11Credit).toBeCloseTo(expectedYear11, 2);
      });

      it(`should maintain total credits invariant for ${name} PIS`, () => {
        const params: LIHTCCalculationParams = {
          ...baseParams,
          pisMonth: month,
        };

        const schedule = calculateLIHTCSchedule(params);
        const expectedTotal = schedule.annualCredit * 10;

        expect(schedule.totalCredits).toBeCloseTo(expectedTotal, 2);
      });
    });
  });

  // ============================================================================
  // DDA/QCT BOOST SCENARIOS
  // ============================================================================

  describe('DDA/QCT Boost Scenarios', () => {
    it('should calculate credits without boost', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.boostMultiplier).toBe(1.0);
      expect(schedule.metadata.qualifiedBasis).toBe(37500000); // 50M × 1.0 × 0.75
      expect(schedule.annualCredit).toBe(1500000); // 37.5M × 0.04
    });

    it('should calculate credits with DDA/QCT boost', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: true,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.boostMultiplier).toBe(1.3);
      expect(schedule.metadata.qualifiedBasis).toBe(48750000); // 50M × 1.3 × 0.75
      expect(schedule.annualCredit).toBe(1950000); // 48.75M × 0.04
    });

    it('should calculate Year 1 and Year 11 correctly with boost', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: true,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.year1Credit).toBe(975000); // 50% of 1.95M
      expect(schedule.year11Credit).toBe(975000); // 50% of 1.95M
      expect(schedule.totalCredits).toBe(19500000); // 10 × 1.95M
    });
  });

  // ============================================================================
  // APPLICABLE FRACTION VARIATIONS
  // ============================================================================

  describe('Applicable Fraction Variations', () => {
    it('should handle 40% applicable fraction (minimum)', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.4,
        ddaQctBoost: false,
        pisMonth: 1,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.qualifiedBasis).toBe(20000000); // 50M × 1.0 × 0.4
      expect(schedule.annualCredit).toBe(800000); // 20M × 0.04
    });

    it('should handle 75% applicable fraction (typical)', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 1,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.qualifiedBasis).toBe(37500000); // 50M × 1.0 × 0.75
      expect(schedule.annualCredit).toBe(1500000); // 37.5M × 0.04
    });

    it('should handle 100% applicable fraction', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 1.0,
        ddaQctBoost: false,
        pisMonth: 1,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.qualifiedBasis).toBe(50000000); // 50M × 1.0 × 1.0
      expect(schedule.annualCredit).toBe(2000000); // 50M × 0.04
    });
  });

  // ============================================================================
  // CREDIT RATE VARIATIONS
  // ============================================================================

  describe('Credit Rate Variations', () => {
    it('should calculate credits at 4% rate (PAB-financed)', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.creditRate).toBe(0.04);
      expect(schedule.annualCredit).toBe(1500000); // 37.5M × 0.04
    });

    it('should calculate credits at 9% rate (competitive)', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.09,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.creditRate).toBe(0.09);
      expect(schedule.annualCredit).toBe(3375000); // 37.5M × 0.09
    });

    it('should maintain Year 1/Year 11 relationship across credit rates', () => {
      const baseParams: Omit<LIHTCCalculationParams, 'creditRate'> = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
      };

      const schedule4 = calculateLIHTCSchedule({ ...baseParams, creditRate: 0.04 });
      const schedule9 = calculateLIHTCSchedule({ ...baseParams, creditRate: 0.09 });

      // Both should have 50% Year 1 / 50% Year 11 for July PIS
      expect(schedule4.year1Credit / schedule4.annualCredit).toBeCloseTo(0.5, 4);
      expect(schedule9.year1Credit / schedule9.annualCredit).toBeCloseTo(0.5, 4);
    });
  });

  // ============================================================================
  // YEARLY BREAKDOWN TESTS
  // ============================================================================

  describe('Yearly Breakdown', () => {
    it('should generate 11 years of credits', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.yearlyBreakdown).toHaveLength(11);
      expect(schedule.yearlyBreakdown[0].year).toBe(1);
      expect(schedule.yearlyBreakdown[10].year).toBe(11);
    });

    it('should have correct proration factors', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      // Year 1: 50% proration
      expect(schedule.yearlyBreakdown[0].prorationFactor).toBe(0.5);

      // Years 2-10: 100% proration
      for (let i = 1; i <= 9; i++) {
        expect(schedule.yearlyBreakdown[i].prorationFactor).toBe(1.0);
      }

      // Year 11: 50% proration (catch-up)
      expect(schedule.yearlyBreakdown[10].prorationFactor).toBe(0.5);
    });

    it('should sum yearly credits to total', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      const sumOfYearly = schedule.yearlyBreakdown.reduce(
        (sum, year) => sum + year.creditAmount,
        0
      );

      expect(sumOfYearly).toBeCloseTo(schedule.totalCredits, 2);
    });
  });

  // ============================================================================
  // EDGE CASES AND VALIDATION
  // ============================================================================

  describe('Edge Cases and Validation', () => {
    it('should handle zero eligible basis', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 0,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.annualCredit).toBe(0);
      expect(schedule.totalCredits).toBe(0);
    });

    it('should reject negative eligible basis', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: -1000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should reject invalid applicable fraction', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 1.5,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should reject invalid PIS month', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 13,
        creditRate: 0.04,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should reject invalid credit rate', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 1.5,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should handle very small eligible basis', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 100,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.annualCredit).toBe(3); // 100 × 0.75 × 0.04
      expect(schedule.totalCredits).toBe(30); // 10 × 3
    });

    it('should handle very large eligible basis', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 1000000000, // $1 billion
        applicableFraction: 0.75,
        ddaQctBoost: true,
        pisMonth: 1,
        creditRate: 0.09,
      };

      const schedule = calculateLIHTCSchedule(params);

      expect(schedule.metadata.qualifiedBasis).toBe(975000000); // 1B × 1.3 × 0.75
      expect(schedule.annualCredit).toBe(87750000); // 975M × 0.09
      expect(schedule.totalCredits).toBe(877500000); // 10 × 87.75M
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('Integration Scenarios', () => {
    it('should calculate realistic scenario: 4% PAB deal with DDA boost', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 75000000,
        applicableFraction: 0.8,
        ddaQctBoost: true,
        pisMonth: 6, // June
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);

      // Qualified basis: 75M × 1.3 × 0.8 = 78M
      expect(schedule.metadata.qualifiedBasis).toBe(78000000);

      // Annual credit: 78M × 0.04 = 3.12M
      expect(schedule.annualCredit).toBe(3120000);

      // Year 1: 7 months in service = 58.33% of annual
      expect(schedule.year1Credit).toBeCloseTo(1820000, 0);

      // Year 11: 41.67% catch-up
      expect(schedule.year11Credit).toBeCloseTo(1300000, 0);

      // Total: 10 × 3.12M = 31.2M
      expect(schedule.totalCredits).toBe(31200000);
    });

    it('should calculate realistic scenario: 9% competitive deal', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 45000000,
        applicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 4, // April
        creditRate: 0.09,
      };

      const schedule = calculateLIHTCSchedule(params);

      // Qualified basis: 45M × 1.0 × 0.75 = 33.75M
      expect(schedule.metadata.qualifiedBasis).toBe(33750000);

      // Annual credit: 33.75M × 0.09 = 3.0375M
      expect(schedule.annualCredit).toBe(3037500);

      // Year 1: 9 months in service = 75% of annual
      expect(schedule.year1Credit).toBe(2278125);

      // Year 11: 25% catch-up
      expect(schedule.year11Credit).toBe(759375);

      // Total: 10 × 3.0375M = 30.375M
      expect(schedule.totalCredits).toBe(30375000);
    });

    it('should calculate scenario: 100% affordable, no boost', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 60000000,
        applicableFraction: 1.0,
        ddaQctBoost: false,
        pisMonth: 1, // January
        creditRate: 0.09,
      };

      const schedule = calculateLIHTCSchedule(params);

      // Qualified basis: 60M × 1.0 × 1.0 = 60M
      expect(schedule.metadata.qualifiedBasis).toBe(60000000);

      // Annual credit: 60M × 0.09 = 5.4M
      expect(schedule.annualCredit).toBe(5400000);

      // Year 1: Full year = 100% of annual
      expect(schedule.year1Credit).toBe(5400000);

      // Year 11: No catch-up
      expect(schedule.year11Credit).toBe(0);

      // Total: 10 × 5.4M = 54M
      expect(schedule.totalCredits).toBe(54000000);
    });
  });

  // ============================================================================
  // FORMATTING TESTS
  // ============================================================================

  describe('Formatting', () => {
    it('should format LIHTC schedule for display', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        applicableFraction: 0.75,
        ddaQctBoost: true,
        pisMonth: 7,
        creditRate: 0.04,
      };

      const schedule = calculateLIHTCSchedule(params);
      const formatted = formatLIHTCSchedule(schedule);

      expect(formatted).toContain('LIHTC Credit Schedule');
      expect(formatted).toContain('Qualified Basis');
      expect(formatted).toContain('DDA/QCT Boost: 1.3x');
      expect(formatted).toContain('PIS Month: 7');
      expect(formatted).toContain('Year 1 Credit');
      expect(formatted).toContain('Year 11 Credit');
      expect(formatted).toContain('TOTAL CREDITS');
    });
  });
});
