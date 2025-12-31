import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { investorTaxInfoService } from '../../../services/api';
import { InvestorTaxInfo } from '../../../types/investorTaxInfo';
import { HDC_OZ_STRATEGY } from '../../../utils/taxbenefits/hdcOzStrategy';
import { doesNIITApply } from '../../../utils/taxbenefits/stateData';

interface ReadOnlyTaxDisplayProps {
  onNavigateToTaxProfile: () => void;
}

const ReadOnlyTaxDisplay: React.FC<ReadOnlyTaxDisplayProps> = ({ onNavigateToTaxProfile }) => {
  const [loading, setLoading] = useState(true);
  const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);

  const NIIT_RATE = 3.8;

  useEffect(() => {
    loadTaxProfile();
  }, []);

  const loadTaxProfile = async () => {
    try {
      setLoading(true);
      const profiles = await investorTaxInfoService.getUserTaxInfo();

      // Load default profile or first available
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      setTaxProfile(defaultProfile || null);
    } catch (error) {
      console.error('Error loading tax profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tax Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Loading tax profile...
        </CardContent>
      </Card>
    );
  }

  if (!taxProfile) {
    return (
      <Card className="border-2 border-yellow-400 bg-yellow-50">
        <CardHeader>
          <CardTitle>No Tax Profile Found</CardTitle>
          <CardDescription>
            Please create a tax profile to ensure consistent calculations across all tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={onNavigateToTaxProfile}
            className="bg-[var(--hdc-cabbage-pont)] hover:bg-[var(--hdc-cabbage-pont)]/90"
          >
            Create Tax Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectedJurisdiction = HDC_OZ_STRATEGY[taxProfile.selectedState || ''];
  const isNonConforming = taxProfile.selectedState && selectedJurisdiction?.status === 'NO_GO';
  const niitRate = doesNIITApply(taxProfile.selectedState || '') ? NIIT_RATE : 0;

  // Calculate effective rate
  const effectiveRate = (() => {
    if (taxProfile.investorTrack === 'rep') {
      return (taxProfile.federalOrdinaryRate || 0) + (isNonConforming ? 0 : (taxProfile.stateOrdinaryRate || 0));
    } else {
      if (taxProfile.passiveGainType === 'short-term') {
        return 37 + niitRate + (isNonConforming ? 0 : (taxProfile.stateOrdinaryRate || 0));
      } else {
        return 20 + niitRate + (isNonConforming ? 0 : (taxProfile.stateCapitalGainsRate || 0));
      }
    }
  })();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tax Profile</CardTitle>
          <Button
            onClick={onNavigateToTaxProfile}
            variant="outline"
            className="border-[var(--hdc-cabbage-pont)] text-[var(--hdc-cabbage-pont)]"
            size="sm"
          >
            Edit Tax Profile
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Investor Type */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Investor Type
          </div>
          <div className="font-semibold text-lg">
            {taxProfile.investorTrack === 'rep' ? 'Real Estate Professional (REP)' : 'Non-REP Investor'}
          </div>
          {taxProfile.investorTrack === 'non-rep' && (
            <div className="text-sm text-muted-foreground mt-1">
              Offsetting {taxProfile.passiveGainType === 'short-term' ? 'Short-Term' : 'Long-Term'} Passive Gains
            </div>
          )}
        </div>

        {/* State/Territory */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            State/Territory
          </div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-lg">
              {selectedJurisdiction?.name || taxProfile.selectedState}
            </div>
            <Badge variant={isNonConforming ? 'destructive' : 'default'}>
              {isNonConforming ? 'Non-conforming' : 'OZ Conforming'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Tax Rates Breakdown */}
        <div>
          <div className="text-sm font-semibold mb-3 text-muted-foreground">
            Tax Rate Breakdown
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Federal Rate:</span>
              <span className="font-medium">
                {taxProfile.investorTrack === 'rep' ? `${taxProfile.federalOrdinaryRate}%` :
                 taxProfile.passiveGainType === 'short-term' ? '37.0%' : '20.0%'}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">State Rate:</span>
              <span className="font-medium">
                {isNonConforming ? (
                  <span className="text-muted-foreground italic">0.0% (Non-conforming)</span>
                ) : (
                  `${(taxProfile.stateOrdinaryRate || 0).toFixed(1)}%`
                )}
              </span>
            </div>

            {taxProfile.investorTrack === 'non-rep' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NIIT:</span>
                <span className="font-medium">
                  {niitRate > 0 ? `${NIIT_RATE}%` :
                   <span className="text-muted-foreground italic">0.0% (Territory)</span>}
                </span>
              </div>
            )}

            <Separator className="my-3" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-[var(--hdc-strikemaster)]">Effective Tax Rate:</span>
              <span className="text-2xl font-bold text-[var(--hdc-cabbage-pont)]">
                {effectiveRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* OZ Configuration */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            OZ Type
          </div>
          <div className="font-semibold">
            {taxProfile.ozType === 'rural' ? 'Rural OZ / QROF (30% step-up)' : 'Standard Opportunity Zone (10% step-up)'}
          </div>
        </div>

        {/* Capital Gains Tax Rate for OZ */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-1">
            OZ Capital Gains Tax Rate
          </div>
          <div className="font-semibold text-lg">
            {(taxProfile.capitalGainsTaxRate || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Fed: {taxProfile.federalCapitalGainsRate}% + NIIT: {niitRate}% + State: {(taxProfile.stateCapitalGainsRate || 0).toFixed(1)}%
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md text-sm text-center text-muted-foreground">
          This tax information is managed in your Tax Profile. Click "Edit Tax Profile" to make changes.
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadOnlyTaxDisplay;
