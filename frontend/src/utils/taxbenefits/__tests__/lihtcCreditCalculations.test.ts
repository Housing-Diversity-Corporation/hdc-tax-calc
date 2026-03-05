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
  computeEffectiveYear1AF,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
          stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
      stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.4,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 1.0,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should reject invalid applicable fraction', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        stabilizedApplicableFraction: 1.5,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should reject invalid PIS month', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        stabilizedApplicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 13,
        creditRate: 0.04,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should reject invalid credit rate', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 50000000,
        stabilizedApplicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 1.5,
      };

      expect(() => calculateLIHTCSchedule(params)).toThrow(LIHTCValidationError);
    });

    it('should handle very small eligible basis', () => {
      const params: LIHTCCalculationParams = {
        eligibleBasis: 100,
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 0.8,
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
        stabilizedApplicableFraction: 0.75,
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
        stabilizedApplicableFraction: 1.0,
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
        stabilizedApplicableFraction: 0.75,
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

  // ============================================================================
  // IMPL-118: FIRST-YEAR LIHTC APPLICABLE FRACTION — DEAL TYPE + OCCUPANCY RAMP
  // ============================================================================

  describe('IMPL-118: Deal Type + Occupancy Ramp', () => {
    // --------------------------------------------------------------------------
    // computeEffectiveYear1AF() unit tests
    // --------------------------------------------------------------------------

    describe('computeEffectiveYear1AF()', () => {
      describe('acquisition deal type', () => {
        it('should return stabilizedAF directly (ramp bypassed)', () => {
          expect(computeEffectiveYear1AF('acquisition', 1.0, 6)).toBe(1.0);
          expect(computeEffectiveYear1AF('acquisition', 0.75, 6)).toBe(0.75);
        });

        it('should ignore leaseUpRampInput', () => {
          expect(computeEffectiveYear1AF('acquisition', 1.0, 6, { leaseUpMonths: 4 })).toBe(1.0);
        });
      });

      describe('acquisition_rehab deal type', () => {
        it('should return stabilizedAF directly (ramp bypassed)', () => {
          expect(computeEffectiveYear1AF('acquisition_rehab', 0.9, 6)).toBe(0.9);
        });
      });

      describe('new_construction with linear ramp', () => {
        it('should compute correct AF when leaseUpMonths < monthsInService (Scenario 32)', () => {
          // July PIS (6 months), 4-month lease-up
          // Monthly AFs: 0.25, 0.50, 0.75, 1.00, 1.00, 1.00 = 4.50 / 6 = 0.75
          const result = computeEffectiveYear1AF('new_construction', 1.0, 6, { leaseUpMonths: 4 });
          expect(result).toBeCloseTo(0.75, 6);
        });

        it('should compute correct AF when leaseUpMonths = monthsInService', () => {
          // 6 months in service, 6-month lease-up
          // Monthly AFs: 1/6, 2/6, 3/6, 4/6, 5/6, 6/6 = sum/6
          const result = computeEffectiveYear1AF('new_construction', 1.0, 6, { leaseUpMonths: 6 });
          const expected = (1/6 + 2/6 + 3/6 + 4/6 + 5/6 + 6/6) / 6;
          expect(result).toBeCloseTo(expected, 6);
        });

        it('should compute correct AF when leaseUpMonths > monthsInService (Scenario 33)', () => {
          // December PIS (1 month), 4-month lease-up
          // Monthly AFs: 1/4 × 1.0 = 0.25
          const result = computeEffectiveYear1AF('new_construction', 1.0, 1, { leaseUpMonths: 4 });
          expect(result).toBeCloseTo(0.25, 6);
        });

        it('should scale by stabilizedAF', () => {
          const result = computeEffectiveYear1AF('new_construction', 0.8, 6, { leaseUpMonths: 4 });
          // Monthly AFs: 0.8×0.25, 0.8×0.50, 0.8×0.75, 0.8×1.0, 0.8×1.0, 0.8×1.0
          // = 0.2 + 0.4 + 0.6 + 0.8 + 0.8 + 0.8 = 3.6 / 6 = 0.6
          expect(result).toBeCloseTo(0.6, 6);
        });
      });

      describe('new_construction with caller-supplied array', () => {
        it('should average provided fractions (Scenario 34)', () => {
          const result = computeEffectiveYear1AF(
            'new_construction', 1.0, 6,
            { monthlyOccupancyFractions: [0.1, 0.3, 0.6, 0.9, 1.0, 1.0] }
          );
          expect(result).toBeCloseTo(0.65, 6);
        });

        it('should truncate array when longer than monthsInService', () => {
          const result = computeEffectiveYear1AF(
            'new_construction', 1.0, 3,
            { monthlyOccupancyFractions: [0.2, 0.5, 0.8, 1.0, 1.0, 1.0] }
          );
          // Only first 3 values: (0.2 + 0.5 + 0.8) / 3 = 0.5
          expect(result).toBeCloseTo(0.5, 6);
        });

        it('should handle array shorter than monthsInService', () => {
          const result = computeEffectiveYear1AF(
            'new_construction', 1.0, 6,
            { monthlyOccupancyFractions: [0.3, 0.6] }
          );
          // slice gives [0.3, 0.6], sum = 0.9, divided by 6 months = 0.15
          expect(result).toBeCloseTo(0.9 / 6, 6);
        });
      });

      describe('default parameter behavior', () => {
        it('should default to acquisition when no dealType provided', () => {
          expect(computeEffectiveYear1AF(undefined, 0.95, 6)).toBe(0.95);
        });

        it('should default to 6-month linear ramp when no rampInput provided', () => {
          const result = computeEffectiveYear1AF('new_construction', 1.0, 6);
          const expected = (1/6 + 2/6 + 3/6 + 4/6 + 5/6 + 6/6) / 6;
          expect(result).toBeCloseTo(expected, 6);
        });
      });
    });

    // --------------------------------------------------------------------------
    // calculateLIHTCSchedule() with dealType: 'acquisition'
    // --------------------------------------------------------------------------

    describe('calculateLIHTCSchedule with acquisition deal type', () => {
      it('Scenario 31: effectiveYear1AF equals stabilized, ramp bypassed', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 7,
          creditRate: 0.04,
          dealType: 'acquisition',
          leaseUpRampInput: { leaseUpMonths: 4 }, // must be silently ignored
        });

        expect(schedule.metadata.effectiveYear1ApplicableFraction).toBe(1.0);
        expect(schedule.metadata.dealType).toBe('acquisition');
        expect(schedule.section42f3PenaltyRisk).toBe(false);

        // Year 1 = annualCredit × 0.5 (same as pre-IMPL-118)
        expect(schedule.year1Credit).toBeCloseTo(schedule.annualCredit * 0.5, 6);
      });

      it('Scenario 35: backward compatibility — no dealType defaults to acquisition', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 0.95,
          ddaQctBoost: false,
          pisMonth: 7,
          creditRate: 0.04,
        });

        expect(schedule.metadata.effectiveYear1ApplicableFraction).toBe(0.95);
        expect(schedule.metadata.dealType).toBe('acquisition');
        expect(schedule.section42f3PenaltyRisk).toBe(false);
      });

      it('should preserve existing Fund 1 behavior unchanged', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 0.75,
          ddaQctBoost: true,
          pisMonth: 7,
          creditRate: 0.04,
        });

        // Qualified basis: 50 × 1.3 × 0.75 = 48.75
        expect(schedule.metadata.qualifiedBasis).toBe(48.75);
        // Annual credit: 48.75 × 0.04 = 1.95
        expect(schedule.annualCredit).toBe(1.95);
        // Year 1: 50% of annual
        expect(schedule.year1Credit).toBeCloseTo(0.975, 6);
        // Year 11: 50% catch-up
        expect(schedule.year11Credit).toBeCloseTo(0.975, 6);
        // Total: 10 × 1.95 = 19.5
        expect(schedule.totalCredits).toBe(19.5);
      });
    });

    // --------------------------------------------------------------------------
    // calculateLIHTCSchedule() with dealType: 'new_construction' + linear ramp
    // --------------------------------------------------------------------------

    describe('calculateLIHTCSchedule with new_construction + linear ramp', () => {
      it('Scenario 32: July PIS, 4-month lease-up, effectiveYear1AF = 0.75', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 7,
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { leaseUpMonths: 4 },
        });

        expect(schedule.metadata.effectiveYear1ApplicableFraction).toBeCloseTo(0.75, 6);
        expect(schedule.section42f3PenaltyRisk).toBe(false);

        // annualCredit uses stabilized AF: 50 × 1.0 × 1.0 × 0.04 = 2.0
        expect(schedule.annualCredit).toBe(2.0);

        // Year 1 credit: annualCredit × prorationFactor × (effectiveAF / stabilizedAF)
        // = 2.0 × 0.5 × (0.75 / 1.0) = 0.75
        const expectedYear1 = 2.0 * 0.5 * 0.75;
        expect(schedule.year1Credit).toBeCloseTo(expectedYear1, 6);

        // Years 2-10 use stabilized AF
        expect(schedule.years2to10Credit).toBe(2.0);
      });

      it('Scenario 33: December PIS, 4-month lease-up, §42(f)(3) penalty risk', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 12,
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { leaseUpMonths: 4 },
        });

        expect(schedule.metadata.effectiveYear1ApplicableFraction).toBeCloseTo(0.25, 6);
        expect(schedule.section42f3PenaltyRisk).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // calculateLIHTCSchedule() with new_construction + caller-supplied array
    // --------------------------------------------------------------------------

    describe('calculateLIHTCSchedule with new_construction + caller-supplied array', () => {
      it('Scenario 34: effectiveYear1AF = 0.65 from array', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 7,
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { monthlyOccupancyFractions: [0.1, 0.3, 0.6, 0.9, 1.0, 1.0] },
        });

        expect(schedule.metadata.effectiveYear1ApplicableFraction).toBeCloseTo(0.65, 6);
        expect(schedule.section42f3PenaltyRisk).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // section42f3PenaltyRisk flag
    // --------------------------------------------------------------------------

    describe('section42f3PenaltyRisk', () => {
      it('should be false for acquisition regardless of ramp input', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 12,
          creditRate: 0.04,
          dealType: 'acquisition',
          leaseUpRampInput: { leaseUpMonths: 24 },
        });
        expect(schedule.section42f3PenaltyRisk).toBe(false);
      });

      it('should be false when leaseUpMonths ≤ monthsInService', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 7, // 6 months in service
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { leaseUpMonths: 4 },
        });
        expect(schedule.section42f3PenaltyRisk).toBe(false);
      });

      it('should be true when leaseUpMonths > monthsInService', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 12, // 1 month in service
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { leaseUpMonths: 4 },
        });
        expect(schedule.section42f3PenaltyRisk).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // Total credits invariant
    // --------------------------------------------------------------------------

    describe('total credits invariant', () => {
      it('should hold for acquisition path', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 0.75,
          ddaQctBoost: true,
          pisMonth: 7,
          creditRate: 0.04,
          dealType: 'acquisition',
        });

        const total = schedule.year1Credit + (schedule.years2to10Credit * 9) + schedule.year11Credit;
        expect(total).toBeCloseTo(schedule.annualCredit * 10, 3);
      });

      it('should hold for new_construction path with linear ramp', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 7,
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { leaseUpMonths: 4 },
        });

        const total = schedule.year1Credit + (schedule.years2to10Credit * 9) + schedule.year11Credit;
        expect(total).toBeCloseTo(schedule.annualCredit * 10, 3);

        // annualCredit must be from stabilized AF, not effective
        const expectedAnnual = 50 * 1.0 * 1.0 * 0.04;
        expect(schedule.annualCredit).toBe(expectedAnnual);
      });

      it('should hold for new_construction path with caller-supplied array', () => {
        const schedule = calculateLIHTCSchedule({
          eligibleBasis: 50,
          stabilizedApplicableFraction: 1.0,
          ddaQctBoost: false,
          pisMonth: 7,
          creditRate: 0.04,
          dealType: 'new_construction',
          leaseUpRampInput: { monthlyOccupancyFractions: [0.1, 0.3, 0.6, 0.9, 1.0, 1.0] },
        });

        const total = schedule.year1Credit + (schedule.years2to10Credit * 9) + schedule.year11Credit;
        expect(total).toBeCloseTo(schedule.annualCredit * 10, 3);
      });
    });

    // --------------------------------------------------------------------------
    // validateLIHTCParams() — new field validations
    // --------------------------------------------------------------------------

    describe('validateLIHTCParams with new fields', () => {
      const baseParams: LIHTCCalculationParams = {
        eligibleBasis: 50,
        stabilizedApplicableFraction: 0.75,
        ddaQctBoost: false,
        pisMonth: 7,
        creditRate: 0.04,
      };

      it('should throw for leaseUpMonths: 0', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { leaseUpMonths: 0 },
        })).toThrow('leaseUpMonths must be between 1 and 24');
      });

      it('should throw for leaseUpMonths: 25', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { leaseUpMonths: 25 },
        })).toThrow('leaseUpMonths must be between 1 and 24');
      });

      it('should accept leaseUpMonths: 1', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { leaseUpMonths: 1 },
        })).not.toThrow();
      });

      it('should accept leaseUpMonths: 24', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { leaseUpMonths: 24 },
        })).not.toThrow();
      });

      it('should throw for empty monthlyOccupancyFractions', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { monthlyOccupancyFractions: [] },
        })).toThrow('monthlyOccupancyFractions must be a non-empty array');
      });

      it('should throw for monthlyOccupancyFractions values outside 0-1', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { monthlyOccupancyFractions: [0.5, 1.2] },
        })).toThrow('monthlyOccupancyFractions values must be between 0 and 1');

        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          leaseUpRampInput: { monthlyOccupancyFractions: [-0.1, 0.5] },
        })).toThrow('monthlyOccupancyFractions values must be between 0 and 1');
      });

      it('should silently accept leaseUpRampInput on acquisition deal', () => {
        expect(() => calculateLIHTCSchedule({
          ...baseParams,
          dealType: 'acquisition',
          leaseUpRampInput: { leaseUpMonths: 12 },
        })).not.toThrow();
      });
    });
  });
});
