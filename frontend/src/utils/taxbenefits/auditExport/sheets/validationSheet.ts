/**
 * IMPL-056: Live Calculation Excel Model - Validation Sheet
 *
 * Sheet 14: Compare Excel formulas to platform values.
 * Tolerance: $1,000 for dollar amounts, 0.05% for percentages.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults, HDCAnalysisResults, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Validation sheet comparing Excel to platform values
 */
export function buildValidationSheet(
  params: CalculationParams,
  investorResults: InvestorAnalysisResults,
  hdcResults: HDCAnalysisResults,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const projectCost = params.projectCost;
  const investorEquity = projectCost * params.investorEquityPct / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;
  const totalInvestment = investorEquity + investorSubDebt;

  let currentRow = 1;

  // Header
  ws['A1'] = { t: 's', v: 'VALIDATION' };
  ws['A2'] = { t: 's', v: 'Tolerance: $0.001M ($1,000)' };
  ws['A3'] = { t: 's', v: '' };
  currentRow = 4;

  // Column headers
  ws[`A${currentRow}`] = { t: 's', v: 'Metric' };
  ws[`B${currentRow}`] = { t: 's', v: 'Excel Value' };
  ws[`C${currentRow}`] = { t: 's', v: 'Platform Value' };
  ws[`D${currentRow}`] = { t: 's', v: 'Difference' };
  ws[`E${currentRow}`] = { t: 's', v: 'Status' };
  currentRow++;

  // === CAPITAL STACK ===
  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== CAPITAL STACK ===' };
  currentRow++;

  // Investor Equity
  addValidationRow(ws, currentRow, 'Investor Equity', 'InvestorEquity', investorEquity);
  currentRow++;

  // Senior Debt
  const seniorDebt = projectCost * (params.seniorDebtPct || 0) / 100;
  addValidationRow(ws, currentRow, 'Senior Debt', 'SeniorDebt', seniorDebt);
  currentRow++;

  // Total Sources
  const totalSources = projectCost; // Should equal project cost
  addValidationRow(ws, currentRow, 'Total Sources', 'TotalSources', totalSources);
  currentRow++;

  // Sources - Uses (should be 0)
  ws[`A${currentRow}`] = { t: 's', v: 'Sources - Uses' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: 'TotalSources-ProjectCost' } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: 0 };
  ws[`D${currentRow}`] = { t: 'n', v: 0, f: `ABS(B${currentRow}-C${currentRow})` } as FormulaCell;
  ws[`E${currentRow}`] = { t: 's', v: '✓', f: `IF(D${currentRow}<0.001,"✓","✗")` };
  currentRow++;

  // === DEPRECIATION ===
  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== DEPRECIATION ===' };
  currentRow++;

  // Depreciable Basis
  const depreciableBasis = projectCost - params.landValue;
  addValidationRow(ws, currentRow, 'Depreciable Basis', 'DepreciableBasis', depreciableBasis);
  currentRow++;

  // Year 1 Tax Benefit
  const year1TaxBenefit = cashFlows[0]?.taxBenefit || 0;
  addValidationRow(ws, currentRow, 'Year 1 Tax Benefit', 'TaxBenefit_Y1', year1TaxBenefit);
  currentRow++;

  // Total Tax Benefits
  const totalTaxBenefits = investorResults.investorTaxBenefits;
  addValidationRow(ws, currentRow, 'Total Tax Benefits', 'TotalTaxBenefits', totalTaxBenefits);
  currentRow++;

  // === RETURNS ===
  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== RETURNS ===' };
  currentRow++;

  // Total Investment
  addValidationRow(ws, currentRow, 'Total Investment', 'InvTotalInvestment', totalInvestment);
  currentRow++;

  // Total Returns
  addValidationRow(ws, currentRow, 'Total Returns', 'InvTotalReturns', investorResults.totalReturns);
  currentRow++;

  // MOIC (with percentage tolerance)
  ws[`A${currentRow}`] = { t: 's', v: 'Investor MOIC' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.multiple, f: 'InvestorMOIC' } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: investorResults.multiple };
  ws[`D${currentRow}`] = { t: 'n', v: 0, f: `ABS(B${currentRow}-C${currentRow})` } as FormulaCell;
  ws[`E${currentRow}`] = { t: 's', v: '✓', f: `IF(D${currentRow}<0.01,"✓","✗")` }; // 0.01x tolerance
  currentRow++;

  // IRR (with percentage tolerance)
  ws[`A${currentRow}`] = { t: 's', v: 'Investor IRR' };
  ws[`B${currentRow}`] = { t: 'n', v: investorResults.irr / 100, f: 'InvestorIRR' } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: investorResults.irr / 100 };
  ws[`D${currentRow}`] = { t: 'n', v: 0, f: `ABS(B${currentRow}-C${currentRow})*100` } as FormulaCell; // Convert to %
  ws[`E${currentRow}`] = { t: 's', v: '✓', f: `IF(D${currentRow}<0.05,"✓","✗")` }; // 0.05% tolerance
  currentRow++;

  // === EXIT ===
  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== EXIT ===' };
  currentRow++;

  // Exit Value
  addValidationRow(ws, currentRow, 'Exit Value', 'ExitValue', investorResults.exitValue);
  currentRow++;

  // Investor Exit Proceeds
  addValidationRow(ws, currentRow, 'Investor Exit Proceeds', 'TotalToInvestor', investorResults.exitProceeds);
  currentRow++;

  // HDC Exit Proceeds
  addValidationRow(ws, currentRow, 'HDC Exit Proceeds', 'TotalToHDC', hdcResults.hdcExitProceeds);
  currentRow++;

  // === DEBT ===
  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== DEBT AT EXIT ===' };
  currentRow++;

  // Senior Debt at Exit
  addValidationRow(ws, currentRow, 'Senior Debt at Exit', 'SeniorBalanceAtExit', investorResults.remainingDebtAtExit);
  currentRow++;

  // Sub-Debt at Exit
  addValidationRow(ws, currentRow, 'Investor Sub-Debt at Exit', 'InvestorSubDebtAtExit', investorResults.investorSubDebtAtExit);
  currentRow++;

  // === SUMMARY ===
  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== VALIDATION SUMMARY ===' };
  currentRow++;

  // Count passing checks
  ws[`A${currentRow}`] = { t: 's', v: 'Checks Passing' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `COUNTIF(E5:E${currentRow - 2},"✓")` } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Checks' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `COUNTA(E5:E${currentRow - 3})` } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Overall Status' };
  ws[`B${currentRow}`] = { t: 's', v: '✓ ALL PASS', f: `IF(B${currentRow - 2}=B${currentRow - 1},"✓ ALL PASS","✗ ERRORS FOUND")` };

  // Set sheet range
  ws['!ref'] = `A1:E${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Metric
    { wch: 18 }, // Excel Value
    { wch: 18 }, // Platform Value
    { wch: 12 }, // Difference
    { wch: 8 },  // Status
  ];

  return { sheet: ws, namedRanges };
}

/**
 * Add a validation row comparing Excel formula to platform value
 */
function addValidationRow(
  ws: XLSX.WorkSheet,
  row: number,
  label: string,
  excelRef: string,
  platformValue: number
): void {
  ws[`A${row}`] = { t: 's', v: label };
  ws[`B${row}`] = { t: 'n', v: platformValue, f: excelRef } as FormulaCell;
  ws[`C${row}`] = { t: 'n', v: platformValue };
  ws[`D${row}`] = { t: 'n', v: 0, f: `ABS(B${row}-C${row})` } as FormulaCell;
  ws[`E${row}`] = { t: 's', v: '✓', f: `IF(D${row}<0.001,"✓","✗")` };
}
