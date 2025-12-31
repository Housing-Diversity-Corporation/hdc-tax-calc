
import { create } from 'zustand';
import { PropertyPreset } from '../utils/taxbenefits/propertyPresets';

type HDCCalcState = {
  selectedPreset: PropertyPreset | null;
  setSelectedPreset: (preset: PropertyPreset) => void;
};

export const useHDCCalcStore = create<HDCCalcState>((set) => ({
  selectedPreset: null,
  setSelectedPreset: (preset) => {
    console.log('🏢 Property Selected:', {
      name: preset.name,
      category: preset.category,
      projectCost: preset.values.projectCost,
      investorEquityPct: preset.values.investorEquityPct,
      yearOneNOI: preset.values.yearOneNOI,
      federalTaxRate: preset.values.federalTaxRate,
      selectedState: preset.values.selectedState,
    });
    set({ selectedPreset: preset });
  },
}));
