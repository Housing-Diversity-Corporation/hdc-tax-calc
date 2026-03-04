import React, { useMemo, useState, useCallback, useEffect } from 'react';
// New 7-panel structure (IMPL-015)
import ProjectDefinitionSection from './inputs/ProjectDefinitionSection';
import CapitalStructureSection from './inputs/CapitalStructureSection';
import TaxCreditsSection from './inputs/TaxCreditsSection';
import OpportunityZoneSection from './inputs/OpportunityZoneSection';
import InvestorProfileSection from './inputs/InvestorProfileSection';
import ProjectionsSection from './inputs/ProjectionsSection';
import HDCFeesSection from './inputs/HDCFeesSection';
import InvestmentPortalSection from './inputs/InvestmentPortalSection';
import SaveConfiguration, { SaveConfigMetadata } from './inputs/SaveConfiguration';
import PresetSelector, { UpdateNotification } from './inputs/PresetSelector';
// Legacy imports (kept for save functionality)
import { calculatorService, CalculatorConfiguration } from '../../services/taxbenefits/calculatorService';
import { tokenService } from '../../services/api';
import { userService } from '../../services/userService';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { dbpService } from '../../services/dbpService';
import { extractDealBenefitProfile } from '../../utils/taxbenefits/dealBenefitProfile';
import '../../styles/taxbenefits/hdcCalculator.css';
import { InvestorAnalysisResults, CashFlowItem, CalculationParams, ComputedTimeline } from '../../types/taxbenefits';
import { roundForDisplay } from '../../utils/taxbenefits/formatters';

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

  // Timing Architecture (IMPL-114)
  investmentDate?: string;
  setInvestmentDate?: (value: string) => void;
  pisDateOverride?: string | null;
  setPisDateOverride?: (value: string | null) => void;
  exitExtensionMonths?: number;
  setExitExtensionMonths?: (value: number) => void;
  electDeferCreditPeriod?: boolean;
  setElectDeferCreditPeriod?: (value: boolean) => void;
  computedTimeline?: ComputedTimeline | null;

  // Projections — computed hold period (read-only)
  totalInvestmentYears: number;
  holdFromPIS: number;
  exitMonth: number; // IMPL-087
  setExitMonth: (value: number) => void;
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  setNoiGrowthRate: (value: number) => void;
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

  // Income Composition (Phase A2 - Tax Utilization)
  annualOrdinaryIncome?: number;
  setAnnualOrdinaryIncome?: (value: number) => void;
  annualPassiveIncome?: number;
  setAnnualPassiveIncome?: (value: number) => void;
  annualPortfolioIncome?: number;
  setAnnualPortfolioIncome?: (value: number) => void;
  groupingElection?: boolean;
  setGroupingElection?: (value: boolean) => void;
  incomeFieldsEditable?: boolean;

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
  // Current user ID for shared config classification
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  const [updateNotification, setUpdateNotification] = useState<UpdateNotification | null>(null);

  useEffect(() => {
    const cached = userService.getCachedUser();
    if (cached) {
      setCurrentUserId(cached.id);
    } else if (tokenService.isAuthenticated()) {
      userService.getCurrentUser().then(user => {
        if (user) setCurrentUserId(user.id);
      });
    }
  }, []);

  // Property Presets panel state
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);
  const [loadedPresetName, setLoadedPresetName] = useState<string>('');
  const [loadedConfigOwnerId, setLoadedConfigOwnerId] = useState<number | null>(null);
  const [inputSnapshot, setInputSnapshot] = useState<string | null>(null);
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);
  const [panelDeleteOpen, setPanelDeleteOpen] = useState(false);
  const [presetPanelExpanded, setPresetPanelExpanded] = useState(true);

  // Input fingerprint for dirty detection
  const currentFingerprint = useMemo(() => JSON.stringify({
    pc: props.projectCost, pd: props.predevelopmentCosts, lv: props.landValue,
    noi: props.yearOneNOI, dep: props.yearOneDepreciationPct, ng: props.noiGrowthRate,
    ec: props.exitCapRate, hp: props.totalInvestmentYears, ie: props.investorEquityPct,
    sd: props.seniorDebtPct, oz: props.ozEnabled, lh: props.lihtcEnabled,
    st: props.selectedState, hf: props.hdcFeeRate,
  }), [props.projectCost, props.predevelopmentCosts, props.landValue, props.yearOneNOI,
       props.yearOneDepreciationPct, props.noiGrowthRate, props.exitCapRate, props.totalInvestmentYears,
       props.investorEquityPct, props.seniorDebtPct, props.ozEnabled, props.lihtcEnabled,
       props.selectedState, props.hdcFeeRate]);

  const isDirty = loadedPresetId !== null && inputSnapshot !== null && currentFingerprint !== inputSnapshot;
  const isOwnConfig = loadedConfigOwnerId === null || currentUserId === undefined || loadedConfigOwnerId === currentUserId;

  const handlePresetSelect = async (presetId: string) => {
    // Unified conduit loading: both presets (preset-{id}) and configs (config-{id})
    // load via the same API since @JsonUnwrapped produces identical flat JSON
    let conduitId: number;
    if (presetId.startsWith('preset-')) {
      conduitId = parseInt(presetId.replace('preset-', ''));
    } else if (presetId.startsWith('config-')) {
      conduitId = parseInt(presetId.replace('config-', ''));
    } else {
      return;
    }

    try {
      const config = await calculatorService.getConduitById(conduitId);
      if (!config) return;

      // IMPL-036: Suppress auto-balance during config loading to preserve loaded values
      props.startConfigLoading?.();

      // Apply configuration values (same flat JSON for both presets and configs)
      props.setProjectCost(config.projectCost ?? 10);
      props.setPredevelopmentCosts(config.predevelopmentCosts ?? 0);
      props.setLandValue(config.landValue ?? 0);
      props.setYearOneNOI(config.yearOneNOI ?? 0.5);
      props.setYearOneDepreciationPct(config.yearOneDepreciationPct ?? 25);
      props.setNoiGrowthRate(config.noiGrowthRate ?? 3);
      props.setExitCapRate(config.exitCapRate ?? 6);
      // holdPeriod is now computed — ignore on load
      props.setExitMonth?.(config.exitMonth ?? 7); // IMPL-087

      // Capital structure
      props.setInvestorEquityPct(config.investorEquityPct ?? 0);
      props.setPhilanthropicEquityPct(config.philanthropicEquityPct ?? 0);
      props.setSeniorDebtPct(config.seniorDebtPct ?? 0);
      props.setSeniorDebtRate(config.seniorDebtRate ?? 0);
      props.setSeniorDebtAmortization(config.seniorDebtAmortization ?? 30);
      props.setSeniorDebtIOYears?.(config.seniorDebtIOYears ?? 0);
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
      // HDC Debt Fund
      props.setHdcDebtFundPct?.(config.hdcDebtFundPct ?? 0);
      props.setHdcDebtFundPikRate?.(config.hdcDebtFundPikRate ?? 8);
      props.setHdcDebtFundCurrentPayEnabled?.(config.hdcDebtFundCurrentPayEnabled ?? false);
      props.setHdcDebtFundCurrentPayPct?.(config.hdcDebtFundCurrentPayPct ?? 50);
      // Sub-debt priority
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
        props.setOzEnabled?.(config.ozEnabled ?? true);
        props.setOzType?.(config.ozType ?? 'standard');
        props.setOzVersion?.(config.ozVersion ?? '2.0');
        props.setDeferredCapitalGains?.(config.deferredCapitalGains ?? 0);
        props.setCapitalGainsTaxRate?.(config.capitalGainsTaxRate ?? 23.8);
      }

      // Additional fields - only update if not in read-only mode
      if (!props.taxSectionReadOnly) {
        props.setStateTaxRate?.(config.stateTaxRate ?? 0);
        props.setInvestorTrack?.(config.investorTrack ?? 'rep');
        props.setPassiveGainType?.(config.passiveGainType ?? 'short-term');
        props.setAnnualIncome?.(config.annualIncome ?? 0);
        props.setFilingStatus?.(config.filingStatus ?? 'single');
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
      // HDC Platform Mode
      props.setHdcPlatformMode?.(config.hdcPlatformMode ?? 'traditional');
      // Private Activity Bonds (PABs)
      props.setPabEnabled?.(config.pabEnabled ?? false);
      props.setPabPctOfEligibleBasis?.(config.pabPctOfEligibleBasis ?? 30);
      props.setPabRate?.(config.pabRate ?? 4.5);
      props.setPabAmortization?.(config.pabAmortization ?? 40);
      props.setPabIOYears?.(config.pabIOYears ?? 0);
      // Federal LIHTC
      props.setLihtcEnabled?.(config.lihtcEnabled ?? true);
      props.setApplicableFraction?.(config.applicableFraction ?? 100);
      props.setCreditRate?.(config.creditRate ?? 0.04);
      props.setPlacedInServiceMonth?.(config.placedInServiceMonth ?? 7);
      props.setDdaQctBoost?.(config.ddaQctBoost ?? false);
      // State LIHTC
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
      // Eligible Basis Exclusions
      props.setCommercialSpaceCosts?.(config.commercialSpaceCosts ?? 0);
      props.setSyndicationCosts?.(config.syndicationCosts ?? 0);
      props.setMarketingCosts?.(config.marketingCosts ?? 0);
      props.setFinancingFees?.(config.financingFees ?? 0);
      props.setBondIssuanceCosts?.(config.bondIssuanceCosts ?? 0);
      props.setOperatingDeficitReserve?.(config.operatingDeficitReserve ?? 0);
      props.setReplacementReserve?.(config.replacementReserve ?? 0);
      props.setOtherExclusions?.(config.otherExclusions ?? 0);
      // AUM Current Pay
      props.setAumCurrentPayEnabled?.(config.aumCurrentPayEnabled ?? false);
      props.setAumCurrentPayPct?.(config.aumCurrentPayPct ?? 50);
      // HDC Deferred Interest Rate
      props.setHdcDeferredInterestRate?.(config.hdcDeferredInterestRate ?? 8);
      // Income Composition
      props.setAnnualOrdinaryIncome?.(config.annualOrdinaryIncome ?? 750000);
      props.setAnnualPassiveIncome?.(config.annualPassiveIncome ?? 0);
      props.setAnnualPortfolioIncome?.(config.annualPortfolioIncome ?? 0);
      props.setGroupingElection?.(config.groupingElection ?? false);

      // IMPL-036: Re-enable auto-balance after config loading is complete
      props.endConfigLoading?.();

      // Save snapshot for dirty detection
      setLoadedPresetId(presetId);
      setLoadedPresetName(config.configurationName || config.dealName || 'Configuration');
      setLoadedConfigOwnerId(config.userId ?? null);
      setInputSnapshot(JSON.stringify({
        pc: config.projectCost ?? 10, pd: config.predevelopmentCosts ?? 0, lv: config.landValue ?? 0,
        noi: config.yearOneNOI ?? 0.5, dep: config.yearOneDepreciationPct ?? 25, ng: config.noiGrowthRate ?? 3,
        ec: config.exitCapRate ?? 6, hp: config.holdPeriod ?? 10, ie: config.investorEquityPct ?? 0,
        sd: config.seniorDebtPct ?? 0, oz: config.ozEnabled ?? true, lh: config.lihtcEnabled ?? true,
        st: config.selectedState ?? 'CA', hf: config.hdcFeeRate ?? 10,
      }));

      if (props.onPresetSelect) {
        props.onPresetSelect(presetId);
      }
    } catch (error) {
      console.error('Error loading conduit:', error);
      // IMPL-036: Ensure we re-enable auto-balance even on error
      props.endConfigLoading?.();
    }
  };

  const autoTags = useMemo(() => {
    const tags: string[] = [];
    if (props.ozEnabled) tags.push('OZ');
    if (props.lihtcEnabled) tags.push('LIHTC');
    return tags;
  }, [props.ozEnabled, props.lihtcEnabled]);

  const handleUpdatesDetected = useCallback((notification: UpdateNotification | null) => {
    setUpdateNotification(notification);
  }, []);

  const handleReset = useCallback(() => {
    if (loadedPresetId) handlePresetSelect(loadedPresetId);
  }, [loadedPresetId]);

  const confirmDeleteFromPanel = useCallback(async () => {
    if (!loadedPresetId) return;
    try {
      const id = parseInt(loadedPresetId.replace(/^(config|preset)-/, ''));
      if (loadedPresetId.startsWith('preset-')) {
        await calculatorService.deletePreset(id);
      } else {
        await calculatorService.deleteConfiguration(id);
      }
      toast.success('Deleted', { description: `"${loadedPresetName}" has been deleted.` });
      setLoadedPresetId(null);
      setLoadedPresetName('');
      setLoadedConfigOwnerId(null);
      setInputSnapshot(null);
      setPresetRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Delete Failed', { description: 'Please try again.' });
    } finally {
      setPanelDeleteOpen(false);
    }
  }, [loadedPresetId, loadedPresetName]);

  const handleSaveConfiguration = async (configName: string, metadata?: SaveConfigMetadata) => {
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
        // ISS-068c: Single NOI growth rate
        noiGrowthRate: props.noiGrowthRate,
        exitCapRate: props.exitCapRate,
        holdPeriod: props.totalInvestmentYears, // Read-only snapshot for historical comparison
        exitMonth: props.exitMonth, // IMPL-087
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
        // ISS-057: Investor Information
        annualIncome: props.annualIncome,
        filingStatus: props.filingStatus,
        includeDepreciationSchedule: props.includeDepreciationSchedule,
        w2Income: props.w2Income,
        businessIncome: props.businessIncome,
        iraBalance: props.iraBalance,
        passiveIncome: props.passiveIncome,
        assetSaleGain: props.assetSaleGain,
        // Income Composition
        annualOrdinaryIncome: props.annualOrdinaryIncome,
        annualPassiveIncome: props.annualPassiveIncome,
        annualPortfolioIncome: props.annualPortfolioIncome,
        groupingElection: props.groupingElection,
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

      // Sharing & classification metadata
      if (metadata) {
        currentConfig.isShared = metadata.isShared;
        currentConfig.statusCategory = metadata.statusCategory;
        currentConfig.tags = metadata.tags.join(',');
      }

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

      // Calculated results are no longer stored — the engine is deterministic
      // and recreates them from inputs on every load

      // Update existing config (PUT) if we have a loaded config; otherwise create new (POST)
      let savedConfig;
      if (loadedPresetId && loadedPresetId.startsWith('config-')) {
        const configId = parseInt(loadedPresetId.replace('config-', ''));
        savedConfig = await calculatorService.updateConfiguration(configId, currentConfig);
      } else {
        savedConfig = await calculatorService.saveConfiguration(currentConfig);
      }

      // IMPL-084: Extract and persist DealBenefitProfile when investor-facing
      if (
        props.isInvestorFacing &&
        savedConfig?.id &&
        props.mainAnalysisResults?.depreciationSchedule &&
        props.calculatedCashFlows
      ) {
        try {
          // Derive creditPath from syndicationRate (same logic as useHDCCalculations)
          const synRate = props.syndicationRate || 0;
          const creditPath: 'syndicated' | 'direct_use' | 'none' =
            synRate === 0 ? 'none' : synRate === 1.0 ? 'direct_use' : 'syndicated';

          const extractionInputs = {
            dealName: configName,
            selectedState: props.selectedState,
            fundEntryYear: new Date().getFullYear(),
            projectCost: props.projectCost,
            holdPeriod: props.totalInvestmentYears,
            ozEnabled: props.ozEnabled,
            placedInServiceMonth: props.placedInServiceMonth,
            seniorDebtPct: props.seniorDebtPct,
            philanthropicDebtPct: props.philDebtPct,
            investorEquityPct: props.investorEquityPct,
            ltCapitalGainsRate: props.ltCapitalGainsRate,
            niitRate: props.niitRate,
            yearOneDepreciationPct: props.yearOneDepreciationPct,
            stateLIHTCIntegration: { creditPath, syndicationRate: synRate },
          } as CalculationParams;

          const dbp = extractDealBenefitProfile(
            extractionInputs,
            props.mainAnalysisResults,
            props.mainAnalysisResults.depreciationSchedule,
            props.calculatedCashFlows,
            savedConfig.id
          );

          await dbpService.save(savedConfig.id, dbp);
        } catch (dbpError) {
          // DBP extraction is supplementary — don't block the config save
          console.error('DBP extraction failed (config saved successfully):', dbpError);
        }
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  };

  // Calculate investor equity amount for OZ section
  // ISS-066: Round to prevent floating-point display artifacts (e.g., 29.099999999999998 → 29.1)
  const investorEquityAmount = roundForDisplay(
    (props.projectCost + props.interestReserveAmount) * (props.investorEquityPct / 100)
  );

  return (
    <div className="p-4 md:p-6 rounded-lg shadow h-full hdc-inputs-container"
         style={{
          borderTop: '4px solid #7FBD45',
          borderBottom: '4px solid #7FBD45',
          borderRadius:'5px',
          background: 'rgba(127, 189, 69, 0.1)'}}
    >
      <h2 className="text-lg sm:text-xl font-semibold" style={{margin: '0 0 1rem 0', color: '#407F7F'}}>Inputs</h2>

      {!props.isReadOnly && (
        <div className="hdc-calculator" style={{ marginBottom: '1.5rem' }}>
          <div className="hdc-section" style={{ borderLeft: '4px solid var(--hdc-sushi)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: presetPanelExpanded ? '0.625rem' : 0, paddingBottom: '0.375rem', borderBottom: '2px solid var(--hdc-sushi)' }}>
              <h3
                className="hdc-section-header"
                style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => setPresetPanelExpanded(!presetPanelExpanded)}
              >
                <span style={{ marginRight: '0.5rem' }}>{presetPanelExpanded ? '▼' : '▶'}</span>
                Property Presets
                {updateNotification && (updateNotification.green > 0 || updateNotification.yellow > 0) && (
                  <sup
                    className="hdc-btn-entrance"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: updateNotification.green > 0 ? '#7fbd45' : '#bfb05e',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      marginLeft: '3px',
                      lineHeight: 1,
                      letterSpacing: '-0.5px',
                      paddingTop: '0.5px',
                    }}
                    title={updateNotification.green > 0 ? 'Collaborator updates' : 'Shared updates from others'}
                  >
                    +{updateNotification.green + updateNotification.yellow}
                  </sup>
                )}
              </h3>
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-1">
                  {loadedPresetId && !isDirty && isOwnConfig && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground hdc-btn-entrance"
                          onClick={() => setPanelDeleteOpen(true)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Delete configuration</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {!props.hideSaveConfiguration && (
                    <div className={loadedPresetId && isDirty ? "hdc-btn-entrance" : ""}>
                      <SaveConfiguration
                        onSaveConfiguration={handleSaveConfiguration}
                        onConfigurationSaved={() => setPresetRefreshTrigger(prev => prev + 1)}
                        buttonStyle="icon"
                        buttonContainerStyle={{ height: '1.75rem', width: '1.75rem' }}
                        autoTags={autoTags}
                        stateCode={props.selectedState}
                        lockedName={!isOwnConfig ? loadedPresetName : undefined}
                      />
                    </div>
                  )}
                  {loadedPresetId && isDirty && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hdc-btn-entrance"
                          style={{ animationDelay: '0.1s' }}
                          onClick={handleReset}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Reset to saved configuration</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>
            {presetPanelExpanded && (
              <PresetSelector
                onPresetSelect={handlePresetSelect}
                hideLabel
                hideDelete
                refreshTrigger={presetRefreshTrigger}
                currentUserId={currentUserId}
                onUpdatesDetected={handleUpdatesDetected}
              />
            )}
          </div>
        </div>
      )}

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
          selectedState={props.selectedState}
          setSelectedState={props.handleStateChange}
          formatCurrency={props.formatCurrency}
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

        {/* Panel 3: Projections */}
        <ProjectionsSection
          totalInvestmentYears={props.totalInvestmentYears}
          holdFromPIS={props.holdFromPIS}
          exitMonth={props.exitMonth}
          setExitMonth={props.setExitMonth}
          noiGrowthRate={props.noiGrowthRate}
          setNoiGrowthRate={props.setNoiGrowthRate}
          exitCapRate={props.exitCapRate}
          setExitCapRate={props.setExitCapRate}
          yearOneDepreciationPct={props.yearOneDepreciationPct}
          setYearOneDepreciationPct={props.setYearOneDepreciationPct}
          constructionDelayMonths={props.constructionDelayMonths}
          setConstructionDelayMonths={props.setConstructionDelayMonths}
          taxBenefitDelayMonths={props.taxBenefitDelayMonths}
          setTaxBenefitDelayMonths={props.setTaxBenefitDelayMonths}
          investmentDate={props.investmentDate || ''}
          setInvestmentDate={props.setInvestmentDate || (() => {})}
          exitExtensionMonths={props.exitExtensionMonths || 0}
          setExitExtensionMonths={props.setExitExtensionMonths || (() => {})}
          computedTimeline={props.computedTimeline || null}
          isReadOnly={props.isReadOnly}
        />

        {/* Panel 4: Tax Credits (Federal + State LIHTC consolidated) */}
        {props.lihtcEnabled !== undefined && (
          <TaxCreditsSection
            // Timing Architecture (IMPL-114)
            pisDateOverride={props.pisDateOverride || null}
            setPisDateOverride={props.setPisDateOverride || (() => {})}
            electDeferCreditPeriod={props.electDeferCreditPeriod || false}
            setElectDeferCreditPeriod={props.setElectDeferCreditPeriod || (() => {})}
            computedTimeline={props.computedTimeline || null}
            constructionDelayMonths={props.constructionDelayMonths}
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

        {/* Panel 5: Opportunity Zone */}
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
          isReadOnly={props.taxSectionReadOnly || props.isReadOnly}
        />

        {/* Panel 6: Investor Profile - IMPL-035: StrategicOzSelector with OZ info */}
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
          annualOrdinaryIncome={props.annualOrdinaryIncome ?? 750000}
          setAnnualOrdinaryIncome={props.setAnnualOrdinaryIncome}
          annualPassiveIncome={props.annualPassiveIncome ?? 0}
          setAnnualPassiveIncome={props.setAnnualPassiveIncome}
          annualPortfolioIncome={props.annualPortfolioIncome ?? 0}
          setAnnualPortfolioIncome={props.setAnnualPortfolioIncome}
          groupingElection={props.groupingElection ?? false}
          setGroupingElection={props.setGroupingElection}
          incomeFieldsEditable={props.incomeFieldsEditable}
          isReadOnly={props.taxSectionReadOnly || props.isReadOnly}
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

      <AlertDialog open={panelDeleteOpen} onOpenChange={setPanelDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{loadedPresetName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFromPanel} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HDCInputsComponent;
