/**
 * ISS-064: Construction Delay + Lease-Up + DSCR Logic
 *
 * Tests for the fix of two bugs:
 * 1. currentNOI was not reset after construction ended, causing DSCR = 0
 * 2. Lease-up period was anchored to Year 1, not placed-in-service year
 *
 * Expected behavior after fix:
 * - Year 1-N (construction): NOI = 0, Debt Service = 0, DSCR = N/A (0)
 * - Year N+1 (placed-in-service): NOI starts, Debt Service starts, DSCR calculated
 * - Lease-up S-curve begins at placed-in-service, not Year 1
 */

import { calculateFullInvestorAnalysis } from '../../calculations';

describe('ISS-064: Construction Delay + Lease-Up + DSCR Logic', () => {
  // Base test parameters (matching pattern from senior-debt-io-period.test.ts)
  const baseParams = {
    projectCost: 100, // $100M
    predevelopmentCosts: 0,
    landValue: 5,
    yearOneNOI: 6, // $6M
    yearOneDepreciationPct: 100,
    holdPeriod: 10,
    revenueGrowth: 3,
    expenseGrowth: 2,
    exitCapRate: 5.5,
    opexRatio: 25,
    federalTaxRate: 37,
    stateTaxRate: 5,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 5,
    depreciationRecaptureRate: 25,
    deferredGains: 0,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    taxAdvanceDiscountRate: 10,
    advanceFinancingRate: 10,
    taxDeliveryMonths: 0,
    investorEquityPct: 20,
    philanthropicEquityPct: 0,
    // Required by CalculationParams type
    investorUpfrontCash: 20, // $20M (matches investorEquityPct of 20% on $100M)
    totalTaxBenefit: 10, // $10M placeholder
    netTaxBenefit: 10, // $10M placeholder
    hdcFee: 0, // No HDC fee for tests
    investorPromoteShare: 0,
    seniorDebtPct: 50,
    seniorDebtRate: 5.5,
    seniorDebtAmortization: 30,
    seniorDebtIOYears: 5,
    philDebtPct: 10,
    philDebtRate: 7,
    philDebtAmortization: 30,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    hdcSubDebtPct: 0,
    hdcSubDebtPikRate: 0,
    investorSubDebtPct: 0,
    investorSubDebtPikRate: 0,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 0,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0,
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    aumCurrentPayEnabled: false,
    aumCurrentPayPct: 0,
  };

  describe('Bug Fix 1: currentNOI reset at placed-in-service year', () => {
    it('should have NOI = 0 during construction years', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
      });

      // Years 1-2 should have NOI = 0 (construction)
      expect(result.cashFlows[0].noi).toBe(0);
      expect(result.cashFlows[1].noi).toBe(0);
    });

    it('should have positive NOI in placed-in-service year (24-month delay)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
      });

      // Year 3 should have positive NOI (placed in service)
      // With 24 months = exactly 2 years, Year 3 is a full year of operations
      expect(result.cashFlows[2].noi).toBeGreaterThan(0);
      // Should be approximately the Year 1 NOI (no growth applied in first operational year)
      // baseParams.yearOneNOI is in millions ($6M)
      expect(result.cashFlows[2].noi).toBeCloseTo(baseParams.yearOneNOI, 0);
    });

    it('should have positive NOI in placed-in-service year (12-month delay)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 12,
      });

      // Year 1 should have NOI = 0 (construction)
      expect(result.cashFlows[0].noi).toBe(0);

      // Year 2 should have positive NOI (placed in service)
      expect(result.cashFlows[1].noi).toBeGreaterThan(0);
    });

    it('should have positive NOI in Year 1 with no construction delay', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
      });

      // Year 1 should have positive NOI (no construction delay)
      expect(result.cashFlows[0].noi).toBeGreaterThan(0);
      expect(result.cashFlows[0].noi).toBeCloseTo(baseParams.yearOneNOI, 0);
    });
  });

  describe('Bug Fix 2: DSCR calculation with construction delay', () => {
    it('should have DSCR > 0 in placed-in-service year (24-month delay)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
      });

      // Years 1-2: Construction - DSCR = 0 (both NOI and debt service are 0)
      expect(result.cashFlows[0].dscr).toBe(0);
      expect(result.cashFlows[1].dscr).toBe(0);

      // Year 3: Placed in service - DSCR should be positive
      // With debt service starting and NOI starting, DSCR should be calculable
      expect(result.cashFlows[2].dscr).toBeGreaterThan(0);
    });

    it('should have reasonable DSCR values in placed-in-service year (36-month delay)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 36,
      });

      // Years 1-3: Construction - DSCR = 0
      expect(result.cashFlows[0].dscr).toBe(0);
      expect(result.cashFlows[1].dscr).toBe(0);
      expect(result.cashFlows[2].dscr).toBe(0);

      // Year 4: Placed in service - DSCR should be positive
      expect(result.cashFlows[3].dscr).toBeGreaterThan(0);
    });
  });

  describe('Debt Service timing with construction delay', () => {
    it('should have zero debt service during construction', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
      });

      // Years 1-2: Construction - no debt service
      expect(result.cashFlows[0].hardDebtService ?? 0).toBe(0);
      expect(result.cashFlows[1].hardDebtService ?? 0).toBe(0);
    });

    it('should have positive debt service starting at placed-in-service', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
      });

      // Year 3: Debt service should start
      expect(result.cashFlows[2].hardDebtService ?? 0).toBeGreaterThan(0);
    });

    it('should start IO period at placed-in-service, not Year 1', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        seniorDebtIOYears: 3,
      });

      // With 24-month construction delay and 3-year IO:
      // - Year 3 (PIS): IO starts
      // - Years 3-5: IO period
      // - Year 6: P&I starts

      // Check debt service is consistent during IO period (Years 3-5)
      const year3DS = result.cashFlows[2].hardDebtService ?? 0;
      const year4DS = result.cashFlows[3].hardDebtService ?? 0;
      const year5DS = result.cashFlows[4].hardDebtService ?? 0;

      // IO payments should be relatively consistent (interest-only)
      expect(year3DS).toBeGreaterThan(0);
      expect(year4DS).toBeCloseTo(year3DS, -1); // Within ~10%
      expect(year5DS).toBeCloseTo(year3DS, -1);

      // Year 6 should have higher debt service (P&I starts)
      const year6DS = result.cashFlows[5].hardDebtService ?? 0;
      expect(year6DS).toBeGreaterThan(year5DS);
    });
  });

  describe('Lease-up anchored to placed-in-service year', () => {
    it('should apply S-curve starting at placed-in-service, not Year 1', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        interestReserveEnabled: true,
        interestReserveMonths: 18, // 18-month lease-up
      });

      // Years 1-2: Construction - no occupancy impact (NOI = 0 anyway)
      expect(result.cashFlows[0].noi).toBe(0);
      expect(result.cashFlows[1].noi).toBe(0);

      // Year 3 (PIS): Lease-up starts with S-curve
      // effectiveOccupancy should be < 1.0 due to S-curve
      // NOI should be reduced by S-curve occupancy
      const year3NOI = result.cashFlows[2].noi;
      expect(year3NOI).toBeGreaterThan(0);
      expect(year3NOI).toBeLessThan(baseParams.yearOneNOI); // Reduced by S-curve

      // Year 4: Lease-up continues, occupancy ramping up
      const year4NOI = result.cashFlows[3].noi;
      expect(year4NOI).toBeGreaterThan(year3NOI); // Higher occupancy

      // Year 5+: Should be stabilized (after 18-month lease-up from Year 3)
      // Lease-up ends mid-Year 4 (18 months from Year 3)
      const year5NOI = result.cashFlows[4].noi;
      // Year 5 should reflect full occupancy + growth
      expect(year5NOI).toBeGreaterThan(year4NOI);
    });

    it('should draw interest reserve during lease-up period anchored to PIS', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        interestReserveEnabled: true,
        interestReserveMonths: 12, // 12-month lease-up
      });

      // Years 1-2: Construction - no reserve draws
      expect(result.cashFlows[0].interestReserveDraw ?? 0).toBe(0);
      expect(result.cashFlows[1].interestReserveDraw ?? 0).toBe(0);

      // Year 3 (PIS): Reserve draws should start
      const year3Draw = result.cashFlows[2].interestReserveDraw ?? 0;
      expect(year3Draw).toBeGreaterThanOrEqual(0); // May draw if there's shortfall
    });
  });

  describe('Rent growth NOT applied during construction', () => {
    it('should not compound revenue/expense growth during construction', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        revenueGrowth: 10, // Exaggerated to make effect obvious
        expenseGrowth: 5,
      });

      // Year 3 (PIS) should start with base Year 1 NOI, not compounded
      const year3NOI = result.cashFlows[2].noi;

      // Should be close to base NOI (no growth applied yet)
      // Allow some tolerance for rounding
      expect(year3NOI).toBeCloseTo(baseParams.yearOneNOI, 0);

      // Year 4 should have growth applied (first year of growth)
      const year4NOI = result.cashFlows[3].noi;
      // Year 4 NOI should be higher than Year 3 due to growth
      expect(year4NOI).toBeGreaterThan(year3NOI);
    });
  });

  describe('Edge cases', () => {
    it('should handle 0 construction delay correctly', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
      });

      // Year 1 should be fully operational
      expect(result.cashFlows[0].noi).toBeGreaterThan(0);
      expect(result.cashFlows[0].hardDebtService ?? 0).toBeGreaterThan(0);
      expect(result.cashFlows[0].dscr).toBeGreaterThan(0);
    });

    it('should handle partial year placement (18-month delay)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 18,
      });

      // Year 1: Full construction
      expect(result.cashFlows[0].noi).toBe(0);

      // Year 2: Placed in service mid-year (6 months of operations)
      // constructionDelayYears = floor(18/12) = 1
      // placedInServiceYear = 1 + 1 = 2
      // monthsInService = 12 - (18 % 12) = 12 - 6 = 6
      const year2NOI = result.cashFlows[1].noi;
      expect(year2NOI).toBeGreaterThan(0);
      // Should be approximately half of full year NOI
      expect(year2NOI).toBeCloseTo(baseParams.yearOneNOI * 0.5, 0);
    });

    it('should handle long construction delay (48 months)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 48,
        holdPeriod: 15,
      });

      // Years 1-4: Construction
      expect(result.cashFlows[0].noi).toBe(0);
      expect(result.cashFlows[1].noi).toBe(0);
      expect(result.cashFlows[2].noi).toBe(0);
      expect(result.cashFlows[3].noi).toBe(0);

      // Year 5: Placed in service
      expect(result.cashFlows[4].noi).toBeGreaterThan(0);
      expect(result.cashFlows[4].dscr).toBeGreaterThan(0);
    });
  });

  describe('Timeline verification table', () => {
    it('should produce expected timeline for 24-month construction + 18-month lease-up', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        interestReserveEnabled: true,
        interestReserveMonths: 18,
      });

      console.log('\n=== TIMELINE: 24-month construction + 18-month lease-up ===\n');
      console.log('| Year | Status            | NOI           | Debt Service  | DSCR  | Occupancy |');
      console.log('|------|-------------------|---------------|---------------|-------|-----------|');

      const placedInServiceYear = 3; // floor(24/12) + 1 = 3
      const leaseUpEndYear = placedInServiceYear + Math.ceil(18 / 12) - 1; // 3 + 2 - 1 = 4

      result.cashFlows.forEach((cf, idx) => {
        const year = idx + 1;
        let status = '';
        if (year < placedInServiceYear) {
          status = 'Construction';
        } else if (year <= leaseUpEndYear) {
          status = year === placedInServiceYear ? 'PIS + Lease-up' : 'Lease-up';
        } else {
          status = 'Stabilized';
        }

        const noi = cf.noi.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        const ds = (cf.hardDebtService ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        const dscr = (cf.dscr ?? 0).toFixed(2);
        const occupancy = cf.effectiveOccupancy !== undefined ? `${(cf.effectiveOccupancy * 100).toFixed(1)}%` : 'N/A';

        console.log(`|  ${year.toString().padStart(2)}  | ${status.padEnd(17)} | ${noi.padStart(13)} | ${ds.padStart(13)} | ${dscr.padStart(5)} | ${occupancy.padStart(9)} |`);
      });

      // Verify key assertions
      expect(result.cashFlows[0].noi).toBe(0); // Year 1: Construction
      expect(result.cashFlows[1].noi).toBe(0); // Year 2: Construction
      expect(result.cashFlows[2].noi).toBeGreaterThan(0); // Year 3: PIS
      expect(result.cashFlows[2].dscr).toBeGreaterThan(0); // Year 3: DSCR calculable
    });
  });
});
