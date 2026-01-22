/**
 * IMPL-037: Audit Export Package - Formula Map v2.1
 *
 * Comprehensive documentation of all calculation functions across 6 modules.
 * Each entry includes:
 * - tsFile: Source file path
 * - tsLine: Line number where calculation occurs
 * - tsLogic: The TypeScript expression
 * - excelFormula: Equivalent Excel formula
 * - dependencies: Input fields required
 *
 * @version 2.1.0
 * @date 2025-12-29
 * @task IMPL-037 (supersedes IMPL-023)
 *
 * Version History:
 * | Version | Date       | IMPL     | Changes |
 * |---------|------------|----------|---------|
 * | 2.0.0   | 2025-12-29 | IMPL-037 | Complete rewrite with 6 modules |
 * | 2.1.0   | 2025-12-29 | IMPL-041 | Added state conformity logic, split tax rates |
 *
 * CHANGELOG v2.1.0:
 * - calc-taxben-001: Updated to show split rates for bonus vs MACRS depreciation
 * - Added util-conformity-001: getStateBonusConformityRate() function
 * - calc-depr-y1-001: Updated tsLine from 400 → 425 (added conformity logic)
 *
 * CHANGELOG v2.0.0:
 * - Updated line numbers to match current codebase
 * - calc-dscr-001: line 592 → 605
 * - calc-exit-001: line 1244 → 1293
 * - calc-exit-proceeds-001: line 1294 → 1343
 * - calc-moic-001: line 1385 → 1430+
 * - Added operationalDSCR distinction from managed DSCR
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Formula documentation entry
 */
export interface FormulaEntry {
  /** Unique identifier for the formula */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the formula calculates */
  description: string;
  /** Source file path relative to src/utils/taxbenefits */
  tsFile: string;
  /** Line number in source file */
  tsLine: number;
  /** TypeScript expression/logic */
  tsLogic: string;
  /** Equivalent Excel formula */
  excelFormula: string;
  /** Input fields/variables required */
  dependencies: string[];
  /** Output field name */
  output: string;
  /** Category/module grouping */
  category: FormulaCategory;
  /** Notes or special considerations */
  notes?: string;
}

/**
 * Categories matching the 6 modules per spec Section 4
 */
export type FormulaCategory =
  | 'calculations'           // Main IRR/NPV/Waterfall (calculations.ts)
  | 'lihtcCredits'          // Federal LIHTC (lihtcCreditCalculations.ts)
  | 'stateLIHTC'            // State LIHTC (stateLIHTCCalculations.ts)
  | 'depreciation'          // Depreciation schedule (depreciationSchedule.ts)
  | 'preferredEquity'       // Preferred equity (preferredEquityCalculations.ts)
  | 'territorialTax'        // Territorial tax (territorialTaxCalculations.ts)
  | 'supporting';           // Supporting utilities (basis, interest reserve, etc.)

// ============================================================================
// MODULE 1: CALCULATIONS.TS - Main IRR/NPV/Waterfall
// ============================================================================

