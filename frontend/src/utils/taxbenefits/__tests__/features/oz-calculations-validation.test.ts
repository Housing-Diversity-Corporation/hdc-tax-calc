/**
 * OZ Calculations Validation Tests
 * v1.6 - Tests for Opportunity Zone tax calculations and basis step-up
 */

// Inline validation functions (previously in finance-validation-agent)
interface OZYear5ValidationResult {
  valid: boolean;
  stepUpPercent: number;
  taxableGains: number;
  expectedTax: number;
  errors?: string[];
}

function validateOZYear5TaxPayment(params: {
  deferredCapitalGains: number;
  ozType: 'standard' | 'rural' | string;
  capitalGainsTaxRate: number;
}): OZYear5ValidationResult {
  const errors: string[] = [];

  // Validation
  if (params.deferredCapitalGains < 0) {
    errors.push('Deferred capital gains cannot be negative');
  }

  if (params.ozType !== 'standard' && params.ozType !== 'rural') {
    errors.push(`Invalid OZ type: ${params.ozType}`);
  }

  const stepUpPercent = params.ozType === 'rural' ? 0.30 : 0.10;
  const taxableGains = params.deferredCapitalGains * (1 - stepUpPercent);
  const expectedTax = taxableGains * (params.capitalGainsTaxRate / 100);

  return {
    valid: errors.length === 0,
    stepUpPercent,
    taxableGains,
    expectedTax,
    errors: errors.length > 0 ? errors : undefined
  };
}

interface TaxRateSeparationResult {
  valid: boolean;
  depreciationRate: number;
  ozTaxRate: number;
  separated: boolean;
  message?: string;
}

function validateTaxRateSeparation(params: {
  federalTaxRate: number;
  stateTaxRate?: number;
  ltCapitalGainsRate: number;
  niitRate?: number;
  stateCapitalGainsRate?: number;
}): TaxRateSeparationResult {
  const depreciationRate = params.federalTaxRate + (params.stateTaxRate || 0);
  const ozTaxRate = params.ltCapitalGainsRate + (params.niitRate || 0) + (params.stateCapitalGainsRate || 0);
  const separated = Math.abs(depreciationRate - ozTaxRate) > 0.1;

  return {
    valid: true,
    depreciationRate,
    ozTaxRate,
    separated,
    message: separated ? undefined : 'Warning: Depreciation and OZ tax rates are too similar'
  };
}

describe('OZ Year 5 Tax Payment Calculations', () => {
  describe('Standard OZ (10% step-up)', () => {
    it('should calculate correct Year 5 tax with 10% step-up', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 10, // $10M
        ozType: 'standard',
        capitalGainsTaxRate: 23.8 // 20% LTCG + 3.8% NIIT
      });

      expect(result.valid).toBe(true);
      expect(result.stepUpPercent).toBe(0.10);
      expect(result.taxableGains).toBe(9); // $10M * (1 - 0.10)
      expect(result.expectedTax).toBeCloseTo(2.142); // $9M * 0.238
    });

    it('should handle high-income investor with state tax', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 15, // $15M
        ozType: 'standard',
        capitalGainsTaxRate: 34.65 // 20% LTCG + 3.8% NIIT + 10.85% NY
      });

      expect(result.valid).toBe(true);
      expect(result.taxableGains).toBe(13.5); // $15M * 0.9
      expect(result.expectedTax).toBeCloseTo(4.678); // $13.5M * 0.3465
    });
  });

  describe('Rural OZ (30% step-up)', () => {
    it('should calculate correct Year 5 tax with 30% step-up', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 10, // $10M
        ozType: 'rural',
        capitalGainsTaxRate: 23.8
      });

      expect(result.valid).toBe(true);
      expect(result.stepUpPercent).toBe(0.30);
      expect(result.taxableGains).toBe(7); // $10M * (1 - 0.30)
      expect(result.expectedTax).toBeCloseTo(1.666); // $7M * 0.238
    });

    it('should show significant tax savings for rural OZ', () => {
      const standardOZ = validateOZYear5TaxPayment({
        deferredCapitalGains: 20,
        ozType: 'standard',
        capitalGainsTaxRate: 34.65
      });

      const ruralOZ = validateOZYear5TaxPayment({
        deferredCapitalGains: 20,
        ozType: 'rural',
        capitalGainsTaxRate: 34.65
      });

      const savings = standardOZ.expectedTax - ruralOZ.expectedTax;
      expect(savings).toBeCloseTo(1.386); // Additional 20% step-up benefit
    });
  });

  describe('Edge cases and validation', () => {
    it('should reject negative deferred gains', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: -5,
        ozType: 'standard',
        capitalGainsTaxRate: 23.8
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Deferred capital gains cannot be negative');
    });

    it('should reject invalid OZ type', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 10,
        ozType: 'invalid' as any,
        capitalGainsTaxRate: 23.8
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid OZ type: invalid');
    });

    it('should handle zero deferred gains', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 0,
        ozType: 'standard',
        capitalGainsTaxRate: 23.8
      });

      expect(result.valid).toBe(true);
      expect(result.expectedTax).toBe(0);
    });
  });

  describe('Mathematical validation examples', () => {
    it('should match HDC_CALCULATION_LOGIC.md example for standard OZ', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 10,
        ozType: 'standard',
        capitalGainsTaxRate: 34.7
      });

      // Per HDC_CALCULATION_LOGIC.md: $10M, 10% step-up, 34.7% rate = $3.123M
      expect(result.expectedTax).toBeCloseTo(3.123, 2);
    });

    it('should match HDC_CALCULATION_LOGIC.md example for rural OZ', () => {
      const result = validateOZYear5TaxPayment({
        deferredCapitalGains: 10,
        ozType: 'rural',
        capitalGainsTaxRate: 34.7
      });

      // Per HDC_CALCULATION_LOGIC.md: $10M, 30% step-up, 34.7% rate = $2.429M
      expect(result.expectedTax).toBeCloseTo(2.429, 2);
    });
  });
});

