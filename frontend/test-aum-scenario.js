import { calculateFullInvestorAnalysis, calculateHDCAnalysis } from './src/utils/HDCCalculator/calculations.ts';

// Base parameters matching typical scenario
const baseParams = {
  projectCost: 50000000,
  landValue: 10000000,
  yearOneNOI: 2500000,
  yearOneDepreciationPct: 60,
  revenueGrowth: 3,
  expenseGrowth: 3,
  exitCapRate: 6,
  investorEquityPct: 30,
  hdcFeeRate: 10,
  hdcAdvanceFinancing: false,
  investorUpfrontCash: 15000000,
  totalTaxBenefit: 10000000,
  netTaxBenefit: 9000000,
  hdcFee: 1000000,
  investorPromoteShare: 35,
  hdcSubDebtPct: 5,
  hdcSubDebtPikRate: 8,
  investorSubDebtPct: 0,
  opexRatio: 30,
  seniorDebtPct: 60,
  seniorDebtRate: 6,
  seniorDebtAmortization: 30,
  holdPeriod: 10,
  yearOneDepreciation: 24000000,
  annualStraightLineDepreciation: 1454545,
  effectiveTaxRate: 47.9,
  interestReserveEnabled: true,
  interestReserveMonths: 12
};

console.log('\n=== TESTING AUM FEE IMPACT ===\n');

// Test with 0.5% AUM fee
const lowAUM = calculateFullInvestorAnalysis({
  ...baseParams,
  aumFeeEnabled: true,
  aumFeeRate: 0.5
});

const lowHDC = calculateHDCAnalysis({
  ...baseParams,
  aumFeeEnabled: true,
  aumFeeRate: 0.5
});

// Test with 2.0% AUM fee
const highAUM = calculateFullInvestorAnalysis({
  ...baseParams,
  aumFeeEnabled: true,
  aumFeeRate: 2.0
});

const highHDC = calculateHDCAnalysis({
  ...baseParams,
  aumFeeEnabled: true,
  aumFeeRate: 2.0
});

console.log('--- WITH 0.5% AUM FEE ---');
console.log('Investor Total Returns: $', (lowAUM.totalReturns / 1000000).toFixed(2), 'M');
console.log('Investor Multiple:', lowAUM.multiple.toFixed(2));
console.log('Investor IRR:', lowAUM.irr.toFixed(1) + '%');
console.log('HDC AUM Fee Income: $', (lowHDC.hdcAumFeeIncome / 1000000).toFixed(2), 'M');

console.log('\n--- WITH 2.0% AUM FEE ---');
console.log('Investor Total Returns: $', (highAUM.totalReturns / 1000000).toFixed(2), 'M');
console.log('Investor Multiple:', highAUM.multiple.toFixed(2));
console.log('Investor IRR:', highAUM.irr.toFixed(1) + '%');
console.log('HDC AUM Fee Income: $', (highHDC.hdcAumFeeIncome / 1000000).toFixed(2), 'M');

console.log('\n--- IMPACT OF INCREASING AUM FEE FROM 0.5% TO 2.0% ---');
console.log('Investor Return Reduction: $', ((lowAUM.totalReturns - highAUM.totalReturns) / 1000000).toFixed(2), 'M');
console.log('Investor Multiple Reduction:', (lowAUM.multiple - highAUM.multiple).toFixed(2));
console.log('Investor IRR Reduction:', (lowAUM.irr - highAUM.irr).toFixed(1) + ' percentage points');
console.log('HDC AUM Fee Income Increase: $', ((highHDC.hdcAumFeeIncome - lowHDC.hdcAumFeeIncome) / 1000000).toFixed(2), 'M');

// Calculate total AUM fees per year
const annualAUMFee05 = 50000000 * 0.005;  // 0.5%
const annualAUMFee20 = 50000000 * 0.020;  // 2.0%
const totalAUMFees05 = annualAUMFee05 * 9;  // Years 2-10 (not Year 1)
const totalAUMFees20 = annualAUMFee20 * 9;  // Years 2-10 (not Year 1)

console.log('\n--- THEORETICAL AUM FEES ---');
console.log('Annual AUM Fee at 0.5%: $', (annualAUMFee05 / 1000000).toFixed(2), 'M');
console.log('Annual AUM Fee at 2.0%: $', (annualAUMFee20 / 1000000).toFixed(2), 'M');
console.log('Total AUM Fees at 0.5% (9 years): $', (totalAUMFees05 / 1000000).toFixed(2), 'M');
console.log('Total AUM Fees at 2.0% (9 years): $', (totalAUMFees20 / 1000000).toFixed(2), 'M');
console.log('Difference in Total AUM Fees: $', ((totalAUMFees20 - totalAUMFees05) / 1000000).toFixed(2), 'M');