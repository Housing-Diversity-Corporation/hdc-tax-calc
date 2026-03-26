/**
 * IMPL-026: KPI Strip Component (v1.2)
 * IMPL-026a: Bug fix - proper formatting for values in millions
 * IMPL-026b: Bug fix - break-even year calculation (compare to investorEquity, not zero)
 *
 * A cleaner, investor-focused KPI strip replacing the Deal Validation strip.
 * Shows 12 key metrics in a 3-row layout with label above value.
 *
 * Layout:
 * Row 1: Investor Equity | State LIHTC | Total Sources | Leverage | DSCR
 * Row 2: Total Multiple | IRR | Year 1 Tax Savings | Break-even Year
 * Row 3: Tax Benefit Multiple | Performance Multiple | Tax Benefit %
 *
 * Features:
 * - Sticky position (handled by parent container)
 * - Collapsible with smooth animation
 * - Persists open/closed state in localStorage
 * - Dark mode support via CSS variables
 * - Vertically compact styling
 *
 * IMPORTANT: All monetary values passed to this component are in MILLIONS.
 * We convert to dollars (multiply by 1,000,000) before formatting.
 *
 * @version 1.2.0
 * @date 2026-01-06
 * @task IMPL-026, IMPL-026a, IMPL-026b
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { InvestorAnalysisResults, CashFlowItem, StateLIHTCIntegrationResult } from '../../../types/taxbenefits';
import {
  formatMultiple,
  formatIRR,
  formatAbbreviatedCurrency,
  formatPercent
} from '../../../utils/taxbenefits/formatters';

// ============================================================================
// TYPES
// ============================================================================

interface KPIStripProps {
  /** Investor analysis results from calculation engine */
  mainAnalysisResults: InvestorAnalysisResults;
  /** Per-year cash flow data */
  cashFlows: CashFlowItem[];
  /** Investor equity amount (in millions) */
  investorEquity: number;
  /** Total project cost (in millions) */
  totalProjectCost: number;
  /** State LIHTC integration result */
  stateLIHTCIntegration?: StateLIHTCIntegrationResult | null;
  /** IMPL-135: Deal/configuration name for header display */
  dealName?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'kpiStrip.isOpen';
const DSCR_PASS_THRESHOLD = 1.25;
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate break-even year from cash flows
 * Returns the first year where cumulative returns >= initial investment (equity recovered)
 *
 * CRITICAL: Break-even means the investor has recovered their entire investment.
 * We compare cumulativeReturns (running total of cash received) against investorEquity.
 * The previous check (cumulativeReturns > 0) was wrong because cash flows start positive from Year 1.
 */
function calculateBreakEvenYear(cashFlows: CashFlowItem[], investorEquity: number): number | null {
  for (const cf of cashFlows) {
    if (cf.cumulativeReturns >= investorEquity) {
      return cf.year;
    }
  }
  return null;
}

/**
 * ISS-054: Find the stabilized year (first year after lease-up period)
 * Lenders underwrite to stabilized NOI, not lease-up performance.
 * Lease-up shortfall is a timing issue covered by interest reserve, not a credit issue.
 *
 * Returns the first year where:
 * 1. effectiveOccupancy is >= 0.99 (stabilized)
 * 2. OR effectiveOccupancy is undefined (not in lease-up mode)
 * 3. Falls back to Year 2 if no clear stabilized year found
 */
function findStabilizedYear(cashFlows: CashFlowItem[]): CashFlowItem | null {
  // First, try to find a year where occupancy is stabilized (>= 99%)
  const stabilizedYear = cashFlows.find(cf => {
    // If effectiveOccupancy is undefined or >= 0.99, this year is stabilized
    if (cf.effectiveOccupancy === undefined || cf.effectiveOccupancy >= 0.99) {
      return true;
    }
    return false;
  });

  if (stabilizedYear) return stabilizedYear;

  // Fall back to Year 2 (after any partial-year effects)
  const year2 = cashFlows.find(cf => cf.year === 2);
  if (year2) return year2;

  // Last resort: return first year with valid DSCR
  return cashFlows.find(cf =>
    cf.operationalDSCR != null && cf.operationalDSCR > 0 && isFinite(cf.operationalDSCR)
  ) || null;
}

