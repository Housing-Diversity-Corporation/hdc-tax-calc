import React from 'react';
import type { PolicyDriver, AffordabilityMetrics } from '../types';

interface CostBreakdownSummaryProps {
  baseRent: number;
  requiredRent: number;
  incomeNeeded: number;
  policyDrivers: PolicyDriver[];
  financeRate: number;
  financeTerm: number;
  affordabilityMetrics?: AffordabilityMetrics | null;
}

export const CostBreakdownSummary: React.FC<CostBreakdownSummaryProps> = ({
  baseRent,
  requiredRent,
  incomeNeeded,
  policyDrivers,
  financeRate,
  financeTerm,
  affordabilityMetrics
}) => {
  const enabledDrivers = policyDrivers.filter(d => d.enabled);

  const calculateMonthlyImpact = (driver: PolicyDriver) => {
    const costs = driver.calculateCost(driver.value, baseRent);
    const monthlyRate = financeRate / 12;
    const numPayments = financeTerm * 12;
    const monthlyCapital = costs.capital * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    return monthlyCapital + costs.operating;
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Base Apartment Rent</span>
        <span className="text-lg font-semibold">${baseRent.toFixed(0)}/mo</span>
      </div>
      
      {enabledDrivers.map(driver => {
        const totalMonthly = calculateMonthlyImpact(driver);
        
        return (
          <div key={driver.id} className="flex items-center justify-between text-sm py-1">
            <span className="text-gray-600">+ {driver.name}</span>
            <span className="font-medium text-red-600">+${totalMonthly.toFixed(0)}/mo</span>
          </div>
        );
      })}
      
      <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-gray-300">
        <span className="font-semibold text-gray-700">Total Required Rent</span>
        <span className="text-xl font-bold" style={{ 
          color: requiredRent > baseRent * 1.3 ? '#DC2626' : 'var(--hdc-faded-jade)' 
        }}>
          ${requiredRent.toFixed(0)}/mo
        </span>
      </div>
      
      {affordabilityMetrics && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Households Excluded</span>
            <span className="text-lg font-bold text-red-600">
              {affordabilityMetrics.excluded.toLocaleString()} ({affordabilityMetrics.excludedPct.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-500">Income Needed (30% burden)</span>
            <span className="font-medium">${incomeNeeded.toFixed(0)}/year</span>
          </div>
        </div>
      )}
    </div>
  );
};