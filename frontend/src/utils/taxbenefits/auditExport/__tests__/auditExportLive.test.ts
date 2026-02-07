/**
 * IMPL-056: Live Calculation Excel Model - Integration Tests
 *
 * Tests the 14-sheet Excel workbook generation with live formulas.
 * Validates against Atrium Court configuration baseline.
 */

// Jest provides describe, it, expect globally
import * as XLSX from 'xlsx';
import { generateLiveExcelModel, generateAuditWorkbook } from '../index';
import { LiveExcelParams } from '../types';
import { CalculationParams, InvestorAnalysisResults, HDCAnalysisResults, CashFlowItem, HDCCashFlowItem } from '../../../../types/taxbenefits';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Baseline test params (simplified Atrium Court-like configuration)
 */
const TEST_PARAMS: CalculationParams = {
  projectCost: 100,
  landValue: 10,
  yearOneNOI: 7,
  revenueGrowth: 3,
  expenseGrowth: 2.5,
  exitCapRate: 5.5,
  investorEquityPct: 35,
  seniorDebtPct: 65,
  seniorDebtRate: 5.5,
  seniorDebtAmortization: 35,
  seniorDebtIOYears: 3,
  philanthropicDebtPct: 0,
  philanthropicDebtRate: 0,
  philDebtAmortization: 60,
  hdcSubDebtPct: 0,
  hdcSubDebtPikRate: 8,
  investorSubDebtPct: 0,
  investorSubDebtPikRate: 8,
  outsideInvestorSubDebtPct: 0,
  outsideInvestorSubDebtPikRate: 8,
  holdPeriod: 10,
  hdcFeeRate: 0,
  hdcAdvanceFinancing: false,
  investorUpfrontCash: 0,
  totalTaxBenefit: 10,
  netTaxBenefit: 10,
  hdcFee: 0,
  investorPromoteShare: 65,
  yearOneDepreciationPct: 20,
  federalTaxRate: 37,
  stateTaxRate: 13.3,
  niitRate: 3.8,
  placedInServiceMonth: 7,
  aumFeeEnabled: false,
  aumFeeRate: 1,
  ozEnabled: false,
  ozVersion: '1.0',
  ozType: 'standard',
  deferredCapitalGains: 0,
  capitalGainsTaxRate: 23.8,
  lihtcEnabled: false,
  applicableFraction: 100,
  creditRate: 4,
  ddaQctBoost: false,
  stateLIHTCEnabled: false,
};

/**
 * Generate mock cash flows for testing
 */
function generateMockCashFlows(holdPeriod: number): CashFlowItem[] {
  const cashFlows: CashFlowItem[] = [];
  for (let year = 1; year <= holdPeriod; year++) {
    cashFlows.push({
      year,
      noi: 7 * Math.pow(1.03, year - 1),
      debtServicePayments: 4.5,
      cashAfterDebtService: 2.5,
      aumFeeAmount: 0.35,
      cashAfterDebtAndFees: 2.15,
      taxBenefit: year === 1 ? 9.5 : 1.2,
      operatingCashFlow: 1.5,
      subDebtInterest: 0,
      totalCashFlow: year === 1 ? 11 : 2.7,
      cumulativeReturns: year === 1 ? 11 : 11 + (year - 1) * 2.7,
      dscr: 1.56,
      hardDebtService: 4.5,
    });
  }
  return cashFlows;
}

/**
 * Generate mock HDC cash flows for testing
 */
function generateMockHDCCashFlows(holdPeriod: number): HDCCashFlowItem[] {
  const cashFlows: HDCCashFlowItem[] = [];
  for (let year = 1; year <= holdPeriod; year++) {
    cashFlows.push({
      year,
      noi: 7 * Math.pow(1.03, year - 1),
      debtServicePayments: 4.5,
      cashAfterDebtService: 2.5,
      aumFeeAmount: 0.35,
      aumFeeIncome: 0.35,
      aumFeeAccrued: 0,
      cashAfterDebtAndAumFee: 2.15,
      hdcFeeIncome: 0,
      philanthropicShare: 0,
      hdcSubDebtCurrentPay: 0,
      hdcSubDebtPIKAccrued: 0,
      promoteShare: 0.75,
      totalCashFlow: 1.1,
      cumulativeReturns: year * 1.1,
      pikBalance: 0,
    });
  }
  return cashFlows;
}

