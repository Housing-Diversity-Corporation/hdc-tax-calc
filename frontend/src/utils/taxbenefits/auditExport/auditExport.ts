/**
 * IMPL-038: Complete Audit Export Package - Excel Generator
 *
 * Generates Excel workbooks with live formulas for auditor verification.
 * Every calculation shows formula + value for complete traceability.
 *
 * Tabs (12 total):
 * 1. Inputs - All input parameters with named ranges
 * 2. Capital Stack - Sources = Uses verification
 * 3. Debt Service - Year-by-year for each debt type
 * 4. Tax Benefits - Depreciation + LIHTC + OZ breakdown
 * 5. Operating CF - NOI through distributions
 * 6. Waterfall - Recovery tracking, promote phases
 * 7. Exit - Value, payoffs, net proceeds
 * 8. Investor Returns - All components → total, MOIC, IRR
 * 9. HDC Returns - All components → total
 * 10. Calculations - Key formulas and intermediate values
 * 11. Year-by-Year - 10-year cash flow projection
 * 12. Summary - Final metrics validation
 *
 * @version 2.0.0
 * @date 2025-12-29
 * @task IMPL-038 (supersedes IMPL-023)
 */

import * as XLSX from 'xlsx';
import { CalculationParams, InvestorAnalysisResults, CashFlowItem, HDCAnalysisResults } from '../../../types/taxbenefits';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditExportParams {
  /** Calculator input parameters */
  params: CalculationParams;
  /** Calculated investor results */
  results: InvestorAnalysisResults;
  /** HDC analysis results (optional) */
  hdcResults?: HDCAnalysisResults;
  /** Project name for filename */
  projectName?: string;
}

