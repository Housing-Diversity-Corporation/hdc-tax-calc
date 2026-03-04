import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { computeTimeline } from '../../utils/taxbenefits/computeTimeline';
import { DEFAULT_VALUES } from '../../utils/taxbenefits';
import { getStateTaxRate, doesNIITApply } from '../../utils/taxbenefits/stateProfiles';
import { ValidationResult } from '../../utils/taxbenefits/validation';
import { ComputedTimeline } from '../../types/taxbenefits';

export const useHDCState = () => {
  // Basic state declarations

  // IMPL-036: Flag to suppress auto-balance during configuration loading
  // This prevents the auto-balance useEffect from overriding loaded config values
  const isLoadingConfigRef = useRef(false);
  // ISS-044b: State version to trigger re-render when loading completes
  // The ref alone doesn't cause re-render, so auto-balance never re-runs
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

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
  const [hdcAdvanceFinancing, setHdcAdvanceFinancing] = useState(false);
  const [taxAdvanceDiscountRate, setTaxAdvanceDiscountRate] = useState(DEFAULT_VALUES.TAX_ADVANCE_DISCOUNT_RATE);
  const [advanceFinancingRate, setAdvanceFinancingRate] = useState(DEFAULT_VALUES.ADVANCE_FINANCING_RATE);
  const [taxDeliveryMonths, setTaxDeliveryMonths] = useState(DEFAULT_VALUES.TAX_DELIVERY_MONTHS);
  const [constructionDelayMonths, setConstructionDelayMonths] = useState(0); // 0-36 months construction delay
  // placedInServiceMonth state removed (IMPL-117) — engine auto-derives from timeline
  // exitMonth state removed (IMPL-117) — engine auto-derives from timeline

  // === NEW: Timing Architecture (IMPL-112) ===
  const [investmentDate, setInvestmentDate] = useState<string>('');
  const [pisDateOverride, setPisDateOverride] = useState<string | null>(null);
  const [exitExtensionMonths, setExitExtensionMonths] = useState<number>(0);
  const [electDeferCreditPeriod, setElectDeferCreditPeriod] = useState<boolean>(false);

  const [aumFeeEnabled, setAumFeeEnabled] = useState(false);
  const [aumFeeRate, setAumFeeRate] = useState(DEFAULT_VALUES.AUM_FEE_RATE);
  const [aumCurrentPayEnabled, setAumCurrentPayEnabled] = useState(false);
  const [aumCurrentPayPct, setAumCurrentPayPct] = useState(50); // Default 50% current pay
  const [hdcPlatformMode, setHdcPlatformMode] = useState<'traditional' | 'leverage'>('traditional'); // HDC Platform mode
  const [ltCapitalGainsRate, setLtCapitalGainsRate] = useState(DEFAULT_VALUES.LT_CAPITAL_GAINS_RATE);
  const [niitRate, setNiitRate] = useState(DEFAULT_VALUES.NIIT_RATE);
  const [stateCapitalGainsRate, setStateCapitalGainsRate] = useState(DEFAULT_VALUES.STATE_CAPITAL_GAINS_RATE);
  // IMPL-096: depreciationRecaptureRate removed — rates derived inside calculateExitTax()

  // Projections — holdPeriod computed from LIHTC credit exhaustion
  // IMPL-117: Inlined from deleted computeHoldPeriod.ts (pisMonth=7 default → creditPeriod=11)
  const { holdFromPIS, totalInvestmentYears, exitYear, delaySpilloverYears } = useMemo(() => {
    const creditPeriod = 11; // pisMonth=7 (non-January) → 11 years per §42(f)(3)
    const prePIS = Math.floor(constructionDelayMonths / 12);
    const totalMonths = constructionDelayMonths + (creditPeriod * 12);
    const total = Math.ceil(totalMonths / 12) + 1; // +1 disposition
    const exit = prePIS + creditPeriod + 1;
    return { holdFromPIS: creditPeriod, totalInvestmentYears: total, exitYear: exit, delaySpilloverYears: total - exit };
  }, [constructionDelayMonths]);
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  const [noiGrowthRate, setNoiGrowthRate] = useState(DEFAULT_VALUES.NOI_GROWTH_RATE);
  const [exitCapRate, setExitCapRate] = useState(DEFAULT_VALUES.EXIT_CAP_RATE);

  // Capital structure
  const [investorEquityPct, setInvestorEquityPct] = useState(DEFAULT_VALUES.INVESTOR_EQUITY_PCT);
  const [philanthropicEquityPct, setPhilanthropicEquityPct] = useState(DEFAULT_VALUES.PHILANTHROPIC_EQUITY_PCT);
  const [seniorDebtPct, setSeniorDebtPct] = useState(DEFAULT_VALUES.SENIOR_DEBT_PCT);
  // ISS-032: Must-pay debt target = Senior + PAB combined (user's leverage target)
  // When PAB enabled, Senior adjusts down to maintain this total
  const [mustPayDebtTarget, setMustPayDebtTarget] = useState(DEFAULT_VALUES.SENIOR_DEBT_PCT);
  const [philDebtPct, setPhilDebtPct] = useState(DEFAULT_VALUES.PHIL_DEBT_PCT);
  const [hdcSubDebtPct, setHdcSubDebtPct] = useState(DEFAULT_VALUES.HDC_SUB_DEBT_PCT);
  const [hdcSubDebtPikRate, setHdcSubDebtPikRate] = useState(DEFAULT_VALUES.HDC_SUB_DEBT_PIK_RATE);
  const [investorSubDebtPct, setInvestorSubDebtPct] = useState(DEFAULT_VALUES.INVESTOR_SUB_DEBT_PCT);
  const [investorSubDebtPikRate, setInvestorSubDebtPikRate] = useState(DEFAULT_VALUES.INVESTOR_SUB_DEBT_PIK_RATE);
  const [outsideInvestorSubDebtPct, setOutsideInvestorSubDebtPct] = useState(0);
  const [outsideInvestorSubDebtPikRate, setOutsideInvestorSubDebtPikRate] = useState(8);
  const [outsideInvestorSubDebtAmortization, setOutsideInvestorSubDebtAmortization] = useState(10);
  const [outsideInvestorPikCurrentPayEnabled, setOutsideInvestorPikCurrentPayEnabled] = useState(false);
  const [outsideInvestorPikCurrentPayPct, setOutsideInvestorPikCurrentPayPct] = useState(0);

  // HDC Debt Fund (IMPL-082) - Separate from Outside Investor
  const [hdcDebtFundPct, setHdcDebtFundPct] = useState(0);
  const [hdcDebtFundPikRate, setHdcDebtFundPikRate] = useState(8);
  const [hdcDebtFundCurrentPayEnabled, setHdcDebtFundCurrentPayEnabled] = useState(false);
  const [hdcDebtFundCurrentPayPct, setHdcDebtFundCurrentPayPct] = useState(50);

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
  const [deferredCapitalGains, setDeferredCapitalGains] = useState(0);
  const [ozCapitalGainsTaxRate, setOzCapitalGainsTaxRate] = useState(23.8); // Default to federal LTCG + NIIT

  // === NEW: Date-driven timeline (IMPL-112) ===
  const computedTimeline: ComputedTimeline | null = useMemo(() => {
    if (!investmentDate) return null;
    return computeTimeline(
      investmentDate,
      constructionDelayMonths,
      pisDateOverride,
      ozEnabled,
      exitExtensionMonths,
      electDeferCreditPeriod
    );
  }, [investmentDate, constructionDelayMonths, pisDateOverride,
      ozEnabled, exitExtensionMonths, electDeferCreditPeriod]);

  // === Guard: §42(f)(1) election disabled for January PIS ===
  useEffect(() => {
    if (computedTimeline && computedTimeline.pisCalendarMonth === 1) {
      setElectDeferCreditPeriod(false);
    }
  }, [computedTimeline?.pisCalendarMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Investor Type
  const [investorType, setInvestorType] = useState<'ordinary' | 'stcg' | 'ltcg' | 'custom'>('ordinary');

  // Investor Track and Passive Gains for new tax framework
  const [investorTrack, setInvestorTrack] = useState<'rep' | 'non-rep'>('rep');
  const [passiveGainType, setPassiveGainType] = useState<'short-term' | 'long-term'>('short-term');

  // Investor Information
  const [annualIncome, setAnnualIncome] = useState<number>(0);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('single');

  // Income Composition (Phase A2 - Tax Utilization)
  const [annualOrdinaryIncome, setAnnualOrdinaryIncome] = useState<number>(750000);
  const [annualPassiveIncome, setAnnualPassiveIncome] = useState<number>(0);
  const [annualPortfolioIncome, setAnnualPortfolioIncome] = useState<number>(0);
  const [groupingElection, setGroupingElection] = useState<boolean>(false);

  // IMPL-097: NIIT three-source determination
  // Territory auto-detect (PR/GU/VI/AS/MP) → false
  // REP + grouping election → false
  // Default (passive/non-REP) → true
  const niitApplies = useMemo(
    () => doesNIITApply(selectedState) && !groupingElection,
    [selectedState, groupingElection]
  );

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
  // placedInServiceMonth removed (IMPL-117)
  const [ddaQctBoost, setDdaQctBoost] = useState(false);

  // Private Activity Bonds (IMPL-080)
  const [pabEnabled, setPabEnabled] = useState(false);
  const [pabPctOfEligibleBasis, setPabPctOfEligibleBasis] = useState(30); // 30% default (WSHFC requirement)
  const [pabRate, setPabRate] = useState(4.5); // Tax-exempt rate
  const [pabTerm, setPabTerm] = useState(40);
  const [pabAmortization, setPabAmortization] = useState(40);
  const [pabIOYears, setPabIOYears] = useState(0);
  // ISS-029: PAB funding amount (calculated externally, used for auto-balance)
  // This is in $M and represents the actual PAB financing amount from eligible basis calculation
  const [pabFundingAmount, setPabFundingAmount] = useState(0);

  // IMPL-083: Eligible Basis Exclusions (all in millions, default $0)
  const [commercialSpaceCosts, setCommercialSpaceCosts] = useState(0);
  const [syndicationCosts, setSyndicationCosts] = useState(0);
  const [marketingCosts, setMarketingCosts] = useState(0);
  const [financingFees, setFinancingFees] = useState(0);
  const [bondIssuanceCosts, setBondIssuanceCosts] = useState(0);
  const [operatingDeficitReserve, setOperatingDeficitReserve] = useState(0);
  const [replacementReserve, setReplacementReserve] = useState(0);
  const [otherExclusions, setOtherExclusions] = useState(0);

  // ISS-032: Track previous PAB state to detect enable/disable transitions
  const prevPabEnabledRef = useRef(false);
  const prevPabFundingRef = useRef(0);
  // ISS-042: Track user's PAB % setting to distinguish user intent from derived changes
  // Only adjust senior debt when user explicitly changes PAB %, not when eligible basis changes
  const prevPabPctOfEligibleBasisRef = useRef(30); // Default matches initial state

  // ISS-040d: Flag to prevent useEffect from interfering with active user input
  // When user is editing Senior Debt field, we skip the PAB adjustment logic
  const isUserEditingDebtRef = useRef(false);

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

  // ISS-032: PAB replaces Senior Debt, not Equity
  // When PAB is enabled/changes, adjust seniorDebtPct to maintain total must-pay leverage
  // ISS-042: Only adjust when USER changes PAB settings, not when derived values change
  useEffect(() => {
    // ISS-044 DEBUG: Trace PAB adjustment
    console.log('ISS-044 PAB-ADJUST: useEffect triggered');
    console.log('  isLoadingConfigRef.current:', isLoadingConfigRef.current);
    console.log('  isUserEditingDebtRef.current:', isUserEditingDebtRef.current);
    console.log('  pabEnabled:', pabEnabled, 'prevPabEnabledRef:', prevPabEnabledRef.current);

    // Skip during config loading - but STILL update refs to prevent stale state
    // ISS-044 FIX: Refs must be updated even when skipping, otherwise Case 1 will
    // fire later with stale ref values, causing double-reduction of senior debt
    if (isLoadingConfigRef.current) {
      console.log('  SKIPPED: config loading - but updating refs');
      prevPabEnabledRef.current = pabEnabled;
      prevPabFundingRef.current = pabFundingAmount;
      prevPabPctOfEligibleBasisRef.current = pabPctOfEligibleBasis;
      return;
    }
    // ISS-040d: Skip during active user editing to prevent input interference
    // Refs are NOT updated here because we want the adjustment to fire after editing
    if (isUserEditingDebtRef.current) {
      console.log('  SKIPPED: user editing debt');
      return;
    }

    const pabPct = projectCost > 0 ? (pabFundingAmount / projectCost) * 100 : 0;
    console.log('  pabPct:', pabPct, '(pabFundingAmount:', pabFundingAmount, ')');
    const wasEnabled = prevPabEnabledRef.current;
    // ISS-042: Check if USER changed the PAB percentage setting (not derived from land value change)
    const userChangedPabPct = Math.abs(pabPctOfEligibleBasis - prevPabPctOfEligibleBasisRef.current) > 0.01;
    console.log('  userChangedPabPct:', userChangedPabPct, '(current:', pabPctOfEligibleBasis, 'prev:', prevPabPctOfEligibleBasisRef.current, ')');

    console.log('  seniorDebtPct:', seniorDebtPct, 'mustPayDebtTarget:', mustPayDebtTarget);

    // Case 1: PAB just enabled - capture current senior as target and reduce by PAB
    if (pabEnabled && !wasEnabled && pabPct > 0) {
      console.log('  CASE 1: PAB just enabled - reducing senior debt');
      // Store current senior debt as the must-pay target
      setMustPayDebtTarget(seniorDebtPct);
      // Reduce senior debt by PAB amount
      const newSenior = Math.max(0, seniorDebtPct - pabPct);
      console.log('    newSenior:', newSenior, '(', seniorDebtPct, '-', pabPct, ')');
      setSeniorDebtPct(Number(newSenior.toFixed(2)));
    }
    // Case 2: PAB % setting changed by USER while enabled - adjust senior to maintain target
    // ISS-042: Only fires when user explicitly changes pabPctOfEligibleBasis, not when
    // pabFundingAmount changes due to land value or other basis changes
    else if (pabEnabled && wasEnabled && userChangedPabPct) {
      console.log('  CASE 2: PAB % changed - adjusting senior debt');
      const newSenior = Math.max(0, mustPayDebtTarget - pabPct);
      console.log('    newSenior:', newSenior, '(', mustPayDebtTarget, '-', pabPct, ')');
      setSeniorDebtPct(Number(newSenior.toFixed(2)));
    }
    // Case 3: PAB just disabled - restore senior to target
    else if (!pabEnabled && wasEnabled) {
      console.log('  CASE 3: PAB just disabled - restoring senior debt to', mustPayDebtTarget);
      setSeniorDebtPct(mustPayDebtTarget);
    }
    else {
      console.log('  NO CASE MATCHED - no adjustment');
    }

    // Update refs for next comparison
    prevPabEnabledRef.current = pabEnabled;
    prevPabFundingRef.current = pabFundingAmount;
    prevPabPctOfEligibleBasisRef.current = pabPctOfEligibleBasis;
    console.log('  Updated refs - prevPabEnabledRef:', pabEnabled);
  }, [pabEnabled, pabFundingAmount, projectCost, mustPayDebtTarget, seniorDebtPct, pabPctOfEligibleBasis]);

  // ISS-032: When user manually changes senior debt and PAB is disabled, update the target
  useEffect(() => {
    if (!pabEnabled && !isLoadingConfigRef.current) {
      // Only update if significantly different to avoid loops
      if (Math.abs(mustPayDebtTarget - seniorDebtPct) > 0.01) {
        setMustPayDebtTarget(seniorDebtPct);
      }
    }
  }, [seniorDebtPct, pabEnabled, mustPayDebtTarget]);

  // Auto-balance equity when enabled
  // IMPL-036: Skip auto-balance during configuration loading to preserve loaded values
  // ISS-029: Now accounts for PAB funding as a source that reduces equity requirement
  useEffect(() => {
    // ISS-044 DEBUG: Trace auto-balance execution
    console.log('ISS-044 AUTO-BALANCE: useEffect triggered');
    console.log('  isLoadingConfigRef.current:', isLoadingConfigRef.current);
    console.log('  autoBalanceCapital:', autoBalanceCapital);
    console.log('  investorEquityRatio:', investorEquityRatio);

    // IMPL-036: Skip if currently loading a configuration
    if (isLoadingConfigRef.current) {
      console.log('  SKIPPED: isLoadingConfigRef is true');
      return;
    }
    if (!autoBalanceCapital) {
      console.log('  SKIPPED: autoBalanceCapital is false');
      return;
    }
    if (investorEquityRatio < 0 || investorEquityRatio > 100) {
      console.log('  SKIPPED: investorEquityRatio out of range');
      return;
    }

    // Debug specifically for value 1
    if (Math.abs(hdcSubDebtPct - 1) < 0.001) {
      console.log('HDC Sub-debt is exactly 1, in useEffect');
    }

    const totalDebt = seniorDebtPct + philDebtPct + hdcSubDebtPct + investorSubDebtPct + outsideInvestorSubDebtPct + hdcDebtFundPct;
    console.log('  totalDebt:', totalDebt, '(senior:', seniorDebtPct, 'phil:', philDebtPct, 'hdcSub:', hdcSubDebtPct, 'invSub:', investorSubDebtPct, 'outside:', outsideInvestorSubDebtPct, 'hdcDF:', hdcDebtFundPct, ')');

    // ISS-029: Calculate PAB contribution as % of project cost
    // PAB provides funding from eligible basis, reducing equity requirement
    const pabPctOfProject = projectCost > 0 ? (pabFundingAmount / projectCost) * 100 : 0;
    console.log('  pabPctOfProject:', pabPctOfProject, '(pabFundingAmount:', pabFundingAmount, 'projectCost:', projectCost, ')');

    // Total sources = debt% + PAB% + equity% = 100%
    const remainingForEquity = Math.max(0, 100 - totalDebt - pabPctOfProject);
    console.log('  remainingForEquity:', remainingForEquity, '(100 -', totalDebt, '-', pabPctOfProject, ')');

    // If no room for equity, set both to 0
    if (remainingForEquity <= 0) {
      console.log('  NO ROOM FOR EQUITY - setting to 0');
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
    console.log('  newInvestorEquity:', newInvestorEquity, 'newPhilanthropicEquity:', newPhilanthropicEquity);
    console.log('  current investorEquityPct:', investorEquityPct, 'philanthropicEquityPct:', philanthropicEquityPct);

    // Only update if there's a meaningful difference
    const investorDiff = Math.abs(investorEquityPct - newInvestorEquity);
    const philDiff = Math.abs(philanthropicEquityPct - newPhilanthropicEquity);
    console.log('  investorDiff:', investorDiff, 'philDiff:', philDiff);

    if (investorDiff > 0.01 || philDiff > 0.01) {
      console.log('  UPDATING equity values via setTimeout');
      // Use setTimeout to break the update cycle
      setTimeout(() => {
        setInvestorEquityPct(Number(newInvestorEquity.toFixed(2)));
        setPhilanthropicEquityPct(Number(newPhilanthropicEquity.toFixed(2)));
      }, 0);
    } else {
      console.log('  SKIPPED: difference too small');
    }
  }, [seniorDebtPct, philDebtPct, hdcSubDebtPct, investorSubDebtPct, outsideInvestorSubDebtPct, hdcDebtFundPct, investorEquityRatio, autoBalanceCapital, investorEquityPct, philanthropicEquityPct, pabFundingAmount, projectCost, isLoadingConfig]);  // ISS-044b: Added isLoadingConfig to re-run when loading completes

  // IMPL-036: Helper functions to control config loading state
  const startConfigLoading = useCallback(() => {
    isLoadingConfigRef.current = true;
    setIsLoadingConfig(true);  // ISS-044b: Also set state for re-render
  }, []);

  const endConfigLoading = useCallback(() => {
    // Small delay to ensure all state updates have propagated
    setTimeout(() => {
      isLoadingConfigRef.current = false;
      setIsLoadingConfig(false);  // ISS-044b: Triggers re-render so auto-balance re-runs
    }, 100);
  }, []);

  // ISS-040d: Helper functions to control user editing state for debt inputs
  // This prevents the PAB adjustment useEffect from interfering with active typing
  const startDebtEditing = useCallback(() => {
    isUserEditingDebtRef.current = true;
  }, []);

  const endDebtEditing = useCallback(() => {
    isUserEditingDebtRef.current = false;
  }, []);

  // ISS-031: Calculate PAB as % of project cost for display and total
  // PAB is sized from eligible basis but funds project cost, so we express it as % of project
  const pabPctOfProject = projectCost > 0 ? (pabFundingAmount / projectCost) * 100 : 0;

  // Calculate total capital structure (now includes PAB)
  // ISS-031: PAB is included as its equivalent % of project cost
  const totalCapitalStructure = investorEquityPct + philanthropicEquityPct + seniorDebtPct + philDebtPct + hdcSubDebtPct + investorSubDebtPct + outsideInvestorSubDebtPct + hdcDebtFundPct + pabPctOfProject;

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
    hdcAdvanceFinancing, setHdcAdvanceFinancing,
    taxAdvanceDiscountRate, setTaxAdvanceDiscountRate,
    advanceFinancingRate, setAdvanceFinancingRate,
    taxDeliveryMonths, setTaxDeliveryMonths,
    constructionDelayMonths, setConstructionDelayMonths,
    aumFeeEnabled, setAumFeeEnabled,
    aumFeeRate, setAumFeeRate,
    aumCurrentPayEnabled, setAumCurrentPayEnabled,
    aumCurrentPayPct, setAumCurrentPayPct,
    hdcPlatformMode, setHdcPlatformMode,
    ltCapitalGainsRate, setLtCapitalGainsRate,
    niitRate, setNiitRate,
    stateCapitalGainsRate, setStateCapitalGainsRate,
    // IMPL-096: depreciationRecaptureRate removed from return

    // Projections — computed hold period (read-only)
    totalInvestmentYears, holdFromPIS, exitYear, delaySpilloverYears,
    // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
    noiGrowthRate, setNoiGrowthRate,
    exitCapRate, setExitCapRate,

    // Capital structure
    investorEquityPct, setInvestorEquityPct,
    philanthropicEquityPct, setPhilanthropicEquityPct,
    seniorDebtPct, setSeniorDebtPct,
    // ISS-032: Must-pay debt target (Senior + PAB combined)
    mustPayDebtTarget, setMustPayDebtTarget,
    philDebtPct, setPhilDebtPct,
    hdcSubDebtPct, setHdcSubDebtPct,
    hdcSubDebtPikRate, setHdcSubDebtPikRate,
    investorSubDebtPct, setInvestorSubDebtPct,
    investorSubDebtPikRate, setInvestorSubDebtPikRate,
    outsideInvestorSubDebtPct, setOutsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate, setOutsideInvestorSubDebtPikRate,
    outsideInvestorSubDebtAmortization, setOutsideInvestorSubDebtAmortization,
    outsideInvestorPikCurrentPayEnabled, setOutsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct, setOutsideInvestorPikCurrentPayPct,
    // HDC Debt Fund (IMPL-082)
    hdcDebtFundPct, setHdcDebtFundPct,
    hdcDebtFundPikRate, setHdcDebtFundPikRate,
    hdcDebtFundCurrentPayEnabled, setHdcDebtFundCurrentPayEnabled,
    hdcDebtFundCurrentPayPct, setHdcDebtFundCurrentPayPct,
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
    deferredCapitalGains, setDeferredCapitalGains,
    ozCapitalGainsTaxRate, setOzCapitalGainsTaxRate,

    // Investor Type
    investorType, setInvestorType,

    // Investor Track and Passive Gains
    investorTrack, setInvestorTrack,
    passiveGainType, setPassiveGainType,

    // Investor Information
    annualIncome, setAnnualIncome,
    filingStatus, setFilingStatus,

    // Income Composition (Phase A2 - Tax Utilization)
    annualOrdinaryIncome, setAnnualOrdinaryIncome,
    annualPassiveIncome, setAnnualPassiveIncome,
    annualPortfolioIncome, setAnnualPortfolioIncome,
    groupingElection, setGroupingElection,
    niitApplies, // IMPL-097: Computed from territory + grouping election + default

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
    // Private Activity Bonds (IMPL-080)
    pabEnabled, setPabEnabled,
    pabPctOfEligibleBasis, setPabPctOfEligibleBasis,
    pabRate, setPabRate,
    pabTerm, setPabTerm,
    pabAmortization, setPabAmortization,
    pabIOYears, setPabIOYears,
    // ISS-029: PAB funding amount (set from calculations, used for auto-balance)
    pabFundingAmount, setPabFundingAmount,
    // ISS-031: PAB as % of project cost (for display in capital stack)
    pabPctOfProject,
    // IMPL-083: Eligible Basis Exclusions
    commercialSpaceCosts, setCommercialSpaceCosts,
    syndicationCosts, setSyndicationCosts,
    marketingCosts, setMarketingCosts,
    financingFees, setFinancingFees,
    bondIssuanceCosts, setBondIssuanceCosts,
    operatingDeficitReserve, setOperatingDeficitReserve,
    replacementReserve, setReplacementReserve,
    otherExclusions, setOtherExclusions,
    applicableFraction, setApplicableFraction,
    creditRate, setCreditRate,
    // placedInServiceMonth removed (IMPL-117) — engine auto-derives from timeline
    // exitMonth removed (IMPL-117) — engine auto-derives from timeline
    ddaQctBoost, setDdaQctBoost,

    // Helpers
    handleStateChange,
    totalCapitalStructure,

    // IMPL-036: Config loading helpers to suppress auto-balance during load
    startConfigLoading,
    endConfigLoading,

    // ISS-040d: Debt editing helpers to prevent PAB adjustment during user input
    startDebtEditing,
    endDebtEditing,

    // NEW: Timing Architecture (IMPL-112)
    investmentDate,
    setInvestmentDate,
    pisDateOverride,
    setPisDateOverride,
    exitExtensionMonths,
    setExitExtensionMonths,
    electDeferCreditPeriod,
    setElectDeferCreditPeriod,
    computedTimeline,
  };
};