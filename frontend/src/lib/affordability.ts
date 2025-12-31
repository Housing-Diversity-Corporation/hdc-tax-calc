// Stub file for affordability calculations - TODO: implement

export type UnitType = 'Micro' | 'Studio' | '1BR' | '2BR' | '3BR' | '4BR';

export const BASELINE_MIN_SF = 400;

// ACS_RENTER_BINS: Array of [lowerBound, upperBound] tuples
// upperBound is null for the last bin (open-ended)
export const ACS_RENTER_BINS: Array<[number, number | null]> = [
  [0, 10000],
  [10000, 15000],
  [15000, 20000],
  [20000, 25000],
  [25000, 35000],
  [35000, 50000],
  [50000, 75000],
  [75000, 100000],
  [100000, 150000],
  [150000, null]
];

export function requiredMonthlyRent(_income: number, _ratio: number = 0.3): number {
  // TODO: implement
  return 0;
}

export function annualIncomeNeededForRent(_monthlyRent: number, _ratio: number = 0.3): number {
  // TODO: implement
  return 0;
}