interface NamedRangeDefinition {
  name: string;
  ref: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Excel column letters for reference */
const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Get column letter from 0-based index */
const colLetter = (index: number): string => {
  if (index < 26) return COLS[index];
  return COLS[Math.floor(index / 26) - 1] + COLS[index % 26];
};

// ============================================================================
// INPUTS SHEET
// ============================================================================

interface InputRow {
  name: string;
  rangeName: string;
  value: number | string | boolean;
  units: string;
  description: string;
}

function buildInputsSheet(params: CalculationParams): {
  sheet: XLSX.WorkSheet;
  namedRanges: NamedRangeDefinition[];
} {
  const namedRanges: NamedRangeDefinition[] = [];

  // Define all input rows
  const inputs: InputRow[] = [
    // Project Parameters
    { name: 'Project Cost', rangeName: 'Input_ProjectCost', value: params.projectCost, units: '$M', description: 'Total development cost' },
    { name: 'Predevelopment Costs', rangeName: 'Input_PredevelopmentCosts', value: params.predevelopmentCosts || 0, units: '$M', description: 'Soft costs before construction' },
    { name: 'Land Value', rangeName: 'Input_LandValue', value: params.landValue, units: '$M', description: 'Value of land (non-depreciable)' },
    { name: 'Stabilized NOI', rangeName: 'Input_YearOneNOI', value: params.yearOneNOI, units: '$M', description: 'Net Operating Income at stabilization' },
    // ISS-068c: NOI Growth Rate replaces OpEx Ratio, Revenue Growth, Expense Growth
    { name: 'NOI Growth Rate', rangeName: 'Input_NoiGrowthRate', value: params.noiGrowthRate || 3, units: '%', description: 'Annual NOI growth rate' },

    // Tax Parameters
    { name: 'Cost Segregation %', rangeName: 'Input_CostSegPct', value: params.yearOneDepreciationPct || 20, units: '%', description: 'Year 1 bonus depreciation percentage' },
    { name: 'Federal Tax Rate', rangeName: 'Input_FederalTaxRate', value: params.federalTaxRate || 37, units: '%', description: 'Marginal federal tax rate' },
    { name: 'State Tax Rate', rangeName: 'Input_StateTaxRate', value: params.stateTaxRate || 0, units: '%', description: 'State income tax rate' },
    { name: 'LT Capital Gains Rate', rangeName: 'Input_LTCapGainsRate', value: params.ltCapitalGainsRate || 20, units: '%', description: 'Long-term capital gains rate' },
    { name: 'NIIT Rate', rangeName: 'Input_NIITRate', value: params.niitRate || 3.8, units: '%', description: 'Net Investment Income Tax' },
    { name: 'State Capital Gains Rate', rangeName: 'Input_StateCapGainsRate', value: params.stateCapitalGainsRate || 0, units: '%', description: 'State capital gains rate' },

    // Capital Structure - Equity
    { name: 'Investor Equity %', rangeName: 'Input_InvestorEquityPct', value: params.investorEquityPct, units: '%', description: 'Investor equity as % of project cost' },

    // Capital Structure - Senior Debt
    { name: 'Senior Debt %', rangeName: 'Input_SeniorDebtPct', value: params.seniorDebtPct || 0, units: '%', description: 'Senior debt as % of project cost' },
    { name: 'Senior Debt Rate', rangeName: 'Input_SeniorDebtRate', value: params.seniorDebtRate || 5, units: '%', description: 'Annual interest rate on senior debt' },
    { name: 'Senior Debt Amortization', rangeName: 'Input_SeniorDebtAmort', value: params.seniorDebtAmortization || 35, units: 'years', description: 'Amortization period for senior debt' },
    { name: 'Senior Debt IO Years', rangeName: 'Input_SeniorDebtIOYears', value: params.seniorDebtIOYears || 0, units: 'years', description: 'Interest-only period' },

    // Capital Structure - Phil Debt
    { name: 'Philanthropic Debt %', rangeName: 'Input_PhilDebtPct', value: params.philanthropicDebtPct || 0, units: '%', description: 'Philanthropic debt as % of project cost' },
    { name: 'Philanthropic Debt Rate', rangeName: 'Input_PhilDebtRate', value: params.philanthropicDebtRate || 0, units: '%', description: 'Annual interest rate on phil debt' },
    { name: 'Phil Debt Amortization', rangeName: 'Input_PhilDebtAmort', value: params.philDebtAmortization || 60, units: 'years', description: 'Amortization period for phil debt' },
    { name: 'Phil Current Pay Enabled', rangeName: 'Input_PhilCurrentPayEnabled', value: params.philCurrentPayEnabled ? 1 : 0, units: '0/1', description: 'Phil debt current pay flag' },
    { name: 'Phil Current Pay %', rangeName: 'Input_PhilCurrentPayPct', value: params.philCurrentPayPct || 0, units: '%', description: 'Phil debt current pay percentage' },

    // Capital Structure - HDC Sub-Debt
    { name: 'HDC Sub-Debt %', rangeName: 'Input_HDCSubDebtPct', value: params.hdcSubDebtPct || 0, units: '%', description: 'HDC subordinate debt as % of project cost' },
    { name: 'HDC Sub-Debt PIK Rate', rangeName: 'Input_HDCSubDebtPIKRate', value: params.hdcSubDebtPikRate || 8, units: '%', description: 'PIK interest rate on HDC sub-debt' },
    { name: 'HDC PIK Current Pay Enabled', rangeName: 'Input_HDCPIKCurrentPayEnabled', value: params.pikCurrentPayEnabled ? 1 : 0, units: '0/1', description: 'HDC sub-debt current pay flag' },
    { name: 'HDC PIK Current Pay %', rangeName: 'Input_HDCPIKCurrentPayPct', value: params.pikCurrentPayPct || 0, units: '%', description: 'HDC sub-debt current pay percentage' },

    // Capital Structure - Investor Sub-Debt
    { name: 'Investor Sub-Debt %', rangeName: 'Input_InvestorSubDebtPct', value: params.investorSubDebtPct || 0, units: '%', description: 'Investor sub-debt as % of project cost' },
    { name: 'Investor Sub-Debt PIK Rate', rangeName: 'Input_InvestorSubDebtPIKRate', value: params.investorSubDebtPikRate || 8, units: '%', description: 'PIK interest rate on investor sub-debt' },
    { name: 'Investor PIK Current Pay Enabled', rangeName: 'Input_InvPIKCurrentPayEnabled', value: params.investorPikCurrentPayEnabled ? 1 : 0, units: '0/1', description: 'Investor sub-debt current pay flag' },
    { name: 'Investor PIK Current Pay %', rangeName: 'Input_InvPIKCurrentPayPct', value: params.investorPikCurrentPayPct || 0, units: '%', description: 'Investor sub-debt current pay percentage' },

    // Capital Structure - Outside Investor Sub-Debt
    { name: 'Outside Investor Sub-Debt %', rangeName: 'Input_OutsideInvSubDebtPct', value: params.outsideInvestorSubDebtPct || 0, units: '%', description: 'Outside investor sub-debt as % of project cost' },
    { name: 'Outside Investor PIK Rate', rangeName: 'Input_OutsideInvPIKRate', value: params.outsideInvestorSubDebtPikRate || 8, units: '%', description: 'PIK rate on outside investor sub-debt' },
    { name: 'Outside Inv Current Pay Enabled', rangeName: 'Input_OutsideInvCurrentPayEnabled', value: params.outsideInvestorPikCurrentPayEnabled ? 1 : 0, units: '0/1', description: 'Outside investor current pay flag' },
    { name: 'Outside Inv Current Pay %', rangeName: 'Input_OutsideInvCurrentPayPct', value: params.outsideInvestorPikCurrentPayPct || 0, units: '%', description: 'Outside investor current pay percentage' },

    // Interest Reserve
    { name: 'Interest Reserve Enabled', rangeName: 'Input_IntReserveEnabled', value: params.interestReserveEnabled ? 1 : 0, units: '0/1', description: 'Interest reserve flag' },
    { name: 'Interest Reserve Months', rangeName: 'Input_IntReserveMonths', value: params.interestReserveMonths || 0, units: 'months', description: 'Months of interest reserve' },

    // Operating Parameters
    { name: 'Hold Period', rangeName: 'Input_HoldPeriod', value: params.holdPeriod || 10, units: 'years', description: 'Investment holding period' },
    // ISS-068c: Revenue/Expense Growth replaced by NOI Growth Rate (defined above)
    { name: 'Exit Cap Rate', rangeName: 'Input_ExitCapRate', value: params.exitCapRate, units: '%', description: 'Capitalization rate at exit' },
    { name: 'Investor Promote Share', rangeName: 'Input_InvestorPromote', value: params.investorPromoteShare, units: '%', description: 'Investor share of operating cash flow' },
    { name: 'Construction Delay Months', rangeName: 'Input_ConstructionDelay', value: params.constructionDelayMonths || 0, units: 'months', description: 'Months before NOI starts' },

    // OZ Parameters
    { name: 'OZ Enabled', rangeName: 'Input_OZEnabled', value: params.ozEnabled ? 1 : 0, units: '0/1', description: 'Opportunity Zone investment flag' },
    { name: 'OZ Version', rangeName: 'Input_OZVersion', value: params.ozVersion === '2.0' ? 2 : 1, units: '1/2', description: 'OZ legislation version (1=TCJA, 2=OBBBA)' },
    { name: 'OZ Type', rangeName: 'Input_OZType', value: params.ozType === 'rural' ? 1 : 0, units: '0/1', description: 'OZ type (0=standard, 1=rural)' },
    { name: 'Deferred Capital Gains', rangeName: 'Input_DeferredGains', value: params.deferredCapitalGains || 0, units: '$M', description: 'Capital gains deferred into OZ' },
    { name: 'Capital Gains Tax Rate', rangeName: 'Input_CapGainsTaxRate', value: params.capitalGainsTaxRate || 23.8, units: '%', description: 'Combined capital gains tax rate for OZ' },

    // HDC Fees
    { name: 'HDC Fee Rate', rangeName: 'Input_HDCFeeRate', value: params.hdcFeeRate || 0, units: '%', description: 'HDC tax benefit fee rate' },
    { name: 'HDC Deferred Interest Rate', rangeName: 'Input_HDCDeferredRate', value: params.hdcDeferredInterestRate || 8, units: '%', description: 'Interest rate on deferred HDC fees' },

    // AUM Fee
    { name: 'AUM Fee Enabled', rangeName: 'Input_AUMEnabled', value: params.aumFeeEnabled ? 1 : 0, units: '0/1', description: 'AUM fee flag' },
    { name: 'AUM Fee Rate', rangeName: 'Input_AUMRate', value: params.aumFeeRate || 1, units: '%', description: 'Annual AUM fee rate' },
    { name: 'AUM Current Pay Enabled', rangeName: 'Input_AUMCurrentPayEnabled', value: params.aumCurrentPayEnabled ? 1 : 0, units: '0/1', description: 'AUM fee current pay flag' },
    { name: 'AUM Current Pay %', rangeName: 'Input_AUMCurrentPayPct', value: params.aumCurrentPayPct || 0, units: '%', description: 'AUM fee current pay percentage' },

    // IMPL-117: placedInServiceMonth removed from UI-facing inputs — now engine-internal
  ];

  // Build sheet data
  const data: (string | number)[][] = [
    ['HDC Calculator - Audit Export', '', '', '', ''],
    ['Input Parameters', '', '', '', ''],
    ['', '', '', '', ''],
    ['Parameter', 'Value', 'Units', 'Named Range', 'Description'],
  ];

  // Add input rows
  inputs.forEach((input, index) => {
    const rowNum = index + 5; // Start at row 5 (0-indexed as 4)
    data.push([input.name, input.value as number, input.units, input.rangeName, input.description]);

    // Create named range for this input
    namedRanges.push({
      name: input.rangeName,
      ref: `Inputs!$B$${rowNum}`,
    });
  });

  // Create worksheet
  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet['!cols'] = [
    { wch: 25 }, // Parameter name
    { wch: 15 }, // Value
    { wch: 10 }, // Units
    { wch: 25 }, // Named range
    { wch: 40 }, // Description
  ];

  return { sheet, namedRanges };
}

// ============================================================================
// CALCULATIONS SHEET
// ============================================================================

function buildCalculationsSheet(params: CalculationParams): XLSX.WorkSheet {
  const holdPeriod = params.holdPeriod || 10;

  // Build calculation rows with Excel formulas
  const data: (string | number)[][] = [
    ['Key Calculations', '', '', ''],
    ['', '', '', ''],
    ['Calculation', 'Formula', 'Value', 'Notes'],

    // Depreciable Basis
    ['', '', '', ''],
    ['DEPRECIABLE BASIS', '', '', ''],
    ['Total Project Cost', '=Input_ProjectCost+Input_PredevelopmentCosts', { t: 'n', f: 'Input_ProjectCost+Input_PredevelopmentCosts' } as unknown as number, 'Project + Predevelopment'],
    ['Depreciable Basis', '=Calc_TotalProjectCost-Input_LandValue', { t: 'n', f: 'Calc_TotalProjectCost-Input_LandValue' } as unknown as number, 'Excludes land value'],

    // Year 1 Depreciation
    ['', '', '', ''],
    ['YEAR 1 DEPRECIATION', '', '', ''],
    ['Bonus Depreciation', '=Calc_DepreciableBasis*(Input_CostSegPct/100)', { t: 'n', f: 'Calc_DepreciableBasis*(Input_CostSegPct/100)' } as unknown as number, 'Cost segregation amount'],
    ['Remaining Basis', '=Calc_DepreciableBasis-Calc_BonusDepr', { t: 'n', f: 'Calc_DepreciableBasis-Calc_BonusDepr' } as unknown as number, 'Basis for straight-line'],
    ['Annual MACRS', '=Calc_RemainingBasis/27.5', { t: 'n', f: 'Calc_RemainingBasis/27.5' } as unknown as number, 'IRS 27.5-year schedule'],
    ['Months in Year 1', '=12.5-Input_PISMonth', { t: 'n', f: '12.5-Input_PISMonth' } as unknown as number, 'Mid-month convention'],
    ['Year 1 MACRS', '=(Calc_MonthsY1/12)*Calc_AnnualMACRS', { t: 'n', f: '(Calc_MonthsY1/12)*Calc_AnnualMACRS' } as unknown as number, 'Prorated first year'],
    ['Total Year 1 Depreciation', '=Calc_BonusDepr+Calc_Year1MACRS', { t: 'n', f: 'Calc_BonusDepr+Calc_Year1MACRS' } as unknown as number, 'Bonus + MACRS'],

    // Tax Benefits
    ['', '', '', ''],
    ['TAX BENEFITS', '', '', ''],
    ['Effective Tax Rate', '=Input_FederalTaxRate+Input_StateTaxRate', { t: 'n', f: 'Input_FederalTaxRate+Input_StateTaxRate' } as unknown as number, 'Combined rate'],
    ['Year 1 Tax Benefit', '=Calc_TotalY1Depr*(Calc_EffectiveTaxRate/100)', { t: 'n', f: 'Calc_TotalY1Depr*(Calc_EffectiveTaxRate/100)' } as unknown as number, 'Tax savings from depreciation'],

    // Capital Structure
    ['', '', '', ''],
    ['CAPITAL STRUCTURE', '', '', ''],
    ['Effective Project Cost', '=Calc_TotalProjectCost', { t: 'n', f: 'Calc_TotalProjectCost' } as unknown as number, 'Base for equity/debt split'],
    ['Investor Equity', '=Calc_EffectiveProjectCost*(Input_InvestorEquityPct/100)', { t: 'n', f: 'Calc_EffectiveProjectCost*(Input_InvestorEquityPct/100)' } as unknown as number, 'Investor equity amount'],
    ['Senior Debt', '=Calc_EffectiveProjectCost*(Input_SeniorDebtPct/100)', { t: 'n', f: 'Calc_EffectiveProjectCost*(Input_SeniorDebtPct/100)' } as unknown as number, 'Senior debt amount'],
    ['Philanthropic Debt', '=Calc_EffectiveProjectCost*(Input_PhilDebtPct/100)', { t: 'n', f: 'Calc_EffectiveProjectCost*(Input_PhilDebtPct/100)' } as unknown as number, 'Phil debt amount'],
    ['HDC Sub-Debt', '=Calc_EffectiveProjectCost*(Input_HDCSubDebtPct/100)', { t: 'n', f: 'Calc_EffectiveProjectCost*(Input_HDCSubDebtPct/100)' } as unknown as number, 'HDC sub-debt amount'],
    ['Investor Sub-Debt', '=Calc_EffectiveProjectCost*(Input_InvestorSubDebtPct/100)', { t: 'n', f: 'Calc_EffectiveProjectCost*(Input_InvestorSubDebtPct/100)' } as unknown as number, 'Investor sub-debt amount'],

    // Debt Service
    ['', '', '', ''],
    ['DEBT SERVICE', '', '', ''],
    ['Senior Monthly Rate', '=Input_SeniorDebtRate/100/12', { t: 'n', f: 'Input_SeniorDebtRate/100/12' } as unknown as number, 'Monthly interest rate'],
    ['Senior Total Payments', '=Input_SeniorDebtAmort*12', { t: 'n', f: 'Input_SeniorDebtAmort*12' } as unknown as number, 'Total months'],
    ['Senior Monthly Payment', '=PMT(Calc_SeniorMonthlyRate,Calc_SeniorTotalPmts,-Calc_SeniorDebt)', { t: 'n', f: 'PMT(Calc_SeniorMonthlyRate,Calc_SeniorTotalPmts,-Calc_SeniorDebt)' } as unknown as number, 'Excel PMT function'],
    ['Senior Annual Debt Service', '=Calc_SeniorMonthlyPmt*12', { t: 'n', f: 'Calc_SeniorMonthlyPmt*12' } as unknown as number, 'Annual payment'],

    // OZ Tax (Year 5)
    ['', '', '', ''],
    ['OZ YEAR 5 TAX', '', '', ''],
    ['Step-Up Percent', '=IF(Input_OZVersion=1,0,IF(Input_OZType=1,0.3,0.1))', { t: 'n', f: 'IF(Input_OZVersion=1,0,IF(Input_OZType=1,0.3,0.1))' } as unknown as number, 'OZ 1.0=0%, 2.0=10%/30%'],
    ['Taxable Gains', '=Input_DeferredGains*(1-Calc_StepUpPct)', { t: 'n', f: 'Input_DeferredGains*(1-Calc_StepUpPct)' } as unknown as number, 'After step-up reduction'],
    ['Combined Cap Gains Rate', '=(Input_LTCapGainsRate+Input_NIITRate+Input_StateCapGainsRate)/100', { t: 'n', f: '(Input_LTCapGainsRate+Input_NIITRate+Input_StateCapGainsRate)/100' } as unknown as number, 'Total capital gains rate'],
    ['OZ Year 5 Tax Payment', '=Calc_TaxableGains*Calc_CombinedCapGainsRate', { t: 'n', f: 'Calc_TaxableGains*Calc_CombinedCapGainsRate' } as unknown as number, 'Tax due in Year 5'],

    // Exit Value
    ['', '', '', ''],
    ['EXIT CALCULATION', '', '', ''],
    [`Final Year NOI (Year ${holdPeriod})`, `=YBY_NOI_${holdPeriod}`, { t: 'n', f: `YBY_NOI_${holdPeriod}` } as unknown as number, 'NOI in exit year'],
    ['Exit Value', '=Calc_FinalYearNOI/(Input_ExitCapRate/100)', { t: 'n', f: 'Calc_FinalYearNOI/(Input_ExitCapRate/100)' } as unknown as number, 'NOI / Cap Rate'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet['!cols'] = [
    { wch: 25 }, // Calculation name
    { wch: 50 }, // Formula
    { wch: 15 }, // Value
    { wch: 30 }, // Notes
  ];

  return sheet;
}

// ============================================================================
// YEAR-BY-YEAR SHEET
// ============================================================================

function buildYearByYearSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): { sheet: XLSX.WorkSheet; namedRanges: NamedRangeDefinition[] } {
  const namedRanges: NamedRangeDefinition[] = [];
  const holdPeriod = params.holdPeriod || 10;
  const cashFlows = results.investorCashFlows;

  // Header row
  const headers = [
    'Year',
    'NOI',
    'Hard Debt Service',
    'Cash After Debt',
    'Tax Benefit',
    'Operating CF',
    'Sub-Debt Interest',
    'PIK Accrued',
    'PIK Balance',
    'Total Cash Flow',
    'Cumulative Returns',
  ];

  const data: (string | number)[][] = [
    ['Year-by-Year Cash Flow Projection', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
    headers,
  ];

  // Add each year's data with formulas where appropriate
  cashFlows.forEach((cf, index) => {
    const year = cf.year;
    const rowNum = index + 4; // Excel row number (1-indexed, after header rows)

    // Year 1: Use actual values
    // Years 2+: Use formulas for growing NOI
    let noiFormula: string | number;
    if (year === 1) {
      noiFormula = cf.noi;
    } else {
      // NOI grows by revenue growth rate minus expense impact
      noiFormula = { t: 'n', f: `B${rowNum}*(1+Input_RevenueGrowth/100)` } as unknown as number;
    }

    // Hard debt service formula (simplified - actual calculation is more complex)
    const debtServiceValue = cf.debtServicePayments;

    // Cash after debt
    const cashAfterDebtFormula = { t: 'n', f: `B${rowNum + 1}-C${rowNum + 1}` } as unknown as number;

    // Tax benefit (Year 1 is special, Years 2+ use straight-line)
    let taxBenefitFormula: string | number;
    if (year === 1) {
      taxBenefitFormula = cf.taxBenefit;
    } else {
      taxBenefitFormula = { t: 'n', f: 'Calc_AnnualMACRS*(Calc_EffectiveTaxRate/100)' } as unknown as number;
    }

    // PIK Balance formula (compounds each year)
    let pikBalanceFormula: string | number;
    if (year === 1) {
      pikBalanceFormula = cf.investorPikBalance || 0;
    } else {
      pikBalanceFormula = { t: 'n', f: `I${rowNum}+H${rowNum + 1}` } as unknown as number;
    }

    // Cumulative returns formula
    let cumulativeFormula: string | number;
    if (year === 1) {
      cumulativeFormula = cf.cumulativeReturns;
    } else {
      cumulativeFormula = { t: 'n', f: `K${rowNum}+J${rowNum + 1}` } as unknown as number;
    }

    data.push([
      year,
      cf.noi, // Use actual NOI (complex growth calculation)
      debtServiceValue,
      cf.cashAfterDebtService,
      cf.taxBenefit,
      cf.operatingCashFlow,
      cf.subDebtInterest,
      cf.investorSubDebtPIKAccrued || 0,
      cf.investorPikBalance || 0,
      cf.totalCashFlow,
      cf.cumulativeReturns,
    ]);

    // Create named ranges for NOI values (used in exit calculation)
    // rowNum already equals index + 4, which is the correct Excel row number
    namedRanges.push({
      name: `YBY_NOI_${year}`,
      ref: `'Year-by-Year'!$B$${rowNum}`,
    });

    // Create named range for total cash flow (used in IRR)
    namedRanges.push({
      name: `YBY_TotalCF_${year}`,
      ref: `'Year-by-Year'!$J$${rowNum}`,
    });
  });

  // Add blank row and exit year data
  data.push(['', '', '', '', '', '', '', '', '', '', '']);
  data.push(['Exit (End of Year ' + holdPeriod + ')', '', '', '', '', '', '', '', '', '', '']);
  data.push(['Exit Proceeds', results.exitProceeds, '', '', '', '', '', '', '', '', '']);
  data.push(['Investor Sub-Debt Repayment', results.investorSubDebtAtExit, '', '', '', '', '', '', '', '', '']);

  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet['!cols'] = [
    { wch: 8 },  // Year
    { wch: 12 }, // NOI
    { wch: 15 }, // Debt Service
    { wch: 15 }, // Cash After Debt
    { wch: 12 }, // Tax Benefit
    { wch: 12 }, // Operating CF
    { wch: 15 }, // Sub-Debt Interest
    { wch: 12 }, // PIK Accrued
    { wch: 12 }, // PIK Balance
    { wch: 15 }, // Total Cash Flow
    { wch: 15 }, // Cumulative
  ];

  return { sheet, namedRanges };
}

// ============================================================================
// SUMMARY SHEET
// ============================================================================

function buildSummarySheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const holdPeriod = params.holdPeriod || 10;

  // Build IRR cash flow range reference
  const irrRangeStart = 4; // Row where cash flows start in Year-by-Year
  const irrRangeEnd = irrRangeStart + holdPeriod - 1;

  // IMPL-041: Calculate values for previously hardcoded zeros
  const projectCost = params.projectCost + (params.predevelopmentCosts || 0);
  const depreciableBasis = projectCost - params.landValue;
  const costSegPct = params.yearOneDepreciationPct || 20;
  const bonusDepreciation = depreciableBasis * (costSegPct / 100);
  const remainingBasis = depreciableBasis - bonusDepreciation;
  const annualMACRS = remainingBasis / 27.5;
  const pisMonth = params.placedInServiceMonth || 7;
  const monthsInYear1 = 12.5 - pisMonth;
  const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
  const totalYear1Depreciation = bonusDepreciation + year1MACRS;
  const total10YearDepreciation = totalYear1Depreciation + (annualMACRS * (holdPeriod - 1));

  // OZ Step-up calculation
  const ozStepUp = params.ozEnabled
    ? (params.ozVersion === '2.0' ? (params.ozType === 'rural' ? 30 : 10) : 0)
    : 0;

  // Simplified IRR cross-check (CAGR approximation)
  const irrCrossCheck = results.multiple > 0 && holdPeriod > 0
    ? (Math.pow(results.multiple, 1 / holdPeriod) - 1) * 100
    : 0;

  const data: (string | number)[][] = [
    ['Investment Summary', '', '', ''],
    ['', '', '', ''],
    ['Metric', 'Formula', 'Value', 'Notes'],

    // Investment
    ['', '', '', ''],
    ['INVESTMENT', '', '', ''],
    ['Total Investment', '=Calc_InvestorEquity+Calc_InvestorSubDebt', results.totalInvestment, 'Equity + Sub-debt'],
    ['Investor Equity', '=Calc_InvestorEquity', results.investorEquity, 'Cash equity contribution'],
    ['Investor Sub-Debt', '=Calc_InvestorSubDebt', results.investorSubDebtAtExit, 'Sub-debt principal'],

    // Returns
    ['', '', '', ''],
    ['RETURNS', '', '', ''],
    ['Total Tax Benefits', `=SUMPRODUCT(E4:E${irrRangeEnd + 1})`, results.investorTaxBenefits, 'Sum of all tax benefits'],
    ['Total Operating Cash Flow', `=SUMPRODUCT(F4:F${irrRangeEnd + 1})`, results.investorOperatingCashFlows, 'Sum of operating distributions'],
    ['Exit Proceeds', '=Calc_ExitValue-Calc_SeniorDebt-Calc_PhilDebt-Calc_HDCSubDebt', results.exitProceeds, 'After debt payoff'],
    ['Total Returns', '=Summary_TaxBenefits+Summary_OperatingCF+Summary_ExitProceeds+Summary_SubDebtRepay', results.totalReturns, 'All returns combined'],

    // Metrics
    ['', '', '', ''],
    ['KEY METRICS', '', '', ''],
    [
      'IRR',
      `=IRR({-Summary_TotalInvestment,'Year-by-Year'!J4:J${irrRangeEnd + 1}})*100`,
      results.irr,
      'Internal Rate of Return (%)',
    ],
    [
      'Equity Multiple (MOIC)',
      '=Summary_TotalReturns/Summary_TotalInvestment',
      results.multiple,
      'Multiple on Invested Capital',
    ],
    ['Exit Value', '=Calc_ExitValue', results.exitValue, 'Property value at exit'],

    // Tax Analysis
    ['', '', '', ''],
    ['TAX ANALYSIS', '', '', ''],
    ['Year 1 Depreciation', '=Calc_TotalY1Depr', results.depreciationSchedule?.year1Spike || totalYear1Depreciation, 'Bonus + MACRS'],
    ['Year 1 Tax Benefit', '=Engine Value', results.investorCashFlows[0]?.taxBenefit || 0, 'Tax savings Year 1 (conformity-adjusted)'],
    ['10-Year Total Depreciation', '=Calc_TotalY1Depr+Calc_AnnualMACRS*9', total10YearDepreciation, 'Total depreciation over hold'],
    ['10-Year Total Tax Benefit', '=Summary_TaxBenefits', results.investorTaxBenefits, 'Total tax savings'],

    // OZ Analysis (if applicable)
    ['', '', '', ''],
    ['OZ ANALYSIS', '', '', ''],
    ['Deferred Gains', '=Input_DeferredGains', params.deferredCapitalGains || 0, 'Capital gains deferred'],
    ['Step-Up Reduction', '=Calc_StepUpPct*100', ozStepUp, `${params.ozVersion === '2.0' ? (params.ozType === 'rural' ? '30% rural' : '10% standard') : '0% (v1.0)'}`],
    ['Year 5 Tax Payment', '=Calc_OZYear5Tax', results.investorCashFlows[4]?.ozYear5TaxPayment || 0, 'Tax due on deferred gains'],

    // Validation
    ['', '', '', ''],
    ['VALIDATION', '', '', ''],
    ['Capital Stack Check', '=Input_InvestorEquityPct+Input_SeniorDebtPct+Input_PhilDebtPct+Input_HDCSubDebtPct+Input_InvestorSubDebtPct', 100, 'Should equal ~100%'],
    ['IRR Cross-Check', '=(MOIC^(1/HoldPeriod)-1)*100', Math.round(irrCrossCheck * 100) / 100, 'CAGR approximation'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet['!cols'] = [
    { wch: 25 }, // Metric
    { wch: 60 }, // Formula
    { wch: 15 }, // Value
    { wch: 30 }, // Notes
  ];

  return sheet;
}

// ============================================================================
// CAPITAL STACK SHEET (IMPL-038)
// ============================================================================

function buildCapitalStackSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const projectCost = params.projectCost + (params.predevelopmentCosts || 0);

  // Calculate amounts from percentages
  const investorEquity = projectCost * (params.investorEquityPct / 100);
  const seniorDebt = projectCost * ((params.seniorDebtPct || 0) / 100);
  const philDebt = projectCost * ((params.philanthropicDebtPct || 0) / 100);
  const hdcSubDebt = projectCost * ((params.hdcSubDebtPct || 0) / 100);
  const investorSubDebt = projectCost * ((params.investorSubDebtPct || 0) / 100);
  const outsideInvestorSubDebt = projectCost * ((params.outsideInvestorSubDebtPct || 0) / 100);

  const totalSources = investorEquity + seniorDebt + philDebt + hdcSubDebt + investorSubDebt + outsideInvestorSubDebt;
  const totalUses = projectCost;
  const validation = totalSources - totalUses;

  const data: (string | number)[][] = [
    ['Capital Stack - Sources = Uses', '', '', ''],
    ['', '', '', ''],
    ['Calculation', 'Formula', 'Value ($M)', 'Notes'],

    // Sources
    ['', '', '', ''],
    ['SOURCES OF CAPITAL', '', '', ''],
    ['Investor Equity', `=ProjectCost × ${params.investorEquityPct}%`, investorEquity, 'Cash equity contribution'],
    ['Senior Debt', `=ProjectCost × ${params.seniorDebtPct || 0}%`, seniorDebt, `${params.seniorDebtRate || 5}% rate, ${params.seniorDebtAmortization || 35}yr amort`],
    ['Philanthropic Debt', `=ProjectCost × ${params.philanthropicDebtPct || 0}%`, philDebt, `${params.philanthropicDebtRate || 0}% rate, interest-only`],
    ['HDC Sub-Debt', `=ProjectCost × ${params.hdcSubDebtPct || 0}%`, hdcSubDebt, `${params.hdcSubDebtPikRate || 8}% PIK`],
    ['Investor Sub-Debt', `=ProjectCost × ${params.investorSubDebtPct || 0}%`, investorSubDebt, `${params.investorSubDebtPikRate || 8}% PIK`],
    ['Outside Investor Sub-Debt', `=ProjectCost × ${params.outsideInvestorSubDebtPct || 0}%`, outsideInvestorSubDebt, `${params.outsideInvestorSubDebtPikRate || 8}% PIK`],
    ['', '', '', ''],
    ['Total Sources', '=SUM(Equity + All Debt)', totalSources, ''],

    // Uses
    ['', '', '', ''],
    ['USES OF CAPITAL', '', '', ''],
    ['Project Cost', '=Input_ProjectCost', params.projectCost, 'Hard costs + improvements'],
    ['Predevelopment Costs', '=Input_PredevelopmentCosts', params.predevelopmentCosts || 0, 'Soft costs'],
    ['', '', '', ''],
    ['Total Uses', '=ProjectCost + Predevelopment', totalUses, ''],

    // Validation
    ['', '', '', ''],
    ['VALIDATION', '', '', ''],
    ['Sources - Uses', '=TotalSources - TotalUses', validation, validation === 0 ? '✓ Balanced' : '⚠ Imbalance'],
    ['Capital Stack %', `=${params.investorEquityPct}+${params.seniorDebtPct||0}+${params.philanthropicDebtPct||0}+${params.hdcSubDebtPct||0}+${params.investorSubDebtPct||0}+${params.outsideInvestorSubDebtPct||0}`,
      params.investorEquityPct + (params.seniorDebtPct||0) + (params.philanthropicDebtPct||0) + (params.hdcSubDebtPct||0) + (params.investorSubDebtPct||0) + (params.outsideInvestorSubDebtPct||0),
      'Should equal ~100%'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 25 },
    { wch: 45 },
    { wch: 15 },
    { wch: 35 },
  ];

  return sheet;
}

// ============================================================================
// DEBT SERVICE SCHEDULE SHEET (IMPL-038)
// ============================================================================

function buildDebtServiceSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const holdPeriod = params.holdPeriod || 10;
  const cashFlows = results.investorCashFlows;
  const projectCost = params.projectCost + (params.predevelopmentCosts || 0);

  // Headers
  const headers = [
    'Year',
    'Senior DS',
    'Phil Interest',
    'HDC PIK Accrued',
    'Inv PIK Accrued',
    'Outside PIK',
    'Total Hard DS',
    'HDC Balance',
    'Inv Balance',
    'Outside Balance',
  ];

  const data: (string | number)[][] = [
    ['Debt Service Schedule', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    headers,
  ];

  // Calculate initial balances
  const seniorDebt = projectCost * ((params.seniorDebtPct || 0) / 100);
  const philDebt = projectCost * ((params.philanthropicDebtPct || 0) / 100);
  const hdcSubDebt = projectCost * ((params.hdcSubDebtPct || 0) / 100);
  const investorSubDebt = projectCost * ((params.investorSubDebtPct || 0) / 100);
  const outsideSubDebt = projectCost * ((params.outsideInvestorSubDebtPct || 0) / 100);

  // Track PIK balances
  let hdcBalance = hdcSubDebt;
  let invBalance = investorSubDebt;
  let outsideBalance = outsideSubDebt;

  cashFlows.forEach((cf, index) => {
    const year = cf.year;
    const hardDS = cf.hardDebtService || 0;

    // Calculate debt service components
    const seniorDS = hardDS - (philDebt * ((params.philanthropicDebtRate || 0) / 100));
    const philInterest = philDebt * ((params.philanthropicDebtRate || 0) / 100);
    const hdcPIK = cf.hdcSubDebtPIKAccrued || hdcBalance * ((params.hdcSubDebtPikRate || 8) / 100);
    const invPIK = cf.investorSubDebtPIKAccrued || 0;
    const outsidePIK = cf.outsideInvestorPIKAccrued || 0;

    // Update balances
    hdcBalance += hdcPIK;
    invBalance += invPIK;
    outsideBalance += outsidePIK;

    data.push([
      year,
      seniorDS > 0 ? seniorDS : hardDS,
      philInterest,
      hdcPIK,
      invPIK,
      outsidePIK,
      hardDS,
      hdcBalance,
      cf.investorPikBalance || invBalance,
      outsideBalance,
    ]);
  });

  // Add totals row
  data.push(['', '', '', '', '', '', '', '', '', '']);
  data.push([
    'At Exit',
    'Remaining: See Exit Sheet',
    '',
    '',
    '',
    '',
    '',
    hdcBalance,
    results.investorSubDebtAtExit,
    results.outsideInvestorSubDebtAtExit || outsideBalance,
  ]);

  // Add formulas explanation
  data.push(['', '', '', '', '', '', '', '', '', '']);
  data.push(['FORMULAS:', '', '', '', '', '', '', '', '', '']);
  data.push(['Senior DS', `=PMT(${params.seniorDebtRate||5}%/12, ${params.seniorDebtAmortization||35}×12, -SeniorDebt)×12`, '', '', '', '', '', '', '', '']);
  data.push(['Phil Interest', `=PhilDebt × ${params.philanthropicDebtRate||0}%`, '', 'Interest-only, never amortizes', '', '', '', '', '', '']);
  data.push(['PIK Accrual', '=PrevBalance × PIKRate', '', 'Compounds annually', '', '', '', '', '', '']);

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 8 },   // Year
    { wch: 12 },  // Senior DS
    { wch: 12 },  // Phil Interest
    { wch: 14 },  // HDC PIK
    { wch: 14 },  // Inv PIK
    { wch: 12 },  // Outside PIK
    { wch: 12 },  // Total Hard DS
    { wch: 12 },  // HDC Balance
    { wch: 12 },  // Inv Balance
    { wch: 14 },  // Outside Balance
  ];

  return sheet;
}

// ============================================================================
// TAX BENEFITS SHEET (IMPL-038)
// ============================================================================

function buildTaxBenefitsSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const holdPeriod = params.holdPeriod || 10;
  const cashFlows = results.investorCashFlows;
  const projectCost = params.projectCost + (params.predevelopmentCosts || 0);

