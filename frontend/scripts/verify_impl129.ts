/**
 * IMPL-129 Verification Script
 *
 * Verifies that generateLiveExcelModel() now produces non-zero LIHTC and OZ
 * values in the Summary sheet after the IMPL-129 fix.
 *
 * The three reference deals (4448, Trace 4001, 701) are stored in the database.
 * This script constructs representative params that produce the expected LIHTC
 * totals via the federalLIHTCCredits array, matching how the UI export path
 * now works with the IMPL-129 fix.
 *
 * Usage: npx tsx scripts/verify_impl129.ts
 */

import * as XLSX from 'xlsx';
import { generateLiveExcelModel } from '../src/utils/taxbenefits/auditExport/index';
import type { LiveExcelParams } from '../src/utils/taxbenefits/auditExport/types';
import type {
  CalculationParams,
  InvestorAnalysisResults,
  HDCAnalysisResults,
  CashFlowItem,
  HDCCashFlowItem,
} from '../src/types/taxbenefits';

// ============================================================================
// Deal configurations — constructed to match expected LIHTC/OZ values
// ============================================================================

interface DealConfig {
  name: string;
  projectCost: number;
  landValue: number;
  yearOneNOI: number;
  exitCapRate: number;
  creditRate: number;        // LIHTC credit rate (%)
  ddaQctBoost: boolean;
  deferredCapitalGains: number;
  expectedLIHTC: number;     // Expected total LIHTC ($M)
  expectedOZTotal: number;   // Expected total OZ benefits ($M)
  federalLIHTCCredits: number[];  // 11-year schedule ($M)
}

/**
 * Build the 11-year LIHTC credit schedule from eligible basis and credit rate.
 * With PIS month = 1 (forced by export normalization): full Year 1, no Year 11 catch-up.
 */
function buildLIHTCSchedule(eligibleBasis: number, creditRate: number, boost: number): number[] {
  const qualifiedBasis = eligibleBasis * boost;
  const annual = qualifiedBasis * (creditRate / 100);
  // PIS=1 → year1Factor=1.0, year11=0
  const schedule: number[] = [];
  for (let i = 0; i < 10; i++) schedule.push(annual);
  schedule.push(0); // Year 11 catch-up = 0 with PIS=1
  return schedule;
}

// Deal 4448 ($36M): LIHTC ~$12.64M, OZ ~$6.59M
// eligibleBasis = 31.6, creditRate = 4%, no boost → annual = 1.264, 10yr = 12.64
const deal4448: DealConfig = {
  name: '4448 ($36M)',
  projectCost: 36,
  landValue: 4.4,
  yearOneNOI: 2.0,
  exitCapRate: 5.5,
  creditRate: 4,
  ddaQctBoost: false,
  deferredCapitalGains: 10,
  expectedLIHTC: 12.64,
  expectedOZTotal: 6.59,
  federalLIHTCCredits: buildLIHTCSchedule(31.6, 4, 1.0),
};

// Trace 4001 ($65M): LIHTC ~$23.46M, OZ ~$9.41M
// eligibleBasis = 58.65, creditRate = 4%, no boost → annual = 2.346, 10yr = 23.46
const trace4001: DealConfig = {
  name: 'Trace 4001 ($65M)',
  projectCost: 65,
  landValue: 6.35,
  yearOneNOI: 3.5,
  exitCapRate: 6,
  creditRate: 4,
  ddaQctBoost: false,
  deferredCapitalGains: 15,
  expectedLIHTC: 23.46,
  expectedOZTotal: 9.41,
  federalLIHTCCredits: buildLIHTCSchedule(58.65, 4, 1.0),
};

// 701 ($73M): LIHTC ~$34.06M, OZ ~$12.68M
// eligibleBasis = 65.5, creditRate = 4%, boost 1.3 → qualified = 85.15, annual = 3.406, 10yr = 34.06
const deal701: DealConfig = {
  name: '701 ($73M)',
  projectCost: 73,
  landValue: 7.5,
  yearOneNOI: 4.0,
  exitCapRate: 5.5,
  creditRate: 4,
  ddaQctBoost: true,
  deferredCapitalGains: 18,
  expectedLIHTC: 34.06,
  expectedOZTotal: 12.68,
  federalLIHTCCredits: buildLIHTCSchedule(65.5, 4, 1.3),
};

// ============================================================================
// Build CalculationParams for each deal
// ============================================================================

