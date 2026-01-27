/**
 * IMPL-056: Live Calculation Excel Model - Capital Stack Sheet
 * ISS-029: Added PAB integration into capital stack
 *
 * Sheet 2: Sources = Uses verification with live formulas.
 * Calculates all capital structure amounts from percentages.
 * PAB is calculated from eligible basis, not as % of project cost.
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
  const philEquity = projectCost * (params.philanthropicEquityPct || 0) / 100;
  const hdcSubDebt = projectCost * (params.hdcSubDebtPct || 0) / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;
  const outsideSubDebt = projectCost * (params.outsideInvestorSubDebtPct || 0) / 100;
  const hdcDebtFund = projectCost * (params.hdcDebtFundPct || 0) / 100;

  // ISS-029: PAB amount from eligible basis (not % of project cost)
  // PAB = LIHTC Eligible Basis × PAB % of Eligible Basis
  const eligibleBasis = params.lihtcEligibleBasis ?? (projectCost - params.landValue);
  const pabAmount = params.pabEnabled && params.lihtcEnabled && eligibleBasis > 0
    ? eligibleBasis * ((params.pabPctOfEligibleBasis || 30) / 100)
    : 0;

  // Total sources includes PAB
  const totalSources = seniorDebt + pabAmount + philDebt + investorEquity + philEquity +
    hdcSubDebt + investorSubDebt + outsideSubDebt + hdcDebtFund;

  // Build sheet data with formulas
  const ws: XLSX.WorkSheet = {};

  // Header rows
  ws['A1'] = { t: 's', v: 'CAPITAL STACK' };
  ws['A2'] = { t: 's', v: '' };

  // Sources section header
  ws['A3'] = { t: 's', v: '=== SOURCES ===' };

  let row = 4;

  // Senior Debt
  ws[`A${row}`] = { t: 's', v: 'Senior Debt' };
  ws[`B${row}`] = { t: 'n', v: seniorDebt, f: 'ProjectCost*SeniorDebtPct/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.seniorDebtPct || 0}%` };
  namedRanges.push({ name: 'SeniorDebt', ref: `Capital_Stack!$B$${row}` });
  row++;

  // ISS-029: Private Activity Bonds (only if enabled)
  ws[`A${row}`] = { t: 's', v: 'Private Activity Bonds' };
  ws[`B${row}`] = {
    t: 'n',
    v: pabAmount,
    f: 'IF(AND(PABEnabled,FedLIHTCEnabled),LIHTCEligibleBasis*PABPctOfEligibleBasis/100,0)'
  } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: pabAmount > 0 ? `(${params.pabPctOfEligibleBasis || 30}% of eligible basis)` : '(disabled)' };
  namedRanges.push({ name: 'PABDebt', ref: `Capital_Stack!$B$${row}` });
  const pabRow = row;
  row++;

  // Philanthropic Debt
  ws[`A${row}`] = { t: 's', v: 'Philanthropic Debt' };
  ws[`B${row}`] = { t: 'n', v: philDebt, f: 'ProjectCost*PhilDebtPct/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.philanthropicDebtPct || 0}%` };
  namedRanges.push({ name: 'PhilDebt', ref: `Capital_Stack!$B$${row}` });
  row++;

  // Investor Equity
  ws[`A${row}`] = { t: 's', v: 'Investor Equity' };
  ws[`B${row}`] = { t: 'n', v: investorEquity, f: 'ProjectCost*InvestorEquityPct/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.investorEquityPct}%` };
  namedRanges.push({ name: 'InvestorEquity', ref: `Capital_Stack!$B$${row}` });
  row++;

  // Philanthropic Equity (if any)
  if ((params.philanthropicEquityPct || 0) > 0) {
    ws[`A${row}`] = { t: 's', v: 'Philanthropic Equity' };
    ws[`B${row}`] = { t: 'n', v: philEquity, f: 'ProjectCost*PhilanthropicEquityPct/100' } as FormulaCell;
    ws[`C${row}`] = { t: 's', v: `${params.philanthropicEquityPct || 0}%` };
    namedRanges.push({ name: 'PhilanthropicEquity', ref: `Capital_Stack!$B$${row}` });
    row++;
  }

  // HDC Sub-Debt
  ws[`A${row}`] = { t: 's', v: 'HDC Sub-Debt' };
  ws[`B${row}`] = { t: 'n', v: hdcSubDebt, f: 'ProjectCost*HDCSubDebtPct/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.hdcSubDebtPct || 0}%` };
  namedRanges.push({ name: 'HDCSubDebt', ref: `Capital_Stack!$B$${row}` });
  row++;

  // Investor Sub-Debt
  ws[`A${row}`] = { t: 's', v: 'Investor Sub-Debt' };
  ws[`B${row}`] = { t: 'n', v: investorSubDebt, f: 'ProjectCost*InvestorSubDebtPct/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.investorSubDebtPct || 0}%` };
  namedRanges.push({ name: 'InvestorSubDebt', ref: `Capital_Stack!$B$${row}` });
  row++;

  // Outside Sub-Debt
  ws[`A${row}`] = { t: 's', v: 'Outside Sub-Debt' };
  ws[`B${row}`] = { t: 'n', v: outsideSubDebt, f: 'ProjectCost*OutsideSubDebtPct/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.outsideInvestorSubDebtPct || 0}%` };
  namedRanges.push({ name: 'OutsideSubDebt', ref: `Capital_Stack!$B$${row}` });
  row++;

  // HDC Debt Fund (IMPL-082)
  if ((params.hdcDebtFundPct || 0) > 0) {
    ws[`A${row}`] = { t: 's', v: 'HDC Debt Fund' };
    ws[`B${row}`] = { t: 'n', v: hdcDebtFund, f: 'ProjectCost*HDCDebtFundPct/100' } as FormulaCell;
    ws[`C${row}`] = { t: 's', v: `${params.hdcDebtFundPct || 0}%` };
    namedRanges.push({ name: 'HDCDebtFund', ref: `Capital_Stack!$B$${row}` });
    row++;
  }

  // Total Sources
  const sourcesStartRow = 4;
  const sourcesEndRow = row - 1;
  ws[`A${row}`] = { t: 's', v: 'TOTAL SOURCES' };
  ws[`B${row}`] = { t: 'n', v: totalSources, f: `SUM(B${sourcesStartRow}:B${sourcesEndRow})` } as FormulaCell;
  namedRanges.push({ name: 'TotalSources', ref: `Capital_Stack!$B$${row}` });
  const totalSourcesRow = row;
  row++;

  // Blank row
  ws[`A${row}`] = { t: 's', v: '' };
  row++;

  // Uses section header
  ws[`A${row}`] = { t: 's', v: '=== USES ===' };
  row++;

  // Project Cost
  ws[`A${row}`] = { t: 's', v: 'Project Cost' };
  ws[`B${row}`] = { t: 'n', v: projectCost, f: 'ProjectCost' } as FormulaCell;
  const projectCostRow = row;
  row++;

  // Blank row
  ws[`A${row}`] = { t: 's', v: '' };
  row++;

  // Validation section header
  ws[`A${row}`] = { t: 's', v: '=== VALIDATION ===' };
  row++;

  // Sources - Uses
  ws[`A${row}`] = { t: 's', v: 'Sources - Uses' };
  ws[`B${row}`] = { t: 'n', v: totalSources - projectCost, f: `B${totalSourcesRow}-B${projectCostRow}` } as FormulaCell;
  const diffRow = row;
  row++;

  // Status check
  // ISS-036: Use 0.01 tolerance ($10K) for floating point rounding
  ws[`A${row}`] = { t: 's', v: 'Status' };
  ws[`B${row}`] = {
    t: 's',
    v: Math.abs(totalSources - projectCost) < 0.01 ? '✓ BALANCED' : '✗ ERROR',
    f: `IF(ABS(B${diffRow})<0.01,"✓ BALANCED","✗ ERROR")`
  };
  row++;

  // Blank row
  ws[`A${row}`] = { t: 's', v: '' };
  row++;

  // ISS-029: PAB explanation section
  ws[`A${row}`] = { t: 's', v: '=== PAB DETAILS ===' };
  row++;

  ws[`A${row}`] = { t: 's', v: 'LIHTC Eligible Basis' };
  ws[`B${row}`] = { t: 'n', v: eligibleBasis, f: 'LIHTCEligibleBasis' } as FormulaCell;
  row++;

  ws[`A${row}`] = { t: 's', v: 'PAB % of Eligible Basis' };
  ws[`B${row}`] = { t: 'n', v: (params.pabPctOfEligibleBasis || 30) / 100, f: 'PABPctOfEligibleBasis/100' } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${params.pabPctOfEligibleBasis || 30}%` };
  row++;

  ws[`A${row}`] = { t: 's', v: 'PAB Amount (from basis)' };
  ws[`B${row}`] = { t: 'n', v: pabAmount, f: `B${pabRow}` } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: pabAmount > 0 ? '' : '(PAB disabled)' };
  row++;

  ws[`A${row}`] = { t: 's', v: 'PAB as % of Project' };
  const pabPctOfProject = projectCost > 0 ? (pabAmount / projectCost) * 100 : 0;
  ws[`B${row}`] = { t: 'n', v: pabPctOfProject / 100, f: `B${pabRow}/ProjectCost` } as FormulaCell;
  ws[`C${row}`] = { t: 's', v: `${pabPctOfProject.toFixed(1)}%` };
  row++;

  // Set sheet range
  ws['!ref'] = `A1:C${row}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Label
    { wch: 20 }, // Value
    { wch: 25 }, // Notes
  ];

  return { sheet: ws, namedRanges };
}
