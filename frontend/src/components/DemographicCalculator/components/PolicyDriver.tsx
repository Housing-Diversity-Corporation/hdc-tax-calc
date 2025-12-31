import React from 'react';
import type { PolicyDriver as PolicyDriverType } from '../types';

interface PolicyDriverProps {
  driver: PolicyDriverType;
  baseRent: number;
  financeRate: number;
  financeTerm: number;
  onUpdate: (id: string, updates: Partial<PolicyDriverType>) => void;
}

export const PolicyDriver: React.FC<PolicyDriverProps> = ({
  driver,
  baseRent,
  financeRate,
  financeTerm,
  onUpdate
}) => {
  const costs = driver.enabled ? driver.calculateCost(driver.value, baseRent) : { capital: 0, operating: 0 };
  const monthlyRate = financeRate / 12;
  const numPayments = financeTerm * 12;
  const monthlyCapital = costs.capital * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalMonthly = monthlyCapital + costs.operating;

  return (
    <div 
      className={`border rounded-lg p-4 transition-all ${
        driver.enabled ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <input
              type="checkbox"
              id={`policy-${driver.id}`}
              checked={driver.enabled}
              onChange={() => onUpdate(driver.id, { enabled: !driver.enabled })}
              className="text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
              style={{
                accentColor: 'var(--hdc-faded-jade)',
                width: '20px',
                height: '20px',
                transform: 'scale(1.25)',
                transformOrigin: 'left center',
                marginRight: '8px'
              }}
            />
          </div>
          <label htmlFor={`policy-${driver.id}`} className="flex-1 cursor-pointer">
            <div>
              <h3 className="font-semibold text-gray-900">
                {driver.icon && <span className="mr-2">{driver.icon}</span>}
                {driver.name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">{driver.description}</p>
          </label>
        </div>
        {driver.enabled && (
          <div className="text-right">
            <div className="text-lg font-bold text-red-600">+${totalMonthly.toFixed(0)}/mo</div>
            <div className="text-xs text-gray-500">
              {costs.capital > 0 && `$${(costs.capital / 1000).toFixed(0)}k capital`}
              {costs.capital > 0 && costs.operating > 0 && ' + '}
              {costs.operating > 0 && `$${costs.operating.toFixed(0)}/mo operating`}
            </div>
          </div>
        )}
      </div>
      
      {driver.enabled && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={driver.min}
              max={driver.max}
              step={driver.step}
              value={driver.value}
              onChange={e => onUpdate(driver.id, { value: Number(e.target.value) })}
              className="flex-1"
              style={{
                accentColor: 'var(--hdc-faded-jade)'
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={driver.min}
                max={driver.max}
                step={driver.step}
                value={driver.value}
                onChange={e => onUpdate(driver.id, { value: Number(e.target.value) })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">{driver.unit}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};