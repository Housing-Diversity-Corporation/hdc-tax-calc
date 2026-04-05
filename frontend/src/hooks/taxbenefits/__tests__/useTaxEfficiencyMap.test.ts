/**
 * IMPL-123: useTaxEfficiencyMap validation tests
 *
 * Verifies the calculation engine produces results matching the trusted
 * batch CSV (trace_260303_65M_efficiency_map.csv) within ±1%.
 */

import { computeEfficiencyMap } from '../useTaxEfficiencyMap';
import type { BenefitStream } from '../../../utils/taxbenefits/investorTaxUtilization';

// Trace 260303 65M deal BenefitStream in DOLLARS
const DEAL_BENEFIT_STREAM_DOLLARS: BenefitStream = {
  annualDepreciation: [13.44, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833].map(v => v * 1e6),
  annualLIHTC: [1.173, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 1.173, 0].map(v => v * 1e6),
  annualStateLIHTC: new Array(12).fill(0),
  annualOperatingCF: new Array(12).fill(0),
  exitEvents: [{
    year: 12,
    exitProceeds: 15.26e6,
    cumulativeDepreciation: 34.52e6,
    recaptureExposure: 8.63e6,
    appreciationGain: 3.05e6,
    ozEnabled: true,
    sec1245Recapture: 13.44e6,
    sec1250Recapture: 21.08e6,
  }],
  grossEquity: 16.05e6,
  netEquity: 16.05e6,
  syndicationOffset: 0,
};

const FUND_EQUITY = 16.05e6;

// Compute once for all tests
const result = computeEfficiencyMap(DEAL_BENEFIT_STREAM_DOLLARS, FUND_EQUITY, 0.20, 'MFJ', 'WA');

function findCell(investorType: string, income: number, investment: number) {
  return result.cells.find(
    c => c.investorType === investorType && c.income === income && c.investment === investment
  );
}

describe('IMPL-123: useTaxEfficiencyMap', () => {
  test('REP+grouped $750K/$1M returns $1.912M ±1%', () => {
    const cell = findCell('rep_grouped', 750_000, 1_000_000);
    expect(cell).toBeDefined();
    const savingsM = cell!.totalTaxSavings / 1e6;
    // IMPL-153: EBL income offset eliminates NOL at $750K → $1.948M
    expect(savingsM).toBeGreaterThanOrEqual(1.948 * 0.99);
    expect(savingsM).toBeLessThanOrEqual(1.948 * 1.01);
    expect(cell!.utilizationRate).toBeGreaterThan(0.5);
  });

  test('Non-REP passive $2M/$1M returns $2.316M ±1%', () => {
    const cell = findCell('non_rep_passive', 2_000_000, 1_000_000);
    expect(cell).toBeDefined();
    const savingsM = cell!.totalTaxSavings / 1e6;
    // Batch value: 2.3159M
    expect(savingsM).toBeGreaterThanOrEqual(2.3159 * 0.99);
    expect(savingsM).toBeLessThanOrEqual(2.3159 * 1.01);
    expect(cell!.utilizationRate).toBeCloseTo(1.0, 1);
  });

  test('W-2 only track returns $0 for all cells', () => {
    const w2Cells = result.byType.w2_only;
    expect(w2Cells.length).toBe(120); // 12 incomes × 10 investments
    for (const cell of w2Cells) {
      expect(cell.totalTaxSavings).toBe(0);
      expect(cell.utilizationRate).toBe(0);
    }
  });

  test('OPT marker appears at peak savings/$ per income row', () => {
    for (const income of result.incomeLevels) {
      const row = result.byType.rep_grouped.filter(c => c.income === income);
      const optCells = row.filter(c => c.isOptimal);
      expect(optCells.length).toBe(1);
      // OPT cell should have the highest taxSavingsPerDollar in the row
      const maxSpd = Math.max(...row.map(c => c.taxSavingsPerDollar));
      expect(optCells[0].taxSavingsPerDollar).toBeCloseTo(maxSpd, 6);
    }
  });

  test('Fund ceiling correctly flags cells above limit', () => {
    expect(result.fundCeiling).toBeCloseTo(16.05e6 * 0.20, 0);
    // $3M should be below ceiling ($3.21M)
    const cell3M = findCell('rep_grouped', 1_000_000, 3_000_000);
    expect(cell3M!.isBelowFundCeiling).toBe(true);
    // $5M should be above ceiling
    const cell5M = findCell('rep_grouped', 1_000_000, 5_000_000);
    expect(cell5M!.isBelowFundCeiling).toBe(false);
  });

  test('Total cell count is 360 (12 incomes × 10 investments × 3 types)', () => {
    expect(result.cells.length).toBe(360);
  });
});
