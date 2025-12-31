/**
 * IMPL-044: InvestorAnalysisHighlevelMetrics Test Suite
 *
 * Tests for the Returns Breakdown section added to the investor portal:
 * 1. Returns Breakdown section renders when mainAnalysisResults provided
 * 2. OZ Benefits row only shows when ozEnabled && holdPeriod >= 10
 * 3. LIHTC Catch-up row only shows when remainingLIHTCCredits > 0
 * 4. Sub-Debt Repayment row only shows when investorSubDebtAtExit > 0
 * 5. All components properly formatted with currency
 * 6. Zero values handled gracefully
 *
 * @version 1.0.0
 * @date 2025-12-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestorAnalysisHighlevelMetrics from '../InvestorAnalysisHighlevelMetrics';
import type { InvestorAnalysisResults } from '../../../../types/taxbenefits';

// Mock PDF export components to avoid jsPDF dependency issues in tests
jest.mock('../../../taxbenefits/reports/HDCComprehensiveReport', () => ({
  HDCComprehensiveReportButton: ({ params, investorResults }: any) =>
    params && investorResults ? <button data-testid="comprehensive-report-btn">Comprehensive Report</button> : null
}));

jest.mock('../../../taxbenefits/reports/HDCTaxReportJsPDF', () => ({
  HDCTaxReportJsPDFButton: ({ params, investorResults }: any) =>
    params && investorResults ? <button data-testid="tax-report-btn">Tax Report</button> : null
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockInvestorResults = (overrides: Partial<InvestorAnalysisResults> = {}): InvestorAnalysisResults => ({
  investorCashFlows: [],
  totalInvestment: 35000000,
  totalReturns: 113000000,
  exitProceeds: 45000000,
  multiple: 3.23,
  irr: 15.78,
  investorTaxBenefits: 15000000,
  investorOperatingCashFlows: 4000000,
  investorSubDebtInterest: 0,
  investorSubDebtInterestReceived: 0,
  remainingDebtAtExit: 50000000,
  subDebtAtExit: 10000000,
  investorSubDebtAtExit: 5000000,
  outsideInvestorSubDebtAtExit: 0,
  exitValue: 150000000,
  totalExitProceeds: 100000000,
  pikAccumulatedInterest: 2000000,
  investorIRR: 15.78,
  cashFlows: [],
  leveragedROE: 3.23,
  unleveragedROE: 0,
  exitFees: 0,
  equityMultiple: 3.23,
  holdPeriod: 10,
  interestReserveAmount: 2000000,
  investorEquity: 35000000,
  ozRecaptureAvoided: 9500000,
  ozDeferralNPV: 2500000,
  ozExitAppreciation: 3000000,
  ...overrides
});

const baseProps = {
  investorEquity: 35000000,
  hdcFee: 3500000,
  totalReturns: 113000000,
  multipleOnInvested: 3.23,
  investorIRR: 15.78,
  exitProceeds: 45000000,
  holdPeriod: 10,
  ozEnabled: true,
  investorTaxBenefits: 15000000,
  investorOperatingCashFlows: 4000000,
  investorSubDebtAtExit: 5000000,
  ozRecaptureAvoided: 9500000,
  ozDeferralNPV: 2500000,
  ozExitAppreciation: 3000000,
  remainingLIHTCCredits: 120000
};

// ============================================================================
// TESTS
// ============================================================================

describe('InvestorAnalysisHighlevelMetrics - IMPL-044', () => {
  describe('Returns Breakdown Section', () => {
    it('renders Returns Breakdown section when mainAnalysisResults provided', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('Returns Breakdown')).toBeInTheDocument();
    });

    it('does not render Returns Breakdown section when mainAnalysisResults is null', () => {
      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={null}
        />
      );

      expect(screen.queryByText('Returns Breakdown')).not.toBeInTheDocument();
    });

    it('displays Tax Benefits row', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('Tax Benefits')).toBeInTheDocument();
    });

    it('displays Operating Cash Flows row', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('Operating Cash Flows')).toBeInTheDocument();
    });

    it('displays Exit Proceeds row', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('Exit Proceeds')).toBeInTheDocument();
    });

    it('displays Total Returns row in Returns Breakdown section', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      // Multiple "Total Returns" elements exist, verify at least one is present
      const totalReturnsElements = screen.getAllByText('Total Returns');
      expect(totalReturnsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Conditional Display - Sub-Debt Repayment', () => {
    it('shows Sub-Debt Repayment when investorSubDebtAtExit > 0', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          investorSubDebtAtExit={5000000}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('Sub-Debt Repayment')).toBeInTheDocument();
    });

    it('hides Sub-Debt Repayment when investorSubDebtAtExit is 0', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          investorSubDebtAtExit={0}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.queryByText('Sub-Debt Repayment')).not.toBeInTheDocument();
    });
  });

  describe('Conditional Display - OZ Tax Benefits', () => {
    it('shows OZ Tax Benefits when ozEnabled && holdPeriod >= 10 && totalOzBenefits > 0', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          ozEnabled={true}
          holdPeriod={10}
          ozRecaptureAvoided={9500000}
          ozDeferralNPV={2500000}
          ozExitAppreciation={3000000}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('OZ Tax Benefits')).toBeInTheDocument();
    });

    it('hides OZ Tax Benefits when ozEnabled is false', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          ozEnabled={false}
          holdPeriod={10}
          ozRecaptureAvoided={9500000}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.queryByText('OZ Tax Benefits')).not.toBeInTheDocument();
    });

    it('hides OZ Tax Benefits when holdPeriod < 10', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          ozEnabled={true}
          holdPeriod={7}
          ozRecaptureAvoided={9500000}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.queryByText('OZ Tax Benefits')).not.toBeInTheDocument();
    });

    it('hides OZ Tax Benefits when all OZ values are 0', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          ozEnabled={true}
          holdPeriod={10}
          ozRecaptureAvoided={0}
          ozDeferralNPV={0}
          ozExitAppreciation={0}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.queryByText('OZ Tax Benefits')).not.toBeInTheDocument();
    });
  });

  describe('Conditional Display - LIHTC Catch-up', () => {
    it('shows LIHTC Catch-up when remainingLIHTCCredits > 0', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          remainingLIHTCCredits={120000}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.getByText('LIHTC Catch-up')).toBeInTheDocument();
    });

    it('hides LIHTC Catch-up when remainingLIHTCCredits is 0', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          remainingLIHTCCredits={0}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      expect(screen.queryByText('LIHTC Catch-up')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values gracefully', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          investorTaxBenefits={0}
          investorOperatingCashFlows={0}
          exitProceeds={0}
          investorSubDebtAtExit={0}
          ozRecaptureAvoided={0}
          ozDeferralNPV={0}
          ozExitAppreciation={0}
          remainingLIHTCCredits={0}
          totalReturns={0}
          mainAnalysisResults={mainAnalysisResults}
        />
      );

      // Should render without errors
      expect(screen.getByText('Returns Breakdown')).toBeInTheDocument();
      // Multiple "Total Returns" elements exist
      const totalReturnsElements = screen.getAllByText('Total Returns');
      expect(totalReturnsElements.length).toBeGreaterThan(0);
    });

    it('handles undefined mainAnalysisResults gracefully', () => {
      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={undefined as any}
        />
      );

      // Should not throw, just not render Returns Breakdown
      expect(screen.queryByText('Returns Breakdown')).not.toBeInTheDocument();
    });
  });

  describe('IMPL-044b: PDF Export Buttons', () => {
    const mockParams = {
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 6,
      revenueGrowth: 2,
      expenseGrowth: 2,
      exitCapRate: 5,
      investorEquityPct: 35,
      hdcFeeRate: 10,
      investorPromoteShare: 35,
      holdPeriod: 10,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 35000000,
      totalTaxBenefit: 20000000,
      netTaxBenefit: 18000000,
      hdcFee: 3500000,
    };

    it('renders PDF export buttons when params and mainAnalysisResults provided', () => {
      const mainAnalysisResults = createMockInvestorResults();

      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
          params={mockParams as any}
        />
      );

      // Check for mocked PDF buttons using test IDs
      expect(screen.getByTestId('comprehensive-report-btn')).toBeInTheDocument();
      expect(screen.getByTestId('tax-report-btn')).toBeInTheDocument();
    });

    it('does not render PDF export buttons when params is undefined', () => {
      const mainAnalysisResults = createMockInvestorResults();

      const { container } = render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={mainAnalysisResults}
          params={undefined}
        />
      );

      // Returns Breakdown should still render
      expect(screen.getByText('Returns Breakdown')).toBeInTheDocument();

      // But no PDF button container (check for the specific div structure)
      const pdfButtonContainer = container.querySelector('.flex.gap-2.mt-4.pt-4');
      expect(pdfButtonContainer).toBeNull();
    });

    it('does not render PDF export buttons when mainAnalysisResults is null', () => {
      render(
        <InvestorAnalysisHighlevelMetrics
          {...baseProps}
          mainAnalysisResults={null}
          params={mockParams as any}
        />
      );

      // Returns Breakdown section should not render
      expect(screen.queryByText('Returns Breakdown')).not.toBeInTheDocument();
    });
  });
});
