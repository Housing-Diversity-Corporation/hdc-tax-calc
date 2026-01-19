/**
 * IMPL-056: Live Calculation Excel Model - Summary Sheet
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
  const investorEquity = projectCost * params.investorEquityPct / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;
  const totalInvestment = investorEquity + investorSubDebt;

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

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Equity' };
  ws[`B${currentRow}`] = { t: 'n', v: investorEquity, f: 'InvestorEquity' } as FormulaCell;
  currentRow++;

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
  currentRow += 2;

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

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Exit Proceeds' };
  ws[`B${currentRow}`] = { t: 'n', v: hdcResults.hdcExitProceeds, f: 'TotalToHDC' } as FormulaCell;
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

  // === CAPITAL STACK VALIDATION ===
  ws[`A${currentRow}`] = { t: 's', v: '=== CAPITAL STACK VALIDATION ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Sources - Uses' };
  const sourcesMinusUses = 0; // Should always be 0
  ws[`B${currentRow}`] = { t: 'n', v: sourcesMinusUses, f: 'TotalSources-ProjectCost' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Status' };
  ws[`B${currentRow}`] = { t: 's', v: '✓ BALANCED', f: 'IF(ABS(B' + (currentRow - 1) + ')<0.001,"✓ BALANCED","✗ ERROR")' };

  // Set sheet range
  ws['!ref'] = `A1:B${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Label
    { wch: 20 }, // Value
  ];

  return { sheet: ws, namedRanges };
}