function buildParams(deal: DealConfig): CalculationParams {
  return {
    projectCost: deal.projectCost,
    landValue: deal.landValue,
    yearOneNOI: deal.yearOneNOI,
    noiGrowthRate: 3,
    exitCapRate: deal.exitCapRate,
    investorEquityPct: 5,
    seniorDebtPct: 66,
    seniorDebtRate: 5,
    seniorDebtAmortization: 35,
    seniorDebtIOYears: 3,
    philanthropicDebtPct: 20,
    philanthropicDebtRate: 0,
    philDebtAmortization: 60,
    hdcSubDebtPct: 2,
    hdcSubDebtPikRate: 8,
    investorSubDebtPct: 2.5,
    investorSubDebtPikRate: 8,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 8,
    holdPeriod: 10,
    investorPromoteShare: 35,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    yearOneDepreciationPct: 20,
    federalTaxRate: 37,
    stateTaxRate: 9.9,
    niitRate: 3.8,
    ltCapitalGainsRate: 20,
    stateCapitalGainsRate: 9.9,
    capitalGainsTaxRate: 33.7,
    selectedState: 'OR',
    investorState: 'OR',
    investorTrack: 'rep',
    bonusConformityRate: 1,
    effectiveTaxRate: 46.9,
    aumFeeEnabled: false,
    aumFeeRate: 0,

    // LIHTC — the IMPL-129 fix ensures these reach the export
    lihtcEnabled: true,
    lihtcEligibleBasis: deal.projectCost - deal.landValue,
    applicableFraction: 100,
    creditRate: deal.creditRate,
    ddaQctBoost: deal.ddaQctBoost,
    federalLIHTCCredits: deal.federalLIHTCCredits,

    // OZ — the IMPL-129 fix ensures includeDepreciationSchedule is set
    ozEnabled: true,
    ozVersion: '2.0',
    ozType: 'standard',
    deferredCapitalGains: deal.deferredCapitalGains,
    includeDepreciationSchedule: true,

    // Misc
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    hdcFee: 0,
    placedInServiceMonth: 1,
    constructionDelayMonths: 0,
    predevelopmentCosts: 0,
  };
}

// ============================================================================
// Generate workbooks and read Summary sheet values
// ============================================================================

function emptyCashFlows(n: number): CashFlowItem[] {
  return Array.from({ length: n }, (_, i) => ({
    year: i + 1,
    noi: 0, debtServicePayments: 0, cashAfterDebtService: 0,
    aumFeeAmount: 0, cashAfterDebtAndFees: 0, taxBenefit: 0,
    operatingCashFlow: 0, subDebtInterest: 0, totalCashFlow: 0,
    cumulativeReturns: 0, dscr: 1.5, hardDebtService: 0,
  }));
}

const emptyHDCResults: HDCAnalysisResults = {
  hdcCashFlows: [], hdcExitProceeds: 0, hdcPromoteProceeds: 0,
  philanthropicEquityRepayment: 0, hdcSubDebtRepayment: 0,
  totalHDCReturns: 0, hdcMultiple: 0, hdcIRR: 0,
  hdcFeeIncome: 0, hdcPhilanthropicIncome: 0,
  hdcOperatingPromoteIncome: 0, hdcAumFeeIncome: 0,
  hdcSubDebtCurrentPayIncome: 0, hdcSubDebtPIKAccrued: 0,
  hdcInitialInvestment: 0,
};

function readCellValue(ws: XLSX.WorkSheet, col: string, row: number): number {
  const cell = ws[`${col}${row}`];
  if (!cell) return 0;
  return typeof cell.v === 'number' ? cell.v : 0;
}

function findRowByLabel(ws: XLSX.WorkSheet, label: string): number {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:B1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cell = ws[`A${r + 1}`];
    if (cell && typeof cell.v === 'string' && cell.v.includes(label)) {
      return r + 1;
    }
  }
  return -1;
}

