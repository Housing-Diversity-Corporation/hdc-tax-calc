/**
 * IMPL-056: Live Calculation Excel Model - Capital Stack Sheet
 *
 * Sheet 2: Sources = Uses verification with live formulas.
 * Calculates all capital structure amounts from percentages.
 */

import * as XLSX from 'xlsx';
import { CalculationParams } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Capital Stack sheet with Sources = Uses verification
 */
export function buildCapitalStackSheet(params: CalculationParams): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];

  // Pre-calculate values for display
  const projectCost = params.projectCost;
  const seniorDebt = projectCost * (params.seniorDebtPct || 0) / 100;
  const philDebt = projectCost * (params.philanthropicDebtPct || 0) / 100;
  const investorEquity = projectCost * params.investorEquityPct / 100;
  const hdcSubDebt = projectCost * (params.hdcSubDebtPct || 0) / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;
  const outsideSubDebt = projectCost * (params.outsideInvestorSubDebtPct || 0) / 100;
  const totalSources = seniorDebt + philDebt + investorEquity + hdcSubDebt + investorSubDebt + outsideSubDebt;

  // Build sheet data with formulas
  const ws: XLSX.WorkSheet = {};

  // Header rows
  ws['A1'] = { t: 's', v: 'CAPITAL STACK' };
  ws['A2'] = { t: 's', v: '' };

  // Sources section header
  ws['A3'] = { t: 's', v: '=== SOURCES ===' };

  // Senior Debt
  ws['A4'] = { t: 's', v: 'Senior Debt' };
  ws['B4'] = { t: 'n', v: seniorDebt, f: 'ProjectCost*SeniorDebtPct/100' } as FormulaCell;
  namedRanges.push({ name: 'SeniorDebt', ref: 'Capital_Stack!$B$4' });

  // Philanthropic Debt
  ws['A5'] = { t: 's', v: 'Philanthropic Debt' };
  ws['B5'] = { t: 'n', v: philDebt, f: 'ProjectCost*PhilDebtPct/100' } as FormulaCell;
  namedRanges.push({ name: 'PhilDebt', ref: 'Capital_Stack!$B$5' });

  // Investor Equity
  ws['A6'] = { t: 's', v: 'Investor Equity' };
  ws['B6'] = { t: 'n', v: investorEquity, f: 'ProjectCost*InvestorEquityPct/100' } as FormulaCell;
  namedRanges.push({ name: 'InvestorEquity', ref: 'Capital_Stack!$B$6' });

  // HDC Sub-Debt
  ws['A7'] = { t: 's', v: 'HDC Sub-Debt' };
  ws['B7'] = { t: 'n', v: hdcSubDebt, f: 'ProjectCost*HDCSubDebtPct/100' } as FormulaCell;
  namedRanges.push({ name: 'HDCSubDebt', ref: 'Capital_Stack!$B$7' });

  // Investor Sub-Debt
  ws['A8'] = { t: 's', v: 'Investor Sub-Debt' };
  ws['B8'] = { t: 'n', v: investorSubDebt, f: 'ProjectCost*InvestorSubDebtPct/100' } as FormulaCell;
  namedRanges.push({ name: 'InvestorSubDebt', ref: 'Capital_Stack!$B$8' });

  // Outside Sub-Debt
  ws['A9'] = { t: 's', v: 'Outside Sub-Debt' };
  ws['B9'] = { t: 'n', v: outsideSubDebt, f: 'ProjectCost*OutsideSubDebtPct/100' } as FormulaCell;
  namedRanges.push({ name: 'OutsideSubDebt', ref: 'Capital_Stack!$B$9' });

  // Total Sources
  ws['A10'] = { t: 's', v: 'TOTAL SOURCES' };
  ws['B10'] = { t: 'n', v: totalSources, f: 'SUM(B4:B9)' } as FormulaCell;
  namedRanges.push({ name: 'TotalSources', ref: 'Capital_Stack!$B$10' });

  // Blank row
  ws['A11'] = { t: 's', v: '' };

  // Uses section header
  ws['A12'] = { t: 's', v: '=== USES ===' };

  // Project Cost
  ws['A13'] = { t: 's', v: 'Project Cost' };
  ws['B13'] = { t: 'n', v: projectCost, f: 'ProjectCost' } as FormulaCell;

  // Blank row
  ws['A14'] = { t: 's', v: '' };

  // Validation section header
  ws['A15'] = { t: 's', v: '=== VALIDATION ===' };

  // Sources - Uses
  ws['A16'] = { t: 's', v: 'Sources - Uses' };
  ws['B16'] = { t: 'n', v: totalSources - projectCost, f: 'B10-B13' } as FormulaCell;

  // Status check
  ws['A17'] = { t: 's', v: 'Status' };
  ws['B17'] = { t: 's', v: Math.abs(totalSources - projectCost) < 0.001 ? '✓ BALANCED' : '✗ ERROR', f: 'IF(ABS(B16)<0.001,"✓ BALANCED","✗ ERROR")' };

  // Blank row
  ws['A18'] = { t: 's', v: '' };

  // Percentage summary section
  ws['A19'] = { t: 's', v: '=== PERCENTAGE SUMMARY ===' };

  // Total percentage check
  ws['A20'] = { t: 's', v: 'Total %' };
  const totalPct = (params.seniorDebtPct || 0) + (params.philanthropicDebtPct || 0) + params.investorEquityPct +
    (params.hdcSubDebtPct || 0) + (params.investorSubDebtPct || 0) + (params.outsideInvestorSubDebtPct || 0);
  ws['B20'] = { t: 'n', v: totalPct, f: 'SeniorDebtPct+PhilDebtPct+InvestorEquityPct+HDCSubDebtPct+InvestorSubDebtPct+OutsideSubDebtPct' } as FormulaCell;

  ws['A21'] = { t: 's', v: '% Status' };
  ws['B21'] = { t: 's', v: Math.abs(totalPct - 100) < 0.001 ? '✓ 100%' : '✗ ERROR', f: 'IF(ABS(B20-100)<0.001,"✓ 100%","✗ ERROR")' };

  // Set sheet range
  ws['!ref'] = 'A1:C21';

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Label
    { wch: 20 }, // Value
    { wch: 15 }, // Status
  ];

  return { sheet: ws, namedRanges };
}
