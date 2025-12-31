export interface PropertyPreset {
  id: string;
  name: string;
  category: string;
  description?: string;
  values: {
    // Project Fundamentals
    projectCost: number;
    landValue: number;
    yearOneNOI: number;
    yearOneDepreciationPct: number;
    revenueGrowth: number;
    opexRatio: number;
    exitCapRate: number;
    
    // Capital Structure
    investorEquityPct: number;
    philanthropicEquityPct: number;
    seniorDebtPct: number;
    seniorDebtRate: number;
    seniorDebtAmortization: number;
    philDebtPct: number;
    philDebtRate: number;
    philDebtAmortization: number;
    hdcSubDebtPct: number;
    hdcSubDebtPikRate: number;
    investorSubDebtPct: number;
    investorSubDebtPikRate: number;
    outsideInvestorSubDebtPct: number;
    outsideInvestorSubDebtPikRate: number;

    // Tax Parameters
    federalTaxRate: number;
    selectedState: string;
    stateCapitalGainsRate: number;
    ltCapitalGainsRate: number;
    niitRate: number;
    depreciationRecaptureRate: number;
    deferredGains: number;
    
    // HDC Fees
    hdcFeeRate: number;
    aumFeeEnabled: boolean;
    aumFeeRate: number;
    
    // Exit & Promote
    investorPromoteShare: number;
  };
}

