import React from 'react';
import { LIHTCCreditSchedule as LIHTCCreditScheduleType } from '../../../utils/taxbenefits/lihtcCreditCalculations';

interface LIHTCCreditScheduleProps {
  result: LIHTCCreditScheduleType | null;
  formatCurrency: (value: number) => string;
}

export const LIHTCCreditSchedule: React.FC<LIHTCCreditScheduleProps> = ({ result, formatCurrency }) => {
  if (!result) return null;

  // Calculate cumulative credits for display
  let cumulative = 0;
  const scheduleWithCumulative = result.yearlyBreakdown.map((year) => {
    cumulative += year.creditAmount;
    return {
      ...year,
      cumulativeCredits: cumulative,
    };
  });

  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">LIHTC Credit Schedule</h3>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Year 1 Credit:</span>
        <span className="hdc-result-value hdc-value-positive">{formatCurrency(result.year1Credit)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Annual Credit (Years 2-10):</span>
        <span className="hdc-result-value">{formatCurrency(result.annualCredit)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Year 11 Catch-Up Credit:</span>
        <span className="hdc-result-value">{formatCurrency(result.year11Credit)}</span>
      </div>

      <div className="hdc-result-row summary">
        <span className="hdc-result-label">Total 10-Year Credits:</span>
        <span className="hdc-result-value hdc-value-positive">{formatCurrency(result.totalCredits)}</span>
      </div>

      {/* Expandable Schedule */}
      <details style={{marginTop: '0.5rem'}}>
        <summary style={{cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem'}}>
          View Credit Schedule
        </summary>
        <table style={{width: '100%', marginTop: '0.5rem', fontSize: '0.8rem'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--hdc-mercury)'}}>
              <th>Year</th>
              <th>Credit</th>
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {scheduleWithCumulative.map((year) => (
              <tr key={year.year}>
                <td>Year {year.year}</td>
                <td>{formatCurrency(year.creditAmount)}</td>
                <td>{formatCurrency(year.cumulativeCredits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};