const calculationsFormulas: FormulaEntry[] = [
  // IRR Calculation
  {
    id: 'calc-irr-001',
    name: 'Internal Rate of Return (IRR)',
    description: 'Calculate IRR using Newton-Raphson method. IRR is the discount rate that makes NPV = 0.',
    tsFile: 'calculations.ts',
    tsLine: 42,
    tsLogic: `
      const completeCashFlows = [-initialInvestment, ...cashFlows];
      let rate = 0.1;
      for (let i = 0; i < maxIterations; i++) {
        let npv = 0, dnpv = 0;
        for (let t = 0; t < completeCashFlows.length; t++) {
          const factor = Math.pow(1 + rate, t);
          npv += completeCashFlows[t] / factor;
          if (t > 0) dnpv -= t * completeCashFlows[t] / (factor * (1 + rate));
        }
        if (Math.abs(npv) < 1e-7) return rate * 100;
        rate = rate - npv / dnpv;
      }
    `,
    excelFormula: '=IRR(A1:A11)*100  // Where A1=-initialInvestment, A2:A11=cashFlows',
    dependencies: ['cashFlows[]', 'initialInvestment', 'holdPeriod'],
    output: 'irr',
    category: 'calculations',
    notes: 'Returns percentage (e.g., 15.5 for 15.5%). Falls back to simple CAGR if Newton-Raphson fails.'
  },

  // Monthly Payment Calculation
  {
    id: 'calc-pmt-001',
    name: 'Monthly Loan Payment',
    description: 'Standard amortization formula: PMT = P * (r(1+r)^n) / ((1+r)^n - 1)',
    tsFile: 'calculations.ts',
    tsLine: 86,
    tsLogic: `
      const monthlyRate = annualRate / 12;
      const totalPayments = years * 12;
      const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
      return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / denominator;
    `,
    excelFormula: '=PMT(annualRate/12, years*12, -principal)',
    dependencies: ['principal', 'annualRate', 'years'],
    output: 'monthlyPayment',
    category: 'calculations',
    notes: 'Returns 0 for zero principal or zero term. Zero interest = equal principal payments.'
  },

  // Remaining Balance Calculation
  {
    id: 'calc-balance-001',
    name: 'Remaining Loan Balance',
    description: 'Iterative method to track principal reduction after payments made.',
    tsFile: 'calculations.ts',
    tsLine: 111,
    tsLogic: `
      let balance = principal;
      for (let i = 0; i < paymentsMade; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance = Math.max(0, balance - principalPayment);
      }
      return balance;
    `,
    excelFormula: '=FV(annualRate/12, paymentsMade, PMT(annualRate/12, years*12, -principal), -principal)',
    dependencies: ['principal', 'annualRate', 'years', 'paymentsMade'],
    output: 'remainingBalance',
    category: 'calculations'
  },

  // Depreciable Basis Calculation
  {
    id: 'calc-basis-001',
    name: 'Depreciable Basis',
    description: 'OZ depreciable basis = Project Cost + Predevelopment - Land. Excludes investor equity from QCGs.',
    tsFile: 'calculations.ts',
    tsLine: 190,
    tsLogic: `
      const depreciableBasis = calculateDepreciableBasis({
        projectCost, predevelopmentCosts, landValue, investorEquityPct, interestReserve
      });
    `,
    excelFormula: '=(ProjectCost + PredevelopmentCosts) - LandValue',
    dependencies: ['projectCost', 'predevelopmentCosts', 'landValue', 'investorEquityPct', 'interestReserve'],
    output: 'depreciableBasis',
    category: 'calculations',
    notes: 'Calls calculateDepreciableBasis() from depreciableBasisUtility.ts (util-basis-001). That utility is the single source of truth - no duplicate logic exists.'
  },

  // Year 1 Bonus Depreciation
  {
    id: 'calc-depr-y1-001',
    name: 'Year 1 Bonus Depreciation',
    description: 'Year 1 includes BOTH bonus depreciation AND partial straight-line (IRS MACRS mid-month convention).',
    tsFile: 'calculations.ts',
    tsLine: 400,
    tsLogic: `
      const bonusDepreciation = depreciableBasis * (yearOneDepreciationPct / 100);
      const remainingBasis = depreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;
      const monthsInYear1 = 12.5 - placedInServiceMonth;
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
      const totalYear1Depreciation = bonusDepreciation + year1MACRS;
    `,
    excelFormula: `
      =BonusDepr + Year1MACRS
      Where:
        BonusDepr = DepreciableBasis * (BonusPct/100)
        RemainingBasis = DepreciableBasis - BonusDepr
        AnnualMACRS = RemainingBasis / 27.5
        MonthsInYear1 = 12.5 - PISMonth
        Year1MACRS = (MonthsInYear1/12) * AnnualMACRS
    `,
    dependencies: ['depreciableBasis', 'yearOneDepreciationPct', 'placedInServiceMonth'],
    output: 'totalYear1Depreciation',
    category: 'calculations',
    notes: 'Mid-month convention: Property treated as placed in service at midpoint of month.'
  },

  // Tax Benefit Calculation
  {
    id: 'calc-taxben-001',
    name: 'Tax Benefit from Depreciation',
    description: 'IMPL-041: Convert depreciation to tax savings using SPLIT effective tax rates for state conformity.',
    tsFile: 'calculations.ts',
    tsLine: 425,
    tsLogic: `
      // IMPL-041: Split rates for state conformity
      // Bonus depreciation: Uses conformity-adjusted rate (e.g., NJ 30% conformity)
      // MACRS depreciation: Uses full state rate (all states accept straight-line)
      const effectiveRateForBonus = effectiveTaxRateForBonus ?? effectiveTaxRate;
      const effectiveRateForMACRS = effectiveTaxRateForStraightLine ?? effectiveTaxRate;

      const bonusTaxBenefit = bonusDepreciation * (effectiveRateForBonus / 100);
      const macrsTaxBenefit = year1MACRS * (effectiveRateForMACRS / 100);
      grossDepreciationTaxBenefit = bonusTaxBenefit + macrsTaxBenefit;
    `,
    excelFormula: `
      Year 1: =(BonusDepr × BonusRate/100) + (Year1MACRS × MACRSRate/100)
      Years 2+: =AnnualMACRS × MACRSRate/100
      Where:
        BonusRate = FederalRate + (StateRate × ConformityRate)
        MACRSRate = FederalRate + StateRate
    `,
    dependencies: ['bonusDepreciation', 'year1MACRS', 'effectiveTaxRateForBonus', 'effectiveTaxRateForStraightLine'],
    output: 'taxBenefit',
    category: 'calculations',
    notes: 'IMPL-041: State conformity rates: CA=0%, NY=50%, NJ=30%, PA=0%, IL=0%, default=100%. Years 2+ use full state rate since no bonus depreciation.'
  },

  // DSCR Calculation
  {
    id: 'calc-dscr-001',
    name: 'Debt Service Coverage Ratio',
    description: 'operationalDSCR = NOI / Hard Debt Service. Target is 1.05x covenant. Note: This is the NATURAL DSCR before cash management adjustments.',
    tsFile: 'calculations.ts',
    tsLine: 605,
    tsLogic: `
      const hardDebtService = annualSeniorDebtService + philDebtServiceThisYear;
      const requiredForDSCR = hardDebtService * DSCR_COVENANT_THRESHOLD;  // 1.05
      const operationalDSCR = hardDebtService > 0 ? effectiveNOI / hardDebtService : 0;
    `,
    excelFormula: '=IF(HardDebtService>0, NOI/HardDebtService, 0)',
    dependencies: ['effectiveNOI', 'seniorDebtService', 'philDebtService'],
    output: 'dscr',
    category: 'calculations',
    notes: 'DSCR_COVENANT_THRESHOLD = 1.05. Available cash = NOI - (HardDebt * 1.05).'
  },

  // PIK Interest Calculation
  {
    id: 'calc-pik-001',
    name: 'PIK Interest Accrual',
    description: 'Payment-in-Kind interest compounds on sub-debt balance.',
    tsFile: 'calculations.ts',
    tsLine: 555,
    tsLogic: `
      const hdcFullInterest = hdcPikBalance * (hdcSubDebtPikRate / 100);
      if (pikCurrentPayEnabled && year > interestReservePeriodYears) {
        hdcSubDebtCurrentPayDue = hdcFullInterest * (pikCurrentPayPct / 100);
        hdcSubDebtPIKAccrued = hdcFullInterest - hdcSubDebtCurrentPayDue;
      } else {
        hdcSubDebtPIKAccrued = hdcFullInterest;
      }
      hdcPikBalance += hdcSubDebtPIKAccrued;
    `,
    excelFormula: `
      FullInterest = PIKBalance * (PIKRate/100)
      IF(CurrentPayEnabled AND Year>ReservePeriod,
         CurrentPay = FullInterest * (CurrentPayPct/100),
         PIKAccrued = FullInterest - CurrentPay)
      ELSE PIKAccrued = FullInterest
      NewPIKBalance = OldBalance + PIKAccrued
    `,
    dependencies: ['pikBalance', 'pikRate', 'currentPayEnabled', 'currentPayPct', 'year', 'interestReservePeriodYears'],
    output: 'pikBalance',
    category: 'calculations',
    notes: 'PIK compounds annually. Current pay begins after interest reserve period ends.'
  },

  // Exit Value Calculation
  {
    id: 'calc-exit-001',
    name: 'Exit Value',
    description: 'Property exit value = Final Year NOI / Exit Cap Rate.',
    tsFile: 'calculations.ts',
    tsLine: 1293,
    tsLogic: `
      const finalYearNOI = investorCashFlows[holdPeriod - 1].noi;
      const exitValue = finalYearNOI / (exitCapRate / 100);
    `,
    excelFormula: '=FinalYearNOI / (ExitCapRate/100)',
    dependencies: ['finalYearNOI', 'exitCapRate'],
    output: 'exitValue',
    category: 'calculations'
  },

  // Exit Proceeds After Debt
  {
    id: 'calc-exit-proceeds-001',
    name: 'Exit Proceeds After Debt Payoff',
    description: 'Net proceeds after paying off all debt layers at exit.',
    tsFile: 'calculations.ts',
    tsLine: 1343,
    tsLogic: `
      const grossExitProceedsBeforePrefEquity = Math.max(0,
        exitValue - remainingDebt - subDebtAtExit - investorSubDebtAtExit - outsideInvestorSubDebtAtExit
      );
    `,
    excelFormula: '=MAX(0, ExitValue - SeniorDebt - PhilDebt - HDCSubDebt - InvestorSubDebt - OutsideInvestorSubDebt)',
    dependencies: ['exitValue', 'remainingSeniorDebt', 'remainingPhilDebt', 'hdcSubDebtAtExit', 'investorSubDebtAtExit', 'outsideInvestorSubDebtAtExit'],
    output: 'grossExitProceeds',
    category: 'calculations'
  },

  // Investor Promote Split
  {
    id: 'calc-promote-001',
    name: 'Investor Promote Split',
    description: 'After equity recovery, operating cash splits per promote (35% investor default).',
    tsFile: 'calculations.ts',
    tsLine: 1034,
    tsLogic: `
      operatingCashFlow = cashAfterDebtAndFees * (investorPromoteShare / 100);
    `,
    excelFormula: '=CashAfterDebtAndFees * (InvestorPromotePct/100)',
    dependencies: ['cashAfterDebtAndFees', 'investorPromoteShare'],
    output: 'operatingCashFlow',
    category: 'calculations',
    notes: 'Tax benefits always 100% to investor. Only operating cash is split by promote.'
  },

  // Equity Multiple Calculation
  {
    id: 'calc-moic-001',
    name: 'Equity Multiple (MOIC)',
    description: 'Multiple on Invested Capital = Total Returns / Total Investment.',
    tsFile: 'calculations.ts',
    tsLine: 1385,
    tsLogic: `
      const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit;
      const multiple = totalInvestment > 0 ? totalReturns / totalInvestment : 0;
    `,
    excelFormula: '=IF(TotalInvestment>0, TotalReturns/TotalInvestment, 0)',
    dependencies: ['cumulativeReturns', 'exitProceeds', 'investorSubDebtAtExit', 'totalInvestment'],
    output: 'equityMultiple',
    category: 'calculations'
  },

  // Investor Equity Calculation
  {
    id: 'calc-equity-001',
    name: 'Investor Equity',
    description: 'Investor equity based on effective project cost (includes interest reserve).',
    tsFile: 'calculations.ts',
    tsLine: 258,
    tsLogic: `
      const effectiveProjectCost = baseProjectCost + interestReserveAmount;
      const investorEquity = effectiveProjectCost * (investorEquityPct / 100);
    `,
    excelFormula: '=(ProjectCost + PredevelopmentCosts + InterestReserve) * (InvestorEquityPct/100)',
    dependencies: ['projectCost', 'predevelopmentCosts', 'interestReserveAmount', 'investorEquityPct'],
    output: 'investorEquity',
    category: 'calculations'
  },

  // OZ Year 5 Tax Payment
  {
    id: 'calc-oz-y5-001',
    name: 'OZ Year 5 Tax Payment',
    description: 'OBBBA 2025: 5 years after investment, pay tax on deferred gains with step-up.',
    tsFile: 'calculations.ts',
    tsLine: 1107,
    tsLogic: `
      const stepUpPercent = getOzStepUpPercent(ozVersion, ozType);
      const taxableGains = deferredCapitalGains * (1 - stepUpPercent);
      ozYear5TaxPayment = taxableGains * ozCapitalGainsTaxRate;
    `,
    excelFormula: '=DeferredGains * (1 - StepUpPct) * CapGainsTaxRate',
    dependencies: ['deferredCapitalGains', 'ozVersion', 'ozType', 'ltCapitalGainsRate', 'niitRate', 'stateCapitalGainsRate'],
    output: 'ozYear5TaxPayment',
    category: 'calculations',
    notes: 'Step-up percent varies by OZ version (1.0 vs 2.0) and type (standard vs rural). OZ 1.0: 0% step-up. OZ 2.0: 10% standard, 30% rural.'
  },

  // AUM Fee Calculation
  {
    id: 'calc-aum-001',
    name: 'AUM Fee Calculation',
    description: 'HDC AUM fee based on effective project cost (starts Year 2).',
    tsFile: 'calculations.ts',
    tsLine: 638,
    tsLogic: `
      const aumFeeBase = (aumFeeEnabled && year > 1) ?
        effectiveProjectCost * (aumFeeRate / 100) : 0;
      if (aumCurrentPayEnabled) {
        aumFeeCurrentPayDue = aumFeeBase * (aumCurrentPayPct / 100);
        aumFeePIKDue = aumFeeBase * ((100 - aumCurrentPayPct) / 100);
      } else {
        aumFeePIKDue = aumFeeBase;
      }
    `,
    excelFormula: `
      AUMBase = IF(Year>1, EffectiveProjectCost * (AUMRate/100), 0)
      IF(CurrentPayEnabled,
         CurrentPayDue = AUMBase * (CurrentPayPct/100),
         PIKDue = AUMBase - CurrentPayDue)
      ELSE PIKDue = AUMBase
    `,
    dependencies: ['effectiveProjectCost', 'aumFeeRate', 'aumFeeEnabled', 'aumCurrentPayEnabled', 'aumCurrentPayPct', 'year'],
    output: 'aumFeeAmount',
    category: 'calculations',
    notes: 'AUM fees start Year 2. Unpaid current pay portion is subject to catch-up.'
  }
];

