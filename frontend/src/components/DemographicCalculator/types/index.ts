export interface PolicyDriver {
  id: string;
  name: string;
  icon?: string;
  enabled: boolean;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  calculateCost: (value: number, baseRent: number) => { capital: number; operating: number };
}

export interface DemographicImpact {
  total: number;
  canAffordBase: number;
  canAffordRequired: number;
  excluded: number;
  shareOfTotal: number;
  shareOfExcluded: number;
  disparityRatio: number;
}

export type GroupDist = Record<string, number[]>;

export interface AffordabilityMetrics {
  totalHouseholds: number;
  baseAffordable: number;
  requiredAffordable: number;
  excluded: number;
  excludedPct: number;
}

export interface LocationFormData {
  zip: string;
  stateFips: string;
  baseMethod: 'SAFMR' | 'Manual';
  manualBaseRent: number;
}

export interface CostAssumptions {
  parkingCostPerSpace: number;
  parkingOperatingCost: number;
  constructionCostPerSF: number;
  sfOperatingCost: number;
  openSpaceCapitalCost: number;
  openSpaceOperatingCost: number;
  designMaterialsCost: number;
}

export interface FinanceTerms {
  rate: number;
  termYears: number;
}