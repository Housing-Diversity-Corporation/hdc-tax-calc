// Solar API Types
// https://developers.google.com/maps/documentation/solar

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Date {
  year: number;
  month: number;
  day: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries?: RoofSegmentSummary[];
}

export interface RoofSegmentSummary {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats?: SizeAndSunshineStats;
  roofSegmentStats?: RoofSegmentSizeAndSunshineStats[];
  solarPanelConfigs?: SolarPanelConfig[];
  financialAnalyses?: FinancialAnalysis[];
}

export interface SizeAndSunshineStats {
  areaMeters2: number;
  sunshineQuantiles: number[];
  groundAreaMeters2: number;
}

export interface RoofSegmentSizeAndSunshineStats {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: SizeAndSunshineStats;
  center: LatLng;
  boundingBox: LatLngBox;
  planeHeightAtCenterMeters: number;
}

export interface LatLngBox {
  sw: LatLng;
  ne: LatLng;
}

export interface FinancialAnalysis {
  monthlyBill: Money;
  defaultBill: boolean;
  averageKwhPerMonth: number;
  panelConfigIndex: number;
  financialDetails?: FinancialDetails;
  leasingSavings?: LeasingSavings;
  cashPurchaseSavings?: CashPurchaseSavings;
  financedPurchaseSavings?: FinancedPurchaseSavings;
}

export interface Money {
  currencyCode: string;
  units: string;
}

export interface FinancialDetails {
  initialAcKwhPerYear: number;
  remainingLifetimeUtilityBill: Money;
  federalIncentive: Money;
  stateIncentive: Money;
  utilityIncentive: Money;
  lifetimeSrecTotal: Money;
  costOfElectricityWithoutSolar: Money;
  netMeteringAllowed: boolean;
  solarPercentage: number;
  percentageExportedToGrid: number;
}

export interface LeasingSavings {
  leasesAllowed: boolean;
  leasesSupported: boolean;
  annualLeasingCost: Money;
  savings: Savings;
}

export interface CashPurchaseSavings {
  outOfPocketCost: Money;
  upfrontCost: Money;
  rebateValue: Money;
  paybackYears: number;
  savings: Savings;
}

export interface FinancedPurchaseSavings {
  annualLoanPayment: Money;
  rebateValue: Money;
  loanInterestRate: number;
  savings: Savings;
}

export interface Savings {
  savingsYear1: Money;
  savingsYear20: Money;
  presentValueOfSavingsYear20: Money;
  savingsLifetime: Money;
  presentValueOfSavingsLifetime: Money;
  financiallyViable: boolean;
}

export interface BuildingInsightsResponse {
  name: string;
  center: LatLng;
  boundingBox: LatLngBox;
  imageryDate: Date;
  imageryProcessedDate: Date;
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: SolarPotential;
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DataLayersResponse {
  imageryDate: Date;
  imageryProcessedDate: Date;
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  hourlyShadeUrls: string[];
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface GeoTiff {
  width: number;
  height: number;
  rasters: Array<number>[];
  bounds: Bounds;
}

export interface SolarAnalysis {
  buildingInsights: BuildingInsightsResponse;
  summary: {
    maxPanels: number;
    maxArrayAreaM2: number;
    yearlyEnergyKwh: number;
    carbonOffsetKg: number;
    roofSegments: number;
  };
}