// ============================================================================
// MODULE 2: LIHTC CREDIT CALCULATIONS
// ============================================================================

const lihtcCreditFormulas: FormulaEntry[] = [
  // Year 1 Proration Factor
  {
    id: 'lihtc-proration-001',
    name: 'Year 1 Proration Factor',
    description: 'Calculate Year 1 credit proration based on Placed-in-Service month.',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 163,
    tsLogic: `
      const monthsInService = 13 - pisMonth;
      return monthsInService / 12;
    `,
    excelFormula: '=(13 - PISMonth) / 12',
    dependencies: ['pisMonth'],
    output: 'year1ProrationFactor',
    category: 'lihtcCredits',
    notes: 'January (1) = 100%, July (7) = 50%, December (12) = 8.33%'
  },

  // DDA/QCT Boost Multiplier
  {
    id: 'lihtc-boost-001',
    name: 'DDA/QCT Boost Multiplier',
    description: 'Difficult Development Area or Qualified Census Tract 130% basis boost.',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 192,
    tsLogic: `
      return ddaQctBoost ? 1.3 : 1.0;
    `,
    excelFormula: '=IF(DDA_QCT_Boost, 1.3, 1.0)',
    dependencies: ['ddaQctBoost'],
    output: 'boostMultiplier',
    category: 'lihtcCredits'
  },

  // Qualified Basis
  {
    id: 'lihtc-qb-001',
    name: 'Qualified Basis',
    description: 'LIHTC qualified basis = Eligible Basis x Boost x Applicable Fraction.',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 206,
    tsLogic: `
      return eligibleBasis * boostMultiplier * applicableFraction;
    `,
    excelFormula: '=EligibleBasis * BoostMultiplier * ApplicableFraction',
    dependencies: ['eligibleBasis', 'boostMultiplier', 'applicableFraction'],
    output: 'qualifiedBasis',
    category: 'lihtcCredits'
  },

  // Annual LIHTC Credit
  {
    id: 'lihtc-annual-001',
    name: 'Annual LIHTC Credit',
    description: 'Annual credit = Qualified Basis x Credit Rate (4% or 9%).',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 223,
    tsLogic: `
      return qualifiedBasis * creditRate;
    `,
    excelFormula: '=QualifiedBasis * CreditRate',
    dependencies: ['qualifiedBasis', 'creditRate'],
    output: 'annualCredit',
    category: 'lihtcCredits',
    notes: 'Credit rate typically 0.04 (4%) or 0.09 (9%). Values in millions.'
  },

  // Year 1 Credit (Prorated)
  {
    id: 'lihtc-y1-001',
    name: 'Year 1 LIHTC Credit',
    description: 'Year 1 credit prorated by PIS month.',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 290,
    tsLogic: `
      const year1Credit = annualCredit * year1ProrationFactor;
    `,
    excelFormula: '=AnnualCredit * Year1ProrationFactor',
    dependencies: ['annualCredit', 'year1ProrationFactor'],
    output: 'year1Credit',
    category: 'lihtcCredits'
  },

  // Year 11 Catch-up Credit
  {
    id: 'lihtc-y11-001',
    name: 'Year 11 Catch-up Credit',
    description: 'Year 11 credit = Annual - Year 1. Ensures total = 10 x Annual.',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 297,
    tsLogic: `
      const year11Credit = annualCredit - year1Credit;
    `,
    excelFormula: '=AnnualCredit - Year1Credit',
    dependencies: ['annualCredit', 'year1Credit'],
    output: 'year11Credit',
    category: 'lihtcCredits',
    notes: 'Invariant: year1 + (9 x annual) + year11 = 10 x annual'
  },

  // Total LIHTC Credits
  {
    id: 'lihtc-total-001',
    name: 'Total LIHTC Credits',
    description: 'Total credits over 10-year period = 10 x Annual Credit.',
    tsFile: 'lihtcCreditCalculations.ts',
    tsLine: 371,
    tsLogic: `
      return 10 * annualCredit;
    `,
    excelFormula: '=10 * AnnualCredit',
    dependencies: ['annualCredit'],
    output: 'totalCredits',
    category: 'lihtcCredits',
    notes: 'Always exactly 10 x annual regardless of PIS month (Year 11 catch-up ensures this).'
  }
];