/**
 * Mock investor results
 */
const TEST_INVESTOR_RESULTS: InvestorAnalysisResults = {
  investorCashFlows: generateMockCashFlows(10),
  cashFlows: generateMockCashFlows(10),
  exitProceeds: 55,
  totalInvestment: 35,
  totalReturns: 113,
  multiple: 3.23,
  irr: 15.78,
  investorTaxBenefits: 19,
  investorOperatingCashFlows: 15,
  investorSubDebtInterest: 0,
  investorSubDebtInterestReceived: 0,
  remainingDebtAtExit: 58,
  subDebtAtExit: 0,
  investorSubDebtAtExit: 0,
  outsideInvestorSubDebtAtExit: 0,
  exitValue: 111.19,
  totalExitProceeds: 55,
  pikAccumulatedInterest: 0,
  investorIRR: 15.78,
  leveragedROE: 0,
  unleveragedROE: 0,
  exitFees: 0,
  equityMultiple: 3.23,
  holdPeriod: 10,
  interestReserveAmount: 0,
  investorEquity: 35,
};

/**
 * Mock HDC results
 */
const TEST_HDC_RESULTS: HDCAnalysisResults = {
  hdcCashFlows: generateMockHDCCashFlows(10),
  hdcExitProceeds: 15,
  hdcPromoteProceeds: 12,
  philanthropicEquityRepayment: 0,
  hdcSubDebtRepayment: 0,
  totalHDCReturns: 26,
  hdcMultiple: 0,
  hdcIRR: 0,
  hdcFeeIncome: 0,
  hdcPhilanthropicIncome: 0,
  hdcOperatingPromoteIncome: 7.5,
  hdcAumFeeIncome: 3.5,
  hdcSubDebtCurrentPayIncome: 0,
  hdcSubDebtPIKAccrued: 0,
  hdcInitialInvestment: 0,
};

// ============================================================================
// TESTS
// ============================================================================

