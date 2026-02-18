/**
 * useInvestorSizing Hook (IMPL-104)
 *
 * Memoized + debounced hook wrapping computeOptimalSizing().
 * Debounces currentCommitment changes by 100ms to avoid excessive
 * engine runs during slider interaction.
 *
 * No calculation logic — delegates entirely to the engine.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import type { BenefitStream, InvestorProfile } from '../utils/taxbenefits/investorTaxUtilization';
import type { SizingResult } from '../utils/taxbenefits/investorSizing';
import { computeOptimalSizing } from '../utils/taxbenefits/investorSizing';

export function useInvestorSizing(
  poolBenefitStream: BenefitStream | null,
  investorProfile: InvestorProfile | null,
  dealTotalEquity: number,
  currentCommitment: number
): SizingResult | null {
  // Debounce the commitment value
  const [debouncedCommitment, setDebouncedCommitment] = useState(currentCommitment);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedCommitment(currentCommitment);
    }, 100);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentCommitment]);

  return useMemo(() => {
    if (!poolBenefitStream || !investorProfile || dealTotalEquity <= 0) return null;
    return computeOptimalSizing(poolBenefitStream, investorProfile, dealTotalEquity);
    // debouncedCommitment is included in deps to retrigger when slider stabilizes,
    // even though computeOptimalSizing doesn't take it directly — the parent
    // component may use it for point lookups on the returned curve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolBenefitStream, investorProfile, dealTotalEquity, debouncedCommitment]);
}