// ============================================================================
// MODULE 3: STATE LIHTC CALCULATIONS
// ============================================================================

const stateLIHTCFormulas: FormulaEntry[] = [
  // Syndication Rate Determination
  {
    id: 'state-synd-001',
    name: 'Syndication Rate Determination',
    description: 'Determine syndication rate based on transferability and investor state.',
    tsFile: 'stateLIHTCCalculations.ts',
    tsLine: 218,
    tsLogic: `
      if (program.transferability === 'grant') return 1.0;
      if (program.transferability === 'allocated') {
        if (investorState === propertyState) return 1.0;
        return investorHasStateLiability ? (program.syndicationRate / 100) : 0.0;
      }
      return program.syndicationRate / 100;
    `,
    excelFormula: `
      =IF(Transferability="grant", 1,
        IF(Transferability="allocated",
          IF(InvestorState=PropertyState, 1, IF(HasLiability, Rate/100, 0)),
          Rate/100))
    `,
    dependencies: ['program.transferability', 'program.syndicationRate', 'investorState', 'propertyState', 'investorHasStateLiability'],
    output: 'syndicationRate',
    category: 'stateLIHTC',
    notes: 'Certificated/Transferable=90%, Bifurcated=85%, Allocated=100%/80%/0%, Grant=100%'
  },

  // Piggyback State Credit
  {
    id: 'state-piggy-001',
    name: 'Piggyback State Credit',
    description: 'State credit as percentage of federal credit.',
    tsFile: 'stateLIHTCCalculations.ts',
    tsLine: 258,
    tsLogic: `
      return federalAnnualCredit * (program.percent / 100);
    `,
    excelFormula: '=FederalAnnualCredit * (StatePct/100)',
    dependencies: ['federalAnnualCredit', 'program.percent'],
    output: 'grossStateCredit',
    category: 'stateLIHTC',
    notes: 'Most common type. Georgia is 100% piggyback, for example.'
  },

  // Supplement State Credit
  {
    id: 'state-supp-001',
    name: 'Supplement State Credit',
    description: 'State credit = Federal x User-specified percentage.',
    tsFile: 'stateLIHTCCalculations.ts',
    tsLine: 274,
    tsLogic: `
      return federalAnnualCredit * (userPercentage / 100);
    `,
    excelFormula: '=FederalAnnualCredit * (UserPct/100)',
    dependencies: ['federalAnnualCredit', 'userPercentage'],
    output: 'grossStateCredit',
    category: 'stateLIHTC'
  },

  // Standalone State Credit
  {
    id: 'state-stand-001',
    name: 'Standalone State Credit',
    description: 'State credit = User amount / 10 years (independent of federal).',
    tsFile: 'stateLIHTCCalculations.ts',
    tsLine: 289,
    tsLogic: `
      return userAmount / 10;
    `,
    excelFormula: '=UserAmount / 10',
    dependencies: ['userAmount'],
    output: 'annualStateCredit',
    category: 'stateLIHTC'
  },

  // Net State Benefit
  {
    id: 'state-net-001',
    name: 'Net State Benefit',
    description: 'Net benefit = Gross credit x Syndication rate x 10 years.',
    tsFile: 'stateLIHTCCalculations.ts',
    tsLine: 590,
    tsLogic: `
      const netAnnualBenefit = grossAnnualCredit * syndicationRate;
      netBenefit = netAnnualBenefit * 10;
    `,
    excelFormula: '=GrossAnnualCredit * SyndicationRate * 10',
    dependencies: ['grossAnnualCredit', 'syndicationRate'],
    output: 'netBenefit',
    category: 'stateLIHTC'
  },

  // State Liability Determination
  {
    id: 'state-liability-001',
    name: 'State Tax Liability Determination',
    description: 'Determine if investor has tax liability in property state.',
    tsFile: 'stateLIHTCCalculations.ts',
    tsLine: 451,
    tsLogic: `
      if (explicitLiability !== undefined) return explicitLiability;
      if (investorState === propertyState) return true;
      return false;  // Out-of-state defaults to no liability
    `,
    excelFormula: '=IF(ISBLANK(ExplicitLiability), InvestorState=PropertyState, ExplicitLiability)',
    dependencies: ['investorState', 'propertyState', 'explicitLiability'],
    output: 'hasStateLiability',
    category: 'stateLIHTC'
  }
];

