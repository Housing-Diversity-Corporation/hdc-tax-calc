// Test script for outside investor sub-debt feature
import { calculateInvestorAnalysis } from './src/utils/HDCCalculator/calculations.ts';

// Test scenario with 10% outside investor sub-debt at 10% interest
const params = {
  projectCost: 10000000,
  landValue: 2000000,
  yearOneNOI: 800000,
  yearOneDepreciationPct: 6,
  revenueGrowth: 3,
  expenseGrowth: 2,
  exitCapRate: 6.5,
  investorEquityPct: 30,
  hdcFeeRate: 2,
  hdcAdvanceFinancing: false,
  investorUpfrontCash: 3000000,
  totalTaxBenefit: 1500000,
  netTaxBenefit: 1000000,
  hdcFee: 200000,
  year1NetBenefit: 100000,
  investorPromoteShare: 80,
  hdcSubDebtPct: 5,
  hdcSubDebtPikRate: 8,
  pikCurrentPayEnabled: false,
  pikCurrentPayPct: 0,
  investorSubDebtPct: 5,
  investorSubDebtPikRate: 8,
  investorPikCurrentPayEnabled: false,
  investorPikCurrentPayPct: 0,
  outsideInvestorSubDebtPct: 10,  // 10% = $1M principal
  outsideInvestorSubDebtPikRate: 10,  // 10% annual interest
  outsideInvestorPikCurrentPayEnabled: true,
  outsideInvestorPikCurrentPayPct: 50,  // 50% current pay, 50% PIK
  opexRatio: 35,
  aumFeeEnabled: false,
  aumFeeRate: 0,
  seniorDebtPct: 40,
  philanthropicDebtPct: 10,
  seniorDebtRate: 5,
  philanthropicDebtRate: 4,
  seniorDebtAmortization: 30,
  philDebtAmortization: 30,
  seniorLoanAmount: 4000000,
  philCurrentPayEnabled: false,
  philCurrentPayPct: 0,
  interestReserveEnabled: false,
  interestReserveMonths: 0,
  taxAdvanceDiscountRate: 8,
  advanceFinancingRate: 6,
  taxDeliveryMonths: 6,
  holdPeriod: 5,
  yearOneDepreciation: 600000,
  annualStraightLineDepreciation: 300000,
  effectiveTaxRate: 40
};

console.log('\n=== TESTING OUTSIDE INVESTOR SUB-DEBT FEATURE ===\n');
console.log('Project Cost: $10,000,000');
console.log('Outside Investor Sub-Debt: 10% = $1,000,000');
console.log('Interest Rate: 10% annual');
console.log('Current Pay: 50% (starting year 2)');
console.log('PIK Accrual: 50%');
console.log('Hold Period: 5 years\n');

try {
  const results = calculateInvestorAnalysis(params);

  console.log('=== RESULTS ===\n');

  // Display cash flows showing outside investor payments
  console.log('ANNUAL CASH FLOWS:');
  results.investorCashFlows.forEach(cf => {
    console.log(`Year ${cf.year}:`);
    console.log(`  NOI: $${cf.noi.toLocaleString()}`);
    console.log(`  Operating Cash Flow: $${cf.operatingCashFlow.toLocaleString()}`);
    if (cf.outsideInvestorCurrentPay > 0) {
      console.log(`  Outside Investor Interest Paid: -$${cf.outsideInvestorCurrentPay.toLocaleString()}`);
    }
    if (cf.outsideInvestorPIKAccrued > 0) {
      console.log(`  Outside Investor PIK Accrued: $${cf.outsideInvestorPIKAccrued.toLocaleString()}`);
    }
    console.log(`  Total Investor Cash Flow: $${cf.totalCashFlow.toLocaleString()}`);
    console.log('');
  });

  console.log('\n=== OUTSIDE INVESTOR DEBT SUMMARY ===\n');
  console.log(`Principal: $${(params.projectCost * params.outsideInvestorSubDebtPct / 100).toLocaleString()}`);
  console.log(`Total Cash Interest Paid: $${(results.outsideInvestorCashPaid || 0).toLocaleString()}`);
  console.log(`Total PIK Interest Accrued: $${((results.outsideInvestorTotalInterest || 0) - (results.outsideInvestorCashPaid || 0)).toLocaleString()}`);
  console.log(`Total Interest Cost: $${(results.outsideInvestorTotalInterest || 0).toLocaleString()}`);
  console.log(`Total Repayment at Exit: $${(results.outsideInvestorTotalCost || 0).toLocaleString()}`);

  console.log('\n=== IMPACT ON INVESTOR RETURNS ===\n');
  console.log(`Exit Value: $${results.exitValue.toLocaleString()}`);
  console.log(`Senior/Phil Debt at Exit: -$${results.remainingDebtAtExit.toLocaleString()}`);
  console.log(`HDC Sub-Debt at Exit: -$${results.subDebtAtExit.toLocaleString()}`);
  console.log(`Investor Sub-Debt at Exit: -$${results.investorSubDebtAtExit.toLocaleString()}`);
  console.log(`Outside Investor Sub-Debt at Exit: -$${results.outsideInvestorSubDebtAtExit.toLocaleString()}`);
  console.log(`Net Proceeds Available: $${results.totalExitProceeds.toLocaleString()}`);
  console.log(`Investor Share (${params.investorPromoteShare}%): $${results.exitProceeds.toLocaleString()}`);

  console.log('\n=== INVESTOR PERFORMANCE ===\n');
  console.log(`Total Investment: $${results.totalInvestment.toLocaleString()}`);
  console.log(`Total Returns: $${results.totalReturns.toLocaleString()}`);
  console.log(`Multiple: ${results.multiple.toFixed(2)}x`);
  console.log(`IRR: ${(results.irr * 100).toFixed(2)}%`);

} catch (error) {
  console.error('Error running test:', error);
  console.error(error.stack);
}