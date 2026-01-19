/**
 * IMPL-056: Live Calculation Excel Model - Investor Returns Sheet
 *
 * Sheet 11: Complete investor cash flow schedule with OZ benefits.
 * Includes:
 * - Year 5 step-up tax savings (OZ 2.0: 10% standard, 30% rural)
 * - Year 10 appreciation exclusion (tax-free if held 10+ years)
 * - Recapture avoidance (§1250 eliminated for 10+ year holds)
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Investor Returns sheet with OZ benefits
 */
export function buildInvestorReturnsSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;
  const investorEquity = projectCost * params.investorEquityPct / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;
  const totalInvestment = investorEquity + investorSubDebt;

  // OZ parameters
  const ozEnabled = params.ozEnabled ?? false;
  const ozVersion = params.ozVersion || '1.0';
  const ozType = params.ozType || 'standard';
  const deferredGain = params.deferredCapitalGains || 0;
  const capGainsRate = (params.capitalGainsTaxRate || 23.8) / 100;
  const federalRate = (params.federalTaxRate || 37) / 100;
  const niitRate = (params.niitRate || 3.8) / 100;

  // OZ step-up percentage: OZ 1.0 = 0%, OZ 2.0 standard = 10%, OZ 2.0 rural = 30%
  const ozStepUpPct = !ozEnabled || ozVersion === '1.0' ? 0 : (ozType === 'rural' ? 30 : 10);

  // Header
  ws['A1'] = { t: 's', v: 'INVESTOR RETURNS' };
  ws['A2'] = { t: 's', v: '' };

  // Column headers - Year 0 through Year 10
  const headerRow = 3;
  ws[`A${headerRow}`] = { t: 's', v: 'Component' };
  for (let year = 0; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year); // B, C, D, ...
    ws[`${col}${headerRow}`] = { t: 's', v: year === 0 ? 'Year 0' : `Year ${year}` };
  }

  // Data rows
  let currentRow = 4;

  // === CASH FLOWS ===
  ws[`A${currentRow}`] = { t: 's', v: '=== CASH FLOWS ===' };
  currentRow++;

  // Initial Investment (Year 0)
  ws[`A${currentRow}`] = { t: 's', v: 'Initial Investment' };
  ws['B' + currentRow] = { t: 'n', v: -totalInvestment, f: '-(InvestorEquity+InvestorSubDebt)' } as FormulaCell;
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    ws[`${col}${currentRow}`] = { t: 'n', v: 0 };
  }
  namedRanges.push({ name: 'InitialInvestment', ref: `Investor_Returns!$B$${currentRow}` });
  const investmentRow = currentRow;
  currentRow++;

  // Tax Benefits
  ws[`A${currentRow}`] = { t: 's', v: 'Tax Benefits' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const cf = cashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.taxBenefit || 0, f: `TaxBenefit_Y${year}` } as FormulaCell;
  }
  const taxBenefitRow = currentRow;
  currentRow++;

  // Federal LIHTC
  ws[`A${currentRow}`] = { t: 's', v: 'Federal LIHTC' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const cf = cashFlows[year - 1];
    // Use year index for LIHTC (year 11 = catch-up)
    const lihtcYear = year <= 10 ? year : 11;
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.federalLIHTCCredit || 0, f: `IF(FedLIHTCEnabled,FedLIHTC_Y${lihtcYear},0)` } as FormulaCell;
  }
  const lihtcRow = currentRow;
  currentRow++;

  // State LIHTC (direct use only)
  ws[`A${currentRow}`] = { t: 's', v: 'State LIHTC (direct)' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const cf = cashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.stateLIHTCCredit || 0, f: `IF(AND(StateLIHTCEnabled,StateLIHTCPath="direct"),StateLIHTC_Y${year},0)` } as FormulaCell;
  }
  const stateLihtcRow = currentRow;
  currentRow++;

  // Operating Cash
  ws[`A${currentRow}`] = { t: 's', v: 'Operating Cash' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const cf = cashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.operatingCashFlow || 0, f: `InvOpCash_Y${year}` } as FormulaCell;
  }
  const opCashRow = currentRow;
  currentRow++;

  // Sub-Debt Interest Received
  ws[`A${currentRow}`] = { t: 's', v: 'Sub-Debt Interest Received' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const cf = cashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.investorSubDebtInterestReceived || 0, f: `InvSubDebtPaid_Y${year}` } as FormulaCell;
  }
  const subDebtIntRow = currentRow;
  currentRow++;

  // Exit Proceeds (final year only)
  ws[`A${currentRow}`] = { t: 's', v: 'Exit Proceeds' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const isExitYear = year === holdPeriod;
    ws[`${col}${currentRow}`] = { t: 'n', v: isExitYear ? results.exitProceeds : 0, f: isExitYear ? 'TotalToInvestor' : '0' } as FormulaCell;
  }
  const exitRow = currentRow;
  currentRow++;

  // Sub-Debt Principal Repayment (final year only)
  ws[`A${currentRow}`] = { t: 's', v: 'Sub-Debt Repayment' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const isExitYear = year === holdPeriod;
    ws[`${col}${currentRow}`] = { t: 'n', v: isExitYear ? results.investorSubDebtAtExit : 0, f: isExitYear ? 'InvestorSubDebtAtExit' : '0' } as FormulaCell;
  }
  const subDebtRepayRow = currentRow;
  currentRow++;

  // Blank row
  currentRow++;

  // TOTAL CASH FLOW
  ws[`A${currentRow}`] = { t: 's', v: 'TOTAL CASH FLOW' };
  for (let year = 0; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const sumRange = `${col}${investmentRow}:${col}${subDebtRepayRow}`;
    const cf = year === 0 ? -totalInvestment : (cashFlows[year - 1]?.totalCashFlow || 0);
    ws[`${col}${currentRow}`] = { t: 'n', v: cf, f: `SUM(${sumRange})` } as FormulaCell;
    namedRanges.push({ name: `TotalCF_Y${year}`, ref: `Investor_Returns!$${col}$${currentRow}` });
  }
  const totalCFRow = currentRow;
  currentRow++;

  // Cumulative
  ws[`A${currentRow}`] = { t: 's', v: 'Cumulative' };
  for (let year = 0; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const prevCol = year === 0 ? '' : String.fromCharCode(65 + year);
    const cumFormula = year === 0 ? `${col}${totalCFRow}` : `${prevCol}${currentRow}+${col}${totalCFRow}`;
    const cumValue = cashFlows.slice(0, year).reduce((sum, cf) => sum + (cf?.totalCashFlow || 0), 0) + (year === 0 ? -totalInvestment : (cashFlows[year - 1]?.totalCashFlow || 0));
    ws[`${col}${currentRow}`] = { t: 'n', v: cumValue, f: cumFormula } as FormulaCell;
  }
  const cumulativeRow = currentRow;
  currentRow += 2;

  // === OZ BENEFITS ===
  ws[`A${currentRow}`] = { t: 's', v: '=== OZ BENEFITS ===' };
  currentRow++;

  // Year 5 Step-Up Savings
  ws[`A${currentRow}`] = { t: 's', v: 'Year 5 Step-Up Savings' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    // Step-up savings only in Year 5, only for OZ 2.0
    const isYear5 = year === 5;
    const stepUpSavings = isYear5 && ozEnabled && ozVersion === '2.0'
      ? deferredGain * (ozStepUpPct / 100) * capGainsRate
      : 0;
    // Formula: OZ 2.0 standard = 10%, rural = 30%
    const stepUpFormula = isYear5
      ? `IF(AND(OZEnabled,OZVersion=2),DeferredGain*OZStepUpPct/100*(FederalTaxRate+NIITRate+IF(StateConforms,StateTaxRate,0))/100,0)`
      : '0';
    ws[`${col}${currentRow}`] = { t: 'n', v: stepUpSavings, f: stepUpFormula } as FormulaCell;
  }
  namedRanges.push({ name: 'OZStepUpSavings', ref: `Investor_Returns!$G$${currentRow}` }); // Year 5 = column G
  const stepUpRow = currentRow;
  currentRow++;

  // Year 10 Appreciation Exclusion
  ws[`A${currentRow}`] = { t: 's', v: 'Year 10 Appreciation Exclusion' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    // Appreciation exclusion only in final year, only if held 10+ years and OZ enabled
    const isExitYear = year === holdPeriod;
    const appreciationExclusion = isExitYear && ozEnabled && holdPeriod >= 10
      ? Math.max(0, (results.exitValue - projectCost)) * capGainsRate
      : 0;
    const appreciationFormula = isExitYear && holdPeriod >= 10
      ? 'IF(OZEnabled,MAX(0,ExitValue-ProjectCost)*(FederalTaxRate+NIITRate)/100,0)'
      : '0';
    ws[`${col}${currentRow}`] = { t: 'n', v: appreciationExclusion, f: appreciationFormula } as FormulaCell;
  }
  const lastCol = String.fromCharCode(66 + holdPeriod);
  namedRanges.push({ name: 'OZAppreciationExclusion', ref: `Investor_Returns!$${lastCol}$${currentRow}` });
  const appreciationRow = currentRow;
  currentRow++;

  // Recapture Avoidance (cumulative through hold period)
  ws[`A${currentRow}`] = { t: 's', v: 'Recapture Avoided (§1250)' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    // Recapture avoidance: cumulative depreciation × 25% federal rate
    // Only applicable for 10+ year holds with OZ
    const cf = cashFlows[year - 1];
    const cumDepr = cashFlows.slice(0, year).reduce((sum, cf) => sum + ((cf?.taxBenefit || 0) / (((params.federalTaxRate || 37) + (params.niitRate || 3.8) + (params.stateTaxRate || 0)) / 100)), 0);
    const recaptureAvoided = ozEnabled && holdPeriod >= 10 && year === holdPeriod
      ? cumDepr * 0.25
      : 0;
    const recaptureFormula = year === holdPeriod
      ? 'IF(AND(OZEnabled,HoldPeriod>=10),TotalDepreciation*0.25,0)'
      : '0';
    ws[`${col}${currentRow}`] = { t: 'n', v: recaptureAvoided, f: recaptureFormula } as FormulaCell;
  }
  namedRanges.push({ name: 'OZRecaptureAvoided', ref: `Investor_Returns!$${lastCol}$${currentRow}` });
  currentRow += 2;

  // === SUMMARY ===
  ws[`A${currentRow}`] = { t: 's', v: '=== SUMMARY ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Investment' };
  ws[`B${currentRow}`] = { t: 'n', v: totalInvestment, f: `ABS(B${investmentRow})` } as FormulaCell;
  namedRanges.push({ name: 'InvTotalInvestment', ref: `Investor_Returns!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Returns' };
  const lastYearCol = String.fromCharCode(66 + holdPeriod);
  ws[`B${currentRow}`] = { t: 'n', v: results.totalReturns, f: `${lastYearCol}${cumulativeRow}` } as FormulaCell;
  namedRanges.push({ name: 'InvTotalReturns', ref: `Investor_Returns!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Multiple (MOIC)' };
  ws[`B${currentRow}`] = { t: 'n', v: results.multiple, f: `B${currentRow - 1}/B${currentRow - 2}` } as FormulaCell;
  namedRanges.push({ name: 'InvestorMOIC', ref: `Investor_Returns!$B$${currentRow}` });
  currentRow++;

  // IRR using native Excel function
  ws[`A${currentRow}`] = { t: 's', v: 'IRR' };
  const irrRange = `B${totalCFRow}:${lastYearCol}${totalCFRow}`;
  ws[`B${currentRow}`] = { t: 'n', v: results.irr / 100, f: `IRR(${irrRange})` } as FormulaCell;
  namedRanges.push({ name: 'InvestorIRR', ref: `Investor_Returns!$B$${currentRow}` });

  // Set sheet range
  const finalCol = String.fromCharCode(66 + holdPeriod);
  ws['!ref'] = `A1:${finalCol}${currentRow}`;

  // Set column widths
  const cols = [{ wch: 25 }]; // Label column
  for (let i = 0; i <= holdPeriod; i++) {
    cols.push({ wch: 12 });
  }
  ws['!cols'] = cols;

  return { sheet: ws, namedRanges };
}
