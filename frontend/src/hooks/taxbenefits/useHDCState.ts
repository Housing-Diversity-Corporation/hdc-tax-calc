import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_VALUES } from '../../utils/taxbenefits';
import { getStateTaxRate } from '../../utils/taxbenefits/stateProfiles';
import { ValidationResult } from '../../utils/taxbenefits/validation';

export const useHDCState = () => {
  // Basic state declarations

  // IMPL-036: Flag to suppress auto-balance during configuration loading
  // This prevents the auto-balance useEffect from overriding loaded config values
  const isLoadingConfigRef = useRef(false);

  // Validation framework state
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [validationResults, setValidationResults] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Expandable sections state
  const [taxCalculationExpanded, setTaxCalculationExpanded] = useState(true);
  const [taxOffsetExpanded, setTaxOffsetExpanded] = useState(true);
  const [depreciationScheduleExpanded, setDepreciationScheduleExpanded] = useState(true);

  // Main calculation inputs
  // IMPL-035: Default to WA (HDC home state, Atrium location)
  const [selectedState, setSelectedState] = useState('WA');
  const [projectLocation, setProjectLocation] = useState<string | undefined>(undefined);
  const [projectCost, setProjectCost] = useState(DEFAULT_VALUES.PROJECT_COST);
  const [predevelopmentCosts, setPredevelopmentCosts] = useState(0); // Default to 0 for backward compatibility
  const [landValue, setLandValue] = useState(DEFAULT_VALUES.LAND_VALUE);
  const [yearOneNOI, setYearOneNOI] = useState(DEFAULT_VALUES.YEAR_ONE_NOI);
  const [yearOneDepreciationPct, setYearOneDepreciationPct] = useState(DEFAULT_VALUES.YEAR_ONE_DEPRECIATION_PCT);
  const [hdcFeeRate, setHdcFeeRate] = useState(DEFAULT_VALUES.HDC_FEE_RATE);
  const [hdcDeferredInterestRate, setHdcDeferredInterestRate] = useState(8); // Default 8% interest on deferred fees
  const [federalTaxRate, setFederalTaxRate] = useState(DEFAULT_VALUES.FEDERAL_TAX_RATE);
  const [stateTaxRate, setStateTaxRate] = useState(0); // Default to WA rate (no state income tax)
  const [deferredGains, setDeferredGains] = useState(DEFAULT_VALUES.DEFERRED_GAINS);
  const [hdcAdvanceFinancing, setHdcAdvanceFinancing] = useState(false);
  const [taxAdvanceDiscountRate, setTaxAdvanceDiscountRate] = useState(DEFAULT_VALUES.TAX_ADVANCE_DISCOUNT_RATE);
  const [advanceFinancingRate, setAdvanceFinancingRate] = useState(DEFAULT_VALUES.ADVANCE_FINANCING_RATE);
  const [taxDeliveryMonths, setTaxDeliveryMonths] = useState(DEFAULT_VALUES.TAX_DELIVERY_MONTHS);
  const [constructionDelayMonths, setConstructionDelayMonths] = useState(0); // 0-36 months construction delay
  const [taxBenefitDelayMonths, setTaxBenefitDelayMonths] = useState(0); // 0-36 months tax realization delay
  const [aumFeeEnabled, setAumFeeEnabled] = useState(false);
  const [aumFeeRate, setAumFeeRate] = useState(DEFAULT_VALUES.AUM_FEE_RATE);
  const [aumCurrentPayEnabled, setAumCurrentPayEnabled] = useState(false);
  const [aumCurrentPayPct, setAumCurrentPayPct] = useState(50); // Default 50% current pay
  const [hdcPlatformMode, setHdcPlatformMode] = useState<'traditional' | 'leverage'>('traditional'); // HDC Platform mode
  const [ltCapitalGainsRate, setLtCapitalGainsRate] = useState(DEFAULT_VALUES.LT_CAPITAL_GAINS_RATE);
  const [niitRate, setNiitRate] = useState(DEFAULT_VALUES.NIIT_RATE);
  const [stateCapitalGainsRate, setStateCapitalGainsRate] = useState(DEFAULT_VALUES.STATE_CAPITAL_GAINS_RATE);
  const [depreciationRecaptureRate, setDepreciationRecaptureRate] = useState(DEFAULT_VALUES.DEPRECIATION_RECAPTURE_RATE);

  // Projections
  const [holdPeriod, setHoldPeriod] = useState(10); // Default 10 years, range 10-30
  const [revenueGrowth, setRevenueGrowth] = useState(DEFAULT_VALUES.REVENUE_GROWTH);
  const [expenseGrowth, setExpenseGrowth] = useState(DEFAULT_VALUES.EXPENSE_GROWTH);
  const [opexRatio, setOpexRatio] = useState(DEFAULT_VALUES.OPEX_RATIO);
  const [exitCapRate, setExitCapRate] = useState(DEFAULT_VALUES.EXIT_CAP_RATE);

  // Capital structure
  const [investorEquityPct, setInvestorEquityPct] = useState(DEFAULT_VALUES.INVESTOR_EQUITY_PCT);
  const [philanthropicEquityPct, setPhilanthropicEquityPct] = useState(DEFAULT_VALUES.PHILANTHROPIC_EQUITY_PCT);
  const [seniorDebtPct, setSeniorDebtPct] = useState(DEFAULT_VALUES.SENIOR_DEBT_PCT);
  const [philDebtPct, setPhilDebtPct] = useState(DEFAULT_VALUES.PHIL_DEBT_PCT);
  const [hdcSubDebtPct, setHdcSubDebtPct] = useState(DEFAULT_VALUES.HDC_SUB_DEBT_PCT);
  const [hdcSubDebtPikRate, setHdcSubDebtPikRate] = useState(DEFAULT_VALUES.HDC_SUB_DEBT_PIK_RATE);
  const [investorSubDebtPct, setInvestorSubDebtPct] = useState(DEFAULT_VALUES.INVESTOR_SUB_DEBT_PCT);
  const [investorSubDebtPikRate, setInvestorSubDebtPikRate] = useState(DEFAULT_VALUES.INVESTOR_SUB_DEBT_PIK_RATE);
  const [outsideInvestorSubDebtPct, setOutsideInvestorSubDebtPct] = useState(0);
  const [outsideInvestorSubDebtRate, setOutsideInvestorSubDebtRate] = useState(8);
  const [outsideInvestorSubDebtAmortization, setOutsideInvestorSubDebtAmortization] = useState(10);
  const [outsideInvestorPikCurrentPayEnabled, setOutsideInvestorPikCurrentPayEnabled] = useState(false);
  const [outsideInvestorPikCurrentPayPct, setOutsideInvestorPikCurrentPayPct] = useState(0);
  const [investorEquityRatio, setInvestorEquityRatio] = useState(DEFAULT_VALUES.INVESTOR_EQUITY_RATIO);
  const [autoBalanceCapital, setAutoBalanceCapital] = useState(true);
  const [investorPromoteShare, setInvestorPromoteShare] = useState(DEFAULT_VALUES.INVESTOR_PROMOTE_SHARE);

  // PIK and current pay settings
  const [pikCurrentPayEnabled, setPikCurrentPayEnabled] = useState(false);
  const [pikCurrentPayPct, setPikCurrentPayPct] = useState(DEFAULT_VALUES.PIK_CURRENT_PAY_PCT);
  const [investorPikCurrentPayEnabled, setInvestorPikCurrentPayEnabled] = useState(false);
  const [investorPikCurrentPayPct, setInvestorPikCurrentPayPct] = useState(DEFAULT_VALUES.INVESTOR_PIK_CURRENT_PAY_PCT);

  // Sub-debt payment priority (for soft pay waterfall)
  const [subDebtPriority, setSubDebtPriority] = useState({
    outsideInvestor: 1,  // 1st priority (highest)
    hdc: 2,              // 2nd priority
    investor: 3          // 3rd priority (lowest)
  });

  // Debt settings
  const [seniorDebtAmortization, setSeniorDebtAmortization] = useState(DEFAULT_VALUES.SENIOR_DEBT_AMORTIZATION);
  const [seniorDebtRate, setSeniorDebtRate] = useState(DEFAULT_VALUES.SENIOR_DEBT_RATE);
  const [seniorDebtIOYears, setSeniorDebtIOYears] = useState(0); // Interest-only period (0-10 years)
  const [philDebtAmortization, setPhilDebtAmortization] = useState(DEFAULT_VALUES.PHIL_DEBT_AMORTIZATION);
  const [philDebtRate, setPhilDebtRate] = useState(DEFAULT_VALUES.PHIL_DEBT_RATE);
  const [philCurrentPayEnabled, setPhilCurrentPayEnabled] = useState(false);
  const [philCurrentPayPct, setPhilCurrentPayPct] = useState(DEFAULT_VALUES.PHIL_CURRENT_PAY_PCT);
  
  // Interest Reserve for Year 1 lease-up
  const [interestReserveEnabled, setInterestReserveEnabled] = useState(false);
  const [interestReserveMonths, setInterestReserveMonths] = useState(12); // Default to 12 months

  // Opportunity Zone parameters (always enabled for OZ calculator)
  const [ozEnabled, setOzEnabled] = useState(true);
  const [ozType, setOzType] = useState<'standard' | 'rural'>('standard');
  const [ozVersion, setOzVersion] = useState<'1.0' | '2.0'>('2.0'); // IMPL-017: OZ legislation version
  const [ozDeferredCapitalGains, setOzDeferredCapitalGains] = useState(0);
  const [ozCapitalGainsTaxRate, setOzCapitalGainsTaxRate] = useState(23.8); // Default to federal LTCG + NIIT

  // Investor Type
  const [investorType, setInvestorType] = useState<'ordinary' | 'stcg' | 'ltcg' | 'custom'>('ordinary');

  // Investor Track and Passive Gains for new tax framework
  const [investorTrack, setInvestorTrack] = useState<'rep' | 'non-rep'>('rep');
  const [passiveGainType, setPassiveGainType] = useState<'short-term' | 'long-term'>('short-term');

  // Investor Information
  const [annualIncome, setAnnualIncome] = useState<number>(0);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('single');

  // Tax Planning Analysis fields - ALWAYS ENABLED (core feature of HDC calculator)
  const [includeDepreciationSchedule, setIncludeDepreciationSchedule] = useState(true);

  // REP-specific inputs
  const [w2Income, setW2Income] = useState(0);
  const [businessIncome, setBusinessIncome] = useState(0);
  const [iraBalance, setIraBalance] = useState(0);

  // Non-REP specific inputs
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [assetSaleGain, setAssetSaleGain] = useState(0);

  // Investment Portal Settings
  const [isInvestorFacing, setIsInvestorFacing] = useState(false);
  const [dealDescription, setDealDescription] = useState('');
  const [dealLocation, setDealLocation] = useState('');
  const [dealLatitude, setDealLatitude] = useState<number | undefined>(undefined);
  const [dealLongitude, setDealLongitude] = useState<number | undefined>(undefined);
  const [units, setUnits] = useState(0);
  const [affordabilityMix, setAffordabilityMix] = useState('');
  const [projectStatus, setProjectStatus] = useState<'available' | 'funded' | 'pipeline'>('available');
  const [minimumInvestment, setMinimumInvestment] = useState(0);
  const [dealImageUrl, setDealImageUrl] = useState('');

  // State LIHTC (v7.0.10)
  const [stateLIHTCEnabled, setStateLIHTCEnabled] = useState(false);
  // IMPL-035: investorState is independent from selectedState (propertyState)
  const [investorState, setInvestorState] = useState('WA'); // Default to WA (HDC home state)
  const [syndicationRate, setSyndicationRate] = useState(75); // Default 75% per IMPL-7.0-014
  const [investorHasStateLiability, setInvestorHasStateLiability] = useState(true);
  const [stateLIHTCUserPercentage, setStateLIHTCUserPercentage] = useState<number | undefined>(undefined);
  const [stateLIHTCUserAmount, setStateLIHTCUserAmount] = useState<number | undefined>(undefined);
  const [stateLIHTCSyndicationYear, setStateLIHTCSyndicationYear] = useState<0 | 1 | 2>(0); // IMPL-076: Default Year 0 (syndicator funds at close)

  // Federal LIHTC (v7.0.11)
  const [lihtcEnabled, setLihtcEnabled] = useState(true);
  const [applicableFraction, setApplicableFraction] = useState(100);
  const [creditRate, setCreditRate] = useState(0.04);
  const [placedInServiceMonth, setPlacedInServiceMonth] = useState(7);
  const [ddaQctBoost, setDdaQctBoost] = useState(false);

  // Handle state selection change
  // IMPL-066: Use getStateTaxRate() directly from stateProfiles (single source of truth)
  // Note: stateTaxRate is for ordinary income (depreciation benefits)
  // stateCapitalGainsRate is for capital gains (OZ exit, property sale)
  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    if (stateCode === 'NONE' || stateCode === '') {
      setStateCapitalGainsRate(0);
      setStateTaxRate(0);
    } else if (stateCode === 'CUSTOM') {
      // Keep current rate for custom
    } else {
      // IMPL-066: Use getStateTaxRate() for ordinary income rate (topRate from stateProfiles)
      // This correctly handles states like WA (topRate=0 for ordinary income)
      const ordinaryIncomeRate = getStateTaxRate(stateCode);
      setStateTaxRate(ordinaryIncomeRate);
      // For capital gains, use same rate (most states) - WA's 7% CG tax is separate
      // and handled via specialRules, not in standard CG rate field
      setStateCapitalGainsRate(ordinaryIncomeRate);
    }
  };

  // Auto-balance equity when enabled
  // IMPL-036: Skip auto-balance during configuration loading to preserve loaded values
  useEffect(() => {
    // IMPL-036: Skip if currently loading a configuration
    if (isLoadingConfigRef.current) return;
    if (!autoBalanceCapital) return;
    if (investorEquityRatio < 0 || investorEquityRatio > 100) return;

    // Debug specifically for value 1
    if (Math.abs(hdcSubDebtPct - 1) < 0.001) {
      console.log('HDC Sub-debt is exactly 1, in useEffect');
    }

    const totalDebt = seniorDebtPct + philDebtPct + hdcSubDebtPct + investorSubDebtPct + outsideInvestorSubDebtPct;
    const remainingForEquity = Math.max(0, 100 - totalDebt);

    // If no room for equity, set both to 0
    if (remainingForEquity <= 0) {
      if (investorEquityPct !== 0 || philanthropicEquityPct !== 0) {
        // Use setTimeout to break the update cycle
        setTimeout(() => {
          setInvestorEquityPct(0);
          setPhilanthropicEquityPct(0);
        }, 0);
      }
      return;
    }

    const newInvestorEquity = remainingForEquity * (investorEquityRatio / 100);
    const newPhilanthropicEquity = remainingForEquity - newInvestorEquity;

    // Only update if there's a meaningful difference
    const investorDiff = Math.abs(investorEquityPct - newInvestorEquity);
    const philDiff = Math.abs(philanthropicEquityPct - newPhilanthropicEquity);

    if (investorDiff > 0.01 || philDiff > 0.01) {
      // Use setTimeout to break the update cycle
      setTimeout(() => {
        setInvestorEquityPct(Number(newInvestorEquity.toFixed(2)));
        setPhilanthropicEquityPct(Number(newPhilanthropicEquity.toFixed(2)));
      }, 0);
    }
  }, [seniorDebtPct, philDebtPct, hdcSubDebtPct, investorSubDebtPct, outsideInvestorSubDebtPct, investorEquityRatio, autoBalanceCapital, investorEquityPct, philanthropicEquityPct]);

  // IMPL-036: Helper functions to control config loading state
  const startConfigLoading = useCallback(() => {
    isLoadingConfigRef.current = true;
  }, []);

  const endConfigLoading = useCallback(() => {
    // Small delay to ensure all state updates have propagated
    setTimeout(() => {
      isLoadingConfigRef.current = false;
    }, 100);
  }, []);

  // Calculate total capital structure
  const totalCapitalStructure = investorEquityPct + philanthropicEquityPct + seniorDebtPct + philDebtPct + hdcSubDebtPct + investorSubDebtPct + outsideInvestorSubDebtPct;

  return {
    // Validation
    validationEnabled, setValidationEnabled,
    validationResults, setValidationResults,
    showValidationDetails, setShowValidationDetails,

    // Expandable sections
    taxCalculationExpanded, setTaxCalculationExpanded,
    taxOffsetExpanded, setTaxOffsetExpanded,
    depreciationScheduleExpanded, setDepreciationScheduleExpanded,

    // Main inputs
    selectedState, setSelectedState,
    projectLocation, setProjectLocation,
    projectCost, setProjectCost,
    predevelopmentCosts, setPredevelopmentCosts,
    landValue, setLandValue,
    yearOneNOI, setYearOneNOI,
    yearOneDepreciationPct, setYearOneDepreciationPct,
    hdcFeeRate, setHdcFeeRate,
    hdcDeferredInterestRate, setHdcDeferredInterestRate,
    federalTaxRate, setFederalTaxRate,
    stateTaxRate, setStateTaxRate,
    deferredGains, setDeferredGains,
    hdcAdvanceFinancing, setHdcAdvanceFinancing,
    taxAdvanceDiscountRate, setTaxAdvanceDiscountRate,
    advanceFinancingRate, setAdvanceFinancingRate,
    taxDeliveryMonths, setTaxDeliveryMonths,
    constructionDelayMonths, setConstructionDelayMonths,
    taxBenefitDelayMonths, setTaxBenefitDelayMonths,
    aumFeeEnabled, setAumFeeEnabled,
    aumFeeRate, setAumFeeRate,
    aumCurrentPayEnabled, setAumCurrentPayEnabled,
    aumCurrentPayPct, setAumCurrentPayPct,
    hdcPlatformMode, setHdcPlatformMode,
    ltCapitalGainsRate, setLtCapitalGainsRate,
    niitRate, setNiitRate,
    stateCapitalGainsRate, setStateCapitalGainsRate,
    depreciationRecaptureRate, setDepreciationRecaptureRate,

    // Projections
    holdPeriod, setHoldPeriod,
    revenueGrowth, setRevenueGrowth,
    expenseGrowth, setExpenseGrowth,
    opexRatio, setOpexRatio,
    exitCapRate, setExitCapRate,

    // Capital structure
    investorEquityPct, setInvestorEquityPct,
    philanthropicEquityPct, setPhilanthropicEquityPct,
    seniorDebtPct, setSeniorDebtPct,
    philDebtPct, setPhilDebtPct,
    hdcSubDebtPct, setHdcSubDebtPct,
    hdcSubDebtPikRate, setHdcSubDebtPikRate,
    investorSubDebtPct, setInvestorSubDebtPct,
    investorSubDebtPikRate, setInvestorSubDebtPikRate,
    outsideInvestorSubDebtPct, setOutsideInvestorSubDebtPct,
    outsideInvestorSubDebtRate, setOutsideInvestorSubDebtRate,
    outsideInvestorSubDebtPikRate: outsideInvestorSubDebtRate, setOutsideInvestorSubDebtPikRate: setOutsideInvestorSubDebtRate,
    outsideInvestorSubDebtAmortization, setOutsideInvestorSubDebtAmortization,
    outsideInvestorPikCurrentPayEnabled, setOutsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct, setOutsideInvestorPikCurrentPayPct,
    subDebtPriority, setSubDebtPriority,
    investorEquityRatio, setInvestorEquityRatio,
    autoBalanceCapital, setAutoBalanceCapital,
    investorPromoteShare, setInvestorPromoteShare,

    // PIK settings
    pikCurrentPayEnabled, setPikCurrentPayEnabled,
    pikCurrentPayPct, setPikCurrentPayPct,
    investorPikCurrentPayEnabled, setInvestorPikCurrentPayEnabled,
    investorPikCurrentPayPct, setInvestorPikCurrentPayPct,

    // Debt settings
    seniorDebtAmortization, setSeniorDebtAmortization,
    seniorDebtRate, setSeniorDebtRate,
    seniorDebtIOYears, setSeniorDebtIOYears,
    philDebtAmortization, setPhilDebtAmortization,
    philDebtRate, setPhilDebtRate,
    philCurrentPayEnabled, setPhilCurrentPayEnabled,
    philCurrentPayPct, setPhilCurrentPayPct,
    
    // Interest Reserve
    interestReserveEnabled, setInterestReserveEnabled,
    interestReserveMonths, setInterestReserveMonths,

    // Opportunity Zone
    ozEnabled, setOzEnabled,
    ozType, setOzType,
    ozVersion, setOzVersion,
    ozDeferredCapitalGains, setOzDeferredCapitalGains,
    ozCapitalGainsTaxRate, setOzCapitalGainsTaxRate,

    // Investor Type
    investorType, setInvestorType,

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

    // State LIHTC (v7.0.10)
    stateLIHTCEnabled, setStateLIHTCEnabled,
    investorState, setInvestorState,
    syndicationRate, setSyndicationRate,
    investorHasStateLiability, setInvestorHasStateLiability,
    stateLIHTCUserPercentage, setStateLIHTCUserPercentage,
    stateLIHTCUserAmount, setStateLIHTCUserAmount,
    stateLIHTCSyndicationYear, setStateLIHTCSyndicationYear, // IMPL-073

    // Federal LIHTC (v7.0.11)
    lihtcEnabled, setLihtcEnabled,
    applicableFraction, setApplicableFraction,
    creditRate, setCreditRate,
    placedInServiceMonth, setPlacedInServiceMonth,
    ddaQctBoost, setDdaQctBoost,

    // Helpers
    handleStateChange,
    totalCapitalStructure,

    // IMPL-036: Config loading helpers to suppress auto-balance during load
    startConfigLoading,
    endConfigLoading
  };
};