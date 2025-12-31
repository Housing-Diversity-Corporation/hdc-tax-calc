/**
 * Standalone Investments Page
 * Shows all available investment opportunities using existing DealCard components
 */

import React, { useState, useEffect } from 'react';
import { calculatorService, CalculatorConfiguration } from '../../services/calculatorService';
import DealCard from '../InvestmentPortal/deal-explorer/DealCard';
import { DealMatchScore } from '../InvestmentPortal/utils/dealMatching';
import '../../styles/taxbenefits/hdcCalculator.css';

interface InvestmentsStandalonePageProps {
  onViewDeal?: (dealId: string | number) => void;
}

const InvestmentsStandalonePage: React.FC<InvestmentsStandalonePageProps> = ({ onViewDeal }) => {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<CalculatorConfiguration[]>([]);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);

      // Get all configurations from all users (for collaboration)
      const allConfigurations = await calculatorService.getAllConfigurations();

      // Filter for complete configurations that are investor-facing
      const completeDeals = allConfigurations.filter(config =>
        config.completionStatus === 'complete' &&
        config.isInvestorFacing === true
      );

      setDeals(completeDeals);
    } catch (error) {
      console.error('Failed to load investment opportunities:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeal = (dealId: string | number) => {
    if (onViewDeal) {
      onViewDeal(dealId);
    }
  };

  if (loading) {
    return (
      <div className="hdc-calculator-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: 'var(--hdc-faded-jade)' }}>Loading available investments...</h2>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="hdc-calculator-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2 style={{ color: 'var(--hdc-faded-jade)', marginBottom: '1rem' }}>
            No Investments Available
          </h2>
          <p style={{ color: 'var(--hdc-cabbage-pont)', marginBottom: '2rem' }}>
            There are currently no investor-facing deals available. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Create simple match scores for display (without actual matching logic)
  const matches: DealMatchScore[] = deals.map(deal => ({
    dealId: deal.id?.toString() || '',
    deal,
    meetsGoal: true,
    fitScore: 80, // Default fit score
    estimatedInvestment: deal.minimumInvestment || (deal.projectCost * (deal.investorEquityPct / 100)),
    estimatedOffsetAmount: deal.yearOneNOI * (deal.yearOneDepreciationPct / 100),
  }));

  return (
    <div className="hdc-calculator-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="hdc-title" style={{ fontSize: '2.5rem', color: 'var(--hdc-faded-jade)', marginBottom: '1rem' }}>
          Available Investment Opportunities
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--hdc-cabbage-pont)', maxWidth: '800px', margin: '0 auto' }}>
          Explore our curated portfolio of affordable housing investments in Opportunity Zones.
          Each investment offers tax benefits while addressing America's housing shortage.
        </p>
      </div>

      {/* Results Count */}
      <div style={{
        marginBottom: '2rem',
        color: 'var(--hdc-cabbage-pont)',
        fontSize: '1.1rem',
      }}>
        Showing <strong>{deals.length}</strong> investment{deals.length !== 1 ? 's' : ''}
      </div>

      {/* Deal Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
      }}>
        {matches.map(match => (
          <DealCard
            key={match.dealId}
            match={match}
            onClick={() => handleSelectDeal(match.dealId)}
          />
        ))}
      </div>

    </div>
  );
};

export default InvestmentsStandalonePage;