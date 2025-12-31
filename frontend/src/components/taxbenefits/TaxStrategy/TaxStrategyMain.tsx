import React, { useState, useMemo } from 'react';
import { InvestorAnalysisResults } from '../../../types/taxbenefits';
import DepreciationTimeline from './DepreciationTimeline';
import REPCapacityDashboard from './REPCapacityDashboard';
import PassiveCapacityDashboard from './PassiveCapacityDashboard';
import IRAConversionPlanner from './IRAConversionPlanner';
import CollapsibleSection from '../results/CollapsibleSection';
import './TaxStrategy.css';

interface TaxStrategyMainProps {
  hdcResults: InvestorAnalysisResults | null;
  investorTrack: 'rep' | 'non-rep';
  year1NetBenefit?: number;
  freeInvestmentHurdle?: number;
  onUpdateIRABalance?: (balance: number) => void;
  onUpdateAssetGain?: (gain: number) => void;
  formatCurrency: (value: number) => string;
}

const TaxStrategyMain: React.FC<TaxStrategyMainProps> = ({
  hdcResults,
  investorTrack,
  year1NetBenefit,
  freeInvestmentHurdle,
  onUpdateIRABalance,
  onUpdateAssetGain,
  formatCurrency
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'capacity' | 'planning'>('timeline');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Tax Planning Analysis is always enabled - core feature of HDC calculator
  if (!hdcResults) {
    return (
      <div className="tax-strategy-container">
        <div className="no-data-message">
          <h3>Tax Strategy Analysis</h3>
          <p>Run the HDC Calculator first to see tax planning strategies.</p>
        </div>
      </div>
    );
  }

  // Depreciation schedule should always be available now
  if (!hdcResults.depreciationSchedule) {
    return (
      <div className="tax-strategy-container">
        <div className="no-data-message">
          <h3>Tax Strategy Analysis</h3>
          <p>Calculating tax planning strategies...</p>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!hdcResults.depreciationSchedule) return null;

    const schedule = hdcResults.depreciationSchedule;
    const isREP = investorTrack === 'rep';

    // Determine if it's a free investment in year 1
    // Use the props passed from the main calculator
    const isFreeInvestmentYear1 = year1NetBenefit !== undefined &&
                                  freeInvestmentHurdle !== undefined &&
                                  year1NetBenefit >= freeInvestmentHurdle;

    // Break-even calculation using actual depreciation schedule data
    let breakEvenYear = null;
    if (isFreeInvestmentYear1) {
      breakEvenYear = 1;
    } else if (year1NetBenefit !== undefined && freeInvestmentHurdle !== undefined) {
      const remainingAfterYear1 = freeInvestmentHurdle - year1NetBenefit;

      // Use the actual average benefit from years 2+ if available
      const annualBenefitAfterYear1 = schedule.annualBenefitAfterYear1 || (schedule.averageAnnualBenefit * 0.2);

      if (remainingAfterYear1 <= 0) {
        breakEvenYear = 1;
      } else if (annualBenefitAfterYear1 > 0) {
        const additionalYearsNeeded = remainingAfterYear1 / annualBenefitAfterYear1;
        breakEvenYear = 1 + additionalYearsNeeded;

        // Round to 1 decimal place and cap at 10
        breakEvenYear = Math.min(Math.round(breakEvenYear * 10) / 10, 10);
      } else {
        breakEvenYear = null; // Cannot achieve break-even
      }
    }

    return {
      year1Depreciation: schedule.year1Spike,
      totalDepreciation: schedule.totalDepreciation,
      totalTaxBenefit: schedule.totalNetBenefit,
      avgAnnualBenefit: schedule.averageAnnualBenefit,
      breakEvenYear,

      // REP-specific
      section461lLimit: isREP ? 626_000 : null,
      nolBank: isREP && hdcResults.repTaxCapacity ?
        hdcResults.repTaxCapacity.totalCapacity.nolBank : null,
      iraCapacity: isREP && hdcResults.repTaxCapacity ?
        hdcResults.repTaxCapacity.totalCapacity.iraConversionCapacity : null,

      // Non-REP specific
      unlimitedCapacity: !isREP && hdcResults.nonRepCapacity ?
        hdcResults.nonRepCapacity.totalPassiveLosses : null
    };
  }, [hdcResults, investorTrack]);

  return (
    <CollapsibleSection title={`Tax Strategy Analysis - ${investorTrack === 'rep' ? 'Real Estate Professional' : 'Passive Investor'}`}>
      {/* Tax Planning Summary */}
      {summaryMetrics && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="hdc-result-row">
            <span className="hdc-result-label">Year 1 Depreciation (25% cost seg):</span>
            <span className="hdc-result-value">{formatCurrency(summaryMetrics.year1Depreciation)}</span>
          </div>
          <div className="hdc-result-row">
            <span className="hdc-result-label">Total Tax Benefits (after HDC fees):</span>
            <span className="hdc-result-value">{formatCurrency(summaryMetrics.totalTaxBenefit)}</span>
          </div>
          <div className="hdc-result-row">
            <span className="hdc-result-label">Break-Even Year:</span>
            <span className="hdc-result-value">Year {summaryMetrics.breakEvenYear || 'N/A'}</span>
          </div>

          {investorTrack === 'rep' && summaryMetrics.nolBank !== null && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">NOL Bank (carryforward):</span>
              <span className="hdc-result-value">{formatCurrency(summaryMetrics.nolBank)}</span>
            </div>
          )}

          {investorTrack !== 'rep' && summaryMetrics.unlimitedCapacity !== null && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Passive Loss Capacity (NO LIMIT):</span>
              <span className="hdc-result-value" style={{ color: 'var(--hdc-cabbage-pont)' }}>
                {formatCurrency(summaryMetrics.unlimitedCapacity)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem',
        borderBottom: '2px solid var(--hdc-mercury)',
        marginBottom: '1rem'
      }}>
        <button
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'timeline' ? 'var(--hdc-faded-jade)' : 'transparent',
            color: activeTab === 'timeline' ? 'white' : 'var(--hdc-slate-gray)',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'timeline' ? 600 : 400
          }}
          onClick={() => setActiveTab('timeline')}
        >
          Depreciation Timeline
        </button>
        <button
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'capacity' ? 'var(--hdc-faded-jade)' : 'transparent',
            color: activeTab === 'capacity' ? 'white' : 'var(--hdc-slate-gray)',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'capacity' ? 600 : 400
          }}
          onClick={() => setActiveTab('capacity')}
        >
          Tax Capacity
        </button>
        <button
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'planning' ? 'var(--hdc-faded-jade)' : 'transparent',
            color: activeTab === 'planning' ? 'white' : 'var(--hdc-slate-gray)',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'planning' ? 600 : 400
          }}
          onClick={() => setActiveTab('planning')}
        >
          Planning Tools
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1rem 0' }}>
        {activeTab === 'timeline' && hdcResults.depreciationSchedule && (
          <DepreciationTimeline
            schedule={hdcResults.depreciationSchedule}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'capacity' && (
          <>
            {investorTrack === 'rep' && hdcResults.repTaxCapacity ? (
              <REPCapacityDashboard
                capacity={hdcResults.repTaxCapacity}
                formatCurrency={formatCurrency}
              />
            ) : hdcResults.nonRepCapacity ? (
              <PassiveCapacityDashboard
                capacity={hdcResults.nonRepCapacity}
                formatCurrency={formatCurrency}
              />
            ) : (
              <div className="no-data-message">
                <p>Tax capacity data not available.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'planning' && (
          <div className="planning-tools-container">
            {investorTrack === 'rep' && (
              <IRAConversionPlanner
                conversionPlan={hdcResults.iraConversionPlan}
                repCapacity={hdcResults.repTaxCapacity}
                onUpdateIRABalance={onUpdateIRABalance}
                formatCurrency={formatCurrency}
              />
            )}

            {investorTrack !== 'rep' && (
              <div className="passive-planning-message">
                <h3>Passive Investor Advantages</h3>
                <ul>
                  <li>✅ Unlimited passive gain offset capability</li>
                  <li>✅ No §461(l) limitations</li>
                  <li>✅ Immediate full utilization available</li>
                  <li>✅ Perfect for stock sales, crypto gains, fund distributions</li>
                </ul>
                <div className="recommendation-box">
                  <strong>Recommendation:</strong> Time your largest capital gains events
                  to maximize the value of your {formatCurrency(hdcResults.nonRepCapacity?.totalPassiveLosses || 0)} in passive losses.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className={`section-card insights ${expandedSections.has('insights') ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('insights')}>
          <h3>💡 Key Insights</h3>
          <span className="toggle-icon">{expandedSections.has('insights') ? '−' : '+'}</span>
        </div>

        {expandedSections.has('insights') && (
          <div className="section-content">
            {investorTrack === 'rep' ? (
              <ul className="insights-list">
                <li>Your §461(l) limitation caps annual W-2 offset at $626,000</li>
                <li>Excess losses become NOLs for future use - you're building a {formatCurrency(summaryMetrics?.nolBank || 0)} tax bank</li>
                <li>Consider IRA conversions to maximize current year capacity</li>
                <li>Business income can be offset without limitation</li>
              </ul>
            ) : (
              <ul className="insights-list">
                <li>You have NO LIMIT on offsetting passive gains - this is your superpower</li>
                <li>Can eliminate taxes on {formatCurrency(summaryMetrics?.unlimitedCapacity || 0)} in gains immediately</li>
                <li>Perfect for large stock sales, fund distributions, or crypto gains</li>
                <li>No waiting, no carryforward complexity - use it all today</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default TaxStrategyMain;