// ============================================================================
// MODULE 4: DEPRECIATION SCHEDULE
// ============================================================================

const depreciationFormulas: FormulaEntry[] = [
  // Cost Segregation Amount
  {
    id: 'depr-costseg-001',
    name: 'Cost Segregation Amount',
    description: 'Year 1 cost segregation = Building basis x Cost seg percentage.',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 88,
    tsLogic: `
      const costSegAmount = buildingBasis * (yearOneDepreciationPct / 100);
    `,
    excelFormula: '=BuildingBasis * (CostSegPct/100)',
    dependencies: ['buildingBasis', 'yearOneDepreciationPct'],
    output: 'costSegAmount',
    category: 'depreciation',
    notes: 'Default is 20% per 2025 standards. Can be 25% with aggressive cost seg study.'
  },

  // Year 1 Bonus Depreciation
  {
    id: 'depr-bonus-001',
    name: 'Year 1 Bonus Depreciation',
    description: '100% bonus depreciation on cost-segregated portion.',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 89,
    tsLogic: `
      const year1BonusDepreciation = costSegAmount;  // 100% bonus on segregated portion
    `,
    excelFormula: '=CostSegAmount',
    dependencies: ['costSegAmount'],
    output: 'year1BonusDepreciation',
    category: 'depreciation',
    notes: '100% bonus depreciation assumed. Phases down in later years per tax law.'
  },

  // Annual Straight-Line Depreciation
  {
    id: 'depr-sl-001',
    name: 'Annual Straight-Line Depreciation',
    description: 'Remaining basis depreciated over 27.5 years (residential).',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 126,
    tsLogic: `
      const remainingBasis = buildingBasis - costSegAmount;
      const annualStraightLine = remainingBasis / 27.5;
    `,
    excelFormula: '=(BuildingBasis - CostSegAmount) / 27.5',
    dependencies: ['buildingBasis', 'costSegAmount'],
    output: 'annualStraightLine',
    category: 'depreciation',
    notes: 'IRS MACRS: Residential rental property uses 27.5-year straight-line.'
  },

  // Federal Tax Benefit
  {
    id: 'depr-fed-001',
    name: 'Federal Tax Benefit',
    description: 'Federal tax savings from depreciation.',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 92,
    tsLogic: `
      const year1FederalBenefit = year1BonusDepreciation * (federalTaxRate / 100);
    `,
    excelFormula: '=Depreciation * (FederalTaxRate/100)',
    dependencies: ['depreciation', 'federalTaxRate'],
    output: 'federalBenefit',
    category: 'depreciation'
  },

  // State Tax Benefit with Conformity
  {
    id: 'depr-state-001',
    name: 'State Tax Benefit',
    description: 'State tax savings adjusted for bonus depreciation conformity.',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 195,
    tsLogic: `
      const conformityRate = isBonusDepreciation
        ? (STATE_BONUS_CONFORMITY[state] ?? 1.0)
        : 1.0;
      const grossBenefit = depreciation * (stateTaxRate / 100);
      const netBenefit = grossBenefit * conformityRate;
    `,
    excelFormula: `
      =Depreciation * (StateTaxRate/100) * VLOOKUP(State, ConformityTable, 2, FALSE)
      Where ConformityTable: CA=0, NY=0.5, PA=0, NJ=0.3, IL=0, DEFAULT=1
    `,
    dependencies: ['depreciation', 'stateTaxRate', 'state', 'isBonusDepreciation'],
    output: 'stateNetBenefit',
    category: 'depreciation',
    notes: 'CA, PA, IL = 0% conformity. NY = 50%. NJ = 30%. Most states = 100%.'
  },

  // Total Tax Benefit
  {
    id: 'depr-total-001',
    name: 'Total Tax Benefit',
    description: 'Combined federal and state tax benefit.',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 99,
    tsLogic: `
      const year1TotalBenefit = year1FederalBenefit + year1StateBenefit.netBenefit;
    `,
    excelFormula: '=FederalBenefit + StateNetBenefit',
    dependencies: ['federalBenefit', 'stateNetBenefit'],
    output: 'totalTaxBenefit',
    category: 'depreciation'
  },

  // Net Benefit After HDC Fee
  {
    id: 'depr-net-001',
    name: 'Net Benefit After HDC Fee',
    description: 'Tax benefit minus HDC fee (fee removed per IMPL-7.0-014).',
    tsFile: 'depreciationSchedule.ts',
    tsLine: 101,
    tsLogic: `
      const year1HDCFee = year1TotalBenefit * (hdcFeeRate / 100);
      const year1NetBenefit = year1TotalBenefit - year1HDCFee;
    `,
    excelFormula: '=TotalBenefit * (1 - HDCFeeRate/100)',
    dependencies: ['totalTaxBenefit', 'hdcFeeRate'],
    output: 'netBenefit',
    category: 'depreciation',
    notes: 'HDC fee rate currently 0% per IMPL-7.0-014.'
  }
];

// ============================================================================
// MODULE 5: PREFERRED EQUITY CALCULATIONS
// ============================================================================