export const PROPERTY_PRESETS: PropertyPreset[] = [
  // Specific Properties
  {
    id: 'default-standard',
    name: 'New Default',
    category: 'Standard Templates',
    description: 'Standard baseline configuration',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 10,
      philanthropicEquityPct: 0,
      seniorDebtPct: 66,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: '7324-mlk',
    name: '7324 MLK',
    category: 'Specific Properties',
    description: 'MLK Boulevard development',
    values: {
      projectCost: 87,
      landValue: 5.725,
      yearOneNOI: 5.113,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 14,
      philanthropicEquityPct: 0,
      seniorDebtPct: 66,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 2,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 2.5,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: '4001-willow',
    name: '4001 Willow PRE-TCO',
    category: 'Specific Properties',
    description: 'Willow Street affordable housing - Pre-TCO',
    values: {
      projectCost: 67,
      landValue: 3.514,
      yearOneNOI: 3.417,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 4,
      philanthropicEquityPct: 0,
      seniorDebtPct: 67,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 29,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: '16-plex-bg',
    name: '16 16-plex BG DEVELOPMENT',
    category: 'Specific Properties',
    description: 'Bundle of 16-plex buildings - Development',
    values: {
      projectCost: 102.7,
      landValue: 9.8,
      yearOneNOI: 4.718,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 5,
      philanthropicEquityPct: 6,
      seniorDebtPct: 63,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 25,
      philDebtRate: 0,
      philDebtAmortization: 60,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  
  // Property Types
  {
    id: 'multifamily-core',
    name: 'Multifamily - Core',
    category: 'Property Types',
    description: 'Stable NOI with modest growth',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 6.0,
      yearOneDepreciationPct: 25,
      revenueGrowth: 2.5,
      opexRatio: 30,
      exitCapRate: 5.5,
      investorEquityPct: 15,
      philanthropicEquityPct: 0,
      seniorDebtPct: 65,
      seniorDebtRate: 4.75,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 3.5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: 'multifamily-value-add',
    name: 'Multifamily - Value-Add',
    category: 'Property Types',
    description: 'Lower initial NOI, higher growth potential',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 4.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 5,
      opexRatio: 35,
      exitCapRate: 6.5,
      investorEquityPct: 20,
      philanthropicEquityPct: 0,
      seniorDebtPct: 60,
      seniorDebtRate: 5.5,
      seniorDebtAmortization: 30,
      philDebtPct: 15,
      philDebtRate: 4.5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 5,
      hdcSubDebtPikRate: 10,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 40,
    }
  },
  {
    id: 'mixed-use-development',
    name: 'Mixed-Use Development',
    category: 'Property Types',
    description: 'Higher risk/return profile',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.0,
      yearOneDepreciationPct: 25,
      revenueGrowth: 4,
      opexRatio: 32,
      exitCapRate: 6.75,
      investorEquityPct: 25,
      philanthropicEquityPct: 5,
      seniorDebtPct: 55,
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philDebtPct: 10,
      philDebtRate: 4.5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 5,
      hdcSubDebtPikRate: 12,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 45,
    }
  },
  
  // Market Conditions
  {
    id: 'rising-rate-environment',
    name: 'Rising Rate Environment',
    category: 'Market Conditions',
    description: 'Higher debt rates across the board',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 7,
      investorEquityPct: 20,
      philanthropicEquityPct: 0,
      seniorDebtPct: 60,
      seniorDebtRate: 7.5,
      seniorDebtAmortization: 30,
      philDebtPct: 20,
      philDebtRate: 5.5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 10,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 10,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: 'recession-scenario',
    name: 'Recession Scenario',
    category: 'Market Conditions',
    description: 'Lower growth, higher cap rates',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.0,
      yearOneDepreciationPct: 25,
      revenueGrowth: 1,
      opexRatio: 30,
      exitCapRate: 8,
      investorEquityPct: 25,
      philanthropicEquityPct: 0,
      seniorDebtPct: 55,
      seniorDebtRate: 4,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 3,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 7,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 7,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 30,
    }
  },
  {
    id: 'inflation-scenario',
    name: 'Inflation Scenario',
    category: 'Market Conditions',
    description: 'Higher growth rates across the board',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 5,
      opexRatio: 28,
      exitCapRate: 6.5,
      investorEquityPct: 15,
      philanthropicEquityPct: 0,
      seniorDebtPct: 65,
      seniorDebtRate: 6.5,
      seniorDebtAmortization: 30,
      philDebtPct: 20,
      philDebtRate: 5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 9,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 9,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 40,
    }
  },
  
  // Leverage Profiles
  {
    id: 'conservative-leverage',
    name: 'Conservative',
    category: 'Leverage Profiles',
    description: 'Lower debt, higher equity',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 30,
      philanthropicEquityPct: 5,
      seniorDebtPct: 50,
      seniorDebtRate: 4.5,
      seniorDebtAmortization: 35,
      philDebtPct: 15,
      philDebtRate: 3.5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 30,
    }
  },
  {
    id: 'aggressive-tax-optimization',
    name: 'Aggressive Tax Optimization',
    category: 'Leverage Profiles',
    description: 'Maximum leverage for tax benefits',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 60,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 5,
      philanthropicEquityPct: 0,
      seniorDebtPct: 70,
      seniorDebtRate: 5.5,
      seniorDebtAmortization: 30,
      philDebtPct: 15,
      philDebtRate: 4.5,
      philDebtAmortization: 30,
      hdcSubDebtPct: 5,
      hdcSubDebtPikRate: 10,
      investorSubDebtPct: 5,
      investorSubDebtPikRate: 10,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 50,
    }
  },
  {
    id: 'balanced-leverage',
    name: 'Balanced',
    category: 'Leverage Profiles',
    description: 'Moderate leverage',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 15,
      philanthropicEquityPct: 0,
      seniorDebtPct: 65,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'NY',
      stateCapitalGainsRate: 10.9,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  
  // Tax Environments
  {
    id: 'high-tax-state',
    name: 'High Tax State',
    category: 'Tax Environments',
    description: 'NY/CA equivalent tax rates',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 10,
      philanthropicEquityPct: 0,
      seniorDebtPct: 66,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'CA',
      stateCapitalGainsRate: 13.3,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: 'no-state-tax',
    name: 'No State Tax',
    category: 'Tax Environments',
    description: 'TX/FL equivalent (no state income tax)',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 10,
      philanthropicEquityPct: 0,
      seniorDebtPct: 66,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'TX',
      stateCapitalGainsRate: 0,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  },
  {
    id: 'moderate-tax-state',
    name: 'Moderate Tax State',
    category: 'Tax Environments',
    description: 'Average state tax burden',
    values: {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5.5,
      yearOneDepreciationPct: 25,
      revenueGrowth: 3,
      opexRatio: 25,
      exitCapRate: 6,
      investorEquityPct: 10,
      philanthropicEquityPct: 0,
      seniorDebtPct: 66,
      seniorDebtRate: 5,
      seniorDebtAmortization: 35,
      philDebtPct: 20,
      philDebtRate: 4,
      philDebtAmortization: 30,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      federalTaxRate: 37,
      selectedState: 'GA',
      stateCapitalGainsRate: 5.75,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      depreciationRecaptureRate: 25,
      deferredGains: 10,
      hdcFeeRate: 0, // Fee removed per IMPL-7.0-014
      aumFeeEnabled: false,
      aumFeeRate: 1,
      investorPromoteShare: 35,
    }
  }
];

export const getPresetsByCategory = () => {
  const categories: { [key: string]: PropertyPreset[] } = {};
  PROPERTY_PRESETS.forEach(preset => {
    if (!categories[preset.category]) {
      categories[preset.category] = [];
    }
    categories[preset.category].push(preset);
  });
  return categories;
};

export const getCategoryOptions = () => {
  const categories = getPresetsByCategory();
  return Object.keys(categories).map(category => ({
    label: category,
    code: category,
    items: categories[category].map(preset => ({
      label: preset.name,
      code: preset.id,
      description: preset.description
    }))
  }));
};