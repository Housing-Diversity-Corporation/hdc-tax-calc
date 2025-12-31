/**
 * SimplifiedTaxPlanningSection
 *
 * IMPL-044 Audit: Verified engine value usage
 * - totalNetTaxBenefits: From calculations.totalNetTaxBenefits (engine value)
 * - year1NetBenefit: From calculations.year1NetBenefit (engine value)
 * - year5OZTaxDue: From calculations.investorCashFlows[4].ozYear5TaxPayment (engine value)
 *
 * Derived calculations (lines 28-35) are allocation/planning formulas, not recalculations:
 * - remainingAfterYear1 = totalNetTaxBenefits - year1NetBenefit
 * - remainingAfterOZ = remainingAfterYear1 - year5OZTaxDue
 * - exchangeCapacity, rothCapacity, depreciationCapacity are planning ratios
 *
 * No engine recalculation issues - all source values come from useHDCCalculations hook.
 */
import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';

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
  // Calculate tax allocation
  const remainingAfterYear1 = totalNetTaxBenefits - year1NetBenefit;
  const remainingAfterOZ = remainingAfterYear1 - year5OZTaxDue;
  const excessBenefits = Math.max(0, remainingAfterOZ);

  // Calculate planning capacities
  const exchangeCapacity = excessBenefits / (totalCapitalGainsRate / 100);
  const rothCapacity = excessBenefits / (effectiveTaxRateForDepreciation / 100);
  const depreciationCapacity = excessBenefits / (depreciationRecaptureRate / 100);

  return (
    <div className="hdc-section h-full flex flex-col">
      <h3 className="hdc-section-header">Tax Planning Capacity</h3>

      {/* Tax Allocation Section */}
      <div className="mb-4">
        <p className="text-sm font-semibold mb-2 text-[var(--hdc-faded-jade)]">
          Tax Benefit Allocation
        </p>

        <div className="hdc-result-row">
          <span className="hdc-result-label">Total Net Tax Benefits:</span>
          <span className="hdc-result-value hdc-value-positive">
            {formatCurrency(totalNetTaxBenefits)}
          </span>
        </div>

        <div className="hdc-result-row pl-4">
          <span className="hdc-result-label">Less: Year 1 benefit used for equity recovery:</span>
          <span className="hdc-result-value">
            ({formatCurrency(year1NetBenefit)})
          </span>
        </div>

        {year5OZTaxDue > 0 && (
          <div className="hdc-result-row pl-4">
            <span className="hdc-result-label">Less: Year 5 OZ tax payment:</span>
            <span className="hdc-result-value">
              ({formatCurrency(year5OZTaxDue)})
            </span>
          </div>
        )}
      </div>

      {/* Planning Details Section */}
      <div>
        <p className="text-sm font-semibold mb-2 text-[var(--hdc-faded-jade)]">
          Planning Details
        </p>

        <div className="px-4 pr-4">
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
        </div>
      </div>
    </div>
  );
};

export default SimplifiedTaxPlanningSection;
