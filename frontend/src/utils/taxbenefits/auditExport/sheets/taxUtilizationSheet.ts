/**
 * IMPL-126: Tax Utilization Sheet — Live Excel Formulas
 *
 * Rebuilt from hardcoded static values to live formulas that recalculate
 * when Brad changes investor profile inputs directly in Excel.
 *
 * Sections:
 * 1. Header
 * 2. Investor Profile Inputs (yellow, editable)
 * 3. Derived Calculations
 * 4. §38(c) Ceiling Calculation
 * 5. Year-by-Year Utilization Table
 * 6. Summary
 * 7. Cross-Check: Excel vs Platform
 * 8. Recapture Coverage (hardcoded — separate IMPL)
 * 9. NOL Drawdown (hardcoded — separate IMPL)
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';
import type { TaxUtilizationResult } from '../../investorTaxUtilization';

// Excel number format codes
const FMT_CURRENCY_M = '$#,##0.000000';  // $M with 6 decimal places for precision
const FMT_CURRENCY = '$#,##0';
const FMT_PERCENT = '0.0%';
const FMT_DECIMAL = '0.0000';

// Scale factor: Tax utilization values are stored in millions
const MILLIONS = 1_000_000;

// Sheet name constant for cell references
const SN = 'Tax_Utilization';

/**
 * Build the Tax Utilization sheet with live Excel formulas
 * Only called when investorResults.taxUtilization exists
 */