/**
 * ISS-054: Calculate stabilized DSCR from cash flows
 * Uses the first year after interest reserve period (stabilized operations)
 * per standard lender underwriting practice.
 */
function calculateStabilizedDSCR(cashFlows: CashFlowItem[]): number {
  const stabilizedYear = findStabilizedYear(cashFlows);
  if (!stabilizedYear) return 0;

  const dscr = stabilizedYear.operationalDSCR;
  return (dscr != null && dscr > 0 && isFinite(dscr)) ? dscr : 0;
}

/**
 * ISS-054: Calculate stabilized Must-Pay DSCR (IMPL-081: Senior + PAB only - true hard floor)
 * Uses stabilized year per lender underwriting standards.
 */
function calculateStabilizedMustPayDSCR(cashFlows: CashFlowItem[]): number {
  const stabilizedYear = findStabilizedYear(cashFlows);
  if (!stabilizedYear) return 0;

  const dscr = stabilizedYear.mustPayDSCR;
  return (dscr != null && dscr > 0 && isFinite(dscr)) ? dscr : 0;
}

/**
 * ISS-054: Calculate stabilized Phil DSCR (IMPL-081: Senior + PAB + Phil current pay - Amazon 1.05x)
 * Uses stabilized year per lender underwriting standards.
 */
function calculateStabilizedPhilDSCR(cashFlows: CashFlowItem[]): number {
  const stabilizedYear = findStabilizedYear(cashFlows);
  if (!stabilizedYear) return 0;

  const dscr = stabilizedYear.philDSCR;
  return (dscr != null && dscr > 0 && isFinite(dscr)) ? dscr : 0;
}

/**
 * Calculate tax benefit multiple (depreciation + LIHTC benefits / investment)
 */
function calculateTaxBenefitMultiple(
  results: InvestorAnalysisResults,
  cashFlows: CashFlowItem[]
): number {
  const totalInvestment = results.totalInvestment || 1;

  // Sum depreciation tax benefits
  const depreciationBenefits = results.investorTaxBenefits || 0;

  // Sum Federal LIHTC from cash flows
  const federalLIHTCTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.federalLIHTCCredit || 0),
    0
  );

  // Sum State LIHTC from cash flows (direct use path)
  const stateLIHTCTotal = cashFlows.reduce(
    (sum, cf) => sum + (cf.stateLIHTCCredit || 0),
    0
  );

  // OZ Benefits (tax-related)
  const ozBenefits = (results.ozRecaptureAvoided || 0) +
                     (results.ozDeferralNPV || 0) +
                     (results.ozExitAppreciation || 0);

  const totalTaxBenefits = depreciationBenefits + federalLIHTCTotal + stateLIHTCTotal + ozBenefits;

  return totalTaxBenefits / totalInvestment;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface KPIItemProps {
  label: string;
  value: string;
  status?: 'pass' | 'neutral';
  valueColor?: string;
}

/**
 * Individual KPI item with label above value
 * Uses theme-aware colors for dark mode compatibility
 */
