import React from 'react';
// New 7-panel structure (IMPL-015)
import ProjectDefinitionSection from './inputs/ProjectDefinitionSection';
import CapitalStructureSection from './inputs/CapitalStructureSection';
import TaxCreditsSection from './inputs/TaxCreditsSection';
import OpportunityZoneSection from './inputs/OpportunityZoneSection';
import InvestorProfileSection from './inputs/InvestorProfileSection';
import ProjectionsSection from './inputs/ProjectionsSection';
import HDCFeesSection from './inputs/HDCFeesSection';
import InvestmentPortalSection from './inputs/InvestmentPortalSection';
import SaveConfiguration from './inputs/SaveConfiguration';
// Legacy imports (kept for preset/save functionality)
import { PROPERTY_PRESETS } from '../../utils/taxbenefits/propertyPresets';
import { calculatorService, CalculatorConfiguration } from '../../services/taxbenefits/calculatorService';
import { tokenService } from '../../services/api';
import '../../styles/taxbenefits/hdcCalculator.css';
import { InvestorAnalysisResults, CashFlowItem } from '../../types/taxbenefits';

interface HDCInputsComponentProps {
  // Calculated values
  investorEquity?: number;

  // State values - mapping to BasicInputsSection
  projectCost: number;
  setProjectCost: (value: number) => void;
  predevelopmentCosts: number;
  setPredevelopmentCosts: (value: number) => void;
  landValue: number;
  setLandValue: (value: number) => void;
  yearOneNOI: number;
  setYearOneNOI: (value: number) => void;
  yearOneDepreciationPct: number;
  setYearOneDepreciationPct: (value: number) => void;

  // Capital structure
  autoBalanceCapital: boolean;
  setAutoBalanceCapital: (value: boolean) => void;
  investorEquityRatio: number;
  setInvestorEquityRatio: (value: number) => void;
  investorEquityPct: number;
  setInvestorEquityPct: (value: number) => void;
  philanthropicEquityPct: number;
  setPhilanthropicEquityPct: (value: number) => void;
  seniorDebtPct: number;
  setSeniorDebtPct: (value: number) => void;
  seniorDebtRate: number;
  setSeniorDebtRate: (value: number) => void;
  seniorDebtAmortization: number;
  setSeniorDebtAmortization: (value: number) => void;
  seniorDebtIOYears: number;
  setSeniorDebtIOYears: (value: number) => void;
  philDebtPct: number;
  setPhilDebtPct: (value: number) => void;
  philDebtRate: number;
  setPhilDebtRate: (value: number) => void;
  philDebtAmortization: number;
  setPhilDebtAmortization: (value: number) => void;
  philCurrentPayEnabled: boolean;
  setPhilCurrentPayEnabled: (value: boolean) => void;
  philCurrentPayPct: number;
  setPhilCurrentPayPct: (value: number) => void;
  interestReserveEnabled: boolean;
  setInterestReserveEnabled: (value: boolean) => void;
  interestReserveMonths: number;
  setInterestReserveMonths: (value: number) => void;
  interestReserveAmount: number;
  // IMPL-020a: Pre-calculated effective project cost from engine
  effectiveProjectCost?: number;
  hdcSubDebtPct: number;
  setHdcSubDebtPct: (value: number) => void;
  hdcSubDebtPikRate: number;
  setHdcSubDebtPikRate: (value: number) => void;
  pikCurrentPayEnabled: boolean;
  setPikCurrentPayEnabled: (value: boolean) => void;
  pikCurrentPayPct: number;
  setPikCurrentPayPct: (value: number) => void;
  investorSubDebtPct: number;
  setInvestorSubDebtPct: (value: number) => void;
  investorSubDebtPikRate: number;
  setInvestorSubDebtPikRate: (value: number) => void;
  investorPikCurrentPayEnabled: boolean;
  setInvestorPikCurrentPayEnabled: (value: boolean) => void;
  investorPikCurrentPayPct: number;
  setInvestorPikCurrentPayPct: (value: number) => void;
  outsideInvestorSubDebtPct: number;
  setOutsideInvestorSubDebtPct: (value: number) => void;
  outsideInvestorSubDebtPikRate: number;
  setOutsideInvestorSubDebtPikRate: (value: number) => void;
  outsideInvestorPikCurrentPayEnabled: boolean;
  setOutsideInvestorPikCurrentPayEnabled: (value: boolean) => void;
  outsideInvestorPikCurrentPayPct: number;
  setOutsideInvestorPikCurrentPayPct: (value: number) => void;
  subDebtPriority?: {
    outsideInvestor: number;
    hdc: number;
    investor: number;
  };
  setSubDebtPriority?: (value: {
    outsideInvestor: number;
    hdc: number;
    investor: number;
  }) => void;

  // Tax rates
  federalTaxRate: number;
  setFederalTaxRate: (value: number) => void;
  stateTaxRate?: number;
  setStateTaxRate?: (value: number) => void;
  ltCapitalGainsRate: number;
  setLtCapitalGainsRate: (value: number) => void;
  niitRate: number;
  setNiitRate: (value: number) => void;
  selectedState: string;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (value: number) => void;
  depreciationRecaptureRate?: number;
  projectLocation?: string;
  setProjectLocation?: (value: string) => void;

  // HDC Fees
  hdcFeeRate: number;
  setHdcFeeRate: (value: number) => void;
  hdcDeferredInterestRate?: number;
  setHdcDeferredInterestRate?: (value: number) => void;
  aumFeeEnabled: boolean;
  setAumFeeEnabled: (value: boolean) => void;
  aumFeeRate: number;
  setAumFeeRate: (value: number) => void;
  aumCurrentPayEnabled: boolean;
  setAumCurrentPayEnabled: (value: boolean) => void;
  aumCurrentPayPct: number;
  setAumCurrentPayPct: (value: number) => void;
  hdcAdvanceFinancing: boolean;
  setHdcAdvanceFinancing: (value: boolean) => void;
  taxAdvanceDiscountRate: number;
  setTaxAdvanceDiscountRate: (value: number) => void;
  advanceFinancingRate: number;
  setAdvanceFinancingRate: (value: number) => void;
  taxDeliveryMonths: number;
  setTaxDeliveryMonths: (value: number) => void;
  constructionDelayMonths: number;
  setConstructionDelayMonths: (value: number) => void;
  taxBenefitDelayMonths: number;
  setTaxBenefitDelayMonths: (value: number) => void;

  // Projections
  holdPeriod: number;
  setHoldPeriod: (value: number) => void;
  revenueGrowth: number;
  setRevenueGrowth: (value: number) => void;
  opexRatio: number;
  setOpexRatio: (value: number) => void;
  expenseGrowth: number;
  setExpenseGrowth: (value: number) => void;
  exitCapRate: number;
  setExitCapRate: (value: number) => void;
  investorPromoteShare: number;
  setInvestorPromoteShare: (value: number) => void;

  // Opportunity Zone parameters
  // IMPL-071: OZ enabled toggle
  ozEnabled?: boolean;
  setOzEnabled?: (value: boolean) => void;
  ozType: 'standard' | 'rural';
  setOzType: (value: 'standard' | 'rural') => void;
  ozVersion: '1.0' | '2.0';  // IMPL-017: OZ legislation version
  setOzVersion: (value: '1.0' | '2.0') => void;
  deferredCapitalGains: number;
  setDeferredCapitalGains: (value: number) => void;
  capitalGainsTaxRate: number;
  setCapitalGainsTaxRate: (value: number) => void;
  // IMPL-071: Depreciation info for recapture display
  totalDepreciation?: number;

  // Investor Type
  investorType?: 'ordinary' | 'stcg' | 'ltcg' | 'custom';
  setInvestorType?: (value: 'ordinary' | 'stcg' | 'ltcg' | 'custom') => void;

  // Investor Track
  investorTrack?: 'rep' | 'non-rep';
  setInvestorTrack?: (value: 'rep' | 'non-rep') => void;

  // Passive Gain Type (for Non-REPs)
  passiveGainType?: 'short-term' | 'long-term';
  setPassiveGainType?: (value: 'short-term' | 'long-term') => void;

  // Investor Information
  annualIncome?: number;
  setAnnualIncome?: (value: number) => void;
  filingStatus?: 'single' | 'married';
  setFilingStatus?: (value: 'single' | 'married') => void;

  // Tax Planning Analysis
  includeDepreciationSchedule?: boolean;
  setIncludeDepreciationSchedule?: (value: boolean) => void;
  w2Income?: number;
  setW2Income?: (value: number) => void;
  businessIncome?: number;
  setBusinessIncome?: (value: number) => void;
  iraBalance?: number;
  setIraBalance?: (value: number) => void;
  passiveIncome?: number;
  setPassiveIncome?: (value: number) => void;
  assetSaleGain?: number;
  setAssetSaleGain?: (value: number) => void;

  // State LIHTC (v7.0.10)
  stateLIHTCEnabled?: boolean;
  setStateLIHTCEnabled?: (value: boolean) => void;
  investorState?: string;
  setInvestorState?: (value: string) => void;
  syndicationRate?: number;
  setSyndicationRate?: (value: number) => void;
  investorHasStateLiability?: boolean;
  setInvestorHasStateLiability?: (value: boolean) => void;
  stateLIHTCUserPercentage?: number;
  setStateLIHTCUserPercentage?: (value: number) => void;
  stateLIHTCUserAmount?: number;
  setStateLIHTCUserAmount?: (value: number) => void;
  stateLIHTCSyndicationYear?: 0 | 1 | 2; // IMPL-073
  setStateLIHTCSyndicationYear?: (value: 0 | 1 | 2) => void;

  // Federal LIHTC (v7.0.11)
  lihtcEnabled?: boolean;
  setLihtcEnabled?: (value: boolean) => void;
  applicableFraction?: number;
  setApplicableFraction?: (value: number) => void;
  creditRate?: number;
  setCreditRate?: (value: number) => void;
  placedInServiceMonth?: number;
  setPlacedInServiceMonth?: (value: number) => void;
  ddaQctBoost?: boolean;
  setDdaQctBoost?: (value: boolean) => void;
  lihtcEligibleBasis?: number;

  // Private Activity Bonds (IMPL-080)
  pabEnabled?: boolean;
  setPabEnabled?: (value: boolean) => void;
  pabPctOfEligibleBasis?: number;
  setPabPctOfEligibleBasis?: (value: number) => void;
  pabRate?: number;
  setPabRate?: (value: number) => void;
  pabAmortization?: number;
  setPabAmortization?: (value: number) => void;
  pabIOYears?: number;
  setPabIOYears?: (value: number) => void;

  // IMPL-083: Eligible Basis Exclusions
  commercialSpaceCosts?: number;
  setCommercialSpaceCosts?: (value: number) => void;
  syndicationCosts?: number;
  setSyndicationCosts?: (value: number) => void;
  marketingCosts?: number;
  setMarketingCosts?: (value: number) => void;
  financingFees?: number;
  setFinancingFees?: (value: number) => void;
  bondIssuanceCosts?: number;
  setBondIssuanceCosts?: (value: number) => void;
  operatingDeficitReserve?: number;
  setOperatingDeficitReserve?: (value: number) => void;
  replacementReserve?: number;
  setReplacementReserve?: (value: number) => void;
  otherExclusions?: number;
  setOtherExclusions?: (value: number) => void;

  // Helper functions
  handlePercentageChange: (setter: (value: number) => void, value: number) => void;
  handleStateChange: (stateCode: string) => void;
  formatCurrency: (value: number) => string;

  // Constants
  CONFORMING_STATES: { [key: string]: { name: string; rate: number; tier: string } };
  totalCapitalStructure: number;

  // Preset handlers
  onPresetSelect?: (presetId: string) => void;
  onSaveConfiguration?: (configName: string) => void;

  // Calculated results for display
  calculatedCashFlows?: CashFlowItem[];
  mainAnalysisResults?: InvestorAnalysisResults;

  // Platform mode
  hdcPlatformMode?: 'traditional' | 'leverage';
  setHdcPlatformMode?: (value: 'traditional' | 'leverage') => void;

  // HDC Debt Fund (IMPL-082)
  hdcDebtFundPct?: number;
  setHdcDebtFundPct?: (value: number) => void;
  hdcDebtFundPikRate?: number;
  setHdcDebtFundPikRate?: (value: number) => void;
  hdcDebtFundCurrentPayEnabled?: boolean;
  setHdcDebtFundCurrentPayEnabled?: (value: boolean) => void;
  hdcDebtFundCurrentPayPct?: number;
  setHdcDebtFundCurrentPayPct?: (value: number) => void;

  // Investment Portal Settings
  isInvestorFacing?: boolean;
  setIsInvestorFacing?: (value: boolean) => void;
  dealDescription?: string;
  setDealDescription?: (value: string) => void;
  dealLocation?: string;
  setDealLocation?: (value: string) => void;
  dealLatitude?: number;
  setDealLatitude?: (value: number | undefined) => void;
  dealLongitude?: number;
  setDealLongitude?: (value: number | undefined) => void;
  units?: number;
  setUnits?: (value: number) => void;
  affordabilityMix?: string;
  setAffordabilityMix?: (value: string) => void;
  projectStatus?: 'available' | 'funded' | 'pipeline';
  setProjectStatus?: (value: 'available' | 'funded' | 'pipeline') => void;
  minimumInvestment?: number;
  setMinimumInvestment?: (value: number) => void;
  dealImageUrl?: string;
  setDealImageUrl?: (value: string) => void;

  // Hide Investment Portal Settings for investor portal
  hideInvestmentPortalSettings?: boolean;

  // Hide Save Configuration button for investor portal
  hideSaveConfiguration?: boolean;

  // Read-only mode for investor portal tax section
  taxSectionReadOnly?: boolean;

  // Make entire form read-only (for viewing deals)
  isReadOnly?: boolean;

