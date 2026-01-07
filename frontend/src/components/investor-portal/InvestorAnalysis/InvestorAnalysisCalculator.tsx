import { useState, useEffect } from 'react';
import { useHDCState } from '../../../hooks/taxbenefits/useHDCState';
import { useHDCCalculations } from '../../../hooks/taxbenefits/useHDCCalculations';
import { CONFORMING_STATES } from '../../../utils/taxbenefits/constants';
import { formatCurrencyMillions } from '../../../utils/taxbenefits/formatters';
import HDCInputsComponent from '../../taxbenefits/HDCInputsComponent';
import HDCResultsComponent from '../../taxbenefits/HDCResultsComponent';
import type { InvestorTaxInfo } from '../../../types/investorTaxInfo';
import type { InvestorAnalysisResults, CalculationParams } from '../../../types/taxbenefits';

import { calculatorService } from '../../../services/taxbenefits/calculatorService';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import InvestorAnalysisHighlevelMetrics from './InvestorAnalysisHighlevelMetrics';
import LocationAnalysisSection from './LocationAnalysisSection';

interface InvestorAnalysisCalculatorProps {
  taxProfile?: InvestorTaxInfo | null;
  dealId?: string | number;
  isReadOnly?: boolean;
  onCalculationComplete?: (results: InvestorAnalysisResults, investmentAmount: number) => void;  // Callback when calculation is complete
}

