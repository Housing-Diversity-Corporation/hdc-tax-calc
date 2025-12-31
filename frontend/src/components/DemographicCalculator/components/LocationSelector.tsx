import React from 'react';
import type { LocationFormData, FinanceTerms } from '../types';

interface LocationSelectorProps {
  formData: LocationFormData;
  financeTerms: FinanceTerms;
  loading: boolean;
  onFormChange: (updates: Partial<LocationFormData>) => void;
  onFinanceChange: (updates: Partial<FinanceTerms>) => void;
  onSubmit: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  formData,
  financeTerms,
  loading,
  onFormChange,
  onFinanceChange,
  onSubmit
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--hdc-faded-jade)' }}>
        Location & Baseline
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">ZIP Code</label>
          <input 
            value={formData.zip} 
            onChange={e => onFormChange({ zip: e.target.value })} 
            className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
            placeholder="e.g., 94102"
          />
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">State</label>
          <select 
            value={formData.stateFips} 
            onChange={e => onFormChange({ stateFips: e.target.value })} 
            className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="06">California</option>
            <option value="53">Washington</option>
          </select>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Baseline Method</label>
          <select 
            value={formData.baseMethod} 
            onChange={e => onFormChange({ baseMethod: e.target.value as 'SAFMR' | 'Manual' })} 
            className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="SAFMR">HUD Fair Market Rent</option>
            <option value="Manual">Manual Entry</option>
          </select>
        </div>
        
        {formData.baseMethod === 'Manual' && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Base Rent ($/mo)</label>
            <input 
              type="number" 
              value={formData.manualBaseRent} 
              onChange={e => onFormChange({ manualBaseRent: Number(e.target.value) })} 
              className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
              placeholder="2000"
            />
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Financing Assumptions</h3>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-600">Interest Rate (%)</label>
              <input 
                type="number" 
                value={financeTerms.rate * 100} 
                onChange={e => onFinanceChange({ rate: Number(e.target.value) / 100 })} 
                className="border border-gray-300 px-2 py-1 w-full rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                step="0.25"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-600">Loan Term (years)</label>
              <input 
                type="number" 
                value={financeTerms.termYears} 
                onChange={e => onFinanceChange({ termYears: Number(e.target.value) })} 
                className="border border-gray-300 px-2 py-1 w-full rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={onSubmit} 
          disabled={loading}
          className="w-full px-4 py-3 rounded-md font-medium text-white transition-colors mt-4"
          style={{
            backgroundColor: loading ? '#9CA3AF' : 'var(--hdc-faded-jade)',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Calculating...' : 'Calculate Impact'}
        </button>
      </div>
    </div>
  );
};