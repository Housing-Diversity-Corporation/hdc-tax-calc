/**
 * Standalone Investments Page
 * Shows all available investment opportunities using existing DealCard components
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import { calculatorService, CalculatorConfiguration } from '../../../services/taxbenefits/calculatorService';

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
      <div className="w-full h-full overflow-auto">
        <div className="w-[85vw] md:w-[95vw] md:max-w-7xl mx-auto py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="w-full h-full overflow-auto">
        <div className="w-[85vw] md:w-[95vw] md:max-w-4xl mx-auto py-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-[var(--hdc-faded-jade)]">
                No Investments Available
              </CardTitle>
              <CardDescription className="text-lg">
                There are currently no investor-facing deals available. Please check back soon.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="w-[85vw] md:w-[95vw] md:max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[var(--hdc-faded-jade)] mb-4">
          Available Investment Opportunities
        </h1>
        <p className="text-lg text-[var(--hdc-cabbage-pont)] max-w-3xl mx-auto">
          Explore our curated portfolio of affordable housing investments in Opportunity Zones.
          Each investment offers tax benefits while addressing America's housing shortage.
        </p>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-lg text-[var(--hdc-cabbage-pont)]">
          Showing <strong>{deals.length}</strong> investment{deals.length !== 1 ? 's' : ''}
        </span>
        <Badge variant="secondary" className="text-sm">
          {deals.length} Active
        </Badge>
      </div>

      {/* Deal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {deals.map(deal => (
          <Card
            key={deal.id}
            className="hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Project Image */}
            <div
              className="relative h-[200px] flex items-center justify-center text-white text-xl font-semibold"
              style={{
                background: deal.dealImageUrl
                  ? `url(${deal.dealImageUrl}) center/cover`
                  : 'linear-gradient(135deg, var(--hdc-faded-jade) 0%, var(--hdc-gulf-stream) 100%)'
              }}
            >
              {!deal.dealImageUrl && (
                <div className="text-center px-4">
                  {deal.configurationName || 'HDC Investment'}
                </div>
              )}

              {/* Status Badge */}
              {deal.projectStatus && (
                <Badge
                  variant={deal.projectStatus === 'available' ? 'default' : 'secondary'}
                  className="absolute top-4 right-4 uppercase text-xs"
                >
                  {deal.projectStatus}
                </Badge>
              )}
            </div>

            <CardHeader>
              <CardTitle className="text-xl text-[var(--hdc-faded-jade)]">
                {deal.configurationName || `Project ${deal.id}`}
              </CardTitle>
              <CardDescription className="h-[48px] flex items-center border border-gray-200 rounded-md px-3 py-2 mt-2">
                {deal.dealLocation || deal.projectLocation || 'Location TBD'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deal Description - fixed height to maintain card alignment */}
              <div
                className="h-[72px] mb-2 p-3 rounded-lg border border-gray-200 overflow-y-auto hover:overflow-y-auto"
                onWheel={(e) => {
                  const element = e.currentTarget;
                  const isScrollable = element.scrollHeight > element.clientHeight;
                  if (isScrollable) {
                    e.stopPropagation();
                  }
                }}
              >
                {deal.dealDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed break-words">
                    {deal.dealDescription}
                  </p>
                )}
              </div>

              {/* Housing Impact */}
              {deal.units && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--hdc-sushi)]/40">
                  <span className="text-2xl">🏘️</span>
                  <div>
                    <div className="font-semibold text-[var(--hdc-sushi)]">
                      {deal.units} Units
                    </div>
                    {deal.affordabilityMix && (
                      <div className="text-xs text-muted-foreground">
                        {deal.affordabilityMix}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Project Cost:</span>
                  <span className="font-semibold">${deal.projectCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min. Investment:</span>
                  <span className="font-semibold">
                    ${(deal.minimumInvestment || (deal.projectCost * (deal.investorEquityPct / 100))).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year 1 NOI:</span>
                  <span className="font-semibold">${deal.yearOneNOI.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Investor Equity:</span>
                  <span className="font-semibold">{deal.investorEquityPct}%</span>
                </div>
              </div>
              <div className="pt-2">
                <Badge
                  variant="default"
                  className="w-full justify-center py-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleSelectDeal(deal.id || '')}
                >
                  View Details
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
};

export default InvestmentsStandalonePage;