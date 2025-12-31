import { useMemo } from 'react';
import { ACS_RENTER_BINS } from '../../../lib/affordability';
import type { GroupDist, DemographicImpact } from '../types';

export const useDemographicImpact = (
  groupDists: GroupDist | null,
  baseRent: number,
  requiredRent: number
): Record<string, DemographicImpact> | null => {
  return useMemo(() => {
    if (!groupDists || !baseRent || !requiredRent) return null;
    
    const result: Record<string, DemographicImpact> = {};
    
    let grandTotal = 0;
    let totalExcluded = 0;
    
    for (const [group, distribution] of Object.entries(groupDists)) {
      let total = 0;
      let canAffordBase = 0;
      let canAffordRequired = 0;
      
      distribution.forEach((count, idx) => {
        const [lo, hi] = ACS_RENTER_BINS[idx];
        const midIncome = hi ? (lo + hi) / 2 : lo;
        const maxAffordableRent = (midIncome * 0.30) / 12;
        
        total += count;
        if (maxAffordableRent >= baseRent) canAffordBase += count;
        if (maxAffordableRent >= requiredRent) canAffordRequired += count;
      });
      
      const excluded = canAffordBase - canAffordRequired;
      grandTotal += total;
      totalExcluded += excluded;
      
      result[group] = {
        total,
        canAffordBase,
        canAffordRequired,
        excluded,
        shareOfTotal: 0,
        shareOfExcluded: 0,
        disparityRatio: 0
      };
    }
    
    // Calculate proportional metrics
    for (const data of Object.values(result)) {
      data.shareOfTotal = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;
      data.shareOfExcluded = totalExcluded > 0 ? (data.excluded / totalExcluded) * 100 : 0;
      data.disparityRatio = data.shareOfTotal > 0 ? data.shareOfExcluded / data.shareOfTotal : 0;
    }
    
    return result;
  }, [groupDists, baseRent, requiredRent]);
};