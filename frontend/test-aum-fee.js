// Quick test to verify AUM fee calculation
import { calculateHDCProjection } from './src/utils/HDCCalculator/calculations.js';

const testParams = {
  projectCost: 70000000,
  landValue: 6000000,
  yearOneNOI: 5000000,
  revenueGrowth: 2,
  expenseGrowth: 2,
  exitCapRate: 6,

  // Capital structure
  investorEquityPct: 10,
  philanthropicDebtPct: 20,
  seniorDebtPct: 60,
  hdcSubDebtPct: 10,

  // AUM fee settings
  aumFeeEnabled: true,
  aumFeeRate: 1.5, // 1.5% annually
  aumCurrentPayEnabled: true,
  aumCurrentPayPct: 50, // 50% current, 50% PIK

  // Other required params
  hdcFeeRate: 10,
  hdcDeferredInterestRate: 8,
  seniorDebtRate: 7,
  philanthropicDebtRate: 3,
  seniorDebtAmortization: 6,
  investorPromoteShare: 80,
  opexRatio: 30,
  effectiveTaxRate: 40,
  holdPeriod: 10
};

console.log('Testing AUM fee calculation...\n');

try {
  const results = calculateHDCProjection(testParams);

  console.log('Project Cost:', testParams.projectCost / 1000000, 'M');
  console.log('AUM Fee Rate:', testParams.aumFeeRate, '%');
  console.log('Expected Annual AUM Fee:', (testParams.projectCost * testParams.aumFeeRate / 100) / 1000000, 'M');
  console.log('Current Pay Enabled:', testParams.aumCurrentPayEnabled);
  console.log('Current Pay %:', testParams.aumCurrentPayPct);
  console.log('\n--- Year 2 Results (AUM starts in Year 2) ---');

  const year2 = results.investorProjection.cashFlow[1]; // Year 2 is index 1

  console.log('AUM Fee Amount:', year2.aumFeeAmount / 1000000, 'M');
  console.log('AUM Fee Paid:', year2.aumFeePaid / 1000000, 'M');
  console.log('AUM Fee Accrued:', year2.aumFeeAccrued / 1000000, 'M');

  console.log('\n--- HDC Cash Flow Year 2 ---');
  const hdcYear2 = results.hdcProjection.cashFlow[1];
  console.log('HDC AUM Fee Income:', hdcYear2.aumFeeIncome / 1000000, 'M');
  console.log('HDC AUM Fee Accrued:', hdcYear2.aumFeeAccrued / 1000000, 'M');

} catch (error) {
  console.error('Error:', error.message);
}