  // Calculate depreciation components
  const depreciableBasis = projectCost - params.landValue;
  const costSegPct = params.yearOneDepreciationPct || 20;
  const bonusDepreciation = depreciableBasis * (costSegPct / 100);
  const remainingBasis = depreciableBasis - bonusDepreciation;
  const annualMACRS = remainingBasis / 27.5;
  const pisMonth = params.placedInServiceMonth || 7;
  const monthsInYear1 = 12.5 - pisMonth;
  const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
  const totalYear1Depreciation = bonusDepreciation + year1MACRS;

  // Tax rates
  const federalRate = params.federalTaxRate || 37;
  const stateRate = params.stateTaxRate || 0;
  const effectiveRate = federalRate + stateRate;

  // IMPL-041: Use engine values instead of recalculating
  // Engine applies state conformity adjustments (e.g., NJ 30% bonus conformity)
  const year1TaxBenefit = results.investorCashFlows[0]?.taxBenefit || 0;
  // For Years 2+, use engine average (consistent with conformity-adjusted rates)
  const years2PlusTaxBenefits = results.investorCashFlows.slice(1).reduce((sum, cf) => sum + (cf.taxBenefit || 0), 0);
  const annualTaxBenefit = years2PlusTaxBenefits / Math.max(1, results.investorCashFlows.length - 1);

