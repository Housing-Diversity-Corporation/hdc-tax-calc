import React, { useState } from 'react';
import { NonREPCapacityModel } from '../../../types/taxbenefits';

interface PassiveCapacityDashboardProps {
  capacity: NonREPCapacityModel;
  formatCurrency: (value: number) => string;
}

const PassiveCapacityDashboard: React.FC<PassiveCapacityDashboardProps> = ({
  capacity,
  formatCurrency
}) => {
  const [customGainAmount, setCustomGainAmount] = useState<string>('');

  // Calculate custom scenario if amount entered
  const calculateCustomScenario = () => {
    const amount = parseFloat(customGainAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) return null;

    const percentCovered = Math.min((capacity.totalPassiveLosses / amount) * 100, 100);
    const taxRate = 0.347; // Typical capital gains rate (20% + 3.8% + 10.9%)
    const taxSavings = Math.min(amount, capacity.totalPassiveLosses) * taxRate;

    return {
      gainAmount: amount,
      percentCovered,
      taxSavings
    };
  };

  const customScenario = calculateCustomScenario();

  return (
    <div className="passive-capacity-dashboard">
      <div className="dashboard-header">
        <h3>Passive Investor Tax Capacity Analysis</h3>
        <div className="unlimited-badge">
          ✨ UNLIMITED PASSIVE GAIN OFFSET ✨
        </div>
      </div>

      {/* Hero Section - Unlimited Capacity */}
      <div className="capacity-hero">
        <div className="hero-content">
          <div className="hero-label">Total Passive Loss Capacity</div>
          <div className="hero-value">{formatCurrency(capacity.totalPassiveLosses)}</div>
          <div className="hero-subtitle">
            NO ANNUAL LIMIT • NO §461(l) RESTRICTION • USE IT ALL TODAY
          </div>
        </div>

        <div className="hero-advantages">
          <h4>Your Competitive Advantages:</h4>
          <ul>
            <li>✅ Offset unlimited passive gains immediately</li>
            <li>✅ No $626K annual limitation like REPs</li>
            <li>✅ No complex NOL carryforward tracking</li>
            <li>✅ Perfect for large liquidity events</li>
          </ul>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="scenario-analysis">
        <h4>Gain Offset Scenarios</h4>
        <div className="scenarios-grid">
          {capacity.scenarioAnalysis.map((scenario) => (
            <div key={scenario.gainAmount} className="scenario-card">
              <div className="scenario-header">
                <div className="scenario-amount">{formatCurrency(scenario.gainAmount)}</div>
                <div className="scenario-label">Capital Gain</div>
              </div>

              <div className="scenario-metrics">
                <div className="coverage-meter">
                  <div className="coverage-bar">
                    <div
                      className="coverage-fill"
                      style={{ width: `${scenario.percentCovered}%` }}
                    ></div>
                  </div>
                  <div className="coverage-text">
                    {scenario.percentCovered.toFixed(0)}% Covered
                  </div>
                </div>

                <div className="tax-savings">
                  <label>Tax Savings</label>
                  <div className="savings-amount">{formatCurrency(scenario.taxSavings)}</div>
                </div>

                <div className="effective-rate">
                  <label>Effective Tax Rate</label>
                  <div className="rate-value">
                    {scenario.percentCovered === 100
                      ? '0%'
                      : `${(34.7 * (1 - scenario.percentCovered / 100)).toFixed(1)}%`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Scenario Calculator */}
        <div className="custom-scenario">
          <h4>Calculate Your Scenario</h4>
          <div className="custom-input-group">
            <label>Enter Capital Gain Amount:</label>
            <input
              type="text"
              placeholder="e.g., 15000000"
              value={customGainAmount}
              onChange={(e) => setCustomGainAmount(e.target.value)}
              className="custom-amount-input"
            />
          </div>

          {customScenario && (
            <div className="custom-result">
              <div className="result-grid">
                <div className="result-item">
                  <label>Gain Amount</label>
                  <div className="result-value">{formatCurrency(customScenario.gainAmount)}</div>
                </div>
                <div className="result-item">
                  <label>Coverage</label>
                  <div className="result-value">{customScenario.percentCovered.toFixed(1)}%</div>
                </div>
                <div className="result-item">
                  <label>Tax Savings</label>
                  <div className="result-value highlight">{formatCurrency(customScenario.taxSavings)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison vs REP */}
      <div className="rep-comparison">
        <h4>Your Advantage vs Real Estate Professionals</h4>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className="passive-column">You (Passive Investor)</th>
              <th className="rep-column">REP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Annual Limit on Passive Gains</td>
              <td className="passive-column highlight">
                <span className="unlimited">UNLIMITED</span>
              </td>
              <td className="rep-column">N/A - Can't offset passive gains</td>
            </tr>
            <tr>
              <td>Annual Limit on W-2 Income</td>
              <td className="passive-column">$25,000 (phases out)</td>
              <td className="rep-column">$626,000 (§461(l))</td>
            </tr>
            <tr>
              <td>Complexity</td>
              <td className="passive-column highlight">Simple - Use immediately</td>
              <td className="rep-column">Complex - NOL tracking</td>
            </tr>
            <tr>
              <td>Best For</td>
              <td className="passive-column highlight">Large capital gains events</td>
              <td className="rep-column">High W-2 earners</td>
            </tr>
            <tr>
              <td>Time to Use Losses</td>
              <td className="passive-column highlight">Immediate - All at once</td>
              <td className="rep-column">Multi-year via NOLs</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Strategic Recommendations */}
      <div className="strategic-recommendations">
        <h4>Strategic Tax Planning Recommendations</h4>
        <div className="recommendations-grid">
          <div className="recommendation-card">
            <div className="rec-icon">🎯</div>
            <div className="rec-content">
              <strong>Timing Strategy</strong>
              <p>Concentrate large gains in years when you have HDC losses available.
              You can use all {formatCurrency(capacity.totalPassiveLosses)} immediately.</p>
            </div>
          </div>

          <div className="recommendation-card">
            <div className="rec-icon">📈</div>
            <div className="rec-content">
              <strong>Income Generation</strong>
              <p>Focus on passive income sources: REITs, private equity, hedge funds.
              These can all be offset without limitation.</p>
            </div>
          </div>

          <div className="recommendation-card">
            <div className="rec-icon">💎</div>
            <div className="rec-content">
              <strong>Asset Sales</strong>
              <p>Perfect for stock sales, crypto gains, or business exits.
              No need to spread sales across years like REPs.</p>
            </div>
          </div>

          <div className="recommendation-card">
            <div className="rec-icon">🚀</div>
            <div className="rec-content">
              <strong>Opportunity</strong>
              <p>Consider larger investment in HDC to generate more losses.
              Every $1M invested creates ~$2.5M in losses over 10 years.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <h4>Maximize Your Tax-Free Gains</h4>
        <p>
          With {formatCurrency(capacity.totalPassiveLosses)} in passive losses and no annual limits,
          you have the ultimate flexibility in tax planning. Time your largest gains to coincide
          with your HDC investment for maximum tax efficiency.
        </p>
        <div className="cta-metrics">
          <div className="cta-metric">
            <div className="metric-value">{formatCurrency(capacity.totalPassiveLosses * 0.347)}</div>
            <div className="metric-label">Potential Tax Savings</div>
          </div>
          <div className="cta-metric">
            <div className="metric-value">0%</div>
            <div className="metric-label">Effective Tax Rate on Covered Gains</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassiveCapacityDashboard;