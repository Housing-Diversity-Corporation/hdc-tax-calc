/**
 * Comprehensive test suite for State LIHTC Calculations
 *
 * Tests all aspects of state LIHTC mechanics:
 * - 4 program types: piggyback, supplement, standalone, grant
 * - 25 state programs
 * - Syndication rates by transferability type
 * - In-state vs out-of-state investor handling
 * - 11-year schedule generation
 * - Warning system (PW, caps, sunsets, liability)
 * - Edge cases and validation
 *
 * @version 7.0.0
 * @date 2025-12-16
 * @task IMPL-7.0-003
 */

import {
  calculateStateLIHTC,
  calculatePiggybackCredit,
  calculateSupplementCredit,
  calculateStandaloneCredit,
  calculateGrantCredit,
  determineSyndicationRate,
  generateStateLIHTCSchedule,
  determineStateLiability,
  generateWarnings,
  formatStateLIHTCResult,
  StateLIHTCValidationError,
  type StateLIHTCCalculationParams,
  type StateLIHTCCalculationResult,
} from '../stateLIHTCCalculations';

import { getStateLIHTCProgram } from '../stateProfiles';

describe('State LIHTC Calculations', () => {
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('Utility Functions', () => {
    describe('calculatePiggybackCredit', () => {
      it('should calculate 100% piggyback credit', () => {
        const program = getStateLIHTCProgram('GA')!;
        const credit = calculatePiggybackCredit(1950000, program);
        expect(credit).toBe(1950000); // 100% of federal
      });

      it('should calculate 20% piggyback credit', () => {
        const program = getStateLIHTCProgram('AR')!;
        const credit = calculatePiggybackCredit(1950000, program);
        expect(credit).toBe(390000); // 20% of federal
      });
    });

    describe('calculateSupplementCredit', () => {
      it('should calculate supplement at 70%', () => {
        const credit = calculateSupplementCredit(1950000, 70);
        expect(credit).toBe(1365000);
      });

      it('should calculate supplement at 25%', () => {
        const credit = calculateSupplementCredit(1950000, 25);
        expect(credit).toBe(487500);
      });
    });

    describe('calculateStandaloneCredit', () => {
      it('should amortize standalone credit over 10 years', () => {
        const credit = calculateStandaloneCredit(10000000);
        expect(credit).toBe(1000000); // $10M / 10 years
      });
    });

    describe('calculateGrantCredit', () => {
      it('should amortize grant over 10 years', () => {
        const credit = calculateGrantCredit(20000000);
        expect(credit).toBe(2000000); // $20M / 10 years
      });
    });

    describe('determineSyndicationRate', () => {
      it('should return 90% for certificated', () => {
        const program = getStateLIHTCProgram('CA')!;
        const rate = determineSyndicationRate(program, 'NY', 'CA', false);
        expect(rate).toBe(0.9);
      });

      it('should return 90% for transferable', () => {
        const program = getStateLIHTCProgram('NE')!;
        const rate = determineSyndicationRate(program, 'CA', 'NE', false);
        expect(rate).toBe(0.9);
      });

      it('should return 85% for bifurcated', () => {
        const program = getStateLIHTCProgram('GA')!;
        const rate = determineSyndicationRate(program, 'NY', 'GA', false);
        expect(rate).toBe(0.85);
      });

      // IMPL-047: Toggle controls credit path for ALL program types
      it('should return 100% when investorHasStateLiability is true (any program)', () => {
        const program = getStateLIHTCProgram('SC')!;
        const rate = determineSyndicationRate(program, 'SC', 'SC', true);
        expect(rate).toBe(1.0);
      });

      it('should return 100% for out-of-state with liability (IMPL-047)', () => {
        const program = getStateLIHTCProgram('SC')!;
        const rate = determineSyndicationRate(program, 'NY', 'SC', true);
        expect(rate).toBe(1.0);  // IMPL-047: Toggle ON = 100% regardless of state
      });

      it('should return program rate for allocated without liability (IMPL-047)', () => {
        const program = getStateLIHTCProgram('SC')!;
        const rate = determineSyndicationRate(program, 'NY', 'SC', false);
        expect(rate).toBe(0.8);  // IMPL-047: Toggle OFF = program syndication rate
      });

      it('should return 100% for grant', () => {
        const program = getStateLIHTCProgram('NJ')!;
        const rate = determineSyndicationRate(program, 'NY', 'NJ', false);
        expect(rate).toBe(1.0);
      });

      it('should use override rate when provided', () => {
        const program = getStateLIHTCProgram('GA')!;
        const rate = determineSyndicationRate(program, 'NY', 'GA', false, 95);
        expect(rate).toBe(0.95);
      });
    });

    describe('determineStateLiability', () => {
      it('should return true for in-state investor', () => {
        const liability = determineStateLiability('GA', 'GA');
        expect(liability).toBe(true);
      });

      it('should return false for out-of-state investor', () => {
        const liability = determineStateLiability('NY', 'GA');
        expect(liability).toBe(false);
      });

      it('should use explicit liability when provided', () => {
        const liability = determineStateLiability('NY', 'GA', true);
        expect(liability).toBe(true);
      });
    });

    describe('generateStateLIHTCSchedule', () => {
      it('should generate 11-year schedule', () => {
        const schedule = generateStateLIHTCSchedule(1000000, 7);
        expect(schedule.yearlyBreakdown).toHaveLength(11);
      });

      it('should prorate Year 1 for July PIS', () => {
        const schedule = generateStateLIHTCSchedule(1000000, 7);
        expect(schedule.year1Credit).toBe(500000); // 50%
        expect(schedule.year11Credit).toBe(500000); // 50%
      });

      it('should have full Year 1 for January PIS', () => {
        const schedule = generateStateLIHTCSchedule(1000000, 1);
        expect(schedule.year1Credit).toBe(1000000);
        expect(schedule.year11Credit).toBe(0);
      });

      it('should maintain total = 10 × annual', () => {
        const schedule = generateStateLIHTCSchedule(1000000, 7);
        expect(schedule.totalCredits).toBe(10000000);
      });
    });
  });

  // ============================================================================
  // PIGGYBACK PROGRAMS (5 STATES)
  // ============================================================================

  describe('Piggyback Programs', () => {
    const federalCredit = 1950000;

    describe('GA - 100% Piggyback, Bifurcated', () => {
      it('should calculate GA piggyback for out-of-state investor', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'GA',
          investorState: 'NY',
          pisMonth: 7,
        });

        expect(result.programType).toBe('piggyback');
        expect(result.grossCredit).toBe(19500000); // 100% of federal over 10 years
        expect(result.syndicationRate).toBe(0.85);
        expect(result.netBenefit).toBe(16575000); // 85% of gross
        expect(result.schedule.annualCredit).toBe(1950000);
      });

      it('should calculate GA piggyback for in-state investor (IMPL-047: 100%)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'GA',
          investorState: 'GA',
          pisMonth: 7,
        });

        // IMPL-047: In-state investors have state liability by default → 100% direct use
        expect(result.syndicationRate).toBe(1.0);
        expect(result.netBenefit).toBe(19500000);
      });
    });

    describe('NE - 100% Piggyback, Transferable', () => {
      it('should calculate NE piggyback with 90% syndication', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'NE',
          investorState: 'CA',
          pisMonth: 7,
        });

        expect(result.programType).toBe('piggyback');
        expect(result.grossCredit).toBe(19500000);
        expect(result.syndicationRate).toBe(0.9); // Highest for transferable
        expect(result.netBenefit).toBe(17550000);
      });
    });

    describe('SC - 100% Piggyback, Allocated', () => {
      it('should give 100% to in-state investor', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'SC',
          investorState: 'SC',
          pisMonth: 7,
        });

        expect(result.syndicationRate).toBe(1.0); // In-state with liability
        expect(result.netBenefit).toBe(19500000); // Full credit
      });

      it('should give program rate to out-of-state without liability (IMPL-047)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'SC',
          investorState: 'TX',
          pisMonth: 7,
          investorHasStateLiability: false,
        });

        // IMPL-047: Toggle OFF = syndicate at program rate (80% for SC allocated)
        expect(result.syndicationRate).toBe(0.8);
        expect(result.netBenefit).toBe(15600000); // 80% of 19.5M
      });
    });

    describe('KS - 100% Piggyback with Sunset', () => {
      it('should calculate KS piggyback for in-state investor', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'KS',
          investorState: 'KS', // In-state investor
          pisMonth: 7,
        });

        expect(result.programType).toBe('piggyback');
        expect(result.grossCredit).toBe(19500000);
        expect(result.syndicationRate).toBe(1.0); // In-state gets 100%
      });

      it('should warn about sunset', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'KS',
          investorState: 'KS',
          pisMonth: 7,
        });

        const hasSunsetWarning = result.warnings.some((w) => w.includes('sunset'));
        expect(hasSunsetWarning).toBe(true);
      });
    });

    describe('AR - 20% Piggyback', () => {
      it('should calculate AR 20% piggyback for in-state investor', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'AR',
          investorState: 'AR', // In-state investor
          pisMonth: 7,
        });

        expect(result.programType).toBe('piggyback');
        expect(result.grossCredit).toBe(3900000); // 20% of federal
        expect(result.syndicationRate).toBe(1.0); // In-state gets 100%
        expect(result.netBenefit).toBe(3900000);
      });
    });
  });

  // ============================================================================
  // SUPPLEMENT PROGRAMS (4 STATES)
  // ============================================================================

  describe('Supplement Programs', () => {
    const federalCredit = 1950000;

    describe('MO - Supplement up to 70%', () => {
      it('should calculate MO supplement at 70%', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'MO',
          investorState: 'MO', // In-state investor
          pisMonth: 7,
          userPercentage: 70,
        });

        expect(result.programType).toBe('supplement');
        expect(result.grossCredit).toBe(13650000); // 70% of federal
        expect(result.syndicationRate).toBe(1.0); // In-state gets 100%
        expect(result.netBenefit).toBe(13650000);
      });

      it('should require user percentage', () => {
        expect(() =>
          calculateStateLIHTC({
            federalAnnualCredit: federalCredit,
            propertyState: 'MO',
            investorState: 'IL',
            pisMonth: 7,
          })
        ).toThrow('User percentage required');
      });
    });

    describe('OH - Supplement with Cap', () => {
      it('should calculate OH supplement', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'OH',
          investorState: 'OH', // In-state investor
          pisMonth: 7,
          userPercentage: 40,
        });

        expect(result.programType).toBe('supplement');
        expect(result.grossCredit).toBe(7800000); // 40% of federal
        expect(result.syndicationRate).toBe(1.0); // In-state gets 100%
      });

      it('should warn about cap', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'OH',
          investorState: 'MI',
          pisMonth: 7,
          userPercentage: 40,
          userAmount: 150000000, // Exceeds cap
        });

        const hasCapWarning = result.warnings.some((w) =>
          w.includes('annual cap')
        );
        expect(hasCapWarning).toBe(true);
      });
    });

    describe('DC - 25% Supplement', () => {
      it('should calculate DC supplement', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: federalCredit,
          propertyState: 'DC',
          investorState: 'DC', // In-state investor
          pisMonth: 7,
          userPercentage: 25,
        });

        expect(result.programType).toBe('supplement');
        expect(result.grossCredit).toBe(4875000); // 25% of federal
        expect(result.syndicationRate).toBe(1.0); // In-state gets 100%
        expect(result.netBenefit).toBe(4875000);
      });
    });

    describe('VT - Variable Supplement', () => {
      it('should calculate VT supplement at various percentages', () => {
        [20, 40, 60].forEach((pct) => {
          const result = calculateStateLIHTC({
            federalAnnualCredit: federalCredit,
            propertyState: 'VT',
            investorState: 'NH',
            pisMonth: 7,
            userPercentage: pct,
          });

          expect(result.grossCredit).toBe(federalCredit * 10 * (pct / 100));
        });
      });
    });
  });

  // ============================================================================
  // STANDALONE PROGRAMS (REPRESENTATIVE SAMPLE)
  // ============================================================================

  describe('Standalone Programs', () => {
    describe('CA - Certificated with PW', () => {
      it('should calculate CA standalone credit', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'CA',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 10000000,
        });

        expect(result.programType).toBe('standalone');
        expect(result.grossCredit).toBe(10000000);
        expect(result.syndicationRate).toBe(0.9); // Certificated
        expect(result.netBenefit).toBe(9000000);
      });

      it('should warn about PW requirement', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'CA',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 10000000,
        });

        const hasPWWarning = result.warnings.some((w) =>
          w.includes('prevailing wage')
        );
        expect(hasPWWarning).toBe(true);
      });
    });

    describe('NY - In-State vs Out-of-State (IMPL-047)', () => {
      it('should give 100% to in-state investor', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'NY',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 10000000,
        });

        expect(result.syndicationRate).toBe(1.0); // In-state has liability by default
        expect(result.netBenefit).toBe(10000000);
      });

      it('should give 100% to out-of-state investor with liability (IMPL-047)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'NY',
          investorState: 'CA',
          pisMonth: 7,
          userAmount: 10000000,
          investorHasStateLiability: true, // Has NY tax liability
        });

        // IMPL-047: Toggle ON = 100% direct use
        expect(result.syndicationRate).toBe(1.0);
        expect(result.netBenefit).toBe(10000000);
      });
    });

    describe('IL - Donation/Transferable', () => {
      it('should calculate IL credit with 90% syndication', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'IL',
          investorState: 'WI',
          pisMonth: 7,
          userAmount: 15000000,
        });

        expect(result.programType).toBe('standalone');
        expect(result.syndicationRate).toBe(0.9); // Transferable
        expect(result.netBenefit).toBe(13500000);
      });
    });

    describe('MA - State LIHTC', () => {
      it('should calculate MA standalone credit', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'MA',
          investorState: 'CT',
          pisMonth: 1,
          userAmount: 12000000,
        });

        expect(result.programType).toBe('standalone');
        expect(result.grossCredit).toBe(12000000);
      });
    });

    describe('CO - AHTC', () => {
      it('should calculate CO standalone credit', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'CO',
          investorState: 'WY',
          pisMonth: 7,
          userAmount: 8000000,
        });

        expect(result.programType).toBe('standalone');
        expect(result.grossCredit).toBe(8000000);
      });
    });
  });

  // ============================================================================
  // GRANT PROGRAMS (1 STATE)
  // ============================================================================

  describe('Grant Programs', () => {
    describe('NJ - STCS Grant', () => {
      it('should calculate NJ grant with 100% syndication', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'NJ',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 20000000,
        });

        expect(result.programType).toBe('grant');
        expect(result.grossCredit).toBe(20000000);
        expect(result.syndicationRate).toBe(1.0); // Grant = 100%
        expect(result.netBenefit).toBe(20000000);
      });

      it('should warn about PW', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'NJ',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 20000000,
        });

        const hasPWWarning = result.warnings.some((w) =>
          w.includes('prevailing wage')
        );
        expect(hasPWWarning).toBe(true);
      });
    });
  });

  // ============================================================================
  // NO PROGRAM STATES
  // ============================================================================

  describe('No Program States', () => {
    it('should return zero for OR (no state LIHTC)', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'OR',
        investorState: 'CA',
        pisMonth: 7,
      });

      expect(result.grossCredit).toBe(0);
      expect(result.netBenefit).toBe(0);
      expect(result.programType).toBe(null);
      expect(result.warnings).toContain('No state LIHTC program in OR');
    });

    it('should return zero for TX (no income tax)', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'TX',
        investorState: 'OK',
        pisMonth: 7,
      });

      expect(result.grossCredit).toBe(0);
      expect(result.netBenefit).toBe(0);
      expect(result.warnings).toContain('No state LIHTC program in TX');
    });

    it('should return zero for FL (no income tax)', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'FL',
        investorState: 'GA',
        pisMonth: 7,
      });

      expect(result.grossCredit).toBe(0);
      expect(result.netBenefit).toBe(0);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero federal credit', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 0,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
      });

      expect(result.grossCredit).toBe(0);
      expect(result.netBenefit).toBe(0);
    });

    it('should reject negative federal credit', () => {
      expect(() =>
        calculateStateLIHTC({
          federalAnnualCredit: -1000000,
          propertyState: 'GA',
          investorState: 'NY',
          pisMonth: 7,
        })
      ).toThrow(StateLIHTCValidationError);
    });

    it('should reject invalid state code', () => {
      expect(() =>
        calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'INVALID',
          investorState: 'NY',
          pisMonth: 7,
        })
      ).toThrow(StateLIHTCValidationError);
    });

    it('should reject invalid PIS month', () => {
      expect(() =>
        calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'GA',
          investorState: 'NY',
          pisMonth: 13,
        })
      ).toThrow(StateLIHTCValidationError);
    });

    it('should reject invalid user percentage', () => {
      expect(() =>
        calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'MO',
          investorState: 'IL',
          pisMonth: 7,
          userPercentage: 150,
        })
      ).toThrow(StateLIHTCValidationError);
    });

    it('should reject negative user amount', () => {
      expect(() =>
        calculateStateLIHTC({
          federalAnnualCredit: 1950000,
          propertyState: 'CA',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: -1000000,
        })
      ).toThrow(StateLIHTCValidationError);
    });

    it('should use syndication rate override', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
        syndicationRateOverride: 95,
      });

      expect(result.syndicationRate).toBe(0.95);
    });
  });

  // ============================================================================
  // SCHEDULE GENERATION (ALL PIS MONTHS)
  // ============================================================================

  describe('Schedule Generation', () => {
    it('should generate correct schedule for January PIS', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 1,
      });

      expect(result.schedule.year1Credit).toBe(1950000); // 100%
      expect(result.schedule.year11Credit).toBe(0);
    });

    it('should generate correct schedule for July PIS', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
      });

      expect(result.schedule.year1Credit).toBe(975000); // 50%
      expect(result.schedule.year11Credit).toBe(975000); // 50%
    });

    it('should generate correct schedule for December PIS', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 12,
      });

      expect(result.schedule.year1Credit).toBeCloseTo(162500, 0); // ~8.33%
      expect(result.schedule.year11Credit).toBeCloseTo(1787500, 0); // ~91.67%
    });

    it('should always have 11 years in breakdown', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
      });

      expect(result.schedule.yearlyBreakdown).toHaveLength(11);
    });

    it('should maintain total = 10 × annual', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
      });

      expect(result.schedule.totalCredits).toBe(19500000);
    });
  });

  // ============================================================================
  // WARNING SYSTEM
  // ============================================================================

  describe('Warning System', () => {
    it('should warn about PW requirement', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'CA',
        investorState: 'NY',
        pisMonth: 7,
        userAmount: 10000000,
      });

      const hasPWWarning = result.warnings.some((w) =>
        w.includes('prevailing wage')
      );
      expect(hasPWWarning).toBe(true);
    });

    it('should warn about sunset', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'KS',
        investorState: 'KS',
        pisMonth: 7,
      });

      const hasSunsetWarning = result.warnings.some((w) => w.includes('sunset'));
      expect(hasSunsetWarning).toBe(true);
    });

    // IMPL-047: Removed "no liability" warning for allocated credits since
    // toggle OFF now results in syndication at program rate, not 0%
    it('should NOT warn about no liability with allocated credits (IMPL-047)', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'SC',
        investorState: 'TX',
        pisMonth: 7,
        investorHasStateLiability: false,
      });

      // IMPL-047: No longer warns since credits are syndicated at program rate
      const hasLiabilityWarning = result.warnings.some((w) =>
        w.includes('tax liability')
      );
      expect(hasLiabilityWarning).toBe(false);
    });
  });

  // ============================================================================
  // INTEGRATION
  // ============================================================================

  describe('Integration', () => {
    it('should integrate with federal LIHTC calculation', () => {
      // Simulating federal LIHTC result
      const federalAnnualCredit = 1950000; // From IMPL-7.0-005

      const stateResult = calculateStateLIHTC({
        federalAnnualCredit,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
      });

      // Combined totals
      const federalTotal = federalAnnualCredit * 10; // $19.5M
      const stateNet = stateResult.netBenefit; // $16.575M
      const combinedTotal = federalTotal + stateNet; // $36.075M

      expect(combinedTotal).toBe(36075000);
    });

    it('should handle multiple investors with different liabilities (IMPL-047)', () => {
      const federalCredit = 1950000;

      // In-state investor
      const inState = calculateStateLIHTC({
        federalAnnualCredit: federalCredit,
        propertyState: 'NY',
        investorState: 'NY',
        pisMonth: 7,
        userAmount: 10000000,
      });

      // Out-of-state investor with liability
      const outStateWithLiability = calculateStateLIHTC({
        federalAnnualCredit: federalCredit,
        propertyState: 'NY',
        investorState: 'CA',
        pisMonth: 7,
        userAmount: 10000000,
        investorHasStateLiability: true,
      });

      // Out-of-state investor without liability
      const outStateNoLiability = calculateStateLIHTC({
        federalAnnualCredit: federalCredit,
        propertyState: 'NY',
        investorState: 'CA',
        pisMonth: 7,
        userAmount: 10000000,
        investorHasStateLiability: false,
      });

      // IMPL-047: Toggle controls credit path
      expect(inState.syndicationRate).toBe(1.0); // In-state has liability by default → 100%
      expect(outStateWithLiability.syndicationRate).toBe(1.0); // Toggle ON → 100% direct use
      expect(outStateNoLiability.syndicationRate).toBe(0.8); // Toggle OFF → program rate (80% for NY allocated)
    });
  });

  // ============================================================================
  // FORMATTING
  // ============================================================================

  describe('Formatting', () => {
    it('should format result for display', () => {
      const result = calculateStateLIHTC({
        federalAnnualCredit: 1950000,
        propertyState: 'GA',
        investorState: 'NY',
        pisMonth: 7,
      });

      const formatted = formatStateLIHTCResult(result);

      expect(formatted).toContain('State LIHTC Calculation');
      expect(formatted).toContain('Program:');
      expect(formatted).toContain('GA');
      expect(formatted).toContain('Gross State Credit');
      expect(formatted).toContain('Syndication Rate');
      expect(formatted).toContain('Net Benefit');
    });
  });

  // ============================================================================
  // IMPL-047: Toggle Controls Credit Path
  // ============================================================================

  describe('IMPL-047: Toggle Controls Credit Path', () => {
    describe('GA (bifurcated program)', () => {
      it('toggle ON → syndicationRate = 1.0 (direct_use)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'GA',
          investorState: 'NY', // Out-of-state
          pisMonth: 7,
          investorHasStateLiability: true, // Toggle ON
        });
        expect(result.syndicationRate).toBe(1.0);
      });

      it('toggle OFF → syndicationRate = 0.85 (syndicated)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'GA',
          investorState: 'NY',
          pisMonth: 7,
          investorHasStateLiability: false, // Toggle OFF
        });
        expect(result.syndicationRate).toBe(0.85); // GA bifurcated rate
      });
    });

    describe('SC (allocated program)', () => {
      it('toggle ON → syndicationRate = 1.0 (direct_use)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'SC',
          investorState: 'NY', // Out-of-state
          pisMonth: 7,
          investorHasStateLiability: true, // Toggle ON
        });
        expect(result.syndicationRate).toBe(1.0);
      });

      it('toggle OFF → syndicationRate = 0.80 (syndicated)', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'SC',
          investorState: 'NY',
          pisMonth: 7,
          investorHasStateLiability: false, // Toggle OFF
        });
        expect(result.syndicationRate).toBe(0.8); // SC allocated rate
      });
    });

    describe('NJ (grant program)', () => {
      it('grant always returns 1.0 regardless of toggle', () => {
        const resultOn = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'NJ',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 5000000,
          investorHasStateLiability: true,
        });
        const resultOff = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'NJ',
          investorState: 'NY',
          pisMonth: 7,
          userAmount: 5000000,
          investorHasStateLiability: false,
        });
        expect(resultOn.syndicationRate).toBe(1.0);
        expect(resultOff.syndicationRate).toBe(1.0); // Grants always 100%
      });
    });

    // ISS-020: Checkbox takes priority over override
    describe('Checkbox takes precedence over override', () => {
      it('investorHasStateLiability checkbox should override syndicationRateOverride', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'GA',
          investorState: 'NY',
          pisMonth: 7,
          investorHasStateLiability: true, // Checkbox ON → direct use (1.0)
          syndicationRateOverride: 75, // Override is ignored when checkbox is true
        });
        // ISS-020: Checkbox takes priority → 1.0 (direct use)
        expect(result.syndicationRate).toBe(1.0);
      });

      it('syndicationRateOverride only applies when checkbox is false', () => {
        const result = calculateStateLIHTC({
          federalAnnualCredit: 1000000,
          propertyState: 'GA',
          investorState: 'NY',
          pisMonth: 7,
          investorHasStateLiability: false, // No liability → syndicate
          syndicationRateOverride: 75, // Override to 75%
        });
        // Override only used when checkbox is false
        expect(result.syndicationRate).toBe(0.75);
      });
    });
  });
});
