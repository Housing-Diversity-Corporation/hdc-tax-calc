/**
 * IMPL-056: Live Calculation Excel Model - Exit Sheet
 *
 * Sheet 10: Exit value calculation and equity waterfall.
 * Includes debt payoff priority and investor/HDC split.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Exit sheet with waterfall
 */
export function buildExitSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;
  const investorEquity = projectCost * params.investorEquityPct / 100;
  const promotePct = (100 - params.investorPromoteShare) / 100;
  const hurdleRate = 8; // Default hurdle rate

  // Get exit values from results
  const exitValue = results.exitValue || 0;
  const seniorBalanceAtExit = results.remainingDebtAtExit || 0;
  const philBalanceAtExit = projectCost * (params.philanthropicDebtPct || 0) / 100;
  const hdcSubDebtAtExit = results.subDebtAtExit || 0;
  const invSubDebtAtExit = results.investorSubDebtAtExit || 0;
  const outsideSubDebtAtExit = results.outsideInvestorSubDebtAtExit || 0;

  let currentRow = 1;

  // Header
  ws['A1'] = { t: 's', v: 'EXIT CALCULATION' };
  ws['A2'] = { t: 's', v: '' };
  currentRow = 3;

  // Exit Value Calculation
  ws[`A${currentRow}`] = { t: 's', v: 'Final Year NOI' };
  ws[`B${currentRow}`] = { t: 'n', v: results.exitValue ? results.exitValue * (params.exitCapRate / 100) : 0, f: `NOI_Y${holdPeriod}` } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Exit Cap Rate' };
  ws[`B${currentRow}`] = { t: 'n', v: params.exitCapRate / 100, f: 'ExitCapRate/100' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Exit Value' };
  ws[`B${currentRow}`] = { t: 'n', v: exitValue, f: `B${currentRow - 2}/B${currentRow - 1}` } as FormulaCell;
  namedRanges.push({ name: 'ExitValue', ref: `Exit!$B$${currentRow}` });
  const exitValueRow = currentRow;
  currentRow += 2;

  // Debt Payoff Section
  ws[`A${currentRow}`] = { t: 's', v: '=== DEBT PAYOFF ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Senior Debt Balance' };
  ws[`B${currentRow}`] = { t: 'n', v: seniorBalanceAtExit, f: 'SeniorBalanceAtExit' } as FormulaCell;
  const seniorRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Phil Debt Balance' };
  ws[`B${currentRow}`] = { t: 'n', v: philBalanceAtExit, f: 'PhilBalanceAtExit' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Hard Debt' };
  ws[`B${currentRow}`] = { t: 'n', v: seniorBalanceAtExit + philBalanceAtExit, f: `B${seniorRow}+B${seniorRow + 1}` } as FormulaCell;
  const hardDebtRow = currentRow;
  currentRow += 2;

  ws[`A${currentRow}`] = { t: 's', v: 'Gross After Hard Debt' };
  ws[`B${currentRow}`] = { t: 'n', v: exitValue - seniorBalanceAtExit - philBalanceAtExit, f: `B${exitValueRow}-B${hardDebtRow}` } as FormulaCell;
  const grossAfterHardRow = currentRow;
  currentRow += 2;

  // Sub-Debt Payoff Section
  ws[`A${currentRow}`] = { t: 's', v: '=== SUB-DEBT PAYOFF ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Sub-Debt Balance' };
  ws[`B${currentRow}`] = { t: 'n', v: hdcSubDebtAtExit, f: 'HDCSubDebtAtExit' } as FormulaCell;
  const hdcSubRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Sub-Debt Balance' };
  ws[`B${currentRow}`] = { t: 'n', v: invSubDebtAtExit, f: 'InvestorSubDebtAtExit' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Outside Sub-Debt Balance' };
  ws[`B${currentRow}`] = { t: 'n', v: outsideSubDebtAtExit, f: 'OutsideSubDebtAtExit' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Sub-Debt' };
  ws[`B${currentRow}`] = { t: 'n', v: hdcSubDebtAtExit + invSubDebtAtExit + outsideSubDebtAtExit, f: `SUM(B${hdcSubRow}:B${currentRow - 1})` } as FormulaCell;
  const totalSubDebtRow = currentRow;
  currentRow += 2;

  ws[`A${currentRow}`] = { t: 's', v: 'Gross After All Debt' };
  ws[`B${currentRow}`] = { t: 'n', v: exitValue - seniorBalanceAtExit - philBalanceAtExit - hdcSubDebtAtExit - invSubDebtAtExit - outsideSubDebtAtExit, f: `B${grossAfterHardRow}-B${totalSubDebtRow}` } as FormulaCell;
  const grossAfterAllDebtRow = currentRow;
  currentRow += 2;

  // Deferred Fees Section
  ws[`A${currentRow}`] = { t: 's', v: '=== DEFERRED FEES ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Deferred AUM Balance' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: 'DeferredAUMAtExit' } as FormulaCell;
  const deferredAUMRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Net After Fees' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${grossAfterAllDebtRow}-B${deferredAUMRow}` } as FormulaCell;
  const netAfterFeesRow = currentRow;
  currentRow += 2;

  // Equity Waterfall Section
  ws[`A${currentRow}`] = { t: 's', v: '=== EQUITY WATERFALL ===' };
  currentRow++;

  // Step 1: Return of Capital
  ws[`A${currentRow}`] = { t: 's', v: 'Step 1: Return of Capital' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor ROC' };
  ws[`B${currentRow}`] = { t: 'n', v: Math.min(results.exitProceeds, investorEquity), f: `MIN(B${netAfterFeesRow},InvestorEquity)` } as FormulaCell;
  namedRanges.push({ name: 'InvestorROC', ref: `Exit!$B$${currentRow}` });
  const invROCRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Remaining' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${netAfterFeesRow}-B${invROCRow}` } as FormulaCell;
  const afterROCRow = currentRow;
  currentRow += 2;

  // Step 2: Preferred Return
  ws[`A${currentRow}`] = { t: 's', v: 'Step 2: Preferred Return' };
  currentRow++;

  const prefReturnTarget = investorEquity * hurdleRate / 100 * holdPeriod;
  ws[`A${currentRow}`] = { t: 's', v: 'Pref Return Target' };
  ws[`B${currentRow}`] = { t: 'n', v: prefReturnTarget, f: `InvestorEquity*PromoteHurdleRate/100*HoldPeriod` } as FormulaCell;
  const prefTargetRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Pref Paid' };
  ws[`B${currentRow}`] = { t: 'n', v: Math.min(prefReturnTarget, Math.max(0, results.exitProceeds - investorEquity)), f: `MIN(B${afterROCRow},B${prefTargetRow})` } as FormulaCell;
  namedRanges.push({ name: 'InvestorPrefPaid', ref: `Exit!$B$${currentRow}` });
  const prefPaidRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Remaining' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${afterROCRow}-B${prefPaidRow}` } as FormulaCell;
  const afterPrefRow = currentRow;
  currentRow += 2;

  // Step 3: Catch-Up
  ws[`A${currentRow}`] = { t: 's', v: 'Step 3: Catch-Up' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Catch-Up Target' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `(B${invROCRow}+B${prefPaidRow})*PromotePct/100/(1-PromotePct/100)` } as FormulaCell;
  const catchupTargetRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Catch-Up Paid' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `MIN(B${afterPrefRow},B${catchupTargetRow})` } as FormulaCell;
  namedRanges.push({ name: 'HDCCatchUpPaid', ref: `Exit!$B$${currentRow}` });
  const catchupPaidRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Remaining' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${afterPrefRow}-B${catchupPaidRow}` } as FormulaCell;
  const afterCatchupRow = currentRow;
  currentRow += 2;

  // Step 4: Promote Split
  ws[`A${currentRow}`] = { t: 's', v: 'Step 4: Promote Split' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Promote Share' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${afterCatchupRow}*(1-PromotePct/100)` } as FormulaCell;
  namedRanges.push({ name: 'InvestorPromoteShare', ref: `Exit!$B$${currentRow}` });
  const invPromoteRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Promote Share' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${afterCatchupRow}*PromotePct/100` } as FormulaCell;
  namedRanges.push({ name: 'HDCPromoteShare', ref: `Exit!$B$${currentRow}` });
  const hdcPromoteRow = currentRow;
  currentRow += 2;

  // Totals Section
  ws[`A${currentRow}`] = { t: 's', v: '=== TOTALS ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total to Investor' };
  ws[`B${currentRow}`] = { t: 'n', v: results.exitProceeds, f: `B${invROCRow}+B${prefPaidRow}+B${invPromoteRow}` } as FormulaCell;
  namedRanges.push({ name: 'TotalToInvestor', ref: `Exit!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total to HDC' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${catchupPaidRow}+B${hdcPromoteRow}+B${deferredAUMRow}` } as FormulaCell;
  namedRanges.push({ name: 'TotalToHDC', ref: `Exit!$B$${currentRow}` });

  // Set sheet range
  ws['!ref'] = `A1:B${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Label
    { wch: 20 }, // Value
  ];

  return { sheet: ws, namedRanges };
}