const preferredEquityFormulas: FormulaEntry[] = [
  // Preferred Equity Principal
  {
    id: 'pref-prin-001',
    name: 'Preferred Equity Principal',
    description: 'Preferred equity = Total capitalization x Preferred equity percentage.',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 179,
    tsLogic: `
      return totalCapitalization * (prefEquityPct / 100);
    `,
    excelFormula: '=TotalCapitalization * (PrefEquityPct/100)',
    dependencies: ['totalCapitalization', 'prefEquityPct'],
    output: 'preferredEquityPrincipal',
    category: 'preferredEquity',
    notes: 'Percentage typically 0-40%.'
  },

  // Target Amount at Exit
  {
    id: 'pref-target-001',
    name: 'Preferred Equity Target Amount',
    description: 'Target at exit = Principal x Target MOIC.',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 193,
    tsLogic: `
      return principal * targetMOIC;
    `,
    excelFormula: '=Principal * TargetMOIC',
    dependencies: ['principal', 'targetMOIC'],
    output: 'targetAmount',
    category: 'preferredEquity',
    notes: 'Target MOIC typically 1.0-3.0x.'
  },

  // Yearly Accrual
  {
    id: 'pref-accrual-001',
    name: 'Yearly Accrual',
    description: 'Annual accrual = Beginning balance x Accrual rate.',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 207,
    tsLogic: `
      return beginningBalance * (accrualRate / 100);
    `,
    excelFormula: '=BeginningBalance * (AccrualRate/100)',
    dependencies: ['beginningBalance', 'accrualRate'],
    output: 'yearlyAccrual',
    category: 'preferredEquity',
    notes: 'Accrual rate typically 6-20%.'
  },

  // Exit Payment
  {
    id: 'pref-exit-001',
    name: 'Preferred Equity Exit Payment',
    description: 'Exit payment = MIN(Target Amount, Available Proceeds).',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 264,
    tsLogic: `
      const targetAmount = calculateTargetAmount(principal, targetMOIC);
      return Math.min(targetAmount, Math.max(0, availableProceeds));
    `,
    excelFormula: '=MIN(Principal * TargetMOIC, MAX(0, AvailableProceeds))',
    dependencies: ['principal', 'targetMOIC', 'availableProceeds'],
    output: 'exitPayment',
    category: 'preferredEquity',
    notes: 'KEY FORMULA: Capped at target MOIC, not accrued balance.'
  },

  // Achieved MOIC
  {
    id: 'pref-achieved-001',
    name: 'Achieved MOIC',
    description: 'Achieved multiple = Payment / Principal.',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 280,
    tsLogic: `
      if (principal === 0) return 0;
      return payment / principal;
    `,
    excelFormula: '=IF(Principal=0, 0, Payment/Principal)',
    dependencies: ['payment', 'principal'],
    output: 'achievedMOIC',
    category: 'preferredEquity'
  },

  // Preferred Equity IRR
  {
    id: 'pref-irr-001',
    name: 'Preferred Equity IRR',
    description: 'IRR for single exit payment: (Payment/Principal)^(1/Years) - 1.',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 298,
    tsLogic: `
      const ratio = exitPayment / principal;
      if (ratio <= 0) return -100;
      const irr = Math.pow(ratio, 1 / holdPeriod) - 1;
      return irr * 100;
    `,
    excelFormula: '=IF(ExitPayment<=0, -100, (ExitPayment/Principal)^(1/HoldPeriod)-1)*100',
    dependencies: ['exitPayment', 'principal', 'holdPeriod'],
    output: 'achievedIRR',
    category: 'preferredEquity'
  },

  // MOIC Shortfall
  {
    id: 'pref-shortfall-001',
    name: 'MOIC Shortfall',
    description: 'Shortfall = MAX(0, Target MOIC - Achieved MOIC).',
    tsFile: 'preferredEquityCalculations.ts',
    tsLine: 370,
    tsLogic: `
      const moicShortfall = Math.max(0, targetMOIC - achievedMOIC);
    `,
    excelFormula: '=MAX(0, TargetMOIC - AchievedMOIC)',
    dependencies: ['targetMOIC', 'achievedMOIC'],
    output: 'moicShortfall',
    category: 'preferredEquity'
  }
];

// ============================================================================
// MODULE 6: TERRITORIAL TAX CALCULATIONS
// ============================================================================

const territorialTaxFormulas: FormulaEntry[] = [
  // Puerto Rico Act 60 Tax
  {
    id: 'terr-pr-act60-001',
    name: 'Puerto Rico Act 60 Tax',
    description: 'Act 60: 4% corporate rate, 0% capital gains, 100% dividend exemption.',
    tsFile: 'territorialTaxCalculations.ts',
    tsLine: 87,
    tsLogic: `
      result.territorialTax = params.income * 0.04;  // 4% flat rate
      result.territorialTax += params.capitalGains * 0;  // 0% on capital gains
    `,
    excelFormula: `
      =IF(QualifiesForAct60,
         Income * 0.04 + CapitalGains * 0,
         Income * StateTaxRate + CapitalGains * CapGainsRate)
    `,
    dependencies: ['income', 'capitalGains', 'qualifiesForAct60', 'jurisdictionRate', 'capitalGainsRate'],
    output: 'territorialTax',
    category: 'territorialTax',
    notes: 'Bona fide residents pay no federal tax on PR-sourced income.'
  },

  // USVI Mirror Code Tax
  {
    id: 'terr-vi-mirror-001',
    name: 'USVI Mirror Code Tax',
    description: 'USVI uses mirror code - same as federal but paid to USVI.',
    tsFile: 'territorialTaxCalculations.ts',
    tsLine: 121,
    tsLogic: `
      result.territorialTax = calculateStandardFederalTax(params);
      result.federalTax = 0;  // Paid to USVI instead
      if (params.ozInvestment) {
        result.territorialTax *= 0.9;  // 10% additional OZ reduction
      }
    `,
    excelFormula: '=FederalTaxCalc * IF(OZInvestment, 0.9, 1)',
    dependencies: ['income', 'capitalGains', 'holdPeriod', 'ozInvestment'],
    output: 'territorialTax',
    category: 'territorialTax',
    notes: 'Mirror code: Federal taxes paid to USVI. 90% reduction available for qualifying businesses.'
  },

  // Standard Federal Tax Calculation
  {
    id: 'terr-fed-001',
    name: 'Standard Federal Tax Calculation',
    description: 'Simplified federal tax for territorial calculations.',
    tsFile: 'territorialTaxCalculations.ts',
    tsLine: 231,
    tsLogic: `
      const ordinaryRate = 0.37;  // Top rate
      const capitalGainsRate = holdPeriod >= 1 ? 0.20 : 0.37;
      let tax = income * ordinaryRate;
      tax += capitalGains * capitalGainsRate;
      if (ozInvestment && holdPeriod >= 10) {
        tax *= 0.9;  // 10% reduction for OZ
      }
    `,
    excelFormula: `
      =Income * 0.37 + CapitalGains * IF(HoldPeriod>=1, 0.20, 0.37)
       * IF(AND(OZInvestment, HoldPeriod>=10), 0.9, 1)
    `,
    dependencies: ['income', 'capitalGains', 'holdPeriod', 'ozInvestment'],
    output: 'federalTax',
    category: 'territorialTax'
  },

  // NIIT Applicability
  {
    id: 'terr-niit-001',
    name: 'Territorial NIIT Applicability',
    description: 'NIIT does not apply to territories.',
    tsFile: 'territorialTaxCalculations.ts',
    tsLine: 250,
    tsLogic: `
      return jurisdiction?.type !== 'territory';
    `,
    excelFormula: '=NOT(JurisdictionType="territory")',
    dependencies: ['jurisdictionCode'],
    output: 'niitApplies',
    category: 'territorialTax',
    notes: 'Territories are exempt from 3.8% Net Investment Income Tax.'
  }
];

