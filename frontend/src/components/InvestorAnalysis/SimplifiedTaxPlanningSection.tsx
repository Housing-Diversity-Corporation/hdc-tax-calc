import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import '../../styles/taxbenefits/hdcCalculator.css';

interface SimplifiedTaxPlanningSectionProps {
  totalNetTaxBenefits: number;
  hdcFee: number;
  hdcFeeRate: number;
  year1NetBenefit: number;
  year5OZTaxDue: number;
  totalCapitalGainsRate: number;
  effectiveTaxRateForDepreciation: number;
  depreciationRecaptureRate: number;
  formatCurrency: (value: number) => string;
}

const SimplifiedTaxPlanningSection: React.FC<SimplifiedTaxPlanningSectionProps> = ({
  totalNetTaxBenefits,
  hdcFee,
  hdcFeeRate,
  year1NetBenefit,
  year5OZTaxDue,
  totalCapitalGainsRate,
  effectiveTaxRateForDepreciation,
  depreciationRecaptureRate,
  formatCurrency
}) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Calculate tax allocation
  const remainingAfterYear1 = totalNetTaxBenefits - year1NetBenefit;
  const remainingAfterOZ = remainingAfterYear1 - year5OZTaxDue;
  const excessBenefits = Math.max(0, remainingAfterOZ);

  // Calculate planning capacities
  const exchangeCapacity = excessBenefits / (totalCapitalGainsRate / 100);
  const rothCapacity = excessBenefits / (effectiveTaxRateForDepreciation / 100);
  const depreciationCapacity = excessBenefits / (depreciationRecaptureRate / 100);

  return (
    <div className="hdc-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="hdc-section-header">Tax Planning Capacity</h3>

      {/* Tax Allocation Section */}
      <div style={{ marginBottom: '1rem' }}>
        <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--hdc-faded-jade)' }}>
          Tax Benefit Allocation
        </Typography>

        <div className="hdc-result-row">
          <span className="hdc-result-label">Total Net Tax Benefits:</span>
          <span className="hdc-result-value hdc-value-positive">
            {formatCurrency(totalNetTaxBenefits)}
          </span>
        </div>

        {/* <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
          <span className="hdc-result-label">Less: HDC Fee ({hdcFeeRate}%):</span>
          <span className="hdc-result-value">
            ({formatCurrency(hdcFee)})
          </span>
        </div> */}

        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
          <span className="hdc-result-label">Less: Year 1 benefit used for equity recovery:</span>
          <span className="hdc-result-value">
            ({formatCurrency(year1NetBenefit)})
          </span>
        </div>

        {year5OZTaxDue > 0 && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Less: Year 5 OZ tax payment:</span>
            <span className="hdc-result-value">
              ({formatCurrency(year5OZTaxDue)})
            </span>
          </div>
        )}

        {/* <div className="hdc-result-row" style={{ borderTop: '1px solid var(--hdc-gulf-stream)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
          <span className="hdc-result-label" style={{ fontWeight: 600 }}>Excess Benefits Available:</span>
          <span className="hdc-result-value hdc-value-highlight" style={{ fontWeight: 600 }}>
            {formatCurrency(excessBenefits)}
          </span>
        </div> */}
      </div>

      {/* Planning Details Section */}
      <Box>
        <Box
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '0.5rem 0',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' }
          }}
        >
          <Typography variant="subtitle2" style={{ fontWeight: 600, color: 'var(--hdc-faded-jade)' }}>
            Planning Details
          </Typography>
          <IconButton size="small">
            {detailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={detailsExpanded}>
          <Box sx={{ pl: 2, pr: 2 }}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">
                1031 Exchange Capacity at {totalCapitalGainsRate.toFixed(1)}%:
              </span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(exchangeCapacity)}
              </span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">
                Roth Conversion Capacity at {effectiveTaxRateForDepreciation.toFixed(1)}%:
              </span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(rothCapacity)}
              </span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">
                Depreciation Offset at {depreciationRecaptureRate}%:
              </span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(depreciationCapacity)}
              </span>
            </div>
          </Box>
        </Collapse>
      </Box>
    </div>
  );
};

export default SimplifiedTaxPlanningSection;