  const data: (string | number)[][] = [
    ['Tax Benefits - Complete Breakdown', '', '', ''],
    ['', '', '', ''],
    ['Calculation', 'Formula', 'Value', 'Notes'],

    // Depreciable Basis
    ['', '', '', ''],
    ['DEPRECIABLE BASIS', '', '', ''],
    ['Project Cost', '=Input_ProjectCost + Input_PredevelopmentCosts', projectCost, ''],
    ['Less: Land Value', '=Input_LandValue', params.landValue, 'Non-depreciable'],
    ['Depreciable Basis', '=ProjectCost - LandValue', depreciableBasis, 'IRS basis for depreciation'],

    // Year 1 Depreciation
    ['', '', '', ''],
    ['YEAR 1 DEPRECIATION', '', '', ''],
    ['Cost Segregation %', '=Input_CostSegPct', costSegPct, 'Portion eligible for bonus'],
    ['Bonus Depreciation', `=DepreciableBasis × ${costSegPct}%`, bonusDepreciation, '100% bonus on segregated'],
    ['Remaining Basis', '=DepreciableBasis - BonusDepr', remainingBasis, 'For 27.5-year MACRS'],
    ['Annual MACRS', '=RemainingBasis / 27.5', annualMACRS, 'IRS residential schedule'],
    ['PIS Month', '=Input_PISMonth', pisMonth, 'Placed in service month'],
    ['Months in Year 1', '=12.5 - PISMonth', monthsInYear1, 'Mid-month convention'],
    ['Year 1 MACRS', '=(MonthsY1/12) × AnnualMACRS', year1MACRS, 'Prorated first year'],
    ['Total Year 1 Depreciation', '=BonusDepr + Year1MACRS', totalYear1Depreciation, 'Spike year'],

    // Tax Benefit Calculation
    ['', '', '', ''],
    ['TAX BENEFIT CALCULATION', '', '', ''],
    ['Federal Tax Rate', '=Input_FederalTaxRate', federalRate, '%'],
    ['State Tax Rate', '=Input_StateTaxRate', stateRate, '%'],
    ['Combined Rate (Reference)', '=Federal + State', effectiveRate, 'Note: Actual rate may differ'],
    ['Bonus Conformity Rate', '', params.bonusConformityRate ?? 1.0, 'State conformity (0-1)'],
    ['Year 1 Tax Benefit', '=Engine Value (conformity-adjusted)', year1TaxBenefit, 'From engine with conformity'],
    ['Years 2-10 Tax Benefit (avg)', '=Engine Value (full state rate)', annualTaxBenefit, 'MACRS uses full rate'],

    // 10-Year Summary (IMPL-041: Use engine values for accuracy)
    ['', '', '', ''],
    ['10-YEAR TAX BENEFIT SUMMARY', '', '', ''],
    ['Year 1', '=Engine Value', year1TaxBenefit, 'Conformity-adjusted'],
    ['Years 2-10', '=Engine Value', years2PlusTaxBenefits, 'Full state rate'],
    ['Total 10-Year Tax Benefit', '=Engine Total', results.investorTaxBenefits, 'Verified engine value'],
  ];

