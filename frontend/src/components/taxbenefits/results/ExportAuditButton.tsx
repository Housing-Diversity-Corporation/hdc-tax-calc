/**
 * IMPL-023: Audit Export Button Component
 *
 * Exports an Excel workbook with live formulas for auditor verification.
 * Generates a comprehensive audit trail of all HDC calculations.
 *
 * @version 1.0.0
 * @date 2025-12-26
 * @task IMPL-023 Step 2
 */

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../ui/button';
import { exportAuditWorkbook, AuditExportParams } from '../../../utils/taxbenefits/auditExport/auditExport';
import type { CalculationParams, InvestorAnalysisResults, HDCAnalysisResults } from '../../../types/taxbenefits';

export interface ExportAuditButtonProps {
  /** Calculator input parameters */
  params: CalculationParams;
  /** Calculated investor results */
  investorResults: InvestorAnalysisResults | null;
  /** HDC analysis results (IMPL-039b: Required for HDC Returns sheet) */
  hdcResults?: HDCAnalysisResults;
  /** Project name for filename (optional) */
  projectName?: string;
  /** Disable the button */
  disabled?: boolean;
}

/**
 * Button component to export audit workbook with live Excel formulas.
 *
 * Placement: HDCResultsComponent.tsx header, alongside other report buttons.
 */
export const ExportAuditButton: React.FC<ExportAuditButtonProps> = ({
  params,
  investorResults,
  hdcResults,
  projectName,
  disabled = false,
}) => {
  // Don't render if no results
  if (!investorResults) return null;

  const handleExport = () => {
    if (!investorResults) {
      console.error('Cannot export audit: investorResults is null');
      return;
    }

    try {
      const exportParams: AuditExportParams = {
        params,
        results: investorResults,
        hdcResults,
        projectName: projectName || 'HDC_Project',
      };

      exportAuditWorkbook(exportParams);
    } catch (error) {
      console.error('Error generating audit export:', error);
      // Could add user notification here
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || !investorResults}
      onClick={handleExport}
      className="!bg-[var(--hdc-sushi)] !px-1.5 !py-1 sm:!px-3 md:!px-4 md:!py-2 text-[10px] sm:text-xs md:text-sm hover:opacity-90"
      title="Export audit workbook with live Excel formulas"
    >
      <Download className="h-3 w-3 md:h-4 md:w-4" />
      <span className="hidden md:inline md:ml-2">Audit Export</span>
      <span className="hidden sm:inline md:hidden sm:ml-1">Audit</span>
    </Button>
  );
};

export default ExportAuditButton;
