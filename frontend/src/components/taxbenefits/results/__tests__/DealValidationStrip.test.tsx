/**
 * IMPL-025: Deal Validation Strip Tests
 * IMPL-034: Updated for IMPL-036b (operationalDSCR, label changes)
 *
 * Comprehensive test suite for DealValidationStrip component
 *
 * @version 1.1.0
 * @date 2025-12-30
 * @task IMPL-025, IMPL-034
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DealValidationStrip from '../DealValidationStrip';
import type { InvestorAnalysisResults, HDCAnalysisResults, CashFlowItem } from '../../../../types/taxbenefits';

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockCashFlow = (overrides: Partial<CashFlowItem> = {}): CashFlowItem => ({
  year: 1,
  noi: 5000000,
  debtServicePayments: 3000000,
  cashAfterDebtService: 2000000,
  aumFeeAmount: 50000,
  cashAfterDebtAndFees: 1950000,
  taxBenefit: 500000,
  operatingCashFlow: 1000000,
  subDebtInterest: 0,
  totalCashFlow: 1500000,
  cumulativeReturns: 1500000,
  dscr: 1.35,
  // IMPL-036b: Component now uses operationalDSCR (natural DSCR before cash management)
  operationalDSCR: 1.35,
  ...overrides
});

const createMockInvestorResults = (overrides: Partial<InvestorAnalysisResults> = {}): InvestorAnalysisResults => ({
  investorCashFlows: [],
  cashFlows: [],
  irr: 14.8,
  investorIRR: 14.8,
  multiple: 2.04,
  equityMultiple: 2.04,
  leveragedROE: 2.04,
  unleveragedROE: 0,
  totalInvestment: 17200000,
  investorEquity: 17200000,
  totalReturns: 35088000,
  investorTaxBenefits: 10000000,
  investorOperatingCashFlows: 8000000,
  investorSubDebtInterest: 0,
  investorSubDebtInterestReceived: 0,
  exitValue: 90000000,
  exitProceeds: 15000000,
  totalExitProceeds: 25000000,
  exitFees: 0,
  remainingDebtAtExit: 45000000,
  subDebtAtExit: 0,
  investorSubDebtAtExit: 0,
  outsideInvestorSubDebtAtExit: 0,
  pikAccumulatedInterest: 0,
  holdPeriod: 10,
  interestReserveAmount: 500000,
  breakEvenYear: 3,
  ...overrides
});

const createMockHDCResults = (overrides: Partial<HDCAnalysisResults> = {}): HDCAnalysisResults => ({
  hdcCashFlows: [],
  hdcMultiple: 0,
  hdcIRR: 0,
  totalHDCReturns: 53300000,
  hdcInitialInvestment: 0,
  hdcExitProceeds: 25000000,
  hdcPromoteProceeds: 39800000,
  philanthropicEquityRepayment: 0,
  hdcSubDebtRepayment: 5000000,
  hdcFeeIncome: 0,
  hdcPhilanthropicIncome: 0,
  hdcOperatingPromoteIncome: 8500000,
  hdcAumFeeIncome: 500000,
  hdcSubDebtCurrentPayIncome: 0,
  hdcSubDebtPIKAccrued: 0,
  accumulatedAumFeesAtExit: 13500000,
  ...overrides
});

const createMockCashFlows = (dscrValues: number[]): CashFlowItem[] => {
  return dscrValues.map((dscr, index) => createMockCashFlow({
    year: index + 1,
    dscr,
    // IMPL-036b: Component uses operationalDSCR for natural DSCR display
    operationalDSCR: dscr
  }));
};

// ============================================================================
// MOCK LOCALSTORAGE
// ============================================================================

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    clear: jest.fn(() => { store = {}; }),
    removeItem: jest.fn((key: string) => { delete store[key]; })
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// ============================================================================
// TESTS
// ============================================================================

describe('DealValidationStrip', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
    // Reset getItem mock to return null (no saved state = default expanded)
    mockLocalStorage.getItem.mockImplementation((key: string) => null);
  });

  // =========================================================================
  // Basic Rendering
  // =========================================================================

  describe('Basic Rendering', () => {
    it('should render the component', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35, 1.40, 1.45])}
        />
      );

      expect(screen.getByText('Deal Validation')).toBeInTheDocument();
    });

    it('should render collapsed bar with key metrics', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35, 1.40, 1.45])}
        />
      );

      // DSCR should show minimum value (operationalDSCR from IMPL-036b)
      expect(screen.getByText('DSCR')).toBeInTheDocument();
      // DSCR value appears in both collapsed bar and expanded view
      expect(screen.getAllByText('1.35x').length).toBeGreaterThan(0);

      // Multiple appears in collapsed bar and expanded view
      expect(screen.getAllByText('2.04x').length).toBeGreaterThan(0);
      // IRR appears in collapsed bar and expanded view
      expect(screen.getAllByText('14.80%').length).toBeGreaterThan(0);

      // HDC Returns - format uses 2 decimal places (appears in bar and expanded)
      expect(screen.getAllByText('HDC').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$53.30M').length).toBeGreaterThan(0);
    });

    it('should render expand/collapse button', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Collapse/Expand Behavior
  // =========================================================================

  describe('Collapse/Expand Behavior', () => {
    it('should start expanded by default', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // Expanded view should show section headers
      expect(screen.getByText('Senior')).toBeInTheDocument();
      // IMPL-036b: "Investor" appears in both collapsed bar and expanded section
      expect(screen.getAllByText('Investor').length).toBeGreaterThan(0);
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('should collapse when toggle is clicked', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(collapseButton);

      // Should now show "Expand"
      expect(screen.getByText('Expand')).toBeInTheDocument();
    });

    it('should persist collapsed state to localStorage', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(collapseButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'dealValidationStrip.isOpen',
        'false'
      );
    });

    it('should restore collapsed state from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('false');

      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      expect(screen.getByText('Expand')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // DSCR Status Indicators
  // =========================================================================

  describe('DSCR Status Indicators', () => {
    it('should show pass status for DSCR >= 1.20', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.25, 1.30, 1.35])}
        />
      );

      // Min DSCR is 1.25, should show pass (checkmark)
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should show warn status for DSCR 1.05 - 1.19', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.10, 1.15, 1.18])}
        />
      );

      // Min DSCR is 1.10, should show warning (appears in bar and expanded)
      expect(screen.getAllByText('⚠').length).toBeGreaterThan(0);
    });

    it('should show fail status for DSCR < 1.05', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([0.95, 1.00, 1.02])}
        />
      );

      // Min DSCR is 0.95, should show fail (appears in bar and expanded)
      expect(screen.getAllByText('✗').length).toBeGreaterThan(0);
    });

    it('should display covenant status in expanded view', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.25, 1.30])}
        />
      );

      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });

    it('should display MARGINAL covenant status for warning DSCR', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.10, 1.15])}
        />
      );

      expect(screen.getByText('MARGINAL')).toBeInTheDocument();
    });

    it('should display FAILED covenant status for failing DSCR', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([0.90, 0.95])}
        />
      );

      expect(screen.getByText('FAILED')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Conditional Sub-Debt Section
  // =========================================================================

  describe('Conditional Sub-Debt Section', () => {
    it('should not show sub-debt section when no sub-debt exists', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            subDebtAtExit: 0,
            investorSubDebtAtExit: 0,
            outsideInvestorSubDebtAtExit: 0
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          subDebtPct={0}
          investorSubDebtPct={0}
          outsideInvestorSubDebtPct={0}
        />
      );

      expect(screen.queryByText('Sub Debt')).not.toBeInTheDocument();
    });

    it('should show sub-debt section when sub-debt percentage is set', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            subDebtAtExit: 0,
            investorSubDebtAtExit: 0,
            outsideInvestorSubDebtAtExit: 0
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          subDebtPct={10}
        />
      );

      // Should appear in collapsed bar AND expanded section
      expect(screen.getAllByText('Sub Debt').length).toBeGreaterThan(0);
    });

    it('should show sub-debt section when exit balance exists', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            subDebtAtExit: 5000000
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // Appears in both bar and expanded section
      expect(screen.getAllByText('Sub Debt').length).toBeGreaterThan(0);
    });

    it('should show "Clears at Exit" when all sub-debt balances are zero', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            subDebtAtExit: 0,
            investorSubDebtAtExit: 0,
            outsideInvestorSubDebtAtExit: 0
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          subDebtPct={10}
        />
      );

      expect(screen.getByText('Clears at Exit')).toBeInTheDocument();
    });

    it('should show "Shortfall" when sub-debt balance remains at exit', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            subDebtAtExit: 5000000,
            investorSubDebtAtExit: 0,
            outsideInvestorSubDebtAtExit: 0
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          subDebtPct={10}
        />
      );

      expect(screen.getByText('Shortfall')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Conditional Pref Equity Section
  // =========================================================================

  describe('Conditional Pref Equity Section', () => {
    it('should not show pref equity section when not enabled', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          prefEquityPct={0}
        />
      );

      expect(screen.queryByText('Pref Equity')).not.toBeInTheDocument();
    });

    it('should show pref equity section when enabled with result', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            preferredEquityResult: {
              principal: 10000000,
              targetAmount: 17000000,
              accruedBalance: 15000000,
              paymentAtExit: 15000000,
              achievedMOIC: 1.5,
              achievedIRR: 12.5,
              moicShortfall: 0.2,
              dollarShortfall: 2000000,
              schedule: [],
              targetAchieved: false,
              metadata: {
                prefEquityPct: 15,
                targetMOIC: 1.7,
                targetIRR: 12,
                accrualRate: 12,
                holdPeriod: 10
              }
            }
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          prefEquityPct={15}
        />
      );

      expect(screen.getByText('Pref Equity')).toBeInTheDocument();
      // IMPL-036b: Value appears in both collapsed bar and expanded section
      expect(screen.getAllByText('1.50x').length).toBeGreaterThan(0);
    });

    it('should show warning when pref equity target not achieved', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({
            preferredEquityResult: {
              principal: 10000000,
              targetAmount: 17000000,
              accruedBalance: 15000000,
              paymentAtExit: 15000000,
              achievedMOIC: 1.5,
              achievedIRR: 12.5,
              moicShortfall: 0.2,
              dollarShortfall: 2000000,
              schedule: [],
              targetAchieved: false,
              metadata: {
                prefEquityPct: 15,
                targetMOIC: 1.7,
                targetIRR: 12,
                accrualRate: 12,
                holdPeriod: 10
              }
            }
          })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
          prefEquityPct={15}
        />
      );

      // Should show "Shortfall" for target not achieved
      const shortfalls = screen.getAllByText('Shortfall');
      expect(shortfalls.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Expanded View Sections
  // =========================================================================

  describe('Expanded View Sections', () => {
    it('should display Senior section with metrics', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35, 1.40])}
        />
      );

      expect(screen.getByText('Senior')).toBeInTheDocument();
      expect(screen.getByText('Min DSCR')).toBeInTheDocument();
      expect(screen.getByText('Covenant')).toBeInTheDocument();
    });

    it('should display Investor section with metrics', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // IMPL-036b: "Investor" appears in both collapsed bar and expanded section
      expect(screen.getAllByText('Investor').length).toBeGreaterThan(0);
      expect(screen.getByText('Multiple')).toBeInTheDocument();
      expect(screen.getByText('IRR')).toBeInTheDocument();
    });

    it('should display break-even year when available', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({ breakEvenYear: 3 })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      expect(screen.getByText('Break-even')).toBeInTheDocument();
      expect(screen.getByText('Year 3')).toBeInTheDocument();
    });

    it('should display HDC section with metrics', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // IMPL-036b: HDC section now shows "Total HDC" and "Exit Promote" labels
      expect(screen.getAllByText('HDC').length).toBeGreaterThan(0);
      expect(screen.getByText('Total HDC')).toBeInTheDocument();
      expect(screen.getByText('Exit Promote')).toBeInTheDocument();
    });

    it('should display Deferred AUM when amount > 0', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults({ accumulatedAumFeesAtExit: 13500000 })}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      expect(screen.getByText('Deferred AUM')).toBeInTheDocument();
      // IMPL-036b: formatAbbreviatedCurrency uses 2 decimal places
      expect(screen.getByText('$13.50M')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Formatting
  // =========================================================================

  describe('Formatting', () => {
    it('should format multiples correctly', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({ multiple: 2.04 })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // IMPL-036b: Multiple appears in both collapsed bar and expanded section
      expect(screen.getAllByText('2.04x').length).toBeGreaterThan(0);
    });

    it('should format IRR correctly', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({ irr: 14.8 })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // IMPL-036b: IRR appears in both collapsed bar and expanded section
      expect(screen.getAllByText('14.80%').length).toBeGreaterThan(0);
    });

    it('should format currency in abbreviated form', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults({ totalHDCReturns: 53300000 })}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // IMPL-036b: formatAbbreviatedCurrency uses 2 decimal places by default
      // Value appears in both collapsed bar and expanded section
      expect(screen.getAllByText('$53.30M').length).toBeGreaterThan(0);
    });

    it('should handle edge case IRR values', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({ irr: Infinity })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // IMPL-036b: N/A appears in both collapsed bar and expanded section
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('should handle empty cash flows array', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={[]}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Deal Validation')).toBeInTheDocument();
      // Min DSCR should be 0 when no cash flows - appears in both collapsed bar and expanded section
      expect(screen.getAllByText('0.00x').length).toBeGreaterThan(0);
    });

    it('should handle cash flows with null/undefined DSCR', () => {
      // IMPL-036b: Component uses operationalDSCR instead of dscr
      const cashFlows = [
        createMockCashFlow({ year: 1, operationalDSCR: undefined }),
        createMockCashFlow({ year: 2, operationalDSCR: 1.35 }),
        createMockCashFlow({ year: 3, operationalDSCR: null as unknown as number })
      ];

      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={cashFlows}
        />
      );

      // Should only consider valid operationalDSCR values
      // IMPL-036b: Value appears in both collapsed bar and expanded section
      expect(screen.getAllByText('1.35x').length).toBeGreaterThan(0);
    });

    it('should handle zero break-even year', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({ breakEvenYear: 0 })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // Should not show break-even when year is 0
      expect(screen.queryByText('Break-even')).not.toBeInTheDocument();
    });

    it('should handle null break-even year', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults({ breakEvenYear: undefined })}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // Should not show break-even when undefined
      expect(screen.queryByText('Break-even')).not.toBeInTheDocument();
    });

    it('should handle missing accumulatedAumFeesAtExit', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults({ accumulatedAumFeesAtExit: 0 })}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      // Should not show Deferred AUM when 0
      expect(screen.queryByText('Deferred AUM')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  describe('Accessibility', () => {
    it('should have accessible collapse button', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should toggle aria-label on collapse/expand', () => {
      render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Collapse');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-label', 'Expand');
    });
  });

  // =========================================================================
  // Sticky Behavior
  // =========================================================================

  describe('Sticky Behavior', () => {
    it('should render with proper container styling', () => {
      // IMPL-036b: Sticky positioning now handled by parent container (HDCResultsComponent)
      // Component itself uses inline styles for background, border, etc.
      const { container } = render(
        <DealValidationStrip
          mainAnalysisResults={createMockInvestorResults()}
          hdcAnalysisResults={createMockHDCResults()}
          cashFlows={createMockCashFlows([1.35])}
        />
      );

      const element = container.firstChild as HTMLElement;
      // Verify component renders with proper styling (border-radius, box-shadow)
      expect(element).toHaveStyle({ borderRadius: '8px' });
    });
  });
});
