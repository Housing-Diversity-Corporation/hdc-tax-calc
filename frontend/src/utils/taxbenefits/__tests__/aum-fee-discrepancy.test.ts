import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';

describe('AUM Fee Discrepancy Investigation', () => {
  // Base parameters that should generate ~$6M in AUM fees
  const baseParams = {
    projectCost: 50000000,
    landValue: 10000000,
    yearOneNOI: 2500000,
    yearOneDepreciationPct: 60,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6,
    investorEquityPct: 30,
    hdcFeeRate: 0,
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
    constructionDelayMonths: 0,
    yearOneDepreciation: 24000000,
    annualStraightLineDepreciation: 1454545,
    effectiveTaxRate: 47.9,
    interestReserveEnabled: false,
    interestReserveMonths: 12,
    philanthropicEquityPct: 0,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    investorSubDebtPikRate: 0,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 0
  };

  test('Verify AUM fee impact matches collection', () => {
    // Calculate without AUM fees
    const withoutAUM = calculateFullInvestorAnalysis({
      ...baseParams,
      aumFeeEnabled: false,
      aumFeeRate: 0
    });

    const hdcWithoutAUM = calculateHDCAnalysis({
      ...baseParams,
      aumFeeEnabled: false,
      aumFeeRate: 0
    });

    // Calculate with AUM fees to generate ~$6M
    const aumRate = 1.3; // Adjust to get close to $6M total
    const withAUM = calculateFullInvestorAnalysis({
      ...baseParams,
      aumFeeEnabled: true,
      aumFeeRate: aumRate
    });

    const hdcWithAUM = calculateHDCAnalysis({
      ...baseParams,
      aumFeeEnabled: true,
      aumFeeRate: aumRate
    });

    console.log('\n=== AUM FEE DISCREPANCY INVESTIGATION ===\n');
    console.log('AUM Fee Rate:', aumRate + '%');

    // Calculate theoretical AUM fees
    const projectCostWithReserve = baseParams.projectCost;
    const annualAUMFee = projectCostWithReserve * (aumRate / 100);
    const theoreticalTotal = annualAUMFee * 9; // Years 2-10

    console.log('\n--- THEORETICAL AUM FEES ---');
    console.log('Annual AUM Fee:', (annualAUMFee / 1000000).toFixed(2), 'M');
    console.log('9-Year Total (theoretical):', (theoreticalTotal / 1000000).toFixed(2), 'M');

    console.log('\n--- ACTUAL HDC COLLECTION ---');
    console.log('HDC AUM Fee Income:', (hdcWithAUM.hdcAumFeeIncome / 1000000).toFixed(2), 'M');
    console.log('HDC Total Returns (with AUM):', (hdcWithAUM.totalHDCReturns / 1000000).toFixed(2), 'M');
    console.log('HDC Total Returns (without AUM):', (hdcWithoutAUM.totalHDCReturns / 1000000).toFixed(2), 'M');
    console.log('HDC Gain from AUM:', ((hdcWithAUM.totalHDCReturns - hdcWithoutAUM.totalHDCReturns) / 1000000).toFixed(2), 'M');

    console.log('\n--- INVESTOR IMPACT ---');
    console.log('Investor Returns (without AUM):', (withoutAUM.totalReturns / 1000000).toFixed(2), 'M');
    console.log('Investor Returns (with AUM):', (withAUM.totalReturns / 1000000).toFixed(2), 'M');
    console.log('Investor Loss from AUM:', ((withoutAUM.totalReturns - withAUM.totalReturns) / 1000000).toFixed(2), 'M');

    // Check the discrepancy
    const hdcGain = hdcWithAUM.hdcAumFeeIncome;
    const investorLoss = withoutAUM.totalReturns - withAUM.totalReturns;
    const discrepancy = hdcGain - investorLoss;

    console.log('\n--- DISCREPANCY ANALYSIS ---');
    console.log('HDC Collects (AUM fees):', (hdcGain / 1000000).toFixed(2), 'M');
    console.log('Investor Loses:', (investorLoss / 1000000).toFixed(2), 'M');
    console.log('DISCREPANCY:', (discrepancy / 1000000).toFixed(2), 'M');

    if (Math.abs(discrepancy) > 100000) { // More than $100k discrepancy
      console.log('\n⚠️  SIGNIFICANT DISCREPANCY DETECTED!');
      console.log('The AUM fees collected by HDC do not match the reduction in investor returns.');

      // Investigate where the money is going
      console.log('\n--- INVESTIGATING CASH FLOWS ---');

      // Check exit proceeds
      const exitDiffInvestor = withoutAUM.exitProceeds - withAUM.exitProceeds;
      console.log('Investor Exit Proceeds Difference:', (exitDiffInvestor / 1000000).toFixed(2), 'M');

      // Check operating cash flows
      const opCashDiffInvestor = withoutAUM.investorOperatingCashFlows - withAUM.investorOperatingCashFlows;
      console.log('Investor Operating Cash Flow Difference:', (opCashDiffInvestor / 1000000).toFixed(2), 'M');

      // Check if AUM fees at exit are being paid
      const accumulatedAumFees = withAUM.investorCashFlows.reduce((sum, cf) =>
        sum + (cf.aumFeeAccrued || 0), 0
      );
      console.log('Accumulated Unpaid AUM Fees:', (accumulatedAumFees / 1000000).toFixed(2), 'M');

      // Check promote split impact
      console.log('\n--- PROMOTE SPLIT ANALYSIS ---');
      console.log('Investor Promote Share:', baseParams.investorPromoteShare + '%');
      console.log('HDC Promote Share:', (100 - baseParams.investorPromoteShare) + '%');

      // The issue might be that AUM fees reduce cash available for distribution
      // But at exit, the promote split means HDC gets 65% of the reduction
      // So investor only loses 35% of the AUM fee impact at exit
      const exitImpact = accumulatedAumFees * (baseParams.investorPromoteShare / 100);
      console.log('Investor\'s share of exit reduction from accumulated AUM:', (exitImpact / 1000000).toFixed(2), 'M');
    }

    // Year by year analysis
    console.log('\n--- YEAR-BY-YEAR BREAKDOWN ---');
    for (let i = 0; i < withAUM.investorCashFlows.length && i < 5; i++) {
      const cfWith = withAUM.investorCashFlows[i];
      const cfWithout = withoutAUM.investorCashFlows[i];
      console.log(`\nYear ${cfWith.year}:`);
      console.log('  AUM Fee Amount:', ((cfWith.aumFeeAmount || 0) / 1000000).toFixed(2), 'M');
      console.log('  AUM Fee Paid:', ((cfWith.aumFeePaid || 0) / 1000000).toFixed(2), 'M');
      console.log('  AUM Fee Accrued:', ((cfWith.aumFeeAccrued || 0) / 1000000).toFixed(2), 'M');
      console.log('  Investor Cash (with AUM):', (cfWith.operatingCashFlow / 1000000).toFixed(2), 'M');
      console.log('  Investor Cash (without AUM):', (cfWithout.operatingCashFlow / 1000000).toFixed(2), 'M');
      console.log('  Difference:', ((cfWithout.operatingCashFlow - cfWith.operatingCashFlow) / 1000000).toFixed(2), 'M');
    }
  });
});