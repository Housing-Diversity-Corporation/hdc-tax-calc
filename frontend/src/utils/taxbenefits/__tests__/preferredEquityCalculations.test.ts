/**
 * IMPL-7.0-006: Preferred Equity Calculations - Test Suite
 *
 * Comprehensive tests for preferred equity calculation module
 */

import {
  calculatePreferredEquity,
  calculatePreferredEquityPrincipal,
  calculateTargetAmount,
  calculateYearlyAccrual,
  generateAccrualSchedule,
  calculateExitPayment,
  calculateAchievedMOIC,
  calculateIRR,
  validatePreferredEquityParams,
  isPreferredEquityEnabled,
  formatPreferredEquityResult,
  PreferredEquityParams,
  PreferredEquityResult,
  PreferredEquityValidationError,
} from '../preferredEquityCalculations';

describe('preferredEquityCalculations', () => {
  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  describe('Utility Functions', () => {
    describe('calculatePreferredEquityPrincipal', () => {
      it('should calculate 23% of $100M = $23M', () => {
        const principal = calculatePreferredEquityPrincipal(100000000, 23);
        expect(principal).toBe(23000000);
      });

      it('should calculate 0% as $0', () => {
        const principal = calculatePreferredEquityPrincipal(100000000, 0);
        expect(principal).toBe(0);
      });

      it('should calculate 40% (max) correctly', () => {
        const principal = calculatePreferredEquityPrincipal(100000000, 40);
        expect(principal).toBe(40000000);
      });
    });

    describe('calculateTargetAmount', () => {
      it('should calculate $23M × 1.7x = $39.1M', () => {
        const target = calculateTargetAmount(23000000, 1.7);
        expect(target).toBe(39100000);
      });

      it('should calculate 1.0x MOIC (return of capital)', () => {
        const target = calculateTargetAmount(23000000, 1.0);
        expect(target).toBe(23000000);
      });

      it('should calculate 3.0x MOIC (max)', () => {
        const target = calculateTargetAmount(23000000, 3.0);
        expect(target).toBe(69000000);
      });
    });

    describe('calculateYearlyAccrual', () => {
      it('should calculate 12% of $23M = $2.76M', () => {
        const accrual = calculateYearlyAccrual(23000000, 12);
        expect(accrual).toBe(2760000);
      });

      it('should calculate 6% (min rate)', () => {
        const accrual = calculateYearlyAccrual(23000000, 6);
        expect(accrual).toBe(1380000);
      });

      it('should calculate 20% (max rate)', () => {
        const accrual = calculateYearlyAccrual(23000000, 20);
        expect(accrual).toBe(4600000);
      });
    });

    describe('calculateAchievedMOIC', () => {
      it('should calculate 1.7x MOIC when target achieved', () => {
        const moic = calculateAchievedMOIC(39100000, 23000000);
        expect(moic).toBeCloseTo(1.7, 2);
      });

      it('should calculate 1.0x MOIC for return of capital only', () => {
        const moic = calculateAchievedMOIC(23000000, 23000000);
        expect(moic).toBe(1.0);
      });

      it('should calculate <1.0x MOIC for loss', () => {
        const moic = calculateAchievedMOIC(15000000, 23000000);
        expect(moic).toBeCloseTo(0.652, 3);
      });

      it('should return 0 for zero principal', () => {
        const moic = calculateAchievedMOIC(1000000, 0);
        expect(moic).toBe(0);
      });
    });

    describe('calculateIRR', () => {
      it('should calculate 12% IRR for 1.7x over 10 years (approximate)', () => {
        // (39.1M / 23M)^(1/10) - 1 = 5.45% (not 12% - that's the accrual rate)
        const irr = calculateIRR(23000000, 39100000, 10);
        expect(irr).toBeCloseTo(5.45, 1);
      });

      it('should calculate 0% IRR for 1.0x MOIC', () => {
        const irr = calculateIRR(23000000, 23000000, 10);
        expect(irr).toBeCloseTo(0, 2);
      });

      it('should calculate negative IRR for loss', () => {
        const irr = calculateIRR(23000000, 15000000, 10);
        expect(irr).toBeLessThan(0);
      });

      it('should handle single year correctly', () => {
        // 1.7x in 1 year = 70% IRR
        const irr = calculateIRR(23000000, 39100000, 1);
        expect(irr).toBeCloseTo(70, 0);
      });
    });

    describe('isPreferredEquityEnabled', () => {
      it('should return true when enabled and pct > 0', () => {
        const params: PreferredEquityParams = {
          prefEquityEnabled: true,
          prefEquityPct: 23,
          prefEquityTargetMOIC: 1.7,
          prefEquityTargetIRR: 12,
          prefEquityAccrualRate: 12,
          holdPeriod: 10,
          totalCapitalization: 100000000,
        };
        expect(isPreferredEquityEnabled(params)).toBe(true);
      });

      it('should return false when disabled', () => {
        const params: PreferredEquityParams = {
          prefEquityEnabled: false,
          prefEquityPct: 23,
          prefEquityTargetMOIC: 1.7,
          prefEquityTargetIRR: 12,
          prefEquityAccrualRate: 12,
          holdPeriod: 10,
          totalCapitalization: 100000000,
        };
        expect(isPreferredEquityEnabled(params)).toBe(false);
      });

      it('should return false when pct = 0', () => {
        const params: PreferredEquityParams = {
          prefEquityEnabled: true,
          prefEquityPct: 0,
          prefEquityTargetMOIC: 1.7,
          prefEquityTargetIRR: 12,
          prefEquityAccrualRate: 12,
          holdPeriod: 10,
          totalCapitalization: 100000000,
        };
        expect(isPreferredEquityEnabled(params)).toBe(false);
      });
    });
  });

  // =========================================================================
  // ACCRUAL SCHEDULE
  // =========================================================================

  describe('Accrual Schedule Generation', () => {
    it('should generate 10-year schedule for $23M @ 12%', () => {
      const schedule = generateAccrualSchedule(23000000, 12, 10);

      expect(schedule).toHaveLength(10);
      expect(schedule[0].year).toBe(1);
      expect(schedule[0].beginningBalance).toBe(23000000);
      expect(schedule[0].accrual).toBe(2760000); // 12% of $23M
      expect(schedule[0].endingBalance).toBe(25760000);
    });

    it('should compound correctly year-over-year', () => {
      const schedule = generateAccrualSchedule(23000000, 12, 3);

      // Year 1: $23M × 1.12 = $25.76M
      expect(schedule[0].endingBalance).toBeCloseTo(25760000, 0);

      // Year 2: $25.76M × 1.12 = $28.8512M
      expect(schedule[1].endingBalance).toBeCloseTo(28851200, 0);

      // Year 3: $28.8512M × 1.12 = $32.313344M
      expect(schedule[2].endingBalance).toBeCloseTo(32313344, 0);
    });

    it('should generate correct final balance after 10 years', () => {
      const schedule = generateAccrualSchedule(23000000, 12, 10);

      // $23M × (1.12)^10 = $71,434,509
      const finalBalance = schedule[9].endingBalance;
      expect(finalBalance).toBeCloseTo(71434509, 0);
    });

    it('should handle single year', () => {
      const schedule = generateAccrualSchedule(23000000, 12, 1);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].endingBalance).toBe(25760000);
    });

    it('should handle different accrual rates', () => {
      const schedule6 = generateAccrualSchedule(23000000, 6, 10);
      const schedule20 = generateAccrualSchedule(23000000, 20, 10);

      // 6%: $23M × (1.06)^10 = $41,189,497
      expect(schedule6[9].endingBalance).toBeCloseTo(41189497, 0);

      // 20%: $23M × (1.20)^10 = $142,409,938
      expect(schedule20[9].endingBalance).toBeCloseTo(142409938, 0);
    });
  });

  // =========================================================================
  // EXIT PAYMENT CALCULATION (KEY FORMULA)
  // =========================================================================

  describe('Exit Payment Calculation', () => {
    it('should cap payment at target MOIC when proceeds sufficient', () => {
      // $23M × 1.7x = $39.1M target
      // Available proceeds: $50M
      // Payment should be $39.1M (target), NOT the accrued $71.5M
      const payment = calculateExitPayment(23000000, 1.7, 50000000);
      expect(payment).toBe(39100000);
    });

    it('should return available proceeds when less than target', () => {
      // $23M × 1.7x = $39.1M target
      // Available proceeds: $30M
      // Payment should be $30M (all available)
      const payment = calculateExitPayment(23000000, 1.7, 30000000);
      expect(payment).toBe(30000000);
    });

    it('should return exactly target when proceeds = target', () => {
      // Perfect scenario
      const payment = calculateExitPayment(23000000, 1.7, 39100000);
      expect(payment).toBe(39100000);
    });

    it('should return 0 when no proceeds available', () => {
      const payment = calculateExitPayment(23000000, 1.7, 0);
      expect(payment).toBe(0);
    });

    it('should handle negative proceeds as 0', () => {
      const payment = calculateExitPayment(23000000, 1.7, -1000000);
      expect(payment).toBe(0);
    });

    it('should work with 1.0x MOIC (return of capital)', () => {
      const payment = calculateExitPayment(23000000, 1.0, 50000000);
      expect(payment).toBe(23000000); // Just the principal back
    });

    it('should work with 3.0x MOIC (max)', () => {
      const payment = calculateExitPayment(23000000, 3.0, 100000000);
      expect(payment).toBe(69000000); // $23M × 3.0x
    });
  });

  // =========================================================================
  // VALIDATION
  // =========================================================================

  describe('Parameter Validation', () => {
    const validParams: PreferredEquityParams = {
      prefEquityEnabled: true,
      prefEquityPct: 23,
      prefEquityTargetMOIC: 1.7,
      prefEquityTargetIRR: 12,
      prefEquityAccrualRate: 12,
      holdPeriod: 10,
      totalCapitalization: 100000000,
    };

    it('should pass validation for valid parameters', () => {
      expect(() => validatePreferredEquityParams(validParams)).not.toThrow();
    });

    it('should reject prefEquityPct > 40%', () => {
      const params = { ...validParams, prefEquityPct: 50 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject negative prefEquityPct', () => {
      const params = { ...validParams, prefEquityPct: -5 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject targetMOIC < 1.0x', () => {
      const params = { ...validParams, prefEquityTargetMOIC: 0.8 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject targetMOIC > 3.0x', () => {
      const params = { ...validParams, prefEquityTargetMOIC: 3.5 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject targetIRR < 6%', () => {
      const params = { ...validParams, prefEquityTargetIRR: 5 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject targetIRR > 20%', () => {
      const params = { ...validParams, prefEquityTargetIRR: 25 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject accrualRate < 6%', () => {
      const params = { ...validParams, prefEquityAccrualRate: 4 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject accrualRate > 20%', () => {
      const params = { ...validParams, prefEquityAccrualRate: 25 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject holdPeriod = 0', () => {
      const params = { ...validParams, holdPeriod: 0 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject holdPeriod > 15', () => {
      const params = { ...validParams, holdPeriod: 20 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });

    it('should reject zero totalCapitalization', () => {
      const params = { ...validParams, totalCapitalization: 0 };
      expect(() => validatePreferredEquityParams(params)).toThrow(
        PreferredEquityValidationError
      );
    });
  });

  // =========================================================================
  // FULL CALCULATION - ACCEPTANCE CRITERIA
  // =========================================================================

  describe('Full Calculation - Acceptance Criteria', () => {
    it('should calculate $23M @ 1.7x MOIC = $39.1M at exit (ACCEPTANCE TEST)', () => {
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 23,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      const result = calculatePreferredEquity(params, 50000000);

      // Acceptance criteria verification
      expect(result.principal).toBe(23000000); // $23M
      expect(result.targetAmount).toBe(39100000); // $39.1M
      expect(result.paymentAtExit).toBe(39100000); // $39.1M (target achieved)
      expect(result.achievedMOIC).toBeCloseTo(1.7, 2); // 1.7x
      expect(result.targetAchieved).toBe(true);
      expect(result.moicShortfall).toBe(0);
      expect(result.dollarShortfall).toBe(0);
    });

    it('should generate correct accrual schedule for priority tracking', () => {
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 23,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      const result = calculatePreferredEquity(params, 50000000);

      expect(result.schedule).toHaveLength(10);
      expect(result.accruedBalance).toBeCloseTo(71434509, 0); // $71.4M accrued

      // But payment is capped at target MOIC
      expect(result.paymentAtExit).toBe(39100000); // $39.1M, not $71.4M
    });
  });

  // =========================================================================
  // MOIC ACHIEVEMENT SCENARIOS
  // =========================================================================

  describe('MOIC Achievement Scenarios', () => {
    const baseParams: PreferredEquityParams = {
      prefEquityEnabled: true,
      prefEquityPct: 23,
      prefEquityTargetMOIC: 1.7,
      prefEquityTargetIRR: 12,
      prefEquityAccrualRate: 12,
      holdPeriod: 10,
      totalCapitalization: 100000000,
    };

    it('should achieve full target when proceeds sufficient', () => {
      const result = calculatePreferredEquity(baseParams, 50000000);

      expect(result.targetAchieved).toBe(true);
      expect(result.achievedMOIC).toBeCloseTo(1.7, 2);
      expect(result.moicShortfall).toBe(0);
      expect(result.dollarShortfall).toBe(0);
    });

    it('should show partial achievement when proceeds insufficient', () => {
      // Only $30M available (target is $39.1M)
      const result = calculatePreferredEquity(baseParams, 30000000);

      expect(result.targetAchieved).toBe(false);
      expect(result.paymentAtExit).toBe(30000000);
      expect(result.achievedMOIC).toBeCloseTo(1.304, 3); // $30M / $23M
      expect(result.moicShortfall).toBeCloseTo(0.396, 3); // 1.7 - 1.304
      expect(result.dollarShortfall).toBe(9100000); // $39.1M - $30M
    });

    it('should handle zero proceeds (total loss scenario)', () => {
      const result = calculatePreferredEquity(baseParams, 0);

      expect(result.paymentAtExit).toBe(0);
      expect(result.achievedMOIC).toBe(0);
      expect(result.moicShortfall).toBe(1.7);
      expect(result.dollarShortfall).toBe(39100000);
      expect(result.achievedIRR).toBe(-100);
    });

    it('should handle exact target proceeds', () => {
      const result = calculatePreferredEquity(baseParams, 39100000);

      expect(result.paymentAtExit).toBe(39100000);
      expect(result.targetAchieved).toBe(true);
      expect(result.achievedMOIC).toBeCloseTo(1.7, 2);
    });

    it('should not exceed target even with excess proceeds', () => {
      // $100M available, but target is only $39.1M
      const result = calculatePreferredEquity(baseParams, 100000000);

      expect(result.paymentAtExit).toBe(39100000); // Capped at target
      expect(result.achievedMOIC).toBeCloseTo(1.7, 2); // Still 1.7x, not more
    });
  });

  // =========================================================================
  // DIFFERENT MOIC TARGETS
  // =========================================================================

  describe('Different MOIC Targets', () => {
    const baseParams: PreferredEquityParams = {
      prefEquityEnabled: true,
      prefEquityPct: 23,
      prefEquityTargetMOIC: 1.7,
      prefEquityTargetIRR: 12,
      prefEquityAccrualRate: 12,
      holdPeriod: 10,
      totalCapitalization: 100000000,
    };

    it('should handle 1.0x MOIC (return of capital)', () => {
      const params = { ...baseParams, prefEquityTargetMOIC: 1.0 };
      const result = calculatePreferredEquity(params, 50000000);

      expect(result.targetAmount).toBe(23000000); // Just principal
      expect(result.paymentAtExit).toBe(23000000);
      expect(result.achievedMOIC).toBe(1.0);
    });

    it('should handle 2.0x MOIC', () => {
      const params = { ...baseParams, prefEquityTargetMOIC: 2.0 };
      const result = calculatePreferredEquity(params, 50000000);

      expect(result.targetAmount).toBe(46000000); // $23M × 2.0
      expect(result.paymentAtExit).toBe(46000000);
      expect(result.achievedMOIC).toBe(2.0);
    });

    it('should handle 3.0x MOIC (max)', () => {
      const params = { ...baseParams, prefEquityTargetMOIC: 3.0 };
      const result = calculatePreferredEquity(params, 100000000);

      expect(result.targetAmount).toBe(69000000); // $23M × 3.0
      expect(result.paymentAtExit).toBe(69000000);
      expect(result.achievedMOIC).toBe(3.0);
    });
  });

  // =========================================================================
  // DIFFERENT ACCRUAL RATES
  // =========================================================================

  describe('Different Accrual Rates', () => {
    const baseParams: PreferredEquityParams = {
      prefEquityEnabled: true,
      prefEquityPct: 23,
      prefEquityTargetMOIC: 1.7,
      prefEquityTargetIRR: 12,
      prefEquityAccrualRate: 12,
      holdPeriod: 10,
      totalCapitalization: 100000000,
    };

    it('should handle 6% accrual rate (min)', () => {
      const params = { ...baseParams, prefEquityAccrualRate: 6 };
      const result = calculatePreferredEquity(params, 50000000);

      // $23M × (1.06)^10 = $41,189,497 accrued
      expect(result.accruedBalance).toBeCloseTo(41189497, 0);

      // But payment still capped at target MOIC ($39.1M)
      expect(result.paymentAtExit).toBe(39100000);
    });

    it('should handle 20% accrual rate (max)', () => {
      const params = { ...baseParams, prefEquityAccrualRate: 20 };
      const result = calculatePreferredEquity(params, 50000000);

      // $23M × (1.20)^10 = $142,409,938 accrued
      expect(result.accruedBalance).toBeCloseTo(142409938, 0);

      // But payment still capped at target MOIC ($39.1M)
      expect(result.paymentAtExit).toBe(39100000);
    });
  });

  // =========================================================================
  // DIFFERENT HOLD PERIODS
  // =========================================================================

  describe('Different Hold Periods', () => {
    const baseParams: PreferredEquityParams = {
      prefEquityEnabled: true,
      prefEquityPct: 23,
      prefEquityTargetMOIC: 1.7,
      prefEquityTargetIRR: 12,
      prefEquityAccrualRate: 12,
      holdPeriod: 10,
      totalCapitalization: 100000000,
    };

    it('should handle 7-year hold period', () => {
      const params = { ...baseParams, holdPeriod: 7 };
      const result = calculatePreferredEquity(params, 50000000);

      expect(result.schedule).toHaveLength(7);
      // $23M × (1.12)^7 = $50,845,672
      expect(result.accruedBalance).toBeCloseTo(50845672, 0);

      // Payment capped at target
      expect(result.paymentAtExit).toBe(39100000);

      // IRR higher for shorter period
      expect(result.achievedIRR).toBeGreaterThan(5);
    });

    it('should handle 15-year hold period', () => {
      const params = { ...baseParams, holdPeriod: 15 };
      const result = calculatePreferredEquity(params, 100000000);

      expect(result.schedule).toHaveLength(15);
      // $23M × (1.12)^15 = $125,892,012
      expect(result.accruedBalance).toBeCloseTo(125892012, 0);

      // Payment still capped at target
      expect(result.paymentAtExit).toBe(39100000);

      // IRR lower for longer period
      expect(result.achievedIRR).toBeCloseTo(3.60, 1);
    });
  });

  // =========================================================================
  // DIFFERENT PRINCIPAL AMOUNTS
  // =========================================================================

  describe('Different Principal Amounts', () => {
    it('should handle 10% preferred equity', () => {
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 10,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      const result = calculatePreferredEquity(params, 50000000);

      expect(result.principal).toBe(10000000); // $10M
      expect(result.targetAmount).toBe(17000000); // $10M × 1.7
      expect(result.paymentAtExit).toBe(17000000);
    });

    it('should handle 40% preferred equity (max)', () => {
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 40,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      const result = calculatePreferredEquity(params, 100000000);

      expect(result.principal).toBe(40000000); // $40M
      expect(result.targetAmount).toBe(68000000); // $40M × 1.7
      expect(result.paymentAtExit).toBe(68000000);
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe('Edge Cases', () => {
    const baseParams: PreferredEquityParams = {
      prefEquityEnabled: true,
      prefEquityPct: 23,
      prefEquityTargetMOIC: 1.7,
      prefEquityTargetIRR: 12,
      prefEquityAccrualRate: 12,
      holdPeriod: 10,
      totalCapitalization: 100000000,
    };

    it('should handle very small principal ($1)', () => {
      const params = { ...baseParams, totalCapitalization: 4.35 };
      const result = calculatePreferredEquity(params, 10);

      expect(result.principal).toBeCloseTo(1, 2);
      expect(result.targetAmount).toBeCloseTo(1.7, 2);
    });

    it('should handle very large capitalization ($1B)', () => {
      const params = { ...baseParams, totalCapitalization: 1000000000 };
      const result = calculatePreferredEquity(params, 500000000);

      expect(result.principal).toBe(230000000); // $230M
      expect(result.targetAmount).toBe(391000000); // $391M
      expect(result.paymentAtExit).toBe(391000000);
    });

    it('should handle single year hold period', () => {
      const params = { ...baseParams, holdPeriod: 1 };
      const result = calculatePreferredEquity(params, 50000000);

      expect(result.schedule).toHaveLength(1);
      expect(result.achievedIRR).toBeCloseTo(70, 0); // 70% IRR for 1.7x in 1 year
    });
  });

  // =========================================================================
  // FORMATTING
  // =========================================================================

  describe('Formatting', () => {
    it('should format result correctly', () => {
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 23,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      const result = calculatePreferredEquity(params, 50000000);
      const formatted = formatPreferredEquityResult(result);

      expect(formatted).toContain('Preferred Equity Analysis');
      expect(formatted).toContain('$23,000,000');
      expect(formatted).toContain('$39,100,000');
      expect(formatted).toContain('1.7x');
      expect(formatted).toContain('Target MOIC achieved');
    });

    it('should show shortfall when target not achieved', () => {
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 23,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      const result = calculatePreferredEquity(params, 30000000);
      const formatted = formatPreferredEquityResult(result);

      expect(formatted).toContain('Shortfall');
      expect(formatted).toContain('$9,100,000');
    });
  });

  // =========================================================================
  // INTEGRATION SCENARIO
  // =========================================================================

  describe('Integration Scenario', () => {
    it('should calculate complete preferred equity for Slate Brief capital structure', () => {
      // Slate Brief: Senior $40M + PAB $25M + Phil $0 + Pref $23M + Common $12M = $100M
      const params: PreferredEquityParams = {
        prefEquityEnabled: true,
        prefEquityPct: 23,
        prefEquityTargetMOIC: 1.7,
        prefEquityTargetIRR: 12,
        prefEquityAccrualRate: 12,
        holdPeriod: 10,
        totalCapitalization: 100000000,
      };

      // Assume exit value $150M, senior/PAB paid off ($65M), available $85M
      const availableProceeds = 85000000;

      const result = calculatePreferredEquity(params, availableProceeds);

      // Preferred gets $39.1M (target achieved)
      expect(result.principal).toBe(23000000);
      expect(result.targetAmount).toBe(39100000);
      expect(result.paymentAtExit).toBe(39100000);
      expect(result.targetAchieved).toBe(true);

      // Remaining for sub-debt and common equity: $85M - $39.1M = $45.9M
      const remainingForCommon = availableProceeds - result.paymentAtExit;
      expect(remainingForCommon).toBe(45900000);
    });
  });
});
