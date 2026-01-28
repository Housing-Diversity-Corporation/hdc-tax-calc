/**
 * IMPL-033: Professional PDF Report using Engine Results
 *
 * Refactored to use engine results directly (like auditExport.ts) instead of ~85 props.
 * This ensures consistency between PDF output and calculation engine.
 *
 * @version 2.0.0
 * @date 2025-12-29
 * @task IMPL-033 Step 2
 */

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CalculationParams,
  InvestorAnalysisResults,
  HDCAnalysisResults
} from '../../../types/taxbenefits';
import { Button } from '../../ui/button';
import { FileText } from 'lucide-react';
import { calculateRemainingLIHTC } from '../../../utils/taxbenefits/lihtcHelpers';

/**
 * IMPL-033: Simplified props interface using engine results directly
 *
 * Replaces ~85 individual props with 3 core objects:
 * - params: All calculation inputs
 * - investorResults: Engine-calculated investor analysis
 * - hdcResults: Engine-calculated HDC analysis
 */
interface HDCComprehensiveReportProps {
  /** Calculator input parameters */
  params: CalculationParams;
  /** Engine-calculated investor results */
  investorResults: InvestorAnalysisResults | null;
  /** Engine-calculated HDC results */
  hdcResults: HDCAnalysisResults | null;
  /** Project name for display (optional) */
  projectName?: string;
  /** Project location for display (optional) */
  projectLocation?: string;
}

