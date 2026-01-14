/**
 * IMPL-028: Returns Buildup Strip
 * IMPL-031: OZ Benefits Display Fix
 * IMPL-036: Reorder, sticky, collapsible styling
 * IMPL-026a: Dark mode compatibility and 2 decimal currency formatting
 * IMPL-048b: Fix component sum validation and include missing components
 *
 * Shows component-by-component contribution to investor multiple.
 * Modeled after Atrium Court HDC Model v3.0 (Page 2).
 *
 * Features:
 * - Each row shows dollar value + multiple contribution
 * - Visual progress bar showing buildup
 * - Conditional rows (hides when component = $0)
 * - Validates components sum to total multiple (with console warning if mismatch)
 * - IMPL-031: Displays OZ Benefits (recapture avoided, deferral NPV, exit appreciation)
 * - IMPL-036: Reordered (tax benefits → operating cash → exit), sticky, collapsible
 * - IMPL-048b: Federal LIHTC includes Year 11+ catch-up credits
 * - IMPL-048b: Operating Cash Flow includes excess reserve distribution
 *
 * Component Order (IMPL-036):
 * 1. Tax Benefits: Federal LIHTC, State LIHTC, Depreciation Benefits, OZ Benefits
 * 2. Cash Flow: Operating Cash Flow, Sub-Debt Interest
 * 3. Exit: Exit Proceeds, Sub-Debt Repayment
 * 4. Fees (negative)
 *
 * IMPORTANT: All monetary values in this component are in MILLIONS.
 * We convert to dollars (multiply by 1,000,000) before formatting.
 *
 * @version 1.4.0
 * @date 2026-01-06
 * @task IMPL-028, IMPL-031, IMPL-036, IMPL-026a, IMPL-048b
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { InvestorAnalysisResults, CashFlowItem } from '../../../types/taxbenefits';
import {
  formatAbbreviatedCurrency,
  formatMultiple
} from '../../../utils/taxbenefits/formatters';

// ============================================================================
// TYPES
// ============================================================================

interface ReturnsBuiltupStripProps {
  /** Investor analysis results from calculation engine */
  mainAnalysisResults: InvestorAnalysisResults;
  /** Per-year cash flow data */
  cashFlows: CashFlowItem[];
}

interface ReturnComponent {
  label: string;
  value: number;
  multiple: number;
  color: string;
  category: 'tax' | 'cash' | 'exit' | 'fees';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'returnsBuiltupStrip.isOpen';
const MILLIONS_MULTIPLIER = 1000000;

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format a value that's already in millions as abbreviated currency with 2 decimals.
 * E.g., 8.2 (meaning $8.2M) → "$8.20M"
 */
function formatMillionsAsCurrency(valueInMillions: number): string {
  // Convert from millions to dollars, then use the standard formatter
  const valueInDollars = valueInMillions * MILLIONS_MULTIPLIER;
  return formatAbbreviatedCurrency(valueInDollars);
}

// Color palette for return components (HDC brand colors)
const COMPONENT_COLORS = {
  federalLIHTC: 'var(--hdc-faded-jade)',      // Teal
  stateLIHTC: 'var(--hdc-gulf-stream)',       // Light teal
  depreciation: 'var(--hdc-sushi)',           // Green
  operatingCash: 'var(--hdc-cabbage-pont)',   // Gray-green
  exitProceeds: 'var(--hdc-spectra)',         // Dark teal
  subDebtReturn: 'var(--hdc-oslo-gray)',      // Gray for sub-debt
  ozBenefits: '#8B5CF6',                      // Purple for OZ benefits (distinct from other categories)
  negative: 'var(--hdc-strikemaster)',        // Red for negative items
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Derive return components from results and cash flows
 *
 * CRITICAL: Components must sum to totalReturns for the multiple calculation to be accurate.
 * totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits
 *
 * IMPL-036 Order:
 * 1. Tax Benefits: Federal LIHTC, State LIHTC, Depreciation, OZ Benefits
 * 2. Cash Flow: Operating Cash Flow, Sub-Debt Interest
 * 3. Exit: Exit Proceeds, Sub-Debt Repayment
 * 4. Fees (negative, shown last)
 */
function deriveReturnComponents(
  results: InvestorAnalysisResults,
  cashFlows: CashFlowItem[]
): ReturnComponent[] {
  const totalInvestment = results.totalInvestment || 1; // Avoid division by zero

  // Sum Federal LIHTC from cash flows
  const federalLIHTCFromCashFlows = cashFlows.reduce(
    (sum, cf) => sum + (cf.federalLIHTCCredit || 0),
    0
  );
  // IMPL-048b: Include remaining LIHTC credits (Year 11+ catch-up) in Federal LIHTC total
  const remainingLIHTCCredits = results.remainingLIHTCCredits || 0;
  const federalLIHTCTotal = federalLIHTCFromCashFlows + remainingLIHTCCredits;

  // Sum State LIHTC from cash flows
  const stateLIHTCTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.stateLIHTCCredit || 0),
    0
  );

