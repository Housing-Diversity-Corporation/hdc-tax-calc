/**
 * Phase A2 - Task 8a: Tax Utilization Sheet
 *
 * Conditionally added when investorResults.taxUtilization exists.
 * Displays income-adjusted utilization analysis.
 *
 * Sections:
 * 1. Summary: treatment, fit indicator, totals
 * 2. Year-by-Year: annualUtilization array
 * 3. Recapture Coverage: recaptureCoverage array
 * 4. NOL Drawdown (nonpassive only): nolDrawdownSchedule
 */

import * as XLSX from 'xlsx';
import { InvestorAnalysisResults } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition } from '../types';
import type { TaxUtilizationResult } from '../../investorTaxUtilization';

// Excel number format codes
const FMT_CURRENCY = '$#,##0';
const FMT_PERCENT = '0.0%';

// Scale factor: Tax utilization values are stored in millions
const MILLIONS = 1_000_000;

/**
 * Build the Tax Utilization sheet
 * Only called when investorResults.taxUtilization exists
 */
export function buildTaxUtilizationSheet(
  investorResults: InvestorAnalysisResults,
  totalInvestment: number
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const taxUtil = investorResults.taxUtilization as TaxUtilizationResult;
  if (!taxUtil) {
    // Return empty sheet if no data (shouldn't happen if called correctly)
    ws['A1'] = { t: 's', v: 'No Tax Utilization Data' };
    ws['!ref'] = 'A1:A1';
    return { sheet: ws, namedRanges };
  }

  let currentRow = 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  ws['A1'] = { t: 's', v: 'TAX UTILIZATION ANALYSIS' };
  ws['A2'] = { t: 's', v: 'Income-Adjusted Benefit Analysis' };
  ws['A3'] = { t: 's', v: '' };
  currentRow = 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY SECTION
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== SUMMARY ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Tax Treatment' };
  ws[`B${currentRow}`] = { t: 's', v: taxUtil.treatmentLabel };
  namedRanges.push({ name: 'TaxUtilTreatment', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Fit Indicator' };
  ws[`B${currentRow}`] = { t: 's', v: taxUtil.fitIndicator.toUpperCase() };
  namedRanges.push({ name: 'TaxUtilFitIndicator', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Fit Explanation' };
  ws[`B${currentRow}`] = { t: 's', v: taxUtil.fitExplanation || '-' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: '' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Investment' };
  ws[`B${currentRow}`] = { t: 'n', v: totalInvestment * MILLIONS, z: FMT_CURRENCY };
  namedRanges.push({ name: 'TaxUtilTotalInvestment', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Benefits Generated' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalBenefitGenerated * MILLIONS, z: FMT_CURRENCY };
  namedRanges.push({ name: 'TaxUtilBenefitsGenerated', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Benefits Usable' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalBenefitUsable * MILLIONS, z: FMT_CURRENCY };
  namedRanges.push({ name: 'TaxUtilBenefitsUsable', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Depreciation Savings' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalDepreciationSavings * MILLIONS, z: FMT_CURRENCY };
  namedRanges.push({ name: 'TaxUtilDeprSavings', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total LIHTC Used' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.totalLIHTCUsed * MILLIONS, z: FMT_CURRENCY };
  namedRanges.push({ name: 'TaxUtilLIHTCUsed', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Overall Utilization Rate' };
  ws[`B${currentRow}`] = { t: 'n', v: taxUtil.overallUtilizationRate, z: FMT_PERCENT };
  namedRanges.push({ name: 'TaxUtilOverallRate', ref: `Tax_Utilization!$B$${currentRow}` });
  currentRow += 2;

  // ═══════════════════════════════════════════════════════════════════════════
  // YEAR-BY-YEAR TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  ws[`A${currentRow}`] = { t: 's', v: '=== YEAR-BY-YEAR UTILIZATION ===' };
  currentRow++;

  // Headers
  ws[`A${currentRow}`] = { t: 's', v: 'Year' };
  ws[`B${currentRow}`] = { t: 's', v: 'Depr Generated' };
  ws[`C${currentRow}`] = { t: 's', v: 'Depr Allowed' };
  ws[`D${currentRow}`] = { t: 's', v: 'Tax Savings' };
  ws[`E${currentRow}`] = { t: 's', v: 'LIHTC Usable' };
  ws[`F${currentRow}`] = { t: 's', v: 'Utilization %' };
  currentRow++;

  // Data rows
  if (taxUtil.annualUtilization && taxUtil.annualUtilization.length > 0) {
    taxUtil.annualUtilization.forEach((year) => {
      ws[`A${currentRow}`] = { t: 'n', v: year.year };
      ws[`B${currentRow}`] = { t: 'n', v: year.depreciationGenerated * MILLIONS, z: FMT_CURRENCY };
      ws[`C${currentRow}`] = { t: 'n', v: year.depreciationAllowed * MILLIONS, z: FMT_CURRENCY };
      ws[`D${currentRow}`] = { t: 'n', v: year.depreciationTaxSavings * MILLIONS, z: FMT_CURRENCY };
      ws[`E${currentRow}`] = { t: 'n', v: year.lihtcUsable * MILLIONS, z: FMT_CURRENCY };
      ws[`F${currentRow}`] = { t: 'n', v: year.utilizationRate, z: FMT_PERCENT };
      currentRow++;
    });
  }
  currentRow++;

  // ═══════════════════════════════════════════════════════════════════════════
  // RECAPTURE COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════
  if (taxUtil.recaptureCoverage && taxUtil.recaptureCoverage.length > 0) {
    ws[`A${currentRow}`] = { t: 's', v: '=== EXIT RECAPTURE COVERAGE ===' };
    currentRow++;

    // Headers
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
  // NOL DRAWDOWN (Nonpassive only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (taxUtil.treatment === 'nonpassive' &&
      taxUtil.nolDrawdownSchedule &&
      taxUtil.nolDrawdownSchedule.length > 0) {
    ws[`A${currentRow}`] = { t: 's', v: '=== NOL DRAWDOWN SCHEDULE ===' };
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Years to Exhaust NOL' };
    ws[`B${currentRow}`] = { t: 'n', v: taxUtil.nolDrawdownYears };
    namedRanges.push({ name: 'TaxUtilNOLYears', ref: `Tax_Utilization!$B$${currentRow}` });
    currentRow++;

    // Headers
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
  ws['!ref'] = `A1:F${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // A: Labels / Year
    { wch: 18 }, // B: Values
    { wch: 18 }, // C: Values
    { wch: 18 }, // D: Values
    { wch: 18 }, // E: Values
    { wch: 14 }, // F: Utilization %
  ];

  return { sheet: ws, namedRanges };
}
