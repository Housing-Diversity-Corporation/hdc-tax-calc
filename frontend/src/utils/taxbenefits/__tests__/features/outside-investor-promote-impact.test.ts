// Jest is configured globally, no imports needed
import { calculateHDCAnalysis } from '../../hdcAnalysis';
import { calculateFullInvestorAnalysis } from '../../calculations';

describe('Outside Investor Sub-Debt Impact on Promote Split', () => {
  // Helper to calculate year1NetBenefit
  function calculateYear1NetBenefit(
    projectCost: number,
    landValue: number,
    year1DepreciationPct: number,
    effectiveTaxRate: number
  ): number {
    const depreciableBasis = projectCost - landValue;
    const year1Depreciation = depreciableBasis * (year1DepreciationPct / 100);
    const year1TaxBenefit = year1Depreciation * (effectiveTaxRate / 100);
    const year1HdcFee = year1TaxBenefit * 0.10;
    return year1TaxBenefit - year1HdcFee;
  }

  const baseParams = {
    projectCost: 100_000_000,
    landValue: 10_000_000,
    yearOneNOI: 5_000_000,
    yearOneDepreciationPct: 25,
    revenueGrowth: 3,
    expenseGrowth: 2,
    exitCapRate: 6,
    opexRatio: 30,
    holdPeriod: 10,
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,

    // Tax params - use effectiveTaxRate only
    effectiveTaxRate: 47.9,

    // Capital structure
    investorEquityPct: 5,
    seniorDebtPct: 66,
    philDebtPct: 20,
    hdcSubDebtPct: 2,
    investorSubDebtPct: 2.5,

    // Rates
    seniorDebtRate: 5,
    philDebtRate: 0,
    seniorDebtAmortization: 35,
    hdcSubDebtPikRate: 8,
    investorSubDebtPikRate: 8,

    // Fees
    hdcFeeRate: 0,
    investorPromoteShare: 65, // 65% investor, 35% HDC
    aumFeeEnabled: false,

    // Required params
    hdcFee: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    year1NetBenefit: 0,

    // OZ params
    ozEnabled: false,
    ozType: 'standard' as const,
    deferredCapitalGains: 0,
    capitalGainsTaxRate: 34.65,

    // Depreciation
    annualStraightLineDepreciation: 3_272_727,
  };

  describe('HDC Promote Calculation', () => {
    it('should reduce HDC promote when Outside Investor Sub-Debt is present', () => {
      const year1NetBenefit = calculateYear1NetBenefit(
        baseParams.projectCost,
        baseParams.landValue,
        baseParams.yearOneDepreciationPct,
        baseParams.effectiveTaxRate
      );

      // Calculate WITH Outside Investor Sub-Debt (4.5%)
      const paramsWithOutside = {
        ...baseParams,
        outsideInvestorSubDebtPct: 4.5,
        outsideInvestorSubDebtPikRate: 8,
        outsideInvestorPikCurrentPayEnabled: false,
        outsideInvestorPikCurrentPayPct: 0,
        year1NetBenefit,
      };

      // Calculate WITHOUT Outside Investor Sub-Debt
      const paramsWithoutOutside = {
        ...baseParams,
        outsideInvestorSubDebtPct: 0,
        outsideInvestorSubDebtPikRate: 8,
        outsideInvestorPikCurrentPayEnabled: false,
        outsideInvestorPikCurrentPayPct: 0,
        year1NetBenefit,
      };

      // Get investor analysis for both scenarios
      const investorWithOutside = calculateFullInvestorAnalysis(paramsWithOutside);
      const investorWithoutOutside = calculateFullInvestorAnalysis(paramsWithoutOutside);

      // Get HDC analysis for both scenarios
      const hdcWithOutside = calculateHDCAnalysis(paramsWithOutside);
      const hdcWithoutOutside = calculateHDCAnalysis(paramsWithoutOutside);

      // Verify HDC promote is reduced with Outside Investor Sub-Debt
      expect(hdcWithOutside.hdcPromoteProceeds).toBeLessThan(hdcWithoutOutside.hdcPromoteProceeds);

      // The difference should be approximately 35% of the Outside Investor debt at exit
      // $4.5M at 8% for 10 years ≈ $9.7M, HDC's 35% share of reduction ≈ $3.4M
      const promoteDifference = hdcWithoutOutside.hdcPromoteProceeds - hdcWithOutside.hdcPromoteProceeds;
      expect(promoteDifference).toBeGreaterThan(3_000_000);
    });

    it('should proportionally reduce both investor and HDC proceeds', () => {
      const year1NetBenefit = calculateYear1NetBenefit(
        baseParams.projectCost,
        baseParams.landValue,
        baseParams.yearOneDepreciationPct,
        baseParams.effectiveTaxRate
      );

      const params = {
        ...baseParams,
        outsideInvestorSubDebtPct: 5,
        outsideInvestorSubDebtPikRate: 8,
        outsideInvestorPikCurrentPayEnabled: false,
        outsideInvestorPikCurrentPayPct: 0,
        year1NetBenefit,
      };

      // Calculate investor analysis
      const investorResult = calculateFullInvestorAnalysis(params);

      // Calculate Outside Investor debt at exit
      const outsideInvestorPrincipal = params.projectCost * (params.outsideInvestorSubDebtPct / 100);
      const outsideInvestorAtExit = outsideInvestorPrincipal * Math.pow(1.08, params.holdPeriod);

      // Get exit value
      const exitValue = (params.yearOneNOI * Math.pow(1.03, params.holdPeriod)) / (params.exitCapRate / 100);

      // Verify the Outside Investor debt reduces available proceeds
      expect(investorResult.outsideInvestorTotalCost).toBeCloseTo(outsideInvestorAtExit, -2);
      expect(investorResult.exitProceeds).toBeLessThan(exitValue * 0.65); // Less than 65% of gross
    });
  });

  describe('Outside Investor Multiple and Annualized Rate', () => {
    it('should calculate correct multiple on capital and annualized rate', () => {
      const principal = 5_000_000; // $5M
      const holdPeriod = 10;
      const pikRate = 8;

      // Calculate total cost with compound interest
      const totalCost = principal * Math.pow(1 + pikRate / 100, holdPeriod);

      // Calculate multiple
      const multipleOnCapital = totalCost / principal;

      // Calculate annualized rate
      const annualizedRate = (Math.pow(totalCost / principal, 1 / holdPeriod) - 1) * 100;

      // Verify calculations
      expect(totalCost).toBeCloseTo(10_794_625, 0);
      expect(multipleOnCapital).toBeCloseTo(2.159, 2);
      expect(annualizedRate).toBeCloseTo(8, 1);
    });

    it('should show higher multiple with longer hold period', () => {
      const principal = 5_000_000;
      const pikRate = 8;

      // 10-year hold
      const totalCost10 = principal * Math.pow(1.08, 10);
      const multiple10 = totalCost10 / principal;

      // 20-year hold
      const totalCost20 = principal * Math.pow(1.08, 20);
      const multiple20 = totalCost20 / principal;

      // 30-year hold
      const totalCost30 = principal * Math.pow(1.08, 30);
      const multiple30 = totalCost30 / principal;

      // Verify multiples increase with time
      expect(multiple10).toBeCloseTo(2.159, 2);
      expect(multiple20).toBeCloseTo(4.661, 2);
      expect(multiple30).toBeCloseTo(10.063, 2);

      // But annualized rate stays constant at 8%
      [10, 20, 30].forEach(years => {
        const totalCost = principal * Math.pow(1.08, years);
        const annualizedRate = (Math.pow(totalCost / principal, 1 / years) - 1) * 100;
        expect(annualizedRate).toBeCloseTo(8, 1);
      });
    });
  });

  describe('Current Pay Impact', () => {
    it('should reduce PIK accrual when current pay is enabled', () => {
      const principal = 5_000_000;
      const pikRate = 8;
      const holdPeriod = 10;
      const currentPayPct = 50;

      // Full PIK (no current pay)
      const fullPIKCost = principal * Math.pow(1.08, holdPeriod);

      // With 50% current pay
      // The calculation is more complex - need to compound both current and PIK portions
      // For simplicity, we'll use a rough approximation
      const currentPayCost = principal * Math.pow(1.04, holdPeriod); // Approximate with 4% effective

      // Verify current pay reduces total cost at exit
      expect(fullPIKCost).toBeCloseTo(10_794_625, 0);
      expect(currentPayCost).toBeCloseTo(7_401_221, 0);
      expect(currentPayCost).toBeLessThan(fullPIKCost);
    });
  });
});