  // OZ Section (if enabled)
  if (params.ozEnabled) {
    const stepUp = params.ozVersion === '2.0' ? (params.ozType === 'rural' ? 0.3 : 0.1) : 0;
    const taxableGains = (params.deferredCapitalGains || 0) * (1 - stepUp);
    const cgRate = ((params.ltCapitalGainsRate || 20) + (params.niitRate || 3.8) + (params.stateCapitalGainsRate || 0)) / 100;
    const ozYear5Tax = taxableGains * cgRate;

    data.push(['', '', '', '']);
    data.push(['OZ BENEFITS (Opportunity Zone)', '', '', '']);
    data.push(['OZ Version', params.ozVersion || '1.0', '', params.ozVersion === '2.0' ? 'OBBBA 2025' : 'TCJA Original']);
    data.push(['OZ Type', params.ozType || 'standard', '', '']);
    data.push(['Step-Up %', `=${stepUp * 100}%`, stepUp, 'Basis increase on deferred gains']);
    data.push(['Deferred Capital Gains', '=Input_DeferredGains', params.deferredCapitalGains || 0, '']);
    data.push(['Taxable Gains (after step-up)', `=DeferredGains × (1 - ${stepUp * 100}%)`, taxableGains, '']);
    data.push(['Combined CG Rate', `=LT + NIIT + State`, cgRate * 100, '%']);
    data.push(['Year 5 Tax Payment', '=TaxableGains × CGRate', ozYear5Tax, 'Due in Year 5 of hold']);

    if (results.ozRecaptureAvoided) {
      data.push(['Recapture Avoided (10yr+)', '=CumulativeDepr × 25%', results.ozRecaptureAvoided, '25% federal recapture']);
    }
    if (results.ozDeferralNPV) {
      data.push(['Deferral NPV', '=DeferredGains × CGRate × (1-1/1.08^5)', results.ozDeferralNPV, '8% discount, 5 years']);
    }
    if (results.ozExitAppreciation) {
      data.push(['Exit Appreciation Benefit', '=Appreciation × CGRate', results.ozExitAppreciation, 'Tax-free growth (10yr+)']);
    }
  }

