import { useState, useEffect } from 'react';
import { useHDCState } from '../../hooks/taxbenefits/useHDCState';
import { useHDCCalculations } from '../../hooks/taxbenefits/useHDCCalculations';
import { CONFORMING_STATES } from '../../utils/taxbenefits/constants';
import { formatCurrencyMillions } from '../../utils/taxbenefits/formatters';
// IMPL-020a: calculateMonthlyPayment removed - interest reserve now comes from useHDCCalculations hook
import HDCInputsComponent from './HDCInputsComponent';
import HDCResultsComponent from './HDCResultsComponent';
import { useTheme } from '../../contexts/ThemeContext';

const HDCCalculatorMain = () => {
  // Use global theme
  const { isDarkMode: darkMode } = useTheme();

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
    selectedState,
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
    ozEnabled,
    ozType, setOzType,
    ozVersion, setOzVersion,
    ozDeferredCapitalGains, setOzDeferredCapitalGains,
    ozCapitalGainsTaxRate, setOzCapitalGainsTaxRate,

    // Investor Track and Passive Gains
    investorTrack, setInvestorTrack,
    passiveGainType,

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

    // Federal LIHTC (v7.0.11)
    lihtcEnabled, setLihtcEnabled,
    applicableFraction, setApplicableFraction,
    creditRate, setCreditRate,
    placedInServiceMonth, setPlacedInServiceMonth,
    ddaQctBoost, setDdaQctBoost,

    // Expandable sections
    taxCalculationExpanded, setTaxCalculationExpanded,
    taxOffsetExpanded, setTaxOffsetExpanded,
    depreciationScheduleExpanded, setDepreciationScheduleExpanded,

    // Helper functions
    handleStateChange,

    // Calculated values
    totalCapitalStructure,

    // IMPL-036: Config loading helpers to suppress auto-balance during config load
    startConfigLoading,
    endConfigLoading
  } = useHDCState();

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
    ozVersion,
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
    assetSaleGain,

    // Federal LIHTC (v7.0.11)
    lihtcEnabled,
    applicableFraction,
    creditRate,
    placedInServiceMonth,
    ddaQctBoost,

    // State LIHTC (v7.0.14)
    stateLIHTCEnabled,
    investorState,
    syndicationRate,
    investorHasStateLiability,
    stateLIHTCUserPercentage,
    stateLIHTCUserAmount
  });

  // IMPL-020a: Interest reserve amount now comes from useHDCCalculations hook (single source of truth)
  const interestReserveAmount = calculations.interestReserveAmount || 0;

  return (
    <div className="container mx-auto p-4 md:p-6" style={{fontFamily: 'Arial, sans-serif'}}>
      <div className="text-center mb-3" style={{backgroundColor: darkMode ? '#1c3333' : '#407F7F', borderRadius: '8px', paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '1rem', paddingRight: '1rem', position: 'relative'}}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src={darkMode ? "/HDCLOGOWhite.png" : "/HDCLOGOWhiteCenter.png"} 
            alt="HDC Logo" 
            style={{ 
              width: '280px', 
              height: 'auto', 
              display: 'block'
            }} 
          />
          <h1 className="text-3xl font-bold" style={{ 
            color: darkMode ? '#5ba3a3' : 'white',
            letterSpacing: '0.5px',
            marginTop: '0.125rem'
          }}>OZ Benefits Calculator</h1>
        </div>
      </div>    

      <div className="text-center text-2xl mb-2" style={{
        fontWeight: '600',
        color: 'white',
        padding: '1rem 2rem',
        backgroundColor: darkMode ? '#1c3333' : 'var(--hdc-faded-jade)',
        borderRadius: '8px',
        boxShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>    
        Multi-year OZ investment model with tax benefits and comprehensive cash flow analysis    
      </div>

      {/* Sub-debt current pay status indicators */}
      {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
        <div className="text-center text-xs text-purple-600 mb-4 font-medium">  
          HDC Sub-Debt Current Pay Active - {pikCurrentPayPct}% of {hdcSubDebtPikRate}% interest paid annually (Years 2-10)
        </div>  
      )}

      {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && (
        <div className="text-center text-xs text-green-600 mb-4 font-medium">  
          Investor Sub-Debt Current Pay Active - {investorPikCurrentPayPct}% of {investorSubDebtPikRate}% interest received annually (Years 2-10)
        </div>  
      )}

      <style>{`
        @media (min-width: 1024px) {
          .hdc-calculator-container {
            flex-direction: row !important;
          }
        }
      `}</style>
      <div className="hdc-calculator-container gap-4 md:gap-6" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Inputs */}
        <div className="flex-1 min-w-0" style={{borderRadius:'8px'}}>
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
          // IMPL-020a: Pre-calculated effective project cost from engine
          effectiveProjectCost={calculations.effectiveProjectCost}
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
          stateLIHTCEnabled={stateLIHTCEnabled}
          setStateLIHTCEnabled={setStateLIHTCEnabled}
          investorState={investorState}
          setInvestorState={setInvestorState}
          syndicationRate={syndicationRate}
          setSyndicationRate={setSyndicationRate}
          investorHasStateLiability={investorHasStateLiability}
          setInvestorHasStateLiability={setInvestorHasStateLiability}
          stateLIHTCUserPercentage={stateLIHTCUserPercentage}
          setStateLIHTCUserPercentage={setStateLIHTCUserPercentage}
          stateLIHTCUserAmount={stateLIHTCUserAmount}
          setStateLIHTCUserAmount={setStateLIHTCUserAmount}
          lihtcEnabled={lihtcEnabled}
          setLihtcEnabled={setLihtcEnabled}
          applicableFraction={applicableFraction}
          setApplicableFraction={setApplicableFraction}
          creditRate={creditRate}
          setCreditRate={setCreditRate}
          placedInServiceMonth={placedInServiceMonth}
          setPlacedInServiceMonth={setPlacedInServiceMonth}
          ddaQctBoost={ddaQctBoost}
          setDdaQctBoost={setDdaQctBoost}
          lihtcEligibleBasis={calculations.lihtcEligibleBasis}
          handlePercentageChange={handlePercentageChange}
          handleStateChange={handleStateChange}
          formatCurrency={formatCurrencyMillions}
          CONFORMING_STATES={CONFORMING_STATES}
          totalCapitalStructure={totalCapitalStructure}
          isInvestorFacing={isInvestorFacing}
          setIsInvestorFacing={setIsInvestorFacing}
          dealDescription={dealDescription}
          setDealDescription={setDealDescription}
          dealLocation={dealLocation}
          setDealLocation={setDealLocation}
          dealLatitude={dealLatitude}
          setDealLatitude={setDealLatitude}
          dealLongitude={dealLongitude}
          setDealLongitude={setDealLongitude}
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
          startConfigLoading={startConfigLoading}
          endConfigLoading={endConfigLoading}
          />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0" style={{borderRadius:'8px'}}>
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
          passiveGainType={passiveGainType}
          stateTaxRate={stateTaxRate}
          deferredCapitalGains={ozDeferredCapitalGains}
          hdcFeeRate={hdcFeeRate}
          totalHdcFees={calculations.hdcFee}
          taxCalculationExpanded={taxCalculationExpanded}
          setTaxCalculationExpanded={setTaxCalculationExpanded}
          taxOffsetExpanded={taxOffsetExpanded}
          setTaxOffsetExpanded={setTaxOffsetExpanded}
          depreciationScheduleExpanded={depreciationScheduleExpanded}
          setDepreciationScheduleExpanded={setDepreciationScheduleExpanded}
          includeDepreciationSchedule={includeDepreciationSchedule}
          w2Income={w2Income}
          businessIncome={businessIncome}
          iraBalance={iraBalance}
          passiveIncome={passiveIncome}
          assetSaleGain={assetSaleGain}
          formatCurrency={formatCurrencyMillions}
          CONFORMING_STATES={CONFORMING_STATES}
          isConformingState={!!calculations.isConformingState}
          lihtcResult={calculations.lihtcResult}
          // Unified Benefits Summary (v7.0.14)
          federalLihtcTotalCredits={calculations.lihtcResult?.totalCredits}
          stateLihtcTotalCredits={calculations.stateLIHTCResult?.schedule?.totalCredits}
          stateLihtcEnabled={stateLIHTCEnabled}
          stateLIHTCIntegration={calculations.stateLIHTCIntegration}
          ozDeferralNPV={calculations.ozDeferralNPV}
          ozEnabled={ozEnabled}
          // IMPL-020a: Pre-calculated benefits from engine (single source of truth)
          total10YearBenefits={calculations.unifiedBenefitsSummary?.total10YearBenefits}
          benefitMultiple={calculations.unifiedBenefitsSummary?.benefitMultiple}
          excessBenefits={calculations.unifiedBenefitsSummary?.excessBenefits}
          />
        </div>
      </div>
    </div>
  );    
};

export default HDCCalculatorMain;