import { useMemo } from 'react';
import { ACS_RENTER_BINS } from '../../../lib/affordability';
import type { AffordabilityMetrics } from '../types';

export const useAffordabilityMetrics = (
  acsBins: number[] | null,
  baseRent: number,
  requiredRent: number
): AffordabilityMetrics | null => {
  return useMemo(() => {
    if (!acsBins) return null;
    
    const baseAffordable = acsBins.reduce((sum, count, idx) => {
      const [lo, hi] = ACS_RENTER_BINS[idx];
      const midIncome = hi ? (lo + hi) / 2 : lo;
      const maxAffordableRent = (midIncome * 0.30) / 12;
      if (maxAffordableRent >= baseRent) return sum + count;
      return sum;
    }, 0);
    
    const totalHouseholds = acsBins.reduce((a, b) => a + b, 0);
    const requiredAffordable = acsBins.reduce((sum, count, idx) => {
      const [lo, hi] = ACS_RENTER_BINS[idx];
      const midIncome = hi ? (lo + hi) / 2 : lo;
      const maxAffordableRent = (midIncome * 0.30) / 12;
      if (maxAffordableRent >= requiredRent) return sum + count;
      return sum;
    }, 0);
    
    const excluded = baseAffordable - requiredAffordable;
    const excludedPct = totalHouseholds > 0 ? (excluded / totalHouseholds) * 100 : 0;
    
    return {
      totalHouseholds,
      baseAffordable,
      requiredAffordable,
      excluded,
      excludedPct
    };
  }, [acsBins, baseRent, requiredRent]);
};