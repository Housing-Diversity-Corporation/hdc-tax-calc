import React from 'react';
import { Box, Grid } from '@mui/material';
import '../../styles/taxbenefits/hdcCalculator.css';

interface SimplifiedFreeInvestmentSectionProps {
  year1NetBenefit: number;
  investorEquity: number;
  formatCurrency: (value: number) => string;
}

const SimplifiedFreeInvestmentSection: React.FC<SimplifiedFreeInvestmentSectionProps> = ({
  year1NetBenefit,
  investorEquity,
  formatCurrency
}) => {
  const coveragePercent = investorEquity > 0 ? ((year1NetBenefit / investorEquity) * 100) : 0;
  const isFreeInvestment = coveragePercent >= 100;

  // Calculate months to investment recovery
  const calculateMonthsToRecovery = (): number | string => {
    // If year 1 benefit is negative or zero, recovery is not possible within reasonable timeframe
    if (year1NetBenefit <= 0) {
      return 'Extended (>10 years)';
    }

    if (year1NetBenefit >= investorEquity) {
      // Year 1 benefit covers the entire investment
      return Math.ceil((investorEquity / year1NetBenefit) * 12);
    }

    // If year 1 doesn't cover full investment, estimate based on annual benefit
    // Estimate subsequent years at 30% of year 1
    const annualBenefit = year1NetBenefit * 0.3;

    // If annual benefit is too small, recovery takes too long
    if (annualBenefit <= 0 || annualBenefit < investorEquity / 120) {
      return 'Extended (>10 years)';
    }

    const remainingAfterYear1 = investorEquity - year1NetBenefit;
    const additionalYears = remainingAfterYear1 / annualBenefit;
    const totalMonths = 12 + Math.ceil(additionalYears * 12);

    // Cap at 10 years (120 months) - beyond that is unrealistic
    if (totalMonths > 120) {
      return 'Extended (>10 years)';
    }

    return totalMonths;
  };

  const monthsToRecovery = calculateMonthsToRecovery();

  return (
    <Box
      className="hdc-section"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
    >
      <h3 className="hdc-section-header">Free Investment Analysis</h3>

      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly', // Better distribution
        py: 3, // Increased vertical padding
        px: 1 // Add horizontal padding
      }}>
        <Grid container spacing={4}>
          <Grid size={6}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Year 1 Net Tax Benefit:</span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(year1NetBenefit)}
              </span>
            </div>
          </Grid>

          <Grid size={6}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Investor Equity:</span>
              <span className="hdc-result-value">
                {formatCurrency(investorEquity)}
              </span>
            </div>
          </Grid>

          {/* <Grid size={6}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Free Investment Status:</span>
              <span className={`hdc-result-value ${isFreeInvestment ? 'hdc-value-positive' : 'hdc-value-negative'}`}>
                {isFreeInvestment ? 'YES' : 'NO'}
              </span>
            </div>
          </Grid> */}

          <Grid size={6}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Year 1 Coverage:</span>
              <span className={`hdc-result-value ${coveragePercent >= 100 ? 'hdc-value-positive' : coveragePercent >= 75 ? 'hdc-value-warning' : 'hdc-value-negative'}`}>
                {coveragePercent.toFixed(0)}%
              </span>
            </div>
          </Grid>

          <Grid size={6}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Months to Investment Recovery:</span>
              <span className="hdc-result-value hdc-value-highlight">
                {typeof monthsToRecovery === 'number' ? `${monthsToRecovery} months` : monthsToRecovery}
              </span>
            </div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SimplifiedFreeInvestmentSection;