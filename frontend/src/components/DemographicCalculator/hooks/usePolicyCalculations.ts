import { useMemo } from 'react';
import type { PolicyDriver } from '../types';

export const usePolicyCalculations = (
  baseRent: number,
  policyDrivers: PolicyDriver[],
  financeRate: number,
  financeTerm: number
) => {
  const requiredRent = useMemo(() => {
    if (!baseRent) return 0;
    
    let totalCapital = 0;
    let totalOperating = 0;
    
    policyDrivers.forEach(driver => {
      if (driver.enabled) {
        const costs = driver.calculateCost(driver.value, baseRent);
        totalCapital += costs.capital;
        totalOperating += costs.operating;
      }
    });
    
    // Amortize capital costs over loan term
    const monthlyRate = financeRate / 12;
    const numPayments = financeTerm * 12;
    const amortizedCapital = totalCapital * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                             (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return baseRent + amortizedCapital + totalOperating;
  }, [baseRent, policyDrivers, financeRate, financeTerm]);

  const incomeNeeded = useMemo(() => {
    // Assuming 30% of income goes to rent
    return (requiredRent * 12) / 0.30;
  }, [requiredRent]);

  return {
    requiredRent,
    incomeNeeded
  };
};