/**
 * Test Helper Functions for HDC Calculator Tests
 * Provides utility functions for creating test parameters and calculating expected values
 *
 * Fix #1 (Jan 2025): Updated to use production calculation functions
 * to ensure test expectations match actual implementation
 */

import { CalculationParams } from '../../../types/taxbenefits';
import { calculateInterestReserve } from '../interestReserveCalculation';
import { calculateDepreciableBasis } from '../depreciableBasisUtility';

/**
 * Calculate expected financial values using production functions
 * Fix #1: Uses effective project cost (includes interest reserve) for investor equity
 */
export function calculateExpectedFinancials(params: Partial<CalculationParams>) {
  const fullParams = getDefaultTestParams(params);

  const interestReserve = calculateInterestReserve({
    enabled: fullParams.interestReserveEnabled || false,
    months: fullParams.interestReserveMonths || 12,
    projectCost: fullParams.projectCost,
    predevelopmentCosts: 0,
    yearOneNOI: fullParams.yearOneNOI,
    seniorDebtPct: fullParams.seniorDebtPct,
    seniorDebtRate: fullParams.seniorDebtRate,
    seniorDebtAmortization: fullParams.seniorDebtAmortization,
    seniorDebtIOYears: 0,
    outsideInvestorSubDebtPct: fullParams.outsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate: fullParams.outsideInvestorSubDebtPikRate,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,
    hdcSubDebtPct: fullParams.hdcSubDebtPct,
    hdcSubDebtPikRate: fullParams.hdcSubDebtPikRate,
    hdcPikCurrentPayEnabled: false,
    hdcPikCurrentPayPct: 0,
    investorSubDebtPct: fullParams.investorSubDebtPct,
    investorSubDebtPikRate: fullParams.investorSubDebtPikRate,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
  });

  const effectiveProjectCost = fullParams.projectCost + interestReserve;

  const depreciableBasis = calculateDepreciableBasis({
    projectCost: fullParams.projectCost,
    predevelopmentCosts: 0,
    landValue: fullParams.landValue,
    investorEquityPct: fullParams.investorEquityPct,
    interestReserve
  });

  const year1Depreciation = depreciableBasis * (fullParams.yearOneDepreciationPct / 100);
  const year1TaxBenefit = year1Depreciation * (fullParams.effectiveTaxRate / 100);
  const hdcFee = year1TaxBenefit * (fullParams.hdcFeeRate / 100);
  const netBenefit = year1TaxBenefit - hdcFee;

  return {
    interestReserve,
    effectiveProjectCost,
    depreciableBasis,
    year1Depreciation,
    year1TaxBenefit,
    hdcFee,
    netBenefit
  };
}

/**
 * Calculate expected PIK balance using production functions
 * Fix #1: PIK principal calculated on effective project cost
 */
export function calculateExpectedPIKBalance(params: Partial<CalculationParams>, years: number, debtType: 'hdc' | 'investor' | 'outsideInvestor' = 'hdc') {
  const fullParams = getDefaultTestParams(params);

  const interestReserve = calculateInterestReserve({
    enabled: fullParams.interestReserveEnabled || false,
    months: fullParams.interestReserveMonths || 12,
    projectCost: fullParams.projectCost,
    predevelopmentCosts: 0,
    yearOneNOI: fullParams.yearOneNOI,
    seniorDebtPct: fullParams.seniorDebtPct,
    seniorDebtRate: fullParams.seniorDebtRate,
    seniorDebtAmortization: fullParams.seniorDebtAmortization,
    seniorDebtIOYears: 0,
    outsideInvestorSubDebtPct: fullParams.outsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate: fullParams.outsideInvestorSubDebtPikRate,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,
    hdcSubDebtPct: fullParams.hdcSubDebtPct,
    hdcSubDebtPikRate: fullParams.hdcSubDebtPikRate,
    hdcPikCurrentPayEnabled: false,
    hdcPikCurrentPayPct: 0,
    investorSubDebtPct: fullParams.investorSubDebtPct,
    investorSubDebtPikRate: fullParams.investorSubDebtPikRate,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
  });

  const effectiveProjectCost = fullParams.projectCost + interestReserve;

  let principal: number;
  let rate: number;

  switch (debtType) {
    case 'hdc':
      principal = effectiveProjectCost * (fullParams.hdcSubDebtPct / 100);
      rate = fullParams.hdcSubDebtPikRate / 100;
      break;
    case 'investor':
      principal = effectiveProjectCost * (fullParams.investorSubDebtPct / 100);
      rate = fullParams.investorSubDebtPikRate / 100;
      break;
    case 'outsideInvestor':
      principal = effectiveProjectCost * (fullParams.outsideInvestorSubDebtPct / 100);
      rate = fullParams.outsideInvestorSubDebtPikRate / 100;
      break;
  }

  return principal * Math.pow(1 + rate, years);
}

