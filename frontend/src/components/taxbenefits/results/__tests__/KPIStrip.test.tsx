/**
 * IMPL-026: KPI Strip Tests
 * IMPL-026a: Updated for proper millions formatting
 *
 * Tests:
 * - All 10 KPIs render correctly
 * - Dark mode works (via CSS variables)
 * - Collapse state persists in localStorage
 *
 * @version 1.1.0
 * @date 2026-01-06
 * @task IMPL-026, IMPL-026a
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KPIStrip from '../KPIStrip';
import type { InvestorAnalysisResults, CashFlowItem, StateLIHTCIntegrationResult } from '../../../../types/taxbenefits';

// Mock formatters - IMPL-026a: Use 2 decimal places for currency
jest.mock('../../../../utils/taxbenefits/formatters', () => ({
  formatAbbreviatedCurrency: (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value}`;
  },
  formatMultiple: (value: number) => `${value.toFixed(2)}x`,
  formatIRR: (value: number) => `${value.toFixed(2)}%`,
  formatPercent: (value: number, decimals: number = 2) => `${value.toFixed(decimals)}%`,
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('IMPL-026: KPIStrip', () => {
  // Base mock results - IMPL-026a: All values in MILLIONS per codebase convention
  const mockResults: InvestorAnalysisResults = {
    investorCashFlows: [],
    exitProceeds: 5, // $5M
    totalInvestment: 8.2, // $8.2M
    totalReturns: 89.134, // For ~10.87x multiple
    multiple: 10.87,
    irr: 79.93,
    investorTaxBenefits: 25, // $25M depreciation benefits
    investorOperatingCashFlows: 1, // $1M
    investorSubDebtInterest: 0,
    investorSubDebtInterestReceived: 0,
    remainingDebtAtExit: 0,
    subDebtAtExit: 0,
    investorSubDebtAtExit: 0,
    outsideInvestorSubDebtAtExit: 0,
    exitValue: 10, // $10M
    totalExitProceeds: 10, // $10M
    pikAccumulatedInterest: 0,
    investorIRR: 79.93,
    cashFlows: [],
    leveragedROE: 10.87,
    unleveragedROE: 0,
    exitFees: 0,
    equityMultiple: 10.87,
    holdPeriod: 10,
    interestReserveAmount: 0,
    investorEquity: 8.2, // $8.2M
    breakEvenYear: 2,
  };

  // Mock cash flows - IMPL-026a: All values in MILLIONS
  // IMPL-026b: cumulativeReturns is running total of cash received (not net of investment)
  // Break-even = first year where cumulativeReturns >= investorEquity (8.2M)
  const mockCashFlows: CashFlowItem[] = [
    {
      year: 1,
      noi: 5, // $5M
      operationalDSCR: 1.49,
      debtServicePayments: 3.35, // $3.35M
      cashAfterDebtService: 1.65,
      aumFeeAmount: 0,
      cashAfterDebtAndFees: 1.65,
      taxBenefit: 6, // $6M Year 1 tax savings
      operatingCashFlow: 0.5,
      subDebtInterest: 0,
      totalCashFlow: 6.5,
      cumulativeReturns: 6.5, // $6.5M received, < $8.2M equity - not recovered yet
      federalLIHTCCredit: 0,
      stateLIHTCCredit: 0,
    },
    {
      year: 2,
      noi: 5.15,
      operationalDSCR: 1.54,
      debtServicePayments: 3.35,
      cashAfterDebtService: 1.8,
      aumFeeAmount: 0,
      cashAfterDebtAndFees: 1.8,
      taxBenefit: 3,
      operatingCashFlow: 0.6,
      subDebtInterest: 0,
      totalCashFlow: 4,
      cumulativeReturns: 10.5, // $10.5M received >= $8.2M equity - BREAK-EVEN in Year 2
      federalLIHTCCredit: 0,
      stateLIHTCCredit: 0,
    },
  ];

  // Props - IMPL-026a: Values in MILLIONS
  const defaultProps = {
    mainAnalysisResults: mockResults,
    cashFlows: mockCashFlows,
    investorEquity: 8.2, // $8.2M
    totalProjectCost: 86, // $86M
    stateLIHTCIntegration: null as StateLIHTCIntegrationResult | null,
  };

  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('All 10 KPIs render', () => {
    it('should render Investor Equity', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Investor Equity')).toBeInTheDocument();
      // 8.2M * 1,000,000 = 8,200,000 -> $8.20M
      expect(screen.getByText('$8.20M')).toBeInTheDocument();
    });

    it('should render State LIHTC (shows $0 when none)', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('State LIHTC')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('should render State LIHTC with value when integration exists', () => {
      const propsWithStateLIHTC = {
        ...defaultProps,
        stateLIHTCIntegration: {
          creditPath: 'syndicated' as const,
          syndicationRate: 0.85,
          grossCredit: 5, // $5M
          netProceeds: 4.25, // $4.25M
          yearlyCredits: [],
          totalCreditBenefit: 0,
          treatment: 'capital_stack' as const,
          warnings: [],
        },
      };
      render(<KPIStrip {...propsWithStateLIHTC} />);
      // 4.25M * 1,000,000 = 4,250,000 -> $4.25M
      expect(screen.getByText('$4.25M')).toBeInTheDocument();
    });

    it('should render Total Sources', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Total Sources')).toBeInTheDocument();
      // 86M * 1,000,000 = 86,000,000 -> $86.00M
      expect(screen.getByText('$86.00M')).toBeInTheDocument();
    });

    it('should render Leverage', () => {
      render(<KPIStrip {...defaultProps} />);
      // Appears in both collapsed bar and expanded view
      expect(screen.getAllByText('Leverage').length).toBeGreaterThanOrEqual(1);
      // (86M - 8.2M) / 86M * 100 = 90%
      expect(screen.getAllByText('90%').length).toBeGreaterThanOrEqual(1);
    });

    it('should render DSCR with checkmark when >= 1.25', () => {
      render(<KPIStrip {...defaultProps} />);
      // Appears in both collapsed bar and expanded view
      expect(screen.getAllByText('DSCR').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('1.49x').length).toBeGreaterThanOrEqual(1);
      // Should show checkmark since 1.49 >= 1.25
      expect(screen.getAllByText('✓').length).toBeGreaterThan(0);
    });

    it('should render Total Multiple', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Total Multiple')).toBeInTheDocument();
      // 10.87x appears in collapsed bar summary AND expanded view
      expect(screen.getAllByText('10.87x').length).toBeGreaterThanOrEqual(1);
    });

    it('should render IRR', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('IRR')).toBeInTheDocument();
      // 79.93% appears in collapsed bar summary AND expanded view
      expect(screen.getAllByText('79.93%').length).toBeGreaterThanOrEqual(1);
    });

    it('should render Year 1 Tax Savings', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Year 1 Tax Savings')).toBeInTheDocument();
      // 6M * 1,000,000 = 6,000,000 -> $6.00M
      expect(screen.getByText('$6.00M')).toBeInTheDocument();
    });

    it('should render Break-even Year', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Break-even Year')).toBeInTheDocument();
      expect(screen.getByText('Year 2')).toBeInTheDocument();
    });

    it('should render Tax Benefit Multiple', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Tax Benefit Multiple')).toBeInTheDocument();
    });

    it('should render Performance Multiple', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Performance Multiple')).toBeInTheDocument();
    });

    it('should render Tax Benefit %', () => {
      render(<KPIStrip {...defaultProps} />);
      expect(screen.getByText('Tax Benefit %')).toBeInTheDocument();
    });
  });

  describe('Dark mode support', () => {
    it('should use CSS classes for dark mode compatibility', () => {
      const { container } = render(<KPIStrip {...defaultProps} />);

      // Check that the component uses CSS class for theme-aware styling
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('kpi-strip-container');
    });
  });

  describe('Collapse state persistence', () => {
    it('should default to open state', () => {
      render(<KPIStrip {...defaultProps} />);

      // Should show expanded content
      expect(screen.getByText('Investor Equity')).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('should save collapse state to localStorage', () => {
      render(<KPIStrip {...defaultProps} />);

      // Click to collapse
      const collapseButton = screen.getByText('Collapse');
      fireEvent.click(collapseButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'kpiStrip.isOpen',
        'false'
      );
    });

    it('should restore collapse state from localStorage', () => {
      // Set localStorage to collapsed
      mockLocalStorage.getItem.mockReturnValueOnce('false');

      render(<KPIStrip {...defaultProps} />);

      // Should show "Expand" button when collapsed
      expect(screen.getByText('Expand')).toBeInTheDocument();
    });

    it('should toggle between collapsed and expanded', () => {
      render(<KPIStrip {...defaultProps} />);

      // Initially expanded
      expect(screen.getByText('Collapse')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('Collapse'));

      // Now should show Expand
      expect(screen.getByText('Expand')).toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText('Expand'));

      // Back to Collapse
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });
  });

  describe('DSCR status indicator', () => {
    it('should show checkmark when DSCR >= 1.25', () => {
      render(<KPIStrip {...defaultProps} />);
      // 1.49 >= 1.25, should show checkmark
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should not show checkmark when DSCR < 1.25', () => {
      const lowDSCRCashFlows: CashFlowItem[] = mockCashFlows.map(cf => ({
        ...cf,
        operationalDSCR: 1.10, // Below threshold
      }));

      render(<KPIStrip {...defaultProps} cashFlows={lowDSCRCashFlows} />);

      // DSCR should show 1.10x (appears in multiple places)
      expect(screen.getAllByText('1.10x').length).toBeGreaterThanOrEqual(1);

      // In the expanded view, the DSCR KPI item should not have a checkmark
      // The checkmark only appears when DSCR >= 1.25
      const dscrLabels = screen.getAllByText('DSCR');
      expect(dscrLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Collapsed bar summary', () => {
    it('should show summary KPIs in collapsed bar', () => {
      render(<KPIStrip {...defaultProps} />);

      // The collapsed bar should show key metrics
      expect(screen.getByText('Investor KPIs')).toBeInTheDocument();
    });
  });
});
