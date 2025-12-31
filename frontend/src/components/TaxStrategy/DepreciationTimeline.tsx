import React from 'react';
import { DepreciationSchedule } from '../../utils/taxbenefits/depreciationSchedule';

interface DepreciationTimelineProps {
  schedule: DepreciationSchedule;
  formatCurrency: (value: number) => string;
}

const DepreciationTimeline: React.FC<DepreciationTimelineProps> = ({
  schedule,
  formatCurrency
}) => {
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{
        color: 'var(--hdc-faded-jade)',
        marginBottom: '0.75rem',
        fontSize: '1rem',
        fontWeight: 600
      }}>
        10-Year Depreciation & Tax Benefit Schedule
      </h4>

      {/* Detailed Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--hdc-mercury)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--hdc-slate-gray)' }}>Year</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-slate-gray)' }}>Depreciation</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-slate-gray)' }}>Federal Benefit</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-slate-gray)' }}>State Benefit</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-slate-gray)' }}>HDC Fee (10%)</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-slate-gray)' }}>Net Benefit</th>
              <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-slate-gray)' }}>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {schedule.schedule.map((year) => (
              <tr key={year.year} style={{
                borderBottom: '1px solid var(--hdc-mercury)',
                backgroundColor: year.year === 1 ? 'rgba(127, 189, 69, 0.05)' : 'transparent'
              }}>
                <td style={{ padding: '0.5rem', fontWeight: year.year === 1 ? 600 : 400 }}>
                  {year.year}
                  {year.year === 1 && (
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--hdc-cabbage-pont)',
                      fontWeight: 400
                    }}>
                      (25% Bonus)
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {formatCurrency(year.totalDepreciation)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {formatCurrency(year.federalBenefit)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {formatCurrency(year.stateBenefit - year.stateConformityAdjustment)}
                  {year.stateConformityAdjustment > 0 && (
                    <span style={{ color: 'var(--hdc-slate-gray)', marginLeft: '2px' }}>*</span>
                  )}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-strikemaster)' }}>
                  {formatCurrency(year.hdcFee)}
                </td>
                <td style={{
                  padding: '0.5rem',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: year.year === 1 ? 'var(--hdc-cabbage-pont)' : 'inherit'
                }}>
                  {formatCurrency(year.netBenefit)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {formatCurrency(year.cumulativeNetBenefit)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{
              borderTop: '2px solid var(--hdc-faded-jade)',
              backgroundColor: 'rgba(127, 189, 69, 0.05)',
              fontWeight: 600
            }}>
              <td style={{ padding: '0.5rem' }}>Total</td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                {formatCurrency(schedule.totalDepreciation)}
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>-</td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>-</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-strikemaster)' }}>
                {formatCurrency(schedule.totalHDCFees)}
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--hdc-cabbage-pont)' }}>
                {formatCurrency(schedule.totalNetBenefit)}
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>-</td>
            </tr>
          </tfoot>
        </table>

        {/* State conformity note if applicable */}
        {schedule.schedule.some(y => y.stateConformityAdjustment > 0) && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--hdc-slate-gray)',
            fontStyle: 'italic'
          }}>
            * State conformity adjustments applied. Some states do not fully conform to federal bonus depreciation rules.
          </div>
        )}
      </div>
    </div>
  );
};

export default DepreciationTimeline;