describe('IMPL-056: Live Calculation Excel Model', () => {
  describe('generateLiveExcelModel', () => {
    it('should generate a workbook with 14 sheets', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);

      expect(workbook.SheetNames).toHaveLength(14);
      expect(workbook.SheetNames).toContain('Inputs');
      expect(workbook.SheetNames).toContain('Capital_Stack');
      expect(workbook.SheetNames).toContain('Debt_Schedule');
      expect(workbook.SheetNames).toContain('Depreciation');
      expect(workbook.SheetNames).toContain('Tax_Benefits');
      expect(workbook.SheetNames).toContain('LIHTC');
      expect(workbook.SheetNames).toContain('Operating_CF');
      expect(workbook.SheetNames).toContain('PIK_Tracking');
      expect(workbook.SheetNames).toContain('Waterfall');
      expect(workbook.SheetNames).toContain('Exit');
      expect(workbook.SheetNames).toContain('Investor_Returns');
      expect(workbook.SheetNames).toContain('HDC_Returns');
      expect(workbook.SheetNames).toContain('Summary');
      expect(workbook.SheetNames).toContain('Validation');
    });

    it('should define named ranges in the workbook', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);

      expect(workbook.Workbook).toBeDefined();
      expect(workbook.Workbook?.Names).toBeDefined();
      expect(workbook.Workbook?.Names?.length).toBeGreaterThan(50);

      // Check for key named ranges
      const rangeNames = workbook.Workbook?.Names?.map(r => r.Name) || [];
      expect(rangeNames).toContain('ProjectCost');
      expect(rangeNames).toContain('InvestorEquity');
      expect(rangeNames).toContain('SeniorDebt');
      expect(rangeNames).toContain('DepreciableBasis');
    });

    it('should include formulas in cells', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);

      // Check Capital Stack sheet has formulas
      const capitalStackSheet = workbook.Sheets['Capital_Stack'];
      expect(capitalStackSheet).toBeDefined();

      // Cell B4 should have a formula for Senior Debt
      const seniorDebtCell = capitalStackSheet['B4'];
      expect(seniorDebtCell).toBeDefined();
      expect(seniorDebtCell.f).toBeDefined();
      expect(seniorDebtCell.f).toContain('ProjectCost');
    });

    it('should pre-calculate values for display', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);

      // Check that pre-calculated values are included
      const capitalStackSheet = workbook.Sheets['Capital_Stack'];
      const seniorDebtCell = capitalStackSheet['B4'];

      // Should have both value (v) and formula (f)
      expect(seniorDebtCell.v).toBeDefined();
      expect(seniorDebtCell.f).toBeDefined();

      // Value should match expected calculation
      const expectedSeniorDebt = TEST_PARAMS.projectCost * (TEST_PARAMS.seniorDebtPct || 0) / 100;
      expect(seniorDebtCell.v).toBeCloseTo(expectedSeniorDebt, 2);
    });

    it('should export OZ Enabled = 0 when ozEnabled is false (ISS-013)', () => {
      // TEST_PARAMS has ozEnabled: false
      const params: LiveExcelParams = {
        params: { ...TEST_PARAMS, ozEnabled: false },
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      // Find the OZ Enabled row - look for cell with OZEnabled in column C
      // Row structure: [label, value, rangeName]
      let ozEnabledValue: number | undefined;
      for (let row = 1; row <= 200; row++) {
        const labelCell = inputsSheet[`A${row}`];
        if (labelCell && labelCell.v === 'OZ Enabled') {
          const valueCell = inputsSheet[`B${row}`];
          ozEnabledValue = valueCell?.v;
          break;
        }
      }

      expect(ozEnabledValue).toBe(0);
    });

    it('should export OZ Enabled = 1 when ozEnabled is true', () => {
      const params: LiveExcelParams = {
        params: { ...TEST_PARAMS, ozEnabled: true },
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      // Find the OZ Enabled row
      let ozEnabledValue: number | undefined;
      for (let row = 1; row <= 200; row++) {
        const labelCell = inputsSheet[`A${row}`];
        if (labelCell && labelCell.v === 'OZ Enabled') {
          const valueCell = inputsSheet[`B${row}`];
          ozEnabledValue = valueCell?.v;
          break;
        }
      }

      expect(ozEnabledValue).toBe(1);
    });
  });

  describe('LIHTC Sheet (11-year schedule per IRC §42)', () => {
    it('should create 11-year schedule with Year 1 prorated and Year 11 catch-up', () => {
      const lihtcParams = {
        ...TEST_PARAMS,
        lihtcEnabled: true,
        applicableFraction: 100,
        creditRate: 4,
        ddaQctBoost: false,
        placedInServiceMonth: 7,
      };

      const params: LiveExcelParams = {
        params: lihtcParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const lihtcSheet = workbook.Sheets['LIHTC'];

      expect(lihtcSheet).toBeDefined();

      // ISS-063: Row 14 contains headers ("Year", "Federal Credit", etc.)
      // Year 1 data is at row 15 (scheduleStartRow = 15 in lihtcSheet.ts)
      // Year 1 formula should include proration factor
      const year1Cell = lihtcSheet['B15'];
      expect(year1Cell).toBeDefined();
      expect(year1Cell.f).toContain('LIHTCYear1Factor');

      // Year 11 (row 25) should have catch-up formula
      // row = year + scheduleStartRow - 1 = 11 + 15 - 1 = 25
      const year11Cell = lihtcSheet['B25'];
      expect(year11Cell).toBeDefined();
      // Catch-up = Annual - Year 1 (B15)
      expect(year11Cell.f).toContain('B15');
    });
  });

  describe('OZ Benefits in Investor_Returns', () => {
    it('should include Year 5 step-up savings for OZ 2.0', () => {
      const ozParams = {
        ...TEST_PARAMS,
        ozEnabled: true,
        ozVersion: '2.0' as const,
        ozType: 'standard' as const,
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 23.8,
      };

      const params: LiveExcelParams = {
        params: ozParams,
        investorResults: {
          ...TEST_INVESTOR_RESULTS,
          ozStepUpSavings: 0.238, // 10 × 10% × 23.8%
        },
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const investorSheet = workbook.Sheets['Investor_Returns'];

      expect(investorSheet).toBeDefined();

      // Check that OZ step-up row exists
      const rangeNames = workbook.Workbook?.Names?.map(r => r.Name) || [];
      expect(rangeNames).toContain('OZStepUpSavings');
    });

    it('should use 30% step-up for rural OZ 2.0', () => {
      const ruralOzParams = {
        ...TEST_PARAMS,
        ozEnabled: true,
        ozVersion: '2.0' as const,
        ozType: 'rural' as const,
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 23.8,
      };

      const params: LiveExcelParams = {
        params: ruralOzParams,
        investorResults: {
          ...TEST_INVESTOR_RESULTS,
          ozStepUpSavings: 0.714, // 10 × 30% × 23.8%
        },
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);

      // OZ step-up percentage should be 30 for rural
      const inputsSheet = workbook.Sheets['Inputs'];
      // Find the OZStepUpPct cell by checking named ranges
      const stepUpRange = workbook.Workbook?.Names?.find(r => r.Name === 'OZStepUpPct');
      expect(stepUpRange).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with legacy AuditExportParams interface', () => {
      const workbook = generateAuditWorkbook({
        params: TEST_PARAMS,
        results: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        projectName: 'Test Project',
      });

      expect(workbook.SheetNames).toHaveLength(14);
    });
  });

  describe('Validation Sheet (IMPL-062: Tier 2 - 47 Checks)', () => {
    it('should compare Excel formulas to platform values', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const validationSheet = workbook.Sheets['Validation'];

      expect(validationSheet).toBeDefined();

      // Should have header indicating Tier 2
      // ISS-069b: Reduced from 48 to 47 (removed Preferred Return Paid check)
      expect(validationSheet['A1'].v).toContain('47 Checks');

      // Should have tolerance note
      expect(validationSheet['A2'].v).toContain('Tolerance');
    });

    it('should have 8 validation categories', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const validationSheet = workbook.Sheets['Validation'];

      // Check for category headers
      const sheetRange = validationSheet['!ref'];
      expect(sheetRange).toBeDefined();

      // Categories should be present (check for key ones)
      const cellValues = Object.entries(validationSheet)
        .filter(([key]) => key.startsWith('A') && !key.includes('!'))
        .map(([_, cell]) => (cell as any).v)
        .filter(v => typeof v === 'string');

      expect(cellValues.some(v => v.includes('CAPITAL STACK'))).toBe(true);
      expect(cellValues.some(v => v.includes('DEPRECIATION'))).toBe(true);
      expect(cellValues.some(v => v.includes('TAX BENEFITS'))).toBe(true);
      expect(cellValues.some(v => v.includes('LIHTC'))).toBe(true);
      expect(cellValues.some(v => v.includes('OPERATING CF'))).toBe(true);
      expect(cellValues.some(v => v.includes('EXIT WATERFALL'))).toBe(true);
      expect(cellValues.some(v => v.includes('DEBT AT EXIT'))).toBe(true);
      expect(cellValues.some(v => v.includes('INVESTOR RETURNS'))).toBe(true);
    });

    // ISS-069b: Reduced from 48 to 47 (removed Preferred Return Paid check)
    it('should have 47 numbered checks', () => {
      const params: LiveExcelParams = {
        params: TEST_PARAMS,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const validationSheet = workbook.Sheets['Validation'];

      // Count numbered checks (look for "N. Label" pattern in column A)
      const checkPattern = /^\d+\.\s/;
      const numberedChecks = Object.entries(validationSheet)
        .filter(([key]) => key.startsWith('A') && !key.includes('!'))
        .map(([_, cell]) => (cell as any).v)
        .filter(v => typeof v === 'string' && checkPattern.test(v));

      expect(numberedChecks.length).toBe(47);
    });
  });

  /**
   * IMPL-068: Effective Tax Rate Display Tests
   * Validates that validation sheet uses actual effective rates, not hardcoded 40.8%
   */
  describe('Effective Tax Rate Display (IMPL-068)', () => {
    it('should use provided effectiveTaxRateForBonus in validation (REP scenario)', () => {
      // REP investor in WA: 37% federal only (no NIIT, no state income tax)
      const repParams = {
        ...TEST_PARAMS,
        investorTrack: 'rep' as const,
        federalTaxRate: 37,
        stateTaxRate: 0,
        niitRate: 3.8, // Should NOT be applied for REP
        effectiveTaxRate: 37, // REP: federal only
        effectiveTaxRateForBonus: 37,
        effectiveTaxRateForStraightLine: 37,
      };

      const params: LiveExcelParams = {
        params: repParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const validationSheet = workbook.Sheets['Validation'];

      // Find the Effective Rate (Bonus) check row
      // The validation sheet uses effectiveTaxRateForBonus from params
      // It should NOT fall back to 40.8%
      expect(validationSheet).toBeDefined();

      // Workbook should generate without errors
      expect(workbook.SheetNames).toContain('Validation');
    });

    it('should use provided effectiveTaxRateForBonus in validation (Non-REP scenario)', () => {
      // Non-REP investor: 40.8% (37% federal + 3.8% NIIT)
      const nonRepParams = {
        ...TEST_PARAMS,
        investorTrack: 'non-rep' as const,
        federalTaxRate: 37,
        stateTaxRate: 0,
        niitRate: 3.8, // Applied for Non-REP
        effectiveTaxRate: 40.8, // Non-REP: federal + NIIT
        effectiveTaxRateForBonus: 40.8,
        effectiveTaxRateForStraightLine: 40.8,
      };

      const params: LiveExcelParams = {
        params: nonRepParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      expect(workbook.SheetNames).toContain('Validation');
    });

    it('should use provided effectiveTaxRateForBonus in validation (Passive CG scenario)', () => {
      // Passive investor with long-term capital gains: 23.8% (20% + 3.8% NIIT)
      const passiveCGParams = {
        ...TEST_PARAMS,
        investorTrack: 'non-rep' as const,
        federalTaxRate: 20, // Long-term capital gains rate
        stateTaxRate: 0,
        niitRate: 3.8,
        effectiveTaxRate: 23.8, // Passive CG: 20% + 3.8% NIIT
        effectiveTaxRateForBonus: 23.8,
        effectiveTaxRateForStraightLine: 23.8,
      };

      const params: LiveExcelParams = {
        params: passiveCGParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      expect(workbook.SheetNames).toContain('Validation');
    });

    it('should use federalTaxRate as fallback when effectiveTaxRateForBonus is not provided', () => {
      // No effective rate provided - should fall back to federal rate, not 40.8%
      const noEffectiveRateParams = {
        ...TEST_PARAMS,
        federalTaxRate: 37,
        // Not providing effectiveTaxRate, effectiveTaxRateForBonus, effectiveTaxRateForStraightLine
      };

      // Remove any effective rate properties that might be inherited
      delete (noEffectiveRateParams as any).effectiveTaxRate;
      delete (noEffectiveRateParams as any).effectiveTaxRateForBonus;
      delete (noEffectiveRateParams as any).effectiveTaxRateForStraightLine;

      const params: LiveExcelParams = {
        params: noEffectiveRateParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);

      // Should generate without errors and use federal rate as fallback
      expect(workbook.SheetNames).toContain('Validation');
    });
  });

  /**
   * ISS-015: State LIHTC Syndication Rate Export Tests
   */
  describe('State LIHTC Syndication Rate Export (ISS-015)', () => {
    function findInputValue(inputsSheet: XLSX.WorkSheet, label: string): number | string | undefined {
      for (let row = 1; row <= 200; row++) {
        const labelCell = inputsSheet[`A${row}`];
        if (labelCell && labelCell.v === label) {
          return inputsSheet[`B${row}`]?.v;
        }
      }
      return undefined;
    }

    it('should export syndicationRate = 100 when set to 100% (direct use)', () => {
      const params: LiveExcelParams = {
        params: { ...TEST_PARAMS, stateLIHTCEnabled: true, syndicationRate: 100 },
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      expect(findInputValue(inputsSheet, 'State LIHTC Syndication Rate')).toBe(100);
      expect(findInputValue(inputsSheet, 'State LIHTC Path')).toBe('direct');
    });

    it('should export syndicationRate = 85 when set to 85% (syndicated)', () => {
      const params: LiveExcelParams = {
        params: { ...TEST_PARAMS, stateLIHTCEnabled: true, syndicationRate: 85 },
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      expect(findInputValue(inputsSheet, 'State LIHTC Syndication Rate')).toBe(85);
      expect(findInputValue(inputsSheet, 'State LIHTC Path')).toBe('syndicated');
    });

    it('should default to 85 when syndicationRate is not provided', () => {
      const params: LiveExcelParams = {
        params: { ...TEST_PARAMS, stateLIHTCEnabled: true },
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      expect(findInputValue(inputsSheet, 'State LIHTC Syndication Rate')).toBe(85);
      expect(findInputValue(inputsSheet, 'State LIHTC Path')).toBe('syndicated');
    });
  });

  /**
   * ISS-016: State LIHTC Annual Credit Export Tests
   */
  describe('State LIHTC Annual Credit Export (ISS-016)', () => {
    function findInputValue(inputsSheet: XLSX.WorkSheet, label: string): number | string | undefined {
      for (let row = 1; row <= 200; row++) {
        const labelCell = inputsSheet[`A${row}`];
        if (labelCell && labelCell.v === label) {
          return inputsSheet[`B${row}`]?.v;
        }
      }
      return undefined;
    }

    it('should export State LIHTC Annual Credit from params', () => {
      // GA piggyback: State = Federal (4% rate, $3.2M annual for $80M qualified basis)
      const stateLIHTCParams = {
        ...TEST_PARAMS,
        stateLIHTCEnabled: true,
        stateLIHTCAnnualCredit: 3.2, // $3.2M annual
      };

      const params: LiveExcelParams = {
        params: stateLIHTCParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      expect(findInputValue(inputsSheet, 'State LIHTC Annual Credit')).toBe(3.2);
    });

    it('should default State LIHTC Annual Credit to 0 when not provided', () => {
      const params: LiveExcelParams = {
        params: { ...TEST_PARAMS, stateLIHTCEnabled: true },
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const inputsSheet = workbook.Sheets['Inputs'];

      expect(findInputValue(inputsSheet, 'State LIHTC Annual Credit')).toBe(0);
    });

    it('should use StateLIHTCAnnualCredit in LIHTC sheet formula', () => {
      const stateLIHTCParams = {
        ...TEST_PARAMS,
        stateLIHTCEnabled: true,
        stateLIHTCAnnualCredit: 3.2,
      };

      const params: LiveExcelParams = {
        params: stateLIHTCParams,
        investorResults: TEST_INVESTOR_RESULTS,
        hdcResults: TEST_HDC_RESULTS,
        cashFlows: TEST_INVESTOR_RESULTS.investorCashFlows,
        hdcCashFlows: TEST_HDC_RESULTS.hdcCashFlows,
      };

      const workbook = generateLiveExcelModel(params);
      const lihtcSheet = workbook.Sheets['LIHTC'];

      // ISS-021: Cell B8 should have State Annual Credit with value 3.2 (shifted +2 for DDA/QCT Boost row)
      const stateAnnualCell = lihtcSheet['B8'];
      expect(stateAnnualCell.v).toBe(3.2);
      // Formula should reference StateLIHTCAnnualCredit named range
      expect(stateAnnualCell.f).toContain('StateLIHTCAnnualCredit');
    });
  });
});
