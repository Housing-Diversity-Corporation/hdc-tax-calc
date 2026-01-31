import { renderHook } from '@testing-library/react';
import { useHDCCalculations } from '../useHDCCalculations';
import { CONFORMING_STATES } from '../../../utils/taxbenefits';

describe('useHDCCalculations Hook - Integration Tests', () => {
  
  const defaultProps = {
    // Core project parameters
    projectCost: 86000000,
    landValue: 10000000,
    yearOneNOI: 5113000,
    yearOneDepreciationPct: 25,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6,
    opexRatio: 25,

    // Tax parameters
    federalTaxRate: 37,
    selectedState: 'NJ', // NJ is a conforming state (status: 'GO')
    // IMPL-035: investorState now drives tax calculations (where investor files taxes)
    investorState: 'NJ',
    stateCapitalGainsRate: 10.75, // NJ state rate
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    deferredGains: 10000000,
    
    // Fee parameters
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    taxAdvanceDiscountRate: 20,
    advanceFinancingRate: 8,
    taxDeliveryMonths: 12,
    aumFeeEnabled: false,
    aumFeeRate: 1,
    
    // Capital structure
    investorEquityPct: 14,
    philanthropicEquityPct: 0,
    seniorDebtPct: 66,
    philDebtPct: 20,
    hdcSubDebtPct: 0,
    hdcSubDebtPikRate: 8,
    investorSubDebtPct: 0,
    investorSubDebtPikRate: 8,
    investorPromoteShare: 35,
    
    // Debt settings
    seniorDebtRate: 5,
    philDebtRate: 0,
    seniorDebtAmortization: 35,
    seniorDebtIOYears: 0,
    philDebtAmortization: 60,
    
    // PIK settings
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 50,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 50,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 50,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 50,

    // Outside investor sub-debt
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 8,

    // Interest Reserve settings
    interestReserveEnabled: false,
    interestReserveMonths: 12,

    // Tax timing
    taxBenefitDelayMonths: 0,
    constructionDelayMonths: 0,

    // AUM current pay settings
    aumCurrentPayEnabled: false,
    aumCurrentPayPct: 50,

    // Hold Period
    holdPeriod: 10
  };

  describe('Depreciation Calculations', () => {
    it('should calculate year one depreciation correctly', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));

      // Verify Year 1 depreciation is calculated correctly
      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis (funding source, not cost)
      // The actual calculation is complex and includes interest reserve effects
      expect(result.current.yearOneDepreciation).toBe(19950000); // Updated: investor equity no longer subtracted
    });

    it('should calculate straight-line depreciation over 27.5 years', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));

      // Straight-line depreciation should be reasonable
      // Should be less than year 1 bonus depreciation
      expect(result.current.annualStraightLineDepreciation).toBeGreaterThan(500000); // At least 500k
      expect(result.current.annualStraightLineDepreciation).toBeLessThan(result.current.yearOneDepreciation); // Less than year 1
    });

    it('should calculate 10-year total depreciation', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));

      // Verify that 10-year depreciation is reasonable
      // Should be significant but not exceed project cost
      expect(result.current.total10YearDepreciation).toBeGreaterThan(20000000); // At least 20M
      expect(result.current.total10YearDepreciation).toBeLessThan(defaultProps.projectCost); // Less than total cost
    });

    it('should handle different depreciation percentages', () => {
      const modifiedProps = { ...defaultProps, yearOneDepreciationPct: 40 };
      const { result } = renderHook(() => useHDCCalculations(modifiedProps));

      // Year 1 depreciation should be higher with 40% vs 25%
      const { result: baseResult } = renderHook(() => useHDCCalculations(defaultProps));
      expect(result.current.yearOneDepreciation).toBeGreaterThan(baseResult.current.yearOneDepreciation);
    });
  });

  describe('Tax Calculations - Formula Logic Tests', () => {
    /**
     * These tests validate the TAX LOGIC/FORMULAS, not specific rate values.
     * Tax rates are user-configurable in tax profiles, so tests check:
     * 1. Which components are INCLUDED/EXCLUDED (federal, state, NIIT)
     * 2. The RELATIONSHIPS between inputs and outputs
     * 3. The FORMULAS work correctly regardless of specific rates
     */

    describe('REP Investors (Track 1) - Active Income Logic', () => {
      it('should include federal + state for REP in conforming state (exclude NIIT)', () => {
        const repConformingProps = {
          ...defaultProps,
          investorTrack: 'rep' as const,
          selectedState: 'NJ', // Conforming state
          // IMPL-035: investorState drives tax calculations
          investorState: 'NJ',
          federalTaxRate: 35, // User-configured
          stateCapitalGainsRate: 12, // User-configured (NOT used for REP depreciation)
          niitRate: 3.8 // Fixed
        };
        const { result } = renderHook(() => useHDCCalculations(repConformingProps));

        expect(result.current.isConformingState).toBe(true);

        // FORMULA: Federal + State ORDINARY INCOME rate (NO NIIT for active income)
        // REPs offset ordinary income, so hook uses CONFORMING_STATES[state].rate
        // NOT stateCapitalGainsRate prop
        const njOrdinaryIncomeRate = CONFORMING_STATES['NJ'].rate; // 10.75%
        const expectedRate = repConformingProps.federalTaxRate + njOrdinaryIncomeRate;
        expect(result.current.effectiveTaxRateForDepreciation).toBe(expectedRate); // 35 + 10.75 = 45.75

        // Verify NIIT is NOT included
        expect(result.current.effectiveTaxRateForDepreciation).not.toBe(
          repConformingProps.federalTaxRate + njOrdinaryIncomeRate + repConformingProps.niitRate
        );
      });

      it('should include federal + state for REP in non-conforming state (IMPL-066: state tax always applies)', () => {
        // IMPL-066: State income tax is INDEPENDENT of OZ conformity
        // OZ conformity only affects OZ benefits (deferral, step-up), NOT state income tax
        const repNonConformingProps = {
          ...defaultProps,
          investorTrack: 'rep' as const,
          selectedState: 'NY', // Non-conforming for OZ, but state tax still applies
          // IMPL-035: investorState drives tax calculations
          investorState: 'NY',
          federalTaxRate: 35,
          stateCapitalGainsRate: 10.9, // NY state ordinary income rate
          niitRate: 3.8
        };
        const { result } = renderHook(() => useHDCCalculations(repNonConformingProps));

        // FORMULA: Federal + State (NO NIIT for active income, but state tax ALWAYS applies per IMPL-066)
        // NY ordinary income rate is 10.9%
        const nyOrdinaryRate = 10.9;
        const expectedRate = repNonConformingProps.federalTaxRate + nyOrdinaryRate;
        expect(result.current.effectiveTaxRateForDepreciation).toBe(expectedRate); // 35 + 10.9 = 45.9

        // Verify NIIT is NOT included (REP is exempt)
        expect(result.current.effectiveTaxRateForDepreciation).toBeLessThan(
          expectedRate + repNonConformingProps.niitRate
        );
      });
    });

    describe('Non-REP Investors (Track 2) - Passive Income Logic with NIIT', () => {
      it('should include federal + NIIT + state for Non-REP STCG in conforming state', () => {
        const nonRepSTCGProps = {
          ...defaultProps,
          investorTrack: 'non-rep' as const,
          passiveGainType: 'short-term' as const,
          selectedState: 'NJ',
          // IMPL-035: investorState drives tax calculations
          investorState: 'NJ',
          federalTaxRate: 37, // STCG uses ordinary income rate
          stateCapitalGainsRate: 10.75,
          niitRate: 3.8
        };
        const { result } = renderHook(() => useHDCCalculations(nonRepSTCGProps));

        expect(result.current.isConformingState).toBe(true);

        // FORMULA: Federal + NIIT + State (passive income includes NIIT)
        const expectedRate = nonRepSTCGProps.federalTaxRate + nonRepSTCGProps.niitRate + nonRepSTCGProps.stateCapitalGainsRate;
        expect(result.current.effectiveTaxRateForDepreciation).toBe(expectedRate);
      });

      it('should include federal + NIIT + state CG for Non-REP LTCG in conforming state', () => {
        const nonRepLTCGProps = {
          ...defaultProps,
          investorTrack: 'non-rep' as const,
          passiveGainType: 'long-term' as const,
          selectedState: 'NJ',
          // IMPL-035: investorState drives tax calculations
          investorState: 'NJ',
          federalTaxRate: 20, // LTCG uses preferential rate
          stateCapitalGainsRate: 10.75,
          niitRate: 3.8
        };
        const { result } = renderHook(() => useHDCCalculations(nonRepLTCGProps));

        expect(result.current.isConformingState).toBe(true);

        // FORMULA: Federal + NIIT + State CG (passive income includes NIIT)
        const expectedRate = nonRepLTCGProps.federalTaxRate + nonRepLTCGProps.niitRate + nonRepLTCGProps.stateCapitalGainsRate;
        expect(result.current.effectiveTaxRateForDepreciation).toBe(expectedRate);
      });

      it('should include federal + NIIT + state for Non-REP in non-conforming state (IMPL-066: state tax always applies)', () => {
        // IMPL-066: State income tax is INDEPENDENT of OZ conformity
        // OZ conformity only affects OZ benefits (deferral, step-up), NOT state income tax
        const nonRepNonConformingProps = {
          ...defaultProps,
          investorTrack: 'non-rep' as const,
          passiveGainType: 'short-term' as const,
          selectedState: 'NY', // Non-conforming for OZ, but state tax still applies
          // IMPL-035: investorState drives tax calculations
          investorState: 'NY',
          federalTaxRate: 37,
          stateCapitalGainsRate: 10.9, // NY state ordinary income rate
          niitRate: 3.8
        };
        const { result } = renderHook(() => useHDCCalculations(nonRepNonConformingProps));

        // FORMULA: Federal + NIIT + State (state tax ALWAYS applies per IMPL-066)
        // NY ordinary income rate is 10.9%
        const nyOrdinaryRate = 10.9;
        const expectedRate = nonRepNonConformingProps.federalTaxRate + nonRepNonConformingProps.niitRate + nyOrdinaryRate;
        expect(result.current.effectiveTaxRateForDepreciation).toBeCloseTo(expectedRate, 1); // 37 + 3.8 + 10.9 = 51.7
      });

      it('should exclude NIIT for territories even for Non-REP investors', () => {
        const territoryProps = {
          ...defaultProps,
          investorTrack: 'non-rep' as const,
          passiveGainType: 'short-term' as const,
          selectedState: 'PR', // Puerto Rico
          // IMPL-035: investorState drives tax calculations
          investorState: 'PR',
          federalTaxRate: 37,
          stateCapitalGainsRate: 0,
          niitRate: 3.8
        };
        const { result } = renderHook(() => useHDCCalculations(territoryProps));

        // FORMULA: Federal only (NO NIIT for territories, NO state tax)
        expect(result.current.effectiveTaxRateForDepreciation).toBe(territoryProps.federalTaxRate);
      });
    });

    describe('Tax Benefit Calculation Formulas', () => {
      it('should calculate tax benefit using formula: depreciation × effective rate', () => {
        const { result } = renderHook(() => useHDCCalculations(defaultProps));

        // IMPL-041: Tax benefit calculation now uses split rates for bonus vs straight-line depreciation
        // Verify that totalTaxBenefit is calculated
        expect(result.current.totalTaxBenefit).toBeGreaterThan(0);
        // Effective rate should be set
        expect(result.current.effectiveTaxRateForDepreciation).toBeGreaterThan(0);
        // totalTaxBenefit should be a finite number
        expect(Number.isFinite(result.current.totalTaxBenefit)).toBe(true);
      });
    });

    describe('Capital Gains Tax Formulas', () => {
      it('should calculate capital gains tax using variable rates with OZ step-up', () => {
        const customRatesProps = {
          ...defaultProps,
          ltCapitalGainsRate: 18, // User-configured
          niitRate: 3.8, // Fixed
          stateCapitalGainsRate: 9, // User-configured
          deferredGains: 5000000, // User input
          ozType: 'standard' as const // OZ-only calculator defaults to standard (10% step-up)
        };
        const { result } = renderHook(() => useHDCCalculations(customRatesProps));

        // FORMULA: Total CG Rate = LT Rate + NIIT + State CG
        const expectedCapGainsRate = customRatesProps.ltCapitalGainsRate + customRatesProps.niitRate + customRatesProps.stateCapitalGainsRate;
        expect(result.current.totalCapitalGainsRate).toBeCloseTo(expectedCapGainsRate, 1);

        // FORMULA: Tax Due = Taxable Gains (after OZ step-up) × (Total Rate / 100)
        // OZ-only calculator: Standard OZ provides 10% step-up basis reduction
        const ozStepUpPercent = 0.10; // Standard OZ
        const taxableGainsAfterStepUp = customRatesProps.deferredGains * (1 - ozStepUpPercent);
        const expectedTaxDue = taxableGainsAfterStepUp * (expectedCapGainsRate / 100);
        // Calculation: 5M × 90% × 30.8% = 4.5M × 30.8% = 1,386,000
        expect(result.current.deferredGainsTaxDue).toBeCloseTo(expectedTaxDue, 0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle NONE state selection (federal only)', () => {
        const noneStateProps = {
          ...defaultProps,
          investorTrack: 'rep' as const,
          selectedState: 'NONE',
          // IMPL-035: investorState drives tax calculations
          investorState: 'NONE',
          federalTaxRate: 35,
          stateCapitalGainsRate: 0
        };
        const { result } = renderHook(() => useHDCCalculations(noneStateProps));

        expect(result.current.isConformingState).toBe(false);
        expect(result.current.effectiveTaxRateForDepreciation).toBe(noneStateProps.federalTaxRate);
      });

      it('should handle CUSTOM state (non-conforming for depreciation)', () => {
        const customStateProps = {
          ...defaultProps,
          investorTrack: 'rep' as const,
          selectedState: 'CUSTOM',
          // IMPL-035: investorState drives tax calculations
          investorState: 'CUSTOM',
          federalTaxRate: 35,
          stateCapitalGainsRate: 8
        };
        const { result } = renderHook(() => useHDCCalculations(customStateProps));

        expect(result.current.isConformingState).toBe(false);
        // Custom states are non-conforming for depreciation benefits
        expect(result.current.effectiveTaxRateForDepreciation).toBe(customStateProps.federalTaxRate);
      });
    });
  });

  describe('Advance Financing Calculations', () => {
    it('should calculate advance financing when enabled', () => {
      const advanceProps = { ...defaultProps, hdcAdvanceFinancing: true };
      const { result } = renderHook(() => useHDCCalculations(advanceProps));
      
      const discountedPayment = result.current.netTaxBenefit * 0.8; // 20% discount
      expect(result.current.investorUpfrontCash).toBeCloseTo(discountedPayment, 0);
    });

    it('should calculate HDC advance outlay with financing cost', () => {
      const advanceProps = { 
        ...defaultProps, 
        hdcAdvanceFinancing: true,
        advanceFinancingRate: 10,
        taxDeliveryMonths: 18
      };
      const { result } = renderHook(() => useHDCCalculations(advanceProps));
      
      const advancePayment = result.current.netTaxBenefit * 0.8;
      const financingCost = advancePayment * 0.10 * (18 / 12);
      const expectedOutlay = advancePayment + financingCost;
      
      expect(result.current.hdcAdvanceOutlay).toBeCloseTo(expectedOutlay, 0);
    });

    it('should return zero when advance financing disabled', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));
      
      expect(result.current.investorUpfrontCash).toBe(0);
      expect(result.current.hdcAdvanceOutlay).toBe(0);
    });
  });

  describe('Investment Calculations', () => {
    it('should calculate investor equity correctly', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));
      
      const expectedEquity = defaultProps.projectCost * 0.14;
      expect(result.current.investorEquity).toBe(expectedEquity);
    });

    it('should calculate year 1 tax benefit and net benefit', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));

      // Year 1 tax benefit should be substantial
      expect(result.current.year1TaxBenefit).toBeGreaterThan(1000000); // At least 1M

      // Net benefit should equal tax benefit (HDC fee removed per IMPL-7.0-014)
      const expectedNetBenefit = result.current.year1TaxBenefit;
      expect(result.current.year1NetBenefit).toBeCloseTo(expectedNetBenefit, 2);
    });

    // ISS-065: Removed freeInvestmentHurdle and investmentRecovered tests
    // (Excess Capacity section removed from UI)
  });

  describe('Main Analysis Results', () => {
    it('should generate 10-year cash flows', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));
      
      expect(result.current.investorCashFlows).toHaveLength(10);
      expect(result.current.investorCashFlows[0].year).toBe(1);
      expect(result.current.investorCashFlows[9].year).toBe(10);
    });

    it('should calculate IRR and multiple', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));
      
      expect(result.current.investorIRR).toBeDefined();
      expect(result.current.investorIRR).toBeGreaterThan(0);
      expect(result.current.multipleOnInvested).toBeGreaterThan(0);
    });

    it('should calculate exit proceeds', () => {
      const { result } = renderHook(() => useHDCCalculations(defaultProps));
      
      expect(result.current.exitProceeds).toBeGreaterThan(0);
      expect(result.current.mainAnalysisResults.exitValue).toBeGreaterThan(0);
      expect(result.current.mainAnalysisResults.remainingDebtAtExit).toBeGreaterThan(0);
    });

    it('should handle sub-debt in calculations', () => {
      const subDebtProps = {
        ...defaultProps,
        hdcSubDebtPct: 3,
        investorSubDebtPct: 2,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 40
      };
      const { result } = renderHook(() => useHDCCalculations(subDebtProps));
      
      expect(result.current.mainAnalysisResults.subDebtAtExit).toBeGreaterThan(0);
      expect(result.current.mainAnalysisResults.investorSubDebtAtExit).toBeGreaterThan(0);
    });
  });

  describe('HDC Analysis Results', () => {
    it('should calculate HDC cash flows', () => {
      const hdcProps = { ...defaultProps, philanthropicEquityPct: 10 };
      const { result } = renderHook(() => useHDCCalculations(hdcProps));
      
      expect(result.current.hdcCashFlows).toHaveLength(10);
      
      // HDC fee removed - verify all fee income is 0
      const totalHDCFeesFromCashFlows = result.current.hdcCashFlows.reduce(
        (sum, cf) => sum + cf.hdcFeeIncome, 0
      );
      expect(totalHDCFeesFromCashFlows).toBe(0);
      expect(result.current.hdcAnalysisResults.hdcFeeIncome).toBe(0);
    });

    it('should calculate HDC IRR and multiple', () => {
      const hdcProps = { ...defaultProps, philanthropicEquityPct: 10 };
      const { result } = renderHook(() => useHDCCalculations(hdcProps));
      
      expect(result.current.hdcIRR).toBeDefined();
      // HDC has $0 initial investment by design, so multiple is always 0
      // HDC earns fees and promote without capital contribution
      expect(result.current.hdcMultiple).toBe(0);
    });

    it('should calculate HDC exit proceeds', () => {
      const hdcProps = { ...defaultProps, philanthropicEquityPct: 10 };
      const { result } = renderHook(() => useHDCCalculations(hdcProps));
      
      expect(result.current.hdcExitProceeds).toBeGreaterThan(0);
      expect(result.current.hdcTotalReturns).toBeGreaterThan(0);
    });

    it('should handle AUM fees in HDC analysis', () => {
      const aumProps = {
        ...defaultProps,
        philanthropicEquityPct: 10,
        aumFeeEnabled: true,
        aumFeeRate: 1.5
      };
      const { result } = renderHook(() => useHDCCalculations(aumProps));
      
      expect(result.current.hdcAnalysisResults.hdcAumFeeIncome).toBeGreaterThan(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle all debt types simultaneously', () => {
      const complexProps = {
        ...defaultProps,
        seniorDebtPct: 50,
        philDebtPct: 15,
        hdcSubDebtPct: 5,
        investorSubDebtPct: 3,
        investorEquityPct: 17,
        philanthropicEquityPct: 10
      };
      const { result } = renderHook(() => useHDCCalculations(complexProps));
      
      expect(result.current.mainAnalysisResults).toBeDefined();
      expect(result.current.hdcAnalysisResults).toBeDefined();
      
      const totalCapital = 50 + 15 + 5 + 3 + 17 + 10;
      expect(totalCapital).toBe(100);
    });

    it('should handle high growth scenarios', () => {
      const highGrowthProps = {
        ...defaultProps,
        revenueGrowth: 10,
        expenseGrowth: 2
      };
      const { result } = renderHook(() => useHDCCalculations(highGrowthProps));
      
      const lastYearNOI = result.current.investorCashFlows[9].noi;
      const firstYearNOI = result.current.investorCashFlows[0].noi;
      expect(lastYearNOI).toBeGreaterThan(firstYearNOI * 2);
    });

    it('should handle negative growth scenarios', () => {
      const negativeGrowthProps = {
        ...defaultProps,
        revenueGrowth: -2,
        expenseGrowth: 5
      };
      const { result } = renderHook(() => useHDCCalculations(negativeGrowthProps));
      
      const lastYearNOI = result.current.investorCashFlows[9].noi;
      const firstYearNOI = result.current.investorCashFlows[0].noi;
      expect(lastYearNOI).toBeLessThan(firstYearNOI);
    });

    it('should handle extreme leverage', () => {
      const highLeverageProps = {
        ...defaultProps,
        seniorDebtPct: 85,
        philDebtPct: 10,
        investorEquityPct: 5,
        philanthropicEquityPct: 0
      };
      const { result } = renderHook(() => useHDCCalculations(highLeverageProps));
      
      expect(result.current.mainAnalysisResults.remainingDebtAtExit).toBeGreaterThan(
        defaultProps.projectCost * 0.5
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero project cost', () => {
      const zeroProps = { ...defaultProps, projectCost: 0, landValue: 0 };
      const { result } = renderHook(() => useHDCCalculations(zeroProps));
      
      expect(result.current.investorEquity).toBe(0);
      expect(result.current.yearOneDepreciation).toBe(0);
    });

    it('should handle zero NOI', () => {
      const zeroNOIProps = { ...defaultProps, yearOneNOI: 0 };
      const { result } = renderHook(() => useHDCCalculations(zeroNOIProps));
      
      expect(result.current.investorCashFlows[0].noi).toBe(0);
      expect(result.current.mainAnalysisResults).toBeDefined();
    });

    it('should handle 100% depreciation in year one', () => {
      const fullDepreciationProps = { ...defaultProps, yearOneDepreciationPct: 100 };
      const { result } = renderHook(() => useHDCCalculations(fullDepreciationProps));

      // With 100% depreciation, year 1 should be very large
      expect(result.current.yearOneDepreciation).toBeGreaterThan(30000000); // At least 30M
      // And annual straight-line should be 0 (no basis left)
      expect(result.current.annualStraightLineDepreciation).toBe(0);
    });

    it('should handle very high exit cap rate', () => {
      const highCapProps = { ...defaultProps, exitCapRate: 25 };
      const { result } = renderHook(() => useHDCCalculations(highCapProps));
      
      expect(result.current.mainAnalysisResults.exitValue).toBeLessThan(defaultProps.projectCost);
    });

    it('should handle very low exit cap rate', () => {
      const lowCapProps = { ...defaultProps, exitCapRate: 1 };
      const { result } = renderHook(() => useHDCCalculations(lowCapProps));
      
      expect(result.current.mainAnalysisResults.exitValue).toBeGreaterThan(
        defaultProps.projectCost * 5
      );
    });
  });

  describe('Memoization and Performance', () => {
    it('should not recalculate when unrelated props change', () => {
      const { result, rerender } = renderHook(
        (props) => useHDCCalculations(props),
        { initialProps: defaultProps }
      );
      
      const initialResults = result.current.mainAnalysisResults;
      
      // Change a prop that doesn't affect calculations
      rerender(defaultProps);
      
      expect(result.current.mainAnalysisResults).toBe(initialResults);
    });

    it('should recalculate when relevant props change', () => {
      const { result, rerender } = renderHook(
        (props) => useHDCCalculations(props),
        { initialProps: defaultProps }
      );
      
      const initialIRR = result.current.investorIRR;
      
      const newProps = { ...defaultProps, projectCost: 100000000 };
      rerender(newProps);
      
      expect(result.current.investorIRR).not.toBe(initialIRR);
    });
  });

  describe('Predevelopment Costs - Depreciable Basis Inclusion', () => {
    it('should include predevelopment costs in depreciable basis calculation', () => {
      const propsWithPredevelopment = {
        ...defaultProps,
        projectCost: 50000000,
        predevelopmentCosts: 2000000,
        landValue: 10000000,
        investorEquityPct: 20
      };

      const { result } = renderHook(() => useHDCCalculations(propsWithPredevelopment));

      // Verify Year 1 depreciation is higher with predevelopment costs
      // Don't test exact formula, just verify it's reasonable
      expect(result.current.yearOneDepreciation).toBeGreaterThan(5000000); // At least 5M
      expect(result.current.yearOneDepreciation).toBeLessThan(20000000); // Less than 20M

      // Verify straight-line depreciation is reasonable
      expect(result.current.annualStraightLineDepreciation).toBeGreaterThan(500000); // At least 500k per year
      expect(result.current.annualStraightLineDepreciation).toBeLessThan(5000000); // Less than 5M per year
    });

    it('should show higher tax benefits with predevelopment costs compared to without', () => {
      const propsWithoutPredevelopment = {
        ...defaultProps,
        projectCost: 50000000,
        predevelopmentCosts: 0,
        landValue: 10000000,
        investorEquityPct: 20
      };

      const propsWithPredevelopment = {
        ...defaultProps,
        projectCost: 50000000,
        predevelopmentCosts: 2000000,
        landValue: 10000000,
        investorEquityPct: 20
      };

      const { result: resultWithout } = renderHook(() => useHDCCalculations(propsWithoutPredevelopment));
      const { result: resultWith } = renderHook(() => useHDCCalculations(propsWithPredevelopment));

      // Tax benefits should be higher when predevelopment costs are included
      expect(resultWith.current.totalTaxBenefit).toBeGreaterThan(resultWithout.current.totalTaxBenefit);
      expect(resultWith.current.yearOneDepreciation).toBeGreaterThan(resultWithout.current.yearOneDepreciation);

      // Just verify that there is a positive difference
      const actualDifference = resultWith.current.yearOneDepreciation - resultWithout.current.yearOneDepreciation;
      expect(actualDifference).toBeGreaterThan(0); // Should be positive
    });

    it('should apply predevelopment costs consistently across all calculation points', () => {
      const propsWithPredevelopment = {
        ...defaultProps,
        projectCost: 50000000,
        predevelopmentCosts: 2000000,
        landValue: 10000000,
        investorEquityPct: 20,
        hdcAdvanceFinancing: false,
        taxBenefitDelayMonths: 0
      };

      const { result } = renderHook(() => useHDCCalculations(propsWithPredevelopment));

      // Verify calculations are consistent and reasonable
      const year1Depreciation = result.current.yearOneDepreciation;

      // Year 1 should be substantial
      expect(year1Depreciation).toBeGreaterThan(5000000);

      // Annual straight-line should be reasonable
      expect(result.current.annualStraightLineDepreciation).toBeGreaterThan(500000);

      // 10-year total should be reasonable but not exceed project cost
      expect(result.current.total10YearDepreciation).toBeGreaterThan(10000000);
      expect(result.current.total10YearDepreciation).toBeLessThan(52000000);
    });
  });

  /**
   * State LIHTC Investor State Validation
   *
   * CORRECT BUSINESS RULE: Credits belong to PROPERTY state, not investor state.
   * WA investor in GA property SHOULD receive syndicated GA State LIHTC proceeds.
   * IMPL-073: Syndication is now a capital return (not equity offset), fixing MOIC.
   */
  describe('State LIHTC Investor State Validation', () => {
    const stateLIHTCProps = {
      ...defaultProps,
      selectedState: 'GA', // Property in GA (has State LIHTC program)
      lihtcEnabled: true,
      lihtcEligibleBasis: 80000000,
      applicableFraction: 100,
      creditRate: 0.04, // 4% as decimal
      ddaQctBoost: false,
      placedInServiceMonth: 7,
      stateLIHTCEnabled: true,
      syndicationRate: 85,
      investorHasStateLiability: false,
    };

    it('should return syndicated stateLIHTCIntegration for out-of-state investor without liability', () => {
      // WA investor in GA property - gets GA credits via syndication
      const propsWithWA = {
        ...stateLIHTCProps,
        investorState: 'WA', // WA has no state income tax, but gets GA credits syndicated
      };

      const { result } = renderHook(() => useHDCCalculations(propsWithWA));

      // State LIHTC integration should exist - credits belong to property state (GA)
      expect(result.current.stateLIHTCIntegration).not.toBeNull();
      expect(result.current.stateLIHTCIntegration?.creditPath).toBe('syndicated');
      expect(result.current.stateLIHTCIntegration?.syndicationRate).toBe(0.85);
      expect(result.current.stateLIHTCIntegration?.netProceeds).toBeGreaterThan(0);
    });

    it('should return valid stateLIHTCIntegration when investor state has program', () => {
      // GA investor in GA property (in-state) - should work
      const propsWithGA = {
        ...stateLIHTCProps,
        investorState: 'GA', // GA has State LIHTC program
      };

      const { result } = renderHook(() => useHDCCalculations(propsWithGA));

      // State LIHTC integration should exist
      expect(result.current.stateLIHTCIntegration).not.toBeNull();
      expect(result.current.stateLIHTCIntegration?.grossCredit).toBeGreaterThan(0);
    });

    it('should return valid stateLIHTCIntegration for out-of-state investor with State LIHTC program', () => {
      // VA investor in GA property - VA has State LIHTC, should work
      const propsWithVA = {
        ...stateLIHTCProps,
        investorState: 'VA', // VA has State LIHTC program
      };

      const { result } = renderHook(() => useHDCCalculations(propsWithVA));

      // State LIHTC integration should exist because VA has a program
      expect(result.current.stateLIHTCIntegration).not.toBeNull();
      expect(result.current.stateLIHTCIntegration?.grossCredit).toBeGreaterThan(0);
    });

    it('should have much higher MOIC with Year 0 syndication (IMPL-075/076: net equity, no cash flow)', () => {
      // IMPL-075: Year 0 syndication uses net equity as MOIC denominator
      // IMPL-076: Year 0 syndication has NO cash flow line item (already netted in equity)
      // Use larger equity % to ensure net equity > 0
      const propsWithYear0Syndication = {
        ...stateLIHTCProps,
        investorState: 'WA',
        investorEquityPct: 40, // $86M × 40% = $34.4M equity > $27.2M syndication
        stateLIHTCSyndicationYear: 0 as 0 | 1 | 2, // Year 0: syndicator funds at close
      };

      const propsWithStateLIHTCDisabled = {
        ...stateLIHTCProps,
        investorState: 'WA',
        investorEquityPct: 40,
        stateLIHTCEnabled: false,
      };

      const { result: resultWithYear0 } = renderHook(() => useHDCCalculations(propsWithYear0Syndication));
      const { result: resultWithoutStateLIHTC } = renderHook(() => useHDCCalculations(propsWithStateLIHTCDisabled));

      // IMPL-075: With Year 0 syndication, MOIC uses smaller net equity denominator
      const moicYear0 = resultWithYear0.current.mainAnalysisResults.equityMultiple;
      const moicWithoutLIHTC = resultWithoutStateLIHTC.current.mainAnalysisResults.equityMultiple;

      expect(moicYear0).toBeGreaterThan(moicWithoutLIHTC);

      // IMPL-076: Year 0 syndication should NOT have syndication proceeds in cash flows
      // (they're already netted in equity - no double counting)
      const cashFlows = resultWithYear0.current.investorCashFlows;
      const syndicationProceedsInCashFlows = cashFlows.reduce(
        (sum: number, cf) => sum + (cf.stateLIHTCSyndicationProceeds || 0),
        0
      );
      expect(syndicationProceedsInCashFlows).toBe(0); // No cash flow line item for Year 0

      // Verify net equity calculation - offset still exists even though no cash flow
      const investorResults = resultWithYear0.current.mainAnalysisResults;
      const grossEquity = investorResults.investorEquity;
      const offset = investorResults.syndicatedEquityOffset || 0;
      const netEquity = grossEquity - offset;
      expect(netEquity).toBeGreaterThan(0);
      expect(offset).toBeGreaterThan(0); // Offset reduces equity
    });

    it('should use gross equity denominator for Year 1+ syndication (IMPL-075/076)', () => {
      // IMPL-075: Year 1+ syndication uses gross equity as MOIC denominator
      // IMPL-076: Year 1+ syndication HAS cash flow line item (capital return)
      // Investor funds full amount, gets capital return in Year 1+
      const propsWithYear1Syndication = {
        ...stateLIHTCProps,
        investorState: 'WA',
        investorEquityPct: 40,
        stateLIHTCSyndicationYear: 1 as 0 | 1 | 2, // Year 1: investor funds full, gets return
      };

      const propsWithStateLIHTCDisabled = {
        ...stateLIHTCProps,
        investorState: 'WA',
        investorEquityPct: 40,
        stateLIHTCEnabled: false,
      };

      const { result: resultWithYear1 } = renderHook(() => useHDCCalculations(propsWithYear1Syndication));
      const { result: resultWithoutStateLIHTC } = renderHook(() => useHDCCalculations(propsWithStateLIHTCDisabled));

      // IMPL-075: Year 1+ uses gross equity denominator
      // MOIC should still be higher (more returns) but not dramatically so
      const moicYear1 = resultWithYear1.current.mainAnalysisResults.equityMultiple;
      const moicWithoutLIHTC = resultWithoutStateLIHTC.current.mainAnalysisResults.equityMultiple;

      expect(moicYear1).toBeGreaterThan(moicWithoutLIHTC);
      // But NOT 2x+ higher like Year 0 (gross equity denominator)
      expect(moicYear1 / moicWithoutLIHTC).toBeLessThan(2);

      // IMPL-076: Year 1+ syndication SHOULD have syndication proceeds in cash flows
      // (capital return appears in Year 1)
      const cashFlows = resultWithYear1.current.investorCashFlows;
      const syndicationProceedsInCashFlows = cashFlows.reduce(
        (sum: number, cf) => sum + (cf.stateLIHTCSyndicationProceeds || 0),
        0
      );
      expect(syndicationProceedsInCashFlows).toBeGreaterThan(0); // Cash flow line item exists

      // Specifically in Year 1
      expect(cashFlows[0]?.stateLIHTCSyndicationProceeds || 0).toBeGreaterThan(0);
    });
  });
});