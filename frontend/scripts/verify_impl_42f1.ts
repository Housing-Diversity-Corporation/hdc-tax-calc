/**
 * §42(f)(1) Election Verification Script
 *
 * Verifies that calculateLIHTCSchedule() correctly handles the §42(f)(1)
 * election to defer credit period start to the year after PIS.
 *
 * Three scenarios tested:
 *   1. No election, July PIS → prorated Year 1, catch-up Year 11
 *   2. Election made, July PIS → full Year 1, no catch-up
 *   3. Election made, January PIS → full Year 1 (election has no effect)
 *
 * Usage: npx tsx scripts/verify_impl_42f1.ts
 */

import {
  calculateLIHTCSchedule,
  type LIHTCCalculationParams,
  type LIHTCCreditSchedule,
} from '../src/utils/taxbenefits/lihtcCreditCalculations';

// ============================================================================
// Common params matching Trace 4001 LIHTC characteristics
// eligibleBasis = 58.65M, creditRate = 4%, no boost, acquisition deal type
// ============================================================================

const baseParams: Omit<LIHTCCalculationParams, 'pisMonth' | 'electDeferCreditPeriod'> = {
  eligibleBasis: 58.65,                   // $58.65M (projectCost 65 - land 6.35)
  stabilizedApplicableFraction: 1.0,       // 100% low-income units
  ddaQctBoost: false,                      // No DDA/QCT boost
  creditRate: 0.04,                        // 4% acquisition credit
  dealType: 'acquisition',
};

// Expected annual credit: 58.65 × 1.0 × 1.0 × 0.04 = 2.346M

// ============================================================================
// Scenario definitions
// ============================================================================

interface Scenario {
  name: string;
  params: LIHTCCalculationParams;
  expected: {
    year1ProrationFactor: number;
    year11CatchUpCredit: number;      // 0 means no catch-up
    section42f3PenaltyRisk: boolean;
  };
}

const scenarios: Scenario[] = [
  {
    name: 'Scenario 1 — No election, July PIS (default behavior)',
    params: {
      ...baseParams,
      pisMonth: 7,
      electDeferCreditPeriod: false,
    },
    expected: {
      year1ProrationFactor: 0.5,        // 6/12 months
      year11CatchUpCredit: 1.173,       // 50% of annual = 2.346 * 0.5
      section42f3PenaltyRisk: false,    // acquisition deal type → always false
    },
  },
  {
    name: 'Scenario 2 — Election MADE, July PIS',
    params: {
      ...baseParams,
      pisMonth: 7,
      electDeferCreditPeriod: true,
    },
    expected: {
      year1ProrationFactor: 1.0,        // Election defers → full year
      year11CatchUpCredit: 0,           // No catch-up needed
      section42f3PenaltyRisk: false,    // Election suppresses risk
    },
  },
  {
    name: 'Scenario 3 — Election MADE, January PIS (election has no effect)',
    params: {
      ...baseParams,
      pisMonth: 1,
      electDeferCreditPeriod: true,
    },
    expected: {
      year1ProrationFactor: 1.0,        // 12/12 months (election redundant)
      year11CatchUpCredit: 0,           // No catch-up needed
      section42f3PenaltyRisk: false,    // Acquisition deal type
    },
  },
];

// ============================================================================
// Run verification
// ============================================================================

console.log('=== §42(f)(1) Election Verification ===\n');
console.log(`Base params: eligibleBasis=${baseParams.eligibleBasis}M, creditRate=${baseParams.creditRate * 100}%, AF=${baseParams.stabilizedApplicableFraction}`);
console.log(`Expected annual credit: ${(baseParams.eligibleBasis * baseParams.creditRate).toFixed(3)}M\n`);

let allPass = true;

for (const scenario of scenarios) {
  console.log(`--- ${scenario.name} ---`);
  console.log(`  pisMonth: ${scenario.params.pisMonth}, electDeferCreditPeriod: ${scenario.params.electDeferCreditPeriod}`);

  let result: LIHTCCreditSchedule;
  try {
    result = calculateLIHTCSchedule(scenario.params);
  } catch (e) {
    console.log(`  ERROR: ${(e as Error).message}`);
    allPass = false;
    continue;
  }

  const year1 = result.yearlyBreakdown[0];
  const year11 = result.yearlyBreakdown[10];

  // Check year1ProrationFactor
  const y1FactorActual = year1.prorationFactor;
  const y1FactorPass = Math.abs(y1FactorActual - scenario.expected.year1ProrationFactor) < 0.001;

  // Check year11CatchUpCredit
  const y11CreditActual = year11.creditAmount;
  const y11CreditPass = Math.abs(y11CreditActual - scenario.expected.year11CatchUpCredit) < 0.001;

  // Check section42f3PenaltyRisk
  const riskActual = result.section42f3PenaltyRisk;
  const riskPass = riskActual === scenario.expected.section42f3PenaltyRisk;

  console.log(`  year1ProrationFactor:  ${y1FactorActual.toFixed(4)}  (expected: ${scenario.expected.year1ProrationFactor.toFixed(4)})  ${y1FactorPass ? 'PASS' : 'FAIL'}`);
  console.log(`  year1Credit:           $${year1.creditAmount.toFixed(4)}M`);
  console.log(`  year11CatchUpCredit:   $${y11CreditActual.toFixed(4)}M  (expected: $${scenario.expected.year11CatchUpCredit.toFixed(4)}M)  ${y11CreditPass ? 'PASS' : 'FAIL'}`);
  console.log(`  section42f3PenaltyRisk: ${riskActual}  (expected: ${scenario.expected.section42f3PenaltyRisk})  ${riskPass ? 'PASS' : 'FAIL'}`);
  console.log(`  annualCredit:          $${result.annualCredit.toFixed(4)}M`);
  console.log(`  totalCredits:          $${result.totalCredits.toFixed(4)}M (10 × annual = $${(result.annualCredit * 10).toFixed(4)}M)`);

  const scenarioPass = y1FactorPass && y11CreditPass && riskPass;
  console.log(`  SCENARIO: ${scenarioPass ? 'PASS' : 'FAIL'}`);
  if (!scenarioPass) allPass = false;
  console.log('');
}

console.log(`=== OVERALL: ${allPass ? 'PASS' : 'FAIL'} ===`);
process.exit(allPass ? 0 : 1);
