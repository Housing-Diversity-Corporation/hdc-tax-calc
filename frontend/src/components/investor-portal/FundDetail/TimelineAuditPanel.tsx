/**
 * TimelineAuditPanel (IMPL-154)
 *
 * Collapsible read-only panel on Screen 2 showing the full computeTimeline()
 * trace for each deal. Answers "why is the hold period X years?" at a glance.
 *
 * All values come from pre-computed ComputedTimeline — this component does
 * NOT call computeTimeline() or read from DealBenefitProfile. The parent
 * (FundDetail) computes the timeline and passes it as a prop.
 */

import React, { useState } from 'react';
import type { ComputedTimeline } from '../../../types/taxbenefits';

// ── Types ────────────────────────────────────────────────────────

export interface DealTimelineEntry {
  dealName: string;
  ozEnabled: boolean;
  timeline: ComputedTimeline;
  config: {
    investmentDate: string | null;
    constructionDelayMonths: number;
    pisDateOverride: string | null;
    electDeferCreditPeriod: boolean;
  };
}

interface TimelineAuditPanelProps {
  entries: DealTimelineEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPct(p: number): string {
  if (isNaN(p)) return '—';
  if (p === 1.0) return 'Full (100%)';
  return `Prorated (${(p * 100).toFixed(1)}%)`;
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

const TimelineAuditPanel: React.FC<TimelineAuditPanelProps> = ({ entries }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (entries.length === 0) return null;

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
          {entries.map(({ dealName, ozEnabled, timeline, config }, idx) => {
            const warnNoPisOverride = !config.pisDateOverride && config.constructionDelayMonths === 0;
            const warnJanElection = config.electDeferCreditPeriod && timeline.pisCalendarMonth === 1;
            const bindingConstraint = ozEnabled && timeline.ozFloorBinding ? 'OZ 10-Year Floor' : 'LIHTC Credit Period';

            return (
              <div key={idx}>
                {entries.length > 1 && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginTop: '0.5rem' }}>
                    {dealName}
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
                  <span style={valueStyle}>{ozEnabled ? 'Yes' : 'No'}</span>
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
                {ozEnabled && (
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
