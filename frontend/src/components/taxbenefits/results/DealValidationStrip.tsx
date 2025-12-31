/**
 * IMPL-025: Deal Validation Strip (Conductor's Dashboard)
 * IMPL-036: Unified styling with Returns Buildup Strip
 * IMPL-036b: Natural DSCR display, complete HDC breakdown, solid background
 *
 * A compact, always-visible dashboard showing key metrics for all stakeholders.
 * "Like a conductor watching all sections of the orchestra at once."
 *
 * Features:
 * - Sticky position (stays visible while scrolling)
 * - Collapsible with smooth animation
 * - Conditional sections based on deal structure
 * - Persists open/closed state in localStorage
 * - IMPL-036: Unified styling (aqua-haze bg, gulf-stream border, rounded corners)
 * - IMPL-036b: Shows natural DSCR (before cash management), complete HDC breakdown
 *
 * @version 1.2.0
 * @date 2025-12-29
 * @task IMPL-025, IMPL-036
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { InvestorAnalysisResults, HDCAnalysisResults, CashFlowItem } from '../../../types/taxbenefits';
import {
  formatMultiple,
  formatIRR,
  formatAbbreviatedCurrency,
  formatCurrency
} from '../../../utils/taxbenefits/formatters';
import '../../../styles/taxbenefits/hdcCalculator.css';

// ============================================================================
// TYPES
// ============================================================================

interface DealValidationStripProps {
  /** Investor analysis results from calculation engine */
  mainAnalysisResults: InvestorAnalysisResults;
  /** HDC analysis results from calculation engine */
  hdcAnalysisResults: HDCAnalysisResults;
  /** Per-year cash flow data */
  cashFlows: CashFlowItem[];
  /** HDC sub-debt percentage (for conditional display) */
  subDebtPct?: number;
  /** Investor sub-debt percentage (for conditional display) */
  investorSubDebtPct?: number;
  /** Outside investor sub-debt percentage (for conditional display) */
  outsideInvestorSubDebtPct?: number;
  /** Preferred equity percentage (for conditional display) */
  prefEquityPct?: number;
  /** Philanthropic debt percentage (for conditional display) */
  philDebtPct?: number;
}

type DSCRStatus = 'pass' | 'warn' | 'fail';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'dealValidationStrip.isOpen';
const DSCR_PASS_THRESHOLD = 1.20;
const DSCR_WARN_THRESHOLD = 1.05;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine DSCR status based on thresholds
 */
function getDSCRStatus(dscr: number): DSCRStatus {
  if (dscr >= DSCR_PASS_THRESHOLD) return 'pass';
  if (dscr >= DSCR_WARN_THRESHOLD) return 'warn';
  return 'fail';
}

/**
 * Get status indicator symbol
 */
function getStatusSymbol(status: DSCRStatus | 'clear' | 'shortfall'): string {
  switch (status) {
    case 'pass':
    case 'clear':
      return '✓';
    case 'warn':
    case 'shortfall':
      return '⚠';
    case 'fail':
      return '✗';
    default:
      return '';
  }
}

/**
 * Get color for status
 */
