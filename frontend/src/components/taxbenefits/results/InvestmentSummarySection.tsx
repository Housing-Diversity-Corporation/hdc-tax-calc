import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface InvestmentSummarySectionProps {
  investorEquity: number;
  syndicatedEquityOffset?: number; // IMPL-046: State LIHTC syndication offset
  hdcFee: number;
  formatCurrency: (value: number) => string;
  compact?: boolean; // Optional prop to use compact layout
}

const InvestmentSummarySection: React.FC<InvestmentSummarySectionProps> = ({
  investorEquity,
  syndicatedEquityOffset = 0,
  hdcFee,
  formatCurrency,
  compact = false
}) => {
  // IMPL-046: Calculate net equity after syndication offset
  const hasOffset = syndicatedEquityOffset > 0;
  const netEquity = investorEquity - syndicatedEquityOffset;
  // Total investment uses net equity (matches MOIC denominator)
  const totalInvestment = netEquity + hdcFee;

  // Use compact layout only when explicitly requested
  if (compact) {
    return (
      <div className="hdc-section" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.25rem',
          paddingBottom: '0.25rem',
          borderBottom: '2px solid var(--hdc-gulf-stream)'
        }}>
          <h3 className="hdc-section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0, fontSize: '0.95rem' }}>Investment Amount</h3>
          <span style={{
            fontSize: '1rem',
            color: 'var(--hdc-brown-rust)',
            fontWeight: 700
          }}>{formatCurrency(totalInvestment)}</span>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          gap: '0.5rem'
        }}>
          {/* IMPL-046: Show offset breakdown when active */}
          {hasOffset ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.25rem 0',
              }}>
                <span style={{ fontSize: '0.85rem' }}>OZ Equity Required:</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatCurrency(investorEquity)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.25rem 0',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--hdc-faded-jade)' }}>State LIHTC Offset:</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--hdc-faded-jade)' }}>
                  ({formatCurrency(syndicatedEquityOffset)})
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.25rem 0',
                borderTop: '1px dashed var(--hdc-oslo-gray)',
                marginTop: '0.25rem',
                paddingTop: '0.5rem',
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Net Investor Equity:</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(netEquity)}</span>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.25rem 0',
            }}>
              <span style={{ fontSize: '0.85rem' }}>Investor Equity:</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatCurrency(investorEquity)}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.25rem 0'
          }}>
            <span style={{ fontSize: '0.85rem' }}>HDC Fee:</span>
            <span style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: hdcFee < 0 ? '#d32f2f' : 'inherit'
            }}>
              {hdcFee < 0 ? '-' : ''}{formatCurrency(Math.abs(hdcFee))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Original layout for normal OZ benefit calculator
  return (
    <div className="hdc-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', paddingBottom: '0.375rem', borderBottom: '2px solid var(--hdc-gulf-stream)' }}>
        <h3 className="hdc-section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Investment Amount</h3>
        <span style={{
          fontSize: '1.125rem',
          color: 'var(--hdc-brown-rust)',
          fontWeight: 700
        }}>{formatCurrency(totalInvestment)}</span>
      </div>
      <div style={{ paddingTop: '0.5rem' }}>
        {/* IMPL-046: Show offset breakdown when active */}
        {hasOffset ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem' }}>OZ Equity Required:</span>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{formatCurrency(investorEquity)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--hdc-faded-jade)' }}>State LIHTC Offset:</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--hdc-faded-jade)' }}>
                ({formatCurrency(syndicatedEquityOffset)})
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
              borderTop: '1px dashed var(--hdc-oslo-gray)',
              paddingTop: '0.5rem',
              marginTop: '0.25rem'
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Net Investor Equity:</span>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(netEquity)}</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.95rem' }}>Investor Equity:</span>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{formatCurrency(investorEquity)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.95rem' }}>HDC Fee:</span>
          <span style={{
            fontWeight: 600,
            fontSize: '1rem',
            color: hdcFee < 0 ? '#d32f2f' : 'inherit'
          }}>
            {hdcFee < 0 ? '-' : ''}{formatCurrency(Math.abs(hdcFee))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummarySection;