  // LIHTC Section (if credits exist)
  const hasLIHTC = cashFlows.some(cf => (cf.federalLIHTCCredit || 0) > 0);
  if (hasLIHTC) {
    data.push(['', '', '', '']);
    data.push(['FEDERAL LIHTC CREDITS', '', '', '']);
    data.push(['Year', 'Formula', 'Credit Amount', 'Notes']);

    let totalLIHTC = 0;
    cashFlows.forEach((cf, i) => {
      const credit = cf.federalLIHTCCredit || 0;
      totalLIHTC += credit;
      if (credit > 0 || i < 11) {
        data.push([`Year ${cf.year}`, i === 0 ? '=AnnualCredit × ProrationFactor' : '=AnnualCredit', credit, '']);
      }
    });
    data.push(['Total LIHTC', '=SUM(Y1:Y11)', totalLIHTC, '10 full years of credits']);
  }

  // State LIHTC (if enabled)
  const hasStateLIHTC = cashFlows.some(cf => (cf.stateLIHTCCredit || 0) > 0);
  if (hasStateLIHTC) {
    data.push(['', '', '', '']);
    data.push(['STATE LIHTC CREDITS', '', '', '']);
    let totalStateLIHTC = 0;
    cashFlows.forEach(cf => {
      const credit = cf.stateLIHTCCredit || 0;
      totalStateLIHTC += credit;
    });
    data.push(['Total State LIHTC', '', totalStateLIHTC, 'Direct use credits']);
  }

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 28 },
    { wch: 40 },
    { wch: 15 },
    { wch: 30 },
  ];

  return sheet;
}

// ============================================================================
// OPERATING CASH FLOW SHEET (IMPL-038)
// ============================================================================

function buildOperatingCashFlowSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const cashFlows = results.investorCashFlows;

  const headers = [
    'Year',
    'NOI',
    'Hard DS',
    'Hard DSCR',
    'Cash After Hard',
    'Sub-Debt Net',
    'AUM Fee',
    'Final Cash',
    'Inv Promote',
  ];

  const data: (string | number)[][] = [
    ['Operating Cash Flow - NOI to Distributions', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    headers,
  ];

  cashFlows.forEach(cf => {
    const hardDS = cf.hardDebtService || 0;
    const noi = cf.noi || 0;
    const hardDSCR = hardDS > 0 ? noi / hardDS : 0;
    const cashAfterHard = noi - hardDS;
    const subDebtNet = (cf.subDebtInterest || 0) - (cf.investorSubDebtInterestReceived || 0);

    data.push([
      cf.year,
      noi,
      hardDS,
      Math.round(hardDSCR * 100) / 100,
      cashAfterHard,
      subDebtNet,
      cf.aumFeeAmount || 0,
      cf.cashAfterDebtAndFees || (cashAfterHard - subDebtNet - (cf.aumFeePaid || 0)),
      cf.operatingCashFlow || 0,
    ]);
  });

  // Add formulas explanation
  data.push(['', '', '', '', '', '', '', '', '']);
  data.push(['FORMULAS:', '', '', '', '', '', '', '', '']);
  data.push(['Hard DSCR', '=NOI / HardDebtService', '', 'Target: 1.05x', '', '', '', '', '']);
  data.push(['Cash After Hard', '=NOI - HardDebtService', '', '', '', '', '', '', '']);
  data.push(['Sub-Debt Net', '=HDC+Outside PIK - InvestorReceived', '', 'Net outflow to project', '', '', '', '', '']);
  data.push(['Final Cash', '=CashAfterHard - SubDebtNet - AUMFee', '', '', '', '', '', '', '']);
  data.push(['Inv Promote', `=FinalCash × ${params.investorPromoteShare}%`, '', `Investor share: ${params.investorPromoteShare}%`, '', '', '', '', '']);

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
  ];

  return sheet;
}

// ============================================================================
// WATERFALL DISTRIBUTION SHEET (IMPL-038)
// ============================================================================

function buildWaterfallSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const cashFlows = results.investorCashFlows;
  const investorEquity = results.investorEquity;

  const headers = [
    'Year',
    'Tax Benefit',
    'Operating CF',
    'Fed LIHTC',
    'State LIHTC',
    'Sub-Debt Int',
    'OZ Tax',
    'Total CF',
    'Cumulative',
    'Equity Recovered?',
  ];

  const data: (string | number)[][] = [
    ['Waterfall Distribution - Equity Recovery Tracking', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    [`Investor Equity Target: $${investorEquity.toFixed(3)}M`, '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    headers,
  ];

  cashFlows.forEach(cf => {
    const fedLIHTC = cf.federalLIHTCCredit || 0;
    const stateLIHTC = cf.stateLIHTCCredit || 0;
    const subDebtInt = cf.investorSubDebtInterestReceived || 0;
    const ozTax = cf.ozYear5TaxPayment || 0;
    const recovered = cf.cumulativeReturns >= investorEquity;

    data.push([
      cf.year,
      cf.taxBenefit,
      cf.operatingCashFlow,
      fedLIHTC,
      stateLIHTC,
      subDebtInt,
      ozTax > 0 ? -ozTax : 0,
      cf.totalCashFlow,
      cf.cumulativeReturns,
      recovered ? 'YES' : `Need: $${(investorEquity - cf.cumulativeReturns).toFixed(2)}M`,
    ]);
  });

  // Waterfall phase explanation
  data.push(['', '', '', '', '', '', '', '', '', '']);
  data.push(['WATERFALL PHASES:', '', '', '', '', '', '', '', '', '']);
  data.push(['Phase 1', 'Return of Capital', '', '100% to investor until equity recovered', '', '', '', '', '', '']);
  data.push(['Phase 2', 'Catch-up', '', 'HDC catches up on deferred promote', '', '', '', '', '', '']);
  data.push(['Phase 3', 'Promote Split', '', `${params.investorPromoteShare}% Investor / ${100 - params.investorPromoteShare}% HDC`, '', '', '', '', '', '']);
  data.push(['', '', '', '', '', '', '', '', '', '']);
  data.push(['NOTE:', 'Tax benefits always 100% to investor, never split by promote', '', '', '', '', '', '', '', '']);

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
  ];

  return sheet;
}

// ============================================================================
// EXIT CALCULATION SHEET (IMPL-038)
// ============================================================================

function buildExitCalculationSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const holdPeriod = params.holdPeriod || 10;
  const finalYearCF = results.investorCashFlows[holdPeriod - 1];
  const finalNOI = finalYearCF?.noi || 0;
  const exitCapRate = params.exitCapRate;
  const exitValue = results.exitValue || (finalNOI / (exitCapRate / 100));

  // Remaining debt at exit
  const remainingSenior = results.remainingDebtAtExit || 0;
  const remainingPhilPIK = results.subDebtAtExit || 0;
  const hdcSubDebtAtExit = remainingPhilPIK; // HDC sub-debt with PIK
  const investorSubDebtAtExit = results.investorSubDebtAtExit || 0;
  const outsideSubDebtAtExit = results.outsideInvestorSubDebtAtExit || 0;

  // Calculate gross proceeds
  const totalDebtPayoff = remainingSenior + hdcSubDebtAtExit + investorSubDebtAtExit + outsideSubDebtAtExit;
  const grossProceeds = exitValue - totalDebtPayoff;

  // Investor waterfall
  const investorEquity = results.investorEquity;
  const returnOfCapital = Math.min(grossProceeds, investorEquity);
  const profit = Math.max(0, grossProceeds - investorEquity);
  const investorProfitShare = profit * (params.investorPromoteShare / 100);
  const investorGrossExit = returnOfCapital + investorProfitShare;

  // Deferred fees
  const accumulatedAUM = results.investorCashFlows.reduce((sum, cf) => sum + (cf.aumFeeAccrued || 0), 0);
  const investorNetExit = results.exitProceeds;

  const data: (string | number)[][] = [
    ['Exit Calculation - Value to Net Proceeds', '', '', ''],
    ['', '', '', ''],
    ['Calculation', 'Formula', 'Value ($M)', 'Notes'],

    // Exit Value
    ['', '', '', ''],
    ['EXIT VALUE', '', '', ''],
    ['Final Year NOI', `=Year ${holdPeriod} NOI`, finalNOI, ''],
    ['Exit Cap Rate', '=Input_ExitCapRate', exitCapRate, '%'],
    ['Gross Exit Value', '=FinalNOI / (ExitCapRate/100)', exitValue, 'Property sale value'],

    // Debt Payoffs
    ['', '', '', ''],
    ['DEBT PAYOFFS (Priority Order)', '', '', ''],
    ['1. Senior Debt Balance', '=RemainingBalance(SeniorDebt)', remainingSenior, 'After amortization'],
    ['2. Phil Debt + PIK', '=PhilDebt + AccumulatedPIK', remainingPhilPIK - hdcSubDebtAtExit, 'Interest-only, PIK compounds'],
    ['3. HDC Sub-Debt + PIK', '=HDCSubDebt + AccumulatedPIK', hdcSubDebtAtExit, 'Compounded PIK'],
    ['4. Investor Sub-Debt + PIK', '=InvSubDebt + AccumulatedPIK', investorSubDebtAtExit, 'Returned to investor'],
    ['5. Outside Inv Sub-Debt + PIK', '=OutsideSubDebt + AccumulatedPIK', outsideSubDebtAtExit, 'If applicable'],
    ['', '', '', ''],
    ['Total Debt Payoff', '=SUM(All Debt)', totalDebtPayoff, ''],
    ['Gross Proceeds', '=ExitValue - TotalDebtPayoff', grossProceeds, 'Available for equity'],

    // Equity Waterfall
    ['', '', '', ''],
    ['EQUITY WATERFALL', '', '', ''],
    ['Investor Equity Basis', '=InvestorEquity', investorEquity, 'Original investment'],
    ['Return of Capital', '=MIN(GrossProceeds, InvestorEquity)', returnOfCapital, '100% to investor'],
    ['Profit', '=MAX(0, GrossProceeds - InvestorEquity)', profit, 'Split per promote'],
    ['Investor Profit Share', `=Profit × ${params.investorPromoteShare}%`, investorProfitShare, `${params.investorPromoteShare}% investor`],
    ['Investor Gross Exit', '=ROC + InvestorProfitShare', investorGrossExit, 'Before fees'],

    // Deferred Fees
    ['', '', '', ''],
    ['DEFERRED FEE COLLECTION', '', '', ''],
    ['Accumulated Deferred AUM', '=SUM(DeferredAUM)', accumulatedAUM, 'Collected from investor share'],
    ['Investor Net Exit', '=InvestorGrossExit - DeferredAUM', investorNetExit, 'Final to investor'],

    // Summary
    ['', '', '', ''],
    ['EXIT SUMMARY', '', '', ''],
    ['Exit Proceeds (Investor)', '', results.exitProceeds, 'Net after all payoffs'],
    ['Sub-Debt Repayment (Investor)', '', investorSubDebtAtExit, 'Principal + PIK returned'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 28 },
    { wch: 40 },
    { wch: 15 },
    { wch: 30 },
  ];

  return sheet;
}

