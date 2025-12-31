import { ConformingStates } from '../../types/taxbenefits';

export const CONFORMING_STATES: ConformingStates = {  
  'NY': { name: 'New York', rate: 10.9, tier: 'Prime' },  
  'NJ': { name: 'New Jersey', rate: 10.75, tier: 'Prime' },  
  'DC': { name: 'District of Columbia', rate: 10.75, tier: 'Prime' },  
  'OR': { name: 'Oregon', rate: 9.9, tier: 'Prime' },  
  'MN': { name: 'Minnesota', rate: 9.85, tier: 'Prime' },  
  'VT': { name: 'Vermont', rate: 8.75, tier: 'Secondary' },  
  'WI': { name: 'Wisconsin', rate: 7.65, tier: 'Secondary' },  
  'ME': { name: 'Maine', rate: 7.15, tier: 'Secondary' },  
  'SC': { name: 'South Carolina', rate: 7.0, tier: 'Secondary' },  
  'CT': { name: 'Connecticut', rate: 6.99, tier: 'Secondary' },  
  'NE': { name: 'Nebraska', rate: 6.6, tier: 'Secondary' },  
  'WV': { name: 'West Virginia', rate: 6.5, tier: 'Secondary' }  
};

export const DEFAULT_VALUES = {
  PROJECT_COST: 86,
  LAND_VALUE: 10, // Default 10M land value
  YEAR_ONE_NOI: 5.113,
  YEAR_ONE_DEPRECIATION_PCT: 20, // Cost segregation percentage (updated to 20% per 2025 standards)
  HDC_FEE_RATE: 0, // Fee removed per IMPL-7.0-014
  FEDERAL_TAX_RATE: 37,
  DEFERRED_GAINS: 10,
  TAX_ADVANCE_DISCOUNT_RATE: 20,
  ADVANCE_FINANCING_RATE: 8,
  TAX_DELIVERY_MONTHS: 12,
  AUM_FEE_RATE: 1,
  LT_CAPITAL_GAINS_RATE: 20,
  NIIT_RATE: 3.8,
  STATE_CAPITAL_GAINS_RATE: 10.9,
  DEPRECIATION_RECAPTURE_RATE: 25,
  HOLD_PERIOD: 10,
  REVENUE_GROWTH: 3,
  EXPENSE_GROWTH: 3.0,
  OPEX_RATIO: 25,
  EXIT_CAP_RATE: 6,
  INVESTOR_EQUITY_PCT: 14,
  PHILANTHROPIC_EQUITY_PCT: 0,
  SENIOR_DEBT_PCT: 66,
  PHIL_DEBT_PCT: 20,
  HDC_SUB_DEBT_PCT: 2,
  HDC_SUB_DEBT_PIK_RATE: 8,
  INVESTOR_SUB_DEBT_PCT: 2.5,
  INVESTOR_SUB_DEBT_PIK_RATE: 8,
  INVESTOR_EQUITY_RATIO: 100,
  INVESTOR_PROMOTE_SHARE: 35,
  PIK_CURRENT_PAY_PCT: 50,
  INVESTOR_PIK_CURRENT_PAY_PCT: 50,
  SENIOR_DEBT_AMORTIZATION: 35,
  SENIOR_DEBT_RATE: 5,
  PHIL_DEBT_AMORTIZATION: 60,
  PHIL_DEBT_RATE: 0,
  PHIL_CURRENT_PAY_PCT: 50
};

export const AMORTIZATION_OPTIONS = [
  { value: 15, label: '15 Years' },
  { value: 20, label: '20 Years' },
  { value: 25, label: '25 Years' },
  { value: 30, label: '30 Years' },
  { value: 35, label: '35 Years' },
  { value: 40, label: '40 Years' },
  { value: 60, label: '60 Years' }
];

export const CAPITAL_GAINS_RATE_OPTIONS = [
  { value: 0, label: '0% (Low income)' },
  { value: 15, label: '15% (Middle income)' },
  { value: 20, label: '20% (High income)' }
];

export const FEDERAL_TAX_BRACKETS_2024 = [
  { value: 10, label: '10% ($0 - $11,600)', bracket: 'Low' },
  { value: 12, label: '12% ($11,600 - $47,150)', bracket: 'Lower-Middle' },
  { value: 22, label: '22% ($47,150 - $100,525)', bracket: 'Middle' },
  { value: 24, label: '24% ($100,525 - $191,950)', bracket: 'Upper-Middle' },
  { value: 32, label: '32% ($191,950 - $243,725)', bracket: 'High' },
  { value: 35, label: '35% ($243,725 - $609,350)', bracket: 'Very High' },
  { value: 37, label: '37% ($609,350+)', bracket: 'Highest' }
];

export const FEDERAL_CAPITAL_GAINS_BRACKETS_2024 = [
  { value: 0, label: '0% ($0 - $47,025)', bracket: 'Low' },
  { value: 15, label: '15% ($47,025 - $518,900)', bracket: 'Middle' },
  { value: 20, label: '20% ($518,900+)', bracket: 'High' }
];

// IMPL-017: OZ Version step-up rates
// OZ 1.0 (TCJA 2017): 0% basis step-up on deferred gains
// OZ 2.0 (OBBBA 2025): 10% standard / 30% rural step-up
export const OZ_STEP_UP_RATES = {
  '1.0': { standard: 0, rural: 0 },
  '2.0': { standard: 0.10, rural: 0.30 },
} as const;

export type OzVersion = '1.0' | '2.0';

export function getOzStepUpPercent(
  ozVersion: OzVersion,
  ozType: 'standard' | 'rural'
): number {
  return OZ_STEP_UP_RATES[ozVersion][ozType];
}