// ============================================================================
// SUPPORTING UTILITIES
// ============================================================================

const supportingFormulas: FormulaEntry[] = [
  // State Bonus Depreciation Conformity (IMPL-041)
  {
    id: 'util-conformity-001',
    name: 'State Bonus Depreciation Conformity Rate',
    description: 'IMPL-069: Returns the percentage (0.0-1.0) of federal bonus depreciation recognized by a state. Reads from stateProfiles.data.json.',
    tsFile: 'stateProfiles.ts',
    tsLine: 130,
    tsLogic: `
      // IMPL-069: Read from JSON single source of truth (OZ_2_0_Addendum_v9_0.md)
      // bonusDepreciation is 0-100 in JSON, convert to 0.0-1.0
      const bonusPct = getStateBonusDepreciation(code);
      return bonusPct / 100;
      // NJ = 0% per N.J.S.A. 54A:1-2
      // OR = 100% (ONLY state with full conformity)
      // CA, NY, PA, IL, GA, NE, SC, KS = 0%
    `,
    excelFormula: '=StateProfiles[bonusDepreciation]/100  // From JSON single source of truth',
    dependencies: ['stateCode'],
    output: 'bonusConformityRate',
    category: 'supporting',
    notes: 'All states accept straight-line (27.5-year MACRS). This only affects accelerated/bonus depreciation. Only OR has 100% conformity.'
  },

  // Depreciable Basis Utility
  {
    id: 'util-basis-001',
    name: 'OZ Depreciable Basis (Utility)',
    description: '(Project + Predevelopment + Loan Fees + Legal + Org) - Land - Reserves.',
    tsFile: 'depreciableBasisUtility.ts',
    tsLine: 50,
    tsLogic: `
      const totalProjectCost = projectCost + predevelopmentCosts;
      const effectiveProjectCost = totalProjectCost + interestReserve + leaseUpReserve;
      const investorEquity = effectiveProjectCost * (investorEquityPct / 100);
      const totalDebt = effectiveProjectCost - investorEquity;
      const loanFees = totalDebt * (loanFeesPercent / 100);
      const basisAdjustments = loanFees + legalStructuringCosts + organizationCosts;
      const depreciableBasis = totalProjectCost + basisAdjustments - landValue;
    `,
    excelFormula: '=(ProjectCost + PredevCosts + LoanFees + LegalCosts + OrgCosts) - LandValue',
    dependencies: ['projectCost', 'predevelopmentCosts', 'landValue', 'investorEquityPct', 'interestReserve', 'leaseUpReserve', 'loanFeesPercent', 'legalStructuringCosts', 'organizationCosts'],
    output: 'depreciableBasis',
    category: 'supporting',
    notes: 'CANONICAL IMPLEMENTATION: This is the single source of truth. calc-basis-001 in calculations.ts imports and calls this function. Investor equity NOT excluded. Reserves ARE excluded as financing costs.'
  },

  // LIHTC Eligible Basis
  {
    id: 'util-lihtc-basis-001',
    name: 'LIHTC Eligible Basis',
    description: 'IRC §42 eligible basis = (Project + Predev) - Land - Reserves - Syndication - Marketing - Commercial.',
    tsFile: 'depreciableBasisUtility.ts',
    tsLine: 177,
    tsLogic: `
      const totalProjectCost = projectCost + predevelopmentCosts;
      const eligibleBasis = totalProjectCost - landValue - interestReserve - leaseUpReserve
        - syndicationCosts - marketingCosts - commercialSpaceCosts;
    `,
    excelFormula: '=(ProjectCost + PredevCosts) - Land - IntReserve - LeaseUpReserve - SyndicationCosts - MarketingCosts - CommercialCosts',
    dependencies: ['projectCost', 'predevelopmentCosts', 'landValue', 'interestReserve', 'leaseUpReserve', 'syndicationCosts', 'marketingCosts', 'commercialSpaceCosts'],
    output: 'lihtcEligibleBasis',
    category: 'supporting',
    notes: 'Does NOT include loan fees, legal, or org costs (financing costs).'
  },

  // Interest Reserve Calculation
  {
    id: 'util-intres-001',
    name: 'Interest Reserve Calculation',
    description: 'S-curve methodology: Sum of monthly shortfalls during lease-up.',
    tsFile: 'interestReserveCalculation.ts',
    tsLine: 66,
    tsLogic: `
      for (let month = 1; month <= months; month++) {
        const progress = Math.min(1, month / months);
        const occupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
        const monthlyNOI = monthlyStabilizedNOI * occupancy;
        const monthlyShortfall = Math.max(0, totalMonthlyService - monthlyNOI);
        totalShortfall += monthlyShortfall;
      }
      return Math.min(totalShortfall, maxReserve);  // Cap at 10% of project
    `,
    excelFormula: `
      =SUMPRODUCT(MAX(0, MonthlyDebtService - StabilizedNOI/12 * SCurveOccupancy(month)))
      Capped at 10% of ProjectCost
    `,
    dependencies: ['months', 'projectCost', 'predevelopmentCosts', 'yearOneNOI', 'seniorDebtPct', 'seniorDebtRate', 'seniorDebtAmortization'],
    output: 'interestReserveAmount',
    category: 'supporting',
    notes: 'Philanthropic debt NEVER included. S-curve models occupancy ramp-up.'
  },

  // S-Curve Calculation
  {
    id: 'util-scurve-001',
    name: 'S-Curve (Sigmoid) Function',
    description: 'Sigmoid function for modeling gradual transitions: 1 / (1 + e^(-k*(x-0.5))).',
    tsFile: 'sCurveUtility.ts',
    tsLine: 38,
    tsLogic: `
      const clampedProgress = Math.min(1, Math.max(0, progress));
      const value = 1 / (1 + Math.exp(-steepness * (clampedProgress - 0.5)));
      return value;
    `,
    excelFormula: '=1 / (1 + EXP(-10 * (Progress - 0.5)))',
    dependencies: ['progress', 'steepness'],
    output: 'sCurveValue',
    category: 'supporting',
    notes: 'Default steepness=10. Higher k = steeper curve. Starts ~0, inflects at 0.5, approaches 1.'
  },

  // REP Tax Capacity
  {
    id: 'util-rep-001',
    name: 'REP Tax Capacity (§461(l))',
    description: 'Real Estate Professional capacity with $626K annual limit (MFJ).',
    tsFile: 'taxCapacity.ts',
    tsLine: 28,
    tsLogic: `
      const section461lLimit = 626_000;  // MFJ limit
      const businessOffset = Math.min(businessIncome, totalLosses);
      const remainingLosses = totalLosses - businessOffset;
      const w2Offset = Math.min(remainingLosses, section461lLimit);
      const excessLoss = Math.max(0, remainingLosses - section461lLimit);
      nolCarryforward += excessLoss;
    `,
    excelFormula: `
      BusinessOffset = MIN(BusinessIncome, TotalLosses)
      W2Offset = MIN(TotalLosses - BusinessOffset, 626000)
      ExcessLoss = MAX(0, TotalLosses - BusinessOffset - 626000)
    `,
    dependencies: ['w2Income', 'businessIncome', 'totalLosses'],
    output: 'allowedLoss',
    category: 'supporting',
    notes: '§461(l) limits REP losses against W-2 to $626K (MFJ). Excess becomes NOL carryforward.'
  },

  // Non-REP Passive Capacity
  {
    id: 'util-nonrep-001',
    name: 'Non-REP Passive Capacity',
    description: 'Non-REPs have UNLIMITED capacity to offset passive gains.',
    tsFile: 'taxCapacity.ts',
    tsLine: 103,
    tsLogic: `
      const totalPassiveLosses = depreciationSchedule.totalDepreciation;
      const totalCapGainsRate = (ltCapitalGainsRate + niitRate + stateCapitalGainsRate) / 100;
      const taxSavings = lossesUsed * totalCapGainsRate;
    `,
    excelFormula: '=PassiveLosses * (LTCGRate + NIITRate + StateCGRate) / 100',
    dependencies: ['totalPassiveLosses', 'ltCapitalGainsRate', 'niitRate', 'stateCapitalGainsRate'],
    output: 'taxSavings',
    category: 'supporting',
    notes: 'KEY: No annual limit for Non-REPs offsetting passive gains (vs $626K for REPs).'
  },

  // IRA Conversion Optimization
  {
    id: 'util-ira-001',
    name: 'IRA Conversion Optimization',
    description: 'Optimize Traditional to Roth conversion using HDC losses.',
    tsFile: 'iraConversion.ts',
    tsLine: 20,
    tsLogic: `
      const evenSpread = remainingIRA / (targetYears - year + 1);
      const capacityLimit = yearCapacity.allowedLoss;
      const conversionAmount = Math.min(capacityLimit, evenSpread, remainingIRA);
      const taxSaved = hdcLossOffset * (effectiveTaxRate / 100);
    `,
    excelFormula: `
      ConversionAmount = MIN(YearCapacity, RemainingIRA/(TargetYears-Year+1), RemainingIRA)
      TaxSaved = MIN(ConversionAmount, YearCapacity) * (EffectiveTaxRate/100)
    `,
    dependencies: ['iraBalance', 'effectiveTaxRate', 'holdPeriod', 'repCapacity'],
    output: 'conversionAmount',
    category: 'supporting',
    notes: 'REP-only strategy. Uses available tax losses to offset conversion income.'
  }
];