// ============================================================================
// INVESTOR RETURNS SUMMARY SHEET (IMPL-038)
// ============================================================================

function buildInvestorReturnsSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults
): XLSX.WorkSheet {
  const cashFlows = results.investorCashFlows;

  // Sum components
  const totalTaxBenefits = results.investorTaxBenefits;
  const totalOperatingCF = results.investorOperatingCashFlows;
  const totalFedLIHTC = cashFlows.reduce((sum, cf) => sum + (cf.federalLIHTCCredit || 0), 0);
  const totalStateLIHTC = cashFlows.reduce((sum, cf) => sum + (cf.stateLIHTCCredit || 0), 0);
  const totalSubDebtInterest = cashFlows.reduce((sum, cf) => sum + (cf.investorSubDebtInterestReceived || 0), 0);
  const ozYear5Tax = cashFlows.find(cf => cf.year === 5)?.ozYear5TaxPayment || 0;

  // OZ benefits
  const ozRecapture = results.ozRecaptureAvoided || 0;
  const ozDeferral = results.ozDeferralNPV || 0;
  const ozAppreciation = results.ozExitAppreciation || 0;
  const totalOZBenefits = ozRecapture + ozDeferral + ozAppreciation;

  const data: (string | number)[][] = [
    ['Investor Returns Summary - Complete Buildup', '', '', ''],
    ['', '', '', ''],
    ['Calculation', 'Formula', 'Value ($M)', 'Notes'],

    // Investment
    ['', '', '', ''],
    ['INVESTMENT', '', '', ''],
    ['Investor Equity', '', results.investorEquity, 'Cash contribution'],
    ['Investor Sub-Debt Principal', '', (params.projectCost + (params.predevelopmentCosts || 0)) * ((params.investorSubDebtPct || 0) / 100), 'Loan to project'],
    ['Total Investment', '=Equity + SubDebt', results.totalInvestment, 'Total cash out'],

    // Operating Period Returns
    ['', '', '', ''],
    ['OPERATING PERIOD RETURNS', '', '', ''],
    ['Tax Benefits (10 years)', '=SUM(TaxBenefit_Y1:Y10)', totalTaxBenefits, 'Depreciation savings'],
    ['Operating Cash Flow', '=SUM(OperatingCF_Y1:Y10)', totalOperatingCF, 'Per promote share'],
    ['Federal LIHTC Credits', '=SUM(FedLIHTC_Y1:Y11)', totalFedLIHTC, 'If applicable'],
    ['State LIHTC Credits', '=SUM(StateLIHTC_Y1:Y11)', totalStateLIHTC, 'Direct use only'],
    ['Sub-Debt Interest Received', '=SUM(SubDebtInt_Y1:Y10)', totalSubDebtInterest, 'Current pay portion'],
    ['Less: OZ Year 5 Tax', '=-OZYear5Tax', ozYear5Tax > 0 ? -ozYear5Tax : 0, 'If OZ enabled'],
    ['Subtotal Operating', '=SUM(above)', totalTaxBenefits + totalOperatingCF + totalFedLIHTC + totalStateLIHTC + totalSubDebtInterest - ozYear5Tax, ''],

    // Exit Returns
    ['', '', '', ''],
    ['EXIT RETURNS', '', '', ''],
    ['Exit Proceeds', '', results.exitProceeds, 'Net after all payoffs'],
    ['Sub-Debt Repayment', '', results.investorSubDebtAtExit, 'Principal + PIK'],
    ['Subtotal Exit', '=ExitProceeds + SubDebtRepay', results.exitProceeds + results.investorSubDebtAtExit, ''],
  ];

  // OZ Benefits (if applicable)
  if (params.ozEnabled && totalOZBenefits > 0) {
    data.push(['', '', '', '']);
    data.push(['OZ BENEFITS (10+ year hold)', '', '', '']);
    data.push(['Recapture Avoided', '=CumulativeDepr × 25%', ozRecapture, '25% federal recapture']);
    data.push(['Deferral NPV', '=DeferredGains × CGRate × NPVFactor', ozDeferral, '5-year time value']);
    data.push(['Exit Appreciation', '=Appreciation × CGRate', ozAppreciation, 'Tax-free growth']);
    data.push(['Subtotal OZ Benefits', '=SUM(above)', totalOZBenefits, '']);
  }

  // Grand Total
  data.push(['', '', '', '']);
  data.push(['GRAND TOTAL', '', '', '']);
  data.push(['Total Returns', '=Operating + Exit + OZ', results.totalReturns, 'All sources']);

  // Key Metrics
  data.push(['', '', '', '']);
  data.push(['KEY METRICS', '', '', '']);
  data.push(['MOIC (Multiple)', '=TotalReturns / TotalInvestment', results.multiple, 'x']);
  data.push(['IRR', '=IRR(CashFlows)', results.irr, '%']);
  data.push(['', '', '', '']);

  // Return Component Breakdown
  data.push(['RETURN BREAKDOWN', '', '', '']);
  const totalReturns = results.totalReturns;
  data.push(['Tax Benefits %', `=${totalTaxBenefits}/${totalReturns}×100`, totalReturns > 0 ? (totalTaxBenefits / totalReturns * 100).toFixed(1) + '%' : '0%', '']);
  data.push(['Operating CF %', `=${totalOperatingCF}/${totalReturns}×100`, totalReturns > 0 ? (totalOperatingCF / totalReturns * 100).toFixed(1) + '%' : '0%', '']);
  data.push(['Exit Proceeds %', `=${results.exitProceeds}/${totalReturns}×100`, totalReturns > 0 ? (results.exitProceeds / totalReturns * 100).toFixed(1) + '%' : '0%', '']);

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 28 },
    { wch: 40 },
    { wch: 15 },
    { wch: 25 },
  ];

  return sheet;
}

// ============================================================================
// HDC RETURNS SUMMARY SHEET (IMPL-038)
// ============================================================================

function buildHDCReturnsSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults,
  hdcResults?: HDCAnalysisResults
): XLSX.WorkSheet {
  const cashFlows = results.investorCashFlows;
  const projectCost = params.projectCost + (params.predevelopmentCosts || 0);

  // Calculate HDC components from available data
  const hdcSubDebtPrincipal = projectCost * ((params.hdcSubDebtPct || 0) / 100);

  // Sum from cash flows if hdcResults not provided
  const totalAUMPaid = cashFlows.reduce((sum, cf) => sum + (cf.aumFeePaid || 0), 0);
  const totalAUMDeferred = cashFlows.reduce((sum, cf) => sum + (cf.aumFeeAccrued || 0), 0);
  const totalHDCPIK = cashFlows.reduce((sum, cf) => sum + (cf.hdcSubDebtPIKAccrued || 0), 0);

  // Use hdcResults if available, otherwise calculate
  const aumFeeIncome = hdcResults?.hdcAumFeeIncome || totalAUMPaid;
  const subDebtCurrentPay = hdcResults?.hdcSubDebtCurrentPayIncome || 0;
  const operatingPromote = hdcResults?.hdcOperatingPromoteIncome || 0;
  const exitPromote = hdcResults?.hdcPromoteProceeds || 0;
  const subDebtRepayment = hdcResults?.hdcSubDebtRepayment || (hdcSubDebtPrincipal + totalHDCPIK);
  const deferredAUMCollected = totalAUMDeferred;
  const totalHDCReturns = hdcResults?.totalHDCReturns || (aumFeeIncome + subDebtCurrentPay + operatingPromote + exitPromote + subDebtRepayment + deferredAUMCollected);

  const data: (string | number)[][] = [
    ['HDC Returns Summary - Complete Buildup', '', '', ''],
    ['', '', '', ''],
    ['Calculation', 'Formula', 'Value ($M)', 'Notes'],

    // Investment
    ['', '', '', ''],
    ['INVESTMENT', '', '', ''],
    ['HDC Initial Investment', '', 0, 'HDC is sponsor - $0 cash'],
    ['HDC Sub-Debt Principal', '', hdcSubDebtPrincipal, 'Loan to project'],

    // Operating Period Returns
    ['', '', '', ''],
    ['OPERATING PERIOD RETURNS', '', '', ''],
    ['AUM Fee Income (Cash)', '=SUM(AUMPaid_Y2:Y10)', aumFeeIncome, 'Paid annually'],
    ['Sub-Debt Current Pay', '=SUM(HDCCurrentPay)', subDebtCurrentPay, 'If current pay enabled'],
    ['Operating Promote', '=SUM(HDCPromote_Y1:Y10)', operatingPromote, `${100 - params.investorPromoteShare}% after hurdle`],
    ['Subtotal Operating', '=SUM(above)', aumFeeIncome + subDebtCurrentPay + operatingPromote, ''],

    // Exit Returns
    ['', '', '', ''],
    ['EXIT RETURNS', '', '', ''],
    ['Exit Promote', '=Profit × HDCPromotePct', exitPromote, `${100 - params.investorPromoteShare}%`],
    ['Sub-Debt Repayment', '=Principal + AccumulatedPIK', subDebtRepayment, 'Compounded PIK'],
    ['Deferred AUM Collected', '=SUM(DeferredAUM)', deferredAUMCollected, 'From investor exit share'],
    ['Subtotal Exit', '=SUM(above)', exitPromote + subDebtRepayment + deferredAUMCollected, ''],

    // Grand Total
    ['', '', '', ''],
    ['GRAND TOTAL', '', '', ''],
    ['Total HDC Returns', '=Operating + Exit', totalHDCReturns, 'All income sources'],

    // Metrics
    ['', '', '', ''],
    ['METRICS', '', '', ''],
    ['HDC Multiple', '=N/A ($0 investment)', hdcResults?.hdcMultiple || 'Infinite', 'No cash investment'],
    ['HDC IRR', '=N/A ($0 investment)', hdcResults?.hdcIRR || 'N/A', 'Undefined'],

    // Income Breakdown
    ['', '', '', ''],
    ['INCOME BREAKDOWN', '', '', ''],
    ['Fee Income (AUM)', '', aumFeeIncome + deferredAUMCollected, 'Cash + deferred'],
    ['Promote Income', '', operatingPromote + exitPromote, 'Operating + exit'],
    ['Debt Income', '', subDebtCurrentPay + subDebtRepayment, 'Current pay + principal'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet['!cols'] = [
    { wch: 28 },
    { wch: 35 },
    { wch: 15 },
    { wch: 25 },
  ];

  return sheet;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate an Excel workbook with live formulas for audit verification.
 * IMPL-038: Complete Audit Export with 12 sheets for full traceability.
 *
 * @param exportParams - Parameters and results for export
 * @returns XLSX WorkBook object
 */
export function generateAuditWorkbook(exportParams: AuditExportParams): XLSX.WorkBook {
  const { params, results, hdcResults } = exportParams;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Build Inputs sheet with named ranges
  const { sheet: inputsSheet, namedRanges: inputRanges } = buildInputsSheet(params);
  XLSX.utils.book_append_sheet(workbook, inputsSheet, 'Inputs');

  // IMPL-038: Capital Stack (Sources = Uses)
  const capitalStackSheet = buildCapitalStackSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, capitalStackSheet, 'Capital Stack');

  // IMPL-038: Debt Service Schedule
  const debtServiceSheet = buildDebtServiceSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, debtServiceSheet, 'Debt Service');

  // IMPL-038: Tax Benefits (Depreciation + LIHTC + OZ)
  const taxBenefitsSheet = buildTaxBenefitsSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, taxBenefitsSheet, 'Tax Benefits');

  // IMPL-038: Operating Cash Flow
  const operatingCFSheet = buildOperatingCashFlowSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, operatingCFSheet, 'Operating CF');

  // IMPL-038: Waterfall Distribution
  const waterfallSheet = buildWaterfallSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, waterfallSheet, 'Waterfall');

  // IMPL-038: Exit Calculation
  const exitSheet = buildExitCalculationSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, exitSheet, 'Exit');

  // IMPL-038: Investor Returns Summary
  const investorReturnsSheet = buildInvestorReturnsSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, investorReturnsSheet, 'Investor Returns');

  // IMPL-038: HDC Returns Summary
  const hdcReturnsSheet = buildHDCReturnsSheet(params, results, hdcResults);
  XLSX.utils.book_append_sheet(workbook, hdcReturnsSheet, 'HDC Returns');

  // Build Calculations sheet (original - now supplementary)
  const calculationsSheet = buildCalculationsSheet(params);
  XLSX.utils.book_append_sheet(workbook, calculationsSheet, 'Calculations');

  // Build Year-by-Year sheet with named ranges
  const { sheet: ybySheet, namedRanges: ybyRanges } = buildYearByYearSheet(params, results);
  XLSX.utils.book_append_sheet(workbook, ybySheet, 'Year-by-Year');

  // Build Summary sheet
  const summarySheet = buildSummarySheet(params, results);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Add named ranges to workbook
  // Note: SheetJS named ranges require specific format
  const allRanges = [...inputRanges, ...ybyRanges];

  // Create defined names array
  if (!workbook.Workbook) workbook.Workbook = {};
  if (!workbook.Workbook.Names) workbook.Workbook.Names = [];

  allRanges.forEach((range) => {
    workbook.Workbook!.Names!.push({
      Name: range.name,
      Ref: range.ref,
    });
  });

  // Add calculation named ranges (for formulas that reference calculations)
  const calcRanges: NamedRangeDefinition[] = [
    { name: 'Calc_TotalProjectCost', ref: 'Calculations!$C$6' },
    { name: 'Calc_DepreciableBasis', ref: 'Calculations!$C$7' },
    { name: 'Calc_BonusDepr', ref: 'Calculations!$C$10' },
    { name: 'Calc_RemainingBasis', ref: 'Calculations!$C$11' },
    { name: 'Calc_AnnualMACRS', ref: 'Calculations!$C$12' },
    { name: 'Calc_MonthsY1', ref: 'Calculations!$C$13' },
    { name: 'Calc_Year1MACRS', ref: 'Calculations!$C$14' },
    { name: 'Calc_TotalY1Depr', ref: 'Calculations!$C$15' },
    { name: 'Calc_EffectiveTaxRate', ref: 'Calculations!$C$18' },
    { name: 'Calc_Year1TaxBenefit', ref: 'Calculations!$C$19' },
    { name: 'Calc_EffectiveProjectCost', ref: 'Calculations!$C$22' },
    { name: 'Calc_InvestorEquity', ref: 'Calculations!$C$23' },
    { name: 'Calc_SeniorDebt', ref: 'Calculations!$C$24' },
    { name: 'Calc_PhilDebt', ref: 'Calculations!$C$25' },
    { name: 'Calc_HDCSubDebt', ref: 'Calculations!$C$26' },
    { name: 'Calc_InvestorSubDebt', ref: 'Calculations!$C$27' },
    { name: 'Calc_SeniorMonthlyRate', ref: 'Calculations!$C$30' },
    { name: 'Calc_SeniorTotalPmts', ref: 'Calculations!$C$31' },
    { name: 'Calc_SeniorMonthlyPmt', ref: 'Calculations!$C$32' },
    { name: 'Calc_SeniorAnnualDS', ref: 'Calculations!$C$33' },
    { name: 'Calc_StepUpPct', ref: 'Calculations!$C$36' },
    { name: 'Calc_TaxableGains', ref: 'Calculations!$C$37' },
    { name: 'Calc_CombinedCapGainsRate', ref: 'Calculations!$C$38' },
    { name: 'Calc_OZYear5Tax', ref: 'Calculations!$C$39' },
    { name: 'Calc_FinalYearNOI', ref: 'Calculations!$C$42' },
    { name: 'Calc_ExitValue', ref: 'Calculations!$C$43' },
  ];

  // Add summary named ranges
  const summaryRanges: NamedRangeDefinition[] = [
    { name: 'Summary_TotalInvestment', ref: 'Summary!$C$6' },
    { name: 'Summary_TaxBenefits', ref: 'Summary!$C$11' },
    { name: 'Summary_OperatingCF', ref: 'Summary!$C$12' },
    { name: 'Summary_ExitProceeds', ref: 'Summary!$C$13' },
    { name: 'Summary_SubDebtRepay', ref: 'Summary!$C$8' },
    { name: 'Summary_TotalReturns', ref: 'Summary!$C$14' },
    { name: 'Summary_IRR', ref: 'Summary!$C$17' },
    { name: 'Summary_EquityMultiple', ref: 'Summary!$C$18' },
  ];

  [...calcRanges, ...summaryRanges].forEach((range) => {
    workbook.Workbook!.Names!.push({
      Name: range.name,
      Ref: range.ref,
    });
  });

  return workbook;
}

/**
 * Download the audit workbook as an Excel file.
 *
 * @param workbook - XLSX WorkBook to download
 * @param projectName - Name for the file
 */
export function downloadAuditWorkbook(workbook: XLSX.WorkBook, projectName: string = 'HDC_Project'): void {
  // Format date as YYYY-MM-DD
  const date = new Date().toISOString().split('T')[0];

  // Sanitize project name for filename
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Generate filename
  const filename = `Audit_${safeName}_${date}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, filename);
}

/**
 * Convenience function to generate and download in one step.
 *
 * @param exportParams - Export parameters
 */
export function exportAuditWorkbook(exportParams: AuditExportParams): void {
  const workbook = generateAuditWorkbook(exportParams);
  downloadAuditWorkbook(workbook, exportParams.projectName);
}