const KPIItem: React.FC<KPIItemProps> = ({ label, value, status, valueColor }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: '100px',
    padding: '0.25rem 0.5rem',
  }}>
    <div
      className="kpi-label"
      style={{
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        marginBottom: '0.125rem',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
    <div
      className="kpi-value"
      style={{
        fontSize: '0.95rem',
        fontWeight: 600,
        color: valueColor,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
      {status === 'pass' && (
        <span style={{ color: 'var(--hdc-sushi)', fontSize: '0.85rem' }}>✓</span>
      )}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const KPIStrip: React.FC<KPIStripProps> = ({
  mainAnalysisResults,
  cashFlows,
  investorEquity,
  dealName,
  totalProjectCost,
  stateLIHTCIntegration
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
  const kpis = useMemo(() => {
    // Row 1 KPIs
    const stateLIHTCProceeds = stateLIHTCIntegration?.netProceeds || 0;
    const leverage = totalProjectCost > 0
      ? ((totalProjectCost - investorEquity) / totalProjectCost) * 100
      : 0;
    // ISS-054: Use stabilized DSCR (first year after lease-up) per lender underwriting standards
    // Lease-up shortfall is covered by interest reserve, not a credit issue
    const stabilizedDSCR = calculateStabilizedDSCR(cashFlows);
    const dscrPass = stabilizedDSCR >= DSCR_PASS_THRESHOLD;
    // IMPL-081: DSCR Breakdown (also using stabilized values)
    const stabilizedMustPayDSCR = calculateStabilizedMustPayDSCR(cashFlows);
    const stabilizedPhilDSCR = calculateStabilizedPhilDSCR(cashFlows);
    const philDscrPass = stabilizedPhilDSCR >= 1.05; // Amazon HEF requirement

    // Row 2 KPIs
    const totalMultiple = mainAnalysisResults.multiple || 0;
    const irr = mainAnalysisResults.irr || 0;
    const year1TaxSavings = cashFlows[0]?.taxBenefit || 0;
    const breakEvenYear = mainAnalysisResults.breakEvenYear || calculateBreakEvenYear(cashFlows, investorEquity);

    // Row 3 KPIs
    const taxBenefitMultiple = calculateTaxBenefitMultiple(mainAnalysisResults, cashFlows);
    const performanceMultiple = totalMultiple - taxBenefitMultiple;
    const taxBenefitPct = totalMultiple > 0
      ? (taxBenefitMultiple / totalMultiple) * 100
      : 0;

    return {
      // Row 1
      investorEquity,
      stateLIHTCProceeds,
      totalProjectCost,
      leverage,
      stabilizedDSCR,
      dscrPass,
      // IMPL-081: DSCR Breakdown (ISS-054: using stabilized values)
      stabilizedMustPayDSCR,
      stabilizedPhilDSCR,
      philDscrPass,
      // Row 2
      totalMultiple,
      irr,
      year1TaxSavings,
      breakEvenYear,
      // Row 3
      taxBenefitMultiple,
      performanceMultiple,
      taxBenefitPct,
    };
  }, [mainAnalysisResults, cashFlows, investorEquity, totalProjectCost, stateLIHTCIntegration]);

  // ─────────────────────────────────────────────────────────────────────────
  // Row styles
  // ─────────────────────────────────────────────────────────────────────────
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    padding: '0.375rem 0.5rem',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Collapsed Bar
  // ─────────────────────────────────────────────────────────────────────────
  const CollapsedBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Title */}
      <div style={{
        fontWeight: 700,
        fontSize: '0.8rem',
        color: 'var(--hdc-faded-jade)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap'
      }}>
        Investor KPIs
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
        gap: '1.25rem',
        flex: 1,
        justifyContent: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Multiple / IRR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          whiteSpace: 'nowrap'
        }}>
          <span className="kpi-value" style={{ fontWeight: 600 }}>
            {formatMultiple(kpis.totalMultiple)}
          </span>
          <span className="kpi-label">/</span>
          <span className="kpi-value" style={{ fontWeight: 600 }}>
            {formatIRR(kpis.irr)}
          </span>
        </div>

        {/* DSCR Breakdown (IMPL-081) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          whiteSpace: 'nowrap'
        }}>
          <span className="kpi-label" style={{ fontSize: '0.75rem' }}>DSCR</span>
          <span style={{
            fontWeight: 600,
            color: kpis.stabilizedMustPayDSCR >= 1.25 ? 'var(--hdc-sushi)' : 'var(--hdc-brown-rust)'
          }}>
            {formatMultiple(kpis.stabilizedMustPayDSCR)}
          </span>
          <span className="kpi-label" style={{ fontSize: '0.7rem' }}>/</span>
          <span style={{
            fontWeight: 600,
            color: kpis.philDscrPass ? 'var(--hdc-sushi)' : 'var(--hdc-brown-rust)'
          }}>
            {formatMultiple(kpis.stabilizedPhilDSCR)}
          </span>
          {kpis.stabilizedMustPayDSCR >= 1.25 && kpis.philDscrPass && (
            <span style={{ color: 'var(--hdc-sushi)', fontSize: '0.85rem' }}>✓</span>
          )}
        </div>

        {/* Leverage */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          whiteSpace: 'nowrap'
        }}>
          <span className="kpi-label" style={{ fontSize: '0.75rem' }}>Leverage</span>
          <span className="kpi-value" style={{ fontWeight: 600 }}>
            {formatPercent(kpis.leverage, 0)}
          </span>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Expanded View
  // ─────────────────────────────────────────────────────────────────────────
  // IMPL-093: Investor profile label for badge
  const investorProfileLabel = mainAnalysisResults.investorProfileLabel;
  const showProfileBadge = investorProfileLabel && investorProfileLabel !== 'Federal Only';

  const ExpandedView = () => (
    <div style={{ padding: '0.25rem 0.5rem 0.5rem' }}>
      {/* IMPL-093: Investor Profile Badge */}
      {showProfileBadge && (
        <div style={{ marginBottom: '0.25rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.15rem 0.5rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            color: 'var(--hdc-faded-jade)',
            backgroundColor: 'rgba(76, 145, 131, 0.1)',
            border: '1px solid rgba(76, 145, 131, 0.25)',
            borderRadius: '4px',
          }}>
            {investorProfileLabel}
          </span>
        </div>
      )}
      {/* Row 1: Investor Equity, State LIHTC, Total Sources, Leverage, DSCR */}
      <div style={rowStyle}>
        <KPIItem
          label="Investor Equity"
          value={formatMillionsAsCurrency(kpis.investorEquity)}
        />
        <KPIItem
          label="State LIHTC"
          value={formatMillionsAsCurrency(kpis.stateLIHTCProceeds)}
        />
        <KPIItem
          label="Total Sources"
          value={formatMillionsAsCurrency(kpis.totalProjectCost)}
        />
        <KPIItem
          label="Leverage"
          value={formatPercent(kpis.leverage, 0)}
        />
        <KPIItem
          label="Must-Pay DSCR"
          value={formatMultiple(kpis.stabilizedMustPayDSCR)}
          status={kpis.stabilizedMustPayDSCR >= 1.25 ? 'pass' : 'neutral'}
          valueColor={kpis.stabilizedMustPayDSCR >= 1.25 ? 'var(--hdc-sushi)' : 'var(--hdc-brown-rust)'}
        />
        <KPIItem
          label="Phil DSCR"
          value={formatMultiple(kpis.stabilizedPhilDSCR)}
          status={kpis.philDscrPass ? 'pass' : 'neutral'}
          valueColor={kpis.philDscrPass ? 'var(--hdc-sushi)' : 'var(--hdc-brown-rust)'}
        />
      </div>

      {/* Row 2: Total Multiple, IRR, Year 1 Tax Savings, Break-even Year */}
      <div style={rowStyle}>
        <KPIItem
          label="Total Multiple"
          value={formatMultiple(kpis.totalMultiple)}
        />
        <KPIItem
          label="IRR"
          value={formatIRR(kpis.irr)}
        />
        <KPIItem
          label="Year 1 Tax Savings"
          value={formatMillionsAsCurrency(kpis.year1TaxSavings)}
          valueColor="var(--hdc-sushi)"
        />
        <KPIItem
          label="Break-even Year"
          value={kpis.breakEvenYear ? `Year ${kpis.breakEvenYear}` : 'N/A'}
        />
      </div>

      {/* Row 3: Tax Benefit Multiple, Performance Multiple, Tax Benefit % */}
      <div style={rowStyle}>
        <KPIItem
          label="Tax Benefit Multiple"
          value={formatMultiple(kpis.taxBenefitMultiple)}
        />
        <KPIItem
          label="Performance Multiple"
          value={formatMultiple(kpis.performanceMultiple)}
        />
        <KPIItem
          label="Tax Benefit %"
          value={formatPercent(kpis.taxBenefitPct, 0)}
        />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="kpi-strip-container"
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

export default KPIStrip;
