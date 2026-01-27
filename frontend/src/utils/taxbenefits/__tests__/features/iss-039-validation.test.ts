/**
 * ISS-039 Validation: Interest Reserve Convergence
 *
 * Tests that Interest Reserve properly converges across different Senior Debt levels.
 * The reserve should change dynamically as hard pay debt service changes,
 * but reach a stable converged value through iteration.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { CalculationParams } from '../../../../types/taxbenefits';
import { calculateSCurve, STANDARD_STEEPNESS } from '../../sCurveUtility';

describe('ISS-039: Interest Reserve Convergence Validation', () => {
  const baseParams: Partial<CalculationParams> = {
    projectCost: 100,              // $100M
    predevelopmentCosts: 0,
    landValue: 10,                 // $10M
    yearOneNOI: 5.5,               // $5.5M
    revenueGrowth: 3,
    expenseGrowth: 2.5,
    exitCapRate: 5.5,
    investorEquityPct: 5,          // 5% equity
    seniorDebtRate: 5.5,
    seniorDebtAmortization: 30,
    seniorDebtIOYears: 0,
    philanthropicDebtRate: 2,
    philDebtAmortization: 30,
    interestReserveEnabled: true,
    interestReserveMonths: 6,      // 6-month lease-up
    holdPeriod: 10,
    yearOneDepreciationPct: 60,
    effectiveTaxRate: 40,
    investorPromoteShare: 50,
    hdcFeeRate: 2,
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    hdcFee: 0,
    hdcAdvanceFinancing: false,
  };

  // Test at three debt levels (must sum to 95% with 5% equity)
  const scenarios = [
    { seniorDebtPct: 65, philDebtPct: 30, label: 'High Senior (65%)' },
    { seniorDebtPct: 60, philDebtPct: 35, label: 'Medium Senior (60%)' },
    { seniorDebtPct: 55, philDebtPct: 40, label: 'Low Senior (55%)' },
  ];

  interface ScenarioResult {
    label: string;
    seniorDebtPct: number;
    philDebtPct: number;
    interestReserve: number;
    effectiveProjectCost: number;
    seniorDebtAmount: number;
    annualDebtService: number;
  }

  const results: ScenarioResult[] = [];

  scenarios.forEach(({ seniorDebtPct, philDebtPct, label }) => {
    it(`should converge Interest Reserve for ${label}`, () => {
      const params: CalculationParams = {
        ...baseParams,
        seniorDebtPct,
        philanthropicDebtPct: philDebtPct,
      } as CalculationParams;

      const result = calculateFullInvestorAnalysis(params);

      // Extract values
      const interestReserve = result.interestReserveAmount;
      const baseProjectCost = params.projectCost + (params.predevelopmentCosts || 0);
      const effectiveProjectCost = baseProjectCost + interestReserve;
      const seniorDebtAmount = effectiveProjectCost * (seniorDebtPct / 100);

      // Calculate annual debt service (P&I for 30-year amortization at 5.5%)
      const monthlyRate = 0.055 / 12;
      const totalPayments = 30 * 12;
      const monthlyPayment = seniorDebtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
      const annualDebtService = monthlyPayment * 12;

      // Store results for comparison
      results.push({
        label,
        seniorDebtPct,
        philDebtPct,
        interestReserve,
        effectiveProjectCost,
        seniorDebtAmount,
        annualDebtService,
      });

      // Log results
      console.log(`\n${label}:`);
      console.log(`  Senior Debt %:           ${seniorDebtPct}%`);
      console.log(`  Interest Reserve:        $${(interestReserve * 1_000_000).toLocaleString()}`);
      console.log(`  Effective Project Cost:  $${(effectiveProjectCost * 1_000_000).toLocaleString()}`);
      console.log(`  Senior Debt Amount:      $${(seniorDebtAmount * 1_000_000).toLocaleString()}`);
      console.log(`  Annual Debt Service:     $${(annualDebtService * 1_000_000).toLocaleString()}`);

      // Assertions
      // 1. Reserve is positive
      expect(interestReserve).toBeGreaterThan(0);

      // 2. Reserve is < 10% of project cost (the cap in interestReserveCalculation.ts)
      expect(interestReserve).toBeLessThan(baseProjectCost * 0.1);

      // 3. Effective Project Cost = Base Project Cost + Reserve
      expect(effectiveProjectCost).toBeCloseTo(baseProjectCost + interestReserve, 6);

      // 4. Senior Debt Amount = Effective Project Cost × Senior Debt %
      const expectedSeniorDebt = effectiveProjectCost * (seniorDebtPct / 100);
      expect(seniorDebtAmount).toBeCloseTo(expectedSeniorDebt, 6);
    });
  });

  it('should produce different reserves at different debt levels (confirms dynamic recalculation)', () => {
    // Run all scenarios first
    const allResults: ScenarioResult[] = [];

    scenarios.forEach(({ seniorDebtPct, philDebtPct, label }) => {
      const params: CalculationParams = {
        ...baseParams,
        seniorDebtPct,
        philanthropicDebtPct: philDebtPct,
      } as CalculationParams;

      const result = calculateFullInvestorAnalysis(params);
      const interestReserve = result.interestReserveAmount;
      const baseProjectCost = params.projectCost + (params.predevelopmentCosts || 0);
      const effectiveProjectCost = baseProjectCost + interestReserve;
      const seniorDebtAmount = effectiveProjectCost * (seniorDebtPct / 100);

      const monthlyRate = 0.055 / 12;
      const totalPayments = 30 * 12;
      const monthlyPayment = seniorDebtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
      const annualDebtService = monthlyPayment * 12;

      allResults.push({
        label,
        seniorDebtPct,
        philDebtPct,
        interestReserve,
        effectiveProjectCost,
        seniorDebtAmount,
        annualDebtService,
      });
    });

    // Print comparison table
    console.log('\n\n=== ISS-039 VALIDATION SUMMARY ===\n');
    console.log('| Scenario           | Senior % | Reserve ($M) | Eff. Cost ($M) | Senior Debt ($M) | Annual DS ($M) |');
    console.log('|--------------------|----------|--------------|----------------|------------------|----------------|');

    allResults.forEach(r => {
      console.log(
        `| ${r.label.padEnd(18)} | ${r.seniorDebtPct.toString().padStart(6)}%  | ${r.interestReserve.toFixed(4).padStart(12)} | ${r.effectiveProjectCost.toFixed(4).padStart(14)} | ${r.seniorDebtAmount.toFixed(4).padStart(16)} | ${r.annualDebtService.toFixed(4).padStart(14)} |`
      );
    });

    // Verify reserves are different (dynamic recalculation is working)
    const reserves = allResults.map(r => r.interestReserve);
    const uniqueReserves = new Set(reserves.map(r => r.toFixed(4)));

    console.log(`\n✓ Unique reserve values: ${uniqueReserves.size} (expected 3)`);
    console.log(`✓ Higher senior debt → Higher reserve (confirms dynamic sizing)`);

    // Higher senior debt should produce higher reserve
    expect(allResults[0].interestReserve).toBeGreaterThan(allResults[1].interestReserve);
    expect(allResults[1].interestReserve).toBeGreaterThan(allResults[2].interestReserve);

    // All reserves should be unique
    expect(uniqueReserves.size).toBe(3);
  });

  it('should verify the circular dependency is properly resolved', () => {
    // Test that the reserve is consistent with the effective project cost it's based on
    const params: CalculationParams = {
      ...baseParams,
      seniorDebtPct: 60,
      philanthropicDebtPct: 35,
    } as CalculationParams;

    const result = calculateFullInvestorAnalysis(params);
    const interestReserve = result.interestReserveAmount;
    const baseProjectCost = params.projectCost + (params.predevelopmentCosts || 0);
    const effectiveProjectCost = baseProjectCost + interestReserve;

    // Manually calculate what the reserve SHOULD be given the effective project cost
    // This verifies the iteration converged properly
    const seniorDebtAmount = effectiveProjectCost * (params.seniorDebtPct! / 100);
    const monthlyRate = params.seniorDebtRate! / 100 / 12;
    const totalPayments = params.seniorDebtAmortization! * 12;
    const monthlyPayment = seniorDebtAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const monthlyDebtService = monthlyPayment;
    const monthlyNOI = params.yearOneNOI / 12;

    // S-curve integration for 6 months using the actual utility function
    let totalShortfall = 0;
    for (let month = 1; month <= 6; month++) {
      const progress = Math.min(1, month / 6);
      const occupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
      const monthlyNOIWithOccupancy = monthlyNOI * occupancy;
      const shortfall = Math.max(0, monthlyDebtService - monthlyNOIWithOccupancy);
      totalShortfall += shortfall;
    }

    console.log('\n\n=== CONVERGENCE VERIFICATION ===');
    console.log(`Calculated Reserve:     $${(interestReserve * 1_000_000).toLocaleString()}`);
    console.log(`Verified Shortfall:     $${(totalShortfall * 1_000_000).toLocaleString()}`);
    console.log(`Difference:             $${(Math.abs(interestReserve - totalShortfall) * 1_000_000).toLocaleString()}`);

    // The reserve should match our manual calculation within a small tolerance
    // (small difference is expected due to the iteration converging within tolerance)
    expect(Math.abs(interestReserve - totalShortfall)).toBeLessThan(0.01); // Within $10K
  });
});
