/**
 * IMPL-028: Returns Buildup Strip
 * IMPL-031: OZ Benefits Display Fix
 * IMPL-036: Reorder, sticky, collapsible styling
 * IMPL-026a: Dark mode compatibility and 2 decimal currency formatting
 * IMPL-048b: Fix component sum validation and include missing components
 * IMPL-057: Include OZ Step-Up Savings in OZ Benefits (fixes version toggle display)
 * IMPL-060: OZ Benefits collapsible dropdown with component breakdown
 * IMPL-061: Depreciation Benefits collapsible dropdown with 3-line breakdown
 * IMPL-073: State LIHTC Syndication as Capital Return (separate line from direct credits)
 * ISS-018: Federal/State LIHTC catch-up allocation display (Years 1-10 vs Year 11)
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
 * - IMPL-057: OZ Benefits now includes step-up savings (varies with OZ version)
 * - IMPL-060: OZ Benefits row expands to show individual component breakdown
 * - IMPL-061: Depreciation Benefits row expands to show Year 1 Bonus, Year 1 MACRS, Years 2-Exit
 * - ISS-018: Federal/State LIHTC rows expand to show Years 1-10 vs Year 11 catch-up breakdown
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
 * @version 1.8.0
 * @date 2026-02-01
 * @task IMPL-028, IMPL-031, IMPL-036, IMPL-026a, IMPL-048b, IMPL-057, IMPL-060, IMPL-061, ISS-018
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
  /** IMPL-135: Deal/configuration name for header display */
  dealName?: string;
}

/** IMPL-060/061/092: Sub-component for dropdown breakdown (OZ Benefits, Depreciation) */
interface SubComponent {
  label: string;
  value: number;
  multiple: number;
  /** When true, render a thin separator line above this sub-row */
  dividerBefore?: boolean;
  /** IMPL-162: When true, render with muted/italic style (non-additive informational row) */
  informational?: boolean;
}

interface ReturnComponent {
  label: string;
  value: number;
  multiple: number;
  color: string;
  category: 'tax' | 'cash' | 'exit' | 'fees';
  /** IMPL-060/061: Expandable sub-components for OZ Benefits and Depreciation */
  subComponents?: SubComponent[];
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
  // ISS-016: Split catch-up between federal and state (remainingLIHTCCredits includes both)
  const remainingStateLIHTCCredits = results.remainingStateLIHTCCredits || 0;
  const remainingFederalLIHTCCredits = (results.remainingLIHTCCredits || 0) - remainingStateLIHTCCredits;
  const federalLIHTCTotal = federalLIHTCFromCashFlows + remainingFederalLIHTCCredits;

  // Sum State LIHTC from cash flows
  const stateLIHTCFromCashFlows = cashFlows.reduce(
    (sum, cf) => sum + (cf.stateLIHTCCredit || 0),
    0
  );
  // ISS-016: Include state catch-up credits in state LIHTC total
  const stateLIHTCTotal = stateLIHTCFromCashFlows + remainingStateLIHTCCredits;

