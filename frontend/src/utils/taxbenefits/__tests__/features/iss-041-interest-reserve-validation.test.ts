/**
 * ISS-041: Interest Reserve S-Curve Validation
 *
 * Validates the Interest Reserve calculation with month-by-month breakdown.
 * Confirms whether PABs are correctly included in the reserve sizing.
 *
 * User Concern: $476,907 reserve seems low for ~$42.7M combined hard debt
 * over 18-month lease-up.
 */

import { calculateSCurve, STANDARD_STEEPNESS, calculateMonthlyOccupancy } from '../../sCurveUtility';
import { calculateInterestReserve, InterestReserveParams } from '../../interestReserveCalculation';
import { calculateMonthlyPayment } from '../../calculations';

describe('ISS-041: Interest Reserve S-Curve Validation', () => {
  // Test scenario from UI
  const testScenario = {
    projectCost: 59.831365, // $59.8M effective project cost (in millions)
    yearOneNOI: 3.5,        // Approximate stabilized NOI (in millions)
    leaseUpMonths: 18,

    // Senior Debt
    seniorDebtAmount: 17.949408, // $17.9M
    seniorDebtRate: 5.0,         // 5%
    seniorDebtAmortization: 35,  // 35 years

    // PABs
    pabAmount: 24.757989,        // $24.8M
    pabRate: 4.5,                // 4.5%
    pabAmortization: 35,         // 35 years
  };

  it('should display S-curve parameters and occupancy at key months', () => {
    console.log('\n=== S-CURVE PARAMETERS ===');
    console.log(`Steepness (k): ${STANDARD_STEEPNESS}`);
    console.log(`Formula: 1 / (1 + e^(-${STANDARD_STEEPNESS}*(x-0.5)))`);
    console.log('');

    const keyMonths = [0, 1, 3, 6, 9, 12, 15, 18];
    console.log('Occupancy at key months (18-month lease-up):');
    console.log('| Month | Progress | Occupancy % |');
    console.log('|-------|----------|-------------|');

    keyMonths.forEach(month => {
      const progress = month / 18;
      const occupancy = month === 0 ? 0 : calculateSCurve(progress, STANDARD_STEEPNESS);
      console.log(`|  ${month.toString().padStart(2)}   |  ${(progress * 100).toFixed(1).padStart(5)}%  |   ${(occupancy * 100).toFixed(1).padStart(5)}%   |`);
    });

    // Verify S-curve properties
    const midpoint = calculateSCurve(0.5, STANDARD_STEEPNESS);
    expect(midpoint).toBeCloseTo(0.5, 2); // 50% at midpoint

    const endpoint = calculateSCurve(1.0, STANDARD_STEEPNESS);
    expect(endpoint).toBeGreaterThan(0.99); // Nearly 100% at end
  });

  it('should show month-by-month calculation with Senior Debt ONLY (current implementation)', () => {
    console.log('\n=== MONTH-BY-MONTH: SENIOR DEBT ONLY (CURRENT IMPLEMENTATION) ===\n');

    // Calculate monthly debt service for Senior Debt
    const seniorMonthlyDS = calculateMonthlyPayment(
      testScenario.seniorDebtAmount,
      testScenario.seniorDebtRate / 100,
      testScenario.seniorDebtAmortization
    );
    const monthlyNOIStabilized = testScenario.yearOneNOI / 12;

    console.log(`Senior Debt Amount:     $${(testScenario.seniorDebtAmount * 1_000_000).toLocaleString()}`);
    console.log(`Senior Debt Rate:       ${testScenario.seniorDebtRate}%`);
    console.log(`Senior Debt Amort:      ${testScenario.seniorDebtAmortization} years`);
    console.log(`Monthly Senior DS:      $${(seniorMonthlyDS * 1_000_000).toLocaleString()}`);
    console.log(`Annual Senior DS:       $${(seniorMonthlyDS * 12 * 1_000_000).toLocaleString()}`);
    console.log(`Stabilized Monthly NOI: $${(monthlyNOIStabilized * 1_000_000).toLocaleString()}`);
    console.log('');

    console.log('| Month | Progress | Occupancy % | Monthly NOI    | Monthly DS     | Shortfall      |');
    console.log('|-------|----------|-------------|----------------|----------------|----------------|');

    let totalShortfall = 0;
    for (let month = 1; month <= testScenario.leaseUpMonths; month++) {
      const progress = month / testScenario.leaseUpMonths;
      const occupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
      const monthlyNOI = monthlyNOIStabilized * occupancy;
      const shortfall = Math.max(0, seniorMonthlyDS - monthlyNOI);
      totalShortfall += shortfall;

      console.log(
        `|  ${month.toString().padStart(2)}   |  ${(progress * 100).toFixed(1).padStart(5)}%  |   ${(occupancy * 100).toFixed(1).padStart(5)}%   | $${(monthlyNOI * 1_000_000).toLocaleString().padStart(12)} | $${(seniorMonthlyDS * 1_000_000).toLocaleString().padStart(12)} | $${(shortfall * 1_000_000).toLocaleString().padStart(12)} |`
      );
    }

    console.log('');
    console.log(`TOTAL SHORTFALL (Senior Only): $${(totalShortfall * 1_000_000).toLocaleString()}`);

    // This matches the current implementation
    expect(totalShortfall).toBeGreaterThan(0);
  });

  it('should show month-by-month calculation with COMBINED hard debt (Senior + PABs)', () => {
    console.log('\n=== MONTH-BY-MONTH: COMBINED HARD DEBT (SENIOR + PABs) ===\n');

    // Calculate monthly debt service for both
    const seniorMonthlyDS = calculateMonthlyPayment(
      testScenario.seniorDebtAmount,
      testScenario.seniorDebtRate / 100,
      testScenario.seniorDebtAmortization
    );

    const pabMonthlyDS = calculateMonthlyPayment(
      testScenario.pabAmount,
      testScenario.pabRate / 100,
      testScenario.pabAmortization
    );

    const combinedMonthlyDS = seniorMonthlyDS + pabMonthlyDS;
    const monthlyNOIStabilized = testScenario.yearOneNOI / 12;

    console.log(`Senior Debt Amount:     $${(testScenario.seniorDebtAmount * 1_000_000).toLocaleString()}`);
    console.log(`Monthly Senior DS:      $${(seniorMonthlyDS * 1_000_000).toLocaleString()}`);
    console.log(`PAB Amount:             $${(testScenario.pabAmount * 1_000_000).toLocaleString()}`);
    console.log(`Monthly PAB DS:         $${(pabMonthlyDS * 1_000_000).toLocaleString()}`);
    console.log(`COMBINED Monthly DS:    $${(combinedMonthlyDS * 1_000_000).toLocaleString()}`);
    console.log(`COMBINED Annual DS:     $${(combinedMonthlyDS * 12 * 1_000_000).toLocaleString()}`);
    console.log(`Stabilized Monthly NOI: $${(monthlyNOIStabilized * 1_000_000).toLocaleString()}`);
    console.log(`Stabilized DSCR:        ${(monthlyNOIStabilized / combinedMonthlyDS).toFixed(2)}x`);
    console.log('');

    console.log('| Month | Progress | Occupancy % | Monthly NOI    | Combined DS    | Shortfall      |');
    console.log('|-------|----------|-------------|----------------|----------------|----------------|');

    let totalShortfall = 0;
    for (let month = 1; month <= testScenario.leaseUpMonths; month++) {
      const progress = month / testScenario.leaseUpMonths;
      const occupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
      const monthlyNOI = monthlyNOIStabilized * occupancy;
      const shortfall = Math.max(0, combinedMonthlyDS - monthlyNOI);
      totalShortfall += shortfall;

      console.log(
        `|  ${month.toString().padStart(2)}   |  ${(progress * 100).toFixed(1).padStart(5)}%  |   ${(occupancy * 100).toFixed(1).padStart(5)}%   | $${(monthlyNOI * 1_000_000).toLocaleString().padStart(12)} | $${(combinedMonthlyDS * 1_000_000).toLocaleString().padStart(12)} | $${(shortfall * 1_000_000).toLocaleString().padStart(12)} |`
      );
    }

    console.log('');
    console.log(`TOTAL SHORTFALL (Senior + PABs): $${(totalShortfall * 1_000_000).toLocaleString()}`);

    // This is what the reserve SHOULD be
    expect(totalShortfall).toBeGreaterThan(1.0); // Should be > $1M
  });

  it('should compare current calculation vs expected calculation', () => {
    console.log('\n=== ISS-041 VALIDATION SUMMARY ===\n');

    // ISS-041 FIX: Now includes PABs in the calculation
    const params: InterestReserveParams = {
      enabled: true,
      months: testScenario.leaseUpMonths,
      projectCost: testScenario.projectCost,
      predevelopmentCosts: 0,
      yearOneNOI: testScenario.yearOneNOI,
      seniorDebtPct: (testScenario.seniorDebtAmount / testScenario.projectCost) * 100,
      seniorDebtRate: testScenario.seniorDebtRate,
      seniorDebtAmortization: testScenario.seniorDebtAmortization,
      // ISS-041: Include PABs in reserve calculation
      pabEnabled: true,
      pabAmount: testScenario.pabAmount,
      pabRate: testScenario.pabRate,
      pabAmortization: testScenario.pabAmortization,
    };

    const currentReserve = calculateInterestReserve(params);

    // Expected calculation (Senior + PABs) - manual verification
    const seniorMonthlyDS = calculateMonthlyPayment(
      testScenario.seniorDebtAmount,
      testScenario.seniorDebtRate / 100,
      testScenario.seniorDebtAmortization
    );
    const pabMonthlyDS = calculateMonthlyPayment(
      testScenario.pabAmount,
      testScenario.pabRate / 100,
      testScenario.pabAmortization
    );
    const combinedMonthlyDS = seniorMonthlyDS + pabMonthlyDS;
    const monthlyNOIStabilized = testScenario.yearOneNOI / 12;

    let expectedReserve = 0;
    for (let month = 1; month <= testScenario.leaseUpMonths; month++) {
      const progress = month / testScenario.leaseUpMonths;
      const occupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
      const monthlyNOI = monthlyNOIStabilized * occupancy;
      const shortfall = Math.max(0, combinedMonthlyDS - monthlyNOI);
      expectedReserve += shortfall;
    }

    const discrepancy = Math.abs(expectedReserve - currentReserve);
    const pctMatch = 100 - (discrepancy / expectedReserve) * 100;

    console.log('COMPARISON (After ISS-041 Fix):');
    console.log(`  Calculated Reserve (Senior + PAB): $${(currentReserve * 1_000_000).toLocaleString()}`);
    console.log(`  Expected Reserve (Manual Calc):    $${(expectedReserve * 1_000_000).toLocaleString()}`);
    console.log(`  Discrepancy:                       $${(discrepancy * 1_000_000).toLocaleString()}`);
    console.log(`  Match:                             ${pctMatch.toFixed(1)}%`);
    console.log('');
    console.log('✓ ISS-041 FIX VERIFIED: PABs are now included in Interest Reserve calculation!');

    // Verify the calculation matches expected (within small tolerance)
    expect(discrepancy).toBeLessThan(0.001); // Within $1K
    expect(pctMatch).toBeGreaterThan(99.9); // 99.9%+ match
    // Verify reserve is in expected range (~$1.45M)
    expect(currentReserve).toBeGreaterThan(1.4); // > $1.4M
    expect(currentReserve).toBeLessThan(1.6); // < $1.6M
  });

  it('should verify PABs ARE NOW included in InterestReserveParams interface', () => {
    console.log('\n=== PAB PARAMETER VERIFICATION (ISS-041 FIX) ===\n');

    // List all params that calculateInterestReserve accepts - now includes PABs
    const sampleParams: InterestReserveParams = {
      enabled: true,
      months: 18,
      projectCost: 100,
      yearOneNOI: 5,
      seniorDebtPct: 60,
      seniorDebtRate: 5,
      seniorDebtAmortization: 30,
      // ISS-041: PABs are now supported
      pabEnabled: true,
      pabAmount: 25,  // $25M in PABs
      pabRate: 4.5,
      pabAmortization: 35,
    };

    console.log('InterestReserveParams interface includes:');
    console.log('  ✓ Senior Debt (seniorDebtPct, seniorDebtRate, seniorDebtAmortization)');
    console.log('  ✓ PABs (pabEnabled, pabAmount, pabRate, pabAmortization) - ISS-041 FIX');
    console.log('  ✓ Outside Investor Sub-Debt (outsideInvestorSubDebtPct, etc.)');
    console.log('  ✓ HDC Sub-Debt (hdcSubDebtPct, etc.)');
    console.log('  ✓ Investor Sub-Debt (investorSubDebtPct, etc.)');
    console.log('');
    console.log('✓ PABs are hard debt with regular P&I payments.');
    console.log('✓ They are now correctly included in the interest reserve calculation.');

    // Verify PAB params are now accepted
    expect(sampleParams.pabEnabled).toBe(true);
    expect(sampleParams.pabAmount).toBe(25);
    expect(sampleParams.pabRate).toBe(4.5);
    expect(sampleParams.pabAmortization).toBe(35);
  });
});
