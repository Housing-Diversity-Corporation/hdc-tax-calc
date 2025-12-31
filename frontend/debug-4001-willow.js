// Debug script for 4001 Willow IRR calculation
const { calculateFullInvestorAnalysis } = require('./src/utils/HDCCalculator/calculations.ts');

// 4001 Willow parameters from propertyPresets.ts
const willowParams = {
  projectCost: 67, // $67M
  landValue: 3.514, // $3.514M
  yearOneNOI: 3.417, // $3.417M
  yearOneDepreciationPct: 25, // 25%
  revenueGrowth: 3,
  opexRatio: 25,
  exitCapRate: 6,
  investorEquityPct: 4, // 4%
  philanthropicEquityPct: 0,
  seniorDebtPct: 67, // 67%
  seniorDebtRate: 5, // 5%
  seniorDebtAmortization: 35,
  philDebtPct: 29, // 29%  
  philDebtRate: 4, // 4%
  philDebtAmortization: 30,
  hdcSubDebtPct: 0,
  hdcSubDebtPikRate: 8,
  investorSubDebtPct: 0,
  investorSubDebtPikRate: 8,
  federalTaxRate: 37,
  selectedState: 'NY',
  stateCapitalGainsRate: 10.9,
  ltCapitalGainsRate: 20,
  niitRate: 3.8,
  depreciationRecaptureRate: 25,
  deferredGains: 10,
  hdcFeeRate: 10, // 10% HDC fee
  aumFeeEnabled: false,
  aumFeeRate: 1,
  investorPromoteShare: 35, // 35% investor share
  
  // Need to calculate these values
  hdcAdvanceFinancing: false, // Assuming false
  holdPeriod: 10,
  
  // Calculate derived values
  expenseGrowth: 3, // Assumed to match revenue growth
  hdcFee: 0, // Will calculate
  netTaxBenefit: 0, // Will calculate
};

// Convert millions to actual dollars
const paramsInDollars = { ...willowParams };
paramsInDollars.projectCost *= 1000000;
paramsInDollars.landValue *= 1000000;
paramsInDollars.yearOneNOI *= 1000000;

console.log('4001 Willow Debug Analysis');
console.log('==========================');

// Calculate investor equity
const investorEquity = paramsInDollars.projectCost * (paramsInDollars.investorEquityPct / 100);
console.log(`Project Cost: $${(paramsInDollars.projectCost / 1000000).toFixed(1)}M`);
console.log(`Investor Equity: $${(investorEquity / 1000000).toFixed(2)}M`);

// Calculate depreciable basis
const depreciableBasis = paramsInDollars.projectCost - paramsInDollars.landValue;
console.log(`Depreciable Basis: $${(depreciableBasis / 1000000).toFixed(2)}M`);

// Calculate Year 1 depreciation
const year1Depreciation = depreciableBasis * (paramsInDollars.yearOneDepreciationPct / 100);
console.log(`Year 1 Depreciation: $${(year1Depreciation / 1000000).toFixed(2)}M`);

// Calculate effective tax rate
const effectiveTaxRate = paramsInDollars.federalTaxRate + paramsInDollars.stateCapitalGainsRate + paramsInDollars.niitRate;
console.log(`Effective Tax Rate: ${effectiveTaxRate}%`);

// Calculate gross tax benefit
const grossTaxBenefit = year1Depreciation * (effectiveTaxRate / 100);
console.log(`Gross Tax Benefit: $${(grossTaxBenefit / 1000000).toFixed(2)}M`);

// Calculate HDC fee
const hdcFee = grossTaxBenefit * (paramsInDollars.hdcFeeRate / 100);
console.log(`HDC Fee: $${(hdcFee / 1000000).toFixed(2)}M`);

// Calculate net tax benefit
const netTaxBenefit = grossTaxBenefit - hdcFee;
console.log(`Net Tax Benefit: $${(netTaxBenefit / 1000000).toFixed(2)}M`);

// Calculate coverage
const coverage = (netTaxBenefit / investorEquity) * 100;
console.log(`Coverage: ${coverage.toFixed(0)}%`);

// Set the calculated values
paramsInDollars.year1NetBenefit = netTaxBenefit;
paramsInDollars.hdcFee = hdcFee;
paramsInDollars.effectiveTaxRate = effectiveTaxRate;

console.log('\nExpected IRR based on coverage:');
if (coverage > 250) {
  console.log('With >250% coverage, IRR should be ~94%+');
} else if (coverage > 200) {
  console.log('With >200% coverage, IRR should be ~75%+');
} else if (coverage > 150) {
  console.log('With >150% coverage, IRR should be ~50%+');
}

// Now try to run the analysis
try {
  const analysis = calculateFullInvestorAnalysis(paramsInDollars);
  
  console.log('\nActual Analysis Results:');
  console.log('========================');
  console.log(`IRR: ${analysis.irr.toFixed(1)}%`);
  console.log(`Multiple: ${analysis.multiple.toFixed(2)}x`);
  console.log(`Year 1 Tax Benefit to Investor: $${(analysis.investorCashFlows[0].taxBenefit / 1000000).toFixed(2)}M`);
  console.log(`Year 1 Total Cash Flow: $${(analysis.investorCashFlows[0].totalCashFlow / 1000000).toFixed(2)}M`);
  
  // Check if IRR matches expected
  if (analysis.irr < 50 && coverage > 200) {
    console.log('\n❌ WARNING: IRR is too low for the coverage ratio!');
    console.log('This indicates a potential waterfall bug.');
  } else {
    console.log('\n✅ IRR seems reasonable for the coverage ratio.');
  }
  
} catch (error) {
  console.error('Error running analysis:', error);
}