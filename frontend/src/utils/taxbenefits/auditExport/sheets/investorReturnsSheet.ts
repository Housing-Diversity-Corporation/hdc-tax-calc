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
import { CalculationParams, InvestorAnalysisResults, CashFlowItem, ComputedTimeline } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Investor Returns sheet with OZ benefits
 * IMPL-115: Optional timeline for calendar year labels
 */
export function buildInvestorReturnsSheet(
  params: CalculationParams,
  results: InvestorAnalysisResults,
  cashFlows: CashFlowItem[],
  timeline?: ComputedTimeline | null
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;
  const investorEquityGross = projectCost * params.investorEquityPct / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;

  // IMPL-074/077: Get syndication offset and year from engine results
  const syndicationOffset = results.syndicatedEquityOffset || 0;
  const syndicationYear = results.stateLIHTCSyndicationYear ?? params.stateLIHTCSyndicationYear ?? 0;
  const investorEquityNet = investorEquityGross - syndicationOffset;
  // IMPL-077: Initial investment depends on syndication year
  // Year 0: Syndicator funds at close → net equity
  // Year 1+: Investor funds full amount → gross equity
  const totalInvestment = syndicationYear === 0
    ? investorEquityNet + investorSubDebt   // Year 0: net equity
    : investorEquityGross + investorSubDebt; // Year 1+: gross equity

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

  // Column headers - Year 0 through Year 10 (with calendar years when timeline available)
  const headerRow = 3;
  ws[`A${headerRow}`] = { t: 's', v: 'Component' };
  const investmentCalendarYear = timeline ? timeline.investmentDate.getFullYear() : null;
  for (let year = 0; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year); // B, C, D, ...
    const calLabel = investmentCalendarYear ? ` (${investmentCalendarYear + year})` : '';
    ws[`${col}${headerRow}`] = { t: 's', v: year === 0 ? `Year 0${calLabel}` : `Year ${year}${calLabel}` };
  }

  // Data rows
  let currentRow = 4;

  // === CASH FLOWS ===
  ws[`A${currentRow}`] = { t: 's', v: '=== CASH FLOWS ===' };
  currentRow++;

  // IMPL-077: Initial Investment (Year 0) - depends on syndication year
  // Year 0: net equity (syndicator funded offset)
  // Year 1+: gross equity (investor funds full amount)
  ws[`A${currentRow}`] = { t: 's', v: 'Initial Investment' };
  const investmentFormula = syndicationYear === 0
    ? '-(InvestorEquity-StateLIHTCSyndProceeds+InvestorSubDebt)'  // Year 0: net equity
    : '-(InvestorEquity+InvestorSubDebt)';                        // Year 1+: gross equity
  ws['B' + currentRow] = { t: 'n', v: -totalInvestment, f: investmentFormula } as FormulaCell;
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

  // IMPL-076: State LIHTC Syndication (capital return - only for Year 1+ syndication)
  // Year 0 syndication: proceeds already netted in equity, no cash flow line item
  // Year 1+: Capital return appears in selected year
  ws[`A${currentRow}`] = { t: 's', v: 'State LIHTC Syndication' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    const cf = cashFlows[year - 1];
    // Only show syndication proceeds for Year 1+ (Year 0 = already netted in equity)
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.stateLIHTCSyndicationProceeds || 0, f: `IF(AND(StateLIHTCEnabled,StateLIHTCPath="syndicated",StateLIHTCSyndYear>0,StateLIHTCSyndYear=${year}),StateLIHTCSyndProceeds,0)` } as FormulaCell;
  }
  const stateLihtcSyndRow = currentRow;
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

  // IMPL-095: Recapture Avoidance — read from engine exitTaxAnalysis (single source of truth)
  ws[`A${currentRow}`] = { t: 's', v: 'Recapture Avoided (§1245/§1250)' };
  ws['B' + currentRow] = { t: 'n', v: 0 };
  // Total recapture avoided = sec1245Tax + sec1250Tax from exitTaxAnalysis (character-split)
  const totalRecaptureAvoided = ozEnabled && holdPeriod >= 10 && results.exitTaxAnalysis
    ? results.exitTaxAnalysis.sec1245Tax + results.exitTaxAnalysis.sec1250Tax
    : 0;
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(66 + year);
    // Only show at exit year (lump sum recognition)
    const recaptureAvoided = year === holdPeriod ? totalRecaptureAvoided : 0;
    const recaptureFormula = year === holdPeriod
      ? 'IF(AND(OZEnabled,HoldPeriod>=10),Sec1245Tax+Sec1250Tax,0)'
      : '0';
    ws[`${col}${currentRow}`] = { t: 'n', v: recaptureAvoided, f: recaptureFormula } as FormulaCell;
  }
  namedRanges.push({ name: 'OZRecaptureAvoided', ref: `Investor_Returns!$${lastCol}$${currentRow}` });
  currentRow += 2;

  // IMPL-100: Exit Tax Analysis (character-split breakdown from exitTaxAnalysis)
  if (results.exitTaxAnalysis) {
    ws[`A${currentRow}`] = { t: 's', v: '=== EXIT TAX ANALYSIS ===' };
    currentRow++;

    const eta = results.exitTaxAnalysis;
    const exitTaxRows: Array<{ label: string; value: number; rangeName?: string }> = [
      { label: '§1245 Ordinary Recapture', value: eta.sec1245Recapture, rangeName: 'Sec1245Recapture' },
      { label: '§1245 Rate', value: eta.sec1245Rate },
      { label: '§1245 Tax', value: eta.sec1245Tax, rangeName: 'Sec1245Tax' },
      { label: '§1250 Unrecaptured Gain', value: eta.sec1250Recapture, rangeName: 'Sec1250Recapture' },
      { label: '§1250 Rate', value: eta.sec1250Rate },
      { label: '§1250 Tax', value: eta.sec1250Tax, rangeName: 'Sec1250Tax' },
      { label: 'Remaining Gain (LTCG)', value: eta.remainingGain },
      { label: 'Remaining Gain Tax', value: eta.remainingGainTax },
      { label: 'NIIT Tax', value: eta.niitTax },
      { label: 'Total Federal Exit Tax', value: eta.totalFederalExitTax, rangeName: 'TotalFederalExitTax' },
      { label: `State Exit Tax (${eta.stateConformity})`, value: eta.stateExitTax, rangeName: 'StateExitTax' },
      { label: 'Total Exit Tax With State', value: eta.totalExitTaxWithState },
      { label: 'OZ Exclusion Applied', value: eta.ozExcludesRecapture ? 1 : 0 },
      { label: 'Net Exit Tax', value: eta.netExitTax, rangeName: 'NetExitTax' },
    ];

    for (const row of exitTaxRows) {
      ws[`A${currentRow}`] = { t: 's', v: row.label };
      ws[`B${currentRow}`] = { t: 'n', v: row.value };
      if (row.rangeName) {
        namedRanges.push({ name: row.rangeName, ref: `Investor_Returns!$B$${currentRow}` });
      }
      currentRow++;
    }
    currentRow++;
  }

  // === SUMMARY ===
  ws[`A${currentRow}`] = { t: 's', v: '=== SUMMARY ===' };
  currentRow++;

  // Track the row where net investment appears for MOIC formula
  let investmentDisplayRow: number;

  // IMPL-077: Show investment breakdown based on syndication timing
  // Year 0: Syndicator funds offset at close → MOIC uses net equity
  // Year 1+: Investor funds full amount → MOIC uses gross equity
  if (syndicationOffset > 0 && syndicationYear === 0) {
    // Year 0 syndication: show gross/offset/net breakdown
    ws[`A${currentRow}`] = { t: 's', v: 'Investor Equity (Gross)' };
    ws[`B${currentRow}`] = { t: 'n', v: investorEquityGross, f: 'InvestorEquity' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Less: Syndication Offset' };
    ws[`B${currentRow}`] = { t: 'n', v: -syndicationOffset, f: '-StateLIHTCSyndProceeds' } as FormulaCell;
    currentRow++;

    ws[`A${currentRow}`] = { t: 's', v: 'Net Investment (MOIC basis)' };
    ws[`B${currentRow}`] = { t: 'n', v: investorEquityNet, f: 'InvestorEquity-StateLIHTCSyndProceeds' } as FormulaCell;
    namedRanges.push({ name: 'InvNetInvestment', ref: `Investor_Returns!$B$${currentRow}` });
    // ISS-070c: Also create InvTotalInvestment for validation/summary sheets (same as net for Year 0 syndication)
    namedRanges.push({ name: 'InvTotalInvestment', ref: `Investor_Returns!$B$${currentRow}` });
    investmentDisplayRow = currentRow;
    currentRow++;
  } else if (syndicationOffset > 0 && syndicationYear > 0) {
    // Year 1+ syndication: investor funds full amount, MOIC uses gross equity
    ws[`A${currentRow}`] = { t: 's', v: 'Total Investment (MOIC basis)' };
    ws[`B${currentRow}`] = { t: 'n', v: totalInvestment, f: `ABS(B${investmentRow})` } as FormulaCell;
    namedRanges.push({ name: 'InvTotalInvestment', ref: `Investor_Returns!$B$${currentRow}` });
    investmentDisplayRow = currentRow;
    currentRow++;

    // Show syndication info as note (not part of MOIC calculation)
    ws[`A${currentRow}`] = { t: 's', v: `  → Syndication Y${syndicationYear} (capital return)` };
    ws[`B${currentRow}`] = { t: 'n', v: syndicationOffset, f: 'StateLIHTCSyndProceeds' } as FormulaCell;
    currentRow++;
  } else {
    ws[`A${currentRow}`] = { t: 's', v: 'Total Investment' };
    ws[`B${currentRow}`] = { t: 'n', v: totalInvestment, f: `ABS(B${investmentRow})` } as FormulaCell;
    namedRanges.push({ name: 'InvTotalInvestment', ref: `Investor_Returns!$B$${currentRow}` });
    investmentDisplayRow = currentRow;
    currentRow++;
  }

  ws[`A${currentRow}`] = { t: 's', v: 'Total Returns' };
  const lastYearCol = String.fromCharCode(66 + holdPeriod);
  ws[`B${currentRow}`] = { t: 'n', v: results.totalReturns, f: `${lastYearCol}${cumulativeRow}` } as FormulaCell;
  namedRanges.push({ name: 'InvTotalReturns', ref: `Investor_Returns!$B$${currentRow}` });
  const totalReturnsRow = currentRow;
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Multiple (MOIC)' };
  ws[`B${currentRow}`] = { t: 'n', v: results.multiple, f: `B${totalReturnsRow}/B${investmentDisplayRow}` } as FormulaCell;
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
