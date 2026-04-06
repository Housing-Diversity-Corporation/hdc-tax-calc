/**
 * TimelineAuditPanel (IMPL-154)
 *
 * Collapsible read-only panel on Screen 2 showing the full computeTimeline()
 * trace for each deal. Answers "why is the hold period X years?" at a glance.
 *
 * Computes timeline live from DealBenefitProfile fields — not from persisted
 * timeline data. Election is inferred from the LIHTC schedule.
 */

import React, { useState, useMemo } from 'react';
import { computeTimeline } from '../../../utils/taxbenefits/computeTimeline';
import type { ComputedTimeline } from '../../../types/taxbenefits';
import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPct(p: number): string {
  if (p === 1.0) return 'Full (100%)';
  return `Prorated (${(p * 100).toFixed(1)}%)`;
}

/**
 * Infer §42(f)(1) election from the LIHTC schedule.
 * If pisMonth > 1 and the first year's credit is 0 (or near-zero relative to Year 2),
 * the election was made — credit period deferred to next year.
 */
function inferElection(deal: DealBenefitProfile): boolean {
  if (deal.pisMonth <= 1) return false; // January PIS — election has no effect
  if (deal.lihtcSchedule.length < 2) return false;
  const yr1 = deal.lihtcSchedule[0];
  const yr2 = deal.lihtcSchedule[1];
  if (yr2 === 0) return false;
  // If Year 1 is < 10% of Year 2, election was likely made (Year 1 has no credits)
  return yr1 / yr2 < 0.10;
}

/** Compute timeline from DealBenefitProfile fields. */
function computeTimelineFromDeal(deal: DealBenefitProfile): {
  timeline: ComputedTimeline;
  config: DealConfig;
} | null {
  // Synthesize investmentDate from pisYear/pisMonth (best available — exact day unknown)
  // Fallback to fundYear + month 1 if pisYear/pisMonth not populated
  const pisYear = deal.pisYear || deal.fundYear;
  const pisMonth = deal.pisMonth || 1;
  if (!pisYear) return null;
  const investmentDate = `${pisYear}-${String(pisMonth).padStart(2, '0')}-01`;
  const election = pisMonth > 1 ? inferElection(deal) : false;

  const timeline = computeTimeline(
    investmentDate,
    0,     // constructionDelayMonths — not stored in DBP; 0 for current deals
    null,  // pisDateOverride — not tracked in DBP
    deal.ozEnabled,
    0,     // exitExtensionMonths — not stored in DBP
    election
  );

  return {
    timeline,
    config: {
      investmentDate,
      constructionDelayMonths: 0,
      pisDateOverride: null,
      ozEnabled: deal.ozEnabled,
      electDeferCreditPeriod: election,
    },
  };
}

// ── Types ────────────────────────────────────────────────────────

interface DealConfig {
  investmentDate: string | null;
  constructionDelayMonths: number;
  pisDateOverride: string | null;
  ozEnabled: boolean;
  electDeferCreditPeriod: boolean;
}

interface TimelineAuditPanelProps {
  deals: DealBenefitProfile[];
}

// ── Styles ───────────────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#474a44',
  opacity: 0.5,
  marginTop: '0.75rem',
  marginBottom: '0.25rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.2rem 0',
  fontSize: '0.75rem',
  borderBottom: '1px solid rgba(146, 195, 194, 0.1)',
};

const labelStyle: React.CSSProperties = { color: '#474a44', opacity: 0.7 };
const valueStyle: React.CSSProperties = { color: '#474a44', fontWeight: 500, textAlign: 'right' as const };
const warnDot: React.CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#eab308',
  marginRight: 4,
  verticalAlign: 'middle',
};

// ── Component ────────────────────────────────────────────────────

