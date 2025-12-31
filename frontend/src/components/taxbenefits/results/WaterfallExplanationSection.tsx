import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface WaterfallExplanationSectionProps {
  investorPromoteShare: number;
  yearOneDepreciationPct?: number;
}

const WaterfallExplanationSection: React.FC<WaterfallExplanationSectionProps> = ({
  investorPromoteShare,
  yearOneDepreciationPct = 20
}) => {
  const [expanded, setExpanded] = useState(false);
  const hdcPromoteShare = 100 - investorPromoteShare;

  return (
    <div className="hdc-section">
      <h3
        className="hdc-section-header"
        style={{ cursor: 'pointer', position: 'relative' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ marginRight: '0.5rem' }}>
          {expanded ? '▼' : '▶'}
        </span>
        Waterfall Distribution Logic
      </h3>
      
      {expanded && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            padding: '0.75rem 0',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            <h4 style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: 'var(--hdc-cabbage-pont)',
              marginBottom: '0.75rem' 
            }}>
              How Distributions Work
            </h4>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>Key Principles:</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>
                1. HDC takes a 10% fee on all gross tax benefits generated<br/>
                2. After HDC's fee, tax benefits ALWAYS go 100% to the investor (never split by promote)<br/>
                3. Only operating cash flows and exit proceeds are subject to promote splits<br/>
                4. Tax benefits count toward equity recovery but are not split after recovery
              </p>
            </div>

            <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px' }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>Understanding HDC's 10% Fee:</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                HDC's fee is 10% of the <strong>tax benefits</strong>, not the depreciation losses:<br/>
                • Depreciation creates non-cash accounting losses (e.g., $47M)<br/>
                • These losses generate real tax savings: $47M × 47.9% tax rate = $22.5M cash benefit<br/>
                • HDC takes 10% of the benefit: $22.5M × 10% = $2.25M<br/>
                • Investor keeps 90%: $20.25M net tax savings<br/>
                <span style={{ fontStyle: 'italic', color: 'var(--hdc-faded-jade)' }}>
                  This fee structure allows HDC to monetize tax benefits while investors retain the majority of the value.
                </span>
              </p>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>Phase 1: Return of Capital (Free Investment)</strong>
              <ul style={{ margin: '0.25rem 0 0 1.5rem', padding: 0 }}>
                <li>Investor receives 100% of net tax benefits (after HDC fee)</li>
                <li>Investor receives 100% of operating cash flows</li>
                <li>Continues until investor's equity is fully recovered</li>
                <li>HDC earns only their 10% fee on tax benefits during this phase</li>
              </ul>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>Phase 2: HDC Catch-up (if applicable)</strong>
              <ul style={{ margin: '0.25rem 0 0 1.5rem', padding: 0 }}>
                <li>Only if HDC deferred fees during Phase 1</li>
                <li>HDC receives 100% of operating cash until caught up</li>
                <li>Tax benefits still go 100% to investor</li>
              </ul>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>Phase 3: Normal Promote Split</strong>
              <ul style={{ margin: '0.25rem 0 0 1.5rem', padding: 0 }}>
                <li>After recovery & catch-up, operating cash splits {investorPromoteShare}% / {hdcPromoteShare}%</li>
                <li>Tax benefits remain 100% to investor (never split)</li>
                <li>Exit proceeds split {investorPromoteShare}% / {hdcPromoteShare}%</li>
                <li>Year 5 OZ tax payment reduces investor's cash flow</li>
              </ul>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>Subordinated Debt Repayment (at Exit)</strong>
              <ul style={{ margin: '0.25rem 0 0 1.5rem', padding: 0 }}>
                <li>HDC Sub Debt: Repaid with compounded PIK interest</li>
                <li>Investor Sub Debt: Returns to investor with interest</li>
                <li>Outside Investor Sub Debt: Repaid to third parties</li>
                <li>All sub debt paid before equity distributions</li>
              </ul>
            </div>


            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.25rem',
              borderLeft: '3px solid var(--hdc-cabbage-pont)'
            }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--hdc-cabbage-pont)' }}>
                Example: $100M Project, 95% Leverage
              </strong>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <div><strong>Year 1:</strong></div>
                <div>• Depreciation Loss: $22.5M ({yearOneDepreciationPct}% of $90M building)</div>
                <div>• Tax Rate: 47.9% (37% Fed + 10.9% NY)</div>
                <div>• Gross Tax Benefit: $22.5M × 47.9% = $10.78M cash savings</div>
                <div>• HDC Fee (10% of benefit): $1.08M</div>
                <div>• Net Tax Benefit to Investor: $9.70M (100% to investor)</div>
                <div>• Investor Equity: $5M</div>
                <div>• Operating Cash: $500k</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Result:</strong> Equity fully recovered ($9.70M + $0.5M &gt; $5M)
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Year 2+ Distribution:</strong>
                </div>
                <div>• Tax Benefits: 100% to investor (after HDC 10% fee)</div>
                <div>• Operating Cash: {investorPromoteShare}% to Investor / {hdcPromoteShare}% to HDC</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Year 5 Special:</strong> OZ tax payment (~$1.56M) paid by investor
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Exit:</strong> Proceeds split {investorPromoteShare}% / {hdcPromoteShare}%
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '1rem',
              fontSize: '0.8rem',
              fontStyle: 'italic',
              color: 'var(--hdc-faded-jade)'
            }}>
              <strong>Critical:</strong> Tax benefits are never split by promote because they represent
              the investor's personal tax savings. HDC monetizes these benefits through their 10% fee only.
              This structure enables "free investment" where tax benefits can fully recover equity in Year 1.
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.25rem',
              borderLeft: '3px solid var(--hdc-brown-rust)',
              fontSize: '0.85rem'
            }}>
              <strong style={{ color: 'var(--hdc-brown-rust)' }}>About Tax Calculation Details:</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                The "Tax Calculation Details" section above always displays the 10-year depreciation schedule 
                for standardized comparison, even when your hold period is longer. This is because:
              </p>
              <ul style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.8rem', padding: 0 }}>
                <li>Most tax benefit value is captured in the first 10 years</li>
                <li>It provides a consistent benchmark for comparing different deals</li>
                <li>Year 1 bonus depreciation ({yearOneDepreciationPct}%) plus 9 years of straight-line captures the bulk of benefits</li>
                <li>Full depreciation continues for 27.5 years (residential) regardless of display</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterfallExplanationSection;