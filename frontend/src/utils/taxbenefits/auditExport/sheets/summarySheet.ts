/**
 * IMPL-056: Live Calculation Excel Model - Summary Sheet
 * IMPL-067: Added Returns Buildup section with component breakdown
 * ISS-038b: Added DSCR breakdown (Must-Pay, Phil) when applicable
 *
 * Sheet 13: Dashboard pulling key metrics with IRR/MOIC.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults, HDCAnalysisResults } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Summary dashboard sheet
 */
export function buildSummarySheet(
  params: CalculationParams,
  investorResults: InvestorAnalysisResults,
  hdcResults: HDCAnalysisResults
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;
  const investorEquityGross = projectCost * params.investorEquityPct / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;

  // IMPL-074/077: Get syndication offset and year from engine results
  const syndicationOffset = investorResults.syndicatedEquityOffset || 0;
  const syndicationYear = investorResults.stateLIHTCSyndicationYear ?? params.stateLIHTCSyndicationYear ?? 0;
  const investorEquityNet = investorEquityGross - syndicationOffset;
  // IMPL-077: Total Investment depends on syndication timing
  // Year 0: Net equity (syndicator funds offset at close)
  // Year 1+: Gross equity (investor funds full amount, gets capital return later)
  const totalInvestment = syndicationYear === 0
    ? investorEquityNet + investorSubDebt   // Year 0: net equity
    : investorEquityGross + investorSubDebt; // Year 1+: gross equity

  // ISS-038b: Show DSCR breakdown when PAB or Phil Current Pay is enabled
  const showDSCRBreakdown = params.pabEnabled || params.philCurrentPayEnabled;

  let currentRow = 1;

  // Header
  ws['A1'] = { t: 's', v: 'HDC TAX BENEFITS MODEL' };
  ws['A2'] = { t: 's', v: 'SUMMARY DASHBOARD' };
  ws['A3'] = { t: 's', v: '' };
  currentRow = 4;

  // === INVESTMENT ===
  ws[`A${currentRow}`] = { t: 's', v: '=== INVESTMENT ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Project Cost' };
  ws[`B${currentRow}`] = { t: 'n', v: projectCost, f: 'ProjectCost' } as FormulaCell;
  currentRow++;

  // IMPL-077: Show investment breakdown based on syndication timing
  if (syndicationOffset > 0 && syndicationYear === 0) {
    // Year 0 syndication: show gross/offset/net breakdown (MOIC uses net)
    ws[`A${currentRow}`] = { t: 's', v: 'Investor Equity (Gross)' };
    ws[`B${currentRow}`] = { t: 'n', v: investorEquityGross, f: 'InvestorEquity' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Less: Syndication Offset' };
    ws[`B${currentRow}`] = { t: 'n', v: -syndicationOffset, f: '-StateLIHTCSyndProceeds' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Net Investment (MOIC basis)' };
    ws[`B${currentRow}`] = { t: 'n', v: investorEquityNet, f: 'InvestorEquity-StateLIHTCSyndProceeds' } as FormulaCell;
    namedRanges.push({ name: 'SummaryNetInvestment', ref: `Summary!$B$${currentRow}` });
    currentRow++;
  } else if (syndicationOffset > 0 && syndicationYear > 0) {
    // Year 1+ syndication: investor funds full amount (MOIC uses gross)
    ws[`A${currentRow}`] = { t: 's', v: 'Investor Equity' };
    ws[`B${currentRow}`] = { t: 'n', v: investorEquityGross, f: 'InvestorEquity' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: `Syndication Return (Y${syndicationYear})` };
    ws[`B${currentRow}`] = { t: 'n', v: syndicationOffset, f: 'StateLIHTCSyndProceeds' } as FormulaCell;
    currentRow++;
  } else {
    ws[`A${currentRow}`] = { t: 's', v: 'Investor Equity' };
    ws[`B${currentRow}`] = { t: 'n', v: investorEquityGross, f: 'InvestorEquity' } as FormulaCell;
    currentRow++;
  }

  ws[`A${currentRow}`] = { t: 's', v: 'Total Investment' };
  ws[`B${currentRow}`] = { t: 'n', v: totalInvestment, f: 'InvTotalInvestment' } as FormulaCell;
  namedRanges.push({ name: 'SummaryTotalInvestment', ref: `Summary!$B$${currentRow}` });
  currentRow += 2;

  // === RETURNS ===
  ws[`A${currentRow}`] = { t: 's', v: '=== RETURNS ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Multiple (MOIC)' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.multiple, f: 'InvestorMOIC' } as FormulaCell;
  namedRanges.push({ name: 'SummaryMOIC', ref: `Summary!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor IRR' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.irr / 100, f: 'InvestorIRR' } as FormulaCell;
  namedRanges.push({ name: 'SummaryIRR', ref: `Summary!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Returns' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.totalReturns, f: 'InvTotalReturns' } as FormulaCell;
  namedRanges.push({ name: 'SummaryTotalReturns', ref: `Summary!$B$${currentRow}` });
  currentRow += 2;

  // === TAX BENEFITS ===
  ws[`A${currentRow}`] = { t: 's', v: '=== TAX BENEFITS ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Year 1 Tax Benefit' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.investorCashFlows[0]?.taxBenefit || 0, f: 'TaxBenefit_Y1' } as FormulaCell;
  namedRanges.push({ name: 'SummaryY1TaxBenefit', ref: `Summary!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total 10-Year Tax Benefits' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.investorTaxBenefits, f: 'TotalTaxBenefits' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total LIHTC Credits' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: 'TotalLIHTC' } as FormulaCell;
  currentRow += 2;

  // === DEBT METRICS ===
  ws[`A${currentRow}`] = { t: 's', v: '=== DEBT METRICS ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Year 1 DSCR' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.investorCashFlows[0]?.dscr || 0, f: 'DSCR_Y1' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Min DSCR' };
  ws[`B${currentRow}`] = { t: 'n', v: Math.min(...investorResults.investorCashFlows.map(cf => cf.dscr || 0).filter(d => d > 0)), f: 'MinDSCR' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Avg DSCR' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.investorCashFlows.reduce((s, cf) => s + (cf.dscr || 0), 0) / holdPeriod, f: 'AvgDSCR' } as FormulaCell;
  currentRow++;

  // ISS-038b: DSCR breakdown when PAB or Phil Current Pay is enabled
  if (showDSCRBreakdown) {
    // Min Must-Pay DSCR = NOI / (Senior + PAB) - true hard floor
    const minMustPayDSCR = Math.min(
      ...investorResults.investorCashFlows.map(cf => cf.mustPayDSCR || 0).filter(d => d > 0)
    );
    ws[`A${currentRow}`] = { t: 's', v: 'Min Must-Pay DSCR' };
    ws[`B${currentRow}`] = { t: 'n', v: minMustPayDSCR > 0 ? minMustPayDSCR : 0, f: 'MinMustPayDSCR' } as FormulaCell;
    ws[`C${currentRow}`] = { t: 's', v: '(Senior + PAB only)' };
    currentRow++;

    // Min Phil DSCR = NOI / (Senior + PAB + Phil) - Amazon 1.05x
    const minPhilDSCR = Math.min(
      ...investorResults.investorCashFlows.map(cf => cf.philDSCR || 0).filter(d => d > 0)
    );
    ws[`A${currentRow}`] = { t: 's', v: 'Min Phil DSCR' };
    ws[`B${currentRow}`] = { t: 'n', v: minPhilDSCR > 0 ? minPhilDSCR : 0, f: 'MinPhilDSCR' } as FormulaCell;
    ws[`C${currentRow}`] = { t: 's', v: '(incl. Phil current pay)' };
    currentRow++;
  }
  currentRow++; // Spacing before next section

  // === EXIT ===
  ws[`A${currentRow}`] = { t: 's', v: '=== EXIT ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Exit Value' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.exitValue, f: 'ExitValue' } as FormulaCell;
  namedRanges.push({ name: 'SummaryExitValue', ref: `Summary!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Exit Proceeds' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.exitProceeds, f: 'TotalToInvestor' } as FormulaCell;
  currentRow++;

  // ISS-070W: Calculate HDC exit proceeds to match Excel TotalToHDC formula
  // Excel: TotalToHDC = Profit × HDCPromoteShare%
  // where Profit = GrossExitProceeds - RemainingCapitalToRecover
  // CRITICAL: Use investorResults.grossExitProceeds (same as Excel), NOT hdcResults values
  const hdcPromoteSharePct = 100 - params.investorPromoteShare;
  const grossAfterDebt = investorResults.grossExitProceeds || 0;
  const remainingROC = investorResults.remainingCapitalToRecover ?? 0;
  const profit = Math.max(0, grossAfterDebt - remainingROC);
  const hdcExitProceedsCalc = profit * (hdcPromoteSharePct / 100);

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Exit Proceeds' };
  ws[`B${currentRow}`] = { t: 'n', v: hdcExitProceedsCalc, f: 'TotalToHDC' } as FormulaCell;
  currentRow += 2;

  // === HDC ===
  ws[`A${currentRow}`] = { t: 's', v: '=== HDC ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total HDC Returns' };
  ws[`B${currentRow}`] = { t: 'n', v: hdcResults.totalHDCReturns, f: 'TotalHDCReturns' } as FormulaCell;
  namedRanges.push({ name: 'SummaryHDCReturns', ref: `Summary!$B$${currentRow}` });
  currentRow += 2;

  // === OZ BENEFITS ===
  if (params.ozEnabled) {
    ws[`A${currentRow}`] = { t: 's', v: '=== OZ BENEFITS ===' };
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Step-Up Savings (Year 5)' };
    ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozStepUpSavings || 0, f: 'OZStepUpSavings' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Appreciation Exclusion' };
    ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozExitAppreciation || 0, f: 'OZAppreciationExclusion' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Recapture Avoided' };
    ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozRecaptureAvoided || 0, f: 'OZRecaptureAvoided' } as FormulaCell;
    currentRow += 2;
  }

  // === RETURNS BUILDUP (IMPL-067) ===
  // All values from engine - mirrors UI ReturnsBuiltupStrip component
  ws[`A${currentRow}`] = { t: 's', v: '=== RETURNS BUILDUP ===' };
  currentRow++;

  // Calculate aggregates from cash flows (same logic as ReturnsBuiltupStrip)
  const cashFlows = investorResults.investorCashFlows || [];

  // Federal LIHTC: sum from cash flows + remaining credits
  const federalLIHTCFromCF = cashFlows.reduce((sum, cf) => sum + (cf.federalLIHTCCredit || 0), 0);
  const remainingLIHTCCredits = investorResults.remainingLIHTCCredits || 0;
  const federalLIHTCTotal = federalLIHTCFromCF + remainingLIHTCCredits;

  // State LIHTC: sum from cash flows
  const stateLIHTCTotal = cashFlows.reduce((sum, cf) => sum + (cf.stateLIHTCCredit || 0), 0);

  // ISS-020: State LIHTC Syndication Proceeds (capital return)
  const syndicationProceedsTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.stateLIHTCSyndicationProceeds || 0),
    0
  );

  // ISS-052: Operating Cash Flow should NOT include excess reserve (shown separately)
  // This ensures it matches Waterfall "After AUM" total
  const excessReserveTotal = cashFlows.reduce((sum, cf) => sum + (cf.excessReserveDistribution || 0), 0);
  const operatingCashTotal = investorResults.investorOperatingCashFlows || 0;

  // OZ Benefits total (from engine values)
  const ozBenefitsTotal = (investorResults.ozStepUpSavings || 0) +
                          (investorResults.ozExitAppreciation || 0) +
                          (investorResults.ozRecaptureAvoided || 0) +
                          (investorResults.ozDeferralNPV || 0);

  // Sub-debt returns
  const subDebtAtExit = investorResults.investorSubDebtAtExit || 0;
  const subDebtInterestReceived = investorResults.investorSubDebtInterestReceived || 0;

  // Components
  ws[`A${currentRow}`] = { t: 's', v: 'Federal LIHTC' };
  ws[`B${currentRow}`] = { t: 'n', v: federalLIHTCTotal };
  currentRow++;

  if (stateLIHTCTotal > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'State LIHTC' };
    ws[`B${currentRow}`] = { t: 'n', v: stateLIHTCTotal };
    currentRow++;
  }

  // ISS-020: State LIHTC Syndication (capital return when syndicated)
  if (syndicationProceedsTotal > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'State LIHTC Syndication' };
    ws[`B${currentRow}`] = { t: 'n', v: syndicationProceedsTotal };
    currentRow++;
  }

  ws[`A${currentRow}`] = { t: 's', v: 'Depreciation Benefits' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.investorTaxBenefits || 0 };
  currentRow++;

  if (ozBenefitsTotal > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'OZ Benefits (total)' };
    ws[`B${currentRow}`] = { t: 'n', v: ozBenefitsTotal };
    currentRow++;

    // Sub-components
    if ((investorResults.ozStepUpSavings || 0) > 0) {
      ws[`A${currentRow}`] = { t: 's', v: '  └ Step-Up Savings' };
      ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozStepUpSavings || 0 };
      currentRow++;
    }
    if ((investorResults.ozExitAppreciation || 0) > 0) {
      ws[`A${currentRow}`] = { t: 's', v: '  └ Appreciation Exclusion' };
      ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozExitAppreciation || 0 };
      currentRow++;
    }
    if ((investorResults.ozDeferralNPV || 0) > 0) {
      ws[`A${currentRow}`] = { t: 's', v: '  └ Deferral NPV' };
      ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozDeferralNPV || 0 };
      currentRow++;
    }
    if ((investorResults.ozRecaptureAvoided || 0) > 0) {
      ws[`A${currentRow}`] = { t: 's', v: '  └ Recapture Avoided' };
      ws[`B${currentRow}`] = { t: 'n', v: investorResults.ozRecaptureAvoided || 0 };
      currentRow++;
    }
  }

  if (operatingCashTotal > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'Operating Cash Flow' };
    ws[`B${currentRow}`] = { t: 'n', v: operatingCashTotal };
    currentRow++;
  }

  // ISS-052: Show excess reserve distribution as separate line item
  if (excessReserveTotal > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'Excess Reserve Distribution' };
    ws[`B${currentRow}`] = { t: 'n', v: excessReserveTotal };
    currentRow++;
  }

  if (subDebtInterestReceived > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'Sub-Debt Interest Received' };
    ws[`B${currentRow}`] = { t: 'n', v: subDebtInterestReceived };
    currentRow++;
  }

  ws[`A${currentRow}`] = { t: 's', v: 'Exit Proceeds' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.exitProceeds || 0 };
  currentRow++;

  if (subDebtAtExit > 0) {
    ws[`A${currentRow}`] = { t: 's', v: 'Sub-Debt Repayment at Exit' };
    ws[`B${currentRow}`] = { t: 'n', v: subDebtAtExit };
    currentRow++;
  }

  // Separator
  ws[`A${currentRow}`] = { t: 's', v: '────────────────────────────' };
  currentRow++;

  // Total Returns
  ws[`A${currentRow}`] = { t: 's', v: 'TOTAL RETURNS' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.totalReturns || 0 };
  namedRanges.push({ name: 'ReturnsBuildup_Total', ref: `Summary!$B$${currentRow}` });
  currentRow++;

  // Validation: Calculate component sum (ISS-052: excess reserve now separate)
  const componentSum = federalLIHTCTotal + stateLIHTCTotal + syndicationProceedsTotal +
                       (investorResults.investorTaxBenefits || 0) +
                       ozBenefitsTotal + operatingCashTotal + excessReserveTotal +
                       subDebtInterestReceived +
                       (investorResults.exitProceeds || 0) +
                       subDebtAtExit;
  const totalReturns = investorResults.totalReturns || 0;
  const discrepancy = Math.abs(componentSum - totalReturns);

  ws[`A${currentRow}`] = { t: 's', v: 'Validation: Sum = Total' };
  ws[`B${currentRow}`] = { t: 's', v: discrepancy < 1000 ? '✓ MATCH' : `✗ Δ${(discrepancy / 1000000).toFixed(2)}M` };
  currentRow += 2;

  // === CAPITAL STACK VALIDATION ===
  ws[`A${currentRow}`] = { t: 's', v: '=== CAPITAL STACK VALIDATION ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Sources - Uses' };
  const sourcesMinusUses = 0; // Should always be 0
  ws[`B${currentRow}`] = { t: 'n', v: sourcesMinusUses, f: 'TotalSources-ProjectCost' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Status' };
  ws[`B${currentRow}`] = { t: 's', v: '✓ BALANCED', f: 'IF(ABS(B' + (currentRow - 1) + ')<0.001,"✓ BALANCED","✗ ERROR")' };

  // Set sheet range (ISS-038b: include column C for notes when DSCR breakdown shown)
  ws['!ref'] = showDSCRBreakdown ? `A1:C${currentRow}` : `A1:B${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Label
    { wch: 20 }, // Value
    { wch: 22 }, // Notes (ISS-038b)
  ];

  return { sheet: ws, namedRanges };
}