  // IMPL-036: Config loading helpers to suppress auto-balance during config load
  startConfigLoading?: () => void;
  endConfigLoading?: () => void;

  // ISS-040d: Debt editing helpers to prevent PAB adjustment during user input
  startDebtEditing?: () => void;
  endDebtEditing?: () => void;
}

const HDCInputsComponent: React.FC<HDCInputsComponentProps> = (props) => {
  const handlePresetSelect = async (presetId: string) => {
    debugger; // BREAKPOINT 2: Preset handler entry - inspect presetId
    // Check if it's a saved configuration
    if (presetId.startsWith('saved-config-')) {
      const configId = parseInt(presetId.replace('saved-config-', ''));
      try {
        const config = await calculatorService.getConfiguration(configId);
        if (config) {
          // IMPL-036: Suppress auto-balance during config loading to preserve loaded values
          props.startConfigLoading?.();

          // Apply saved configuration values
          props.setProjectCost(config.projectCost ?? 10);
          props.setPredevelopmentCosts(config.predevelopmentCosts ?? 0);
          props.setLandValue(config.landValue ?? 0);
          props.setYearOneNOI(config.yearOneNOI ?? 0.5);
          props.setYearOneDepreciationPct(config.yearOneDepreciationPct ?? 25);
          props.setRevenueGrowth(config.revenueGrowth ?? 3);
          props.setOpexRatio(config.opexRatio ?? 25);
          props.setExpenseGrowth(config.expenseGrowth ?? 3);
          props.setExitCapRate(config.exitCapRate ?? 6);
          props.setHoldPeriod?.(config.holdPeriod ?? 10);

          // Capital structure
          props.setInvestorEquityPct(config.investorEquityPct ?? 0);
          props.setPhilanthropicEquityPct(config.philanthropicEquityPct ?? 0);
          props.setSeniorDebtPct(config.seniorDebtPct ?? 0);
          props.setSeniorDebtRate(config.seniorDebtRate ?? 0);
          props.setSeniorDebtAmortization(config.seniorDebtAmortization ?? 30);
          props.setSeniorDebtIOYears?.(config.seniorDebtIOYears ?? 0);  // ISS-043
          props.setPhilDebtPct(config.philDebtPct ?? 0);
          props.setPhilDebtRate(config.philDebtRate ?? 0);
          props.setPhilDebtAmortization(config.philDebtAmortization ?? 30);
          props.setPhilCurrentPayEnabled?.(config.philCurrentPayEnabled ?? false);
          props.setPhilCurrentPayPct?.(config.philCurrentPayPct ?? 0);
          props.setHdcSubDebtPct(config.hdcSubDebtPct ?? 0);
          props.setHdcSubDebtPikRate(config.hdcSubDebtPikRate ?? 8);
          props.setPikCurrentPayEnabled?.(config.pikCurrentPayEnabled ?? false);
          props.setPikCurrentPayPct?.(config.pikCurrentPayPct ?? 0);
          props.setInvestorSubDebtPct(config.investorSubDebtPct ?? 0);
          props.setInvestorSubDebtPikRate(config.investorSubDebtPikRate ?? 8);
          props.setInvestorPikCurrentPayEnabled?.(config.investorPikCurrentPayEnabled ?? false);
          props.setInvestorPikCurrentPayPct?.(config.investorPikCurrentPayPct ?? 0);
          props.setOutsideInvestorSubDebtPct(config.outsideInvestorSubDebtPct ?? 0);
          props.setOutsideInvestorSubDebtPikRate(config.outsideInvestorSubDebtPikRate ?? 8);
          props.setOutsideInvestorPikCurrentPayEnabled?.(config.outsideInvestorPikCurrentPayEnabled ?? false);
          props.setOutsideInvestorPikCurrentPayPct?.(config.outsideInvestorPikCurrentPayPct ?? 0);
          // ISS-043: HDC Debt Fund
          props.setHdcDebtFundPct?.(config.hdcDebtFundPct ?? 0);
          props.setHdcDebtFundPikRate?.(config.hdcDebtFundPikRate ?? 8);
          props.setHdcDebtFundCurrentPayEnabled?.(config.hdcDebtFundCurrentPayEnabled ?? false);
          props.setHdcDebtFundCurrentPayPct?.(config.hdcDebtFundCurrentPayPct ?? 50);
          // ISS-043: Sub-debt priority
          if (config.subDebtPriority) {
            try {
              const priority = JSON.parse(config.subDebtPriority);
              props.setSubDebtPriority?.(priority);
            } catch {
              // Use default if parsing fails
            }
          }

          // Interest Reserve
          props.setInterestReserveEnabled?.(config.interestReserveEnabled ?? false);
          props.setInterestReserveMonths?.(config.interestReserveMonths ?? 12);

          // Tax parameters - only update if not in read-only mode (investor portal)
          if (!props.taxSectionReadOnly) {
            props.setFederalTaxRate(config.federalTaxRate ?? 37);
            props.handleStateChange(config.selectedState ?? 'CA');
            if (config.projectLocation) {
              props.setProjectLocation?.(config.projectLocation);
            }
            props.setStateCapitalGainsRate?.(config.stateCapitalGainsRate ?? 0);
            props.setLtCapitalGainsRate(config.ltCapitalGainsRate ?? 20);
            props.setNiitRate(config.niitRate ?? 3.8);
          }

          // HDC fees
          props.setHdcFeeRate(config.hdcFeeRate ?? 10);
          props.setAumFeeEnabled(config.aumFeeEnabled ?? false);
          props.setAumFeeRate(config.aumFeeRate ?? 1);

          // Exit & Promote
          props.setInvestorPromoteShare(config.investorPromoteShare ?? 80);

          // Timing parameters
          props.setConstructionDelayMonths?.(config.constructionDelayMonths ?? 0);
          props.setTaxBenefitDelayMonths?.(config.taxBenefitDelayMonths ?? 0);

          // Opportunity Zone parameters - only update if not in read-only mode
          if (!props.taxSectionReadOnly) {
            props.setOzEnabled?.(config.ozEnabled ?? true);  // ISS-043
            props.setOzType?.(config.ozType ?? 'standard');
            props.setOzVersion?.(config.ozVersion ?? '2.0');  // ISS-043
            props.setDeferredCapitalGains?.(config.deferredCapitalGains ?? 0);
            props.setCapitalGainsTaxRate?.(config.capitalGainsTaxRate ?? 23.8);
          }

          // Additional missing fields - only update if not in read-only mode
          if (!props.taxSectionReadOnly) {
            props.setStateTaxRate?.(config.stateTaxRate ?? 0);
            props.setInvestorTrack?.(config.investorTrack ?? 'rep');
            props.setPassiveGainType?.(config.passiveGainType ?? 'short-term');
          }

          // Tax Planning Analysis - ALWAYS ENABLED (core feature)
          props.setIncludeDepreciationSchedule?.(true);
          props.setW2Income?.(config.w2Income ?? 0);
          props.setBusinessIncome?.(config.businessIncome ?? 0);
          props.setIraBalance?.(config.iraBalance ?? 0);
          props.setPassiveIncome?.(config.passiveIncome ?? 0);
          props.setAssetSaleGain?.(config.assetSaleGain ?? 0);
          props.setHdcAdvanceFinancing?.(config.hdcAdvanceFinancing ?? false);
          props.setTaxAdvanceDiscountRate?.(config.taxAdvanceDiscountRate ?? 0);
          props.setAdvanceFinancingRate?.(config.advanceFinancingRate ?? 8);
          props.setTaxDeliveryMonths?.(config.taxDeliveryMonths ?? 12);
          props.setAutoBalanceCapital?.(config.autoBalanceCapital ?? false);
          props.setInvestorEquityRatio?.(config.investorEquityRatio ?? 0.5);
          // Investment Portal Settings
          props.setIsInvestorFacing?.(config.isInvestorFacing ?? false);
          props.setDealDescription?.(config.dealDescription ?? '');
          props.setDealLocation?.(config.dealLocation ?? '');
          props.setUnits?.(config.units ?? 0);
          props.setAffordabilityMix?.(config.affordabilityMix ?? '');
          props.setProjectStatus?.(config.projectStatus ?? 'available');
          props.setMinimumInvestment?.(config.minimumInvestment ?? 0);
          props.setDealImageUrl?.(config.dealImageUrl ?? '');
          // ISS-043: HDC Platform Mode
          props.setHdcPlatformMode?.(config.hdcPlatformMode ?? 'traditional');
          // ISS-043: Private Activity Bonds (PABs)
          props.setPabEnabled?.(config.pabEnabled ?? false);
          props.setPabPctOfEligibleBasis?.(config.pabPctOfEligibleBasis ?? 30);
          props.setPabRate?.(config.pabRate ?? 4.5);
          props.setPabAmortization?.(config.pabAmortization ?? 40);
          props.setPabIOYears?.(config.pabIOYears ?? 0);
          // ISS-043: Federal LIHTC
          props.setLihtcEnabled?.(config.lihtcEnabled ?? true);
          props.setApplicableFraction?.(config.applicableFraction ?? 100);
          props.setCreditRate?.(config.creditRate ?? 0.04);
          props.setPlacedInServiceMonth?.(config.placedInServiceMonth ?? 7);
          props.setDdaQctBoost?.(config.ddaQctBoost ?? false);
          // ISS-043: State LIHTC
          props.setStateLIHTCEnabled?.(config.stateLIHTCEnabled ?? false);
          props.setInvestorState?.(config.investorState ?? 'WA');
          props.setSyndicationRate?.(config.syndicationRate ?? 75);
          props.setInvestorHasStateLiability?.(config.investorHasStateLiability ?? true);
          if (config.stateLIHTCUserPercentage !== undefined) {
            props.setStateLIHTCUserPercentage?.(config.stateLIHTCUserPercentage);
          }
          if (config.stateLIHTCUserAmount !== undefined) {
            props.setStateLIHTCUserAmount?.(config.stateLIHTCUserAmount);
          }
          props.setStateLIHTCSyndicationYear?.((config.stateLIHTCSyndicationYear ?? 0) as 0 | 1 | 2);
          // ISS-043: Eligible Basis Exclusions
          props.setCommercialSpaceCosts?.(config.commercialSpaceCosts ?? 0);
          props.setSyndicationCosts?.(config.syndicationCosts ?? 0);
          props.setMarketingCosts?.(config.marketingCosts ?? 0);
          props.setFinancingFees?.(config.financingFees ?? 0);
          props.setBondIssuanceCosts?.(config.bondIssuanceCosts ?? 0);
          props.setOperatingDeficitReserve?.(config.operatingDeficitReserve ?? 0);
          props.setReplacementReserve?.(config.replacementReserve ?? 0);
          props.setOtherExclusions?.(config.otherExclusions ?? 0);
          // ISS-043: AUM Current Pay (was missing)
          props.setAumCurrentPayEnabled?.(config.aumCurrentPayEnabled ?? false);
          props.setAumCurrentPayPct?.(config.aumCurrentPayPct ?? 50);
          // ISS-043: HDC Deferred Interest Rate (was missing)
          props.setHdcDeferredInterestRate?.(config.hdcDeferredInterestRate ?? 8);

          // IMPL-036: Re-enable auto-balance after config loading is complete
          props.endConfigLoading?.();
        }
      } catch (error) {
        console.error('Error loading saved configuration:', error);
        // IMPL-036: Ensure we re-enable auto-balance even on error
        props.endConfigLoading?.();
      }
      return;
    }

    // Otherwise it's a preset
    const preset = PROPERTY_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // IMPL-036: Suppress auto-balance during preset loading to preserve loaded values
    props.startConfigLoading?.();

    const values = preset.values;

    // Update all the state values based on the preset
    props.setProjectCost(values.projectCost);
    props.setLandValue(values.landValue);
    props.setYearOneNOI(values.yearOneNOI);
    props.setYearOneDepreciationPct(values.yearOneDepreciationPct);
    props.setRevenueGrowth(values.revenueGrowth);
    props.setOpexRatio(values.opexRatio);
    props.setExpenseGrowth(3);
    props.setExitCapRate(values.exitCapRate);

    // Capital structure
    props.setInvestorEquityPct(values.investorEquityPct);
    props.setPhilanthropicEquityPct(values.philanthropicEquityPct);
    props.setSeniorDebtPct(values.seniorDebtPct);
    props.setSeniorDebtRate(values.seniorDebtRate);
    props.setSeniorDebtAmortization(values.seniorDebtAmortization);
    props.setPhilDebtPct(values.philDebtPct);
    props.setPhilDebtRate(values.philDebtRate);
    props.setPhilDebtAmortization(values.philDebtAmortization);
    props.setHdcSubDebtPct(values.hdcSubDebtPct);
    props.setHdcSubDebtPikRate(values.hdcSubDebtPikRate);
    props.setInvestorSubDebtPct(values.investorSubDebtPct);
    props.setInvestorSubDebtPikRate(values.investorSubDebtPikRate);
    props.setOutsideInvestorSubDebtPct(values.outsideInvestorSubDebtPct);
    props.setOutsideInvestorSubDebtPikRate(values.outsideInvestorSubDebtPikRate);

    // Tax parameters - only update if not in read-only mode (investor portal)
    if (!props.taxSectionReadOnly) {
      props.setFederalTaxRate(values.federalTaxRate);
      props.handleStateChange(values.selectedState);
      props.setLtCapitalGainsRate(values.ltCapitalGainsRate);
      props.setNiitRate(values.niitRate);
    }

    // HDC fees
    props.setHdcFeeRate(values.hdcFeeRate);
    props.setAumFeeEnabled(values.aumFeeEnabled);
    props.setAumFeeRate(values.aumFeeRate);

    // Exit & Promote
    props.setInvestorPromoteShare(values.investorPromoteShare);

    // Reset fields that aren't in presets to defaults
    props.setHoldPeriod(10);
    props.setPikCurrentPayEnabled(false);
    props.setPikCurrentPayPct(50);
    props.setInvestorPikCurrentPayEnabled(false);
    props.setInvestorPikCurrentPayPct(50);
    props.setPhilCurrentPayEnabled(false);
    props.setPhilCurrentPayPct(50);
    props.setInterestReserveEnabled(false);
    props.setInterestReserveMonths(12);

    // IMPL-036: Re-enable auto-balance after preset loading is complete
    props.endConfigLoading?.();
    debugger; // BREAKPOINT 3: After preset values applied - inspect props

    if (props.onPresetSelect) {
      props.onPresetSelect(presetId);
    }
  };

  const handleSaveConfiguration = async (configName: string) => {
    if (!tokenService.isAuthenticated()) {
      return Promise.reject('Not authenticated');
    }

    try {
      const currentConfig: CalculatorConfiguration = {
        configurationName: configName,
        projectCost: props.projectCost,
        predevelopmentCosts: props.predevelopmentCosts,
        landValue: props.landValue,
        yearOneNOI: props.yearOneNOI,
        yearOneDepreciationPct: props.yearOneDepreciationPct,
        revenueGrowth: props.revenueGrowth,
        opexRatio: props.opexRatio,
        expenseGrowth: props.expenseGrowth,
        exitCapRate: props.exitCapRate,
        holdPeriod: props.holdPeriod,
        investorEquityPct: props.investorEquityPct,
        philanthropicEquityPct: props.philanthropicEquityPct,
        seniorDebtPct: props.seniorDebtPct,
        seniorDebtRate: props.seniorDebtRate,
        seniorDebtAmortization: props.seniorDebtAmortization,
        seniorDebtIOYears: props.seniorDebtIOYears,  // ISS-043
        philDebtPct: props.philDebtPct,
        philDebtRate: props.philDebtRate,
        philDebtAmortization: props.philDebtAmortization,
        philCurrentPayEnabled: props.philCurrentPayEnabled,
        philCurrentPayPct: props.philCurrentPayPct,
        hdcSubDebtPct: props.hdcSubDebtPct,
        hdcSubDebtPikRate: props.hdcSubDebtPikRate,
        pikCurrentPayEnabled: props.pikCurrentPayEnabled,
        pikCurrentPayPct: props.pikCurrentPayPct,
        investorSubDebtPct: props.investorSubDebtPct,
        investorSubDebtPikRate: props.investorSubDebtPikRate,
        investorPikCurrentPayEnabled: props.investorPikCurrentPayEnabled,
        investorPikCurrentPayPct: props.investorPikCurrentPayPct,
        outsideInvestorSubDebtPct: props.outsideInvestorSubDebtPct,
        outsideInvestorSubDebtPikRate: props.outsideInvestorSubDebtPikRate,
        outsideInvestorPikCurrentPayEnabled: props.outsideInvestorPikCurrentPayEnabled,
        outsideInvestorPikCurrentPayPct: props.outsideInvestorPikCurrentPayPct,
        // ISS-043: HDC Debt Fund
        hdcDebtFundPct: props.hdcDebtFundPct,
        hdcDebtFundPikRate: props.hdcDebtFundPikRate,
        hdcDebtFundCurrentPayEnabled: props.hdcDebtFundCurrentPayEnabled,
        hdcDebtFundCurrentPayPct: props.hdcDebtFundCurrentPayPct,
        // ISS-043: Sub-debt priority (stored as JSON string)
        subDebtPriority: props.subDebtPriority ? JSON.stringify(props.subDebtPriority) : undefined,
        interestReserveEnabled: props.interestReserveEnabled,
        interestReserveMonths: props.interestReserveMonths,
        interestReserveAmount: props.interestReserveAmount,
        federalTaxRate: props.federalTaxRate,
        selectedState: props.selectedState,
        projectLocation: props.projectLocation,
        stateCapitalGainsRate: props.stateCapitalGainsRate,
        ltCapitalGainsRate: props.ltCapitalGainsRate,
        niitRate: props.niitRate,
        depreciationRecaptureRate: props.depreciationRecaptureRate || 25,
        deferredGains: (props.projectCost + props.interestReserveAmount) * (props.investorEquityPct / 100),
        hdcFeeRate: props.hdcFeeRate,
        hdcDeferredInterestRate: props.hdcDeferredInterestRate || 8,
        aumFeeEnabled: props.aumFeeEnabled,
        aumFeeRate: props.aumFeeRate,
        aumCurrentPayEnabled: props.aumCurrentPayEnabled,
        aumCurrentPayPct: props.aumCurrentPayPct,
        investorPromoteShare: props.investorPromoteShare,
        constructionDelayMonths: props.constructionDelayMonths,
        taxBenefitDelayMonths: props.taxBenefitDelayMonths,
        ozType: props.ozType,
        ozVersion: props.ozVersion,  // ISS-043
        ozEnabled: props.ozEnabled,  // ISS-043
        deferredCapitalGains: props.deferredCapitalGains,
        capitalGainsTaxRate: props.capitalGainsTaxRate,
        stateTaxRate: props.stateTaxRate,
        hdcAdvanceFinancing: props.hdcAdvanceFinancing,
        taxAdvanceDiscountRate: props.taxAdvanceDiscountRate,
        advanceFinancingRate: props.advanceFinancingRate,
        taxDeliveryMonths: props.taxDeliveryMonths,
        autoBalanceCapital: props.autoBalanceCapital,
        investorEquityRatio: props.investorEquityRatio,
        investorTrack: props.investorTrack,
        passiveGainType: props.passiveGainType,
        includeDepreciationSchedule: props.includeDepreciationSchedule,
        w2Income: props.w2Income,
        businessIncome: props.businessIncome,
        iraBalance: props.iraBalance,
        passiveIncome: props.passiveIncome,
        assetSaleGain: props.assetSaleGain,
        isInvestorFacing: props.isInvestorFacing,
        dealDescription: props.dealDescription,
        dealLocation: props.dealLocation,
        dealLatitude: props.dealLatitude,
        dealLongitude: props.dealLongitude,
        units: props.units,
        affordabilityMix: props.affordabilityMix,
        projectStatus: props.projectStatus,
        minimumInvestment: props.minimumInvestment,
        dealImageUrl: props.dealImageUrl,
        // ISS-043: HDC Platform Mode
        hdcPlatformMode: props.hdcPlatformMode,
        // ISS-043: Private Activity Bonds (PABs)
        pabEnabled: props.pabEnabled,
        pabPctOfEligibleBasis: props.pabPctOfEligibleBasis,
        pabRate: props.pabRate,
        pabAmortization: props.pabAmortization,
        pabIOYears: props.pabIOYears,
        // ISS-043: Federal LIHTC
        lihtcEnabled: props.lihtcEnabled,
        applicableFraction: props.applicableFraction,
        creditRate: props.creditRate,
        placedInServiceMonth: props.placedInServiceMonth,
        ddaQctBoost: props.ddaQctBoost,
        // ISS-043: State LIHTC
        stateLIHTCEnabled: props.stateLIHTCEnabled,
        investorState: props.investorState,
        syndicationRate: props.syndicationRate,
        investorHasStateLiability: props.investorHasStateLiability,
        stateLIHTCUserPercentage: props.stateLIHTCUserPercentage,
        stateLIHTCUserAmount: props.stateLIHTCUserAmount,
        stateLIHTCSyndicationYear: props.stateLIHTCSyndicationYear,
        // ISS-043: Eligible Basis Exclusions
        commercialSpaceCosts: props.commercialSpaceCosts,
        syndicationCosts: props.syndicationCosts,
        marketingCosts: props.marketingCosts,
        financingFees: props.financingFees,
        bondIssuanceCosts: props.bondIssuanceCosts,
        operatingDeficitReserve: props.operatingDeficitReserve,
        replacementReserve: props.replacementReserve,
        otherExclusions: props.otherExclusions,
      };

      const isComplete = !!(
        props.isInvestorFacing &&
        props.dealDescription &&
        props.dealLocation &&
        props.units &&
        props.projectStatus &&
        props.minimumInvestment &&
        props.dealImageUrl
      );

      currentConfig.completionStatus = isComplete ? 'complete' : 'in-progress';

      if (props.mainAnalysisResults) {
        const results = props.mainAnalysisResults;
        const resultsInDollars: InvestorAnalysisResults = {
          ...results,
          investorEquity: results.investorEquity * 1000000,
          totalReturns: results.totalReturns * 1000000,
          exitProceeds: results.exitProceeds * 1000000,
          investorTaxBenefits: results.investorTaxBenefits * 1000000,
          investorOperatingCashFlows: results.investorOperatingCashFlows * 1000000,
          investorCashFlows: results.investorCashFlows.map((year: CashFlowItem): CashFlowItem => ({
            ...year,
            taxBenefit: year.taxBenefit * 1000000,
            operatingCashFlow: year.operatingCashFlow * 1000000,
            totalCashFlow: year.totalCashFlow * 1000000,
            subDebtInterest: year.subDebtInterest * 1000000,
            exitProceeds: year.exitProceeds ? year.exitProceeds * 1000000 : 0,
          })),
        };

        currentConfig.calculatedResultsJson = JSON.stringify(resultsInDollars);
        currentConfig.calculatedInvestorEquity = resultsInDollars.investorEquity;
        currentConfig.calculatedIRR = results.irr;
        currentConfig.calculatedMultiple = results.multiple;
        currentConfig.calculatedTotalReturns = resultsInDollars.totalReturns;
        currentConfig.calculatedExitProceeds = resultsInDollars.exitProceeds;
        currentConfig.calculatedTaxBenefits = resultsInDollars.investorTaxBenefits;
        currentConfig.calculatedOperatingCashFlows = resultsInDollars.investorOperatingCashFlows;
      }

      await calculatorService.saveConfiguration(currentConfig);
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  };

  // Calculate investor equity amount for OZ section
  const investorEquityAmount = (props.projectCost + props.interestReserveAmount) * (props.investorEquityPct / 100);

  return (
    <div className="p-4 md:p-6 rounded-lg shadow h-full hdc-inputs-container"
         style={{
          borderTop: '4px solid #7FBD45',
          borderBottom: '4px solid #7FBD45',
          borderRadius:'5px',
          background: 'rgba(127, 189, 69, 0.1)'}}
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold" style={{margin: 0, color: '#407F7F'}}>Inputs</h2>
        {!props.hideSaveConfiguration && !props.isReadOnly && (
          <SaveConfiguration
            onSaveConfiguration={handleSaveConfiguration}
            buttonStyle="compact"
          />
        )}
      </div>

      <div className="space-y-4">
        {/* Panel 1: Project Definition - IMPL-035: Simple property state dropdown */}
        <ProjectDefinitionSection
          projectCost={props.projectCost}
          setProjectCost={props.setProjectCost}
          predevelopmentCosts={props.predevelopmentCosts}
          setPredevelopmentCosts={props.setPredevelopmentCosts}
          landValue={props.landValue}
          setLandValue={props.setLandValue}
          yearOneNOI={props.yearOneNOI}
          setYearOneNOI={props.setYearOneNOI}
          opexRatio={props.opexRatio}
          setOpexRatio={props.setOpexRatio}
          selectedState={props.selectedState}
          setSelectedState={props.handleStateChange}
          formatCurrency={props.formatCurrency}
          onPresetSelect={props.isReadOnly ? undefined : handlePresetSelect}
          isReadOnly={props.isReadOnly}
        />

        {/* Panel 2: Capital Structure */}
        <CapitalStructureSection
          calculatedCashFlows={props.calculatedCashFlows}
          calculatedInvestorEquity={props.investorEquity}
          autoBalanceCapital={props.autoBalanceCapital}
          setAutoBalanceCapital={props.setAutoBalanceCapital}
          investorEquityRatio={props.investorEquityRatio}
          setInvestorEquityRatio={props.setInvestorEquityRatio}
          investorEquityPct={props.investorEquityPct}
          setInvestorEquityPct={props.setInvestorEquityPct}
          predevelopmentCosts={props.predevelopmentCosts}
          philanthropicEquityPct={props.philanthropicEquityPct}
          setPhilanthropicEquityPct={props.setPhilanthropicEquityPct}
          seniorDebtPct={props.seniorDebtPct}
          setSeniorDebtPct={props.setSeniorDebtPct}
          seniorDebtRate={props.seniorDebtRate}
          setSeniorDebtRate={props.setSeniorDebtRate}
          seniorDebtAmortization={props.seniorDebtAmortization}
          setSeniorDebtAmortization={props.setSeniorDebtAmortization}
          seniorDebtIOYears={props.seniorDebtIOYears}
          setSeniorDebtIOYears={props.setSeniorDebtIOYears}
          philDebtPct={props.philDebtPct}
          setPhilDebtPct={props.setPhilDebtPct}
          philDebtRate={props.philDebtRate}
          setPhilDebtRate={props.setPhilDebtRate}
          philDebtAmortization={props.philDebtAmortization}
          setPhilDebtAmortization={props.setPhilDebtAmortization}
          philCurrentPayEnabled={props.philCurrentPayEnabled}
          setPhilCurrentPayEnabled={props.setPhilCurrentPayEnabled}
          philCurrentPayPct={props.philCurrentPayPct}
          setPhilCurrentPayPct={props.setPhilCurrentPayPct}
          hdcSubDebtPct={props.hdcSubDebtPct}
          setHdcSubDebtPct={props.setHdcSubDebtPct}
          hdcSubDebtPikRate={props.hdcSubDebtPikRate}
          setHdcSubDebtPikRate={props.setHdcSubDebtPikRate}
          pikCurrentPayEnabled={props.pikCurrentPayEnabled}
          setPikCurrentPayEnabled={props.setPikCurrentPayEnabled}
          pikCurrentPayPct={props.pikCurrentPayPct}
          setPikCurrentPayPct={props.setPikCurrentPayPct}
          investorSubDebtPct={props.investorSubDebtPct}
          setInvestorSubDebtPct={props.setInvestorSubDebtPct}
          investorSubDebtPikRate={props.investorSubDebtPikRate}
          setInvestorSubDebtPikRate={props.setInvestorSubDebtPikRate}
          investorPikCurrentPayEnabled={props.investorPikCurrentPayEnabled}
          setInvestorPikCurrentPayEnabled={props.setInvestorPikCurrentPayEnabled}
          investorPikCurrentPayPct={props.investorPikCurrentPayPct}
          setInvestorPikCurrentPayPct={props.setInvestorPikCurrentPayPct}
          outsideInvestorSubDebtPct={props.outsideInvestorSubDebtPct}
          setOutsideInvestorSubDebtPct={props.setOutsideInvestorSubDebtPct}
          outsideInvestorSubDebtPikRate={props.outsideInvestorSubDebtPikRate}
          setOutsideInvestorSubDebtPikRate={props.setOutsideInvestorSubDebtPikRate}
          outsideInvestorPikCurrentPayEnabled={props.outsideInvestorPikCurrentPayEnabled}
          setOutsideInvestorPikCurrentPayEnabled={props.setOutsideInvestorPikCurrentPayEnabled}
          outsideInvestorPikCurrentPayPct={props.outsideInvestorPikCurrentPayPct}
          setOutsideInvestorPikCurrentPayPct={props.setOutsideInvestorPikCurrentPayPct}
          subDebtPriority={props.subDebtPriority}
          setSubDebtPriority={props.setSubDebtPriority}
          handlePercentageChange={props.handlePercentageChange}
          formatCurrency={props.formatCurrency}
          projectCost={props.projectCost}
          totalCapitalStructure={props.totalCapitalStructure}
          interestReserveEnabled={props.interestReserveEnabled}
          setInterestReserveEnabled={props.setInterestReserveEnabled}
          interestReserveMonths={props.interestReserveMonths}
          setInterestReserveMonths={props.setInterestReserveMonths}
          interestReserveAmount={props.interestReserveAmount}
          hdcPlatformMode={props.hdcPlatformMode}
          setHdcPlatformMode={props.setHdcPlatformMode}
          isReadOnly={props.isReadOnly}
          // IMPL-020a: Pre-calculated effective project cost from engine
          effectiveProjectCost={props.effectiveProjectCost}
          // Private Activity Bonds (IMPL-080)
          lihtcEnabled={props.lihtcEnabled}
          lihtcEligibleBasis={props.lihtcEligibleBasis}
          pabEnabled={props.pabEnabled}
          setPabEnabled={props.setPabEnabled}
          pabPctOfEligibleBasis={props.pabPctOfEligibleBasis}
          setPabPctOfEligibleBasis={props.setPabPctOfEligibleBasis}
          pabRate={props.pabRate}
          setPabRate={props.setPabRate}
          pabAmortization={props.pabAmortization}
          setPabAmortization={props.setPabAmortization}
          pabIOYears={props.pabIOYears}
          setPabIOYears={props.setPabIOYears}
          // HDC Debt Fund (IMPL-082)
          hdcDebtFundPct={props.hdcDebtFundPct}
          setHdcDebtFundPct={props.setHdcDebtFundPct}
          hdcDebtFundPikRate={props.hdcDebtFundPikRate}
          setHdcDebtFundPikRate={props.setHdcDebtFundPikRate}
          hdcDebtFundCurrentPayEnabled={props.hdcDebtFundCurrentPayEnabled}
          setHdcDebtFundCurrentPayEnabled={props.setHdcDebtFundCurrentPayEnabled}
          hdcDebtFundCurrentPayPct={props.hdcDebtFundCurrentPayPct}
          setHdcDebtFundCurrentPayPct={props.setHdcDebtFundCurrentPayPct}
          // ISS-040d: Debt editing helpers to prevent PAB adjustment during user input
          startDebtEditing={props.startDebtEditing}
          endDebtEditing={props.endDebtEditing}
        />

        {/* Panel 3: Tax Credits (Federal + State LIHTC consolidated) */}
        {props.lihtcEnabled !== undefined && (
          <TaxCreditsSection
            // Federal LIHTC
            lihtcEnabled={props.lihtcEnabled}
            setLihtcEnabled={props.setLihtcEnabled || (() => {})}
            applicableFraction={props.applicableFraction || 100}
            setApplicableFraction={props.setApplicableFraction || (() => {})}
            creditRate={props.creditRate || 0.04}
            setCreditRate={props.setCreditRate || (() => {})}
            placedInServiceMonth={props.placedInServiceMonth || 7}
            setPlacedInServiceMonth={props.setPlacedInServiceMonth || (() => {})}
            ddaQctBoost={props.ddaQctBoost || false}
            setDdaQctBoost={props.setDdaQctBoost || (() => {})}
            lihtcEligibleBasis={props.lihtcEligibleBasis || 0}
            projectCost={props.projectCost}
            predevelopmentCosts={props.predevelopmentCosts}
            landValue={props.landValue}
            interestReserve={props.interestReserveAmount}
            // State LIHTC
            stateLIHTCEnabled={props.stateLIHTCEnabled || false}
            setStateLIHTCEnabled={props.setStateLIHTCEnabled || (() => {})}
            propertyState={props.selectedState}
            investorState={props.investorState || ''}
            setInvestorState={props.setInvestorState || (() => {})}
            syndicationRate={props.syndicationRate || 85}
            setSyndicationRate={props.setSyndicationRate || (() => {})}
            investorHasStateLiability={props.investorHasStateLiability !== undefined ? props.investorHasStateLiability : true}
            setInvestorHasStateLiability={props.setInvestorHasStateLiability || (() => {})}
            stateLIHTCUserPercentage={props.stateLIHTCUserPercentage}
            setStateLIHTCUserPercentage={props.setStateLIHTCUserPercentage}
            stateLIHTCUserAmount={props.stateLIHTCUserAmount}
            setStateLIHTCUserAmount={props.setStateLIHTCUserAmount}
            stateLIHTCSyndicationYear={props.stateLIHTCSyndicationYear}
            setStateLIHTCSyndicationYear={props.setStateLIHTCSyndicationYear}
            // IMPL-083: Eligible Basis Exclusions
            commercialSpaceCosts={props.commercialSpaceCosts || 0}
            setCommercialSpaceCosts={props.setCommercialSpaceCosts || (() => {})}
            syndicationCosts={props.syndicationCosts || 0}
            setSyndicationCosts={props.setSyndicationCosts || (() => {})}
            marketingCosts={props.marketingCosts || 0}
            setMarketingCosts={props.setMarketingCosts || (() => {})}
            financingFees={props.financingFees || 0}
            setFinancingFees={props.setFinancingFees || (() => {})}
            bondIssuanceCosts={props.bondIssuanceCosts || 0}
            setBondIssuanceCosts={props.setBondIssuanceCosts || (() => {})}
            operatingDeficitReserve={props.operatingDeficitReserve || 0}
            setOperatingDeficitReserve={props.setOperatingDeficitReserve || (() => {})}
            replacementReserve={props.replacementReserve || 0}
            setReplacementReserve={props.setReplacementReserve || (() => {})}
            otherExclusions={props.otherExclusions || 0}
            setOtherExclusions={props.setOtherExclusions || (() => {})}
            formatCurrency={props.formatCurrency}
            isReadOnly={props.isReadOnly}
          />
        )}

        {/* Panel 4: Opportunity Zone */}
        <OpportunityZoneSection
          ozEnabled={props.ozEnabled}
          setOzEnabled={props.setOzEnabled}
          ozType={props.ozType}
          setOzType={props.setOzType}
          ozVersion={props.ozVersion}
          setOzVersion={props.setOzVersion}
          deferredCapitalGains={props.deferredCapitalGains}
          setDeferredCapitalGains={props.setDeferredCapitalGains}
          capitalGainsTaxRate={props.capitalGainsTaxRate}
          setCapitalGainsTaxRate={props.setCapitalGainsTaxRate}
          investorEquityAmount={investorEquityAmount}
          ltCapitalGainsRate={props.ltCapitalGainsRate}
          niitRate={props.niitRate}
          stateCapitalGainsRate={props.stateCapitalGainsRate}
          totalDepreciation={props.totalDepreciation}
          depreciationRecaptureRate={props.depreciationRecaptureRate}
          isReadOnly={props.taxSectionReadOnly || props.isReadOnly}
        />

        {/* Panel 5: Investor Profile - IMPL-035: StrategicOzSelector with OZ info */}
        <InvestorProfileSection
          investorState={props.investorState || ''}
          setInvestorState={props.setInvestorState || (() => {})}
          federalOrdinaryRate={props.federalTaxRate}
          setFederalOrdinaryRate={props.setFederalTaxRate}
          stateOrdinaryRate={props.stateTaxRate || 0}
          setStateOrdinaryRate={props.setStateTaxRate || (() => {})}
          federalCapitalGainsRate={props.ltCapitalGainsRate}
          setFederalCapitalGainsRate={props.setLtCapitalGainsRate}
          stateCapitalGainsRate={props.stateCapitalGainsRate}
          setStateCapitalGainsRate={props.setStateCapitalGainsRate}
          capitalGainsTaxRate={props.capitalGainsTaxRate}
          setCapitalGainsTaxRate={props.setCapitalGainsTaxRate}
          investorTrack={props.investorTrack || 'rep'}
          setInvestorTrack={props.setInvestorTrack || (() => {})}
          passiveGainType={props.passiveGainType || 'short-term'}
          setPassiveGainType={props.setPassiveGainType || (() => {})}
          annualIncome={props.annualIncome || 0}
          setAnnualIncome={props.setAnnualIncome || (() => {})}
          filingStatus={props.filingStatus || 'single'}
          setFilingStatus={props.setFilingStatus || (() => {})}
          isReadOnly={props.taxSectionReadOnly || props.isReadOnly}
        />

        {/* Panel 6: Projections */}
        <ProjectionsSection
          holdPeriod={props.holdPeriod}
          setHoldPeriod={props.setHoldPeriod}
          revenueGrowth={props.revenueGrowth}
          setRevenueGrowth={props.setRevenueGrowth}
          expenseGrowth={props.expenseGrowth}
          setExpenseGrowth={props.setExpenseGrowth}
          exitCapRate={props.exitCapRate}
          setExitCapRate={props.setExitCapRate}
          yearOneDepreciationPct={props.yearOneDepreciationPct}
          setYearOneDepreciationPct={props.setYearOneDepreciationPct}
          constructionDelayMonths={props.constructionDelayMonths}
          setConstructionDelayMonths={props.setConstructionDelayMonths}
          taxBenefitDelayMonths={props.taxBenefitDelayMonths}
          setTaxBenefitDelayMonths={props.setTaxBenefitDelayMonths}
          opexRatio={props.opexRatio}
          isReadOnly={props.isReadOnly}
        />

        {/* Panel 7: HDC Economics */}
        <HDCFeesSection
          hdcFeeRate={props.hdcFeeRate}
          setHdcFeeRate={props.setHdcFeeRate}
          hdcDeferredInterestRate={props.hdcDeferredInterestRate || 8}
          setHdcDeferredInterestRate={props.setHdcDeferredInterestRate || (() => {})}
          aumFeeEnabled={props.aumFeeEnabled}
          setAumFeeEnabled={props.setAumFeeEnabled}
          aumFeeRate={props.aumFeeRate}
          setAumFeeRate={props.setAumFeeRate}
          aumCurrentPayEnabled={props.aumCurrentPayEnabled}
          setAumCurrentPayEnabled={props.setAumCurrentPayEnabled}
          aumCurrentPayPct={props.aumCurrentPayPct}
          setAumCurrentPayPct={props.setAumCurrentPayPct}
          hdcAdvanceFinancing={props.hdcAdvanceFinancing}
          setHdcAdvanceFinancing={props.setHdcAdvanceFinancing}
          taxAdvanceDiscountRate={props.taxAdvanceDiscountRate}
          setTaxAdvanceDiscountRate={props.setTaxAdvanceDiscountRate}
          advanceFinancingRate={props.advanceFinancingRate}
          setAdvanceFinancingRate={props.setAdvanceFinancingRate}
          taxDeliveryMonths={props.taxDeliveryMonths}
          setTaxDeliveryMonths={props.setTaxDeliveryMonths}
          formatCurrency={props.formatCurrency}
          projectCost={props.projectCost}
          investorPromoteShare={props.investorPromoteShare}
          setInvestorPromoteShare={props.setInvestorPromoteShare}
          isReadOnly={props.isReadOnly}
        />

        {/* Investment Portal Settings Section - Hidden for investor portal */}
        {!props.hideInvestmentPortalSettings && (
          <InvestmentPortalSection
            isInvestorFacing={props.isInvestorFacing || false}
            setIsInvestorFacing={props.setIsInvestorFacing || (() => {})}
            dealDescription={props.dealDescription || ''}
            setDealDescription={props.setDealDescription || (() => {})}
            dealLocation={props.dealLocation || ''}
            setDealLocation={props.setDealLocation || (() => {})}
            dealLatitude={props.dealLatitude}
            setDealLatitude={props.setDealLatitude || (() => {})}
            dealLongitude={props.dealLongitude}
            setDealLongitude={props.setDealLongitude || (() => {})}
            units={props.units || 0}
            setUnits={props.setUnits || (() => {})}
            affordabilityMix={props.affordabilityMix || ''}
            setAffordabilityMix={props.setAffordabilityMix || (() => {})}
            projectStatus={props.projectStatus || 'available'}
            setProjectStatus={props.setProjectStatus || (() => {})}
            minimumInvestment={props.minimumInvestment || 0}
            setMinimumInvestment={props.setMinimumInvestment || (() => {})}
            dealImageUrl={props.dealImageUrl || ''}
            setDealImageUrl={props.setDealImageUrl || (() => {})}
            isReadOnly={props.isReadOnly}
          />
        )}
      </div>
    </div>
  );
};

export default HDCInputsComponent;