// ============================================================================
// COMPLETE FORMULA MAP
// ============================================================================

/**
 * Complete formula map organized by category
 */
export const FORMULA_MAP: Record<FormulaCategory, FormulaEntry[]> = {
  calculations: calculationsFormulas,
  lihtcCredits: lihtcCreditFormulas,
  stateLIHTC: stateLIHTCFormulas,
  depreciation: depreciationFormulas,
  preferredEquity: preferredEquityFormulas,
  territorialTax: territorialTaxFormulas,
  supporting: supportingFormulas
};

/**
 * Flat list of all formulas
 */
export const ALL_FORMULAS: FormulaEntry[] = [
  ...calculationsFormulas,
  ...lihtcCreditFormulas,
  ...stateLIHTCFormulas,
  ...depreciationFormulas,
  ...preferredEquityFormulas,
  ...territorialTaxFormulas,
  ...supportingFormulas
];

/**
 * Get formula by ID
 */
export function getFormulaById(id: string): FormulaEntry | undefined {
  return ALL_FORMULAS.find(f => f.id === id);
}

/**
 * Get formulas by category
 */
export function getFormulasByCategory(category: FormulaCategory): FormulaEntry[] {
  return FORMULA_MAP[category];
}

/**
 * Get formulas by output field
 */
export function getFormulasByOutput(output: string): FormulaEntry[] {
  return ALL_FORMULAS.filter(f => f.output === output);
}

/**
 * Get formulas by dependency
 */
export function getFormulasByDependency(dependency: string): FormulaEntry[] {
  return ALL_FORMULAS.filter(f => f.dependencies.includes(dependency));
}

/**
 * Summary statistics
 */
export const FORMULA_SUMMARY = {
  totalFormulas: ALL_FORMULAS.length,
  byCategory: {
    calculations: calculationsFormulas.length,
    lihtcCredits: lihtcCreditFormulas.length,
    stateLIHTC: stateLIHTCFormulas.length,
    depreciation: depreciationFormulas.length,
    preferredEquity: preferredEquityFormulas.length,
    territorialTax: territorialTaxFormulas.length,
    supporting: supportingFormulas.length
  },
  version: '2.1.0',
  generatedDate: '2025-12-29',
  task: 'IMPL-041'
};
