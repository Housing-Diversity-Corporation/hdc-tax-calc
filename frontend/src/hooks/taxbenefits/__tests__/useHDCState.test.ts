import { renderHook, act, waitFor } from '@testing-library/react';
import { useHDCState } from '../useHDCState';
import { DEFAULT_VALUES, CONFORMING_STATES } from '../../../utils/taxbenefits';

describe('useHDCState Hook - State Management Tests', () => {

  describe('Initial State Values', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useHDCState());

      expect(result.current.projectCost).toBe(DEFAULT_VALUES.PROJECT_COST);
      expect(result.current.yearOneNOI).toBe(DEFAULT_VALUES.YEAR_ONE_NOI);
      // Auto-balance is on by default, so equity gets balanced to remaining after debt
      // Total debt = 66 + 20 + 2 + 2.5 = 90.5%, leaving 9.5% for equity
      // Wait for the useEffect auto-balance to complete (uses setTimeout)
      await waitFor(() => {
        expect(result.current.investorEquityPct).toBe(9.5);
      });
      // Default state is now WA (no state income tax)
      expect(result.current.selectedState).toBe('WA');
      expect(result.current.autoBalanceCapital).toBe(true);
    });

    it('should have all required state setters', () => {
      const { result } = renderHook(() => useHDCState());
      
      expect(typeof result.current.setProjectCost).toBe('function');
      expect(typeof result.current.setYearOneNOI).toBe('function');
      expect(typeof result.current.setInvestorEquityPct).toBe('function');
      expect(typeof result.current.handleStateChange).toBe('function');
    });
  });

  describe('State Selection and Tax Rate Management', () => {
    it('should update state capital gains rate when changing states', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.handleStateChange('CA');
      });
      expect(result.current.selectedState).toBe('CA');
      
      act(() => {
        result.current.handleStateChange('NY');
      });
      expect(result.current.selectedState).toBe('NY');
      expect(result.current.stateCapitalGainsRate).toBe(CONFORMING_STATES['NY'].rate);
    });

    it('should set rate to 0 for NONE state', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.handleStateChange('NONE');
      });
      
      expect(result.current.selectedState).toBe('NONE');
      expect(result.current.stateCapitalGainsRate).toBe(0);
    });

    it('should maintain current rate for CUSTOM state', () => {
      const { result } = renderHook(() => useHDCState());
      const initialRate = result.current.stateCapitalGainsRate;
      
      act(() => {
        result.current.handleStateChange('CUSTOM');
      });
      
      expect(result.current.selectedState).toBe('CUSTOM');
      expect(result.current.stateCapitalGainsRate).toBe(initialRate);
    });
  });

  describe('Auto-Balance Capital Structure', () => {
    it('should auto-balance equity when debt changes', async () => {
      const { result } = renderHook(() => useHDCState());

      act(() => {
        result.current.setSeniorDebtPct(70);
        result.current.setPhilDebtPct(10);
        result.current.setHdcSubDebtPct(0);
        result.current.setInvestorSubDebtPct(0);
        result.current.setInvestorEquityRatio(60);
      });

      const totalDebt = 70 + 10 + 0 + 0;
      const remainingForEquity = 100 - totalDebt;
      const expectedInvestorEquity = remainingForEquity * 0.6;
      const expectedPhilanthropicEquity = remainingForEquity * 0.4;

      // Wait for the useEffect auto-balance to complete (uses setTimeout)
      await waitFor(() => {
        expect(Math.abs(result.current.investorEquityPct - expectedInvestorEquity)).toBeLessThan(1);
        expect(Math.abs(result.current.philanthropicEquityPct - expectedPhilanthropicEquity)).toBeLessThan(1);
      });
    });

    it('should not auto-balance when disabled', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setAutoBalanceCapital(false);
        result.current.setInvestorEquityPct(15);
        result.current.setPhilanthropicEquityPct(10);
      });
      
      const initialInvestorEquity = result.current.investorEquityPct;
      const initialPhilanthropicEquity = result.current.philanthropicEquityPct;
      
      act(() => {
        result.current.setSeniorDebtPct(70);
      });
      
      expect(result.current.investorEquityPct).toBe(initialInvestorEquity);
      expect(result.current.philanthropicEquityPct).toBe(initialPhilanthropicEquity);
    });

    it('should handle edge case with 100% debt', async () => {
      const { result } = renderHook(() => useHDCState());

      act(() => {
        result.current.setSeniorDebtPct(80);
        result.current.setPhilDebtPct(20);
        result.current.setHdcSubDebtPct(0);
        result.current.setInvestorSubDebtPct(0);
      });

      // With 100% debt, equity should be 0
      // Wait for the useEffect auto-balance to complete (uses setTimeout)
      await waitFor(() => {
        expect(result.current.investorEquityPct + result.current.philanthropicEquityPct).toBeCloseTo(0, 1);
      });
    });

    it('should handle invalid investor equity ratio', () => {
      const { result } = renderHook(() => useHDCState());
      
      const initialInvestorEquity = result.current.investorEquityPct;
      const initialPhilanthropicEquity = result.current.philanthropicEquityPct;
      
      act(() => {
        result.current.setInvestorEquityRatio(-10);
      });
      
      // Should not update with invalid ratio
      expect(result.current.investorEquityPct).toBe(initialInvestorEquity);
      expect(result.current.philanthropicEquityPct).toBe(initialPhilanthropicEquity);
      
      act(() => {
        result.current.setInvestorEquityRatio(150);
      });
      
      // Should not update with ratio > 100
      expect(result.current.investorEquityPct).toBe(initialInvestorEquity);
      expect(result.current.philanthropicEquityPct).toBe(initialPhilanthropicEquity);
    });
  });

  describe('Total Capital Structure Calculation', () => {
    it('should calculate total capital structure correctly', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setInvestorEquityPct(15);
        result.current.setPhilanthropicEquityPct(5);
        result.current.setSeniorDebtPct(60);
        result.current.setPhilDebtPct(15);
        result.current.setHdcSubDebtPct(3);
        result.current.setInvestorSubDebtPct(2);
      });
      
      expect(result.current.totalCapitalStructure).toBe(100);
    });

    it('should allow over 100% capital structure when auto-balance is off', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setAutoBalanceCapital(false);
        result.current.setInvestorEquityPct(30);
        result.current.setPhilanthropicEquityPct(20);
        result.current.setSeniorDebtPct(60);
        result.current.setPhilDebtPct(10);
        result.current.setHdcSubDebtPct(0);
        result.current.setInvestorSubDebtPct(0);
      });
      
      expect(result.current.totalCapitalStructure).toBe(120);
    });
  });

  describe('PIK and Current Pay Settings', () => {
    it('should handle HDC PIK settings', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setPikCurrentPayEnabled(true);
        result.current.setPikCurrentPayPct(75);
      });
      
      expect(result.current.pikCurrentPayEnabled).toBe(true);
      expect(result.current.pikCurrentPayPct).toBe(75);
    });

    it('should handle investor PIK settings independently', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setInvestorPikCurrentPayEnabled(true);
        result.current.setInvestorPikCurrentPayPct(40);
        result.current.setPikCurrentPayEnabled(false);
      });
      
      expect(result.current.investorPikCurrentPayEnabled).toBe(true);
      expect(result.current.investorPikCurrentPayPct).toBe(40);
      expect(result.current.pikCurrentPayEnabled).toBe(false);
    });
  });

  describe('Debt Settings Management', () => {
    it('should update senior debt parameters', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setSeniorDebtAmortization(40);
        result.current.setSeniorDebtRate(6.5);
      });
      
      expect(result.current.seniorDebtAmortization).toBe(40);
      expect(result.current.seniorDebtRate).toBe(6.5);
    });

    it('should update philanthropic debt parameters', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setPhilDebtAmortization(50);
        result.current.setPhilDebtRate(2);
        result.current.setPhilCurrentPayEnabled(true);
        result.current.setPhilCurrentPayPct(30);
      });
      
      expect(result.current.philDebtAmortization).toBe(50);
      expect(result.current.philDebtRate).toBe(2);
      expect(result.current.philCurrentPayEnabled).toBe(true);
      expect(result.current.philCurrentPayPct).toBe(30);
    });
  });

  describe('Fee Settings', () => {
    it('should handle AUM fee settings', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setAumFeeEnabled(true);
        result.current.setAumFeeRate(2.5);
      });
      
      expect(result.current.aumFeeEnabled).toBe(true);
      expect(result.current.aumFeeRate).toBe(2.5);
    });

    it('should handle HDC fee rate changes', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setHdcFeeRate(15);
      });
      
      expect(result.current.hdcFeeRate).toBe(15);
    });
  });

  describe('Advance Financing Settings', () => {
    it('should handle advance financing toggle', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setHdcAdvanceFinancing(true);
        result.current.setTaxAdvanceDiscountRate(25);
        result.current.setAdvanceFinancingRate(10);
        result.current.setTaxDeliveryMonths(18);
      });
      
      expect(result.current.hdcAdvanceFinancing).toBe(true);
      expect(result.current.taxAdvanceDiscountRate).toBe(25);
      expect(result.current.advanceFinancingRate).toBe(10);
      expect(result.current.taxDeliveryMonths).toBe(18);
    });
  });

  describe('Expandable Sections State', () => {
    it('should manage expandable section states', () => {
      const { result } = renderHook(() => useHDCState());
      
      expect(result.current.taxCalculationExpanded).toBe(true);
      expect(result.current.taxOffsetExpanded).toBe(true);
      expect(result.current.depreciationScheduleExpanded).toBe(true);
      
      act(() => {
        result.current.setTaxCalculationExpanded(false);
        result.current.setTaxOffsetExpanded(false);
      });
      
      expect(result.current.taxCalculationExpanded).toBe(false);
      expect(result.current.taxOffsetExpanded).toBe(false);
      expect(result.current.depreciationScheduleExpanded).toBe(true);
    });
  });

  describe('Validation Framework', () => {
    it('should manage validation settings', () => {
      const { result } = renderHook(() => useHDCState());
      
      expect(result.current.validationEnabled).toBe(true);
      
      act(() => {
        result.current.setValidationEnabled(false);
        result.current.setShowValidationDetails(true);
        result.current.setValidationResults({ 
          isValid: false, 
          errors: ['Test error'], 
          warnings: ['Test warning'] 
        });
      });
      
      expect(result.current.validationEnabled).toBe(false);
      expect(result.current.showValidationDetails).toBe(true);
      expect(result.current.validationResults).toEqual({ 
        isValid: false, 
        errors: ['Test error'], 
        warnings: ['Test warning'] 
      });
    });
  });


  describe('Complex State Interactions', () => {
    it('should handle multiple simultaneous state changes', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        // Disable auto-balance to test direct setting of equity
        result.current.setAutoBalanceCapital(false);
        result.current.setProjectCost(100000000);
        result.current.setYearOneNOI(6000000);
        result.current.setInvestorEquityPct(20);
        result.current.setSeniorDebtPct(65);
        result.current.setHdcSubDebtPct(5);
        result.current.setPikCurrentPayEnabled(true);
        result.current.setAumFeeEnabled(true);
      });
      
      expect(result.current.projectCost).toBe(100000000);
      expect(result.current.yearOneNOI).toBe(6000000);
      expect(result.current.investorEquityPct).toBe(20);
      expect(result.current.seniorDebtPct).toBe(65);
      expect(result.current.hdcSubDebtPct).toBe(5);
      expect(result.current.pikCurrentPayEnabled).toBe(true);
      expect(result.current.aumFeeEnabled).toBe(true);
    });

    it('should maintain state consistency during rapid updates', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        // Disable auto-balance to test direct setting of equity
        result.current.setAutoBalanceCapital(false);
      });
      
      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.setProjectCost(50000000 + i * 1000000);
          result.current.setYearOneNOI(3000000 + i * 100000);
          result.current.setInvestorEquityPct(10 + i);
        });
      }
      
      // Final values should be from last iteration
      expect(result.current.projectCost).toBe(59000000);
      expect(result.current.yearOneNOI).toBe(3900000);
      expect(result.current.investorEquityPct).toBe(19);
    });
  });

  describe('State Reset and Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        // Disable auto-balance to test direct setting of values to 0
        result.current.setAutoBalanceCapital(false);
        result.current.setProjectCost(0);
        result.current.setYearOneNOI(0);
        result.current.setInvestorEquityPct(0);
        result.current.setSeniorDebtPct(0);
      });
      
      expect(result.current.projectCost).toBe(0);
      expect(result.current.yearOneNOI).toBe(0);
      expect(result.current.investorEquityPct).toBe(0);
      expect(result.current.seniorDebtPct).toBe(0);
    });

    it('should handle negative values appropriately', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setYearOneNOI(-1000000);
        result.current.setRevenueGrowth(-5);
        result.current.setExpenseGrowth(-3);
      });
      
      expect(result.current.yearOneNOI).toBe(-1000000);
      expect(result.current.revenueGrowth).toBe(-5);
      expect(result.current.expenseGrowth).toBe(-3);
    });

    it('should handle very large values', () => {
      const { result } = renderHook(() => useHDCState());
      
      act(() => {
        result.current.setProjectCost(Number.MAX_SAFE_INTEGER);
        result.current.setYearOneNOI(Number.MAX_SAFE_INTEGER / 10);
      });
      
      expect(result.current.projectCost).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.current.yearOneNOI).toBe(Number.MAX_SAFE_INTEGER / 10);
    });
  });
});