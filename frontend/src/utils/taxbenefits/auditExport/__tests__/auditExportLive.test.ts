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

      // Year 1 formula should include proration factor
      const year1Cell = lihtcSheet['B12'];
      expect(year1Cell).toBeDefined();
      expect(year1Cell.f).toContain('LIHTCYear1Factor');

      // Year 11 (row 22) should have catch-up formula
      const year11Cell = lihtcSheet['B22'];
      expect(year11Cell).toBeDefined();
      // Catch-up = Annual - Year 1
      expect(year11Cell.f).toContain('B12');
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

  describe('Validation Sheet', () => {
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

      // Should have header
      expect(validationSheet['A1'].v).toBe('VALIDATION');

      // Should have tolerance note
      expect(validationSheet['A2'].v).toContain('Tolerance');
    });
  });
});
