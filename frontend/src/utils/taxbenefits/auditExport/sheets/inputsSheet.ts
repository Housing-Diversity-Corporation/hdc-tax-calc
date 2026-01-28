/**
 * IMPL-056: Live Calculation Excel Model - Inputs Sheet
 *
 * Sheet 1: All input parameters with named ranges.
 * This is the foundation sheet that all other sheets reference.
 */

import * as XLSX from 'xlsx';
import { CalculationParams } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, InputRow } from '../types';

/**
 * Build the Inputs sheet with all parameters and named ranges
 */
export function buildInputsSheet(params: CalculationParams): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];

  // Define all input rows organized by section
  const inputs: InputRow[] = [
    // === PROJECT DEFINITION === (starting row 5)
    { label: 'Project Cost ($M)', rangeName: 'ProjectCost', value: params.projectCost, units: '$M' },
    { label: 'Land Value ($M)', rangeName: 'LandValue', value: params.landValue, units: '$M' },
    { label: 'Predevelopment Costs ($M)', rangeName: 'PredevelopmentCosts', value: params.predevelopmentCosts || 0, units: '$M' },
    { label: 'Project Location', rangeName: 'ProjectLocation', value: params.projectLocation || '', units: '' },
    { label: 'Number of Units', rangeName: 'Units', value: 100, units: 'units' },
    { label: 'Closing Month (1-12)', rangeName: 'ClosingMonth', value: params.placedInServiceMonth || 7, units: 'month' },
    { label: 'Property State', rangeName: 'PropertyState', value: params.selectedState || 'CA', units: '' },
    { label: 'Hold Period (years)', rangeName: 'HoldPeriod', value: params.holdPeriod || 10, units: 'years' },
    { label: 'Stabilized NOI ($M)', rangeName: 'YearOneNOI', value: params.yearOneNOI, units: '$M' },
    { label: 'Revenue Growth Rate (%)', rangeName: 'RevenueGrowthRate', value: params.revenueGrowth, units: '%' },
    { label: 'Expense Growth Rate (%)', rangeName: 'ExpenseGrowthRate', value: params.expenseGrowth || params.revenueGrowth, units: '%' },
    { label: 'OpEx Ratio (%)', rangeName: 'OpExRatio', value: params.opexRatio || 45, units: '%' },
    { label: 'Exit Cap Rate (%)', rangeName: 'ExitCapRate', value: params.exitCapRate, units: '%' },
    { label: 'Stabilized Occupancy (%)', rangeName: 'StabilizedOccupancy', value: 95, units: '%' },
    { label: 'Lease-Up Months', rangeName: 'LeaseUpMonths', value: 18, units: 'months' },
    { label: 'Construction Delay (months)', rangeName: 'ConstructionDelayMonths', value: params.constructionDelayMonths || 0, units: 'months' },
    { label: 'Tax Benefit Delay (months)', rangeName: 'TaxBenefitDelayMonths', value: params.taxBenefitDelayMonths || 0, units: 'months' },

    // Blank row separator
    { label: '', rangeName: '', value: '', units: '' },

    // === CAPITAL STRUCTURE === (starting row 18)
    { label: 'Senior Debt (%)', rangeName: 'SeniorDebtPct', value: params.seniorDebtPct || 0, units: '%' },
    { label: 'Senior Debt Rate (%)', rangeName: 'SeniorDebtRate', value: params.seniorDebtRate || 5, units: '%' },
    { label: 'Senior Debt Term (years)', rangeName: 'SeniorDebtTerm', value: params.holdPeriod || 10, units: 'years' },
    { label: 'Senior Debt Amort (years)', rangeName: 'SeniorDebtAmort', value: params.seniorDebtAmortization || 35, units: 'years' },
    { label: 'Senior Debt IO Years', rangeName: 'SeniorDebtIOYears', value: params.seniorDebtIOYears || 0, units: 'years' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // Phil Debt
    { label: 'Phil Debt (%)', rangeName: 'PhilDebtPct', value: params.philanthropicDebtPct || 0, units: '%' },
    { label: 'Phil Debt Rate (%)', rangeName: 'PhilDebtRate', value: params.philanthropicDebtRate || 0, units: '%' },
    { label: 'Phil Debt Amortization (yrs)', rangeName: 'PhilDebtAmort', value: params.philDebtAmortization || 35, units: 'years' },
    { label: 'Phil Current Pay Enabled', rangeName: 'PhilCurrentPayEnabled', value: params.philCurrentPayEnabled ? 1 : 0, units: '0/1' },
    { label: 'Phil Current Pay (%)', rangeName: 'PhilCurrentPayPct', value: params.philCurrentPayPct || 0, units: '%' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // Investor Equity
    { label: 'Investor Equity (%)', rangeName: 'InvestorEquityPct', value: params.investorEquityPct, units: '%' },
    { label: 'Philanthropic Equity (%)', rangeName: 'PhilEquityPct', value: params.philanthropicEquityPct || 0, units: '%' },
    { label: 'Investor Equity Ratio (%)', rangeName: 'InvestorEquityRatio', value: params.investorEquityRatio || 50, units: '%' },
    { label: 'Auto-Balance Capital', rangeName: 'AutoBalanceCapital', value: params.autoBalanceCapital !== false ? 1 : 0, units: '0/1' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // HDC Sub-Debt
    { label: 'HDC Sub-Debt (%)', rangeName: 'HDCSubDebtPct', value: params.hdcSubDebtPct || 0, units: '%' },
    { label: 'HDC Sub-Debt PIK Rate (%)', rangeName: 'HDCSubDebtPIKRate', value: params.hdcSubDebtPikRate || 8, units: '%' },
    { label: 'HDC PIK Current Pay Enabled', rangeName: 'HDCPIKCurrentPayEnabled', value: params.pikCurrentPayEnabled ? 1 : 0, units: '0/1' },
    { label: 'HDC PIK Current Pay (%)', rangeName: 'HDCPIKCurrentPayPct', value: params.pikCurrentPayPct || 0, units: '%' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // Investor Sub-Debt
    { label: 'Investor Sub-Debt (%)', rangeName: 'InvestorSubDebtPct', value: params.investorSubDebtPct || 0, units: '%' },
    { label: 'Investor Sub-Debt PIK Rate', rangeName: 'InvestorSubDebtPIKRate', value: params.investorSubDebtPikRate || 8, units: '%' },
    { label: 'Inv PIK Current Pay Enabled', rangeName: 'InvestorPIKCurrentPayEnabled', value: params.investorPikCurrentPayEnabled ? 1 : 0, units: '0/1' },
    { label: 'Inv PIK Current Pay (%)', rangeName: 'InvestorPIKCurrentPayPct', value: params.investorPikCurrentPayPct || 0, units: '%' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // Outside Investor Sub-Debt
    { label: 'Outside Investor Sub-Debt (%)', rangeName: 'OutsideSubDebtPct', value: params.outsideInvestorSubDebtPct || 0, units: '%' },
    { label: 'Outside PIK Rate (%)', rangeName: 'OutsidePIKRate', value: params.outsideInvestorSubDebtPikRate || 8, units: '%' },
    { label: 'Outside Amortization (yrs)', rangeName: 'OutsideSubDebtAmort', value: params.outsideInvestorSubDebtAmortization || 10, units: 'years' },
    { label: 'Outside Current Pay Enabled', rangeName: 'OutsideCurrentPayEnabled', value: params.outsideInvestorPikCurrentPayEnabled ? 1 : 0, units: '0/1' },
    { label: 'Outside Current Pay (%)', rangeName: 'OutsideCurrentPayPct', value: params.outsideInvestorPikCurrentPayPct || 0, units: '%' },

    // Sub-debt payment priority (ISS-043)
    { label: 'Sub-Debt Priority: Outside', rangeName: 'SubDebtPriorityOutside', value: params.subDebtPriority?.outsideInvestor ?? 1, units: 'rank' },
    { label: 'Sub-Debt Priority: HDC', rangeName: 'SubDebtPriorityHDC', value: params.subDebtPriority?.hdc ?? 2, units: 'rank' },
    { label: 'Sub-Debt Priority: Investor', rangeName: 'SubDebtPriorityInvestor', value: params.subDebtPriority?.investor ?? 3, units: 'rank' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // HDC Debt Fund (IMPL-082)
    { label: 'HDC Debt Fund (%)', rangeName: 'HDCDebtFundPct', value: params.hdcDebtFundPct || 0, units: '%' },
    { label: 'HDC DF PIK Rate (%)', rangeName: 'HDCDFPIKRate', value: params.hdcDebtFundPikRate || 8, units: '%' },
    { label: 'HDC DF Current Pay Enabled', rangeName: 'HDCDFCurrentPayEnabled', value: params.hdcDebtFundCurrentPayEnabled ? 1 : 0, units: '0/1' },
    { label: 'HDC DF Current Pay (%)', rangeName: 'HDCDFCurrentPayPct', value: params.hdcDebtFundCurrentPayPct || 50, units: '%' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === TAX PARAMETERS ===
    { label: 'Federal Tax Rate (%)', rangeName: 'FederalTaxRate', value: params.federalTaxRate || 37, units: '%' },
    { label: 'NIIT Rate (%)', rangeName: 'NIITRate', value: params.niitRate || 3.8, units: '%' },
    { label: 'State Tax Rate (%)', rangeName: 'StateTaxRate', value: params.stateTaxRate || 0, units: '%' },
    { label: 'LT Capital Gains Rate (%)', rangeName: 'LTCapitalGainsRate', value: params.ltCapitalGainsRate || 20, units: '%' },
    { label: 'State Capital Gains Rate (%)', rangeName: 'StateCapitalGainsRate', value: params.stateCapitalGainsRate || 0, units: '%' },
    { label: 'Depreciation Recapture Rate (%)', rangeName: 'DepreciationRecaptureRate', value: params.depreciationRecaptureRate || 25, units: '%' },
    { label: 'Cost Segregation (%)', rangeName: 'CostSegPct', value: params.yearOneDepreciationPct || 20, units: '%' },
    { label: 'Bonus Depreciation (%)', rangeName: 'BonusDepreciationPct', value: 100, units: '%' },
    { label: 'Include Depreciation Schedule', rangeName: 'IncludeDepreciationSchedule', value: params.includeDepreciationSchedule !== false ? 1 : 0, units: '0/1' },
    { label: 'Investor State', rangeName: 'InvestorState', value: params.investorState || 'CA', units: '' },
    { label: 'State Conforms to Federal', rangeName: 'StateConforms', value: params.bonusConformityRate === 1 ? 1 : 0, units: '0/1' },
    { label: 'Investor Track', rangeName: 'InvestorTrack', value: params.investorTrack || 'rep', units: '' },
    { label: 'Is REP', rangeName: 'IsREP', value: params.investorTrack === 'rep' ? 1 : 0, units: '0/1' },
    { label: 'Passive Gain Type', rangeName: 'PassiveGainType', value: params.passiveGainType || 'short-term', units: '' },
    { label: 'Investor Type', rangeName: 'InvestorType', value: params.investorType || 'ordinary', units: '' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === TAX PLANNING INPUTS ===
    { label: 'W2 Income ($)', rangeName: 'W2Income', value: params.w2Income || 0, units: '$' },
    { label: 'Business Income ($)', rangeName: 'BusinessIncome', value: params.businessIncome || 0, units: '$' },
    { label: 'IRA Balance ($)', rangeName: 'IRABalance', value: params.iraBalance || 0, units: '$' },
    { label: 'Passive Income ($)', rangeName: 'PassiveIncome', value: params.passiveIncome || 0, units: '$' },
    { label: 'Asset Sale Gain ($)', rangeName: 'AssetSaleGain', value: params.assetGain || 0, units: '$' },
    { label: 'Annual Income ($)', rangeName: 'AnnualIncome', value: params.annualIncome || 0, units: '$' },
    { label: 'Filing Status', rangeName: 'FilingStatus', value: params.filingStatus || 'single', units: '' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === OZ PARAMETERS ===
    { label: 'OZ Enabled', rangeName: 'OZEnabled', value: params.ozEnabled ? 1 : 0, units: '0/1' },
    { label: 'OZ Version', rangeName: 'OZVersion', value: params.ozVersion === '2.0' ? 2 : 1, units: '1/2' },
    { label: 'OZ Type', rangeName: 'OZType', value: params.ozType || 'standard', units: '' },
    { label: 'Deferred Gain ($M)', rangeName: 'DeferredGain', value: params.deferredCapitalGains || 0, units: '$M' },
    { label: 'Capital Gains Tax Rate (%)', rangeName: 'CapitalGainsTaxRate', value: params.capitalGainsTaxRate || 23.8, units: '%' },
    { label: 'OZ Capital Gains Tax Rate (%)', rangeName: 'OZCapitalGainsTaxRate', value: params.ozCapitalGainsTaxRate || 23.8, units: '%' },
    { label: 'OZ Step-Up (%)', rangeName: 'OZStepUpPct', value: getOZStepUpPct(params), units: '%' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === LIHTC PARAMETERS ===
    { label: 'Federal LIHTC Enabled', rangeName: 'FedLIHTCEnabled', value: params.lihtcEnabled ? 1 : 0, units: '0/1' },
    { label: 'LIHTC Eligible Basis ($M)', rangeName: 'LIHTCEligibleBasis', value: params.lihtcEligibleBasis || 0, units: '$M' },
    { label: 'Applicable Fraction (%)', rangeName: 'ApplicableFraction', value: params.applicableFraction || 100, units: '%' },
    { label: 'LIHTC Rate (%)', rangeName: 'LIHTCRate', value: params.creditRate || 4, units: '%' },
    { label: 'Qualified Basis Boost', rangeName: 'QualifiedBasisBoost', value: params.ddaQctBoost ? 1 : 0, units: '0/1' },

    // Private Activity Bonds (IMPL-080)
    { label: 'PAB Enabled', rangeName: 'PABEnabled', value: params.pabEnabled ? 1 : 0, units: '0/1' },
    { label: 'PAB % of Eligible Basis', rangeName: 'PABPctOfEligibleBasis', value: params.pabPctOfEligibleBasis || 30, units: '%' },
    { label: 'PAB Rate (%)', rangeName: 'PABRate', value: params.pabRate || 4.5, units: '%' },
    { label: 'PAB Term (Yrs)', rangeName: 'PABTerm', value: params.pabTerm || 40, units: 'Years' },
    { label: 'PAB Amortization (Yrs)', rangeName: 'PABAmortization', value: params.pabAmortization || 40, units: 'Years' },
    { label: 'PAB IO Years', rangeName: 'PABIOYears', value: params.pabIOYears || 0, units: 'Years' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // ISS-035: LIHTC Eligible Basis Exclusions (IMPL-083)
    { label: 'Commercial Space Costs ($M)', rangeName: 'CommercialSpaceCosts', value: params.commercialSpaceCosts || 0, units: '$M' },
    { label: 'Syndication Costs ($M)', rangeName: 'SyndicationCosts', value: params.syndicationCosts || 0, units: '$M' },
    { label: 'Marketing/Org Costs ($M)', rangeName: 'MarketingCosts', value: params.marketingCosts || 0, units: '$M' },
    { label: 'Financing Fees ($M)', rangeName: 'FinancingFees', value: params.financingFees || 0, units: '$M' },
    { label: 'Bond Issuance Costs ($M)', rangeName: 'BondIssuanceCosts', value: params.bondIssuanceCosts || 0, units: '$M' },
    { label: 'Operating Deficit Reserve ($M)', rangeName: 'OperatingDeficitReserve', value: params.operatingDeficitReserve || 0, units: '$M' },
    { label: 'Replacement Reserve ($M)', rangeName: 'ReplacementReserve', value: params.replacementReserve || 0, units: '$M' },
    { label: 'Other Exclusions ($M)', rangeName: 'OtherExclusions', value: params.otherExclusions || 0, units: '$M' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    { label: 'State LIHTC Enabled', rangeName: 'StateLIHTCEnabled', value: params.stateLIHTCEnabled ? 1 : 0, units: '0/1' },
    { label: 'State LIHTC Rate (%)', rangeName: 'StateLIHTCRate', value: 0, units: '%' },
    // ISS-016: State LIHTC annual credit from UI calculation (not derived from rate)
    { label: 'State LIHTC Annual Credit', rangeName: 'StateLIHTCAnnualCredit', value: params.stateLIHTCAnnualCredit || 0, units: '$M' },
    // ISS-015: Use actual syndicationRate from params (percentage 0-100), default 85 for backwards compat
    { label: 'State LIHTC Syndication Rate', rangeName: 'StateLIHTCSyndRate', value: params.syndicationRate ?? 85, units: '%' },
    // ISS-015: Path is 'direct' if syndicationRate is 100%, otherwise 'syndicated'
    { label: 'State LIHTC Path', rangeName: 'StateLIHTCPath', value: (params.syndicationRate === 100) ? 'direct' : 'syndicated', units: '' },
    // IMPL-076: Year syndication proceeds are received (0=close/default, 1, 2)
    { label: 'State LIHTC Syndication Year', rangeName: 'StateLIHTCSyndYear', value: params.stateLIHTCSyndicationYear ?? 0, units: 'year' },
    // ISS-043: User override fields for State LIHTC
    { label: 'Investor Has State Liability', rangeName: 'InvestorHasStateLiability', value: params.investorHasStateLiability !== false ? 1 : 0, units: '0/1' },
    { label: 'State LIHTC User Percentage', rangeName: 'StateLIHTCUserPct', value: params.stateLIHTCUserPercentage || 0, units: '%' },
    { label: 'State LIHTC User Amount ($M)', rangeName: 'StateLIHTCUserAmount', value: params.stateLIHTCUserAmount || 0, units: '$M' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === FEE STRUCTURE ===
    { label: 'HDC Fee Rate (%)', rangeName: 'HDCFeeRate', value: params.hdcFeeRate || 1, units: '%' },
    { label: 'HDC Deferred Interest Rate (%)', rangeName: 'HDCDeferredInterestRate', value: params.hdcDeferredInterestRate || 8, units: '%' },
    { label: 'AUM Fee Enabled', rangeName: 'AUMFeeEnabled', value: params.aumFeeEnabled ? 1 : 0, units: '0/1' },
    { label: 'AUM Fee (%)', rangeName: 'AUMFeePct', value: params.aumFeeRate || 1, units: '%' },
    { label: 'AUM Current Pay Enabled', rangeName: 'AUMCurrentPayEnabled', value: params.aumCurrentPayEnabled ? 1 : 0, units: '0/1' },
    { label: 'AUM Current Pay (%)', rangeName: 'AUMCurrentPayPct', value: params.aumCurrentPayPct || 0, units: '%' },
    { label: 'HDC Platform Mode', rangeName: 'HDCPlatformMode', value: params.hdcPlatformMode || 'traditional', units: '' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === HDC ADVANCE FINANCING ===
    { label: 'HDC Advance Financing Enabled', rangeName: 'HDCAdvanceFinancing', value: params.hdcAdvanceFinancing ? 1 : 0, units: '0/1' },
    { label: 'Tax Advance Discount Rate (%)', rangeName: 'TaxAdvanceDiscountRate', value: params.taxAdvanceDiscountRate || 8, units: '%' },
    { label: 'Advance Financing Rate (%)', rangeName: 'AdvanceFinancingRate', value: params.advanceFinancingRate || 8, units: '%' },
    { label: 'Tax Delivery Months', rangeName: 'TaxDeliveryMonths', value: params.taxDeliveryMonths || 18, units: 'months' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    { label: 'Promote (%)', rangeName: 'PromotePct', value: 100 - params.investorPromoteShare, units: '%' },
    { label: 'Promote Hurdle Rate (%)', rangeName: 'PromoteHurdleRate', value: 8, units: '%' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === INTEREST RESERVE ===
    { label: 'Interest Reserve Enabled', rangeName: 'InterestReserveEnabled', value: params.interestReserveEnabled ? 1 : 0, units: '0/1' },
    { label: 'Interest Reserve Months', rangeName: 'InterestReserveMonths', value: params.interestReserveMonths || 0, units: 'months' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === PREFERRED EQUITY ===
    { label: 'Pref Equity Enabled', rangeName: 'PrefEquityEnabled', value: params.prefEquityEnabled ? 1 : 0, units: '0/1' },
    { label: 'Pref Equity (%)', rangeName: 'PrefEquityPct', value: params.prefEquityPct || 0, units: '%' },
    { label: 'Pref Equity Target MOIC', rangeName: 'PrefEquityTargetMOIC', value: params.prefEquityTargetMOIC || 1.7, units: 'x' },
    { label: 'Pref Equity Accrual Rate', rangeName: 'PrefEquityAccrualRate', value: params.prefEquityAccrualRate || 12, units: '%' },
    // ISS-062: Add missing pref equity OZ eligibility
    { label: 'Pref Equity OZ Eligible', rangeName: 'PrefEquityOZEligible', value: params.prefEquityOzEligible ? 1 : 0, units: '0/1' },

    // Blank row
    { label: '', rangeName: '', value: '', units: '' },

    // === BASIS ADJUSTMENTS (ISS-062) ===
    { label: 'Loan Fees (%)', rangeName: 'LoanFeesPct', value: params.loanFeesPercent || 0, units: '%' },
    { label: 'Legal/Structuring Costs ($M)', rangeName: 'LegalStructuringCosts', value: params.legalStructuringCosts || 0, units: '$M' },
    { label: 'Organization Costs ($M)', rangeName: 'OrganizationCosts', value: params.organizationCosts || 0, units: '$M' },
  ];

  // Build sheet data
  const data: (string | number)[][] = [
    ['HDC TAX BENEFITS MODEL', '', ''],
    ['Live Calculation Export', '', ''],
    ['', '', ''],
    ['Parameter', 'Value', 'Named Range'],
  ];

  // Track current row for named ranges (starts at row 5)
  let currentRow = 5;

  // Add input rows
  inputs.forEach((input) => {
    // Handle section headers (blank labels with blank rangeNames)
    if (input.label === '' && input.rangeName === '') {
      data.push(['', '', '']);
      currentRow++;
      return;
    }

    data.push([input.label, input.value as number, input.rangeName]);

    // Create named range for this input (only if rangeName is provided)
    if (input.rangeName) {
      namedRanges.push({
        name: input.rangeName,
        ref: `Inputs!$B$${currentRow}`,
      });
    }

    currentRow++;
  });

  // Create worksheet
  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  sheet['!cols'] = [
    { wch: 30 }, // Parameter name
    { wch: 15 }, // Value
    { wch: 25 }, // Named range
  ];

  return { sheet, namedRanges };
}

/**
 * Get OZ step-up percentage based on version and type
 * OZ 1.0: 0% (no step-up available post-2021)
 * OZ 2.0 Standard: 10%
 * OZ 2.0 Rural: 30%
 */
function getOZStepUpPct(params: CalculationParams): number {
  if (!params.ozEnabled) return 0;
  if (params.ozVersion === '1.0') return 0;
  // OZ 2.0
  return params.ozType === 'rural' ? 30 : 10;
}
