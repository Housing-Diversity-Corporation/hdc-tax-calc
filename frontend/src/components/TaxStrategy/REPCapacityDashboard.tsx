import React, { useState } from 'react';
import { REPTaxCapacityModel } from '../../types/taxbenefits';

interface REPCapacityDashboardProps {
  capacity: REPTaxCapacityModel;
  formatCurrency: (value: number) => string;
}

const REPCapacityDashboard: React.FC<REPCapacityDashboardProps> = ({
  capacity,
  formatCurrency
}) => {
  const [selectedYear, setSelectedYear] = useState(1);
  const selectedYearData = capacity.annualLimitations[selectedYear - 1];

  // Calculate percentage of limit used
  const getUtilizationPercentage = (allowed: number, limit: number): number => {
    return Math.min((allowed / limit) * 100, 100);
  };

  return (
    <div className="rep-capacity-dashboard">
      <div className="dashboard-header">
        <h3>Real Estate Professional Tax Capacity Analysis</h3>
        <div className="section-subtitle">
          §461(l) Excess Business Loss Limitation Tracking
        </div>
      </div>

      {/* Current Year Capacity Overview */}
      <div className="capacity-overview">
        <div className="capacity-cards">
          <div className="capacity-card primary">
            <div className="capacity-header">
              <h4>Current Year Capacity</h4>
              <span className="info-icon" title="Amount you can use this year">ℹ</span>
            </div>
            <div className="capacity-value">{formatCurrency(capacity.totalCapacity.currentYear)}</div>
            <div className="capacity-limit">
              of {formatCurrency(626_000)} annual limit
            </div>
            <div className="capacity-bar">
              <div
                className="capacity-fill"
                style={{
                  width: `${getUtilizationPercentage(capacity.totalCapacity.currentYear, 626_000)}%`
                }}
              ></div>
            </div>
          </div>

          <div className="capacity-card">
            <div className="capacity-header">
              <h4>NOL Bank</h4>
              <span className="info-icon" title="Carryforward for future years">ℹ</span>
            </div>
            <div className="capacity-value nol">{formatCurrency(capacity.totalCapacity.nolBank)}</div>
            <div className="capacity-detail">
              Carries forward indefinitely
            </div>
          </div>

          <div className="capacity-card">
            <div className="capacity-header">
              <h4>IRA Conversion Capacity</h4>
              <span className="info-icon" title="Optimal Roth conversion amount">ℹ</span>
            </div>
            <div className="capacity-value">
              {formatCurrency(capacity.totalCapacity.iraConversionCapacity)}
            </div>
            <div className="capacity-detail">
              Tax-free conversion potential
            </div>
          </div>
        </div>
      </div>

      {/* Year Selector */}
      <div className="year-selector">
        <label>Select Year for Details:</label>
        <div className="year-buttons">
          {capacity.annualLimitations.slice(0, 10).map((_, index) => (
            <button
              key={index + 1}
              className={`year-button ${selectedYear === index + 1 ? 'active' : ''}`}
              onClick={() => setSelectedYear(index + 1)}
            >
              Year {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Year Details */}
      {selectedYearData && (
        <div className="year-details">
          <h4>Year {selectedYear} Details</h4>

          <div className="details-grid">
            <div className="detail-item">
              <label>W-2 Income</label>
              <div className="detail-value">{formatCurrency(selectedYearData.w2Income)}</div>
            </div>

            <div className="detail-item">
              <label>§461(l) Limit</label>
              <div className="detail-value">{formatCurrency(selectedYearData.section461lLimit)}</div>
            </div>

            <div className="detail-item">
              <label>Allowed Loss</label>
              <div className="detail-value allowed">{formatCurrency(selectedYearData.allowedLoss)}</div>
            </div>

            <div className="detail-item">
              <label>Disallowed Loss → NOL</label>
              <div className="detail-value disallowed">{formatCurrency(selectedYearData.disallowedLoss)}</div>
            </div>

            <div className="detail-item">
              <label>NOL Generated</label>
              <div className="detail-value">{formatCurrency(selectedYearData.nolGenerated)}</div>
            </div>

            <div className="detail-item">
              <label>Cumulative NOL</label>
              <div className="detail-value cumulative">{formatCurrency(selectedYearData.nolCarryforward)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Annual Limitation Schedule Table */}
      <div className="limitation-schedule">
        <h4>10-Year §461(l) Limitation Schedule</h4>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Total Loss</th>
              <th>Allowed</th>
              <th>Disallowed</th>
              <th>NOL Generated</th>
              <th>NOL Balance</th>
            </tr>
          </thead>
          <tbody>
            {capacity.annualLimitations.slice(0, 10).map((year) => (
              <tr key={year.year} className={year.year === selectedYear ? 'selected-row' : ''}>
                <td className="year-cell">{year.year}</td>
                <td className="currency-cell">
                  {formatCurrency(year.allowedLoss + year.disallowedLoss)}
                </td>
                <td className="currency-cell allowed">{formatCurrency(year.allowedLoss)}</td>
                <td className="currency-cell disallowed">{formatCurrency(year.disallowedLoss)}</td>
                <td className="currency-cell">{formatCurrency(year.nolGenerated)}</td>
                <td className="currency-cell cumulative">{formatCurrency(year.nolCarryforward)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td>Total</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td className="currency-cell cumulative">
                {formatCurrency(capacity.totalCapacity.nolBank)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Key Insights */}
      <div className="rep-insights">
        <h4>Key Planning Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">💡</div>
            <div className="insight-content">
              <strong>§461(l) Impact</strong>
              <p>Your annual W-2 offset is capped at $626,000. Excess losses become NOLs for future use.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🏦</div>
            <div className="insight-content">
              <strong>NOL Strategy</strong>
              <p>You're building a {formatCurrency(capacity.totalCapacity.nolBank)} NOL bank.
              Consider large income events to utilize.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🔄</div>
            <div className="insight-content">
              <strong>IRA Conversions</strong>
              <p>Optimal conversion: {formatCurrency(capacity.totalCapacity.iraConversionCapacity)} this year
              to maximize HDC loss utilization.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <strong>Business Income</strong>
              <p>Business and rental income can be offset without the §461(l) limitation -
              prioritize these income sources.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default REPCapacityDashboard;