/**
 * IMPL-056: Live Calculation Excel Model - Tax Benefits Sheet
 *
 * Sheet 5: Depreciation × tax rate with state conformity adjustments.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Tax Benefits sheet
 */
export function buildTaxBenefitsSheet(
  params: CalculationParams,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const federalRate = params.federalTaxRate || 37;
  const niitRate = params.niitRate || 3.8;
  const stateRate = params.stateTaxRate || 0;
  const conformity = params.bonusConformityRate ?? 1;

  // IMPL-070: Use pre-calculated effective rates from params (single source of truth)
  // These rates are calculated by useHDCCalculations hook with correct logic:
  // - REP investors: Federal + (State × conformity) -- NO NIIT
  // - Non-REP investors: Federal + NIIT + (State × conformity)
  // Fallback to manual calculation only if params don't have the values
  const effectiveForBonus = params.effectiveTaxRateForBonus ?? (federalRate + niitRate + stateRate * conformity);
  const effectiveForMACRS = params.effectiveTaxRateForStraightLine ?? (federalRate + niitRate + stateRate);

  // Header
  ws['A1'] = { t: 's', v: 'TAX BENEFITS' };
  ws['A2'] = { t: 's', v: '' };

  // Tax Rate Section
  ws['A3'] = { t: 's', v: 'Effective Tax Rate (Bonus)' };
  ws['B3'] = { t: 'n', v: effectiveForBonus, f: 'FederalTaxRate+NIITRate+StateTaxRate*StateConforms' } as FormulaCell;
  namedRanges.push({ name: 'EffectiveTaxRateBonus', ref: 'Tax_Benefits!$B$3' });

  ws['A4'] = { t: 's', v: 'Effective Tax Rate (MACRS)' };
  ws['B4'] = { t: 'n', v: effectiveForMACRS, f: 'FederalTaxRate+NIITRate+StateTaxRate' } as FormulaCell;
  namedRanges.push({ name: 'EffectiveTaxRateMACRS', ref: 'Tax_Benefits!$B$4' });

  ws['A5'] = { t: 's', v: '' };

  // Column headers
  ws['A6'] = { t: 's', v: 'Year' };
  ws['B6'] = { t: 's', v: 'Depreciation' };
  ws['C6'] = { t: 's', v: 'Bonus Benefit' };
  ws['D6'] = { t: 's', v: 'MACRS Benefit' };
  ws['E6'] = { t: 's', v: 'Total Benefit' };
  ws['F6'] = { t: 's', v: 'Cumulative' };

  // Year-by-year tax benefits
  let cumulative = 0;

  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 6; // Data starts at row 7

    ws[`A${row}`] = { t: 'n', v: year };

    // Reference depreciation from Depreciation sheet
    const deprRef = `Depr_Y${year}`;
    const cf = cashFlows[year - 1];
    const depreciation = cf?.taxBenefit ? cf.taxBenefit / ((federalRate + niitRate + stateRate) / 100) : 0;

    ws[`B${row}`] = { t: 'n', v: depreciation, f: deprRef } as FormulaCell;

    // Bonus benefit (Year 1 only)
    const bonusBenefit = year === 1
      ? (cf?.bonusTaxBenefit || depreciation * costSegFraction(params) * effectiveForBonus / 100)
      : 0;
    const bonusFormula = year === 1
      ? 'CostSegPortion*BonusDepreciationPct/100*EffectiveTaxRateBonus/100'
      : '0';
    ws[`C${row}`] = { t: 'n', v: bonusBenefit, f: bonusFormula } as FormulaCell;

    // MACRS benefit
    const macrsBenefit = year === 1
      ? (cf?.year1MacrsTaxBenefit || 0)
      : depreciation * effectiveForMACRS / 100;
    const macrsFormula = year === 1
      ? 'StraightLinePortion/27.5*(12.5-PlacedInServiceMonth)/12*EffectiveTaxRateMACRS/100'
      : `StraightLinePortion/27.5*EffectiveTaxRateMACRS/100`;
    ws[`D${row}`] = { t: 'n', v: macrsBenefit, f: macrsFormula } as FormulaCell;

    // Total benefit
    const totalBenefit = cf?.taxBenefit || bonusBenefit + macrsBenefit;
    ws[`E${row}`] = { t: 'n', v: totalBenefit, f: `C${row}+D${row}` } as FormulaCell;
    namedRanges.push({ name: `TaxBenefit_Y${year}`, ref: `Tax_Benefits!$E$${row}` });

    // Cumulative
    cumulative += totalBenefit;
    const cumFormula = year === 1 ? `E${row}` : `F${row - 1}+E${row}`;
    ws[`F${row}`] = { t: 'n', v: cumulative, f: cumFormula } as FormulaCell;
  }

  // Summary
  const summaryRow = holdPeriod + 8;
  ws[`A${summaryRow}`] = { t: 's', v: 'TOTAL' };
  ws[`C${summaryRow}`] = { t: 'n', v: cashFlows[0]?.bonusTaxBenefit || 0, f: 'C7' } as FormulaCell;
  ws[`D${summaryRow}`] = { t: 'n', v: cumulative - (cashFlows[0]?.bonusTaxBenefit || 0), f: `SUM(D7:D${holdPeriod + 6})` } as FormulaCell;
  ws[`E${summaryRow}`] = { t: 'n', v: cumulative, f: `SUM(E7:E${holdPeriod + 6})` } as FormulaCell;
  namedRanges.push({ name: 'TotalTaxBenefits', ref: `Tax_Benefits!$E$${summaryRow}` });

  // Set sheet range
  ws['!ref'] = `A1:F${summaryRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Year
    { wch: 15 }, // Depreciation
    { wch: 15 }, // Bonus Benefit
    { wch: 15 }, // MACRS Benefit
    { wch: 15 }, // Total Benefit
    { wch: 15 }, // Cumulative
  ];

  return { sheet: ws, namedRanges };
}

/**
 * Get cost segregation fraction from params
 */
function costSegFraction(params: CalculationParams): number {
  return (params.yearOneDepreciationPct || 20) / 100;
}
