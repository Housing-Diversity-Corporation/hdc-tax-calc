import React from 'react';
import {
  calculateFreeInvestmentTimeline,
  formatTimelineDisplay,
  getTimelineColorClass,
  compareLeverageScenarios,
  generateTimelineInsights
} from '../../../utils/taxbenefits/freeInvestmentTimeline';

interface FreeInvestmentTimelineProps {
  // Core parameters from main calculation
  investorEquity: number;
  hdcUpfrontFee: number;
  year1NetTaxBenefit: number;
  year1OperatingCash: number;
  annualDepreciation: number;
  effectiveTaxRate: number;
  hdcTaxFeeRate: number;
  baseNOI: number;
  noiGrowthRate: number;
  annualDebtService: number;
  aumFee: number;
  includeYear5OZTax: boolean;
  year5OZTaxPayment?: number;
  projectCost: number;

  // Display options
  showDetailedTable?: boolean;
  showScenarioComparison?: boolean;
  showVisualTimeline?: boolean;
}

export const FreeInvestmentTimeline: React.FC<FreeInvestmentTimelineProps> = ({
  investorEquity,
  hdcUpfrontFee,
  year1NetTaxBenefit,
  year1OperatingCash,
  annualDepreciation,
  effectiveTaxRate,
  hdcTaxFeeRate,
  baseNOI,
  noiGrowthRate,
  annualDebtService,
  aumFee,
  includeYear5OZTax,
  year5OZTaxPayment,
  projectCost,
  showDetailedTable = false,
  showScenarioComparison = false,
  showVisualTimeline = true
}) => {
  // Calculate the recovery timeline
  const projection = calculateFreeInvestmentTimeline({
    investorEquity,
    hdcUpfrontFee,
    year1NetTaxBenefit,
    year1OperatingCash,
    annualDepreciation,
    effectiveTaxRate,
    hdcTaxFeeRate,
    baseNOI,
    noiGrowthRate,
    annualDebtService,
    aumFee,
    includeYear5OZTax,
    year5OZTaxPayment
  });

  const insights = generateTimelineInsights(projection);
  const timelineClass = getTimelineColorClass(projection.yearsToFreeInvestment);

  // Calculate leverage scenarios if requested
  const scenarios = showScenarioComparison
    ? compareLeverageScenarios(
        {
          investorEquity,
          hdcUpfrontFee,
          year1NetTaxBenefit,
          year1OperatingCash,
          annualDepreciation,
          effectiveTaxRate,
          hdcTaxFeeRate,
          baseNOI,
          noiGrowthRate,
          annualDebtService,
          aumFee,
          includeYear5OZTax,
          year5OZTaxPayment
        },
        projectCost
      )
    : [];

  return (
    <div className="free-investment-timeline">
      {/* Main Timeline Display */}
      <div className="timeline-header">
        <h3>Path to Free Investment</h3>
        <div className={`timeline-summary ${timelineClass}`}>
          <div className="main-metric">
            {projection.recoveryComplete ? (
              <>
                <span className="years">{Math.floor(projection.yearsToFreeInvestment)}</span>
                {projection.monthsToFreeInvestment > 0 && (
                  <span className="months">.{projection.monthsToFreeInvestment}</span>
                )}
                <span className="label"> years to full recovery</span>
              </>
            ) : (
              <span className="extended">Extended Recovery Period</span>
            )}
          </div>
          <div className="formatted-display">{formatTimelineDisplay(projection)}</div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      {showVisualTimeline && (
        <div className="visual-timeline">
          <div className="timeline-bar">
            <div className="years-track">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(year => {
                const yearData = projection.recoveryByYear.find(y => y.year === year);
                const isComplete = yearData && yearData.percentRecovered >= 100;
                const isRecoveryYear = yearData?.isRecoveryYear;

                return (
                  <div
                    key={year}
                    className={`year-marker ${isComplete ? 'complete' : ''} ${isRecoveryYear ? 'recovery-year' : ''}`}
                  >
                    <div className="year-number">Y{year}</div>
                    <div className="year-percent">
                      {yearData ? `${Math.round(yearData.percentRecovered)}%` : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {projection.recoveryComplete && projection.yearsToFreeInvestment <= 10 && (
              <div
                className="recovery-indicator"
                style={{ left: `${(projection.yearsToFreeInvestment / 10) * 100}%` }}
              >
                <div className="indicator-line" />
                <div className="indicator-label">FREE</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="timeline-insights">
          {insights.map((insight, index) => (
            <div key={index} className="insight">{insight}</div>
          ))}
        </div>
      )}

      {/* Detailed Recovery Table */}
      {showDetailedTable && (
        <div className="recovery-table-container">
          <h4>Year-by-Year Recovery Breakdown</h4>
          <table className="recovery-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Tax Benefits</th>
                <th>Operating Cash</th>
                <th>Annual Total</th>
                <th>Cumulative</th>
                <th>% Recovered</th>
              </tr>
            </thead>
            <tbody>
              {projection.recoveryByYear.slice(0, 10).map(year => (
                <tr
                  key={year.year}
                  className={`${year.percentRecovered >= 100 ? 'complete' : ''} ${year.isRecoveryYear ? 'recovery-year' : ''}`}
                >
                  <td>Year {year.year}</td>
                  <td>${(year.taxBenefits / 1_000_000).toFixed(2)}M</td>
                  <td>${(year.operatingCash / 1_000_000).toFixed(2)}M</td>
                  <td>${(year.annualTotal / 1_000_000).toFixed(2)}M</td>
                  <td>${(year.cumulativeRecovery / 1_000_000).toFixed(2)}M</td>
                  <td>
                    <div className="percent-cell">
                      <div className="percent-bar">
                        <div
                          className="percent-fill"
                          style={{ width: `${Math.min(100, year.percentRecovered)}%` }}
                        />
                      </div>
                      <span className="percent-value">{year.percentRecovered.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projection.recoveryComplete && (
            <div className="recovery-complete-note">
              ✅ Full investment of ${(projection.totalInvestment / 1_000_000).toFixed(2)}M recovered in Year {Math.ceil(projection.yearsToFreeInvestment)}
            </div>
          )}
        </div>
      )}

      {/* Leverage Scenario Comparison */}
      {showScenarioComparison && scenarios.length > 0 && (
        <div className="scenario-comparison">
          <h4>Recovery Timeline by Leverage Level</h4>
          <div className="scenarios-grid">
            {scenarios.map(scenario => {
              const isCurrent = Math.abs(scenario.equityPercent - (investorEquity / projectCost * 100)) < 1;
              return (
                <div
                  key={scenario.name}
                  className={`scenario-card ${isCurrent ? 'current' : ''}`}
                >
                  <div className="scenario-name">{scenario.name}</div>
                  <div className="scenario-equity">{scenario.equityPercent}% Equity</div>
                  <div className="scenario-metrics">
                    <div className="metric">
                      <span className="label">Recovery:</span>
                      <span className="value">
                        {scenario.yearsToRecovery <= 30
                          ? `${scenario.yearsToRecovery.toFixed(1)} years`
                          : 'Extended'}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="label">Year 1:</span>
                      <span className="value">{scenario.year1Coverage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="scenario-bar">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.min(100, (1 / scenario.yearsToRecovery) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="comparison-insight">
            💡 Lower equity percentage dramatically accelerates recovery through leverage amplification
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="timeline-cta">
        {projection.yearsToFreeInvestment <= 3 ? (
          <div className="cta-positive">
            <strong>Exceptional Recovery Timeline!</strong>
            <p>You'll own this property free and clear in just {projection.yearsToFreeInvestment.toFixed(1)} years,
            then enjoy {(10 - projection.yearsToFreeInvestment).toFixed(1)} years of pure profit.</p>
          </div>
        ) : projection.yearsToFreeInvestment <= 5 ? (
          <div className="cta-moderate">
            <strong>Solid Investment Recovery</strong>
            <p>Full recovery in {projection.yearsToFreeInvestment.toFixed(1)} years beats most real estate investments.</p>
          </div>
        ) : (
          <div className="cta-optimize">
            <strong>Consider Optimization</strong>
            <p>Reducing equity percentage or increasing tax benefits could accelerate your recovery timeline.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeInvestmentTimeline;