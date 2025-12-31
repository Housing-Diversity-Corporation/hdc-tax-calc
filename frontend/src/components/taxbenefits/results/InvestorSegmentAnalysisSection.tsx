import React, { useState, useMemo } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { CONFORMING_STATES } from '../../../utils/taxbenefits/constants';

interface InvestorSegmentAnalysisSectionProps {
  // Current investor settings
  investorTrack?: 'rep' | 'non-rep';
  passiveGainType?: 'short-term' | 'long-term';

  // Key inputs
  projectCost: number;
  investorEquityAmount: number;
  holdPeriod: number;
  yearOneDepreciationPct: number;

  // Tax rates
  federalOrdinaryRate: number;
  stateOrdinaryRate: number;
  federalCapitalGainsRate: number;
  stateCapitalGainsRate: number;
  selectedState: string;

  // OZ Parameters
  ozType: 'standard' | 'rural';
  deferredCapitalGains: number;

  // HDC Parameters
  hdcFeeRate: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;

  // Results from main calculation
  totalTaxBenefits?: number;
  investorIRR?: number;
  hdcTotalFees?: number;
}

const InvestorSegmentAnalysisSection: React.FC<InvestorSegmentAnalysisSectionProps> = ({
  investorTrack = 'rep',
  passiveGainType = 'short-term',
  projectCost,
  investorEquityAmount,
  holdPeriod,
  yearOneDepreciationPct,
  federalOrdinaryRate,
  stateOrdinaryRate,
  federalCapitalGainsRate,
  stateCapitalGainsRate,
  selectedState,
  ozType,
  deferredCapitalGains,
  hdcFeeRate,
  aumFeeEnabled,
  aumFeeRate,
  totalTaxBenefits = 0,
  investorIRR = 0,
  hdcTotalFees = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const NIIT_RATE = 3.8;
  const SECTION_461L_LIMIT = 626000;

  // Check if state is conforming (adds state benefits for passive gains)
  const isConformingState = selectedState && selectedState !== 'NONE' && selectedState !== 'CUSTOM';

  // Calculate metrics for each segment in the strategic value hierarchy
  const valueSegments = useMemo(() => {
    const segments = [];

    // Ensure we have valid values with fallbacks
    const validProjectCost = projectCost || 0;
    const validYearOneDepreciationPct = yearOneDepreciationPct || 5;
    const validHdcFeeRate = hdcFeeRate || 10;

    // Get state rates - if stateOrdinaryRate is 0 or undefined, try to get from CONFORMING_STATES
    let validStateOrdinaryRate = stateOrdinaryRate || 0;
    let validStateCapitalGainsRate = stateCapitalGainsRate || 0;

    // If rates are 0 but we have a selected state, get rates from constants
    if (selectedState && CONFORMING_STATES[selectedState]) {
      validStateOrdinaryRate = stateOrdinaryRate || CONFORMING_STATES[selectedState].rate;
      validStateCapitalGainsRate = stateCapitalGainsRate || CONFORMING_STATES[selectedState].rate;
    }

    const validFederalOrdinaryRate = federalOrdinaryRate || 37;

    // Calculate depreciation benefit for Year 1
    const depreciableBasis = validProjectCost * 0.8; // Assuming 80% is depreciable
    const yearOneDepreciation = depreciableBasis * (validYearOneDepreciationPct / 100);

    // Tier 1: Short-term passive gains in conforming states (51.7% in NY)
    if (isConformingState) {
      const stPassiveRate = 37 + NIIT_RATE + validStateOrdinaryRate; // e.g., 51.7% in NY
      const stPassiveBenefit = yearOneDepreciation * (stPassiveRate / 100);
      const stPassiveHDCFee = stPassiveBenefit * (validHdcFeeRate / 100);

      segments.push({
        tier: 1,
        label: 'Non-REP: Short-Term Passive (Conforming State)',
        description: `${stPassiveRate.toFixed(1)}% rate - Highest value`,
        effectiveRate: stPassiveRate,
        yearOneBenefit: stPassiveBenefit,
        hdcFeeYear1: stPassiveHDCFee,
        limitations: 'None - Unlimited passive gain offset',
        viabilityScore: 100,
        viabilityColor: 'var(--hdc-cabbage-pont)',
        viabilityLabel: 'OPTIMAL'
      });
    }

    // Tier 2: REPs with ordinary income (47.9% with state)
    const repRate = validFederalOrdinaryRate + validStateOrdinaryRate;
    const repBenefit = yearOneDepreciation * (repRate / 100);
    const repHDCFee = repBenefit * (validHdcFeeRate / 100);

    segments.push({
      tier: 2,
      label: 'REP: Active Losses vs Ordinary Income',
      description: `${repRate.toFixed(1)}% rate - Complex qualification`,
      effectiveRate: repRate,
      yearOneBenefit: repBenefit,
      hdcFeeYear1: repHDCFee,
      limitations: `§461(l): $${(SECTION_461L_LIMIT / 1000).toFixed(0)}K cap vs W-2`,
      viabilityScore: 85,
      viabilityColor: 'var(--hdc-cabbage-pont)',
      viabilityLabel: 'HIGH'
    });

    // Tier 2.5: Short-term passive gains (federal only) - 40.8%
    const stPassiveFedRate = 37 + NIIT_RATE;
    const stPassiveFedBenefit = yearOneDepreciation * (stPassiveFedRate / 100);
    const stPassiveFedHDCFee = stPassiveFedBenefit * (validHdcFeeRate / 100);

    segments.push({
      tier: 2.5,
      label: 'Non-REP: Short-Term Passive (Federal Only)',
      description: `${stPassiveFedRate.toFixed(1)}% rate - No state benefit`,
      effectiveRate: stPassiveFedRate,
      yearOneBenefit: stPassiveFedBenefit,
      hdcFeeYear1: stPassiveFedHDCFee,
      limitations: 'None - Unlimited passive gain offset',
      viabilityScore: 75,
      viabilityColor: 'var(--hdc-muesli)',
      viabilityLabel: 'GOOD'
    });

    // Tier 3: Long-term passive gains in conforming states (34.7% in NY)
    if (isConformingState) {
      const ltPassiveRate = 20 + NIIT_RATE + validStateCapitalGainsRate;
      const ltPassiveBenefit = yearOneDepreciation * (ltPassiveRate / 100);
      const ltPassiveHDCFee = ltPassiveBenefit * (validHdcFeeRate / 100);

      segments.push({
        tier: 3,
        label: 'Non-REP: Long-Term Passive (Conforming State)',
        description: `${ltPassiveRate.toFixed(1)}% rate - Volume market`,
        effectiveRate: ltPassiveRate,
        yearOneBenefit: ltPassiveBenefit,
        hdcFeeYear1: ltPassiveHDCFee,
        limitations: 'None - Unlimited passive gain offset',
        viabilityScore: 60,
        viabilityColor: 'var(--hdc-muesli)',
        viabilityLabel: 'MODERATE'
      });
    }

    // Tier 4: Long-term passive gains (federal only) - 23.8%
    const ltPassiveFedRate = 20 + NIIT_RATE;
    const ltPassiveFedBenefit = yearOneDepreciation * (ltPassiveFedRate / 100);
    const ltPassiveFedHDCFee = ltPassiveFedBenefit * (validHdcFeeRate / 100);

    segments.push({
      tier: 4,
      label: 'Non-REP: Long-Term Passive (Federal Only)',
      description: `${ltPassiveFedRate.toFixed(1)}% rate - Minimum viable`,
      effectiveRate: ltPassiveFedRate,
      yearOneBenefit: ltPassiveFedBenefit,
      hdcFeeYear1: ltPassiveFedHDCFee,
      limitations: 'None - Unlimited passive gain offset',
      viabilityScore: 40,
      viabilityColor: 'var(--hdc-brown-rust)',
      viabilityLabel: 'MARGINAL'
    });

    return segments;
  }, [
    projectCost, yearOneDepreciationPct, federalOrdinaryRate, stateOrdinaryRate,
    stateCapitalGainsRate, hdcFeeRate, isConformingState
  ]);

  // Find current configuration in hierarchy
  const getCurrentTier = () => {
    if (investorTrack === 'rep') {
      return valueSegments.find(s => s.tier === 2);
    } else {
      const isShortTerm = passiveGainType === 'short-term';
      if (isConformingState) {
        return valueSegments.find(s => s.tier === (isShortTerm ? 1 : 3));
      } else {
        return valueSegments.find(s => s.tier === (isShortTerm ? 2.5 : 4));
      }
    }
  };

  const currentTier = getCurrentTier();

  return (
    <div className="hdc-section">
      <h3
        className="hdc-section-header"
        style={{ cursor: 'pointer', position: 'relative' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ marginRight: '0.5rem' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        Strategic Value Hierarchy
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 'normal',
          marginLeft: '1rem',
          color: 'var(--hdc-faded-jade)'
        }}>
          HDC go-to-market prioritization by tax elimination value
        </span>
      </h3>

      {isExpanded && (
        <>
          {/* Current configuration highlight */}
          {currentTier && (
            <div style={{
              padding: '1rem',
              border: '2px solid var(--hdc-faded-jade)',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--hdc-faded-jade)' }}>
                  Current Configuration:
                </span>
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--hdc-faded-jade)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  TIER {currentTier.tier}
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {currentTier.label}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--hdc-slate-gray)' }}>
                Effective Rate: {currentTier.effectiveRate.toFixed(1)}% • {currentTier.limitations}
              </div>
            </div>
          )}

          {/* Strategic Value Hierarchy Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--hdc-mercury)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    Tier
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    Investor Profile
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                    Tax Rate
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                    Year 1 Benefit
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                    HDC Fee
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    Limitations
                  </th>
                </tr>
              </thead>
              <tbody>
                {valueSegments.map(segment => (
                  <tr
                    key={segment.tier}
                    style={{
                      borderBottom: '1px solid var(--hdc-mercury)'
                    }}
                    className={currentTier?.tier === segment.tier ? 'font-semibold' : ''}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {segment.tier}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: currentTier?.tier === segment.tier ? 600 : 400 }}>
                        {segment.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--hdc-slate-gray)' }}>
                        {segment.description}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      {segment.effectiveRate.toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      ${Math.round(segment.yearOneBenefit * 1000000).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      ${Math.round(segment.hdcFeeYear1 * 1000000).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                      {segment.limitations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Strategic Insights */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'var(--hdc-pale-mint)',
            borderRadius: '8px'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--hdc-faded-jade)',
              marginBottom: '0.75rem'
            }}>
              Strategic Go-to-Market Insights
            </h4>

            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}>
              <li>
                <strong>Tier 1 Priority:</strong> Non-REP investors with short-term passive gains in
                NY/NJ/DC/OR achieve {(37 + NIIT_RATE + 10.9).toFixed(1)}% tax elimination - highest value segment
              </li>
              <li>
                <strong>REP Complexity:</strong> While offering {((federalOrdinaryRate || 37) + (stateOrdinaryRate || 0)).toFixed(1)}% rates,
                REP qualification and §461(l) limitations add operational complexity
              </li>
              <li>
                <strong>Volume Opportunity:</strong> Long-term passive gains in conforming states
                ({(20 + NIIT_RATE + (stateCapitalGainsRate || 0)).toFixed(1)}%) represent large market with moderate margins
              </li>
              <li>
                <strong>Geographic Focus:</strong> Prioritize high-tax conforming states (NY, NJ, DC, OR)
                for maximum state tax benefit capture
              </li>
              <li>
                <strong>Minimum Threshold:</strong> Federal-only long-term passive ({(20 + NIIT_RATE).toFixed(1)}%)
                may require adjusted fee structures or minimum investment sizes
              </li>
            </ul>
          </div>

          {/* HDC Revenue Projection by Tier */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            border: '1px solid var(--hdc-mercury)',
            borderRadius: '4px'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--hdc-faded-jade)',
              marginBottom: '0.5rem'
            }}>
              HDC Revenue Potential (10-Year)
            </h4>
            <div className="hdc-result-row">
              <span className="hdc-result-label">
                Tier 1 (51.7% rate):
              </span>
              <span className="hdc-result-value">
                ${Math.round((valueSegments[0]?.hdcFeeYear1 || 0) * holdPeriod * 0.7 * 1000000).toLocaleString()}
              </span>
            </div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">
                Tier 2 (REP):
              </span>
              <span className="hdc-result-value">
                ${Math.round((valueSegments.find(s => s.tier === 2)?.hdcFeeYear1 || 0) * holdPeriod * 0.7 * 1000000).toLocaleString()}
              </span>
            </div>
            {aumFeeEnabled && (
              <div className="hdc-result-row" style={{
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--hdc-mercury)'
              }}>
                <span className="hdc-result-label">
                  + AUM Fees ({aumFeeRate}% annually):
                </span>
                <span className="hdc-result-value">
                  ${Math.round(investorEquityAmount * 1000000 * (aumFeeRate / 100) * holdPeriod).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InvestorSegmentAnalysisSection;