export const HDCComprehensiveReportButton: React.FC<HDCComprehensiveReportProps> = ({
  params,
  investorResults,
  hdcResults,
  projectName,
  projectLocation,
}) => {
  if (!investorResults) return null;

  const generateComprehensivePDF = () => {
    if (!investorResults) {
      console.error('Cannot generate report: investorResults is null');
      return;
    }

    try {
      // Create landscape PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const lineHeight = 6;
      let yPosition = margin;
      let currentPage = 1;

      // Colors
      const primaryColor: [number, number, number] = [64, 127, 127]; // HDC Teal
      const secondaryColor: [number, number, number] = [127, 189, 69]; // HDC Green
      const grayText: [number, number, number] = [100, 100, 100];
      const darkText: [number, number, number] = [40, 40, 40];

      // ========== EXTRACT VALUES FROM ENGINE RESULTS ==========
      // IMPL-033: Use engine values directly instead of props

      // Project values (in millions, convert to full dollars for display)
      const projectCost = (params.projectCost || 0) * 1000000;
      const landValue = (params.landValue || 0) * 1000000;
      const predevelopmentCosts = (params.predevelopmentCosts || 0) * 1000000;
      const yearOneNOI = (params.yearOneNOI || 0) * 1000000;
      const holdPeriod = params.holdPeriod || 10;

      // Investor metrics from engine
      const investorInvestment = investorResults.totalInvestment || 0;
      const investorReturns = investorResults.totalReturns || 0;
      const investorMultiple = investorResults.multiple || 0;
      const investorIRR = investorResults.irr || 0;
      const exitProceeds = investorResults.exitProceeds || 0;
      const investorTaxBenefits = investorResults.investorTaxBenefits || 0;
      const investorOperatingCashFlows = investorResults.investorOperatingCashFlows || 0;

      // IMPL-033: Hidden components that feed into totalReturns
      // OZ benefits from engine (only populated when ozEnabled && holdPeriod >= 10)
      const ozRecaptureAvoided = investorResults.ozRecaptureAvoided || 0;
      const ozDeferralNPV = investorResults.ozDeferralNPV || 0;
      const ozExitAppreciation = investorResults.ozExitAppreciation || 0;
      const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation;

      // Sub-debt repayment at exit (principal + PIK)
      const investorSubDebtAtExit = investorResults.investorSubDebtAtExit || 0;

      // HDC metrics from engine
      const hdcTotalReturns = hdcResults?.totalHDCReturns || 0;
      const hdcExitProceeds = hdcResults?.hdcExitProceeds || 0;

      // Year 1 tax benefit from engine (IMPL-041: conformity-adjusted)
      const year1TaxBenefit = investorResults.investorCashFlows?.[0]?.taxBenefit || 0;

      // IMPL-065: Depreciation calculation using IRS-mandated formulas (same as engine)
      // These are standardized rules (IRS Pub 946) that will always match engine calculations.
      // Engine's depreciationSchedule doesn't expose all intermediate values needed for display,
      // so we derive them here using the same deterministic formulas.
      const totalProjectCost = projectCost + predevelopmentCosts;
      const depreciableBasis = totalProjectCost - landValue;
      const costSegPct = params.yearOneDepreciationPct || 20;
      const bonusDepreciation = depreciableBasis * (costSegPct / 100);
      const remainingBasis = depreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;
      const pisMonth = params.placedInServiceMonth || 7;
      const monthsInYear1 = 12.5 - pisMonth;
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
      const totalYear1Depreciation = bonusDepreciation + year1MACRS;
      const total10YearDepreciation = totalYear1Depreciation + (annualMACRS * (holdPeriod - 1));

      // ========== HELPER FUNCTIONS ==========

      const checkPageBreak = (requiredSpace: number = 30): boolean => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          addFooter();
          doc.addPage('a4', 'landscape');
          yPosition = margin;
          currentPage++;
          addHeader();
          return true;
        }
        return false;
      };

      const formatMoney = (value: number, decimals: number = 0): string => {
        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        return `${sign}$${new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(decimals === 0 ? Math.round(absValue) : absValue)}`;
      };

      const formatPercent = (value: number, decimals: number = 2): string => {
        return `${value.toFixed(decimals)}%`;
      };

      // IMPL-033 Step 4b: Helper to format rate - handles both decimal (0.08) and percentage (8) formats
      // If value > 1, assume it's already a percentage; if <= 1, multiply by 100
      const formatRate = (value: number): string => {
        const pct = value > 1 ? value : value * 100;
        return `${pct.toFixed(2)}%`;
      };

      const formatNumber = (value: number, decimals: number = 2): string => {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(value);
      };

      // IMPL-033: Calculate remaining LIHTC credits beyond hold period (Year 11 catch-up)
      // Uses shared utility from lihtcHelpers.ts for single source of truth
      const remainingLIHTCCredits = calculateRemainingLIHTC(params, holdPeriod);

      const addHeader = (showTitle: boolean = true) => {
        if (showTitle) {
          doc.setFontSize(10);
          doc.setTextColor(...primaryColor);
          doc.text('HDC Comprehensive Investment Analysis Report', margin, 10);
        }
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        const now = new Date();
        const ptTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const timestamp = `${ptTime.toLocaleDateString()} ${ptTime.getHours().toString().padStart(2, '0')}:${ptTime.getMinutes().toString().padStart(2, '0')} PT`;
        doc.text(`Generated: ${timestamp}`, pageWidth - margin - 60, 10);
      };

      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.text(
          `Housing Diversity Corporation | Confidential | Page ${currentPage}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      };

      const addSectionTitle = (title: string) => {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += lineHeight * 1.5;
        doc.setFont('helvetica', 'normal');
      };

      // ========== PAGE 1: EXECUTIVE SUMMARY ==========
      addHeader(false);
      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.text('COMPREHENSIVE INVESTMENT ANALYSIS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      doc.setFontSize(12);
      doc.setTextColor(...darkText);
      if (projectName) {
        doc.text(`Project: ${projectName}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight;
      }
      if (projectLocation) {
        doc.text(`Location: ${projectLocation}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight;
      }

      const coverNow = new Date();
      const coverPtTime = new Date(coverNow.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      const coverTimestamp = `${coverPtTime.toLocaleDateString()} ${coverPtTime.getHours().toString().padStart(2, '0')}:${coverPtTime.getMinutes().toString().padStart(2, '0')} PT`;
      doc.text(`Analysis Date: ${coverTimestamp}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 3;

      // Key Metrics Summary
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('KEY INVESTMENT METRICS', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += lineHeight * 1.5;

      // Summary table using ENGINE VALUES
      const summaryData = [
        ['Metric', 'Investor', 'HDC'],
        ['Total Investment', formatMoney(investorInvestment), '$0'],
        ['Total Returns', formatMoney(investorReturns), formatMoney(hdcTotalReturns)],
        ['Multiple', `${formatNumber(investorMultiple)}x`, 'N/A'],
        ['IRR', formatRate(investorIRR), 'N/A'],
        ['Exit Proceeds', formatMoney(exitProceeds), formatMoney(hdcExitProceeds)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [64, 127, 127], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // ========== PAGE 2: COMPLETE INPUT PARAMETERS ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('COMPLETE INPUT PARAMETERS');

      // Project Parameters
      doc.setFontSize(11);
      doc.setTextColor(...secondaryColor);
      doc.text('Project Parameters', margin, yPosition);
      yPosition += lineHeight;

      const projectInputs = [
        ['Parameter', 'Value'],
        ['Project Cost', formatMoney(projectCost)],
        ['Land Value', formatMoney(landValue)],
        ['Predevelopment Costs', formatMoney(predevelopmentCosts)],
        ['Stabilized NOI', formatMoney(yearOneNOI)],
        ['Revenue Growth', formatPercent(params.revenueGrowth || 0)],
        ['Expense Growth', formatPercent(params.expenseGrowth || 0)],
        ['Exit Cap Rate', formatPercent(params.exitCapRate || 5)],
        ['Hold Period', `${holdPeriod} years`],
        ['OpEx Ratio', formatPercent(params.opexRatio || 25)],
        ['Construction Delay', `${params.constructionDelayMonths || 0} months`],
        ['Tax Benefit Delay', `${params.taxBenefitDelayMonths || 0} months`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [projectInputs[0]],
        body: projectInputs.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [127, 189, 69] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: margin },
        tableWidth: 120
      });

      // Capital Structure
      const capitalY = yPosition;
      yPosition = capitalY;
      doc.setFontSize(11);
      doc.setTextColor(...secondaryColor);
      doc.text('Capital Structure', margin + 130, yPosition);
      yPosition += lineHeight;

      // ISS-062: Complete capital structure with all parameters
      const capitalInputs = [
        ['Source', 'Percentage', 'Rate', 'Terms'],
        ['Investor Equity', formatPercent(params.investorEquityPct || 35), '-', params.autoBalanceCapital ? `Auto-balanced (${params.investorEquityRatio || 50}% ratio)` : '-'],
        ['Philanthropic Equity', formatPercent(params.philanthropicEquityPct || 0), '-', '-'],
        ['Senior Debt', formatPercent(params.seniorDebtPct || 50), formatPercent(params.seniorDebtRate || 7), `${params.seniorDebtAmortization || 30}yr amort, ${params.seniorDebtIOYears || 0}yr IO`],
        ['Philanthropic Debt', formatPercent(params.philanthropicDebtPct || 0), formatPercent(params.philanthropicDebtRate || 4), `${params.philDebtAmortization || 35}yr amort${params.philCurrentPayEnabled ? `, ${params.philCurrentPayPct || 50}% Current` : ''}`],
        ['HDC Sub-Debt', formatPercent(params.hdcSubDebtPct || 0), formatPercent(params.hdcSubDebtPikRate || 12), params.pikCurrentPayEnabled ? `${params.pikCurrentPayPct || 50}% Current` : 'Full PIK'],
        ['Investor Sub-Debt', formatPercent(params.investorSubDebtPct || 0), formatPercent(params.investorSubDebtPikRate || 12), params.investorPikCurrentPayEnabled ? `${params.investorPikCurrentPayPct || 50}% Current` : 'Full PIK'],
        ['Outside Investor Sub-Debt', formatPercent(params.outsideInvestorSubDebtPct || 0), formatPercent(params.outsideInvestorSubDebtPikRate || 12), `${params.outsideInvestorPikCurrentPayEnabled ? `${params.outsideInvestorPikCurrentPayPct || 50}% Current` : 'Full PIK'}${params.outsideInvestorSubDebtAmortization ? `, ${params.outsideInvestorSubDebtAmortization}yr amort` : ''}`],
        ['HDC Debt Fund', formatPercent(params.hdcDebtFundPct || 0), formatPercent(params.hdcDebtFundPikRate || 8), params.hdcDebtFundCurrentPayEnabled ? `${params.hdcDebtFundCurrentPayPct || 50}% Current` : 'Full PIK']
      ];

      // ISS-062: Add Preferred Equity if enabled
      if (params.prefEquityEnabled) {
        capitalInputs.push(['Preferred Equity', formatPercent(params.prefEquityPct || 0), `${params.prefEquityAccrualRate || 12}% accrual`, `Target ${params.prefEquityTargetMOIC || 1.7}x MOIC`]);
      }

      autoTable(doc, {
        startY: yPosition,
        head: [capitalInputs[0]],
        body: capitalInputs.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [127, 189, 69] },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin + 130 },
        tableWidth: 140
      });

      yPosition = Math.max((doc as any).lastAutoTable.finalY, (doc as any).previousAutoTable?.finalY || 0) + lineHeight * 2;

      // ========== PAGE 3: TAX SETTINGS & FEES ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('TAX SETTINGS & FEE STRUCTURE');

      // Tax Settings
      const taxInputs = [
        ['Tax Parameter', 'Value'],
        ['Investor Track', params.investorTrack === 'rep' ? 'Real Estate Professional' : 'Non-REP'],
        // ISS-059: Add Investor Profile fields
        ['Annual Income', formatMoney(params.annualIncome || 0)],
        ['Filing Status', params.filingStatus === 'married' ? 'Married Filing Jointly' : 'Single'],
        ['State', params.selectedState || 'CA'],
        ['Federal Tax Rate', formatPercent(params.federalTaxRate || 37)],
        ['State Tax Rate', formatPercent(params.stateTaxRate || 0)],
        ['Bonus Conformity Rate', formatPercent((params.bonusConformityRate || 1) * 100)],
        ['Capital Gains Rate', formatPercent(params.ltCapitalGainsRate || 20)],
        ['State Capital Gains', formatPercent(params.stateCapitalGainsRate || 0)],
        ['NIIT Rate', formatPercent(params.niitRate || 3.8)],
        ['Depreciation Recapture', formatPercent(params.depreciationRecaptureRate || 25)],
        ['Year 1 Depreciation %', formatPercent(params.yearOneDepreciationPct || 20)],
      ];

      // ISS-059: Add Tax Planning fields based on investor track
      if (params.investorTrack === 'rep') {
        taxInputs.push(['W-2 Income', formatMoney(params.w2Income || 0)]);
        taxInputs.push(['Business Income', formatMoney(params.businessIncome || 0)]);
        taxInputs.push(['IRA Balance', formatMoney(params.iraBalance || 0)]);
      } else {
        taxInputs.push(['Passive Income', formatMoney(params.passiveIncome || 0)]);
        taxInputs.push(['Asset Sale Gain', formatMoney(params.assetGain || 0)]);
      }

      if (params.ozEnabled) {
        taxInputs.push(['OZ Investment', 'Yes']);
        taxInputs.push(['OZ Version', params.ozVersion || '2.0']);
        taxInputs.push(['OZ Type', params.ozType === 'rural' ? 'Rural' : 'Standard']);
        taxInputs.push(['Deferred Capital Gains', formatMoney((params.deferredCapitalGains || 0) * 1000000)]);
      }

      // ISS-062: Basis Adjustments (if any are set)
      const hasBasisAdjustments = (params.loanFeesPercent || 0) > 0 ||
                                   (params.legalStructuringCosts || 0) > 0 ||
                                   (params.organizationCosts || 0) > 0;
      if (hasBasisAdjustments) {
        taxInputs.push(['--- Basis Adjustments ---', '']);
        if (params.loanFeesPercent) taxInputs.push(['Loan Fees %', formatPercent(params.loanFeesPercent)]);
        if (params.legalStructuringCosts) taxInputs.push(['Legal/Structuring Costs', formatMoney((params.legalStructuringCosts || 0) * 1000000)]);
        if (params.organizationCosts) taxInputs.push(['Organization Costs', formatMoney((params.organizationCosts || 0) * 1000000)]);
      }

      autoTable(doc, {
        startY: yPosition,
        head: [taxInputs[0]],
        body: taxInputs.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [64, 127, 127] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: margin },
        tableWidth: 120
      });

      // LIHTC & PAB Parameters (ISS-045)
      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;
      checkPageBreak(80);

      doc.setFontSize(11);
      doc.setTextColor(...secondaryColor);
      doc.text('LIHTC & PAB Structure', margin, yPosition);
      yPosition += lineHeight;

      const lihtcInputs: (string | number)[][] = [
        ['Parameter', 'Value'],
        ['Federal LIHTC Enabled', params.lihtcEnabled ? 'Yes' : 'No'],
      ];

      if (params.lihtcEnabled) {
        lihtcInputs.push(['LIHTC Credit Rate', formatPercent((params.creditRate || 0.04) * 100)]);
        lihtcInputs.push(['Applicable Fraction', formatPercent(params.applicableFraction || 100)]);
        lihtcInputs.push(['DDA/QCT Boost', params.ddaQctBoost ? 'Yes (130%)' : 'No']);
        lihtcInputs.push(['Placed in Service Month', String(params.placedInServiceMonth || 7)]);
        // ISS-059: Add LIHTC Eligible Basis Exclusions
        const hasExclusions = (params.commercialSpaceCosts || 0) + (params.syndicationCosts || 0) +
          (params.marketingCosts || 0) + (params.financingFees || 0) + (params.bondIssuanceCosts || 0) +
          (params.operatingDeficitReserve || 0) + (params.replacementReserve || 0) + (params.otherExclusions || 0) > 0;
        if (hasExclusions) {
          lihtcInputs.push(['--- Eligible Basis Exclusions ---', '']);
          if (params.commercialSpaceCosts) lihtcInputs.push(['Commercial Space Costs', formatMoney((params.commercialSpaceCosts || 0) * 1000000)]);
          if (params.syndicationCosts) lihtcInputs.push(['Syndication Costs', formatMoney((params.syndicationCosts || 0) * 1000000)]);
          if (params.marketingCosts) lihtcInputs.push(['Marketing Costs', formatMoney((params.marketingCosts || 0) * 1000000)]);
          if (params.financingFees) lihtcInputs.push(['Financing Fees', formatMoney((params.financingFees || 0) * 1000000)]);
          if (params.bondIssuanceCosts) lihtcInputs.push(['Bond Issuance Costs', formatMoney((params.bondIssuanceCosts || 0) * 1000000)]);
          if (params.operatingDeficitReserve) lihtcInputs.push(['Operating Deficit Reserve', formatMoney((params.operatingDeficitReserve || 0) * 1000000)]);
          if (params.replacementReserve) lihtcInputs.push(['Replacement Reserve', formatMoney((params.replacementReserve || 0) * 1000000)]);
          if (params.otherExclusions) lihtcInputs.push(['Other Exclusions', formatMoney((params.otherExclusions || 0) * 1000000)]);
        }
      }

      lihtcInputs.push(['State LIHTC Enabled', params.stateLIHTCEnabled ? 'Yes' : 'No']);
      if (params.stateLIHTCEnabled) {
        lihtcInputs.push(['Investor State', params.investorState || 'N/A']);
        lihtcInputs.push(['Syndication Rate', formatPercent(params.syndicationRate || 85)]);
        lihtcInputs.push(['Syndication Year', String(params.stateLIHTCSyndicationYear ?? 0)]);
        // ISS-059: Add State LIHTC override fields
        lihtcInputs.push(['Investor Has State Liability', params.investorHasStateLiability !== false ? 'Yes' : 'No']);
        if (params.stateLIHTCUserPercentage) {
          lihtcInputs.push(['User Override %', formatPercent(params.stateLIHTCUserPercentage)]);
        }
        if (params.stateLIHTCUserAmount) {
          lihtcInputs.push(['User Override Amount', formatMoney((params.stateLIHTCUserAmount || 0) * 1000000)]);
        }
      }

      lihtcInputs.push(['PAB Enabled', params.pabEnabled ? 'Yes' : 'No']);
      if (params.pabEnabled) {
        lihtcInputs.push(['PAB % of Eligible Basis', formatPercent(params.pabPctOfEligibleBasis || 30)]);
        lihtcInputs.push(['PAB Rate', formatPercent(params.pabRate || 4.5)]);
        lihtcInputs.push(['PAB Term', `${params.pabTerm || 40} years`]);
        lihtcInputs.push(['PAB Amortization', `${params.pabAmortization || 40} years`]);
        lihtcInputs.push(['PAB IO Years', String(params.pabIOYears || 0)]);
      }

      if (params.interestReserveEnabled) {
        lihtcInputs.push(['Interest Reserve', `${params.interestReserveMonths || 12} months`]);
      }

      autoTable(doc, {
        startY: yPosition,
        head: [lihtcInputs[0] as string[]],
        body: lihtcInputs.slice(1) as string[][],
        theme: 'striped',
        headStyles: { fillColor: [64, 127, 127] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: margin },
        tableWidth: 120
      });

      // Fee Structure
      const feeY = yPosition;
      yPosition = feeY;
      doc.setFontSize(11);
      doc.setTextColor(...secondaryColor);
      doc.text('Fee Structure', margin + 130, yPosition);
      yPosition += lineHeight;

      const feeInputs = [
        ['Fee Type', 'Rate', 'Payment'],
        ['HDC Platform Mode', params.hdcPlatformMode || 'traditional', '-'],
        ['HDC Tax Benefit Fee', formatPercent(params.hdcFeeRate || 10), 'At Realization'],
        ['HDC AUM Fee', params.aumFeeEnabled ? formatPercent(params.aumFeeRate || 1) : 'Disabled',
         params.aumFeeEnabled && params.aumCurrentPayEnabled ? `${params.aumCurrentPayPct || 50}% Current` : 'Full Deferred'],
        ['HDC Deferred Interest', formatPercent(params.hdcDeferredInterestRate || 8), 'On Deferrals'],
        ['Promote Split', `Investor: ${params.investorPromoteShare || 35}%`, `HDC: ${100 - (params.investorPromoteShare || 35)}%`],
        ['HDC Advance Financing', params.hdcAdvanceFinancing ? 'Enabled' : 'Disabled',
         params.hdcAdvanceFinancing ? `${params.taxDeliveryMonths || 18}mo @ ${formatPercent(params.advanceFinancingRate || 8)}` : '-']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [feeInputs[0]],
        body: feeInputs.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [127, 189, 69] },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin + 130 },
        tableWidth: 140
      });

      yPosition = Math.max((doc as any).lastAutoTable.finalY, (doc as any).previousAutoTable?.finalY || 0) + lineHeight * 2;

      // ========== PAGE 4: INVESTOR FINANCIAL ANALYSIS ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('INVESTOR FINANCIAL ANALYSIS');

      // Investor Returns Summary using ENGINE VALUES
      // IMPL-033: Added Sub-Debt Repayment, OZ Tax Benefits, LIHTC Catch-up rows
      const investorSummary = [
        ['Category', 'Amount', 'Details'],
        ['Initial Investment', formatMoney(investorInvestment), `${params.investorEquityPct || 35}% of project cost`],
        ['Year 1 Tax Benefit', formatMoney(year1TaxBenefit), 'Engine value (conformity-adjusted)'],
        ['Total Tax Benefits', formatMoney(investorTaxBenefits), 'Over hold period'],
        ['Operating Cash Flows', formatMoney(investorOperatingCashFlows), 'Distributions'],
        ['Exit Proceeds', formatMoney(exitProceeds), 'After debt & fees'],
        ['Sub-Debt Repayment', formatMoney(investorSubDebtAtExit), 'Principal + PIK at exit'],
        ['OZ Tax Benefits', formatMoney(totalOzBenefits), params.ozEnabled ? '10+ year hold benefit' : 'Not applicable'],
        ['LIHTC Catch-up', formatMoney(remainingLIHTCCredits), 'Year 11 credits'],
        ['Total Returns', formatMoney(investorReturns), 'Sum of all sources'],
        ['Multiple', `${formatNumber(investorMultiple)}x`, 'On invested capital'],
        ['IRR', formatRate(investorIRR), 'Annual return']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [investorSummary[0]],
        body: investorSummary.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [64, 127, 127], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { halign: 'right', cellWidth: 50 },
          2: { cellWidth: 80 }
        },
        margin: { left: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // Investor Cash Flows from ENGINE
      checkPageBreak(80);
      doc.setFontSize(11);
      doc.setTextColor(...secondaryColor);
      doc.text('Investor Cash Flow Projection', margin, yPosition);
      yPosition += lineHeight;

      // IMPL-033: Added OZ Benefits and LIHTC columns for full transparency
      const cashFlowHeaders = ['Year', 'Tax Benefit', 'Distributions', 'Sub-Debt', 'OZ Benefits', 'LIHTC', 'Total', 'Cumulative'];
      const cashFlowData = (investorResults.investorCashFlows || []).map(cf => {
        // Calculate yearly LIHTC (federal + state)
        const yearlyLIHTC = (cf.federalLIHTCCredit || 0) + (cf.stateLIHTCCredit || 0);
        return [
          cf.year.toString(),
          formatMoney(cf.taxBenefit || 0),
          formatMoney(cf.operatingCashFlow || 0),
          formatMoney(-(cf.subDebtInterest || 0)),
          '-',  // OZ benefits only realized at exit
          formatMoney(yearlyLIHTC),
          formatMoney(cf.totalCashFlow || 0),
          formatMoney(cf.cumulativeReturns || 0)
        ];
      });

      // IMPL-033: Exit row shows all hidden components with actual values
      // Exit Total = exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits
      const exitTotal = exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits;
      cashFlowData.push([
        'Exit',
        '-',                                    // Tax Benefit (none at exit)
        '-',                                    // Distributions (none at exit)
        formatMoney(investorSubDebtAtExit),    // Sub-Debt repayment at exit
        formatMoney(totalOzBenefits),          // OZ Benefits realized at exit
        formatMoney(remainingLIHTCCredits),    // LIHTC catch-up (Year 11)
        formatMoney(exitTotal),                // Total of all exit components
        formatMoney(investorReturns)           // Final cumulative (should reconcile)
      ]);

      // IMPL-033: Updated column widths for 8 columns (landscape A4 = 297mm, margin 15mm each side = 267mm usable)
      autoTable(doc, {
        startY: yPosition,
        head: [cashFlowHeaders],
        body: cashFlowData,
        theme: 'striped',
        headStyles: { fillColor: [64, 127, 127], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },  // Year
          1: { halign: 'right', cellWidth: 32 },   // Tax Benefit
          2: { halign: 'right', cellWidth: 32 },   // Distributions
          3: { halign: 'right', cellWidth: 28 },   // Sub-Debt
          4: { halign: 'right', cellWidth: 28 },   // OZ Benefits
          5: { halign: 'right', cellWidth: 24 },   // LIHTC
          6: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },  // Total
          7: { halign: 'right', cellWidth: 32, fontStyle: 'bold' }   // Cumulative
        },
        margin: { left: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // ========== PAGE 5: HDC FINANCIAL ANALYSIS ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('HDC FINANCIAL ANALYSIS');

      if (hdcResults) {
        // HDC Returns Summary using ENGINE VALUES
        const hdcSummary = [
          ['Category', 'Amount', 'Details'],
          ['Initial Investment', '$0', 'No capital required'],
          ['Tax Benefit Fees', formatMoney(hdcResults.hdcTaxBenefitFromFees || 0), '10% of investor benefits'],
          ['AUM Fees', formatMoney(hdcResults.hdcAumFees || 0), params.aumFeeEnabled ? `${params.aumFeeRate || 1}% annually` : 'Not enabled'],
          ['Promote Share', formatMoney(hdcResults.hdcPromoteShare || 0), `${100 - (params.investorPromoteShare || 35)}% of profits`],
          ['Sub-Debt Interest', formatMoney(hdcResults.hdcSubDebtInterest || 0), `${formatRate(params.hdcSubDebtPikRate || 12)} on sub-debt`],
          ['Exit Proceeds', formatMoney(hdcExitProceeds), 'Total at exit'],
          ['Total Returns', formatMoney(hdcTotalReturns), 'All sources']
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [hdcSummary[0]],
          body: hdcSummary.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [127, 189, 69], textColor: 255 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { halign: 'right', cellWidth: 50 },
            2: { cellWidth: 80 }
          },
          margin: { left: margin }
        });

        yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

        // HDC Cash Flows from ENGINE
        doc.setFontSize(11);
        doc.setTextColor(...secondaryColor);
        doc.text('HDC Cash Flow Projection', margin, yPosition);
        yPosition += lineHeight;

        const hdcCashFlowHeaders = ['Year', 'Tax Fees', 'AUM Fees', 'Sub-Debt', 'Promote', 'Total', 'Cumulative'];
        const hdcCashFlowData = hdcResults.hdcCashFlows.map(cf => {
          return [
            cf.year.toString(),
            formatMoney(cf.hdcFeeIncome || 0),
            formatMoney(cf.aumFeeIncome || 0),
            formatMoney(cf.hdcSubDebtCurrentPay || 0),
            formatMoney(cf.promoteShare || 0),
            formatMoney(cf.totalCashFlow || 0),
            formatMoney(cf.cumulativeReturns || 0)
          ];
        });

        // Add exit row
        hdcCashFlowData.push([
          'Exit',
          '-',
          formatMoney(hdcResults.accumulatedAumFeesAtExit || 0),
          formatMoney(hdcResults.hdcSubDebtAtExit || 0),
          formatMoney(hdcResults.hdcPromoteProceeds || 0),
          formatMoney(hdcExitProceeds),
          formatMoney(hdcTotalReturns)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [hdcCashFlowHeaders],
          body: hdcCashFlowData,
          theme: 'striped',
          headStyles: { fillColor: [127, 189, 69], textColor: 255 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' },
            6: { halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: margin }
        });
      }

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // ========== PAGE 6: EXIT PROCEEDS BREAKDOWN ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('EXIT PROCEEDS DETAILED BREAKDOWN');

      if (hdcResults) {
        const exitBreakdown = [
          ['Component', 'Amount', 'Notes'],
          ['Property Exit Value', formatMoney(hdcResults.exitValue || 0), 'Based on exit cap rate'],
          ['Less: Remaining Senior Debt', formatMoney(-(hdcResults.remainingDebt || 0) * 0.6), 'Principal balance'],
          ['Less: Remaining Phil Debt', formatMoney(-(hdcResults.remainingDebt || 0) * 0.4), 'Principal + PIK'],
          ['Less: HDC Sub-Debt', formatMoney(-(hdcResults.hdcSubDebtAtExit || 0)), 'Principal + accumulated PIK'],
          ['Less: Outside Investor Sub-Debt', formatMoney(-(hdcResults.outsideInvestorSubDebtAtExit || 0)), 'If applicable'],
          ['= Gross Exit Proceeds', formatMoney(hdcResults.grossExitProceeds || 0), 'Available for distribution'],
          ['', '', ''],
          ['INVESTOR RECEIVES:', '', ''],
          [`Promote Share (${params.investorPromoteShare || 35}%)`, formatMoney((hdcResults.grossExitProceeds || 0) * (params.investorPromoteShare || 35) / 100), 'Of gross proceeds'],
          ['Less: Accumulated AUM Fees', formatMoney(-(hdcResults.accumulatedAumFeesAtExit || 0)), 'Paid to HDC'],
          ['Less: Deferred Tax Fees', formatMoney(-(hdcResults.hdcDeferredTaxFeesAtExit || 0)), 'Paid to HDC'],
          ['= Net Investor Exit Proceeds', formatMoney(exitProceeds), 'Final investor amount'],
          ['', '', ''],
          ['HDC RECEIVES:', '', ''],
          [`Promote Share (${100 - (params.investorPromoteShare || 35)}%)`, formatMoney(hdcResults.hdcPromoteProceeds || 0), 'Of gross proceeds'],
          ['+ HDC Sub-Debt Repayment', formatMoney(hdcResults.hdcSubDebtAtExit || 0), 'Principal + PIK'],
          ['+ Accumulated AUM Fees', formatMoney(hdcResults.accumulatedAumFeesAtExit || 0), 'From investor share'],
          ['+ Deferred Tax Benefit Fees', formatMoney(hdcResults.hdcDeferredTaxFeesAtExit || 0), 'From investor share'],
          ['= Total HDC Exit Proceeds', formatMoney(hdcExitProceeds), 'Final HDC amount']
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [exitBreakdown[0]],
          body: exitBreakdown.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [64, 127, 127], textColor: 255 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'right', cellWidth: 50 },
            2: { cellWidth: 100 }
          },
          margin: { left: margin },
          didParseCell: function(data) {
            if (data.row.index === 5 || data.row.index === 11 || data.row.index === 18) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
            if (data.row.index === 7 || data.row.index === 13) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [64, 127, 127];
            }
          }
        });
      }

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // ========== PAGE 7: DEPRECIATION & TAX ANALYSIS ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('DEPRECIATION & TAX BENEFIT ANALYSIS');

      // IMPL-033: State Conformity Note
      doc.setFontSize(9);
      doc.setTextColor(...grayText);
      const conformityNote = `Note: Tax benefits calculated using IMPL-041 state conformity logic. ` +
        `Bonus depreciation uses ${formatPercent((params.bonusConformityRate || 1) * 100)} state conformity rate ` +
        `for ${params.selectedState || 'N/A'}. Years 2+ use full state rate (all states accept straight-line MACRS).`;
      doc.text(conformityNote, margin, yPosition, { maxWidth: pageWidth - margin * 2 });
      yPosition += lineHeight * 2;

      // Depreciation Analysis using ENGINE VALUES
      const effectiveRate = (params.federalTaxRate || 37) + (params.stateTaxRate || 0);

      const depreciationAnalysis = [
        ['Component', 'Amount', 'Tax Benefit', 'Notes'],
        ['Depreciable Basis', formatMoney(depreciableBasis), '-', 'Building value for depreciation'],
        ['Year 1 Bonus Depreciation', formatMoney(bonusDepreciation), formatMoney(year1TaxBenefit), `${costSegPct}% bonus (conformity-adjusted)`],
        ['Years 2-10 Straight Line', formatMoney(annualMACRS * (holdPeriod - 1)), formatMoney(investorTaxBenefits - year1TaxBenefit), 'Annual depreciation (full state rate)'],
        ['Total 10-Year Depreciation', formatMoney(total10YearDepreciation), formatMoney(investorTaxBenefits), 'Cumulative benefit'],
        ['', '', '', ''],
        ['Effective Tax Rate (Combined)', formatPercent(effectiveRate), '-', params.investorTrack === 'rep' ? 'REP rate' : 'Non-REP rate'],
        ['HDC Fee on Benefits', formatPercent(params.hdcFeeRate || 10), formatMoney(investorTaxBenefits * (params.hdcFeeRate || 10) / 100), 'Paid to HDC'],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [depreciationAnalysis[0]],
        body: depreciationAnalysis.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [64, 127, 127], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { halign: 'right', cellWidth: 50 },
          2: { halign: 'right', cellWidth: 50 },
          3: { cellWidth: 80 }
        },
        margin: { left: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // ========== PAGE 8: DISCLAIMERS ==========
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('IMPORTANT DISCLAIMERS & NOTES');

      doc.setFontSize(10);
      doc.setTextColor(...darkText);

      const disclaimers = [
        '1. This report is for informational purposes only and does not constitute investment advice.',
        '2. All projections are based on assumptions that may not reflect actual market conditions.',
        '3. Tax benefits are subject to current tax law and individual tax circumstances.',
        '4. Past performance does not guarantee future results.',
        '5. Opportunity Zone investments carry specific risks and requirements.',
        '6. Consult with qualified tax and investment professionals before making investment decisions.',
        '7. HDC fees and promote splits are subject to negotiation and final documentation.',
        '8. DSCR covenants and cash management provisions may affect actual distributions.',
        '9. Interest rates and financing terms are subject to market conditions.',
        '10. Exit values are projections and actual results may vary significantly.',
        '',
        'IMPL-041 State Conformity:',
        '  - Bonus depreciation uses state-specific conformity rates (CA=0%, NY=50%, NJ=30%, etc.)',
        '  - Straight-line MACRS uses full state rate (all states accept 27.5-year depreciation)',
        '  - Tax benefit values reflect conformity-adjusted engine calculations'
      ];

      disclaimers.forEach(disclaimer => {
        checkPageBreak(10);
        doc.text(disclaimer, margin, yPosition, { maxWidth: pageWidth - margin * 2 });
        yPosition += lineHeight * 1.5;
      });

      yPosition += lineHeight * 2;

      // Signature block
      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setTextColor(...grayText);
      doc.text('Prepared by: Housing Diversity Corporation', margin, yPosition);
      yPosition += lineHeight;
      doc.text('Date: ' + new Date().toLocaleDateString(), margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, margin + 60, yPosition);
      yPosition += lineHeight;
      doc.text('Authorized Signature', margin, yPosition);

      addFooter();

      // Save the PDF
      const fileName = `HDC_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  return (
    <Button
      onClick={generateComprehensivePDF}
      className="!bg-[var(--hdc-sushi)] !px-1.5 !py-1 sm:!px-3 md:!px-4 md:!py-2 text-[10px] sm:text-xs md:text-sm hover:opacity-90"
    >
      <FileText className="h-3 w-3 md:h-4 md:w-4" />
      <span className="hidden md:inline md:ml-2">Comprehensive Report</span>
      <span className="hidden sm:inline md:hidden sm:ml-1">Report</span>
    </Button>
  );
};

export default HDCComprehensiveReportButton;