const InvestorAnalysisCalculator: React.FC<InvestorAnalysisCalculatorProps> = ({ taxProfile, dealId, isReadOnly = false, onCalculationComplete }) => {
  // Track loaded configuration name
  const [loadedConfigName, setLoadedConfigName] = useState<string>('');

  // State for collapsible sections
  const [configDetailsExpanded, setConfigDetailsExpanded] = useState<boolean>(false);
  const [debugInfoExpanded, setDebugInfoExpanded] = useState<boolean>(false);

  // Get all state and state setters from the custom hook
  const {
    // Basic project parameters
    projectCost, setProjectCost,
    predevelopmentCosts, setPredevelopmentCosts,
    landValue, setLandValue,
    yearOneNOI, setYearOneNOI,
    yearOneDepreciationPct, setYearOneDepreciationPct,
    
    // Capital structure
    autoBalanceCapital, setAutoBalanceCapital,
    investorEquityRatio, setInvestorEquityRatio,
    investorEquityPct, setInvestorEquityPct,
    philanthropicEquityPct, setPhilanthropicEquityPct,
    seniorDebtPct, setSeniorDebtPct,
    seniorDebtRate, setSeniorDebtRate,
    seniorDebtAmortization, setSeniorDebtAmortization,
    seniorDebtIOYears, setSeniorDebtIOYears,
    philDebtPct, setPhilDebtPct,
    philDebtRate, setPhilDebtRate,
    philDebtAmortization, setPhilDebtAmortization,
    philCurrentPayEnabled, setPhilCurrentPayEnabled,
    philCurrentPayPct, setPhilCurrentPayPct,
    interestReserveEnabled, setInterestReserveEnabled,
    interestReserveMonths, setInterestReserveMonths,
    hdcSubDebtPct, setHdcSubDebtPct,
    hdcSubDebtPikRate, setHdcSubDebtPikRate,
    pikCurrentPayEnabled, setPikCurrentPayEnabled,
    pikCurrentPayPct, setPikCurrentPayPct,
    investorSubDebtPct, setInvestorSubDebtPct,
    investorSubDebtPikRate, setInvestorSubDebtPikRate,
    investorPikCurrentPayEnabled, setInvestorPikCurrentPayEnabled,
    investorPikCurrentPayPct, setInvestorPikCurrentPayPct,
    outsideInvestorSubDebtPct, setOutsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate, setOutsideInvestorSubDebtPikRate,
    outsideInvestorPikCurrentPayEnabled, setOutsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct, setOutsideInvestorPikCurrentPayPct,
    subDebtPriority, setSubDebtPriority,

    // Projections
    holdPeriod, setHoldPeriod,
    revenueGrowth, setRevenueGrowth,
    expenseGrowth, setExpenseGrowth,
    opexRatio, setOpexRatio,
    exitCapRate, setExitCapRate,
    investorPromoteShare, setInvestorPromoteShare,
    
    // Tax parameters
    federalTaxRate, setFederalTaxRate,
    stateTaxRate, setStateTaxRate,
    ltCapitalGainsRate, setLtCapitalGainsRate,
    niitRate, setNiitRate,
    selectedState, setSelectedState,
    projectLocation, setProjectLocation,
    stateCapitalGainsRate, setStateCapitalGainsRate,
    depreciationRecaptureRate,

    // HDC Fees
    hdcFeeRate, setHdcFeeRate,
    hdcDeferredInterestRate, setHdcDeferredInterestRate,
    aumFeeEnabled, setAumFeeEnabled,
    aumFeeRate, setAumFeeRate,
    aumCurrentPayEnabled, setAumCurrentPayEnabled,
    aumCurrentPayPct, setAumCurrentPayPct,
    hdcPlatformMode, setHdcPlatformMode,
    hdcAdvanceFinancing, setHdcAdvanceFinancing,
    taxAdvanceDiscountRate, setTaxAdvanceDiscountRate,
    advanceFinancingRate, setAdvanceFinancingRate,
    taxDeliveryMonths, setTaxDeliveryMonths,

    // Tax Timing
    constructionDelayMonths, setConstructionDelayMonths,
    taxBenefitDelayMonths, setTaxBenefitDelayMonths,

    // Opportunity Zone
    ozEnabled, setOzEnabled,
    ozType, setOzType,
    ozVersion, setOzVersion,
    ozDeferredCapitalGains, setOzDeferredCapitalGains,
    ozCapitalGainsTaxRate, setOzCapitalGainsTaxRate,

    // Investor Track and Passive Gains
    investorTrack, setInvestorTrack,
    passiveGainType, setPassiveGainType,

    // Investor Information
    annualIncome, setAnnualIncome,
    filingStatus, setFilingStatus,

    // Tax Planning Analysis
    includeDepreciationSchedule, setIncludeDepreciationSchedule,
    w2Income, setW2Income,
    businessIncome, setBusinessIncome,
    iraBalance, setIraBalance,
    passiveIncome, setPassiveIncome,
    assetSaleGain, setAssetSaleGain,

    // Investment Portal Settings
    isInvestorFacing, setIsInvestorFacing,
    dealDescription, setDealDescription,
    dealLocation, setDealLocation,
    dealLatitude, setDealLatitude,
    dealLongitude, setDealLongitude,
    units, setUnits,
    affordabilityMix, setAffordabilityMix,
    projectStatus, setProjectStatus,
    minimumInvestment, setMinimumInvestment,
    dealImageUrl, setDealImageUrl,

    // Expandable sections
    taxCalculationExpanded, setTaxCalculationExpanded,
    taxOffsetExpanded, setTaxOffsetExpanded,
    depreciationScheduleExpanded, setDepreciationScheduleExpanded,

    // Calculated values
    totalCapitalStructure
  } = useHDCState();

  // DEBUG: Check if setters exist right after useHDCState
  console.log('🔧 After useHDCState:', {
    setDealLatitude: typeof setDealLatitude,
    setDealLongitude: typeof setDealLongitude,
    setDealLatitudeValue: setDealLatitude,
    setDealLongitudeValue: setDealLongitude
  });

  // Apply tax profile data when provided
  // IMPORTANT: This must take precedence over configuration loading for tax-related fields
  useEffect(() => {
    if (taxProfile) {
      console.log('📋 INVESTOR TAX PROFILE FROM DATABASE (Re-applying after any state changes):', taxProfile);

      // Apply tax rates from investor profile
      // For Non-REP with long-term gains, use capital gains rate as federal rate
      const isNonRep = taxProfile.investorTrack === 'non-rep';

      // The database stores rates as percentages already (22 for 22%, not 0.22)
      // So we can use them directly
      const federalOrdinaryRate = taxProfile.federalOrdinaryRate || 37;
      const federalCapitalGainsRate = federalOrdinaryRate; // Use ordinary rate for capital gains
      const stateOrdinaryRate = taxProfile.stateOrdinaryRate || 0;
      const stateCapitalGainsRate = taxProfile.stateCapitalGainsRate || 0;

      // Always set the ordinary rate for the dropdown display
      console.log('Setting federal tax rate to ordinary rate:', federalOrdinaryRate);
      setFederalTaxRate(federalOrdinaryRate);

      // Apply state and capital gains rates (as percentages)
      // Don't use handleStateChange as it overrides with CONFORMING_STATES values
      // Instead, directly set the state and rates from tax profile
      setSelectedState(taxProfile.selectedState || 'NY');
      setStateTaxRate(stateOrdinaryRate);
      setStateCapitalGainsRate(stateCapitalGainsRate);
      setLtCapitalGainsRate(federalCapitalGainsRate);

      // Apply investor track (using the enum values expected by state)
      console.log('Setting investor track to:', taxProfile.investorTrack);
      setInvestorTrack(taxProfile.investorTrack as 'rep' | 'non-rep');

      if (taxProfile.passiveGainType) {
        console.log('Setting passive gain type to:', taxProfile.passiveGainType);
        setPassiveGainType(taxProfile.passiveGainType as 'short-term' | 'long-term');
      }

      // Apply investor information
      if (taxProfile.annualIncome !== undefined) {
        console.log('Setting annual income to:', taxProfile.annualIncome);
        setAnnualIncome(taxProfile.annualIncome);
      }

      if (taxProfile.filingStatus) {
        console.log('Setting filing status to:', taxProfile.filingStatus);
        setFilingStatus(taxProfile.filingStatus as 'single' | 'married');
      }

      // Apply NIIT rate - Non-REP investors pay 3.8% NIIT
      if (isNonRep) {
        setNiitRate(3.8); // 3.8% NIIT for Non-REP investors (as percentage)
      } else {
        setNiitRate(0); // REP investors don't pay NIIT
      }

      // Apply OZ settings
      setOzEnabled(true); // Always enabled for investor portal
      setOzType((taxProfile.ozType || 'standard') as 'standard' | 'rural');
      setOzDeferredCapitalGains(taxProfile.deferredCapitalGains || 0);

      // Capital gains tax rate for OZ calculations (already in percentage format)
      const ozCapitalGainsRate = taxProfile.capitalGainsTaxRate || federalCapitalGainsRate;
      setOzCapitalGainsTaxRate(ozCapitalGainsRate);

      console.log('📊 VALUES BEING SET TO STATE:', {
        federalOrdinaryRate,
        federalCapitalGainsRate,
        stateOrdinaryRate,
        stateCapitalGainsRate,
        ltCapitalGainsRate: federalCapitalGainsRate,
        niitRate: isNonRep ? 3.8 : 0,
        investorTrack: taxProfile.investorTrack,
        passiveGainType: taxProfile.passiveGainType,
        ozType: taxProfile.ozType,
        ozCapitalGainsRate
      });
    }
  }, [taxProfile, loadedConfigName]); // Re-run when taxProfile changes OR when config finishes loading

  // Debug: Log coordinate changes
  useEffect(() => {
    console.log('🔍 Coordinates changed:', {
      dealLatitude,
      dealLongitude,
      setDealLatitude: typeof setDealLatitude,
      setDealLongitude: typeof setDealLongitude
    });
  }, [dealLatitude, dealLongitude]);

  // Load configuration when dealId is provided
  useEffect(() => {
    const loadConfiguration = async () => {
      if (dealId) {
        try {
          console.log('Loading configuration for deal:', dealId);
          const config = await calculatorService.getConfigurationById(Number(dealId));

          if (config) {
            console.log('Configuration loaded:', config);

            // Set the configuration name for display
            setLoadedConfigName(config.configurationName || `Configuration #${config.id}`);

            // Load all the configuration values into state
            setProjectCost(config.projectCost || 0);
            setPredevelopmentCosts(config.predevelopmentCosts || 0);
            setLandValue(config.landValue || 0);
            setYearOneNOI(config.yearOneNOI || 0);
            setYearOneDepreciationPct(config.yearOneDepreciationPct || 0);
            setHoldPeriod(config.holdPeriod || 10);
            setRevenueGrowth(config.revenueGrowth || 0);
            setExpenseGrowth(config.expenseGrowth || 0);
            setExitCapRate(config.exitCapRate || 0);
            setOpexRatio(config.opexRatio || 0);

            // Capital structure
            setInvestorEquityPct(config.investorEquityPct || 0);
            setPhilanthropicEquityPct(config.philanthropicEquityPct || 0);
            setSeniorDebtPct(config.seniorDebtPct || 0);
            setSeniorDebtRate(config.seniorDebtRate || 0);
            setSeniorDebtAmortization(config.seniorDebtAmortization || 0);
            setPhilDebtPct(config.philDebtPct || 0);
            setPhilDebtRate(config.philDebtRate || 0);
            setPhilDebtAmortization(config.philDebtAmortization || 0);
            setHdcSubDebtPct(config.hdcSubDebtPct || 0);
            setHdcSubDebtPikRate(config.hdcSubDebtPikRate || 0);
            setInvestorSubDebtPct(config.investorSubDebtPct || 0);
            setInvestorSubDebtPikRate(config.investorSubDebtPikRate || 0);
            setOutsideInvestorSubDebtPct(config.outsideInvestorSubDebtPct || 0);
            setOutsideInvestorSubDebtPikRate(config.outsideInvestorSubDebtPikRate || 0);

            // HDC Fees
            setHdcFeeRate(config.hdcFeeRate || 0);
            setAumFeeEnabled(config.aumFeeEnabled || false);
            setAumFeeRate(config.aumFeeRate || 0);
            setInvestorPromoteShare(config.investorPromoteShare || 0);

            // Interest reserve
            setInterestReserveEnabled(config.interestReserveEnabled || false);
            setInterestReserveMonths(config.interestReserveMonths || 0);

            // Current pay settings
            setPhilCurrentPayEnabled(config.philCurrentPayEnabled || false);
            setPhilCurrentPayPct(config.philCurrentPayPct || 0);
            setPikCurrentPayEnabled(config.pikCurrentPayEnabled || false);
            setPikCurrentPayPct(config.pikCurrentPayPct || 0);
            setInvestorPikCurrentPayEnabled(config.investorPikCurrentPayEnabled || false);
            setInvestorPikCurrentPayPct(config.investorPikCurrentPayPct || 0);
            setOutsideInvestorPikCurrentPayEnabled(config.outsideInvestorPikCurrentPayEnabled || false);
            setOutsideInvestorPikCurrentPayPct(config.outsideInvestorPikCurrentPayPct || 0);
            setAumCurrentPayEnabled(config.aumCurrentPayEnabled || false);
            setAumCurrentPayPct(config.aumCurrentPayPct || 0);

            // Timing
            setConstructionDelayMonths(config.constructionDelayMonths || 0);
            setTaxBenefitDelayMonths(config.taxBenefitDelayMonths || 0);

            // HDC Advance Financing
            setHdcAdvanceFinancing(config.hdcAdvanceFinancing || false);
            setTaxAdvanceDiscountRate(config.taxAdvanceDiscountRate || 0);
            setAdvanceFinancingRate(config.advanceFinancingRate || 0);
            setTaxDeliveryMonths(config.taxDeliveryMonths || 0);

            // Auto balance settings
            setAutoBalanceCapital(config.autoBalanceCapital || false);
            setInvestorEquityRatio(config.investorEquityRatio || 0);

            // Investment Portal Settings
            console.log('Loading config coordinates:', {
              dealLatitude: config.dealLatitude,
              dealLongitude: config.dealLongitude,
              dealLocation: config.dealLocation
            });
            setIsInvestorFacing(config.isInvestorFacing || false);
            setDealDescription(config.dealDescription || '');
            setDealLocation(config.dealLocation || '');
            setDealLatitude(config.dealLatitude);
            setDealLongitude(config.dealLongitude);
            setUnits(config.units || 0);
            setAffordabilityMix(config.affordabilityMix || '');
            setProjectStatus(config.projectStatus || 'available');
            setMinimumInvestment(config.minimumInvestment || 0);
            setDealImageUrl(config.dealImageUrl || '');

            // Location
            setProjectLocation(config.projectLocation || '');
            // Only load state from config if there's NO tax profile (tax profile takes precedence)
            if (config.selectedState && !taxProfile) {
              setSelectedState(config.selectedState);
            }
          }
        } catch (error) {
          console.error('Failed to load configuration:', error);
        }
      }
    };

    loadConfiguration();
  }, [dealId, taxProfile]); // Load when dealId changes, but consider taxProfile

  // Helper function for percentage inputs
  const handlePercentageChange = (setter: (value: number) => void, value: number) => {
    if (setter === setHdcSubDebtPct && value === 1) {
      console.log('handlePercentageChange: Setting HDC sub-debt to 1');
    }
    setter(value);
  };


  // Get all calculations from the custom hook
  const calculations = useHDCCalculations({
    // Core project parameters
    projectCost,
    predevelopmentCosts,
    landValue,
    yearOneNOI,
    yearOneDepreciationPct,
    holdPeriod,
    revenueGrowth,
    expenseGrowth,
    exitCapRate,
    opexRatio,

    // Tax parameters
    federalTaxRate,
    selectedState,
    projectLocation,
    stateCapitalGainsRate,
    ltCapitalGainsRate,
    niitRate,
    deferredGains: ozDeferredCapitalGains,

    // Fee parameters
    hdcFeeRate,
    hdcDeferredInterestRate,
    hdcAdvanceFinancing,
    taxAdvanceDiscountRate,
    advanceFinancingRate,
    taxDeliveryMonths,
    aumFeeEnabled,
    aumFeeRate,
    aumCurrentPayEnabled,
    aumCurrentPayPct,

    // Capital structure
    investorEquityPct,
    philanthropicEquityPct,
    seniorDebtPct,
    philDebtPct,
    hdcSubDebtPct,
    hdcSubDebtPikRate,
    investorSubDebtPct,
    investorSubDebtPikRate,
    outsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate,
    investorPromoteShare,

    // Debt settings
    seniorDebtRate,
    philDebtRate,
    seniorDebtAmortization,
    seniorDebtIOYears,
    philDebtAmortization,

    // PIK settings
    pikCurrentPayEnabled,
    pikCurrentPayPct,
    investorPikCurrentPayEnabled,
    investorPikCurrentPayPct,
    outsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct,
    philCurrentPayEnabled,
    philCurrentPayPct,
    
    // Interest Reserve
    interestReserveEnabled,
    interestReserveMonths,

    // Tax Timing
    constructionDelayMonths,
    taxBenefitDelayMonths,

    // Opportunity Zone
    ozEnabled,
    ozType,
    deferredCapitalGains: ozDeferredCapitalGains,
    capitalGainsTaxRate: ozCapitalGainsTaxRate,

    // Investor Track and Passive Gains
    investorTrack,
    passiveGainType,

    // Tax Planning Analysis
    includeDepreciationSchedule,
    w2Income,
    businessIncome,
    iraBalance,
    passiveIncome,
    assetSaleGain
  });


  // Get interest reserve amount from main calculation engine (single source of truth)
  const interestReserveAmount = calculations.mainAnalysisResults?.interestReserveAmount || 0;

  // IMPL-044b: Construct CalculationParams for PDF export buttons
  const calculationParams: CalculationParams = {
    // Core project parameters
    projectCost,
    predevelopmentCosts,
    landValue,
    yearOneNOI,
    yearOneDepreciationPct,
    revenueGrowth,
    expenseGrowth,
    exitCapRate,
    opexRatio,
    holdPeriod,

    // Capital structure
    investorEquityPct,
    investorPromoteShare,
    seniorDebtPct,
    seniorDebtRate,
    seniorDebtAmortization,
    seniorDebtIOYears,
    philanthropicDebtPct: philDebtPct,
    philanthropicDebtRate: philDebtRate,
    philDebtAmortization,
    philCurrentPayEnabled,
    philCurrentPayPct,

    // Sub-debt
    hdcSubDebtPct,
    hdcSubDebtPikRate,
    pikCurrentPayEnabled,
    pikCurrentPayPct,
    investorSubDebtPct,
    investorSubDebtPikRate,
    investorPikCurrentPayEnabled,
    investorPikCurrentPayPct,
    outsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate,
    outsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct,
    subDebtPriority,

    // HDC Fees
    hdcFeeRate,
    hdcDeferredInterestRate,
    hdcAdvanceFinancing,
    taxAdvanceDiscountRate,
    advanceFinancingRate,
    taxDeliveryMonths,
    aumFeeEnabled,
    aumFeeRate,
    aumCurrentPayEnabled,
    aumCurrentPayPct,
    hdcFee: calculations.hdcFee,

    // Interest Reserve
    interestReserveEnabled,
    interestReserveMonths,

    // Tax parameters
    federalTaxRate,
    stateTaxRate,
    ltCapitalGainsRate,
    niitRate,
    stateCapitalGainsRate,
    selectedState,
    depreciationRecaptureRate,

    // Tax timing
    constructionDelayMonths,
    taxBenefitDelayMonths,

    // Opportunity Zone
    ozEnabled,
    ozType,
    deferredCapitalGains: ozDeferredCapitalGains,
    capitalGainsTaxRate: ozCapitalGainsTaxRate,

    // Tax planning
    investorTrack,
    includeDepreciationSchedule,
    w2Income,
    businessIncome,
    iraBalance,
    passiveIncome,
    assetGain: assetSaleGain,

    // Calculated values needed for PDF
    investorUpfrontCash: calculations.investorEquity,
    totalTaxBenefit: calculations.totalTaxBenefit,
    netTaxBenefit: calculations.totalNetTaxBenefits,
    year1NetBenefit: calculations.year1NetBenefit,
  };

  // Call the onCalculationComplete callback when calculations change
  useEffect(() => {
    if (onCalculationComplete && calculations.mainAnalysisResults) {
      const investorEquityValue = calculations.investorEquity || calculations.totalInvestment;
      onCalculationComplete(calculations.mainAnalysisResults, investorEquityValue);
    }
  }, [calculations, onCalculationComplete]);

  return (
    <div className="font-sans min-h-screen flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8 box-border w-full max-w-full m-0">

      {/* Display High-Level Metrics */}
      <InvestorAnalysisHighlevelMetrics
        // Deal Info
        dealName={loadedConfigName}
        dealLocation={dealLocation}
        dealLatitude={dealLatitude}
        dealLongitude={dealLongitude}
        dealDescription={dealDescription}
        dealImageUrl={dealImageUrl}
        units={units}
        affordabilityMix={affordabilityMix}
        projectStatus={projectStatus}
        minInvestmentAmount={minimumInvestment}

        // Investment Amount
        investorEquity={calculations.investorEquity}
        hdcFee={calculations.hdcFee}

        // Free Investment Analysis
        year1TaxBenefit={calculations.year1TaxBenefit}
        year1NetBenefit={calculations.year1NetBenefit}
        freeInvestmentHurdle={calculations.freeInvestmentHurdle}
        yearOneDepreciation={calculations.yearOneDepreciation}
        effectiveTaxRateForDepreciation={calculations.effectiveTaxRateForDepreciation}
        hdcFeeRate={hdcFeeRate}

        // Tax Planning Capacity
        totalNetTaxBenefits={calculations.totalNetTaxBenefits}
        totalCapitalGainsRate={calculations.totalCapitalGainsRate}
        investmentRecovered={calculations.investmentRecovered}
        depreciationRecaptureRate={depreciationRecaptureRate}
        yearOneDepreciationPct={yearOneDepreciationPct}
        years2to10Depreciation={calculations.years2to10Depreciation}
        total10YearDepreciation={calculations.total10YearDepreciation}
        depreciableBasis={calculations.depreciableBasis}
        annualStraightLineDepreciation={calculations.annualStraightLineDepreciation}
        totalTaxBenefit={calculations.totalTaxBenefit}

        // Investor Analysis
        totalInvestment={calculations.totalInvestment}
        totalReturns={calculations.totalReturns}
        multipleOnInvested={calculations.multipleOnInvested}
        investorIRR={calculations.investorIRR}
        exitProceeds={calculations.exitProceeds}
        investorSubDebtPct={investorSubDebtPct}

        // Cash Flow props
        investorCashFlows={calculations.investorCashFlows}
        holdPeriod={holdPeriod}
        hdcSubDebtPct={hdcSubDebtPct}
        pikCurrentPayEnabled={pikCurrentPayEnabled}
        pikCurrentPayPct={pikCurrentPayPct}
        investorPikCurrentPayEnabled={investorPikCurrentPayEnabled}
        investorPikCurrentPayPct={investorPikCurrentPayPct}
        taxBenefitDelayMonths={taxBenefitDelayMonths}

        // Main results
        mainAnalysisResults={calculations.mainAnalysisResults}
        depreciationSchedule={calculations.mainAnalysisResults?.depreciationSchedule}

        // HDC Analysis
        hdcCashFlows={calculations.hdcCashFlows}
        hdcAnalysisResults={calculations.hdcAnalysisResults}
        hdcTotalReturns={calculations.hdcTotalReturns}
        hdcExitProceeds={calculations.hdcExitProceeds}

        // OZ
        deferredGains={ozDeferredCapitalGains}
        deferredGainsTaxDue={calculations.deferredGainsTaxDue}
        ozEnabled={ozEnabled}
        year5OZTaxDue={calculations.investorCashFlows?.[4]?.ozYear5TaxPayment || 0}

        // IMPL-044: Returns breakdown components
        investorSubDebtAtExit={calculations.mainAnalysisResults?.investorSubDebtAtExit || 0}
        ozRecaptureAvoided={calculations.mainAnalysisResults?.ozRecaptureAvoided || 0}
        ozDeferralNPV={calculations.mainAnalysisResults?.ozDeferralNPV || 0}
        ozExitAppreciation={calculations.mainAnalysisResults?.ozExitAppreciation || 0}
        remainingLIHTCCredits={0}
        investorTaxBenefits={calculations.mainAnalysisResults?.investorTaxBenefits || 0}
        investorOperatingCashFlows={calculations.mainAnalysisResults?.investorOperatingCashFlows || 0}

        // IMPL-044b: PDF export props
        params={calculationParams}
      />

      {/* Sub-debt current pay status indicators */}
      {(hdcSubDebtPct > 0 && pikCurrentPayEnabled) || (investorSubDebtPct > 0 && investorPikCurrentPayEnabled) ? (
        <div className="mb-6">
          {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
            <div className="text-center text-sm text-purple-600 font-medium mb-2 p-2 bg-purple-50 rounded">
              HDC Sub-Debt Current Pay Active - {pikCurrentPayPct}% of {hdcSubDebtPikRate}% interest paid annually (Years 2-10)
            </div>
          )}
          {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && (
            <div className="text-center text-sm text-green-600 font-medium p-2 bg-green-50 rounded">
              Investor Sub-Debt Current Pay Active - {investorPikCurrentPayPct}% of {investorSubDebtPikRate}% interest received annually (Years 2-10)
            </div>
          )}
        </div>
      ) : null}

      {/* Location Analysis Section */}
      {(dealLocation || (dealLatitude && dealLongitude)) && (
        <LocationAnalysisSection
          dealLocation={dealLocation}
          dealLatitude={dealLatitude}
          dealLongitude={dealLongitude}
        />
      )}

      {/* Configuration Details Section with Collapsible Header */}
      <Collapsible open={configDetailsExpanded} onOpenChange={setConfigDetailsExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer mb-4 p-4 rounded-lg border transition-colors">
          <h5 className="text-2xl font-semibold text-[#276221]">Configuration Details</h5>
          <button type="button" className="text-[#276221] p-2">
            {configDetailsExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
        <style>{`
          @media (min-width: 1024px) {
            .hdc-calculator-container {
              flex-direction: row !important;
            }
          }
          .hdc-calculator-container > div {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
        `}</style>
          <div className="hdc-calculator-container gap-4 md:gap-6 flex flex-col">
            {/* Inputs */}
            <div className="flex-1 min-w-0 rounded-lg overflow-hidden">
          {(() => {
            console.log('About to render HDCInputsComponent with:', {
              dealLatitude,
              dealLongitude,
              setDealLatitude: typeof setDealLatitude,
              setDealLongitude: typeof setDealLongitude
            });
            return null;
          })()}
          <HDCInputsComponent
          calculatedCashFlows={calculations.mainAnalysisResults?.investorCashFlows}
          mainAnalysisResults={calculations.mainAnalysisResults}
          investorEquity={calculations.investorEquity}
          projectCost={projectCost}
          setProjectCost={setProjectCost}
          predevelopmentCosts={predevelopmentCosts}
          setPredevelopmentCosts={setPredevelopmentCosts}
          landValue={landValue}
          setLandValue={setLandValue}
          autoBalanceCapital={autoBalanceCapital}
          setAutoBalanceCapital={setAutoBalanceCapital}
          investorEquityRatio={investorEquityRatio}
          setInvestorEquityRatio={setInvestorEquityRatio}
          investorEquityPct={investorEquityPct}
          setInvestorEquityPct={setInvestorEquityPct}
          philanthropicEquityPct={philanthropicEquityPct}
          setPhilanthropicEquityPct={setPhilanthropicEquityPct}
          seniorDebtPct={seniorDebtPct}
          setSeniorDebtPct={setSeniorDebtPct}
          seniorDebtRate={seniorDebtRate}
          setSeniorDebtRate={setSeniorDebtRate}
          seniorDebtAmortization={seniorDebtAmortization}
          setSeniorDebtAmortization={setSeniorDebtAmortization}
          seniorDebtIOYears={seniorDebtIOYears}
          setSeniorDebtIOYears={setSeniorDebtIOYears}
          philDebtPct={philDebtPct}
          setPhilDebtPct={setPhilDebtPct}
          philDebtRate={philDebtRate}
          setPhilDebtRate={setPhilDebtRate}
          philDebtAmortization={philDebtAmortization}
          setPhilDebtAmortization={setPhilDebtAmortization}
          philCurrentPayEnabled={philCurrentPayEnabled}
          setPhilCurrentPayEnabled={setPhilCurrentPayEnabled}
          philCurrentPayPct={philCurrentPayPct}
          setPhilCurrentPayPct={setPhilCurrentPayPct}
          interestReserveEnabled={interestReserveEnabled}
          setInterestReserveEnabled={setInterestReserveEnabled}
          interestReserveMonths={interestReserveMonths}
          setInterestReserveMonths={setInterestReserveMonths}
          interestReserveAmount={interestReserveAmount}
          hdcSubDebtPct={hdcSubDebtPct}
          setHdcSubDebtPct={setHdcSubDebtPct}
          hdcSubDebtPikRate={hdcSubDebtPikRate}
          setHdcSubDebtPikRate={setHdcSubDebtPikRate}
          pikCurrentPayEnabled={pikCurrentPayEnabled}
          setPikCurrentPayEnabled={setPikCurrentPayEnabled}
          pikCurrentPayPct={pikCurrentPayPct}
          setPikCurrentPayPct={setPikCurrentPayPct}
          investorSubDebtPct={investorSubDebtPct}
          setInvestorSubDebtPct={setInvestorSubDebtPct}
          investorSubDebtPikRate={investorSubDebtPikRate}
          setInvestorSubDebtPikRate={setInvestorSubDebtPikRate}
          investorPikCurrentPayEnabled={investorPikCurrentPayEnabled}
          setInvestorPikCurrentPayEnabled={setInvestorPikCurrentPayEnabled}
          investorPikCurrentPayPct={investorPikCurrentPayPct}
          setInvestorPikCurrentPayPct={setInvestorPikCurrentPayPct}
          outsideInvestorSubDebtPct={outsideInvestorSubDebtPct}
          setOutsideInvestorSubDebtPct={setOutsideInvestorSubDebtPct}
          outsideInvestorSubDebtPikRate={outsideInvestorSubDebtPikRate}
          setOutsideInvestorSubDebtPikRate={setOutsideInvestorSubDebtPikRate}
          outsideInvestorPikCurrentPayEnabled={outsideInvestorPikCurrentPayEnabled}
          setOutsideInvestorPikCurrentPayEnabled={setOutsideInvestorPikCurrentPayEnabled}
          outsideInvestorPikCurrentPayPct={outsideInvestorPikCurrentPayPct}
          setOutsideInvestorPikCurrentPayPct={setOutsideInvestorPikCurrentPayPct}
          subDebtPriority={subDebtPriority}
          setSubDebtPriority={setSubDebtPriority}
          yearOneDepreciationPct={yearOneDepreciationPct}
          setYearOneDepreciationPct={setYearOneDepreciationPct}
          yearOneNOI={yearOneNOI}
          setYearOneNOI={setYearOneNOI}
          holdPeriod={holdPeriod}
          setHoldPeriod={setHoldPeriod}
          revenueGrowth={revenueGrowth}
          setRevenueGrowth={setRevenueGrowth}
          opexRatio={opexRatio}
          setOpexRatio={setOpexRatio}
          expenseGrowth={expenseGrowth}
          setExpenseGrowth={setExpenseGrowth}
          exitCapRate={exitCapRate}
          setExitCapRate={setExitCapRate}
          investorPromoteShare={investorPromoteShare}
          setInvestorPromoteShare={setInvestorPromoteShare}
          federalTaxRate={federalTaxRate}
          setFederalTaxRate={setFederalTaxRate}
          stateTaxRate={stateTaxRate}
          setStateTaxRate={setStateTaxRate}
          ltCapitalGainsRate={ltCapitalGainsRate}
          setLtCapitalGainsRate={setLtCapitalGainsRate}
          niitRate={niitRate}
          setNiitRate={setNiitRate}
          selectedState={selectedState}
          stateCapitalGainsRate={stateCapitalGainsRate}
          setStateCapitalGainsRate={setStateCapitalGainsRate}
          depreciationRecaptureRate={depreciationRecaptureRate}
          projectLocation={projectLocation}
          setProjectLocation={setProjectLocation}
          hdcFeeRate={hdcFeeRate}
          setHdcFeeRate={setHdcFeeRate}
          hdcDeferredInterestRate={hdcDeferredInterestRate}
          setHdcDeferredInterestRate={setHdcDeferredInterestRate}
          aumFeeEnabled={aumFeeEnabled}
          setAumFeeEnabled={setAumFeeEnabled}
          aumFeeRate={aumFeeRate}
          setAumFeeRate={setAumFeeRate}
          aumCurrentPayEnabled={aumCurrentPayEnabled}
          setAumCurrentPayEnabled={setAumCurrentPayEnabled}
          aumCurrentPayPct={aumCurrentPayPct}
          setAumCurrentPayPct={setAumCurrentPayPct}
          hdcPlatformMode={hdcPlatformMode}
          setHdcPlatformMode={setHdcPlatformMode}
          hdcAdvanceFinancing={hdcAdvanceFinancing}
          setHdcAdvanceFinancing={setHdcAdvanceFinancing}
          taxAdvanceDiscountRate={taxAdvanceDiscountRate}
          setTaxAdvanceDiscountRate={setTaxAdvanceDiscountRate}
          advanceFinancingRate={advanceFinancingRate}
          setAdvanceFinancingRate={setAdvanceFinancingRate}
          taxDeliveryMonths={taxDeliveryMonths}
          setTaxDeliveryMonths={setTaxDeliveryMonths}
          constructionDelayMonths={constructionDelayMonths}
          setConstructionDelayMonths={setConstructionDelayMonths}
          taxBenefitDelayMonths={taxBenefitDelayMonths}
          setTaxBenefitDelayMonths={setTaxBenefitDelayMonths}
          ozType={ozType}
          setOzType={setOzType}
          ozVersion={ozVersion}
          setOzVersion={setOzVersion}
          deferredCapitalGains={ozDeferredCapitalGains}
          setDeferredCapitalGains={setOzDeferredCapitalGains}
          capitalGainsTaxRate={ozCapitalGainsTaxRate}
          setCapitalGainsTaxRate={setOzCapitalGainsTaxRate}
          investorTrack={investorTrack}
          setInvestorTrack={setInvestorTrack}
          passiveGainType={passiveGainType}
          setPassiveGainType={setPassiveGainType}
          annualIncome={annualIncome}
          setAnnualIncome={setAnnualIncome}
          filingStatus={filingStatus}
          setFilingStatus={setFilingStatus}
          includeDepreciationSchedule={includeDepreciationSchedule}
          setIncludeDepreciationSchedule={setIncludeDepreciationSchedule}
          w2Income={w2Income}
          setW2Income={setW2Income}
          businessIncome={businessIncome}
          setBusinessIncome={setBusinessIncome}
          iraBalance={iraBalance}
          setIraBalance={setIraBalance}
          passiveIncome={passiveIncome}
          setPassiveIncome={setPassiveIncome}
          assetSaleGain={assetSaleGain}
          setAssetSaleGain={setAssetSaleGain}
          handlePercentageChange={handlePercentageChange}
          handleStateChange={setSelectedState}
          formatCurrency={formatCurrencyMillions}
          CONFORMING_STATES={CONFORMING_STATES}
          totalCapitalStructure={totalCapitalStructure}
          isInvestorFacing={isInvestorFacing}
          setIsInvestorFacing={setIsInvestorFacing}
          dealDescription={dealDescription}
          setDealDescription={setDealDescription}
          dealLocation={dealLocation}
          setDealLocation={setDealLocation}
          dealLatitude={(() => {
            console.log('📍 Passing dealLatitude to HDCInputsComponent:', dealLatitude, 'type:', typeof dealLatitude);
            return dealLatitude;
          })()}
          setDealLatitude={(() => {
            console.log('📍 Passing setDealLatitude to HDCInputsComponent:', typeof setDealLatitude, setDealLatitude);
            return setDealLatitude;
          })()}
          dealLongitude={(() => {
            console.log('📍 Passing dealLongitude to HDCInputsComponent:', dealLongitude, 'type:', typeof dealLongitude);
            return dealLongitude;
          })()}
          setDealLongitude={(() => {
            console.log('📍 Passing setDealLongitude to HDCInputsComponent:', typeof setDealLongitude, setDealLongitude);
            return setDealLongitude;
          })()}
          units={units}
          setUnits={setUnits}
          affordabilityMix={affordabilityMix}
          setAffordabilityMix={setAffordabilityMix}
          projectStatus={projectStatus}
          setProjectStatus={setProjectStatus}
          minimumInvestment={minimumInvestment}
          setMinimumInvestment={setMinimumInvestment}
          dealImageUrl={dealImageUrl}
          setDealImageUrl={setDealImageUrl}
          hideSaveConfiguration={true}  // Hide save configuration button for investors
          hideInvestmentPortalSettings={true}  // Hide investment portal settings for investors
          taxSectionReadOnly={true}  // Make tax section read-only for investors
          isReadOnly={isReadOnly}  // Make all inputs read-only when viewing a deal
          />
            </div>

            {/* Results */}
            <div className="flex-1 min-w-0 rounded-lg overflow-hidden">
          <HDCResultsComponent
          investorEquity={calculations.investorEquity}
          hdcFee={calculations.hdcFee}
          year1HdcFee={calculations.year1HdcFee}
          investorEquityPct={investorEquityPct}
          philanthropicEquityPct={philanthropicEquityPct}
          seniorDebtPct={seniorDebtPct}
          philDebtPct={philDebtPct}
          hdcSubDebtPct={hdcSubDebtPct}
          investorSubDebtPct={investorSubDebtPct}
          outsideInvestorSubDebtPct={outsideInvestorSubDebtPct}
          totalCapitalStructure={totalCapitalStructure}
          year1TaxBenefit={calculations.year1TaxBenefit}
          year1NetBenefit={calculations.year1NetBenefit}
          freeInvestmentHurdle={calculations.freeInvestmentHurdle}
          totalNetTaxBenefits={calculations.totalNetTaxBenefits}
          totalCapitalGainsRate={calculations.totalCapitalGainsRate}
          deferredGains={ozDeferredCapitalGains}
          deferredGainsTaxDue={calculations.deferredGainsTaxDue}
          investmentRecovered={calculations.investmentRecovered}
          ozType={ozType}
          ozCapitalGainsTaxRate={ozCapitalGainsTaxRate}
          totalNetTaxBenefitsAfterCG={calculations.totalNetTaxBenefitsAfterCG}
          mainAnalysisResults={calculations.mainAnalysisResults}
          totalInvestment={calculations.totalInvestment}
          totalReturns={calculations.totalReturns}
          multipleOnInvested={calculations.multipleOnInvested}
          investorIRR={calculations.investorIRR}
          exitProceeds={calculations.exitProceeds}
          investorCashFlows={calculations.investorCashFlows}
          hdcAnalysisResults={calculations.hdcAnalysisResults}
          hdcCashFlows={calculations.hdcCashFlows}
          hdcExitProceeds={calculations.hdcExitProceeds}
          hdcTotalReturns={calculations.hdcTotalReturns}
          hdcMultiple={calculations.hdcMultiple}
          hdcIRR={calculations.hdcIRR}
          total10YearDepreciation={calculations.total10YearDepreciation}
          totalTaxBenefit={calculations.totalTaxBenefit}
          effectiveTaxRateForDepreciation={calculations.effectiveTaxRateForDepreciation}
          yearOneDepreciation={calculations.yearOneDepreciation}
          annualStraightLineDepreciation={calculations.annualStraightLineDepreciation}
          years2to10Depreciation={calculations.years2to10Depreciation}
          holdPeriod={holdPeriod}
          pikCurrentPayEnabled={pikCurrentPayEnabled}
          pikCurrentPayPct={pikCurrentPayPct}
          hdcSubDebtPikRate={hdcSubDebtPikRate}
          investorPikCurrentPayEnabled={investorPikCurrentPayEnabled}
          investorPikCurrentPayPct={investorPikCurrentPayPct}
          investorSubDebtPikRate={investorSubDebtPikRate}
          outsideInvestorSubDebtPikRate={outsideInvestorSubDebtPikRate}
          outsideInvestorPikCurrentPayEnabled={outsideInvestorPikCurrentPayEnabled}
          outsideInvestorPikCurrentPayPct={outsideInvestorPikCurrentPayPct}
          aumFeeEnabled={aumFeeEnabled}
          aumFeeRate={aumFeeRate}
          aumCurrentPayEnabled={aumCurrentPayEnabled}
          aumCurrentPayPct={aumCurrentPayPct}
          hdcPlatformMode={hdcPlatformMode}
          projectCost={projectCost}
          landValue={landValue}
          predevelopmentCosts={predevelopmentCosts}
          yearOneNOI={yearOneNOI}
          revenueGrowth={revenueGrowth}
          expenseGrowth={expenseGrowth}
          exitCapRate={exitCapRate}
          opexRatio={opexRatio}
          projectName={undefined}
          projectLocation={projectLocation}
          seniorDebtRate={seniorDebtRate}
          seniorDebtAmortization={seniorDebtAmortization}
          philDebtRate={philDebtRate}
          philCurrentPayEnabled={philCurrentPayEnabled}
          philCurrentPayPct={philCurrentPayPct}
          hdcDeferredInterestRate={hdcDeferredInterestRate}
          interestReserveEnabled={interestReserveEnabled}
          interestReserveMonths={interestReserveMonths}
          hdcAdvanceFinancing={hdcAdvanceFinancing}
          taxAdvanceDiscountRate={taxAdvanceDiscountRate}
          advanceFinancingRate={advanceFinancingRate}
          taxDeliveryMonths={taxDeliveryMonths}
          includeOutsideInvestor={outsideInvestorSubDebtPct > 0}
          depreciableBasis={calculations.depreciableBasis}
          investorPromoteShare={investorPromoteShare}
          federalTaxRate={federalTaxRate}
          selectedState={selectedState}
          ltCapitalGainsRate={ltCapitalGainsRate}
          niitRate={niitRate}
          stateCapitalGainsRate={stateCapitalGainsRate}
          depreciationRecaptureRate={depreciationRecaptureRate}
          yearOneDepreciationPct={yearOneDepreciationPct}
          constructionDelayMonths={constructionDelayMonths}
          taxBenefitDelayMonths={taxBenefitDelayMonths}
          investorTrack={investorTrack}
          stateTaxRate={stateTaxRate}
          deferredCapitalGains={ozDeferredCapitalGains}
          hdcFeeRate={hdcFeeRate}
          taxCalculationExpanded={taxCalculationExpanded}
          setTaxCalculationExpanded={setTaxCalculationExpanded}
          taxOffsetExpanded={taxOffsetExpanded}
          setTaxOffsetExpanded={setTaxOffsetExpanded}
          depreciationScheduleExpanded={depreciationScheduleExpanded}
          setDepreciationScheduleExpanded={setDepreciationScheduleExpanded}
          w2Income={w2Income}
          businessIncome={businessIncome}
          iraBalance={iraBalance}
          passiveIncome={passiveIncome}
          assetSaleGain={assetSaleGain}
          formatCurrency={formatCurrencyMillions}
          CONFORMING_STATES={CONFORMING_STATES}
          isConformingState={!!calculations.isConformingState}
          />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Debug Information Section with Collapsible Header */}
      <Collapsible open={debugInfoExpanded} onOpenChange={setDebugInfoExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer mt-8 mb-4 p-4 rounded-lg border transition-colors">
          <h5 className="text-2xl font-semibold text-[#276221]">Debug Information - All Variables</h5>
          <button type="button" className="text-[#276221] p-2">
            {debugInfoExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 rounded-lg shadow-sm border [&_code]:block [&_code]:font-mono [&_code]:text-xs [&_code]:p-1 [&_code]:px-2 [&_code]:rounded [&_code]:break-all [&_code]:overflow-wrap-anywhere [&_code]:whitespace-pre-wrap [&_code]:max-w-full [&_code]:overflow-auto">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-lg font-semibold mb-4 text-gray-600">
                  📊 Inputs
                </p>
                <ol className="pl-6 text-sm space-y-1 [&_li]:break-words [&_li]:overflow-wrap-anywhere [&_li]:max-w-full">
                <p><strong>Basic Inputs</strong></p>
                <li>Project Cost: {formatCurrencyMillions(projectCost)}</li>
                <li>Predevelopment Costs: {formatCurrencyMillions(predevelopmentCosts)}</li>
                <li>Interest Reserve Enabled: {interestReserveEnabled ? 'Yes' : 'No'}</li>
                <li>Interest Reserve Months: {interestReserveMonths}</li>
                <li>Construction Delay Months: {constructionDelayMonths}</li>
                <li>Tax Benefit Delay Months: {taxBenefitDelayMonths}</li>
                <li>Land Value: {formatCurrencyMillions(landValue)}</li>
                <li>Year 1 NOI: {formatCurrencyMillions(yearOneNOI)}</li>
                <li>Hold Period: {holdPeriod} years</li>
                <li>Revenue Growth: {revenueGrowth}%</li>
                <li>Expense Growth: {expenseGrowth}%</li>
                <li>Exit Cap Rate: {exitCapRate}%</li>
                <li>Opex Ratio: {opexRatio}%</li>
                <li>Year 1 Depreciation %: {yearOneDepreciationPct}%</li>


                <p><strong>Capital Structure</strong></p>
                <li>Auto Balance Capital: {autoBalanceCapital ? 'Yes' : 'No'}</li>
                <li>Investor Equity Ratio: {autoBalanceCapital ? investorEquityRatio : 'N/A'}</li>
                <li>Investor Equity %: {investorEquityPct}%</li>
                <li>Philanthropic Equity %: {philanthropicEquityPct}%</li>
                <li>Senior Debt %: {seniorDebtPct}%</li>
                <li>Philanthropic Debt %: {philDebtPct}%</li>
                <li>Philanthropic Debt Rate: {philDebtRate}%</li>
                <li>Philanthropic Debt Amortization: {philDebtAmortization} years</li>
                <li>Philanthropic Current Pay Enabled: {philCurrentPayEnabled ? 'Yes' : 'No'}</li>
                <li>Philanthropic Current Pay %: {philCurrentPayPct}%</li>
                <li>HDC Sub Debt %: {hdcSubDebtPct}%</li>
                <li>Senior Debt Rate: {seniorDebtRate}%</li>
                <li>HDC Sub Debt PIK Rate: {hdcSubDebtPikRate}%</li>
                <li>Senior Debt Amortization: {seniorDebtAmortization} years</li>
                <li>Investor Sub Debt %: {investorSubDebtPct}%</li>
                <li>PIK Current Pay Enabled: {pikCurrentPayEnabled ? 'Yes' : 'No'}</li>
                <li>PIK Current Pay %: {pikCurrentPayPct}%</li>
                <li>Investor Sub Debt PIK Rate: {investorSubDebtPikRate}%</li>
                <li>Outside Investor Sub Debt %: {outsideInvestorSubDebtPct}%</li>
                <li>Investor PIK Current Pay Enabled: {investorPikCurrentPayEnabled ? 'Yes' : 'No'}</li>
                <li>Investor PIK Current Pay %: {investorPikCurrentPayPct}%</li>
                <li>Outside Investor Sub Debt %: {outsideInvestorSubDebtPct}%</li>
                <li>Outside Investor Sub Debt PIK Rate: {outsideInvestorSubDebtPikRate}%</li>
                <li>Outside Investor PIK Current Pay Enabled: {outsideInvestorPikCurrentPayEnabled ? 'Yes' : 'No'}</li>
                <li>Outside Investor PIK Current Pay %: {outsideInvestorPikCurrentPayPct}%</li>
                <li>Sub Debt Priority: {JSON.stringify(subDebtPriority)}</li>
                <li>Total Capital Structure: {totalCapitalStructure}</li>
                <li>Interest Reserve Enabled: {interestReserveEnabled ? 'Yes' : 'No'}</li>
                <li>Interest Reserve Amount: ${interestReserveAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</li>

                
                <p><strong>Tax Parameters</strong></p>
                <li>Federal Ordinary Rate: {federalTaxRate}%</li>
                <li>State Ordinary Rate: {stateTaxRate || 0}%</li>
                <li>Federal Capital Gains Rate: {ltCapitalGainsRate}%</li>
                <li>State Capital Gains Rate: {stateCapitalGainsRate}%</li>
                <li>Selected State: {selectedState}</li>
                <li>Project Location: {projectLocation}</li>

                <li>OZ Type: {ozType}</li>
                <li>Deferred Capital Gains: {ozDeferredCapitalGains}</li>
                <li>Capital Gains Tax Rate: {ozCapitalGainsTaxRate}</li>
                <li>Investor Track: {investorTrack}</li>
                <li>Passive Gain Type: {passiveGainType}</li>

                <li>Investor Equity Amount: {((projectCost + interestReserveAmount) * (investorEquityPct / 100)).toFixed(3)}</li>

                <p><strong>Tax Planning</strong></p>
                <li>Include Depreciation Schedule: {includeDepreciationSchedule ? 'Yes' : 'No'}</li>
                <li>W2 Income: {w2Income}</li>
                <li>Business Income: {businessIncome}</li>
                <li>IRA Balance: {iraBalance}</li>
                <li>Passive Income: {passiveIncome}</li>
                <li>Asset Sale Gain: {assetSaleGain}</li>

                <p><strong>Projections</strong></p>
                <li>Hold Period: {holdPeriod}</li>
                <li>Revenue Growth: {revenueGrowth}%</li>
                <li>Expense Growth: {expenseGrowth}%</li>
                <li>Exit Cap Rate: {exitCapRate}%</li>
                
                <p><strong>HDC Income</strong></p>
                <li>HDC Fee Rate: {hdcFeeRate}</li>
                <li>HDC Deferred Interest Rate: {hdcDeferredInterestRate || 8}</li>
                <li>AUM Fee Enabled: {aumFeeEnabled ? 'Yes' : 'No'}</li>
                <li>AUM Fee Rate: {aumFeeEnabled ? aumFeeRate : 0}</li>
                <li>AUM Current Pay Enabled: {aumCurrentPayEnabled ? 'Yes' : 'No'}</li>
                <li>AUM Current Pay %: {aumCurrentPayEnabled ? aumCurrentPayPct : 0}%</li>
                <li>HDC Advance Financing: {hdcAdvanceFinancing ? 'Yes' : 'No'}</li>
                <li>Tax Advance Discount Rate: {taxAdvanceDiscountRate}</li>
                <li>Advance Financing Rate: {advanceFinancingRate}</li>
                <li>Tax Delivery Months: {taxDeliveryMonths}</li>
                <li>Investor Promote Share: {investorPromoteShare}</li>
                </ol>
              </div>

              <div>
                <p className="text-lg font-semibold mb-4 text-gray-600">
                  👤 Tax Profile
                </p>
                <ol className="pl-6 text-sm space-y-1 [&_li]:break-words [&_li]:overflow-wrap-anywhere [&_li]:max-w-full">
              <li>Annual Income: {taxProfile?.annualIncome}</li>
              <li>Capital Gains Tax Rate: {taxProfile?.capitalGainsTaxRate}</li>
              <li>Created At: {taxProfile?.createdAt}</li>
              <li>Deferred Capital Gains: {taxProfile?.deferredCapitalGains}</li>
              <li>Federal Capital Gains Rate: {taxProfile?.federalCapitalGainsRate}</li>
              <li>Federal Ordinary Rate: {taxProfile?.federalOrdinaryRate}</li>
              <li>Filing Status: {taxProfile?.filingStatus}</li>
              <li>Filing Status ID: {taxProfile?.id}</li>
              <li>Investor Track: {taxProfile?.investorTrack}</li>
              <li>Is Default: {taxProfile?.isDefault ? 'Yes' : 'No'}</li>
              <li>Opportunity Zone Type: {taxProfile?.ozType || "standard"}</li>
              <li>Passive Gain Type: {taxProfile?.passiveGainType || "long-term"}</li>
              <li>Project Location: {taxProfile?.projectLocation || "N/A"}</li>
              <li>Rep Status: {taxProfile?.repStatus || "N/A"}</li>
              <li>Selected State: {taxProfile?.selectedState || "WA"}</li>
              <li>State Capital Gains Rate: {taxProfile?.stateCapitalGainsRate || 0}</li>
              <li>State Ordinary Rate: {taxProfile?.stateOrdinaryRate || 0}</li>
              <li>Updated At: {taxProfile?.updatedAt || "N/A"}</li>
              <li>User: {taxProfile?.user ? (
                <span>
                  {taxProfile.user.fullName} ({taxProfile.user.username}) - Role: {taxProfile.user.role}
                </span>
              ) : "N/A"}</li>
                </ol>
              </div>

              <div>
                <p className="text-lg font-semibold mb-4 text-gray-600">
                  📈 Results
                </p>
                <ol className="pl-6 text-sm space-y-1 [&_li]:break-words [&_li]:overflow-wrap-anywhere [&_li]:max-w-full">
              <p><strong>Investment Summary</strong></p>
              <li>Investor Equity: {calculations.investorEquity}</li>
              <li>HDC Fee: {calculations.hdcFee}</li>
              <li>Amount Invested: {formatCurrencyMillions(calculations.investorEquity + calculations.hdcFee)}</li>
              
              <p><strong>Capital Structure</strong></p>
              <li>Investor Equity Percentage: {investorEquityPct}</li>
              <li>Philanthropic Equity Percentage: {philanthropicEquityPct}</li>  
              <li>Senior Debt Percentage: {seniorDebtPct}</li>
              <li>Philanthropic Debt Percentage: {philDebtPct}</li>
              <li>HDC Sub Debt Percentage: {hdcSubDebtPct}</li>
              <li>Investor Sub Debt Percentage: {investorSubDebtPct}</li>
              <li>Outside Investor Sub Debt Percentage: {outsideInvestorSubDebtPct}</li>  
              <li>Total Capital Structure: {totalCapitalStructure}</li>

              <p><strong>Debt Service Coverage Analysis</strong></p>
              <li>Investor Cash Flows: <code>{JSON.stringify(calculations.investorCashFlows, null, 2)}</code></li>
              <li>Hold Period: {holdPeriod}</li>

              <p><strong>Free Investment Analysis</strong></p>
              <li>Year 1 Tax Benefit: {calculations.year1TaxBenefit}</li>
              <li>HDC Fee: {calculations.year1HdcFee}</li>
              <li>Year 1 Net Benefit: {calculations.year1NetBenefit}</li>
              <li>Free Investment Hurdle: {calculations.freeInvestmentHurdle}</li>
              <li>Year One Depreciation: {calculations.yearOneDepreciation}</li>
              <li>Effective Tax Rate for Depreciation: {calculations.effectiveTaxRateForDepreciation}</li>
              <li>HDC Fee Rate: {hdcFeeRate}</li>
              <li>Depreciation Schedule: <code>{JSON.stringify(calculations.mainAnalysisResults?.depreciationSchedule, null, 2)}</code></li>


              <p><strong>Tax Planning Capacity</strong></p>
              <li>totalNetTaxBenefits: {calculations.totalNetTaxBenefits}</li>
              <li>totalCapitalGainsRate: {calculations.totalCapitalGainsRate}</li>
              <li>investmentRecovered: {calculations.investmentRecovered}</li>
              <li>effectiveTaxRateForDepreciation: {calculations.effectiveTaxRateForDepreciation}</li>
              <li>depreciationRecaptureRate: {depreciationRecaptureRate}</li>
              {/* <li>year5OZTaxDue: {calculations.year5OZTaxDue}</li> */}
              {/* New props for depreciation details */}
              <li>yearOneDepreciation: {calculations.yearOneDepreciation}</li>
              <li>yearOneDepreciationPct: {yearOneDepreciationPct}</li>
              <li>years2to10Depreciation: {calculations.years2to10Depreciation}</li>
              <li>total10YearDepreciation: {calculations.total10YearDepreciation}</li>
              <li>depreciableBasis: {calculations.depreciableBasis}</li>
              <li>annualStraightLineDepreciation: {calculations.annualStraightLineDepreciation}</li>
              <li>totalTaxBenefit: {calculations.totalTaxBenefit}</li>
              <li>hdcFee: {calculations.hdcFee}</li>

              <p><strong>10-Year Investor Analysis & Cash Flow Model</strong></p>
              <li>investorCashFlows: {JSON.stringify(calculations.investorCashFlows)}</li>
              <li>holdPeriod: {holdPeriod}</li>
              <li>hdcSubDebtPct: {hdcSubDebtPct}</li>
              <li>pikCurrentPayEnabled: {pikCurrentPayEnabled ? 'Yes' : 'No'}</li>
              <li>pikCurrentPayPct: {pikCurrentPayPct}</li>
              <li>investorSubDebtPct: {investorSubDebtPct}</li>
              <li>investorPikCurrentPayEnabled: {investorPikCurrentPayEnabled ? 'Yes' : 'No'}</li>
              <li>investorPikCurrentPayPct: {investorPikCurrentPayPct}</li>
              <li>exitProceeds: {calculations.exitProceeds}</li>
              <li>mainAnalysisResults: {JSON.stringify(calculations.mainAnalysisResults)}</li>
              <li>totalReturns: {calculations.totalReturns}</li>
              <li>multipleOnInvested: {calculations.multipleOnInvested}</li>
              <li>investorIRR: {calculations.investorIRR}</li>
              <li>totalInvestment: {calculations.totalInvestment}</li>
              <li>taxBenefitDelayMonths: {taxBenefitDelayMonths}</li>


              <p><strong>Distributable Cash Flow Analysis</strong></p>
              <li>investorCashFlows: {JSON.stringify(calculations.investorCashFlows)}</li>
              <li>holdPeriod: {holdPeriod}</li>
              <li>aumFeeEnabled: {aumFeeEnabled ? 'Yes' : 'No'}</li>
              <li>aumFeeRate: {aumFeeEnabled ? aumFeeRate : 0}</li>
              <li>constructionDelayMonths: {constructionDelayMonths}</li>
              <li>hdcFeeRate: {hdcFeeRate}</li>
              <li>yearOneDepreciation: {calculations.yearOneDepreciation}</li>
              <li>annualStraightLineDepreciation: {calculations.annualStraightLineDepreciation}</li>
              <li>effectiveTaxRate: {calculations.effectiveTaxRateForDepreciation}</li>

              <p><strong>10-Year HDC Analysis & Cash Flow Model</strong></p>
              <li>hdcCashFlows: {JSON.stringify(calculations.hdcCashFlows)}</li>
              <li>holdPeriod: {holdPeriod}</li>
              <li>aumFeeEnabled: {aumFeeEnabled ? 'Yes' : 'No'}</li>
              <li>aumFeeRate: {aumFeeEnabled ? aumFeeRate : 0}</li>
              <li>hdcAnalysisResults: {JSON.stringify(calculations.hdcAnalysisResults)}</li>
              <li>hdcExitProceeds: {calculations.hdcExitProceeds}</li>
              <li>hdcTotalReturns: {calculations.hdcTotalReturns}</li>
              <li>hdcMultiple: {calculations.hdcMultiple}</li>
              <li>hdcIRR: {calculations.hdcIRR}</li>
              <li>hdcSubDebtPct: {hdcSubDebtPct}</li>
              <li>hdcSubDebtPikRate: {hdcSubDebtPikRate}</li>
              <li>pikCurrentPayEnabled: {pikCurrentPayEnabled ? 'Yes' : 'No'}</li>
              <li>pikCurrentPayPct: {pikCurrentPayEnabled ? pikCurrentPayPct : 0}</li>
              <li>investorPromoteShare: {investorPromoteShare}</li>


              <p><strong>Strategic Value Hierarchy</strong></p>
              <li>investorTrack={investorTrack}</li>
              <li>passiveGainType={passiveGainType}</li>
              <li>projectCost={projectCost}</li>
              <li>investorEquityAmount={calculations.investorEquity / 1000000}</li>
              <li>holdPeriod={holdPeriod}</li>
              <li>yearOneDepreciationPct={yearOneDepreciationPct}</li>
              <li>federalOrdinaryRate={federalTaxRate}</li>
              <li>stateOrdinaryRate={stateTaxRate}</li>
              <li>federalCapitalGainsRate={ltCapitalGainsRate}</li>
              <li>stateCapitalGainsRate={stateCapitalGainsRate}</li>
              <li>selectedState={selectedState}</li>
              <li>ozType={ozType}</li>
              {/* <li>deferredCapitalGains={deferredCapitalGains}</li> */}
              <li>hdcFeeRate={hdcFeeRate}</li>
              <li>aumFeeEnabled={aumFeeEnabled ? 'Yes' : 'No'}</li>
              <li>aumFeeRate={aumFeeEnabled ? aumFeeRate : 0}</li>
              {/* <li>totalTaxBenefits={totalTaxBenefits}</li> */}
              {/* <li>investorIRR={investorIRR}</li> */}
              {/* <li>hdcTotalFees={totalHdcFees}</li> */}

              <p><strong>Waterfall Distribution</strong></p>
              <li>investorPromoteShare: {investorPromoteShare}</li>

              <p><strong>Tax Strategy Analysis - Real Estate Professional</strong></p>
              <li>hdcResults={JSON.stringify(calculations.mainAnalysisResults)}</li>
              <li>investorTrack={investorTrack}</li>
              <li>year1NetBenefit={calculations.year1NetBenefit}</li>
              <li>freeInvestmentHurdle={calculations.freeInvestmentHurdle}</li>
            </ol>
          </div>
        </div>
      </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

  );
};

export default InvestorAnalysisCalculator;