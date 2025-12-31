import React, { useState, useMemo } from 'react';
import { IRAConversionPlan, REPTaxCapacityModel } from '../../../types/taxbenefits';

interface IRAConversionPlannerProps {
  conversionPlan?: IRAConversionPlan;
  repCapacity?: REPTaxCapacityModel;
  onUpdateIRABalance?: (balance: number) => void;
  formatCurrency: (value: number) => string;
}

const IRAConversionPlanner: React.FC<IRAConversionPlannerProps> = ({
  conversionPlan,
  repCapacity,
  onUpdateIRABalance,
  formatCurrency
}) => {
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfBalance, setWhatIfBalance] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<'aggressive' | 'balanced' | 'conservative'>('balanced');

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!conversionPlan) return null;

    const avgConversionPerYear = conversionPlan.totalConverted / conversionPlan.schedule.length;
    const taxSavingsRate = (conversionPlan.totalTaxSaved / conversionPlan.totalConverted) * 100;
    const growthMultiple = conversionPlan.year30RothValue / conversionPlan.totalConverted;

    return {
      avgConversionPerYear,
      taxSavingsRate,
      growthMultiple
    };
  }, [conversionPlan]);

  const handleWhatIfCalculation = () => {
    const balance = parseFloat(whatIfBalance.replace(/,/g, ''));
    if (!isNaN(balance) && balance > 0 && onUpdateIRABalance) {
      onUpdateIRABalance(balance);
      setShowWhatIf(false);
      setWhatIfBalance('');
    }
  };

  if (!conversionPlan || !repCapacity) {
    return (
      <div className="ira-conversion-planner">
        <div className="no-plan-message">
          <h3>IRA Conversion Planning</h3>
          <p>Enter your Traditional IRA balance in the calculator to see conversion opportunities.</p>
          <div className="what-if-prompt">
            <button
              className="what-if-button"
              onClick={() => setShowWhatIf(!showWhatIf)}
            >
              What if I have an IRA?
            </button>

            {showWhatIf && (
              <div className="what-if-input">
                <input
                  type="text"
                  placeholder="Enter IRA balance (e.g., 2000000)"
                  value={whatIfBalance}
                  onChange={(e) => setWhatIfBalance(e.target.value)}
                />
                <button onClick={handleWhatIfCalculation}>Calculate</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ira-conversion-planner">
      <div className="planner-header">
        <h3>IRA to Roth Conversion Optimizer</h3>
        <div className="header-subtitle">
          Maximize tax-free growth using HDC losses to offset conversion taxes
        </div>
      </div>

      {/* Executive Summary */}
      <div className="executive-summary">
        <div className="summary-hero">
          <div className="hero-metric">
            <div className="metric-label">Total Conversion</div>
            <div className="metric-value">{formatCurrency(conversionPlan.totalConverted)}</div>
          </div>
          <div className="hero-metric">
            <div className="metric-label">Tax Saved</div>
            <div className="metric-value highlight">{formatCurrency(conversionPlan.totalTaxSaved)}</div>
          </div>
          <div className="hero-metric">
            <div className="metric-label">30-Year Value</div>
            <div className="metric-value">{formatCurrency(conversionPlan.year30RothValue)}</div>
          </div>
        </div>

        <div className="summary-insight">
          <div className="insight-icon">💡</div>
          <div className="insight-text">
            Convert {formatCurrency(conversionPlan.totalConverted)} over {conversionPlan.schedule.length} years
            and save {formatCurrency(conversionPlan.totalTaxSaved)} in taxes using HDC losses.
            Your Roth will grow to {formatCurrency(conversionPlan.year30RothValue)} tax-free by retirement.
          </div>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="strategy-selector">
        <h4>Conversion Strategy</h4>
        <div className="strategy-buttons">
          <button
            className={`strategy-button ${selectedStrategy === 'aggressive' ? 'active' : ''}`}
            onClick={() => setSelectedStrategy('aggressive')}
          >
            <span className="strategy-name">Aggressive</span>
            <span className="strategy-detail">3 years</span>
          </button>
          <button
            className={`strategy-button ${selectedStrategy === 'balanced' ? 'active' : ''}`}
            onClick={() => setSelectedStrategy('balanced')}
          >
            <span className="strategy-name">Balanced</span>
            <span className="strategy-detail">5 years</span>
          </button>
          <button
            className={`strategy-button ${selectedStrategy === 'conservative' ? 'active' : ''}`}
            onClick={() => setSelectedStrategy('conservative')}
          >
            <span className="strategy-name">Conservative</span>
            <span className="strategy-detail">7 years</span>
          </button>
        </div>
      </div>

      {/* Annual Conversion Schedule */}
      <div className="conversion-schedule">
        <h4>Annual Conversion Schedule</h4>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Convert</th>
              <th>HDC Loss Offset</th>
              <th>Tax Saved</th>
              <th>Roth Balance</th>
              <th>% Complete</th>
            </tr>
          </thead>
          <tbody>
            {conversionPlan.schedule.map((year, index) => {
              const percentComplete = ((conversionPlan.schedule
                .slice(0, index + 1)
                .reduce((sum, y) => sum + y.recommendedConversion, 0)) /
                conversionPlan.totalConverted) * 100;

              return (
                <tr key={year.year}>
                  <td className="year-cell">Year {year.year}</td>
                  <td className="currency-cell">{formatCurrency(year.recommendedConversion)}</td>
                  <td className="currency-cell">{formatCurrency(year.hdcLossOffset)}</td>
                  <td className="currency-cell highlight">{formatCurrency(year.taxSaved)}</td>
                  <td className="currency-cell">{formatCurrency(year.rothBalance)}</td>
                  <td className="progress-cell">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${percentComplete}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{percentComplete.toFixed(0)}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td>Total</td>
              <td className="currency-cell">{formatCurrency(conversionPlan.totalConverted)}</td>
              <td className="currency-cell">-</td>
              <td className="currency-cell highlight">{formatCurrency(conversionPlan.totalTaxSaved)}</td>
              <td className="currency-cell">{formatCurrency(conversionPlan.year30RothValue)}</td>
              <td>100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Visual Timeline */}
      <div className="conversion-timeline">
        <h4>Conversion & Growth Timeline</h4>
        <div className="timeline-container">
          {conversionPlan.schedule.map((year) => (
            <div key={year.year} className="timeline-year">
              <div className="timeline-bar">
                <div
                  className="conversion-bar"
                  style={{
                    height: `${(year.recommendedConversion / Math.max(...conversionPlan.schedule.map(y => y.recommendedConversion))) * 100}%`
                  }}
                >
                  <span className="bar-label">{formatCurrency(year.recommendedConversion)}</span>
                </div>
              </div>
              <div className="timeline-label">Year {year.year}</div>
            </div>
          ))}
          <div className="timeline-future">
            <div className="future-growth">
              <div className="growth-arrow">→</div>
              <div className="growth-label">
                30-Year Growth
                <div className="growth-value">{formatCurrency(conversionPlan.year30RothValue)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="conversion-benefits">
        <h4>Why This Strategy Works</h4>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <div className="benefit-content">
              <strong>HDC Loss Offset</strong>
              <p>Use {formatCurrency(conversionPlan.totalTaxSaved)} in HDC losses to pay conversion taxes,
              making the conversion essentially "free".</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📈</div>
            <div className="benefit-content">
              <strong>{metrics?.growthMultiple.toFixed(1)}x Growth</strong>
              <p>Your {formatCurrency(conversionPlan.totalConverted)} grows to {formatCurrency(conversionPlan.year30RothValue)}
              over 30 years - all tax-free.</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">🏦</div>
            <div className="benefit-content">
              <strong>No RMDs</strong>
              <p>Unlike Traditional IRAs, Roth IRAs have no required minimum distributions,
              giving you complete control.</p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">👨‍👩‍👧‍👦</div>
            <div className="benefit-content">
              <strong>Tax-Free Legacy</strong>
              <p>Roth IRAs pass to heirs completely tax-free, maximizing
              intergenerational wealth transfer.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison with No Conversion */}
      <div className="no-conversion-comparison">
        <h4>With HDC vs Without HDC</h4>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Conversion Tax</th>
              <th>30-Year Value</th>
              <th>Tax on Distribution</th>
              <th>Net Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="with-hdc">
              <td>With HDC Losses</td>
              <td className="currency-cell highlight">
                {formatCurrency(0)}
                <span className="detail">HDC offset</span>
              </td>
              <td className="currency-cell">{formatCurrency(conversionPlan.year30RothValue)}</td>
              <td className="currency-cell highlight">{formatCurrency(0)}</td>
              <td className="currency-cell highlight">{formatCurrency(conversionPlan.year30RothValue)}</td>
            </tr>
            <tr className="without-hdc">
              <td>Without HDC</td>
              <td className="currency-cell negative">
                {formatCurrency(conversionPlan.totalConverted * 0.479)}
                <span className="detail">47.9% tax</span>
              </td>
              <td className="currency-cell">{formatCurrency(conversionPlan.year30RothValue)}</td>
              <td className="currency-cell">{formatCurrency(0)}</td>
              <td className="currency-cell">
                {formatCurrency(conversionPlan.year30RothValue - (conversionPlan.totalConverted * 0.479))}
              </td>
            </tr>
            <tr className="no-conversion">
              <td>No Conversion (Traditional)</td>
              <td className="currency-cell">{formatCurrency(0)}</td>
              <td className="currency-cell">{formatCurrency(conversionPlan.year30RothValue)}</td>
              <td className="currency-cell negative">
                {formatCurrency(conversionPlan.year30RothValue * 0.37)}
                <span className="detail">37% on distribution</span>
              </td>
              <td className="currency-cell">
                {formatCurrency(conversionPlan.year30RothValue * 0.63)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="comparison-insight">
          <strong>HDC Advantage:</strong> {formatCurrency(conversionPlan.year30RothValue - (conversionPlan.year30RothValue * 0.63))}
          more retirement income vs keeping Traditional IRA
        </div>
      </div>

      {/* Action Steps */}
      <div className="action-steps">
        <h4>Next Steps</h4>
        <ol className="steps-list">
          <li>Confirm your current Traditional IRA balance</li>
          <li>Coordinate with your CPA on conversion timing</li>
          <li>Execute Year 1 conversion of {formatCurrency(conversionPlan.schedule[0]?.recommendedConversion || 0)}</li>
          <li>File Form 8606 to document the conversion</li>
          <li>Track HDC losses to ensure full offset</li>
        </ol>
      </div>
    </div>
  );
};

export default IRAConversionPlanner;