const TimelineAuditPanel: React.FC<TimelineAuditPanelProps> = ({ deals }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dealTimelines = useMemo(() => {
    return deals
      .map(deal => {
        const result = computeTimelineFromDeal(deal);
        if (!result) return null;
        return { deal, ...result };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [deals]);

  if (dealTimelines.length === 0) return null;

  return (
    <div style={{
      marginBottom: '1rem',
      border: '1px solid rgba(146, 195, 194, 0.3)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
    }}>
      {/* Toggle header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(146, 195, 194, 0.06)',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)' }}>
          Timeline Audit
        </span>
        <span style={{ fontSize: '0.7rem', color: '#474a44', opacity: 0.5 }}>
          {isExpanded ? '▲ collapse' : '▼ expand'}
        </span>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          {dealTimelines.map(({ deal, timeline, config }, idx) => {
            // Warning conditions
            const warnNoPisOverride = config.pisDateOverride === null && config.constructionDelayMonths === 0;
            const warnJanElection = config.electDeferCreditPeriod && timeline.pisCalendarMonth === 1;
            const bindingConstraint = deal.ozEnabled && timeline.ozFloorBinding ? 'OZ 10-Year Floor' : 'LIHTC Credit Period';

            return (
              <div key={deal.dealConduitId || idx}>
                {dealTimelines.length > 1 && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginTop: '0.5rem' }}>
                    {deal.dealName}
                  </div>
                )}

                {/* Section 1 — Inputs */}
                <div style={sectionHeaderStyle}>Inputs</div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Investment Date</span>
                  <span style={valueStyle}>{formatDate(timeline.investmentDate)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Construction Delay</span>
                  <span style={valueStyle}>{config.constructionDelayMonths} months</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>
                    {warnNoPisOverride && <span style={warnDot} title="PIS equals investment date — verify intentional" />}
                    PIS Date Override
                  </span>
                  <span style={valueStyle}>{config.pisDateOverride || 'None'}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>OZ Enabled</span>
                  <span style={valueStyle}>{deal.ozEnabled ? 'Yes' : 'No'}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>
                    {warnJanElection && <span style={warnDot} title="Election has no effect for January PIS" />}
                    §42(f)(1) Election
                  </span>
                  <span style={valueStyle}>{config.electDeferCreditPeriod ? 'ON' : 'OFF'}</span>
                </div>

                {/* Section 2 — PIS Computation */}
                <div style={sectionHeaderStyle}>PIS Computation</div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Effective PIS</span>
                  <span style={valueStyle}>{formatDate(timeline.pisDate)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>PIS Calendar Month</span>
                  <span style={valueStyle}>{timeline.pisCalendarMonth}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>PIS Year</span>
                  <span style={valueStyle}>{timeline.pisYear}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>PIS Overridden</span>
                  <span style={valueStyle}>{timeline.pisIsOverridden ? 'Yes' : 'No'}</span>
                </div>

                {/* Section 3 — Credit Schedule */}
                <div style={sectionHeaderStyle}>Credit Schedule</div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Election Applies</span>
                  <span style={valueStyle}>{timeline.electDeferCreditPeriod ? 'Yes' : 'No'}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Credit Period Start</span>
                  <span style={valueStyle}>Jan 1, {timeline.creditStartYear}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Year 1 Credit</span>
                  <span style={valueStyle}>{formatPct(timeline.lihtcYear1Pct)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Catch-Up Credit</span>
                  <span style={valueStyle}>{timeline.hasCatchUp ? 'Yes' : 'No'}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Credit Years</span>
                  <span style={valueStyle}>{timeline.lihtcCreditYears}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Last Credit Year</span>
                  <span style={valueStyle}>{timeline.lastCreditYear}</span>
                </div>

                {/* Section 4 — Exit and Hold Period */}
                <div style={sectionHeaderStyle}>Exit & Hold Period</div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Optimal Exit (LIHTC)</span>
                  <span style={valueStyle}>{formatDate(timeline.optimalExitDate)}</span>
                </div>
                {deal.ozEnabled && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>OZ Minimum Exit</span>
                    <span style={valueStyle}>{formatDate(timeline.ozMinimumDate)}</span>
                  </div>
                )}
                <div style={rowStyle}>
                  <span style={labelStyle}>Binding Constraint</span>
                  <span style={valueStyle}>{bindingConstraint}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Engine Exit Date</span>
                  <span style={valueStyle}>{formatDate(timeline.actualExitDate)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Total Hold Months</span>
                  <span style={valueStyle}>{timeline.totalHoldMonths}</span>
                </div>
                <div style={{
                  ...rowStyle,
                  borderBottom: 'none',
                  paddingTop: '0.3rem',
                }}>
                  <span style={{ ...labelStyle, fontWeight: 600 }}>Total Hold Years</span>
                  <span style={{
                    color: '#3E5D80',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}>
                    {timeline.totalInvestmentYears}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineAuditPanel;