/**
 * Creates default test parameters with sensible defaults for testing
 * Can be overridden with partial params
 */
export function getDefaultTestParams(overrides: Partial<CalculationParams> = {}): CalculationParams {
  const defaults: CalculationParams = {
    // Project basics
    projectCost: 100, // $100M default
    landValue: 10,    // $10M land
    yearOneNOI: 5,    // $5M NOI

    // Growth rates
    revenueGrowth: 2.0,
    expenseGrowth: 2.5,
    exitCapRate: 5.0,

    // Investor structure
    investorEquityPct: 5.0, // 5% investor equity
    investorPromoteShare: 20, // 20% promote
    investorUpfrontCash: 5, // $5M upfront

    // HDC fees
    hdcFeeRate: 0, // 10% fee on tax benefits
    hdcDeferredInterestRate: 5.0,
    hdcAdvanceFinancing: false,

    // Tax calculations
    totalTaxBenefit: 0, // Calculated
    netTaxBenefit: 0,   // Calculated
    hdcFee: 0,          // Calculated
    yearOneDepreciationPct: 20, // 20% Year 1 (updated to 2025 standard)
    effectiveTaxRate: 47.85, // Combined federal + state

    // Debt structure
    seniorDebtPct: 65,
    philanthropicDebtPct: 30,
    seniorDebtRate: 6.0,
    philanthropicDebtRate: 0.0, // Interest-free
    seniorDebtAmortization: 30,
    philDebtAmortization: 0, // Interest-only

    // Sub-debt (optional, defaults off)
    hdcSubDebtPct: 0,
    hdcSubDebtPikRate: 0,
    investorSubDebtPct: 0,
    investorSubDebtPikRate: 0,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 0,

    // AUM fees (optional, defaults off)
    aumFeeEnabled: false,
    aumFeeRate: 0,
    aumCurrentPayEnabled: false,
    aumCurrentPayPct: 0,

    // Interest reserve
    interestReserveEnabled: false,
    interestReserveMonths: 0,

    // Timing
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,
    holdPeriod: 10,

    // Opportunity Zone
    ozEnabled: true, // Default OZ enabled
    ozType: 'standard',
    deferredCapitalGains: 0,
    capitalGainsTaxRate: 23.8,

    // Tax planning (optional)
    includeDepreciationSchedule: false,
  };

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * Calculate expected tax benefit for validation
 * Useful for verifying calculation correctness
 *
 * Fix #1 (Jan 2025): Now uses production functions to match actual implementation
 * DEPRECATED: Use calculateExpectedFinancials() instead for full Fix #1 compliance
 */
export function calculateExpectedTaxBenefit(params: {
  projectCost: number;
  landValue: number;
  investorEquityPct: number;
  yearOneDepreciationPct: number;
  effectiveTaxRate: number;
  hdcFeeRate: number;
  ozEnabled?: boolean;
  interestReserve?: number;
}): { grossBenefit: number; hdcFee: number; netBenefit: number } {
  const {
    projectCost,
    landValue,
    investorEquityPct,
    yearOneDepreciationPct,
    effectiveTaxRate,
    hdcFeeRate,
    ozEnabled = true,
    interestReserve = 0
  } = params;

  if (!ozEnabled) {
    // Non-OZ: Traditional calculation (no investor equity exclusion)
    const depreciableBasis = projectCost - landValue;
    const year1Depreciation = depreciableBasis * (yearOneDepreciationPct / 100);
    const grossBenefit = year1Depreciation * (effectiveTaxRate / 100);
    const hdcFee = grossBenefit * (hdcFeeRate / 100);
    const netBenefit = grossBenefit - hdcFee;

    return { grossBenefit, hdcFee, netBenefit };
  }

  // OZ: Use production function for accurate depreciable basis
  const depreciableBasis = calculateDepreciableBasis({
    projectCost,
    predevelopmentCosts: 0,
    landValue,
    investorEquityPct,
    interestReserve
  });

  // Calculate Year 1 depreciation
  const year1Depreciation = depreciableBasis * (yearOneDepreciationPct / 100);

  // Calculate tax benefit
  const grossBenefit = year1Depreciation * (effectiveTaxRate / 100);
  const hdcFee = grossBenefit * (hdcFeeRate / 100);
  const netBenefit = grossBenefit - hdcFee;

  return {
    grossBenefit,
    hdcFee,
    netBenefit,
  };
}

/**
 * Helper to validate cash flow totals
 */
export function validateCashFlowTotals(cashFlows: any[], expectedTotal: number, tolerance: number = 0.01) {
  const actualTotal = cashFlows.reduce((sum, cf) => sum + cf.totalCashFlow, 0);
  return Math.abs(actualTotal - expectedTotal) < tolerance;
}

/**
 * Helper to find specific year's cash flow
 */
export function getYearCashFlow(cashFlows: any[], year: number) {
  return cashFlows.find(cf => cf.year === year);
}