  // IMPL-073: Sum State LIHTC Syndication Proceeds from cash flows (capital return)
  const syndicationProceedsTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.stateLIHTCSyndicationProceeds || 0),
    0
  );

  // Depreciation = investorTaxBenefits (already separate from LIHTC)
  const depreciationTotal = results.investorTaxBenefits || 0;

  // ISS-052: Excess reserve distribution shown separately (not included in operating cash)
  // This ensures Operating Cash Flow matches Waterfall "After AUM" total
  const excessReserveTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.excessReserveDistribution || 0),
    0
  );

  // ISS-047c FIX: Compute operating cash flow directly from cashFlows array
  // ISS-052: Do NOT add excess reserve here - it's shown as separate line item
  const operatingCashFromFlows = cashFlows.reduce(
    (sum, cf) => sum + (cf.operatingCashFlow || 0),
    0
  );
  const operatingCashTotal = operatingCashFromFlows; // ISS-052: No excess reserve addition

  // Exit proceeds (already net of deferred fees)
  const exitProceedsTotal = results.exitProceeds || 0;

  // Investor sub-debt at exit (principal + accrued interest returned)
  const investorSubDebtAtExitTotal = results.investorSubDebtAtExit || 0;

  // Sub-debt interest received during hold period
  const subDebtInterestReceivedTotal = results.investorSubDebtInterestReceived || 0;

  // IMPL-031: OZ Benefits (for 10+ year holds)
  // IMPL-057: Include step-up savings (varies with OZ version: 10% standard / 30% rural in OZ 2.0)
  const ozRecaptureAvoided = results.ozRecaptureAvoided || 0;
  const ozDeferralNPV = results.ozDeferralNPV || 0;
  const ozExitAppreciation = results.ozExitAppreciation || 0;
  const ozStepUpSavings = results.ozStepUpSavings || 0;
  const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation + ozStepUpSavings;

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
  // ISS-018: Federal LIHTC with sub-components for Years 1-10 vs Year 11 catch-up
  if (federalLIHTCTotal > 0) {
    const federalLIHTCSubComponents: SubComponent[] = [];

    // Only show breakdown if there's a catch-up (otherwise just one value)
    if (remainingFederalLIHTCCredits > 0 && federalLIHTCFromCashFlows > 0) {
      federalLIHTCSubComponents.push({
        label: 'Years 1-10 Credits',
        value: federalLIHTCFromCashFlows,
        multiple: federalLIHTCFromCashFlows / totalInvestment,
      });
      federalLIHTCSubComponents.push({
        label: 'Year 11 Catch-Up',
        value: remainingFederalLIHTCCredits,
        multiple: remainingFederalLIHTCCredits / totalInvestment,
      });
    }

    components.push({
      label: 'Federal LIHTC',
      value: federalLIHTCTotal,
      multiple: federalLIHTCTotal / totalInvestment,
      color: COMPONENT_COLORS.federalLIHTC,
      category: 'tax',
      subComponents: federalLIHTCSubComponents.length > 0 ? federalLIHTCSubComponents : undefined,
    });
  }

  // IMPL-045: State LIHTC Credits (direct use path only)
  // ISS-018: Add sub-components for Years 1-10 vs Year 11 catch-up
  if (stateLIHTCTotal > 0) {
    const stateLIHTCSubComponents: SubComponent[] = [];

    // Only show breakdown if there's a catch-up (otherwise just one value)
    if (remainingStateLIHTCCredits > 0 && stateLIHTCFromCashFlows > 0) {
      stateLIHTCSubComponents.push({
        label: 'Years 1-10 Credits',
        value: stateLIHTCFromCashFlows,
        multiple: stateLIHTCFromCashFlows / totalInvestment,
      });
      stateLIHTCSubComponents.push({
        label: 'Year 11 Catch-Up',
        value: remainingStateLIHTCCredits,
        multiple: remainingStateLIHTCCredits / totalInvestment,
      });
    }

    components.push({
      label: 'State LIHTC Credits',
      value: stateLIHTCTotal,
      multiple: stateLIHTCTotal / totalInvestment,
      color: COMPONENT_COLORS.stateLIHTC,
      category: 'tax',
      subComponents: stateLIHTCSubComponents.length > 0 ? stateLIHTCSubComponents : undefined,
    });
  }

  // IMPL-073: State LIHTC Syndication Proceeds (out-of-state investors = capital return)
  // This is actual cash received from selling syndicated credits, shown as 'cash' category
  if (syndicationProceedsTotal > 0) {
    components.push({
      label: 'State LIHTC Syndication',
      value: syndicationProceedsTotal,
      multiple: syndicationProceedsTotal / totalInvestment,
      color: COMPONENT_COLORS.stateLIHTC, // Same gold color as State LIHTC
      category: 'cash', // This is a cash return, not a tax benefit
    });
  }

  // IMPL-139: Net Depreciation Benefit (merges depreciation + exit tax into one row)
  // When exitTax.netExitTax > 0 (non-OZ or OZ < 10yr): show "Net Depreciation Benefit"
  // When netExitTax = 0 (OZ 10+ year hold): keep existing "Depreciation Benefits" unchanged
  const exitTax = results.exitTaxAnalysis;
  const hasExitTax = exitTax && exitTax.netExitTax > 0;

  if (depreciationTotal > 0 && hasExitTax) {
    // IMPL-139: Merged "Net Depreciation Benefit" row
    const netDepreciationValue = depreciationTotal - exitTax.netExitTax;
    const netDepSubComponents: SubComponent[] = [];

    // Sub 1: Gross Benefit
    netDepSubComponents.push({
      label: 'Gross Benefit (at 37%)',
      value: depreciationTotal,
      multiple: depreciationTotal / totalInvestment,
      dividerBefore: false,
    });

    // Sub 2: Exit Tax Cost (with divider)
    netDepSubComponents.push({
      label: 'Exit Tax Cost',
      value: -exitTax.netExitTax,
      multiple: -exitTax.netExitTax / totalInvestment,
      dividerBefore: true,
    });

    // Sub 3-6: Exit tax breakdown (indented via label prefix, only if > 0)
    if (exitTax.sec1245Tax > 0) {
      netDepSubComponents.push({
        label: `  §1245 Recapture @ ${(exitTax.sec1245Rate * 100).toFixed(0)}%`,
        value: -exitTax.sec1245Tax,
        multiple: -exitTax.sec1245Tax / totalInvestment,
      });
    }
    if (exitTax.sec1250Tax > 0) {
      netDepSubComponents.push({
        label: `  §1250 Gain @ ${(exitTax.sec1250Rate * 100).toFixed(0)}%`,
        value: -exitTax.sec1250Tax,
        multiple: -exitTax.sec1250Tax / totalInvestment,
      });
    }
    if (exitTax.niitTax > 0) {
      netDepSubComponents.push({
        label: '  NIIT (3.8%)',
        value: -exitTax.niitTax,
        multiple: -exitTax.niitTax / totalInvestment,
      });
    }
    if (exitTax.stateExitTax > 0) {
      netDepSubComponents.push({
        label: '  State Exit Tax',
        value: -exitTax.stateExitTax,
        multiple: -exitTax.stateExitTax / totalInvestment,
      });
    }

    components.push({
      label: 'Net Depreciation Benefit',
      value: netDepreciationValue,
      multiple: netDepreciationValue / totalInvestment,
      color: COMPONENT_COLORS.depreciation,
      category: 'tax',
      subComponents: netDepSubComponents,
    });
  } else if (depreciationTotal > 0) {
    // OZ 10+ year hold path: keep existing "Depreciation Benefits" unchanged
    const depreciationSubComponents: SubComponent[] = [];
    const federalTotal = results.federalDepreciationBenefitTotal || 0;
    const stateTotal = results.stateDepreciationBenefitTotal || 0;

    if (stateTotal > 0) {
      if (federalTotal > 0) {
        depreciationSubComponents.push({
          label: 'Federal Depreciation',
          value: federalTotal,
          multiple: federalTotal / totalInvestment,
        });
      }
      const stateCode = results.investorProfileLabel?.split(' ')[0] || '';
      depreciationSubComponents.push({
        label: stateCode ? `State Depreciation (${stateCode})` : 'State Depreciation',
        value: stateTotal,
        multiple: stateTotal / totalInvestment,
      });
    }

    const year1Bonus = results.year1BonusTaxBenefit || 0;
    const year1Macrs = results.year1MacrsTaxBenefit || 0;
    const years2Exit = results.years2ExitMacrsTaxBenefit || 0;
    const needsDivider = stateTotal > 0;

    if (year1Bonus > 0) {
      depreciationSubComponents.push({
        label: 'Year 1 Bonus Depreciation',
        value: year1Bonus,
        multiple: year1Bonus / totalInvestment,
        dividerBefore: needsDivider,
      });
    }
    if (year1Macrs > 0) {
      depreciationSubComponents.push({
        label: 'Year 1 MACRS Depreciation',
        value: year1Macrs,
        multiple: year1Macrs / totalInvestment,
        dividerBefore: needsDivider && year1Bonus === 0,
      });
    }
    if (years2Exit > 0) {
      depreciationSubComponents.push({
        label: 'Years 2-Exit MACRS',
        value: years2Exit,
        multiple: years2Exit / totalInvestment,
        dividerBefore: needsDivider && year1Bonus === 0 && year1Macrs === 0,
      });
    }

    components.push({
      label: 'Depreciation Benefits',
      value: depreciationTotal,
      multiple: depreciationTotal / totalInvestment,
      color: COMPONENT_COLORS.depreciation,
      category: 'tax',
      subComponents: depreciationSubComponents.length > 0 ? depreciationSubComponents : undefined,
    });
  }

  // IMPL-031: OZ Benefits (tax-related)
  // IMPL-060: Add sub-components for dropdown breakdown
  // IMPL-099: Update recapture avoidance to use character-split values from exitTaxAnalysis
  if (totalOzBenefits > 0) {
    const ozSubComponents: SubComponent[] = [];

    if (ozStepUpSavings > 0) {
      ozSubComponents.push({
        label: 'Step-Up Basis Savings',
        value: ozStepUpSavings,
        multiple: ozStepUpSavings / totalInvestment,
      });
    }
    if (ozExitAppreciation > 0) {
      ozSubComponents.push({
        label: 'Exclusion of Appreciation',
        value: ozExitAppreciation,
        multiple: ozExitAppreciation / totalInvestment,
      });
    }
    if (ozDeferralNPV > 0) {
      ozSubComponents.push({
        label: 'Deferral NPV',
        value: ozDeferralNPV,
        multiple: ozDeferralNPV / totalInvestment,
      });
    }
    // IMPL-162: Recapture Avoided is non-additive — already embedded in Exit Proceeds (net).
    // OZ exclusion eliminates recapture tax; this line is informational context only.
    if (ozRecaptureAvoided > 0) {
      ozSubComponents.push({
        label: 'Recapture Avoided (in exit proceeds)',
        value: ozRecaptureAvoided,
        multiple: ozRecaptureAvoided / totalInvestment,
        informational: true,
      });
    }

    components.push({
      label: 'OZ Benefits',
      value: totalOzBenefits,
      multiple: totalOzBenefits / totalInvestment,
      color: COMPONENT_COLORS.ozBenefits,
      category: 'tax',
      subComponents: ozSubComponents.length > 0 ? ozSubComponents : undefined,
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

  // ISS-052: Excess reserve distribution shown separately (one-time distribution of unused interest reserve)
  if (excessReserveTotal > 0) {
    components.push({
      label: 'Excess Reserve',
      value: excessReserveTotal,
      multiple: excessReserveTotal / totalInvestment,
      color: COMPONENT_COLORS.operatingCash, // Same color family as operating cash
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
 * IMPL-060: OZ Benefits sub-row component
 * Indented row for individual OZ benefit components
 */
const SubRow: React.FC<{
  subComponent: SubComponent;
  totalValue: number;
  parentColor: string;
}> = ({ subComponent, totalValue, parentColor }) => {
  const percentOfTotal = totalValue > 0
    ? (subComponent.value / totalValue) * 100
    : 0;
  // IMPL-162: Muted/italic style for informational (non-additive) rows
  const isInfo = subComponent.informational;

  return (
    <>
    {subComponent.dividerBefore && (
      <div style={{
        margin: '0.2rem 1.5rem',
        borderTop: '1px solid rgba(139, 92, 246, 0.15)',
      }} />
    )}
    <div
      className="returns-component-row oz-sub-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.35rem 0 0.35rem 1.5rem', // Indented
        backgroundColor: 'rgba(139, 92, 246, 0.05)', // Subtle purple background
      }}
    >
      {/* Indent spacer + smaller color indicator */}
      <div style={{
        width: '3px',
        height: '18px',
        backgroundColor: parentColor,
        borderRadius: '2px',
        flexShrink: 0,
        opacity: isInfo ? 0.3 : 0.6,
      }} />

      {/* Label */}
      <div
        className="returns-value"
        style={{
          flex: 1,
          fontSize: '0.8rem',
          minWidth: '140px',
          opacity: isInfo ? 0.55 : 0.9,
          fontStyle: isInfo ? 'italic' : 'normal',
        }}
      >
        {subComponent.label}
      </div>

      {/* Value */}
      <div
        className="returns-value"
        style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          textAlign: 'right',
          minWidth: '80px',
          opacity: isInfo ? 0.55 : 1,
          fontStyle: isInfo ? 'italic' : 'normal',
        }}
      >
        {formatMillionsAsCurrency(subComponent.value)}
      </div>

      {/* Multiple contribution */}
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 500,
        color: parentColor,
        textAlign: 'right',
        minWidth: '50px',
        opacity: isInfo ? 0.4 : 0.9,
        fontStyle: isInfo ? 'italic' : 'normal',
      }}>
        {subComponent.multiple.toFixed(2)}x
      </div>

      {/* Percentage of total */}
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 500,
        color: parentColor,
        textAlign: 'right',
        minWidth: '50px',
        opacity: isInfo ? 0.4 : 0.9,
        fontStyle: isInfo ? 'italic' : 'normal',
      }}>
        {percentOfTotal.toFixed(1)}%
      </div>
    </div>
    </>
  );
};

