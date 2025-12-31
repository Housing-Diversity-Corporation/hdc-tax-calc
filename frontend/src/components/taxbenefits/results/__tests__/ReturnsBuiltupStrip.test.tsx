/**
 * IMPL-028: Returns Buildup Strip Tests
 *
 * Tests component derivation logic and conditional rendering.
 *
 * @version 1.0.0
 * @date 2025-12-27
 * @task IMPL-028
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ReturnsBuiltupStrip from '../ReturnsBuiltupStrip';
import type { InvestorAnalysisResults, CashFlowItem } from '../../../../types/taxbenefits';

// Mock formatters
jest.mock('../../../../utils/taxbenefits/formatters', () => ({
  formatAbbreviatedCurrency: (value: number) => `$${(value / 1e6).toFixed(1)}M`,
  formatMultiple: (value: number) => `${value.toFixed(2)}x`,
}));

describe('IMPL-028: ReturnsBuiltupStrip', () => {
  // Base mock results
  const mockResults: InvestorAnalysisResults = {
    investorCashFlows: [],
    exitProceeds: 5000000,
    totalInvestment: 2000000,
    totalReturns: 10000000,
    multiple: 5.0,
    irr: 25,
    investorTaxBenefits: 3000000, // Depreciation
    investorOperatingCashFlows: 1000000,
    investorSubDebtInterest: 0,
    investorSubDebtInterestReceived: 0,
    remainingDebtAtExit: 0,
    subDebtAtExit: 0,
    investorSubDebtAtExit: 0,
    outsideInvestorSubDebtAtExit: 0,
    exitValue: 10000000,
    totalExitProceeds: 10000000,
    pikAccumulatedInterest: 0,
    investorIRR: 25,
    cashFlows: [],
    leveragedROE: 5.0,
    unleveragedROE: 0,
    exitFees: 0,
    equityMultiple: 5.0,
    holdPeriod: 10,
    interestReserveAmount: 0,
    investorEquity: 2000000,
  };

  // Mock cash flows with LIHTC credits
  const mockCashFlows: CashFlowItem[] = [
    {
      year: 1,
      noi: 500000,
      debtServicePayments: 100000,
      cashAfterDebtService: 400000,
      aumFeeAmount: 0,
      cashAfterDebtAndFees: 400000,
      taxBenefit: 300000,
      operatingCashFlow: 100000,
      subDebtInterest: 0,
      totalCashFlow: 500000,
      cumulativeReturns: 500000,
      federalLIHTCCredit: 200000,
      stateLIHTCCredit: 150000,
    },
    {
      year: 2,
      noi: 520000,
      debtServicePayments: 100000,
      cashAfterDebtService: 420000,
      aumFeeAmount: 0,
      cashAfterDebtAndFees: 420000,
      taxBenefit: 300000,
      operatingCashFlow: 120000,
      subDebtInterest: 0,
      totalCashFlow: 520000,
      cumulativeReturns: 1020000,
      federalLIHTCCredit: 200000,
      stateLIHTCCredit: 150000,
    },
  ];

  describe('Component rendering', () => {
    it('should render the header', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('Returns Buildup')).toBeInTheDocument();
    });

    it('should render Federal LIHTC row when credits exist', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('Federal LIHTC')).toBeInTheDocument();
    });

    it('should render State LIHTC row when credits exist', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('State LIHTC')).toBeInTheDocument();
    });

    it('should render Depreciation Benefits row', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('Depreciation Benefits')).toBeInTheDocument();
    });

    it('should render Operating Cash Flow row', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('Operating Cash Flow')).toBeInTheDocument();
    });

    it('should render Exit Proceeds row', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('Exit Proceeds (net)')).toBeInTheDocument();
    });

    it('should render Total Returns row', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('Total Returns')).toBeInTheDocument();
    });
  });

  describe('Conditional rendering', () => {
    it('should not render State LIHTC row when no state credits', () => {
      const cashFlowsNoState: CashFlowItem[] = mockCashFlows.map(cf => ({
        ...cf,
        stateLIHTCCredit: 0,
      }));

      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={cashFlowsNoState}
        />
      );

      expect(screen.queryByText('State LIHTC')).not.toBeInTheDocument();
    });

    it('should not render Federal LIHTC row when no federal credits', () => {
      const cashFlowsNoFederal: CashFlowItem[] = mockCashFlows.map(cf => ({
        ...cf,
        federalLIHTCCredit: 0,
      }));

      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={cashFlowsNoFederal}
        />
      );

      expect(screen.queryByText('Federal LIHTC')).not.toBeInTheDocument();
    });

    it('should not render when totalInvestment is zero', () => {
      const zeroInvestment = { ...mockResults, totalInvestment: 0 };

      const { container } = render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={zeroInvestment}
          cashFlows={mockCashFlows}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Value derivation', () => {
    it('should correctly sum Federal LIHTC from cash flows', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      // 200000 * 2 years = 400000 = $0.4M
      expect(screen.getByText('$0.4M')).toBeInTheDocument();
    });

    it('should correctly sum State LIHTC from cash flows', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      // 150000 * 2 years = 300000 = $0.3M
      expect(screen.getByText('$0.3M')).toBeInTheDocument();
    });
  });
});
