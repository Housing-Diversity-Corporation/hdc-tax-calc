/**
 * Year 1 HDC Fee Validation Tests
 *
 * This test suite validates the critical Year 1 HDC Fee calculation
 * as documented in HDC_CALCULATION_LOGIC.md v1.4
 *
 * The 6-step calculation process MUST be exact to prevent cascading errors
 */

import {
  validateYear1HDCFeeCalculation,
  validateYear1HDCFeeAmount
} from './finance-validation-agent';

describe('Year 1 HDC Fee Calculation Validation', () => {

  describe('Standard Calculation Scenario', () => {
    it('should correctly calculate Year 1 HDC Fee with typical inputs', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 10_000_000,
        yearOneDepreciationPct: 25, // 25% bonus depreciation
        effectiveTaxRate: 47.9, // 37% federal + 10.9% CA
        hdcFeeRate: 0
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Verify calculation steps (HDC fee removed per IMPL-7.0-014)
      expect(result.calculationSteps.depreciableBasis).toBe(40_000_000);
      expect(result.calculationSteps.year1Depreciation).toBe(10_000_000);
      expect(result.calculationSteps.year1TaxBenefit).toBeCloseTo(4_790_000, -2);
      expect(result.calculationSteps.year1HDCFee).toBe(0); // Fee removed
      expect(result.calculationSteps.netToInvestor).toBeCloseTo(4_790_000, -2); // Full benefit to investor
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero land value', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 0,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.9
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(true);
      expect(result.calculationSteps.depreciableBasis).toBe(50_000_000);
      expect(result.calculationSteps.year1Depreciation).toBe(12_500_000);
    });

    it('should handle maximum bonus depreciation', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 10_000_000,
        yearOneDepreciationPct: 100, // 100% bonus depreciation
        effectiveTaxRate: 47.9
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(true);
      expect(result.calculationSteps.year1Depreciation).toBe(40_000_000);
      expect(result.calculationSteps.year1TaxBenefit).toBeCloseTo(19_160_000, -2);
      expect(result.calculationSteps.year1HDCFee).toBe(0); // Fee removed
    });

    it('should handle zero bonus depreciation', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 10_000_000,
        yearOneDepreciationPct: 0, // No bonus depreciation
        effectiveTaxRate: 47.9
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(true);
      expect(result.calculationSteps.year1Depreciation).toBe(0);
      expect(result.calculationSteps.year1TaxBenefit).toBe(0);
      expect(result.calculationSteps.year1HDCFee).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    it('should error when land value exceeds project cost', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 60_000_000, // Invalid: land > project
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.9
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Depreciable basis must be positive (Project Cost > Land Value)');
    });

    it('should error when HDC fee rate is not 0%', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 10_000_000,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.9,
        hdcFeeRate: 15 // Invalid: must be 0% (fee removed)
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HDC Fee Rate is 15% but should be 0% (fee removed per IMPL-7.0-014)');

      // Fee should still be 0 regardless of input (fee removed)
      expect(result.calculationSteps.year1HDCFee).toBe(0);
    });

    it('should error with invalid depreciation percentage', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 10_000_000,
        yearOneDepreciationPct: 150, // Invalid: > 100%
        effectiveTaxRate: 47.9
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Year 1 depreciation percentage must be between 0 and 100');
    });

    it('should error with invalid tax rate', () => {
      const params = {
        projectCost: 50_000_000,
        landValue: 10_000_000,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: -5 // Invalid: negative rate
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Effective tax rate must be between 0 and 100');
    });
  });

  describe('Quick Validation Function', () => {
    it('should validate actual HDC fee amount within tolerance (now 0)', () => {
      const actualHDCFee = 0; // Fee is now 0

      const isValid = validateYear1HDCFeeAmount(
        actualHDCFee,
        50_000_000, // projectCost
        10_000_000, // landValue
        25, // yearOneDepreciationPct
        47.9, // effectiveTaxRate
        200 // tolerance
      );

      expect(isValid).toBe(true);
    });

    it('should fail validation when actual HDC fee is non-zero (fee removed)', () => {
      const actualHDCFee = 500_000; // Should be 0 now

      const isValid = validateYear1HDCFeeAmount(
        actualHDCFee,
        50_000_000,
        10_000_000,
        25,
        47.9,
        100 // tight tolerance
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle $100M project with high land value', () => {
      const params = {
        projectCost: 100_000_000,
        landValue: 30_000_000, // 30% land value
        yearOneDepreciationPct: 20, // Conservative bonus
        effectiveTaxRate: 45.5 // Lower effective rate
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(true);
      expect(result.calculationSteps.depreciableBasis).toBe(70_000_000);
      expect(result.calculationSteps.year1Depreciation).toBe(14_000_000);
      expect(result.calculationSteps.year1TaxBenefit).toBeCloseTo(6_370_000, -2);
      expect(result.calculationSteps.year1HDCFee).toBe(0); // Fee removed
    });

    it('should handle small affordable housing project', () => {
      const params = {
        projectCost: 10_000_000,
        landValue: 1_500_000,
        yearOneDepreciationPct: 30,
        effectiveTaxRate: 37 // Federal only, no state
      };

      const result = validateYear1HDCFeeCalculation(params);

      expect(result.valid).toBe(true);
      expect(result.calculationSteps.depreciableBasis).toBe(8_500_000);
      expect(result.calculationSteps.year1Depreciation).toBe(2_550_000);
      expect(result.calculationSteps.year1TaxBenefit).toBeCloseTo(943_500, -2);
      expect(result.calculationSteps.year1HDCFee).toBe(0); // Fee removed
    });
  });
});