function verifyDeal(deal: DealConfig): { lihtc: number; ozRecapture: number; ozTotal: number } {
  const params = buildParams(deal);
  const emptyInvestorResults: InvestorAnalysisResults = {
    investorCashFlows: emptyCashFlows(10),
    cashFlows: emptyCashFlows(10),
    exitProceeds: 0, totalInvestment: 0, totalReturns: 0,
    multiple: 0, irr: 0, investorTaxBenefits: 0,
    investorOperatingCashFlows: 0, investorSubDebtInterest: 0,
    investorSubDebtInterestReceived: 0, remainingDebtAtExit: 0,
    subDebtAtExit: 0, investorSubDebtAtExit: 0,
    outsideInvestorSubDebtAtExit: 0, exitValue: 0,
    totalExitProceeds: 0, pikAccumulatedInterest: 0,
    investorIRR: 0, leveragedROE: 0, unleveragedROE: 0,
    exitFees: 0, equityMultiple: 0, holdPeriod: 10,
    interestReserveAmount: 0, investorEquity: 0,
  };

  const liveParams: LiveExcelParams = {
    params,
    investorResults: emptyInvestorResults,
    hdcResults: emptyHDCResults,
    cashFlows: emptyCashFlows(10),
    hdcCashFlows: [],
    projectName: deal.name,
  };

  // generateLiveExcelModel recalculates fresh results internally
  const wb = generateLiveExcelModel(liveParams);
  const summarySheet = wb.Sheets['Summary'];

  if (!summarySheet) {
    console.error(`  ERROR: Summary sheet not found for ${deal.name}`);
    return { lihtc: 0, ozRecapture: 0, ozTotal: 0 };
  }

  // Find "Total LIHTC Credits" row
  const lihtcRow = findRowByLabel(summarySheet, 'Total LIHTC Credits');
  const lihtc = lihtcRow > 0 ? readCellValue(summarySheet, 'B', lihtcRow) : 0;

  // Find OZ rows
  const stepUpRow = findRowByLabel(summarySheet, 'Step-Up Savings');
  const appreciationRow = findRowByLabel(summarySheet, 'Appreciation Exclusion');
  const recaptureRow = findRowByLabel(summarySheet, 'Recapture Avoided');

  const stepUp = stepUpRow > 0 ? readCellValue(summarySheet, 'B', stepUpRow) : 0;
  const appreciation = appreciationRow > 0 ? readCellValue(summarySheet, 'B', appreciationRow) : 0;
  const recapture = recaptureRow > 0 ? readCellValue(summarySheet, 'B', recaptureRow) : 0;
  const ozTotal = stepUp + appreciation + recapture;

  // Also check Returns Buildup OZ total
  const ozBuildup = findRowByLabel(summarySheet, 'OZ Benefits (total)');
  const ozBuildupVal = ozBuildup > 0 ? readCellValue(summarySheet, 'B', ozBuildup) : 0;

  return { lihtc, ozRecapture: recapture, ozTotal: ozBuildupVal > 0 ? ozBuildupVal : ozTotal };
}

// ============================================================================
// Run verification
// ============================================================================

console.log('=== IMPL-129 Verification: LIHTC + OZ in Excel Export ===\n');

const deals = [deal4448, trace4001, deal701];
let allPass = true;

for (const deal of deals) {
  console.log(`--- ${deal.name} ---`);
  const result = verifyDeal(deal);

  // LIHTC check: must match expected within 2%
  const lihtcPctDiff = deal.expectedLIHTC > 0
    ? Math.abs(result.lihtc - deal.expectedLIHTC) / deal.expectedLIHTC * 100
    : (result.lihtc === 0 ? 0 : 100);
  const lihtcPass = lihtcPctDiff <= 2;

  // OZ check: must be non-zero (exact OZ match depends on full deal params from DB)
  // OZ total includes step-up + deferral + appreciation + recapture — sensitive to many params
  // We verify OZ is non-zero and report actual values
  const ozNonZero = result.ozTotal > 0;

  console.log(`  Total LIHTC Credits: $${result.lihtc.toFixed(4)}M (expected: $${deal.expectedLIHTC}M, diff: ${lihtcPctDiff.toFixed(2)}%) — ${lihtcPass ? 'PASS' : 'FAIL'}`);
  console.log(`  OZ Recapture Avoided: $${result.ozRecapture.toFixed(4)}M — ${result.ozRecapture > 0 ? 'PASS (non-zero)' : 'FAIL (zero)'}`);
  console.log(`  OZ Benefits Total: $${result.ozTotal.toFixed(4)}M (expected: ~$${deal.expectedOZTotal}M) — ${ozNonZero ? 'PASS (non-zero)' : 'FAIL (zero)'}`);

  if (!lihtcPass || !ozNonZero) allPass = false;
  console.log('');
}

console.log(`=== OVERALL: ${allPass ? 'PASS' : 'FAIL'} ===`);
process.exit(allPass ? 0 : 1);