function getStatusColor(status: DSCRStatus | 'clear' | 'shortfall'): string {
  switch (status) {
    case 'pass':
    case 'clear':
      return 'var(--hdc-sushi)';
    case 'warn':
    case 'shortfall':
      return 'var(--hdc-brown-rust)';
    case 'fail':
      return 'var(--hdc-strikemaster)';
    default:
      return 'inherit';
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MetricProps {
  label: string;
  value: string;
  sublabel?: string;
  status?: DSCRStatus | 'clear' | 'shortfall';
}

/**
 * Individual metric display for expanded view
 */
const Metric: React.FC<MetricProps> = ({ label, value, sublabel, status }) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <div style={{
      fontSize: '0.7rem',
      color: 'var(--hdc-cabbage-pont)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.25rem'
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '1.1rem',
      fontWeight: 600,
      color: status ? getStatusColor(status) : 'var(--hdc-spectra)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      {value}
      {status && (
        <span style={{ fontSize: '0.9rem' }}>
          {getStatusSymbol(status)}
        </span>
      )}
    </div>
    {sublabel && (
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--hdc-cabbage-pont)',
        marginTop: '0.125rem'
      }}>
        {sublabel}
      </div>
    )}
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Stakeholder section wrapper
 */
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div style={{ flex: 1, minWidth: '180px' }}>
    <div style={{
      fontSize: '0.8rem',
      fontWeight: 700,
      color: 'var(--hdc-faded-jade)',
      borderBottom: '2px solid var(--hdc-gulf-stream)',
      paddingBottom: '0.375rem',
      marginBottom: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {title}
    </div>
    {children}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DealValidationStrip: React.FC<DealValidationStripProps> = ({
  mainAnalysisResults,
  hdcAnalysisResults,
  cashFlows,
  subDebtPct = 0,
  investorSubDebtPct = 0,
  outsideInvestorSubDebtPct = 0,
  prefEquityPct = 0
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
  const derived = useMemo(() => {
    // Extract values from results
    const { irr, multiple, breakEvenYear, totalReturns } = mainAnalysisResults;
    const {
      subDebtAtExit = 0,
      investorSubDebtAtExit = 0,
      outsideInvestorSubDebtAtExit = 0,
      preferredEquityResult
    } = mainAnalysisResults;

    const {
      totalHDCReturns = 0,
      hdcExitProceeds = 0,
      hdcPromoteProceeds = 0,
      hdcOperatingPromoteIncome = 0,
      hdcSubDebtRepayment = 0,
      hdcSubDebtAtExit = 0,
      accumulatedAumFeesAtExit = 0
    } = hdcAnalysisResults;

    // IMPL-036b: Calculate min NATURAL DSCR from operationalDSCR (before cash management)
    // This shows the deal's true debt service coverage, not the managed 1.05x target
    const validDSCRs = cashFlows
      .filter(cf => cf.operationalDSCR != null && cf.operationalDSCR > 0 && isFinite(cf.operationalDSCR))
      .map(cf => cf.operationalDSCR!);
    const minDSCR = validDSCRs.length > 0 ? Math.min(...validDSCRs) : 0;

    // IMPL-036b: Calculate HDC breakdown components that sum to totalHDCReturns
    // Total = Operating Promote + Exit Promote + Sub-Debt Repayment + Accumulated AUM Fees
    const hdcSubDebtTotal = hdcSubDebtRepayment || hdcSubDebtAtExit || 0;

    // Conditional display logic
    const hasSubDebt = (subDebtAtExit + investorSubDebtAtExit + outsideInvestorSubDebtAtExit) > 0
                       || (subDebtPct + investorSubDebtPct + outsideInvestorSubDebtPct) > 0;
    const hasPrefEquity = preferredEquityResult != null && prefEquityPct > 0;

    // Sub-debt clears at exit?
    const subDebtClears = subDebtAtExit === 0
                          && investorSubDebtAtExit === 0
                          && outsideInvestorSubDebtAtExit === 0;
    const totalSubDebtAtExit = subDebtAtExit + investorSubDebtAtExit + outsideInvestorSubDebtAtExit;

    // Status calculations
    const dscrStatus = getDSCRStatus(minDSCR);
    const subDebtStatus: 'clear' | 'shortfall' = subDebtClears ? 'clear' : 'shortfall';

    // Preferred equity metrics
    const prefAchievedMOIC = preferredEquityResult?.achievedMOIC ?? 0;
    const prefTargetAchieved = preferredEquityResult?.targetAchieved ?? false;

    return {
      // Investor
      irr,
      multiple,
      breakEvenYear,
      totalReturns,
      // DSCR
      minDSCR,
      dscrStatus,
      // HDC - IMPL-036b: Complete breakdown
      totalHDCReturns,
      hdcExitProceeds,
      hdcPromoteProceeds,
      hdcOperatingPromoteIncome,
      hdcSubDebtTotal,
      accumulatedAumFeesAtExit,
      // Sub-debt
      hasSubDebt,
      subDebtClears,
      subDebtStatus,
      totalSubDebtAtExit,
      subDebtAtExit,
      investorSubDebtAtExit,
      outsideInvestorSubDebtAtExit,
      // Pref equity
      hasPrefEquity,
      prefAchievedMOIC,
      prefTargetAchieved
    };
  }, [mainAnalysisResults, hdcAnalysisResults, cashFlows, subDebtPct, investorSubDebtPct, outsideInvestorSubDebtPct, prefEquityPct]);

  // ─────────────────────────────────────────────────────────────────────────
  // Collapsed State KPI Bar
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
        Deal Validation
      </div>

      {/* KPI Summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flex: 1,
        justifyContent: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* DSCR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--hdc-cabbage-pont)' }}>DSCR</span>
          <span style={{
            fontWeight: 600,
            color: getStatusColor(derived.dscrStatus)
          }}>
            {formatMultiple(derived.minDSCR)}
          </span>
          <span style={{ color: getStatusColor(derived.dscrStatus) }}>
            {getStatusSymbol(derived.dscrStatus)}
          </span>
        </div>

        {/* Investor Multiple / IRR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--hdc-cabbage-pont)' }}>Investor</span>
          <span style={{ fontWeight: 600, color: 'var(--hdc-spectra)' }}>
            {formatMultiple(derived.multiple)}
          </span>
          <span style={{ color: 'var(--hdc-cabbage-pont)' }}>/</span>
          <span style={{ fontWeight: 600, color: 'var(--hdc-spectra)' }}>
            {formatIRR(derived.irr)}
          </span>
        </div>

        {/* HDC Returns */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--hdc-cabbage-pont)' }}>HDC</span>
          <span style={{ fontWeight: 600, color: 'var(--hdc-spectra)' }}>
            {formatAbbreviatedCurrency(derived.totalHDCReturns)}
          </span>
        </div>

        {/* Sub Debt (conditional) */}
        {derived.hasSubDebt && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hdc-cabbage-pont)' }}>Sub Debt</span>
            <span style={{ color: getStatusColor(derived.subDebtStatus) }}>
              {getStatusSymbol(derived.subDebtStatus)}
            </span>
          </div>
        )}

        {/* Pref Equity (conditional) */}
        {derived.hasPrefEquity && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--hdc-cabbage-pont)' }}>Pref</span>
            <span style={{ fontWeight: 600, color: 'var(--hdc-spectra)' }}>
              {formatMultiple(derived.prefAchievedMOIC)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Expanded State Detail View
  // ─────────────────────────────────────────────────────────────────────────
  const ExpandedView = () => (
    <div style={{ padding: '1rem' }}>
      {/* Row 1: SENIOR | INVESTOR | HDC */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: derived.hasSubDebt || derived.hasPrefEquity ? '1.5rem' : 0,
        flexWrap: 'wrap'
      }}>
        {/* SENIOR */}
        <Section title="Senior">
          <Metric
            label="Min DSCR"
            value={formatMultiple(derived.minDSCR)}
            status={derived.dscrStatus}
          />
          <Metric
            label="Covenant"
            value={derived.dscrStatus === 'pass' ? 'APPROVED' : derived.dscrStatus === 'warn' ? 'MARGINAL' : 'FAILED'}
            status={derived.dscrStatus}
          />
        </Section>

        {/* INVESTOR */}
        <Section title="Investor">
          <Metric
            label="Multiple"
            value={formatMultiple(derived.multiple)}
          />
          <Metric
            label="IRR"
            value={formatIRR(derived.irr)}
          />
          {derived.breakEvenYear && derived.breakEvenYear > 0 && (
            <Metric
              label="Break-even"
              value={`Year ${derived.breakEvenYear}`}
            />
          )}
        </Section>

        {/* HDC - IMPL-036b: Complete breakdown that sums to total */}
        <Section title="HDC">
          {/* Operating promote collected during hold period */}
          {derived.hdcOperatingPromoteIncome > 0 && (
            <Metric
              label="Operating Promote"
              value={formatAbbreviatedCurrency(derived.hdcOperatingPromoteIncome)}
            />
          )}
          {/* Exit promote from property sale */}
          <Metric
            label="Exit Promote"
            value={formatAbbreviatedCurrency(derived.hdcPromoteProceeds)}
          />
          {/* Sub-debt principal + accrued interest returned at exit */}
          {derived.hdcSubDebtTotal > 0 && (
            <Metric
              label="Sub-Debt Repaid"
              value={formatAbbreviatedCurrency(derived.hdcSubDebtTotal)}
            />
          )}
          {/* Accumulated AUM fees collected at exit */}
          {derived.accumulatedAumFeesAtExit > 0 && (
            <Metric
              label="Deferred AUM"
              value={formatAbbreviatedCurrency(derived.accumulatedAumFeesAtExit)}
            />
          )}
          {/* Total HDC Returns - shown as summary with border */}
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--hdc-gulf-stream)'
          }}>
            <Metric
              label="Total HDC"
              value={formatAbbreviatedCurrency(derived.totalHDCReturns)}
            />
          </div>
        </Section>
      </div>

      {/* Row 2: SUB DEBT | PREF EQUITY (conditional) */}
      {(derived.hasSubDebt || derived.hasPrefEquity) && (
        <div style={{
          display: 'flex',
          gap: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--hdc-gulf-stream)',
          flexWrap: 'wrap'
        }}>
          {/* SUB DEBT */}
          {derived.hasSubDebt && (
            <Section title="Sub Debt">
              <Metric
                label="Status"
                value={derived.subDebtClears ? 'Clears at Exit' : 'Shortfall'}
                status={derived.subDebtStatus}
              />
              {!derived.subDebtClears && (
                <Metric
                  label="Balance at Exit"
                  value={formatAbbreviatedCurrency(derived.totalSubDebtAtExit)}
                />
              )}
            </Section>
          )}

          {/* PREF EQUITY */}
          {derived.hasPrefEquity && (
            <Section title="Pref Equity">
              <Metric
                label="Achieved MOIC"
                value={formatMultiple(derived.prefAchievedMOIC)}
                status={derived.prefTargetAchieved ? 'pass' : 'warn'}
              />
              <Metric
                label="Target"
                value={derived.prefTargetAchieved ? 'Achieved' : 'Shortfall'}
                status={derived.prefTargetAchieved ? 'pass' : 'warn'}
              />
            </Section>
          )}
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  // IMPL-036b: Solid background styling (sticky now handled by parent container in HDCResultsComponent)
  return (
    <div
      style={{
        backgroundColor: 'var(--hdc-aqua-haze)',
        // IMPL-036b: Ensure solid background - no transparency during scroll
        opacity: 1,
        backdropFilter: 'none',
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

export default DealValidationStrip;
