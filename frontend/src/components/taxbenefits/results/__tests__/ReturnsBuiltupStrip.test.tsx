/**
 * IMPL-028: Returns Buildup Strip Tests
 * IMPL-026a: Updated for proper millions formatting (2 decimal places)
 *
 * Tests component derivation logic and conditional rendering.
 *
 * @version 1.1.0
 * @date 2026-01-06
 * @task IMPL-028, IMPL-026a
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ReturnsBuiltupStrip from '../ReturnsBuiltupStrip';
import type { InvestorAnalysisResults, CashFlowItem } from '../../../../types/taxbenefits';

// Mock formatters - IMPL-026a: Use 2 decimal places for currency
jest.mock('../../../../utils/taxbenefits/formatters', () => ({
  formatAbbreviatedCurrency: (value: number) => `$${(value / 1e6).toFixed(2)}M`,
  formatMultiple: (value: number) => `${value.toFixed(2)}x`,
}));

describe('IMPL-028: ReturnsBuiltupStrip', () => {
  // Base mock results - IMPL-026a: All values in MILLIONS per codebase convention
  const mockResults: InvestorAnalysisResults = {
    investorCashFlows: [],
    exitProceeds: 5, // $5M
    totalInvestment: 2, // $2M
    totalReturns: 10, // $10M
    multiple: 5.0,
    irr: 25,
    investorTaxBenefits: 3, // $3M Depreciation
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
    investorIRR: 25,
    cashFlows: [],
    leveragedROE: 5.0,
    unleveragedROE: 0,
    exitFees: 0,
    equityMultiple: 5.0,
    holdPeriod: 10,
    interestReserveAmount: 0,
    investorEquity: 2, // $2M
  };

  // Mock cash flows with LIHTC credits - IMPL-026a: All values in MILLIONS
  const mockCashFlows: CashFlowItem[] = [
    {
      year: 1,
      noi: 0.5, // $500K
      debtServicePayments: 0.1,
      cashAfterDebtService: 0.4,
      aumFeeAmount: 0,
      cashAfterDebtAndFees: 0.4,
      taxBenefit: 0.3,
      operatingCashFlow: 0.1,
      subDebtInterest: 0,
      totalCashFlow: 0.5,
      cumulativeReturns: 0.5,
      federalLIHTCCredit: 0.2, // $200K
      stateLIHTCCredit: 0.15, // $150K
    },
    {
      year: 2,
      noi: 0.52,
      debtServicePayments: 0.1,
      cashAfterDebtService: 0.42,
      aumFeeAmount: 0,
      cashAfterDebtAndFees: 0.42,
      taxBenefit: 0.3,
      operatingCashFlow: 0.12,
      subDebtInterest: 0,
      totalCashFlow: 0.52,
      cumulativeReturns: 1.02,
      federalLIHTCCredit: 0.2, // $200K
      stateLIHTCCredit: 0.15, // $150K
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

    // IMPL-045: Updated label from 'State LIHTC' to 'State LIHTC Credits'
    it('should render State LIHTC Credits row when credits exist', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      expect(screen.getByText('State LIHTC Credits')).toBeInTheDocument();
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

      // IMPL-026a: 0.2M * 2 years = 0.4M → "$0.40M" with 2 decimals
      expect(screen.getByText('$0.40M')).toBeInTheDocument();
    });

    it('should correctly sum State LIHTC from cash flows', () => {
      render(
        <ReturnsBuiltupStrip
          mainAnalysisResults={mockResults}
          cashFlows={mockCashFlows}
        />
      );

      // IMPL-026a: 0.15M * 2 years = 0.3M → "$0.30M" with 2 decimals
      expect(screen.getByText('$0.30M')).toBeInTheDocument();
    });
  });
});
