import React from 'react';
import type { CostAssumptions } from '../types';

interface CostAssumptionsPanelProps {
  assumptions: CostAssumptions;
  onChange: (updates: Partial<CostAssumptions>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const CostAssumptionsPanel: React.FC<CostAssumptionsPanelProps> = ({
  assumptions,
  onChange,
  isOpen,
  onToggle
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-gray-700">Cost Assumptions</h3>
        <button
          onClick={onToggle}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {isOpen ? '▼ Hide' : '▶ Show'}
        </button>
      </div>
      
      {isOpen && (
        <div className="space-y-4">
          {/* Parking Costs */}
          <div className="pb-3 border-b">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Parking</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-xs text-gray-600">Capital ($/space)</label>
                <input 
                  type="number" 
                  value={assumptions.parkingCostPerSpace} 
                  onChange={e => onChange({ parkingCostPerSpace: Number(e.target.value) })} 
                  className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                  step="5000"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-gray-600">Operating ($/mo)</label>
                <input 
                  type="number" 
                  value={assumptions.parkingOperatingCost} 
                  onChange={e => onChange({ parkingOperatingCost: Number(e.target.value) })} 
                  className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                  step="5"
                />
              </div>
            </div>
          </div>
          
          {/* Unit Size Costs */}
          <div className="pb-3 border-b">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Extra Square Footage</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-xs text-gray-600">Capital ($/sf)</label>
                <input 
                  type="number" 
                  value={assumptions.constructionCostPerSF} 
                  onChange={e => onChange({ constructionCostPerSF: Number(e.target.value) })} 
                  className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                  step="10"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-gray-600">Operating ($/sf/mo)</label>
                <input 
                  type="number" 
                  value={assumptions.sfOperatingCost} 
                  onChange={e => onChange({ sfOperatingCost: Number(e.target.value) })} 
                  className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                  step="0.10"
                />
              </div>
            </div>
          </div>
          
          {/* Open Space Costs */}
          <div className="pb-3 border-b">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Open Space (per % of lot)</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-xs text-gray-600">Opportunity Cost ($)</label>
                <input 
                  type="number" 
                  value={assumptions.openSpaceCapitalCost} 
                  onChange={e => onChange({ openSpaceCapitalCost: Number(e.target.value) })} 
                  className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                  step="1000"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs text-gray-600">Maintenance ($/mo)</label>
                <input 
                  type="number" 
                  value={assumptions.openSpaceOperatingCost} 
                  onChange={e => onChange({ openSpaceOperatingCost: Number(e.target.value) })} 
                  className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                  step="10"
                />
              </div>
            </div>
          </div>
          
          {/* Design Standards */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Design Standards</h4>
            <div>
              <label className="block mb-1 text-xs text-gray-600">Maintenance Factor</label>
              <input 
                type="number" 
                value={assumptions.designMaterialsCost} 
                onChange={e => onChange({ designMaterialsCost: Number(e.target.value) })} 
                className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                step="0.001"
              />
              <p className="text-xs text-gray-500 mt-1">Monthly maintenance as % of capital cost</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};