// Debug script to find HDC sub-debt 1% crash
import { calculateFullInvestorAnalysis } from './src/utils/HDCCalculator/calculations.js';
import { DEFAULT_VALUES } from './src/utils/HDCCalculator/index.js';

// Simulate exactly what happens when user enters 1% in HDC sub-debt
const projectCost = DEFAULT_VALUES.PROJECT_COST;
const landValue = DEFAULT_VALUES.LAND_VALUE;
const yearOneDepreciationPct = DEFAULT_VALUES.YEAR_ONE_DEPRECIATION_PCT;
const effectiveTaxRate = DEFAULT_VALUES.FEDERAL_TAX_RATE; // Just federal for now
const hdcFeeRate = DEFAULT_VALUES.HDC_FEE_RATE;
const holdPeriod = 10;

// Calculate depreciation and tax values
const depreciableBasis = projectCost - landValue;
const yearOneDepreciation = depreciableBasis * (yearOneDepreciationPct / 100);
const remainingDepreciableBasis = depreciableBasis - yearOneDepreciation;
const annualStraightLineDepreciation = remainingDepreciableBasis / 26.5;
const years2toNDepreciation = annualStraightLineDepreciation * (holdPeriod - 1);
const total10YearDepreciation = yearOneDepreciation + years2toNDepreciation;
const totalTaxBenefit = total10YearDepreciation * (effectiveTaxRate / 100);
const hdcFee = totalTaxBenefit * (hdcFeeRate / 100);
const netTaxBenefit = totalTaxBenefit - hdcFee;

// Start with default capital structure
let investorEquityPct = DEFAULT_VALUES.INVESTOR_EQUITY_PCT;
let philanthropicEquityPct = DEFAULT_VALUES.PHILANTHROPIC_EQUITY_PCT;
const seniorDebtPct = DEFAULT_VALUES.SENIOR_DEBT_PCT;
const philDebtPct = DEFAULT_VALUES.PHIL_DEBT_PCT;
const hdcSubDebtPct = 1; // User enters 1%
const investorSubDebtPct = 0;

// Auto-balance logic (from useHDCState)
const investorEquityRatio = DEFAULT_VALUES.INVESTOR_EQUITY_RATIO;
const totalDebt = seniorDebtPct + philDebtPct + hdcSubDebtPct + investorSubDebtPct;
const remainingForEquity = Math.max(0, 100 - totalDebt);

if (remainingForEquity <= 0) {
  investorEquityPct = 0;
  philanthropicEquityPct = 0;
} else {
  investorEquityPct = remainingForEquity * (investorEquityRatio / 100);
  philanthropicEquityPct = remainingForEquity - investorEquityPct;
}

console.log('Capital Structure after auto-balance:');
console.log('  Investor Equity:', investorEquityPct.toFixed(2) + '%');
console.log('  Philanthropic Equity:', philanthropicEquityPct.toFixed(2) + '%');
console.log('  Senior Debt:', seniorDebtPct + '%');
console.log('  Phil Debt:', philDebtPct + '%');
console.log('  HDC Sub-debt:', hdcSubDebtPct + '%');
console.log('  Total:', (investorEquityPct + philanthropicEquityPct + seniorDebtPct + philDebtPct + hdcSubDebtPct).toFixed(2) + '%');

const params = {
  projectCost,
  yearOneNOI: DEFAULT_VALUES.YEAR_ONE_NOI,
  revenueGrowth: DEFAULT_VALUES.REVENUE_GROWTH,
  expenseGrowth: DEFAULT_VALUES.EXPENSE_GROWTH,
  exitCapRate: DEFAULT_VALUES.EXIT_CAP_RATE,
  hdcFeeRate,
  investorPromoteShare: DEFAULT_VALUES.INVESTOR_PROMOTE_SHARE,
  investorEquityPct,
  philanthropicEquityPct,
  seniorDebtPct,
  philanthropicDebtPct: philDebtPct,
  hdcSubDebtPct,
  investorSubDebtPct,
  hdcSubDebtPikRate: DEFAULT_VALUES.HDC_SUB_DEBT_PIK_RATE,
  pikCurrentPayEnabled: false,
  pikCurrentPayPct: DEFAULT_VALUES.PIK_CURRENT_PAY_PCT,
  holdPeriod,
  opexRatio: DEFAULT_VALUES.OPEX_RATIO,
  yearOneDepreciation,
  annualStraightLineDepreciation,
  effectiveTaxRate,
  landValue,
  yearOneDepreciationPct,
  seniorDebtRate: DEFAULT_VALUES.SENIOR_DEBT_RATE,
  seniorDebtAmortization: DEFAULT_VALUES.SENIOR_DEBT_AMORTIZATION,
  philanthropicDebtRate: DEFAULT_VALUES.PHIL_DEBT_RATE,
  philDebtAmortization: DEFAULT_VALUES.PHIL_DEBT_AMORTIZATION,
  philCurrentPayEnabled: false,
  aumFeeEnabled: false,
  aumFeeRate: DEFAULT_VALUES.AUM_FEE_RATE,
  interestReserveEnabled: false,
  hdcFee,
  netTaxBenefit,
  totalTaxBenefit
};

console.log('\nCalling calculateFullInvestorAnalysis...');
try {
  const result = calculateFullInvestorAnalysis(params);
  console.log('Success! Result:', {
    totalInvestment: result.totalInvestment,
    multipleOnInvested: result.multipleOnInvested,
    irr: result.irr
  });
} catch (error) {
  console.error('ERROR:', error);
  console.error('Stack:', error.stack);
}