  // Depreciation = investorTaxBenefits (already separate from LIHTC)
  const depreciationTotal = results.investorTaxBenefits || 0;

  // IMPL-048b: Include excess reserve distribution in operating cash flow
  const excessReserveTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.excessReserveDistribution || 0),
    0
  );
  // Operating cash flow total (investor's share after promote split) + excess reserve
  const operatingCashTotal = (results.investorOperatingCashFlows || 0) + excessReserveTotal;

  // Exit proceeds (already net of deferred fees)
  const exitProceedsTotal = results.exitProceeds || 0;

  // Investor sub-debt at exit (principal + accrued interest returned)
  const investorSubDebtAtExitTotal = results.investorSubDebtAtExit || 0;

  // Sub-debt interest received during hold period
  const subDebtInterestReceivedTotal = results.investorSubDebtInterestReceived || 0;

  // IMPL-031: OZ Benefits (for 10+ year holds)
  const ozRecaptureAvoided = results.ozRecaptureAvoided || 0;
  const ozDeferralNPV = results.ozDeferralNPV || 0;
  const ozExitAppreciation = results.ozExitAppreciation || 0;
  const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation;

  // Calculate fees paid during hold period (these reduce annual cash flows)
  const aumFeePaidTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.aumFeePaid || 0),
    0
  );
  const hdcSubDebtCurrentPayTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.subDebtInterest || 0),
    0
  );
  const outsideInvestorCurrentPayTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.outsideInvestorCurrentPay || 0),
    0
  );

  // Net fees paid (reduces returns)
  const totalFeesPaid = aumFeePaidTotal + hdcSubDebtCurrentPayTotal + outsideInvestorCurrentPayTotal;

  // Build components array in IMPL-036 order
  const components: ReturnComponent[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // 1. TAX BENEFITS (first)
  // ─────────────────────────────────────────────────────────────────────────
  if (federalLIHTCTotal > 0) {
    components.push({
      label: 'Federal LIHTC',
      value: federalLIHTCTotal,
      multiple: federalLIHTCTotal / totalInvestment,
      color: COMPONENT_COLORS.federalLIHTC,
      category: 'tax',
    });
  }

  // IMPL-045: State LIHTC Credits (direct use path only)
  // Note: Syndicated State LIHTC proceeds are shown in Capital Structure section
  // as they reduce investment (denominator) rather than increase returns (numerator)
  if (stateLIHTCTotal > 0) {
    components.push({
      label: 'State LIHTC Credits',
      value: stateLIHTCTotal,
      multiple: stateLIHTCTotal / totalInvestment,
      color: COMPONENT_COLORS.stateLIHTC,
      category: 'tax',
    });
  }

  if (depreciationTotal > 0) {
    components.push({
      label: 'Depreciation Benefits',
      value: depreciationTotal,
      multiple: depreciationTotal / totalInvestment,
      color: COMPONENT_COLORS.depreciation,
      category: 'tax',
    });
  }

  // IMPL-031: OZ Benefits (tax-related)
  if (totalOzBenefits > 0) {
    components.push({
      label: 'OZ Benefits',
      value: totalOzBenefits,
      multiple: totalOzBenefits / totalInvestment,
      color: COMPONENT_COLORS.ozBenefits,
      category: 'tax',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CASH FLOW (second)
  // ─────────────────────────────────────────────────────────────────────────
  if (operatingCashTotal > 0) {
    components.push({
      label: 'Operating Cash Flow',
      value: operatingCashTotal,
      multiple: operatingCashTotal / totalInvestment,
      color: COMPONENT_COLORS.operatingCash,
      category: 'cash',
    });
  }

  // Sub-debt interest received during hold period
  if (subDebtInterestReceivedTotal > 0) {
    components.push({
      label: 'Sub-Debt Interest',
      value: subDebtInterestReceivedTotal,
      multiple: subDebtInterestReceivedTotal / totalInvestment,
      color: COMPONENT_COLORS.subDebtReturn,
      category: 'cash',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. EXIT (third)
  // ─────────────────────────────────────────────────────────────────────────
  if (exitProceedsTotal > 0) {
    components.push({
      label: 'Exit Proceeds (net)',
      value: exitProceedsTotal,
      multiple: exitProceedsTotal / totalInvestment,
      color: COMPONENT_COLORS.exitProceeds,
      category: 'exit',
    });
  }

  // IMPL-045: Investor sub-debt repayment at exit (includes both principal and accrued PIK interest)
  if (investorSubDebtAtExitTotal > 0) {
    components.push({
      label: 'Sub-Debt Repayment (Principal + PIK)',
      value: investorSubDebtAtExitTotal,
      multiple: investorSubDebtAtExitTotal / totalInvestment,
      color: COMPONENT_COLORS.subDebtReturn,
      category: 'exit',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. FEES (last, negative)
  // ─────────────────────────────────────────────────────────────────────────
  if (totalFeesPaid > 1000) { // Only show if > $1K
    components.push({
      label: 'Fees Paid',
      value: -totalFeesPaid,
      multiple: -totalFeesPaid / totalInvestment,
      color: COMPONENT_COLORS.negative,
      category: 'fees',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPL-048b: Validation check - components should sum to totalReturns
  // ─────────────────────────────────────────────────────────────────────────
  const componentSum = components.reduce((sum, c) => sum + c.value, 0);
  const totalReturns = results.totalReturns || 0;
  const tolerance = 0.01; // Allow 0.01M ($10K) tolerance for floating point
  const discrepancy = Math.abs(componentSum - totalReturns);

  if (discrepancy > tolerance && totalReturns > 0) {
    console.warn('IMPL-048b: Returns Buildup Strip component sum mismatch', {
      componentSum,
      totalReturns,
      discrepancy,
      components: components.map(c => ({ label: c.label, value: c.value })),
    });
  }

  return components;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ComponentRowProps {
  component: ReturnComponent;
  totalValue: number;
}

/**
 * Individual component row with value, multiple, and percentage of total
 * Uses CSS classes for dark mode compatibility
 */
const ComponentRow: React.FC<ComponentRowProps> = ({
  component,
  totalValue
}) => {
  // Calculate this component's percentage of total returns
  const percentOfTotal = totalValue > 0
    ? (component.value / totalValue) * 100
    : 0;

  return (
    <div
      className="returns-component-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.5rem 0',
      }}
    >
      {/* Color indicator */}
      <div style={{
        width: '4px',
        height: '24px',
        backgroundColor: component.color,
        borderRadius: '2px',
        flexShrink: 0,
      }} />

      {/* Label */}
      <div
        className="returns-value"
        style={{
          flex: 1,
          fontSize: '0.85rem',
          minWidth: '140px',
        }}
      >
        {component.label}
      </div>

      {/* Value */}
      <div
        className="returns-value"
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'right',
          minWidth: '80px',
        }}
      >
        {formatMillionsAsCurrency(component.value)}
      </div>

      {/* Multiple contribution */}
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        color: component.color,
        textAlign: 'right',
        minWidth: '50px',
      }}>
        {component.multiple.toFixed(2)}x
      </div>

      {/* Percentage of total */}
      <div style={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: component.value >= 0 ? component.color : 'var(--hdc-strikemaster)',
        textAlign: 'right',
        minWidth: '50px',
      }}>
        {percentOfTotal.toFixed(1)}%
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReturnsBuiltupStrip: React.FC<ReturnsBuiltupStripProps> = ({
  mainAnalysisResults,
  cashFlows
}) => {
  // ─────────────────────────────────────────────────────────────────────────
  // State: Collapse persistence
  // ─────────────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
    } catch {
      // Ignore localStorage errors
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Values
  // ─────────────────────────────────────────────────────────────────────────
  const { components, totalMultiple, totalValue } = useMemo(() => {
    const comps = deriveReturnComponents(mainAnalysisResults, cashFlows);
    const total = mainAnalysisResults.multiple || 0;
    const value = mainAnalysisResults.totalReturns || 0;
    return { components: comps, totalMultiple: total, totalValue: value };
  }, [mainAnalysisResults, cashFlows]);

  // Don't render if no investment
  if (mainAnalysisResults.totalInvestment <= 0) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Collapsed Bar (summary view)
  // ─────────────────────────────────────────────────────────────────────────
  const CollapsedBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      gap: '1.5rem',
      flexWrap: 'wrap'
    }}>
      {/* Title */}
      <div style={{
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'var(--hdc-faded-jade)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap'
      }}>
        Returns Buildup
      </div>

      {/* Summary KPIs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flex: 1,
        justifyContent: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Total */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          whiteSpace: 'nowrap'
        }}>
          <span className="returns-label" style={{ fontSize: '0.8rem' }}>Total</span>
          <span className="returns-value" style={{ fontWeight: 600 }}>
            {formatMillionsAsCurrency(totalValue)}
          </span>
          <span className="returns-label">/</span>
          <span style={{ fontWeight: 600, color: 'var(--hdc-faded-jade)' }}>
            {formatMultiple(totalMultiple)}
          </span>
        </div>

        {/* Component count */}
        <div
          className="returns-label"
          style={{
            fontSize: '0.8rem',
            whiteSpace: 'nowrap'
          }}
        >
          {components.length} component{components.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Expanded View (full detail)
  // ─────────────────────────────────────────────────────────────────────────
  const ExpandedView = () => (
    <div style={{ padding: '1rem' }}>
      {/* Column headers */}
      <div
        className="returns-column-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0 0 0.5rem 0',
          marginBottom: '0.25rem',
        }}
      >
        <div style={{ width: '4px', flexShrink: 0 }} />
        <div className="returns-label" style={{ flex: 1, fontSize: '0.7rem', textTransform: 'uppercase', minWidth: '140px' }}>
          Component
        </div>
        <div className="returns-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'right', minWidth: '80px' }}>
          Value
        </div>
        <div className="returns-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'right', minWidth: '50px' }}>
          Multiple
        </div>
        <div className="returns-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'right', minWidth: '50px' }}>
          % Total
        </div>
      </div>

      {/* Component rows */}
      <div>
        {components.map((component) => (
          <ComponentRow
            key={component.label}
            component={component}
            totalValue={totalValue}
          />
        ))}
      </div>

      {/* Total row */}
      <div
        className="returns-total-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 0 0.25rem',
          marginTop: '0.5rem',
        }}
      >
        {/* Color indicator - gradient of all colors */}
        <div style={{
          width: '4px',
          height: '24px',
          background: 'linear-gradient(180deg, var(--hdc-faded-jade), var(--hdc-sushi), var(--hdc-spectra))',
          borderRadius: '2px',
          flexShrink: 0,
        }} />

        {/* Label */}
        <div
          className="returns-value"
          style={{
            flex: 1,
            fontSize: '0.9rem',
            fontWeight: 700,
            minWidth: '140px',
          }}
        >
          Total Returns
        </div>

        {/* Value */}
        <div
          className="returns-value"
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            textAlign: 'right',
            minWidth: '80px',
          }}
        >
          {formatMillionsAsCurrency(totalValue)}
        </div>

        {/* Multiple */}
        <div style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--hdc-faded-jade)',
          textAlign: 'right',
          minWidth: '50px',
        }}>
          {formatMultiple(totalMultiple)}
        </div>

        {/* 100% */}
        <div style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--hdc-faded-jade)',
          textAlign: 'right',
          minWidth: '50px',
        }}>
          100%
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  // IMPL-036b: Solid background styling (sticky now handled by parent container in HDCResultsComponent)
  // IMPL-026a: Added CSS class for dark mode compatibility
  return (
    <div
      className="returns-buildup-container"
      style={{
        border: '1px solid var(--hdc-gulf-stream)',
        borderRadius: '8px',
        marginBottom: '0.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header with collapse trigger */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: isOpen ? '1px solid var(--hdc-gulf-stream)' : 'none'
        }}>
          {/* Collapsed bar content */}
          <div style={{ flex: 1 }}>
            <CollapsedBar />
          </div>

          {/* Collapse toggle button */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--hdc-faded-jade)',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {isOpen ? (
                <>
                  <span>Collapse</span>
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  <span>Expand</span>
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Expandable content */}
        <CollapsibleContent>
          <ExpandedView />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ReturnsBuiltupStrip;
