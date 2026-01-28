/**
 * IMPL-033 Step 3: Tax Report Data Source Fix
 *
 * Refactored to use engine results pattern (params + investorResults + hdcResults)
 * instead of ~20 individual props. Tax benefits now use conformity-adjusted engine values.
 *
 * @version 2.0.0
 * @date 2025-12-29
 */

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvestorAnalysisResults, HDCAnalysisResults, CalculationParams } from '../../../types/taxbenefits';
import { Button } from '../../ui/button';
import { FileBarChart } from 'lucide-react';

/**
 * Simplified props interface using engine results pattern.
 * Replaces ~20 individual props with 3 core data sources.
 */
interface HDCTaxReportJsPDFProps {
  /** Calculator input parameters */
  params: CalculationParams;
  /** Calculated investor results (engine output) */
  investorResults: InvestorAnalysisResults | null;
  /** HDC analysis results (engine output) */
  hdcResults?: HDCAnalysisResults | null;
  /** Project name for display */
  projectName?: string;
}

export const HDCTaxReportJsPDFButton: React.FC<HDCTaxReportJsPDFProps> = ({
  params,
  investorResults,
  hdcResults,
  projectName,
}) => {
  if (!investorResults) return null;

  const generatePDF = () => {
    try {
      // Create landscape PDF matching Comprehensive Report format
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;
      const lineHeight = 7;
      const margin = 15;
      let currentPage = 1;

      // Colors matching Comprehensive Report
      const primaryColor: [number, number, number] = [64, 127, 127]; // HDC Teal
      const secondaryColor: [number, number, number] = [127, 189, 69]; // HDC Green
      const grayText: [number, number, number] = [100, 100, 100];
      const darkText: [number, number, number] = [40, 40, 40];

      // Extract values from params for readability
      const projectCost = params.projectCost || 0;
      const investorEquityPct = params.investorEquityPct || 35;
      const investorTrack = params.investorTrack || 'non-rep';
      const selectedState = params.selectedState || 'N/A';
      const w2Income = params.w2Income || 0;
      const businessIncome = params.businessIncome || 0;
      const iraBalance = params.iraBalance || 0;
      const passiveIncome = params.passiveIncome || 0;
      const assetSaleGain = params.assetSaleGain || 0;
      // Calculate outside investor debt from params
      const outsideInvestorDebt = projectCost * 1000000 * ((params.outsideInvestorSubDebtPct || 0) / 100);
      const outsideInvestorRate = params.outsideInvestorSubDebtPikRate || 0;
      const outsideInvestorCurrentPay = params.outsideInvestorPikCurrentPayEnabled ? ((params.outsideInvestorPikCurrentPayPct || 0) / 100) : 0;
      const interestReserveAmount = params.interestReserveMonths || 0;
      const ozBasis = params.deferredCapitalGains || 0;
      const taxBenefitDelayMonths = params.taxBenefitDelayMonths || 0;
      const hdcDeferredFeeRate = params.hdcDeferredInterestRate || 0.08;
      const bonusConformityRate = params.bonusConformityRate || 1;

      // IMPL-033: Use conformity-adjusted engine values for tax benefits
      const year1TaxBenefit = investorResults.investorCashFlows?.[0]?.taxBenefit || 0;
      const year1NetBenefit = investorResults.depreciationSchedule?.schedule?.[0]?.netBenefit || year1TaxBenefit * 0.9;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number = 30) => {
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

      // Add header function
      const addHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.text('HDC Tax Strategy Analysis Report', margin, 10);
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        // Format timestamp in PT military time
        const now = new Date();
        const ptTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const timestamp = `${ptTime.toLocaleDateString()} ${ptTime.getHours().toString().padStart(2, '0')}:${ptTime.getMinutes().toString().padStart(2, '0')} PT`;
        doc.text(`Generated: ${timestamp}`, pageWidth - margin - 60, 10);
      };

      // Add footer function
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

      // Add section title function
      const addSectionTitle = (title: string) => {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += lineHeight * 1.5;
        doc.setFont('helvetica', 'normal');
      };

      // Helper function to format currency
      const formatMoney = (value: number): string => {
        // Handle values that might be in millions (< 1000) vs raw dollars
        const actualValue = value < 1000 && value !== 0 ? value * 1000000 : value;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(actualValue);
      };

      // Helper function to format percent
      // Note: Values come in different formats - some are decimals (0.08), some are percentages (8)
      const formatPercent = (value: number): string => {
        return `${value.toFixed(1)}%`;
      };

      // Helper to format rate - handles both decimal (0.08) and percentage (8) formats
      // If value > 1, assume it's already a percentage; if <= 1, multiply by 100
      const formatRate = (value: number): string => {
        const pct = value > 1 ? value : value * 100;
        return `${pct.toFixed(2)}%`;
      };

      // Calculate values from params
      const investorEquity = projectCost * (investorEquityPct / 100);
      const isFreeInvestment = year1NetBenefit >= investorEquity;

      // autoTable imported at top of file

      // Page 1: Executive Summary
      addHeader();

      // Title section with colored background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('HDC TAX STRATEGY ANALYSIS', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(projectName ? `${projectName} - Opportunity Zone Investment Report` : 'Opportunity Zone Investment Report', pageWidth / 2, 30, { align: 'center' });

      yPosition = 50;

      // Executive Summary Section
      addSectionTitle('EXECUTIVE SUMMARY');

      // Free Investment Highlight Box
      if (isFreeInvestment) {
        doc.setFillColor(232, 245, 233);
        doc.roundedRect(margin, yPosition - 5, pageWidth - margin * 2, 15, 3, 3, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 125, 50);
        doc.text('✓ FREE INVESTMENT ACHIEVED IN YEAR 1', pageWidth / 2, yPosition + 3, { align: 'center' });
      } else {
        doc.setFillColor(255, 253, 231);
        doc.roundedRect(margin, yPosition - 5, pageWidth - margin * 2, 15, 3, 3, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 127, 23);
        const recoveryYears = year1NetBenefit > 0 ? Math.ceil((investorEquity - year1NetBenefit) / (year1NetBenefit * 0.2)) : 10;
        doc.text(`⚠ Investment Recovery Timeline: ${recoveryYears} Years`, pageWidth / 2, yPosition + 3, { align: 'center' });
      }
      yPosition += lineHeight * 3;

      // Key Metrics Table - using engine values
      const metricsData = [
        ['Metric', 'Value'],
        ['Total Project Cost', formatMoney(projectCost)],
        [`Your Investment (${investorEquityPct}%)`, formatMoney(investorEquity)],
        ['Year 1 Tax Benefit (Net)', formatMoney(year1NetBenefit)],
        ['10-Year Total Return', formatMoney(investorResults.totalReturns || 0)],
        ['Investment Multiple', `${(investorResults.multiple || 0).toFixed(2)}x`],
        ['IRR', formatRate(investorResults.irr || 0)],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [metricsData[0]],
        body: metricsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [64, 127, 127], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', cellWidth: 60 }
        },
        margin: { left: margin },
        tableWidth: 180
      });

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // Investor Profile Section
      addSectionTitle('INVESTOR PROFILE');

      // ISS-062: Complete tax parameter coverage in Tax Report
      const profileTableData = [
        ['Parameter', 'Value'],
        ['Tax Status', investorTrack === 'rep' ? 'Real Estate Professional' : 'Passive Investor'],
        // ISS-059: Add Investor Profile fields
        ['Annual Income', formatMoney(params.annualIncome || 0)],
        ['Filing Status', params.filingStatus === 'married' ? 'Married Filing Jointly' : 'Single'],
        ['State', selectedState],
        ['Federal Tax Rate', formatPercent(params.federalTaxRate || 37)],
        ['State Tax Rate', formatPercent(params.stateTaxRate || 0)],
        ['LT Capital Gains Rate', formatPercent(params.ltCapitalGainsRate || 20)],
        ['State Capital Gains Rate', formatPercent(params.stateCapitalGainsRate || 0)],
        ['NIIT Rate', formatPercent(params.niitRate || 3.8)],
        ['Depreciation Recapture Rate', formatPercent(params.depreciationRecaptureRate || 25)],
      ];

      if (investorTrack === 'rep') {
        profileTableData.push(
          ['W-2 Income', formatMoney(w2Income)],
          ['Business Income', formatMoney(businessIncome)],
          ['IRA Balance', formatMoney(iraBalance)]
        );
      } else {
        profileTableData.push(
          ['Passive Income', formatMoney(passiveIncome)],
          ['Capital Gains to Offset', formatMoney(assetSaleGain)]
        );
      }

      autoTable(doc, {
        startY: yPosition,
        head: [profileTableData[0]],
        body: profileTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [127, 189, 69], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', cellWidth: 60 }
        },
        margin: { left: margin + 140 },
        tableWidth: 140
      });

      yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

      // Page 2: Comprehensive Cash Flow Analysis
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();
      addSectionTitle('10-YEAR INVESTOR CASH FLOW ANALYSIS');

      // IMPL-033: Use engine cash flows with conformity-adjusted tax benefits
      if (investorResults.investorCashFlows && investorResults.investorCashFlows.length > 0) {
        const cashFlowHeaders = ['Year', 'Operating', 'Tax Benefit', 'OZ Tax', 'Exit', 'Total'];

        const cashFlowData: string[][] = [];
        let totalOperating = 0;
        let totalTaxBenefits = 0;
        let totalOZTax = 0;
        let totalExit = 0;
        let grandTotal = 0;

        investorResults.investorCashFlows.forEach((cf, index) => {
          const year = index + 1;
          // Use engine values directly (already conformity-adjusted)
          const operating = cf.operatingCashFlow || 0;
          const taxBenefit = cf.taxBenefit || 0;
          const ozTax = cf.ozYear5TaxPayment || 0;
          const exit = cf.exitProceeds || 0;
          const total = operating + taxBenefit - ozTax + exit;

          totalOperating += operating;
          totalTaxBenefits += taxBenefit;
          totalOZTax += ozTax;
          totalExit += exit;
          grandTotal += total;

          cashFlowData.push([
            String(year),
            formatMoney(operating),
            formatMoney(taxBenefit),
            ozTax > 0 ? `(${formatMoney(ozTax)})` : '-',
            exit > 0 ? formatMoney(exit) : '-',
            formatMoney(total)
          ]);
        });

        // Add totals row
        cashFlowData.push([
          'Total',
          formatMoney(totalOperating),
          formatMoney(totalTaxBenefits),
          totalOZTax > 0 ? `(${formatMoney(totalOZTax)})` : '-',
          formatMoney(totalExit),
          formatMoney(grandTotal)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [cashFlowHeaders],
          body: cashFlowData,
          theme: 'striped',
          headStyles: { fillColor: [64, 127, 127], textColor: 255 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: margin },
          didParseCell: function(data: any) {
            // Bold the totals row
            if (data.row.index === cashFlowData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;
      }

      // IMPL-041 State Conformity Note for Cash Flow section
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      const conformityNote = bonusConformityRate < 1
        ? `* Tax benefits use ${formatPercent(bonusConformityRate * 100)} state conformity rate for ${selectedState} bonus depreciation.`
        : `* Tax benefits use full state conformity for ${selectedState}.`;
      doc.text(conformityNote, margin, yPosition);
      yPosition += lineHeight;

      // Page 3: Depreciation Schedule
      checkPageBreak(150);
      if (yPosition > pageHeight - 80) {
        doc.addPage('a4', 'landscape');
        currentPage++;
        yPosition = margin;
        addHeader();
      }

      if (investorResults.depreciationSchedule) {
        addSectionTitle('10-YEAR TAX BENEFIT SCHEDULE');

        const depreciationHeaders = ['Year', 'Depreciation', 'Tax Benefit', 'HDC Fee', 'Net Benefit'];
        const depreciationData: string[][] = [];

        investorResults.depreciationSchedule.schedule.forEach((year) => {
          depreciationData.push([
            String(year.year),
            formatMoney(year.totalDepreciation),
            formatMoney(year.totalTaxBenefit),
            formatMoney(year.hdcFee),
            formatMoney(year.netBenefit)
          ]);
        });

        // Totals from engine
        depreciationData.push([
          'Total',
          formatMoney(investorResults.depreciationSchedule.totalDepreciation),
          formatMoney(investorResults.depreciationSchedule.totalTaxBenefit),
          formatMoney(investorResults.depreciationSchedule.totalHDCFees),
          formatMoney(investorResults.depreciationSchedule.totalNetBenefit)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [depreciationHeaders],
          body: depreciationData,
          theme: 'striped',
          headStyles: { fillColor: [127, 189, 69], textColor: 255 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: margin },
          didParseCell: function(data: any) {
            // Bold the totals row
            if (data.row.index === depreciationData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + lineHeight * 2;

        // IMPL-041 State Conformity Note for Depreciation section
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        if (bonusConformityRate < 1) {
          doc.text(`Note: Year 1 bonus depreciation uses ${formatPercent(bonusConformityRate * 100)} state conformity for ${selectedState}.`, margin, yPosition);
          yPosition += lineHeight * 0.7;
          doc.text('Years 2+ use full state rate (all states accept straight-line MACRS).', margin, yPosition);
        } else {
          doc.text(`State: ${selectedState} - Full conformity with federal depreciation rules.`, margin, yPosition);
        }
        yPosition += lineHeight;
      }

      // Page 3: Outside Investor Sub-Debt Details (if applicable)
      if (outsideInvestorDebt > 0) {
        doc.addPage('a4', 'landscape');
        currentPage++;
        yPosition = margin;
        addHeader();

        addSectionTitle('Outside Investor Sub-Debt Analysis');

        doc.setFontSize(11);
        doc.setTextColor(...darkText);

        const subDebtMetrics = [
          ['Initial Principal:', formatMoney(outsideInvestorDebt)],
          ['Interest Rate:', formatRate(outsideInvestorRate)],
          ['Current Pay %:', formatPercent(outsideInvestorCurrentPay * 100)],
          ['PIK Component %:', formatPercent((1 - outsideInvestorCurrentPay) * 100)],
        ];

        // Calculate PIK accumulation
        // Note: outsideInvestorRate may be percentage (8) or decimal (0.08), normalize to decimal
        const rateDecimal = outsideInvestorRate > 1 ? outsideInvestorRate / 100 : outsideInvestorRate;
        const pikRate = rateDecimal * (1 - outsideInvestorCurrentPay);
        const year10PIKBalance = outsideInvestorDebt * Math.pow(1 + pikRate, 10);
        const currentPayPerYear = outsideInvestorDebt * rateDecimal * outsideInvestorCurrentPay;
        subDebtMetrics.push(
          ['Year 10 PIK Balance:', formatMoney(year10PIKBalance)],
          ['Total Interest (10yr):', formatMoney((year10PIKBalance - outsideInvestorDebt) + (currentPayPerYear * 10))]
        );

        subDebtMetrics.forEach(([label, value]) => {
          doc.text(label, margin, yPosition);
          doc.text(value, pageWidth - margin - 50, yPosition);
          yPosition += lineHeight;
        });

        yPosition += lineHeight * 2;

        // DSCR Management Section
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('DSCR Management System', margin, yPosition);
        yPosition += lineHeight * 2;

        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        const dscrNotes = [
          '• Target DSCR maintained at exactly 1.05x',
          '• Outside Investor Sub-Debt has highest priority in waterfall',
          '• Automatic payment deferrals when needed to maintain coverage',
          '• All deferred amounts collected at exit with interest',
        ];

        dscrNotes.forEach((note) => {
          checkPageBreak();
          doc.text(note, margin, yPosition);
          yPosition += lineHeight;
        });
      }

      // Page 4: Interest Reserve & S-Curve Analysis
      if (interestReserveAmount > 0) {
        checkPageBreak(100);
        if (yPosition < 50) {
          doc.addPage('a4', 'landscape');
          currentPage++;
          yPosition = margin;
          addHeader();
        }

        addSectionTitle('Interest Reserve & Lease-Up Analysis');

        doc.setFontSize(11);
        doc.setTextColor(...darkText);

        const reserveMetrics = [
          ['Interest Reserve Months:', `${interestReserveAmount} months`],
          ['Lease-Up Model:', 'S-Curve (Monthly Average ~31%)'],
          ['Reserve Optimization:', '40-50% reduction vs. linear'],
        ];

        reserveMetrics.forEach(([label, value]) => {
          doc.text(label, margin, yPosition);
          doc.text(value, pageWidth - margin - 50, yPosition);
          yPosition += lineHeight;
        });
      }

      // Page 5: Cash Flow Waterfall at Exit
      checkPageBreak(150);
      if (yPosition < 50) {
        doc.addPage('a4', 'landscape');
        currentPage++;
        yPosition = margin;
        addHeader();
      }

      addSectionTitle('Exit Waterfall Distribution Order');

      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      const waterfallOrder = [
        '1. Senior Debt (Principal + Interest)',
        '2. Philanthropic Debt (Interest Only)',
        '3. Outside Investor Sub-Debt (Principal + PIK)',
        '4. Investor/HDC Sub-Debt',
        '5. Deferred HDC Fees (AUM + Tax Benefit)',
        '6. Investor Equity Recovery',
        '7. HDC Equity Recovery',
        '8. Promote Split (65% HDC / 35% Investor)',
      ];

      waterfallOrder.forEach((item) => {
        checkPageBreak();
        doc.text(item, margin + 5, yPosition);
        yPosition += lineHeight;
      });

      // LIHTC Tax Credits Section (ISS-045)
      if (params.lihtcEnabled || params.stateLIHTCEnabled) {
        checkPageBreak(120);
        if (yPosition < 50) {
          doc.addPage('a4', 'landscape');
          currentPage++;
          yPosition = margin;
          addHeader();
        }

        addSectionTitle('LIHTC Tax Credit Analysis');

        doc.setFontSize(11);
        doc.setTextColor(...darkText);

        const lihtcMetrics: [string, string][] = [];

        if (params.lihtcEnabled) {
          lihtcMetrics.push(['Federal LIHTC:', 'Enabled']);
          lihtcMetrics.push(['Credit Rate:', formatPercent((params.creditRate || 0.04) * 100)]);
          lihtcMetrics.push(['Applicable Fraction:', formatPercent(params.applicableFraction || 100)]);
          if (params.ddaQctBoost) {
            lihtcMetrics.push(['DDA/QCT Boost:', 'Yes (130% basis)']);
          }
          // Calculate 11-year federal credit total
          const federalCreditsTotal = investorResults.investorCashFlows?.reduce((sum, cf) =>
            sum + (cf.federalLIHTCCredit || 0), 0) || 0;
          lihtcMetrics.push(['Federal Credits (11yr):', formatMoney(federalCreditsTotal)]);
        }

        if (params.stateLIHTCEnabled) {
          lihtcMetrics.push(['State LIHTC:', 'Enabled']);
          lihtcMetrics.push(['Investor State:', params.investorState || 'N/A']);
          lihtcMetrics.push(['Syndication Rate:', formatPercent(params.syndicationRate || 85)]);
          lihtcMetrics.push(['Syndication Year:', `Year ${params.stateLIHTCSyndicationYear ?? 0}`]);
          // Calculate state credit total
          const stateCreditsTotal = investorResults.investorCashFlows?.reduce((sum, cf) =>
            sum + (cf.stateLIHTCCredit || 0), 0) || 0;
          const syndicationProceeds = investorResults.stateLIHTCSyndicationProceeds || 0;
          if (stateCreditsTotal > 0) {
            lihtcMetrics.push(['State Credits (11yr):', formatMoney(stateCreditsTotal)]);
          }
          if (syndicationProceeds > 0) {
            lihtcMetrics.push(['Syndication Proceeds:', formatMoney(syndicationProceeds)]);
          }
        }

        lihtcMetrics.forEach(([label, value]) => {
          doc.text(label, margin, yPosition);
          doc.text(value, pageWidth - margin - 50, yPosition);
          yPosition += lineHeight;
        });
      }

      // Page 6: OZ Tax Benefits & Timing
      if (ozBasis > 0 || params.ozEnabled) {
        checkPageBreak(120);
        if (yPosition < 50) {
          doc.addPage('a4', 'landscape');
          currentPage++;
          yPosition = margin;
          addHeader();
        }

        addSectionTitle('Opportunity Zone Tax Analysis');

        doc.setFontSize(11);
        doc.setTextColor(...darkText);

        // ISS-062: Add OZ version/type for complete tax parameter coverage
        const ozMetrics = [
          ['OZ Version:', params.ozVersion === '2.0' ? 'OZ 2.0 (OBBBA)' : 'OZ 1.0 (TCJA)'],
          ['OZ Type:', params.ozType === 'rural' ? 'Rural (30% step-up)' : 'Standard (10% step-up)'],
          ['Deferred Gain (OZ Basis):', formatMoney(ozBasis)],
          ['Year 5 Tax Payment:', formatMoney(ozBasis * 0.85 * 0.238)], // 15% reduction, 23.8% cap gains
          ['10-Year Hold Benefit:', '100% OZ gain elimination'],
        ];

        if (taxBenefitDelayMonths > 0) {
          ozMetrics.push(
            ['Tax Benefit Delay:', `${taxBenefitDelayMonths} months`],
            ['Impact on Amount:', 'None (timing only)']
          );
        }

        ozMetrics.forEach(([label, value]) => {
          doc.text(label, margin, yPosition);
          doc.text(value, pageWidth - margin - 50, yPosition);
          yPosition += lineHeight;
        });
      }

      // Page 7: HDC Fee Structure
      checkPageBreak(120);
      if (yPosition < 50) {
        doc.addPage('a4', 'landscape');
        currentPage++;
        yPosition = margin;
        addHeader();
      }

      addSectionTitle('HDC Fee Structure & Deferrals');

      doc.setFontSize(11);
      doc.setTextColor(...darkText);

      const feeStructure = [
        ['Tax Benefit Fee:', '10% of gross benefit'],
        ['AUM Fee:', '1% annually on equity'],
        ['Deferred Fee Interest:', formatRate(hdcDeferredFeeRate)],
        ['Collection Priority:', 'After all debt, before equity'],
      ];

      feeStructure.forEach(([label, value]) => {
        doc.text(label, margin, yPosition);
        doc.text(value, pageWidth - margin - 50, yPosition);
        yPosition += lineHeight;
      });

      yPosition += lineHeight;
      doc.setFontSize(10);
      doc.text('Deferral triggers when DSCR < 1.05x to protect project liquidity', margin, yPosition);
      yPosition += lineHeight * 2;

      // Tax Planning Recommendations
      doc.addPage('a4', 'landscape');
      currentPage++;
      yPosition = margin;
      addHeader();

      addSectionTitle('Tax Planning Recommendations');

      doc.setFontSize(11);
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'normal');

      const recommendations = investorTrack === 'rep'
        ? [
            '• Your §461(l) limitation caps W-2 offset at $626,000 annually',
            '• Excess losses will create NOL carryforward for future years',
            iraBalance > 0 ? '• Consider Roth IRA conversions to maximize tax capacity utilization' : null,
          ]
        : [
            '• You have unlimited passive loss offset capacity',
            '• Time capital gains events to maximize tax elimination',
            '• Consider accelerating gain recognition in Year 1',
          ];

      recommendations.filter(Boolean).forEach((rec) => {
        const lines = doc.splitTextToSize(rec!, pageWidth - margin * 2);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
      });

      // Summary Metrics Page (new page before disclaimers)
      if (hdcResults) {
        doc.addPage('a4', 'landscape');
        currentPage++;
        yPosition = margin;
        addHeader();

        addSectionTitle('Comprehensive Performance Metrics');

        // Investor Metrics
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text('Investor Returns', margin, yPosition);
        yPosition += lineHeight * 1.5;

        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        const investorMetrics = [
          ['Total Cash Distributions:', formatMoney(investorResults.totalReturns || 0)],
          ['Investment Multiple:', `${(investorResults.multiple || 0).toFixed(2)}x`],
          ['IRR:', formatRate(investorResults.irr || 0)],
          ['Year 1 Tax Benefit:', formatMoney(year1TaxBenefit)],
          ['10-Year Tax Benefits:', formatMoney(investorResults.depreciationSchedule?.totalNetBenefit || 0)],
        ];

        investorMetrics.forEach(([label, value]) => {
          doc.text(label, margin, yPosition);
          doc.text(value, pageWidth - margin - 50, yPosition);
          yPosition += lineHeight;
        });

        // HDC Metrics
        if (hdcResults.totalHDCReturns) {
          yPosition += lineHeight;
          doc.setFontSize(12);
          doc.setTextColor(...primaryColor);
          doc.text('HDC Returns', margin, yPosition);
          yPosition += lineHeight * 1.5;

          doc.setFontSize(10);
          doc.setTextColor(...darkText);
          const hdcMetrics = [
            ['Total Returns:', formatMoney(hdcResults.totalHDCReturns || 0)],
            ['Investment Multiple:', `${(hdcResults.hdcMultiple || 0).toFixed(2)}x`],
            ['IRR:', formatRate(hdcResults.hdcIRR || 0)],
            ['Total Fees Collected:', formatMoney((hdcResults.hdcFeeIncome || 0) + (hdcResults.hdcAumFeeIncome || 0))],
          ];

          hdcMetrics.forEach(([label, value]) => {
            doc.text(label, margin, yPosition);
            doc.text(value, pageWidth - margin - 50, yPosition);
            yPosition += lineHeight;
          });
        }
      }

      // Disclaimers
      checkPageBreak(100);
      if (yPosition < 50) {
        doc.addPage('a4', 'landscape');
        currentPage++;
        yPosition = margin;
        addHeader();
      }

      yPosition += lineHeight * 2;
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text('Important Disclosures', margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setFontSize(9);
      doc.setTextColor(...grayText);
      const disclaimer = `This analysis is provided for informational purposes only and should not be construed as tax, legal, or investment advice. The projections contained herein are based on various assumptions that may not materialize. Tax laws and regulations are complex and subject to change. Past performance is not indicative of future results. Investors should consult with their own tax advisors, attorneys, and financial advisors before making any investment decision.`;

      const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
      disclaimerLines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      // IMPL-041 State Conformity Disclaimer
      yPosition += lineHeight;
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      const conformityDisclaimer = `Tax benefits calculated using IMPL-041 state conformity logic. Bonus depreciation applies ${formatPercent(bonusConformityRate * 100)} state conformity for ${selectedState}. Years 2-10 use full state tax rate as all states accept straight-line MACRS depreciation.`;
      const conformityLines = doc.splitTextToSize(conformityDisclaimer, pageWidth - margin * 2);
      conformityLines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 4;
      });

      // Footer on last page
      yPosition = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Housing Diversity Corporation | www.housingdiversity.com | (555) 123-4567', pageWidth / 2, yPosition, { align: 'center' });
      doc.text(`© ${new Date().getFullYear()} Housing Diversity Corporation. All rights reserved.`, pageWidth / 2, yPosition + 5, { align: 'center' });

      // Save the PDF
      const filename = projectName
        ? `HDC_Tax_Strategy_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        : `HDC_Tax_Strategy_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      console.log('PDF generated successfully with jsPDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  };

  return (
    <Button
      onClick={generatePDF}
      className="!bg-[var(--hdc-sushi)] !px-1.5 !py-1 sm:!px-3 md:!px-4 md:!py-2 text-[10px] sm:text-xs md:text-sm hover:opacity-90"
    >
      <FileBarChart className="h-3 w-3 md:h-4 md:w-4" />
      <span className="hidden md:inline md:ml-2">Tax Report</span>
      <span className="hidden sm:inline md:hidden sm:ml-1">Tax</span>
    </Button>
  );
};

export default HDCTaxReportJsPDFButton;
