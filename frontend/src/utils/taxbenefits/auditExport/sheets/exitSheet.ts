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
  // ISS-050 v3: Use separate senior and phil debt values to prevent double-counting
  const seniorBalanceAtExit = results.remainingSeniorDebtAtExit ?? results.remainingDebtAtExit ?? 0;
  const philBalanceAtExit = results.remainingPhilDebtAtExit ?? (projectCost * (params.philanthropicDebtPct || 0) / 100);
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

  // ISS-050: Get prior capital recovery values from calculation engine
  const grossExitProceeds = results.grossExitProceeds || results.totalExitProceeds || 0;
  const capitalAlreadyRecovered = results.capitalAlreadyRecovered || 0;
  const remainingCapitalToRecover = results.remainingCapitalToRecover ?? investorEquity;
  const exitReturnOfCapital = results.exitReturnOfCapital || Math.min(grossExitProceeds, remainingCapitalToRecover);
  const exitProfitShare = results.exitProfitShare || 0;
  const investorPromoteShare = params.investorPromoteShare / 100;
  const hdcPromoteShare = 1 - investorPromoteShare;

  // Calculate HDC share (conservation of capital: HDC = gross - investor)
  const profit = Math.max(0, grossExitProceeds - exitReturnOfCapital);
  const hdcProfitShare = profit * hdcPromoteShare;

  // Equity Waterfall Section
  ws[`A${currentRow}`] = { t: 's', v: '=== PRIOR CAPITAL RECOVERY ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor Equity' };
  ws[`B${currentRow}`] = { t: 'n', v: investorEquity, f: 'InvestorEquity' } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Capital Recovered (Hold Period)' };
  ws[`B${currentRow}`] = { t: 'n', v: capitalAlreadyRecovered } as FormulaCell;
  namedRanges.push({ name: 'CapitalRecoveredDuringHold', ref: `Exit!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Remaining Capital to Recover' };
  ws[`B${currentRow}`] = { t: 'n', v: remainingCapitalToRecover } as FormulaCell;
  namedRanges.push({ name: 'RemainingCapitalToRecover', ref: `Exit!$B$${currentRow}` });
  currentRow += 2;

  // Equity Waterfall Section
  ws[`A${currentRow}`] = { t: 's', v: '=== EQUITY WATERFALL ===' };
  currentRow++;

  // IMPL-161: Equity waterfall starts from net-of-AUM proceeds, matching engine's exitProceeds
  ws[`A${currentRow}`] = { t: 's', v: 'Gross Exit Proceeds (Net of Deferred AUM)' };
  ws[`B${currentRow}`] = { t: 'n', v: grossExitProceeds, f: `B${netAfterFeesRow}` } as FormulaCell;
  namedRanges.push({ name: 'GrossExitProceeds', ref: `Exit!$B$${currentRow}` });
  const grossExitRow = currentRow;
  currentRow += 2;

  // Step 1: Return of Capital (only remaining unrecovered)
  ws[`A${currentRow}`] = { t: 's', v: 'Step 1: Return of Capital' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Investor ROC (Remaining Only)' };
  ws[`B${currentRow}`] = { t: 'n', v: exitReturnOfCapital } as FormulaCell;
  namedRanges.push({ name: 'InvestorROC', ref: `Exit!$B$${currentRow}` });
  const invROCRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Remaining for Profit Split' };
  ws[`B${currentRow}`] = { t: 'n', v: profit, f: `B${grossExitRow}-B${invROCRow}` } as FormulaCell;
  const profitRow = currentRow;
  currentRow += 2;

  // Step 2: Profit Split (per promote percentage)
  ws[`A${currentRow}`] = { t: 's', v: 'Step 2: Profit Split' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: `Investor Share (${(investorPromoteShare * 100).toFixed(0)}%)` };
  ws[`B${currentRow}`] = { t: 'n', v: exitProfitShare, f: `B${profitRow}*InvestorPromoteShare/100` } as FormulaCell;
  namedRanges.push({ name: 'InvestorProfitShare', ref: `Exit!$B$${currentRow}` });
  const invProfitRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: `HDC Share (${(hdcPromoteShare * 100).toFixed(0)}%)` };
  ws[`B${currentRow}`] = { t: 'n', v: hdcProfitShare, f: `B${profitRow}*(1-InvestorPromoteShare/100)` } as FormulaCell;
  namedRanges.push({ name: 'HDCProfitShare', ref: `Exit!$B$${currentRow}` });
  const hdcProfitRow = currentRow;
  currentRow += 2;

  // Totals Section
  ws[`A${currentRow}`] = { t: 's', v: '=== TOTALS ===' };
  currentRow++;

  const totalToInvestor = exitReturnOfCapital + exitProfitShare;
  ws[`A${currentRow}`] = { t: 's', v: 'Total to Investor' };
  ws[`B${currentRow}`] = { t: 'n', v: totalToInvestor, f: `B${invROCRow}+B${invProfitRow}` } as FormulaCell;
  namedRanges.push({ name: 'TotalToInvestor', ref: `Exit!$B$${currentRow}` });
  const totalInvRow = currentRow;
  currentRow++;

  const totalToHDC = hdcProfitShare;
  ws[`A${currentRow}`] = { t: 's', v: 'Total to HDC' };
  ws[`B${currentRow}`] = { t: 'n', v: totalToHDC, f: `B${hdcProfitRow}` } as FormulaCell;
  namedRanges.push({ name: 'TotalToHDC', ref: `Exit!$B$${currentRow}` });
  const totalHDCRow = currentRow;
  currentRow += 2;

  // Conservation of Capital Check
  ws[`A${currentRow}`] = { t: 's', v: '=== CONSERVATION CHECK ===' };
  currentRow++;

  const sumOfDistributions = totalToInvestor + totalToHDC;
  ws[`A${currentRow}`] = { t: 's', v: 'Sum (Investor + HDC)' };
  ws[`B${currentRow}`] = { t: 'n', v: sumOfDistributions, f: `B${totalInvRow}+B${totalHDCRow}` } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Variance vs Gross' };
  ws[`B${currentRow}`] = { t: 'n', v: sumOfDistributions - grossExitProceeds, f: `B${currentRow - 1}-B${grossExitRow}` } as FormulaCell;
  namedRanges.push({ name: 'ExitVariance', ref: `Exit!$B$${currentRow}` });

  // Set sheet range
  ws['!ref'] = `A1:B${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Label
    { wch: 20 }, // Value
  ];

  return { sheet: ws, namedRanges };
}