export function buildTaxUtilizationSheet(
  investorResults: InvestorAnalysisResults,
  totalInvestment: number,
  params: CalculationParams
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const taxUtil = investorResults.taxUtilization as TaxUtilizationResult;
  if (!taxUtil) {
    ws['A1'] = { t: 's', v: 'No Tax Utilization Data' };
    ws['!ref'] = 'A1:A1';
    return { sheet: ws, namedRanges };
  }

  const holdPeriod = params.holdPeriod || 10;
  let currentRow = 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  ws['A1'] = { t: 's', v: 'TAX UTILIZATION ANALYSIS — LIVE FORMULAS' };
  ws['A2'] = { t: 's', v: '\u2192 Change yellow cells to model different investor profiles. All other cells recalculate automatically.' };
  ws['A3'] = { t: 's', v: '' };
  currentRow = 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: INVESTOR PROFILE INPUTS (yellow background, blue text)
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== INVESTOR PROFILE INPUTS ===' };
  currentRow++;

  // Helper: add an input row with formula linking to Inputs/Capital_Stack named range
  const inputRows: Array<{
    label: string;
    formula: string;
    fallback: number | string;
    namedRange: string;
    format?: string;
  }> = [
    { label: 'Annual Income ($)', formula: 'AnnualIncome', fallback: params.annualIncome || 0, namedRange: 'TU_AnnualIncome', format: FMT_CURRENCY },
    { label: 'Investor Track', formula: 'InvestorTrack', fallback: params.investorTrack || 'rep', namedRange: 'TU_InvestorTrack' },
    { label: 'Is REP (1=yes, 0=no)', formula: 'IsREP', fallback: params.investorTrack === 'rep' ? 1 : 0, namedRange: 'TU_IsREP' },
    { label: 'Grouping Election (1=yes, 0=no)', formula: 'GroupingElection', fallback: params.groupingElection ? 1 : 0, namedRange: 'TU_GroupingElection' },
    { label: 'Filing Status', formula: 'FilingStatus', fallback: params.filingStatus || 'single', namedRange: 'TU_FilingStatus' },
    { label: 'Federal Tax Rate (decimal)', formula: 'FederalTaxRate/100', fallback: (params.federalTaxRate || 37) / 100, namedRange: 'TU_FedRate', format: FMT_DECIMAL },
    { label: 'NIIT Rate (decimal)', formula: 'NIITRate/100', fallback: (params.niitRate || 3.8) / 100, namedRange: 'TU_NIITRate', format: FMT_DECIMAL },
    { label: 'Investment Amount ($M)', formula: 'InvestorEquity', fallback: totalInvestment, namedRange: 'TU_Investment', format: FMT_CURRENCY_M },
    { label: 'Total Investor Equity ($M)', formula: 'InvestorEquity', fallback: totalInvestment, namedRange: 'TU_TotalEquity', format: FMT_CURRENCY_M },
    { label: 'Hold Period (years)', formula: 'HoldPeriod', fallback: holdPeriod, namedRange: 'TU_HoldPeriod' },
  ];

  for (const input of inputRows) {
    ws[`A${currentRow}`] = { t: 's', v: input.label };
    if (typeof input.fallback === 'string') {
      ws[`B${currentRow}`] = { t: 's', v: input.fallback, f: input.formula } as FormulaCell;
    } else {
      const cell: Record<string, unknown> = { t: 'n', v: input.fallback, f: input.formula };
      if (input.format) cell.z = input.format;
      ws[`B${currentRow}`] = cell;
    }
    namedRanges.push({ name: input.namedRange, ref: `${SN}!$B$${currentRow}` });
    currentRow++;
  }
  currentRow++;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: DERIVED CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== DERIVED CALCULATIONS ===' };
  currentRow++;

  // Pro-Rata Share
  ws[`A${currentRow}`] = { t: 's', v: 'Pro-Rata Share' };
  ws[`B${currentRow}`] = { t: 'n', v: 1, f: 'TU_Investment/TU_TotalEquity', z: FMT_DECIMAL } as FormulaCell;
  namedRanges.push({ name: 'TU_ProRata', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Effective Depreciation Rate
  ws[`A${currentRow}`] = { t: 's', v: 'Effective Depreciation Rate' };
  const effDeprFallback = taxUtil.treatment === 'passive'
    ? (params.federalTaxRate || 37) / 100 + (params.niitRate || 3.8) / 100
    : (params.federalTaxRate || 37) / 100;
  ws[`B${currentRow}`] = { t: 'n', v: effDeprFallback, f: 'IF(TU_IsREP=1,TU_FedRate,TU_FedRate+TU_NIITRate)', z: FMT_DECIMAL } as FormulaCell;
  namedRanges.push({ name: 'TU_EffDeprRate', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // §461(l) Annual Cap ($)
  ws[`A${currentRow}`] = { t: 's', v: '\u00A7461(l) Annual Cap ($)' };
  ws[`B${currentRow}`] = { t: 'n', v: 1e15, f: 'IF(AND(TU_IsREP=1,TU_GroupingElection=0),IF(TU_FilingStatus="MFJ",626000,313000),1E+15)', z: FMT_CURRENCY } as FormulaCell;
  namedRanges.push({ name: 'TU_461L_Cap', ref: `${SN}!$B$${currentRow}` });
  ws[`C${currentRow}`] = { t: 's', v: 'MFJ=$626K cap. Single/HoH=$313K cap. Grouped or non-REP = effectively unlimited.' };
  currentRow++;

  currentRow++;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: §38(c) CEILING CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== \u00A738(c) CREDIT CEILING ===' };
  currentRow++;

  // Tax Before Investment (simplified)
  ws[`A${currentRow}`] = { t: 's', v: 'Tax Before Investment (simplified)' };
  const taxBeforeFallback = (params.annualIncome || 0) * ((params.federalTaxRate || 37) / 100);
  ws[`B${currentRow}`] = { t: 'n', v: taxBeforeFallback, f: 'TU_AnnualIncome*TU_FedRate', z: FMT_CURRENCY } as FormulaCell;
  namedRanges.push({ name: 'TU_TaxBeforeInvestment', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Tax After Depreciation
  ws[`A${currentRow}`] = { t: 's', v: 'Tax After Depreciation' };
  const taxAfterDeprFallback = Math.max(0, taxBeforeFallback - taxUtil.totalDepreciationSavings * MILLIONS);
  ws[`B${currentRow}`] = { t: 'n', v: taxAfterDeprFallback, f: 'MAX(0,TU_TaxBeforeInvestment-TU_TotalDeprSavings*1000000)', z: FMT_CURRENCY } as FormulaCell;
  namedRanges.push({ name: 'TU_TaxAfterDepr', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // §38(c) Ceiling ($M)
  ws[`A${currentRow}`] = { t: 's', v: '\u00A738(c) Credit Ceiling ($M)' };
  const sec38cFallback = (0.75 * taxAfterDeprFallback + 6250) / MILLIONS;
  ws[`B${currentRow}`] = { t: 'n', v: sec38cFallback, f: '(0.75*TU_TaxAfterDepr+6250)/1000000', z: FMT_CURRENCY_M } as FormulaCell;
  namedRanges.push({ name: 'TU_38cCeiling', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Note: Approximation \u2014 engine uses progressive tax brackets. Cross-check rows below will reveal any material deviation.' };
  currentRow += 2;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: YEAR-BY-YEAR UTILIZATION TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== YEAR-BY-YEAR UTILIZATION ===' };
  currentRow++;

  // Column headers
  const headers = [
    'Year',
    'Full Deal Depr ($M)',
    'Pro-Rata Depr ($M)',
    '\u00A7461(l) Allowed ($M)',
    'Tax Savings ($M)',
    'LIHTC Generated ($M)',
    '\u00A738(c) Ceiling ($M)',
    'LIHTC Usable ($M)',
    'Total Benefit ($M)',
    'Max Possible ($M)',
    'Utilization %',
  ];
  const cols = 'ABCDEFGHIJK';
  for (let c = 0; c < headers.length; c++) {
    ws[`${cols[c]}${currentRow}`] = { t: 's', v: headers[c] };
  }
  currentRow++;

  const tableStartRow = currentRow;

  // Data rows — one per year
  for (let yearIdx = 0; yearIdx < holdPeriod; yearIdx++) {
    const year = yearIdx + 1;
    const row = currentRow;
    const au = taxUtil.annualUtilization?.[yearIdx];

    // A: Year (static)
    ws[`A${row}`] = { t: 'n', v: year };

    // B: Full Deal Depr ($M) — from Depreciation sheet named range
    ws[`B${row}`] = { t: 'n', v: au?.depreciationGenerated || 0, f: `Depr_Y${year}`, z: FMT_CURRENCY_M } as FormulaCell;

    // C: Pro-Rata Depr ($M)
    ws[`C${row}`] = { t: 'n', v: au?.depreciationGenerated || 0, f: `B${row}*TU_ProRata`, z: FMT_CURRENCY_M } as FormulaCell;

    // D: §461(l) Allowed ($M)
    ws[`D${row}`] = { t: 'n', v: au?.depreciationAllowed || 0, f: `MIN(C${row},TU_461L_Cap/1000000)`, z: FMT_CURRENCY_M } as FormulaCell;

    // E: Tax Savings ($M)
    ws[`E${row}`] = { t: 'n', v: au?.depreciationTaxSavings || 0, f: `D${row}*TU_EffDeprRate`, z: FMT_CURRENCY_M } as FormulaCell;

    // F: LIHTC Generated ($M)
    ws[`F${row}`] = { t: 'n', v: au?.lihtcGenerated || 0, f: `FedLIHTC_Y${year}*TU_ProRata`, z: FMT_CURRENCY_M } as FormulaCell;

    // G: §38(c) Ceiling ($M)
    ws[`G${row}`] = { t: 'n', v: sec38cFallback, f: 'TU_38cCeiling', z: FMT_CURRENCY_M } as FormulaCell;

    // H: LIHTC Usable ($M)
    ws[`H${row}`] = { t: 'n', v: au?.lihtcUsable || 0, f: `MIN(F${row},G${row})`, z: FMT_CURRENCY_M } as FormulaCell;

    // I: Total Benefit ($M)
    ws[`I${row}`] = { t: 'n', v: (au?.depreciationTaxSavings || 0) + (au?.lihtcUsable || 0), f: `E${row}+H${row}`, z: FMT_CURRENCY_M } as FormulaCell;

    // J: Max Possible ($M)
    ws[`J${row}`] = { t: 'n', v: au?.totalBenefitGenerated || 0, f: `(C${row}*TU_EffDeprRate)+F${row}`, z: FMT_CURRENCY_M } as FormulaCell;

    // K: Utilization %
    ws[`K${row}`] = { t: 'n', v: au?.utilizationRate || 0, f: `IF(J${row}=0,0,I${row}/J${row})`, z: FMT_PERCENT } as FormulaCell;

    currentRow++;
  }
  const tableEndRow = currentRow - 1;
  currentRow++;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== SUMMARY ===' };
  currentRow++;

  // Total Depreciation Savings ($M)
  ws[`A${currentRow}`] = { t: 's', v: 'Total Depreciation Savings ($M)' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalDepreciationSavings, f: `SUM(E${tableStartRow}:E${tableEndRow})`, z: FMT_CURRENCY_M } as FormulaCell;
  namedRanges.push({ name: 'TU_TotalDeprSavings', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Total LIHTC Used ($M)
  ws[`A${currentRow}`] = { t: 's', v: 'Total LIHTC Used ($M)' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalLIHTCUsed, f: `SUM(H${tableStartRow}:H${tableEndRow})`, z: FMT_CURRENCY_M } as FormulaCell;
  namedRanges.push({ name: 'TU_TotalLIHTC', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Total Benefits Usable ($M)
  ws[`A${currentRow}`] = { t: 's', v: 'Total Benefits Usable ($M)' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalBenefitUsable, f: 'TU_TotalDeprSavings+TU_TotalLIHTC', z: FMT_CURRENCY_M } as FormulaCell;
  namedRanges.push({ name: 'TU_TotalUsable', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Total Benefits Generated — Max ($M)
  ws[`A${currentRow}`] = { t: 's', v: 'Total Benefits Generated - Max ($M)' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalBenefitGenerated, f: `SUM(J${tableStartRow}:J${tableEndRow})`, z: FMT_CURRENCY_M } as FormulaCell;
  namedRanges.push({ name: 'TU_TotalGenerated', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Overall Utilization %
  ws[`A${currentRow}`] = { t: 's', v: 'Overall Utilization %' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.overallUtilizationRate, f: 'IF(TU_TotalGenerated=0,0,TU_TotalUsable/TU_TotalGenerated)', z: FMT_PERCENT } as FormulaCell;
  namedRanges.push({ name: 'TU_Utilization', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Investor MOIC (tax benefits only)
  ws[`A${currentRow}`] = { t: 's', v: 'Investor MOIC (tax benefits only)' };
  const moicFallback = totalInvestment > 0 ? (totalInvestment + taxUtil.totalBenefitUsable) / totalInvestment : 0;
  ws[`B${currentRow}`] = { t: 'n', v: moicFallback, f: '(TU_Investment+TU_TotalUsable)/TU_Investment', z: '0.00x' } as FormulaCell;
  namedRanges.push({ name: 'TU_MOIC', ref: `${SN}!$B$${currentRow}` });
  currentRow++;

  // Fit Indicator
  ws[`A${currentRow}`] = { t: 's', v: 'Fit Indicator' };
  const fitFallback = taxUtil.overallUtilizationRate >= 0.8 ? 'GREEN \u2713'
    : taxUtil.overallUtilizationRate >= 0.4 ? 'YELLOW \u26A0' : 'RED \u2717';
  ws[`B${currentRow}`] = { t: 's', v: fitFallback, f: 'IF(TU_Utilization>=0.8,"GREEN \u2713",IF(TU_Utilization>=0.4,"YELLOW \u26A0","RED \u2717"))' } as FormulaCell;
  currentRow++;

  // Tax Treatment (from engine — informational)
  ws[`A${currentRow}`] = { t: 's', v: 'Tax Treatment' };
  ws[`B${currentRow}`] = { t: 's', v: taxUtil.treatmentLabel };
  namedRanges.push({ name: 'TaxUtilTreatment', ref: `${SN}!$B$${currentRow}` });
  currentRow += 2;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: CROSS-CHECK — EXCEL vs PLATFORM (upper-bound comparison)
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== CROSS-CHECK: Excel vs Platform (upper-bound) ===' };
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: 'Upper Bound = full-deal benefit assuming unlimited income. Excel values will be \u2264 this when income constrains utilization. All \u2713 = formulas are internally consistent.' };
  currentRow++;

  // Cross-check header row
  ws[`A${currentRow}`] = { t: 's', v: 'Check' };
  ws[`B${currentRow}`] = { t: 's', v: 'Excel (live)' };
  ws[`C${currentRow}`] = { t: 's', v: 'Upper Bound (unconstrained)' };
  ws[`D${currentRow}`] = { t: 's', v: 'Status' };
  currentRow++;

  // Year 1 Tax Benefit — upper-bound check
  const y1TotalBenefitRef = `E${tableStartRow}+H${tableStartRow}`;
  const y1Fallback = (taxUtil.annualUtilization?.[0]?.depreciationTaxSavings || 0) + (taxUtil.annualUtilization?.[0]?.lihtcUsable || 0);
  ws[`A${currentRow}`] = { t: 's', v: 'Year 1 Tax Benefit ($M)' };
  ws[`B${currentRow}`] = { t: 'n', v: y1Fallback, f: y1TotalBenefitRef, z: FMT_CURRENCY_M } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: y1Fallback, f: 'SummaryY1TaxBenefit', z: FMT_CURRENCY_M } as FormulaCell;
  ws[`D${currentRow}`] = { t: 's', v: '\u2713', f: `IF(B${currentRow}<=C${currentRow}+0.001,"\u2713 (within bounds)","\u2717 EXCEEDS MAX")` } as FormulaCell;
  currentRow++;

  // Total Tax Benefits — upper-bound check
  ws[`A${currentRow}`] = { t: 's', v: 'Total Tax Benefits ($M)' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalBenefitUsable, f: 'TU_TotalUsable', z: FMT_CURRENCY_M } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: taxUtil.totalBenefitUsable, f: 'TotalTaxBenefits', z: FMT_CURRENCY_M } as FormulaCell;
  ws[`D${currentRow}`] = { t: 's', v: '\u2713', f: `IF(B${currentRow}<=C${currentRow}+0.001,"\u2713 (within bounds)","\u2717 EXCEEDS MAX")` } as FormulaCell;
  currentRow++;

  // Investor MOIC — upper-bound check
  ws[`A${currentRow}`] = { t: 's', v: 'Investor MOIC' };
  ws[`B${currentRow}`] = { t: 'n', v: moicFallback, f: 'TU_MOIC', z: '0.00x' } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: investorResults.multiple || 0, f: 'InvestorMOIC', z: '0.00x' } as FormulaCell;
  ws[`D${currentRow}`] = { t: 's', v: '\u2713', f: `IF(B${currentRow}<=C${currentRow}+0.001,"\u2713 (within bounds)","\u2717 EXCEEDS MAX")` } as FormulaCell;
  currentRow++;

  // Utilization % — range validity check
  ws[`A${currentRow}`] = { t: 's', v: 'Utilization %' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.overallUtilizationRate, f: 'TU_Utilization', z: FMT_PERCENT } as FormulaCell;
  ws[`C${currentRow}`] = { t: 'n', v: 1, z: FMT_PERCENT };
  ws[`D${currentRow}`] = { t: 's', v: '\u2713', f: `IF(AND(B${currentRow}>=0,B${currentRow}<=1),"\u2713 VALID","\u2717 OUT OF RANGE")` } as FormulaCell;
  currentRow += 2;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: RECAPTURE COVERAGE (hardcoded — future IMPL for live formulas)
  // ═══════════════════════════════════════════════════════════════════════════
  if (taxUtil.recaptureCoverage && taxUtil.recaptureCoverage.length > 0) {
    ws[`A${currentRow}`] = { t: 's', v: '=== EXIT RECAPTURE COVERAGE ===' };
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Exit Year' };
    ws[`B${currentRow}`] = { t: 's', v: 'Total Exit Tax' };
    ws[`C${currentRow}`] = { t: 's', v: 'Available Offset' };
    ws[`D${currentRow}`] = { t: 's', v: 'Net Exposure' };
    ws[`E${currentRow}`] = { t: 's', v: 'Coverage Ratio' };
    currentRow++;

    taxUtil.recaptureCoverage.forEach((coverage) => {
      ws[`A${currentRow}`] = { t: 'n', v: coverage.exitYear };
      ws[`B${currentRow}`] = { t: 'n', v: coverage.totalExitTax * MILLIONS, z: FMT_CURRENCY };
      ws[`C${currentRow}`] = { t: 'n', v: coverage.totalAvailableOffset * MILLIONS, z: FMT_CURRENCY };
      ws[`D${currentRow}`] = { t: 'n', v: coverage.netExitExposure * MILLIONS, z: FMT_CURRENCY };
      ws[`E${currentRow}`] = { t: 'n', v: coverage.coverageRatio, z: FMT_PERCENT };
      currentRow++;
    });
    currentRow++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: NOL DRAWDOWN (hardcoded — future IMPL for live formulas)
  // ═══════════════════════════════════════════════════════════════════════════
  if (taxUtil.treatment === 'nonpassive' &&
      taxUtil.nolDrawdownSchedule &&
      taxUtil.nolDrawdownSchedule.length > 0) {
    ws[`A${currentRow}`] = { t: 's', v: '=== NOL DRAWDOWN SCHEDULE ===' };
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Years to Exhaust NOL' };
    ws[`B${currentRow}`] = { t: 'n', v: taxUtil.nolDrawdownYears };
    namedRanges.push({ name: 'TaxUtilNOLYears', ref: `${SN}!$B$${currentRow}` });
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Year Post-Exit' };
    ws[`B${currentRow}`] = { t: 's', v: 'NOL Used' };
    ws[`C${currentRow}`] = { t: 's', v: 'NOL Remaining' };
    currentRow++;

    taxUtil.nolDrawdownSchedule.forEach((entry) => {
      ws[`A${currentRow}`] = { t: 'n', v: entry.year };
      ws[`B${currentRow}`] = { t: 'n', v: entry.nolUsed * MILLIONS, z: FMT_CURRENCY };
      ws[`C${currentRow}`] = { t: 'n', v: entry.nolRemaining * MILLIONS, z: FMT_CURRENCY };
      currentRow++;
    });
  }

  // Set sheet range
  ws['!ref'] = `A1:K${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 34 }, // A: Labels
    { wch: 20 }, // B: Values / Full Deal Depr
    { wch: 20 }, // C: Pro-Rata Depr
    { wch: 20 }, // D: §461(l) Allowed
    { wch: 20 }, // E: Tax Savings
    { wch: 20 }, // F: LIHTC Generated
    { wch: 20 }, // G: §38(c) Ceiling
    { wch: 20 }, // H: LIHTC Usable
    { wch: 20 }, // I: Total Benefit
    { wch: 20 }, // J: Max Possible
    { wch: 14 }, // K: Utilization %
  ];

  return { sheet: ws, namedRanges };
}
