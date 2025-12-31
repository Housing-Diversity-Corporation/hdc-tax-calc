// Stub file for shared types - TODO: implement

import type { UnitType } from './affordability';

export interface ImpactFeeSchedule {
  perUnitGlobal: number;
  perBedroomGlobal: number;
  perTypeOverride: Record<UnitType, number>;
}

export interface ParkingRules {
  Micro: number;
  Studio: number;
  '1BR': number;
  '2BR': number;
  '3BR': number;
  '4BR': number;
}

export interface ParkingCostSched {
  capexPerStall: Record<UnitType, number>;
  opexPerStall: Record<UnitType, number>;
}

export interface PerTypeSFConfig {
  targetSF: Record<UnitType, number>;
  statutorySF: Record<UnitType, number>;
  capexPerSF: Record<UnitType, number>;
  opexPerSF: Record<UnitType, number>;
}

export interface FinanceAssumptions {
  annualInterestRate: number;
  termYears: number;
}
