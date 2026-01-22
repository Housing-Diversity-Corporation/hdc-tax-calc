/**
 * IMPL-056: Live Calculation Excel Model - Validation Sheet
 * IMPL-062: Tier 2 Expansion - 48 validation checks
 * IMPL-065: Architecture fix - Use engine values directly (no recalculation)
 *
 * Sheet 14: Compare Excel formulas to platform values.
 * Tolerance: $1,000 for dollar amounts, 0.05% for percentages.
 *
 * Categories:
 * - Capital Stack (6 checks)
 * - Depreciation (6 checks)
 * - Tax Benefits (6 checks)
 * - LIHTC (8 checks)
 * - Operating CF (6 checks)
 * - Exit Waterfall (6 checks)
 * - Debt at Exit (4 checks)
 * - Investor Returns (6 checks)
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults, HDCAnalysisResults, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

// Tolerance constants
const DOLLAR_TOLERANCE = 0.001; // $1,000 (values in millions)
const PERCENT_TOLERANCE = 0.0005; // 0.05%
const RATIO_TOLERANCE = 0.01; // 0.01x for MOIC

/**
 * Build the Validation sheet comparing Excel to platform values
 * IMPL-062: Expanded to 48 checks across 8 categories
 * IMPL-065: Uses engine values directly (single source of truth)
 */
export function buildValidationSheet(
  params: CalculationParams,
  investorResults: InvestorAnalysisResults,
  hdcResults: HDCAnalysisResults,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;

  // IMPL-065: Extract platform values from engine results (no recalculation)
  const platform = extractPlatformValues(params, investorResults, hdcResults, cashFlows, holdPeriod);

  let currentRow = 1;

  // Header
  ws['A1'] = { t: 's', v: 'VALIDATION (Tier 2 - 48 Checks)' };
  ws['A2'] = { t: 's', v: `Tolerance: $${DOLLAR_TOLERANCE * 1000}K | ${PERCENT_TOLERANCE * 100}% | ${RATIO_TOLERANCE}x` };
  ws['A3'] = { t: 's', v: '' };
  currentRow = 4;

  // Column headers
  ws[`A${currentRow}`] = { t: 's', v: 'Check' };
  ws[`B${currentRow}`] = { t: 's', v: 'Excel' };
  ws[`C${currentRow}`] = { t: 's', v: 'Platform' };
  ws[`D${currentRow}`] = { t: 's', v: 'Diff' };
  ws[`E${currentRow}`] = { t: 's', v: 'Status' };
  currentRow++;

  // === CATEGORY 1: CAPITAL STACK (6 checks) ===
  currentRow = addCategory(ws, currentRow, 'CAPITAL STACK (6)');
  currentRow = addCheck(ws, currentRow, 1, 'Investor Equity', 'InvestorEquity', platform.investorEquity);
  currentRow = addCheck(ws, currentRow, 2, 'Senior Debt', 'SeniorDebt', platform.seniorDebt);
  currentRow = addCheck(ws, currentRow, 3, 'Phil Debt', 'PhilDebt', platform.philDebt);
  currentRow = addCheck(ws, currentRow, 4, 'HDC Sub-Debt', 'HDCSubDebt', platform.hdcSubDebt);
  currentRow = addCheck(ws, currentRow, 5, 'Total Sources', 'TotalSources', projectCost);
  currentRow = addInvariantCheck(ws, currentRow, 6, 'Sources = Uses', 'TotalSources-ProjectCost', 0);

  // === CATEGORY 2: DEPRECIATION (6 checks) ===
  currentRow = addCategory(ws, currentRow, 'DEPRECIATION (6)');
  currentRow = addCheck(ws, currentRow, 7, 'Depreciable Basis', 'DepreciableBasis', platform.depreciableBasis);
  currentRow = addCheck(ws, currentRow, 8, 'Cost Seg Portion', 'CostSegPortion', platform.costSegPortion);
  currentRow = addCheck(ws, currentRow, 9, 'Straight-Line Portion', 'StraightLinePortion', platform.straightLinePortion);
  currentRow = addCheck(ws, currentRow, 10, 'Year 1 Depreciation', 'Depr_Y1', platform.year1Depreciation);
  currentRow = addCheck(ws, currentRow, 11, 'Total 10-Year Depreciation', 'TotalDepreciation', platform.totalDepreciation);
  currentRow = addInvariantCheck(ws, currentRow, 12, 'CostSeg + S/L = Basis', 'CostSegPortion+StraightLinePortion-DepreciableBasis', 0);

  // === CATEGORY 3: TAX BENEFITS (6 checks) ===
  currentRow = addCategory(ws, currentRow, 'TAX BENEFITS (6)');
  currentRow = addCheck(ws, currentRow, 13, 'Year 1 Tax Benefit', 'TaxBenefit_Y1', platform.year1TaxBenefit);
  currentRow = addCheck(ws, currentRow, 14, 'Total Tax Benefits', 'TotalTaxBenefits', platform.totalTaxBenefits);
  currentRow = addPercentCheck(ws, currentRow, 15, 'Effective Rate (Bonus)', 'EffectiveTaxRateBonus/100', platform.effectiveRateBonus);
  currentRow = addPercentCheck(ws, currentRow, 16, 'Effective Rate (MACRS)', 'EffectiveTaxRateMACRS/100', platform.effectiveRateMACRS);
  currentRow = addCheck(ws, currentRow, 17, 'Years 2-10 Tax Benefits', `SUM(TaxBenefit_Y2:TaxBenefit_Y${holdPeriod})`, platform.years2to10TaxBenefits);
  // IMPL-070: Use engine value directly (single source of truth)
  // Previous calculation (Depr × Rate) was incorrect for split-rate states (NJ, NY, CA)
  // where bonus uses effectiveRateBonus and MACRS uses effectiveRateMACRS
  currentRow = addCheck(ws, currentRow, 18, 'Total Tax Benefits (Engine)', 'TotalTaxBenefits', platform.totalTaxBenefits);

  // === CATEGORY 4: LIHTC (8 checks) ===
  currentRow = addCategory(ws, currentRow, 'LIHTC (8)');
  currentRow = addCheck(ws, currentRow, 19, 'Eligible Basis', 'LIHTCEligibleBasis', platform.lihtcEligibleBasis);
  currentRow = addCheck(ws, currentRow, 20, 'Qualified Basis', 'LIHTCQualifiedBasis', platform.lihtcQualifiedBasis);
  currentRow = addCheck(ws, currentRow, 21, 'Annual Federal Credit', 'LIHTCAnnualFedCredit', platform.lihtcAnnualFedCredit);
  currentRow = addPercentCheck(ws, currentRow, 22, 'Year 1 Proration Factor', 'LIHTCYear1Factor', platform.lihtcYear1Factor);
  currentRow = addCheck(ws, currentRow, 23, 'Year 1 Federal Credit', 'FedLIHTC_Y1', platform.lihtcYear1Credit);
  currentRow = addCheck(ws, currentRow, 24, 'Year 11 Catch-Up', 'FedLIHTC_Y11', platform.lihtcYear11Catchup);
  currentRow = addCheck(ws, currentRow, 25, 'Total Federal LIHTC', 'TotalFedLIHTC', platform.totalFedLIHTC);
  // Invariant: Total LIHTC = 10 × Annual
  currentRow = addInvariantCheck(ws, currentRow, 26, 'LIHTC = 10 × Annual', 'TotalFedLIHTC-LIHTCAnnualFedCredit*10', 0);

  // === CATEGORY 5: OPERATING CF (6 checks) ===
  currentRow = addCategory(ws, currentRow, 'OPERATING CF (6)');
  currentRow = addCheck(ws, currentRow, 27, 'Year 1 NOI', 'NOI_Y1', platform.year1NOI);
  currentRow = addCheck(ws, currentRow, 28, 'Year 10 NOI', `NOI_Y${holdPeriod}`, platform.year10NOI);
  currentRow = addRatioCheck(ws, currentRow, 29, 'Min DSCR', 'MinDSCR', platform.minDSCR);
  currentRow = addRatioCheck(ws, currentRow, 30, 'Avg DSCR', 'AvgDSCR', platform.avgDSCR);
  currentRow = addCheck(ws, currentRow, 31, 'Year 1 Hard Debt Service', 'HardDS_Y1', platform.year1HardDS);
  currentRow = addCheck(ws, currentRow, 32, 'Total Avail for Soft Pay', `SUM(AvailForSoftPay_Y1:AvailForSoftPay_Y${holdPeriod})`, platform.totalAvailForSoftPay);

  // === CATEGORY 6: EXIT WATERFALL (6 checks) ===
  currentRow = addCategory(ws, currentRow, 'EXIT WATERFALL (6)');
  currentRow = addCheck(ws, currentRow, 33, 'Exit Value', 'ExitValue', platform.exitValue);
  currentRow = addCheck(ws, currentRow, 34, 'Investor Exit Proceeds', 'TotalToInvestor', platform.investorExitProceeds);
  currentRow = addCheck(ws, currentRow, 35, 'HDC Exit Proceeds', 'TotalToHDC', platform.hdcExitProceeds);
  currentRow = addCheck(ws, currentRow, 36, 'Return of Capital', 'InvestorROC', platform.investorROC);
  currentRow = addCheck(ws, currentRow, 37, 'Preferred Return Paid', 'InvestorPrefPaid', platform.investorPrefPaid);
  // Invariant: Investor + HDC = Net Exit Proceeds
  currentRow = addInvariantCheck(ws, currentRow, 38, 'Inv + HDC = Net Proceeds', 'TotalToInvestor+TotalToHDC-(ExitValue-SeniorBalanceAtExit-PhilBalanceAtExit)', 0);

  // === CATEGORY 7: DEBT AT EXIT (4 checks) ===
  currentRow = addCategory(ws, currentRow, 'DEBT AT EXIT (4)');
  currentRow = addCheck(ws, currentRow, 39, 'Senior Debt at Exit', 'SeniorBalanceAtExit', platform.seniorDebtAtExit);
  currentRow = addCheck(ws, currentRow, 40, 'Investor Sub-Debt at Exit', 'InvestorSubDebtAtExit', platform.investorSubDebtAtExit);
  currentRow = addCheck(ws, currentRow, 41, 'Phil Debt at Exit', 'PhilBalanceAtExit', platform.philDebtAtExit);
  currentRow = addCheck(ws, currentRow, 42, 'Total Debt at Exit', 'SeniorBalanceAtExit+PhilBalanceAtExit+InvestorSubDebtAtExit', platform.totalDebtAtExit);

  // === CATEGORY 8: INVESTOR RETURNS (6 checks) ===
  currentRow = addCategory(ws, currentRow, 'INVESTOR RETURNS (6)');
  currentRow = addCheck(ws, currentRow, 43, 'Total Investment', 'InvTotalInvestment', platform.totalInvestment);
  currentRow = addCheck(ws, currentRow, 44, 'Total Returns', 'InvTotalReturns', platform.totalReturns);
  currentRow = addRatioCheck(ws, currentRow, 45, 'Investor MOIC', 'InvestorMOIC', platform.investorMOIC);
  currentRow = addPercentCheck(ws, currentRow, 46, 'Investor IRR', 'InvestorIRR', platform.investorIRR);
  currentRow = addCheck(ws, currentRow, 47, 'OZ Step-Up Savings (Y5)', 'OZStepUpSavings', platform.ozStepUpSavings);
  currentRow = addCheck(ws, currentRow, 48, 'OZ Appreciation Exclusion', 'OZAppreciationExclusion', platform.ozAppreciationExclusion);

  // === VALIDATION SUMMARY ===
  currentRow++;
  ws[`A${currentRow}`] = { t: 's', v: '=== VALIDATION SUMMARY ===' };
  currentRow++;

  // Count passing checks
  ws[`A${currentRow}`] = { t: 's', v: 'Checks Passing' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `COUNTIF(E5:E${currentRow - 2},"✓")` } as FormulaCell;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total Checks' };
  ws[`B${currentRow}`] = { t: 'n', v: 48 };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Pass Rate' };
  ws[`B${currentRow}`] = { t: 'n', v: 0, f: `B${currentRow - 2}/B${currentRow - 1}` } as FormulaCell;
  ws[`C${currentRow}`] = { t: 's', v: '', f: `TEXT(B${currentRow},"0.0%")` };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Overall Status' };
  ws[`B${currentRow}`] = { t: 's', v: '✓ ALL PASS', f: `IF(B${currentRow - 3}>=48,"✓ ALL PASS",CONCATENATE("✗ ",48-B${currentRow - 3}," ERRORS"))` };

  // Set sheet range
  ws['!ref'] = `A1:E${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 28 }, // Check name
    { wch: 16 }, // Excel Value
    { wch: 16 }, // Platform Value
    { wch: 12 }, // Difference
    { wch: 8 },  // Status
  ];

  return { sheet: ws, namedRanges };
}

/**
 * IMPL-065: Extract platform values from engine results (single source of truth)
 *
 * This function replaces the previous calculatePlatformValues() which reimplemented
 * the calculation engine. Now we use engine results directly where available.
 *
 * Values come from:
 * 1. investorResults - Primary source for investor metrics
 * 2. hdcResults - HDC-specific metrics
 * 3. cashFlows - Year-by-year data extracted from engine
 * 4. params - Input parameters (not calculations)
 */
function extractPlatformValues(
  params: CalculationParams,
  investorResults: InvestorAnalysisResults,
  hdcResults: HDCAnalysisResults,
  cashFlows: CashFlowItem[],
  holdPeriod: number
) {
  const projectCost = params.projectCost;
  const landValue = params.landValue;

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPITAL STACK - From engine or simple percentage conversion
  // ═══════════════════════════════════════════════════════════════════════════
  // investorEquity comes from engine (includes all adjustments)
  const investorEquity = investorResults.investorEquity || (projectCost * params.investorEquityPct / 100);
  // These are simple percentage conversions (not financial calculations)
  const seniorDebt = projectCost * (params.seniorDebtPct || 0) / 100;
  const philDebt = projectCost * (params.philanthropicDebtPct || 0) / 100;
  const hdcSubDebt = projectCost * (params.hdcSubDebtPct || 0) / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPRECIATION - Use params values (set by engine/hook) or derive from inputs
  // ═══════════════════════════════════════════════════════════════════════════
  // Note: depreciation is standardized by IRS rules, so derivation is acceptable
  const depreciableBasis = projectCost - landValue;
  const costSegPct = params.yearOneDepreciationPct || 20;
  const costSegPortion = depreciableBasis * costSegPct / 100;
  const straightLinePortion = depreciableBasis - costSegPortion;

  // Year 1 depreciation from params (set by engine) or derive using standard formula
  const pisMonth = params.placedInServiceMonth || 7;
  const annualMACRS = straightLinePortion / 27.5;
  const monthsY1 = 12.5 - pisMonth;
  const year1MACRS = annualMACRS * monthsY1 / 12;
  const year1Depreciation = params.yearOneDepreciation || (costSegPortion + year1MACRS);
  const totalDepreciation = costSegPortion + year1MACRS + annualMACRS * (holdPeriod - 1);

  // ═══════════════════════════════════════════════════════════════════════════
  // TAX BENEFITS - From engine results and params
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPL-068: Effective tax rates from params (calculated by hook, passed through)
  // REP investors: Federal + State (no NIIT)
  // Non-REP investors: Federal + NIIT + State
  // Fallback to federal rate only (never hardcode 40.8% which assumes non-REP with NIIT)
  const fallbackRate = params.federalTaxRate || 37;
  const effectiveRateBonus = (params.effectiveTaxRateForBonus || params.effectiveTaxRate || fallbackRate) / 100;
  const effectiveRateMACRS = (params.effectiveTaxRateForStraightLine || params.effectiveTaxRate || fallbackRate) / 100;

  // Tax benefits from engine cash flows (single source of truth)
  const year1TaxBenefit = cashFlows[0]?.taxBenefit || 0;
  const totalTaxBenefits = investorResults.investorTaxBenefits || 0;
  const years2to10TaxBenefits = cashFlows
    .slice(1, holdPeriod)
    .reduce((sum, cf) => sum + (cf?.taxBenefit || 0), 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIHTC - Derive from params (IRC §42 standardized calculation)
  // ═══════════════════════════════════════════════════════════════════════════
  const lihtcEnabled = params.lihtcEnabled ?? false;
  const applicableFraction = (params.applicableFraction || 100) / 100;
  const creditRate = (params.creditRate || 4) / 100;
  const ddaBoost = params.ddaQctBoost ? 1.3 : 1.0;
  const lihtcEligibleBasis = lihtcEnabled ? depreciableBasis * ddaBoost : 0;
  const lihtcQualifiedBasis = lihtcEligibleBasis * applicableFraction;
  const lihtcAnnualFedCredit = lihtcEnabled ? lihtcQualifiedBasis * creditRate : 0;
  const lihtcYear1Factor = (13 - pisMonth) / 12;
  const lihtcYear1Credit = lihtcAnnualFedCredit * lihtcYear1Factor;
  const lihtcYear11Catchup = lihtcAnnualFedCredit - lihtcYear1Credit;
  const totalFedLIHTC = lihtcAnnualFedCredit * 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATING CF - Extract from engine cash flows
  // ═══════════════════════════════════════════════════════════════════════════
  const year1NOI = cashFlows[0]?.noi || params.yearOneNOI;
  const year10NOI = cashFlows[holdPeriod - 1]?.noi || params.yearOneNOI;

  // DSCR values from engine cash flows
  const dscrValues = cashFlows.map(cf => cf.dscr || 0).filter(d => d > 0);
  const minDSCR = dscrValues.length > 0 ? Math.min(...dscrValues) : 0;
  const avgDSCR = dscrValues.length > 0 ? dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length : 0;
  const year1HardDS = cashFlows[0]?.hardDebtService || 0;

  // Available for soft pay from engine cash flows
  const totalAvailForSoftPay = cashFlows.reduce((sum, cf) => {
    const avail = Math.max(0, (cf.noi || 0) - (cf.hardDebtService || 0) * 1.05);
    return sum + avail;
  }, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // EXIT WATERFALL - From engine results
  // ═══════════════════════════════════════════════════════════════════════════
  const exitValue = investorResults.exitValue || 0;
  const investorExitProceeds = investorResults.exitProceeds || 0;
  const hdcExitProceeds = hdcResults.hdcExitProceeds || 0;

  // Return of capital - derived from engine values (capped at equity)
  const investorROC = Math.min(investorExitProceeds, investorEquity);
  // Preferred return paid - derived from engine values
  const prefReturnTarget = investorEquity * 0.08 * holdPeriod;
  const investorPrefPaid = Math.min(prefReturnTarget, Math.max(0, investorExitProceeds - investorROC));

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBT AT EXIT - From engine results
  // ═══════════════════════════════════════════════════════════════════════════
  const seniorDebtAtExit = investorResults.remainingDebtAtExit || 0;
  const investorSubDebtAtExit = investorResults.investorSubDebtAtExit || 0;
  const philDebtAtExit = philDebt; // Phil debt doesn't amortize
  const totalDebtAtExit = seniorDebtAtExit + philDebtAtExit + investorSubDebtAtExit;

  // ═══════════════════════════════════════════════════════════════════════════
  // INVESTOR RETURNS - From engine results (single source of truth)
  // ═══════════════════════════════════════════════════════════════════════════
  const totalInvestment = investorResults.totalInvestment || (investorEquity + investorSubDebt);
  const totalReturns = investorResults.totalReturns || 0;
  const investorMOIC = investorResults.multiple || 0;
  const investorIRR = (investorResults.irr || 0) / 100; // Engine returns as percentage

  // ═══════════════════════════════════════════════════════════════════════════
  // OZ BENEFITS - From engine results
  // ═══════════════════════════════════════════════════════════════════════════
  const ozStepUpSavings = investorResults.ozStepUpSavings || 0;
  const ozAppreciationExclusion = investorResults.ozExitAppreciation || 0;

  return {
    // Capital Stack
    investorEquity,
    seniorDebt,
    philDebt,
    hdcSubDebt,
    // Depreciation
    depreciableBasis,
    costSegPortion,
    straightLinePortion,
    year1Depreciation,
    totalDepreciation,
    // Tax Benefits
    effectiveRateBonus,
    effectiveRateMACRS,
    year1TaxBenefit,
    totalTaxBenefits,
    years2to10TaxBenefits,
    // LIHTC
    lihtcEligibleBasis,
    lihtcQualifiedBasis,
    lihtcAnnualFedCredit,
    lihtcYear1Factor,
    lihtcYear1Credit,
    lihtcYear11Catchup,
    totalFedLIHTC,
    // Operating CF
    year1NOI,
    year10NOI,
    minDSCR,
    avgDSCR,
    year1HardDS,
    totalAvailForSoftPay,
    // Exit Waterfall
    exitValue,
    investorExitProceeds,
    hdcExitProceeds,
    investorROC,
    investorPrefPaid,
    // Debt at Exit
    seniorDebtAtExit,
    investorSubDebtAtExit,
    philDebtAtExit,
    totalDebtAtExit,
    // Investor Returns
    totalInvestment,
    totalReturns,
    investorMOIC,
    investorIRR,
    ozStepUpSavings,
    ozAppreciationExclusion,
  };
}

/**
 * Add a category header row
 */
function addCategory(ws: XLSX.WorkSheet, row: number, name: string): number {
  ws[`A${row}`] = { t: 's', v: '' };
  row++;
  ws[`A${row}`] = { t: 's', v: `=== ${name} ===` };
  return row + 1;
}

/**
 * Add a standard validation check row (dollar tolerance)
 */
function addCheck(
  ws: XLSX.WorkSheet,
  row: number,
  checkNum: number,
  label: string,
  excelRef: string,
  platformValue: number
): number {
  ws[`A${row}`] = { t: 's', v: `${checkNum}. ${label}` };
  ws[`B${row}`] = { t: 'n', v: platformValue, f: excelRef } as FormulaCell;
  ws[`C${row}`] = { t: 'n', v: platformValue };
  ws[`D${row}`] = { t: 'n', v: 0, f: `ABS(B${row}-C${row})` } as FormulaCell;
  ws[`E${row}`] = { t: 's', v: '✓', f: `IF(D${row}<${DOLLAR_TOLERANCE},"✓","✗")` };
  return row + 1;
}

/**
 * Add an invariant check (should equal exactly 0)
 */
function addInvariantCheck(
  ws: XLSX.WorkSheet,
  row: number,
  checkNum: number,
  label: string,
  excelFormula: string,
  expectedValue: number
): number {
  ws[`A${row}`] = { t: 's', v: `${checkNum}. ${label}` };
  ws[`B${row}`] = { t: 'n', v: expectedValue, f: excelFormula } as FormulaCell;
  ws[`C${row}`] = { t: 'n', v: expectedValue };
  ws[`D${row}`] = { t: 'n', v: 0, f: `ABS(B${row}-C${row})` } as FormulaCell;
  ws[`E${row}`] = { t: 's', v: '✓', f: `IF(D${row}<${DOLLAR_TOLERANCE},"✓","✗")` };
  return row + 1;
}

/**
 * Add a percentage check (percentage tolerance)
 */
function addPercentCheck(
  ws: XLSX.WorkSheet,
  row: number,
  checkNum: number,
  label: string,
  excelRef: string,
  platformValue: number
): number {
  ws[`A${row}`] = { t: 's', v: `${checkNum}. ${label}` };
  ws[`B${row}`] = { t: 'n', v: platformValue, f: excelRef } as FormulaCell;
  ws[`C${row}`] = { t: 'n', v: platformValue };
  ws[`D${row}`] = { t: 'n', v: 0, f: `ABS(B${row}-C${row})` } as FormulaCell;
  ws[`E${row}`] = { t: 's', v: '✓', f: `IF(D${row}<${PERCENT_TOLERANCE},"✓","✗")` };
  return row + 1;
}

/**
 * Add a ratio check (ratio tolerance for MOIC/DSCR)
 */
function addRatioCheck(
  ws: XLSX.WorkSheet,
  row: number,
  checkNum: number,
  label: string,
  excelRef: string,
  platformValue: number
): number {
  ws[`A${row}`] = { t: 's', v: `${checkNum}. ${label}` };
  ws[`B${row}`] = { t: 'n', v: platformValue, f: excelRef } as FormulaCell;
  ws[`C${row}`] = { t: 'n', v: platformValue };
  ws[`D${row}`] = { t: 'n', v: 0, f: `ABS(B${row}-C${row})` } as FormulaCell;
  ws[`E${row}`] = { t: 's', v: '✓', f: `IF(D${row}<${RATIO_TOLERANCE},"✓","✗")` };
  return row + 1;
}

// IMPL-070: addToleranceCheck removed - was only used for Check 18 which now uses
// engine value directly (single source of truth) via addCheck instead
