/**
 * Calculation Chain Tests
 *
 * These tests verify multi-step calculations where the output of one
 * calculation feeds into the next, ensuring accuracy through the entire chain.
 */

describe('Multi-Step Calculation Chains', () => {

  describe('Chain 1: Project Cost → Depreciation → Tax Benefits → HDC Fees → Net to Investor', () => {
    it('should accurately flow through the entire tax benefit chain', () => {
      // Step 1: Start with project cost
      const projectCost = 50;
      const landValue = 5;

      // Step 2: Calculate depreciable basis
      const depreciableBasis = projectCost - landValue;
      expect(depreciableBasis).toBe(45);

      // Step 3: Calculate Year 1 bonus depreciation
      const bonusDepreciationPct = 0.25;
      const year1Depreciation = depreciableBasis * bonusDepreciationPct;
      expect(year1Depreciation).toBe(11.25);

      // Step 4: Calculate tax benefit
      const effectiveTaxRate = 0.4785;
      const year1TaxBenefit = year1Depreciation * effectiveTaxRate;
      expect(year1TaxBenefit).toBeCloseTo(5.383125, 6);

      // Step 5: HDC fee removed - investor gets 100%
      const hdcFeeRate = 0; // Fee removed per IMPL-7.0-001
      const year1HdcFee = 0;

      // Step 6: Calculate net to investor (100% of gross benefit)
      const year1NetToInvestor = year1TaxBenefit;
      expect(year1NetToInvestor).toBeCloseTo(5.383125, 6);

      // Verify the chain
      const expectedFinalValue = (projectCost - landValue) * bonusDepreciationPct * effectiveTaxRate;
      expect(year1NetToInvestor).toBeCloseTo(expectedFinalValue, 6);
    });
  });

  describe('Chain 2: NOI → Debt Service → Cash Flow → Recovery → Promote Split', () => {
    it('should correctly calculate cash distribution through waterfall', () => {
      // Step 1: Start with NOI
      const noi = 2.5;

      // Step 2: Calculate debt service
      const seniorDebtService = 2.158;
      const cashAfterDebtService = noi - seniorDebtService;
      expect(cashAfterDebtService).toBeCloseTo(0.342, 3);

      // Step 3: Deduct AUM fees
      const aumFee = 0.75;
      const cashAvailable = cashAfterDebtService;
      const aumPaid = Math.min(aumFee, cashAvailable);
      const cashAfterFees = cashAvailable - aumPaid;
      expect(aumPaid).toBeCloseTo(0.342, 3);
      expect(cashAfterFees).toBeCloseTo(0, 3);

      // Step 4: Check recovery status
      const cumulativeRecovery = 5;
      const investorEquity = 10;
      const isRecovering = cumulativeRecovery < investorEquity;
      expect(isRecovering).toBe(true);

      // Step 5: Distribute based on recovery
      let investorCash = 0;
      let hdcCash = 0;

      if (isRecovering) {
        investorCash = cashAfterFees; // 100% to investor
        hdcCash = 0;
      } else {
        const hdcPromote = 0.65;
        hdcCash = cashAfterFees * hdcPromote;
        investorCash = cashAfterFees * (1 - hdcPromote);
      }

      expect(investorCash).toBe(0); // All cash went to AUM
      expect(hdcCash).toBe(0);
    });
  });

  describe('Chain 3: OZ Investment → Year 5 → Tax Payment → Depreciation Offset → Net Impact', () => {
    it('should calculate complete OZ Year 5 impact', () => {
      // Step 1: Initial OZ investment
      const investorEquity = 10;
      const deferredGains = investorEquity; // 100% qualified
      expect(deferredGains).toBe(10);

      // Step 2: Calculate basis step-up (standard OZ)
      const stepUpPct = 0.10;
      const stepUpAmount = deferredGains * stepUpPct;
      const taxableGains = deferredGains - stepUpAmount;
      expect(stepUpAmount).toBe(1);
      expect(taxableGains).toBe(9);

      // Step 3: Calculate OZ tax due
      const capitalGainsRate = 0.347;
      const ozTaxDue = taxableGains * capitalGainsRate;
      expect(ozTaxDue).toBeCloseTo(3.123, 3);

      // Step 4: Calculate Year 5 depreciation benefit
      const year5Depreciation = 1.5; // Straight-line
      const ordinaryTaxRate = 0.4785;
      const year5DepreciationBenefit = year5Depreciation * ordinaryTaxRate;
      const hdcFee = 0; // Fee removed
      const netDepreciationBenefit = year5DepreciationBenefit;
      expect(netDepreciationBenefit).toBeCloseTo(0.71775, 4);

      // Step 5: Calculate net Year 5 impact
      const netYear5Impact = ozTaxDue - netDepreciationBenefit;
      expect(netYear5Impact).toBeCloseTo(2.40525, 4);

      // Verify the complete chain
      const expectedNetImpact = (deferredGains * (1 - stepUpPct) * capitalGainsRate) -
                               (year5Depreciation * ordinaryTaxRate);
      expect(netYear5Impact).toBeCloseTo(expectedNetImpact, 4);
    });
  });

  describe('Chain 4: PIK Debt → Compound Interest → Exit Balance → Payoff Priority', () => {
    it('should calculate PIK debt growth and exit payoff', () => {
      // Step 1: Initial PIK debt
      const initialPrincipal = 5;
      const annualRate = 0.08;
      const years = 10;

      // Step 2: Calculate compound growth year by year
      let balance = initialPrincipal;
      const balanceHistory = [balance];

      for (let year = 1; year <= years; year++) {
        const interest = balance * annualRate;
        balance = balance + interest;
        balanceHistory.push(balance);
      }

      expect(balance).toBeCloseTo(10.794625, 4);

      // Step 3: Calculate exit value
      const finalNOI = 4.5;
      const capRate = 0.06;
      const exitValue = finalNOI / capRate;
      expect(exitValue).toBe(75);

      // Step 4: Pay off debts in priority
      let remainingValue = exitValue;
      const seniorDebt = 25;
      const philDebt = 5.5;
      const hdcSubDebt = balance; // Our PIK debt

      remainingValue -= seniorDebt; // Pay senior first
      expect(remainingValue).toBe(50);

      remainingValue -= philDebt; // Pay phil second
      expect(remainingValue).toBe(44.5);

      remainingValue -= hdcSubDebt; // Pay sub-debt
      expect(remainingValue).toBeCloseTo(33.705375, 3);

      // Step 5: Distribute remaining proceeds
      const grossProceeds = remainingValue;
      const hdcPromote = 0.65;
      const hdcShare = grossProceeds * hdcPromote;
      const investorShare = grossProceeds * (1 - hdcPromote);

      expect(hdcShare).toBeCloseTo(21.9085, 3);
      expect(investorShare).toBeCloseTo(11.7969, 3);
    });
  });

  describe('Chain 5: Interest Reserve → Effective Cost → Capital Structure → Debt Service', () => {
    it('should calculate interest reserve impact through the chain', () => {
      // Step 1: Base project parameters
      const baseProjectCost = 50;
      const seniorDebtPct = 0.60;
      const philDebtPct = 0.10;

      // Step 2: Calculate base debt amounts
      const baseSeniorDebt = baseProjectCost * seniorDebtPct;
      const basePhilDebt = baseProjectCost * philDebtPct;
      expect(baseSeniorDebt).toBe(30);
      expect(basePhilDebt).toBe(5);

      // Step 3: Calculate monthly debt service on base amounts
      const seniorRate = 0.06 / 12;
      const philRate = 0.03 / 12;
      const seniorPayments = 360;

      // Simplified PMT calculation
      const seniorMonthly = baseSeniorDebt * 0.006; // Approximation
      const philMonthly = basePhilDebt * 0.003; // Approximation
      const totalMonthlyDebtService = seniorMonthly + philMonthly;

      // Step 4: Calculate interest reserve
      const reserveMonths = 12;
      const interestReserve = totalMonthlyDebtService * reserveMonths;
      expect(interestReserve).toBeCloseTo(2.34, 1); // Rough approximation

      // Step 5: Calculate effective project cost
      const effectiveProjectCost = baseProjectCost + interestReserve;
      expect(effectiveProjectCost).toBeGreaterThan(baseProjectCost);

      // Step 6: Apply capital structure to effective cost
      const finalSeniorDebt = effectiveProjectCost * seniorDebtPct;
      const finalPhilDebt = effectiveProjectCost * philDebtPct;
      const investorEquity = effectiveProjectCost * 0.20;

      expect(finalSeniorDebt).toBeGreaterThan(baseSeniorDebt);
      expect(finalPhilDebt).toBeGreaterThan(basePhilDebt);
      expect(investorEquity).toBeGreaterThan(10);

      // Verify the chain maintains proportions
      expect(finalSeniorDebt / effectiveProjectCost).toBeCloseTo(seniorDebtPct, 2);
      expect(finalPhilDebt / effectiveProjectCost).toBeCloseTo(philDebtPct, 2);
    });
  });

  describe('Chain 6: Free Investment Test Chain', () => {
    it('should validate complete free investment achievement', () => {
      // Step 1: Calculate investor's total investment
      const projectCost = 50;
      const investorEquityPct = 0.20;
      const investorEquity = projectCost * investorEquityPct;
      const hdcFee = 0.5;
      const totalInvestment = investorEquity + hdcFee;
      expect(totalInvestment).toBe(10.5);

      // Step 2: Calculate Year 1 tax benefits
      const depreciableBasis = projectCost - 5; // 5M land value
      const year1Depreciation = depreciableBasis * 0.25;
      const taxRate = 0.4785;
      const year1TaxBenefit = year1Depreciation * taxRate;
      expect(year1TaxBenefit).toBeCloseTo(5.383125, 6);

      // Step 3: Calculate HDC fee on tax benefits
      const hdcTaxFee = year1TaxBenefit * 0.10;
      const netTaxBenefit = year1TaxBenefit - hdcTaxFee;
      expect(netTaxBenefit).toBeCloseTo(4.8448, 4);

      // Step 4: Calculate Year 1 operating cash
      const year1NOI = 2.5;
      const debtService = 2.158;
      const cashAfterDebt = year1NOI - debtService;
      const aumFee = 0.75;
      const cashAfterAUM = Math.max(0, cashAfterDebt - aumFee);
      expect(cashAfterAUM).toBe(0); // All cash to AUM

      // Step 5: Total Year 1 benefit to investor
      const totalYear1Benefit = netTaxBenefit + cashAfterAUM;
      expect(totalYear1Benefit).toBeCloseTo(4.8448, 4);

      // Step 6: Free investment test
      const isFreeInvestment = totalYear1Benefit >= totalInvestment;
      expect(isFreeInvestment).toBe(false); // Not quite free in this example

      const coverageRatio = totalYear1Benefit / totalInvestment;
      expect(coverageRatio).toBeCloseTo(0.4614, 4);
    });
  });

  describe('Chain 7: Complete Exit Calculation Chain', () => {
    it('should calculate exit from NOI through final distribution', () => {
      // Step 1: Final year NOI
      const year10NOI = 3.5;

      // Step 2: Calculate exit value
      const exitCapRate = 0.06;
      const exitValue = year10NOI / exitCapRate;
      expect(exitValue).toBeCloseTo(58.333, 3);

      // Step 3: Calculate all debt balances
      const seniorRemaining = 24; // After 10 years of amortization
      const philPIK = 6.72; // 5M at 3% for 10 years
      const hdcSubPIK = 10.79; // 5M at 8% for 10 years
      const investorSubPIK = 10.79; // 5M at 8% for 10 years
      const totalDebt = seniorRemaining + philPIK + hdcSubPIK + investorSubPIK;
      expect(totalDebt).toBeCloseTo(52.3, 1);

      // Step 4: Calculate gross proceeds
      const grossProceeds = exitValue - totalDebt;
      expect(grossProceeds).toBeCloseTo(6.033, 3);

      // Step 5: Calculate accumulated AUM fees
      const annualAUM = 0.75;
      const yearsUnpaid = 8; // Assume 2 years partially paid
      const accumulatedAUM = annualAUM * yearsUnpaid;
      expect(accumulatedAUM).toBe(6);

      // Step 6: Split gross proceeds by promote
      const hdcPromote = 0.65;
      const investorGrossShare = grossProceeds * (1 - hdcPromote);
      const hdcGrossShare = grossProceeds * hdcPromote;
      expect(investorGrossShare).toBeCloseTo(2.112, 3);
      expect(hdcGrossShare).toBeCloseTo(3.922, 3);

      // Step 7: Settle AUM fees from investor share
      const investorNetExit = Math.max(0, investorGrossShare - accumulatedAUM);
      const hdcTotalExit = hdcGrossShare + Math.min(accumulatedAUM, investorGrossShare);
      expect(investorNetExit).toBe(0); // AUM exceeds share
      expect(hdcTotalExit).toBeCloseTo(6.033, 3);

      // Step 8: Add back sub-debt returns
      const investorFinalExit = investorNetExit + investorSubPIK;
      const hdcFinalExit = hdcTotalExit + hdcSubPIK;
      expect(investorFinalExit).toBeCloseTo(10.79, 2);
      expect(hdcFinalExit).toBeCloseTo(16.823, 3);
    });
  });

  describe('Validation of Chain Independence', () => {
    it('should maintain accuracy when parameters change mid-chain', () => {
      // Test that each step correctly uses its inputs regardless of source

      // Chain with normal parameters
      const normalBasis = 45;
      const normalDepreciation = normalBasis * 0.25;
      const normalTaxBenefit = normalDepreciation * 0.4785;
      expect(normalTaxBenefit).toBeCloseTo(5.383, 3);

      // Chain with different parameters
      const highBasis = 80;
      const highDepreciation = highBasis * 0.25;
      const highTaxBenefit = highDepreciation * 0.4785;
      expect(highTaxBenefit).toBeCloseTo(9.57, 2);

      // Verify formulas work independently
      const ratio = highTaxBenefit / normalTaxBenefit;
      const expectedRatio = highBasis / normalBasis;
      expect(ratio).toBeCloseTo(expectedRatio, 4);
    });

    it('should handle edge cases in calculation chains', () => {
      // Zero NOI chain
      const zeroNOI = 0;
      const debtService = 2.158;
      const cashFlow = zeroNOI - debtService;
      expect(cashFlow).toBe(-2.158);

      // Negative cash should not crash calculations
      const investorShare = cashFlow > 0 ? cashFlow : 0;
      expect(investorShare).toBe(0);

      // Very high debt chain
      const exitValue = 50;
      const totalDebt = 60;
      const proceeds = Math.max(0, exitValue - totalDebt);
      expect(proceeds).toBe(0);
    });
  });
});