/**
 * Individual component row with value, multiple, and percentage of total
 * Uses CSS classes for dark mode compatibility
 * IMPL-060: Enhanced to support expandable OZ Benefits with sub-components
 */
const ComponentRow: React.FC<ComponentRowProps> = ({
  component,
  totalValue
}) => {
  // IMPL-060: Track expansion state for OZ Benefits
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubComponents = component.subComponents && component.subComponents.length > 0;

  // Calculate this component's percentage of total returns
  const percentOfTotal = totalValue > 0
    ? (component.value / totalValue) * 100
    : 0;

  return (
    <>
      <div
        className="returns-component-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.5rem 0',
          cursor: hasSubComponents ? 'pointer' : 'default',
        }}
        onClick={hasSubComponents ? () => setIsExpanded(!isExpanded) : undefined}
        role={hasSubComponents ? 'button' : undefined}
        tabIndex={hasSubComponents ? 0 : undefined}
        onKeyDown={hasSubComponents ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        } : undefined}
      >
        {/* Color indicator */}
        <div style={{
          width: '4px',
          height: '24px',
          backgroundColor: component.color,
          borderRadius: '2px',
          flexShrink: 0,
        }} />

        {/* Label with optional expand/collapse indicator */}
        <div
          className="returns-value"
          style={{
            flex: 1,
            fontSize: '0.85rem',
            minWidth: '140px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {hasSubComponents && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: component.color,
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>
              <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
            </span>
          )}
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

      {/* IMPL-060: Expandable sub-rows for OZ Benefits */}
      {hasSubComponents && isExpanded && (
        <div className="oz-sub-components">
          {component.subComponents!.map((sub) => (
            <SubRow
              key={sub.label}
              subComponent={sub}
              totalValue={totalValue}
              parentColor={component.color}
            />
          ))}
        </div>
      )}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReturnsBuiltupStrip: React.FC<ReturnsBuiltupStripProps> = ({
  mainAnalysisResults,
  cashFlows,
  dealName
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
  // ISS-047c: Compute directly from props (useMemo removed after debugging)
  const components = deriveReturnComponents(mainAnalysisResults, cashFlows);
  const totalMultiple = mainAnalysisResults.multiple || 0;
  const totalValue = mainAnalysisResults.totalReturns || 0;

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
        {dealName && (
          <span style={{
            fontWeight: 500,
            fontSize: '0.7rem',
            color: 'var(--hdc-viridian-green)',
            textTransform: 'none',
            letterSpacing: 'normal',
            marginLeft: '0.5rem'
          }}>
            {dealName}
          </span>
        )}
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