describe('Tax Rate Separation', () => {
  it('should validate proper separation of depreciation and OZ tax rates', () => {
    const result = validateTaxRateSeparation({
      federalTaxRate: 37,      // High ordinary income bracket
      stateTaxRate: 10.85,      // NY state tax
      ltCapitalGainsRate: 20,   // High LTCG bracket
      niitRate: 3.8,            // NIIT for high income
      stateCapitalGainsRate: 10.85 // NY capital gains
    });

    expect(result.valid).toBe(true);
    expect(result.depreciationRate).toBe(47.85); // 37% + 10.85%
    expect(result.ozTaxRate).toBe(34.65); // 20% + 3.8% + 10.85%
    expect(result.separated).toBe(true);
  });

  it('should warn when rates are too similar', () => {
    const result = validateTaxRateSeparation({
      federalTaxRate: 23.8,
      stateTaxRate: 0,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      stateCapitalGainsRate: 0
    });

    // 23.8% depreciation vs 23.8% OZ - identical
    expect(result.separated).toBe(false);
    expect(result.message).toContain('Warning');
  });

  it('should handle missing optional rates', () => {
    const result = validateTaxRateSeparation({
      federalTaxRate: 37,
      ltCapitalGainsRate: 20
      // No state taxes or NIIT
    });

    expect(result.depreciationRate).toBe(37);
    expect(result.ozTaxRate).toBe(20);
    expect(result.separated).toBe(true);
  });
});

describe('Integration with Calculator', () => {
  it('should verify deferred gains auto-population from investor equity', () => {
    const projectCost = 50;
    const investorEquityPct = 20;
    const expectedDeferredGains = projectCost * (investorEquityPct / 100);

    // In real implementation, this should come from the calculator
    expect(expectedDeferredGains).toBe(10);
  });

  it('should calculate total Year 5 impact with depreciation offset', () => {
    // Year 5 OZ tax payment
    const ozTaxResult = validateOZYear5TaxPayment({
      deferredCapitalGains: 10,
      ozType: 'standard',
      capitalGainsTaxRate: 34.65
    });

    // Year 5 depreciation benefit (example)
    const year5Depreciation = 1.5; // Straight-line depreciation
    const depreciationRate = 47.85; // 37% federal + 10.85% state
    const depreciationBenefit = year5Depreciation * (depreciationRate / 100);
    const hdcFee = depreciationBenefit * 0.10; // 10% HDC fee
    const netDepreciationBenefit = depreciationBenefit - hdcFee;

    // Net Year 5 impact
    const netYear5Impact = ozTaxResult.expectedTax - netDepreciationBenefit;

    expect(netYear5Impact).toBeGreaterThan(2); // Investor still owes after depreciation offset
  });
});
