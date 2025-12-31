import { create } from 'zustand';
import type { UnitType } from '../lib/affordability';
import type { ImpactFeeSchedule, ParkingRules, ParkingCostSched, PerTypeSFConfig, FinanceAssumptions } from '../lib/types';

type State = {
  zip: string;
  stateFips: string;
  unit: UnitType;
  baseMethod: 'SAFMR'|'Manual';
  manualBaseRent: number;
  finance: FinanceAssumptions;
  parkingRules: ParkingRules;
  parkingCosts: ParkingCostSched;
  impact: ImpactFeeSchedule;
  perTypeSF: PerTypeSFConfig;
  otherCapex: number;
  otherOpexMonthly: number;
  psPct: number;
  considerExceptionTo120: boolean;
  mixCounts: Record<UnitType, number>;
  theme: 'light' | 'dark';
};

type Actions = {
  set<K extends keyof State>(k: K, v: State[K]): void;
  toggleTheme: () => void;
};

const defaultParkingRules: ParkingRules = { Micro:0, Studio:0, '1BR':1, '2BR':1.25, '3BR':1.5, '4BR':2 };
const zeroType = { Micro:0, Studio:0, '1BR':0, '2BR':0, '3BR':0, '4BR':0 };

export const useAppStore = create<State & Actions>((set) => ({
  zip: '90012',
  stateFips: '06',
  unit: '1BR',
  baseMethod: 'SAFMR',
  manualBaseRent: 2000,
  finance: { annualInterestRate: 0.06, termYears: 30 },
  parkingRules: defaultParkingRules,
  parkingCosts: { capexPerStall: { ...zeroType }, opexPerStall: { ...zeroType } },
  impact: { perUnitGlobal: 0, perBedroomGlobal: 0, perTypeOverride: { ...zeroType } },
  perTypeSF: {
    targetSF: { Micro:200, Studio:300, '1BR':400, '2BR':550, '3BR':700, '4BR':850 },
    statutorySF: { Micro:200, Studio:300, '1BR':400, '2BR':550, '3BR':700, '4BR':850 },
    capexPerSF: { ...zeroType },
    opexPerSF: { ...zeroType }
  },
  otherCapex: 0,
  otherOpexMonthly: 0,
  psPct: 1.00,
  considerExceptionTo120: false,
  mixCounts: { Micro:0, Studio:0, '1BR':0, '2BR':0, '3BR':0, '4BR':0 },
  theme: 'light',
  set: <K extends keyof State>(k: K, v: State[K]) => set({ [k]: v } as Partial<State>),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
