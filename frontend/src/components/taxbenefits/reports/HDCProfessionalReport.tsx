import React from 'react';
import jsPDF from 'jspdf';
import { InvestorAnalysisResults } from '../../../types/taxbenefits';

// Props interface
interface HDCProfessionalReportProps {
  investorResults: InvestorAnalysisResults | null;
  projectCost: number;
  investorEquityPct: number;
  investorTrack: 'rep' | 'non-rep';
  selectedState: string;
  w2Income?: number;
  businessIncome?: number;
  iraBalance?: number;
  passiveIncome?: number;
  assetSaleGain?: number;
  year1NetBenefit?: number;
  yearOneDepreciationPct?: number;
  formatCurrency: (value: number) => string;
}

export const HDCProfessionalReportButton: React.FC<HDCProfessionalReportProps> = ({
  investorResults,
  projectCost,
  investorEquityPct,
  investorTrack,
  selectedState,
  w2Income = 0,
  businessIncome = 0,
  iraBalance = 0,
  passiveIncome = 0,
  assetSaleGain = 0,
  year1NetBenefit = 0,
  yearOneDepreciationPct = 20,
}) => {
  if (!investorResults) return null;

  const generateProfessionalPDF = () => {
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const lineHeight = 7;
      const sectionSpacing = 12;

      // Color scheme
      const primaryColor: [number, number, number] = [64, 127, 127]; // HDC Teal
      const secondaryColor: [number, number, number] = [127, 189, 69]; // HDC Green
      const grayText: [number, number, number] = [100, 100, 100];
      const darkText: [number, number, number] = [40, 40, 40];

      // Helper functions
      const checkPageBreak = (requiredSpace: number = 30): boolean => {
        if (yPosition + requiredSpace > pageHeight - 25) {
          addFooter();
          doc.addPage();
          yPosition = margin;
          currentPage++;
          return true;
        }
        return false;
      };

      const formatMoney = (value: number): string => {
        // Use Intl.NumberFormat for proper comma formatting
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      };

      const formatFullMoney = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      };

      const addFooter = () => {
        doc.setFontSize(9);
        doc.setTextColor(...grayText);
        doc.text(
          `Housing Diversity Corporation | Confidential | Page ${currentPage} of 4`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        );
      };

      const drawSectionHeader = (title: string, subtitle?: string) => {
        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += lineHeight;

        if (subtitle) {
          doc.setFontSize(10);
          doc.setTextColor(...grayText);
          doc.setFont('helvetica', 'normal');
          doc.text(subtitle, margin, yPosition);
          yPosition += lineHeight;
        }

        // Draw line under header
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += sectionSpacing;
      };

      const drawKeyValuePair = (label: string, value: string, indent: number = 0) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkText);
        doc.text(label, margin + indent, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageWidth - margin - 40, yPosition);
        yPosition += lineHeight;
      };

      const drawHighlightBox = (text: string, color: 'green' | 'yellow' | 'red' = 'green') => {
        const boxHeight = 15;
        const colorMap: Record<string, [number, number, number]> = {
          green: [232, 245, 233],
          yellow: [255, 253, 231],
          red: [255, 235, 238],
        };
        const textColorMap: Record<string, [number, number, number]> = {
          green: [46, 125, 50],
          yellow: [245, 127, 23],
          red: [198, 40, 40],
        };

        doc.setFillColor(...colorMap[color]);
        doc.roundedRect(margin, yPosition - 5, pageWidth - margin * 2, boxHeight, 3, 3, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColorMap[color]);
        doc.text(text, pageWidth / 2, yPosition + 3, { align: 'center' });
        yPosition += boxHeight + 5;
      };

      // Calculate values
      const investorEquity = projectCost * (investorEquityPct / 100);
      const isFreeInvestment = year1NetBenefit >= investorEquity;

      // Format timestamp in PT military time
      const now = new Date();
      const ptTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      const currentDate = ptTime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStamp = `${ptTime.getHours().toString().padStart(2, '0')}:${ptTime.getMinutes().toString().padStart(2, '0')} PT`;

      let yPosition = margin;
      let currentPage = 1;

      // ========== PAGE 1: EXECUTIVE SUMMARY ==========
      // Header with logo placeholder
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('HDC TAX STRATEGY REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Opportunity Zone Investment Analysis', pageWidth / 2, 30, { align: 'center' });

      yPosition = 55;

      // Report metadata
      doc.setFontSize(10);
      doc.setTextColor(...grayText);
      doc.text(`Generated: ${currentDate} at ${timeStamp}`, margin, yPosition);
      doc.text(`Investor Type: ${investorTrack === 'rep' ? 'Real Estate Professional' : 'Passive Investor'}`, pageWidth - margin - 60, yPosition);
      yPosition += lineHeight * 2;

      // Investment Highlight
      if (isFreeInvestment) {
        drawHighlightBox('✓ FREE INVESTMENT ACHIEVED IN YEAR 1', 'green');
      } else {
        const recoveryYears = Math.ceil((investorEquity - year1NetBenefit) / (year1NetBenefit * 0.2));
        drawHighlightBox(`⚠ Investment Recovery Timeline: ${recoveryYears} Years`, 'yellow');
      }
      yPosition += 5;

      // Executive Summary Section
      drawSectionHeader('Executive Summary', 'Key Investment Metrics & Returns');

      // Create two-column layout for metrics
      const col1X = margin;
      const col2X = pageWidth / 2 + 10;
      const savedY = yPosition;

      // Column 1 - Investment Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Investment Details', col1X, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      const investmentDetails = [
        ['Total Project Cost:', formatFullMoney(projectCost * 1000000)],
        ['Your Equity Investment:', formatFullMoney(investorEquity * 1000000)],
        ['Ownership Percentage:', `${investorEquityPct}%`],
        ['Investment Hold Period:', '10 Years'],
        ['State:', selectedState],
      ];

      investmentDetails.forEach(([label, value]) => {
        doc.text(label, col1X, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(value, col2X - 20, yPosition, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPosition += lineHeight - 1;
      });

      // Column 2 - Returns & Performance
      yPosition = savedY;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Returns & Performance', col2X, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      const returnsDetails = [
        ['10-Year Total Return:', formatFullMoney(investorResults.totalReturns)],
        ['Investment Multiple:', `${(investorResults.multiple || 0).toFixed(2)}x`],
        ['Internal Rate of Return:', `${(investorResults.irr * 100).toFixed(1)}%`],
        ['Year 1 Tax Benefit:', formatFullMoney(year1NetBenefit * 1000000)],
        ['Total Tax Benefits:', formatFullMoney(investorResults.investorTaxBenefits || 0)],
      ];

      returnsDetails.forEach(([label, value]) => {
        doc.text(label, col2X, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageWidth - margin, yPosition, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPosition += lineHeight - 1;
      });

      yPosition += sectionSpacing;

      // Tax Strategy Overview
      drawSectionHeader('Tax Strategy Overview');

      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      const taxStrategyText = investorTrack === 'rep'
        ? `As a Real Estate Professional, you can offset up to $626,000 of W-2 income annually under §461(l) limitations.
Your current W-2 income of ${formatFullMoney(w2Income)} ${w2Income > 626000 ? 'exceeds' : 'is within'} this limit.
${businessIncome > 0 ? `Additionally, your business income of ${formatFullMoney(businessIncome)} can be fully offset without limitation.` : ''}
${iraBalance > 0 ? `Consider strategic Roth IRA conversions using your ${formatFullMoney(iraBalance)} traditional IRA balance to maximize tax capacity utilization.` : ''}`
        : `As a Passive Investor, you have unlimited capacity to offset passive income and capital gains.
${passiveIncome > 0 ? `Your annual passive income of ${formatFullMoney(passiveIncome)} can be fully offset.` : ''}
${assetSaleGain > 0 ? `You can eliminate taxes on ${formatFullMoney(assetSaleGain)} of capital gains from asset sales.` : ''}
This strategy provides maximum flexibility for timing gain recognition events.`;

      const lines = doc.splitTextToSize(taxStrategyText, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += lineHeight - 1;
      });

      addFooter();

      // ========== PAGE 2: DEPRECIATION & TAX BENEFITS ==========
      doc.addPage();
      currentPage = 2;
      yPosition = margin;

      drawSectionHeader('10-Year Depreciation Schedule', 'Tax Benefits Analysis with HDC Fee Structure');

      if (investorResults.depreciationSchedule) {
        // Table setup
        const tableStartY = yPosition;
        const colWidths = [25, 35, 35, 30, 35, 35];
        const colX = [margin];
        for (let i = 1; i < colWidths.length; i++) {
          colX.push(colX[i - 1] + colWidths[i - 1]);
        }

        // Table header
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 10, 'F');

        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        const headers = ['Year', 'Depreciation', 'Tax Benefit', 'HDC Fee', 'Net Benefit', 'Cumulative'];
        headers.forEach((header, i) => {
          doc.text(header, colX[i] + 2, yPosition);
        });
        yPosition += lineHeight + 3;

        // Table rows
        doc.setFont('helvetica', 'normal');
        investorResults.depreciationSchedule.schedule.forEach((year, index) => {
          checkPageBreak();

          // Alternate row coloring
          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 7, 'F');
          }

          doc.setTextColor(...darkText);
          doc.setFontSize(9);
          doc.text(String(year.year), colX[0] + 2, yPosition);
          doc.text(formatMoney(year.totalDepreciation), colX[1] + 2, yPosition);
          doc.text(formatMoney(year.totalTaxBenefit), colX[2] + 2, yPosition);
          doc.text(formatMoney(year.hdcFee), colX[3] + 2, yPosition);
          doc.setFont('helvetica', 'bold');
          doc.text(formatMoney(year.netBenefit), colX[4] + 2, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(formatMoney(year.cumulativeNetBenefit), colX[5] + 2, yPosition);
          yPosition += lineHeight - 1;
        });

        // Total row
        yPosition += 3;
        doc.setFillColor(...secondaryColor);
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('TOTAL', colX[0] + 2, yPosition);
        doc.text(formatMoney(investorResults.depreciationSchedule.totalDepreciation), colX[1] + 2, yPosition);
        doc.text(formatMoney(investorResults.depreciationSchedule.totalTaxBenefit), colX[2] + 2, yPosition);
        doc.text(formatMoney(investorResults.depreciationSchedule.totalHDCFees), colX[3] + 2, yPosition);
        doc.text(formatMoney(investorResults.depreciationSchedule.totalNetBenefit), colX[4] + 2, yPosition);
        yPosition += lineHeight + 5;
      }

      // Key Insights
      drawSectionHeader('Depreciation Insights');

      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      const insights = [
        `• Year 1 includes ${yearOneDepreciationPct}% bonus depreciation from cost segregation study`,
        '• Years 2-10 utilize straight-line depreciation on remaining basis',
        '• HDC fee of 10% applies to all tax benefits generated',
        '• Total depreciation represents full recovery of building basis',
        `• Effective tax rate for benefits: ${((investorResults.depreciationSchedule?.totalTaxBenefit || 0) / (investorResults.depreciationSchedule?.totalDepreciation || 1) * 100).toFixed(1)}%`,
      ];

      insights.forEach((insight) => {
        checkPageBreak();
        doc.text(insight, margin, yPosition);
        yPosition += lineHeight;
      });

      addFooter();

      // ========== PAGE 3: CASH FLOW ANALYSIS ==========
      doc.addPage();
      currentPage = 3;
      yPosition = margin;

      drawSectionHeader('Investment Cash Flow Analysis', '10-Year Projected Returns');

      // Annual Cash Flow Table
      if (investorResults.investorCashFlows && investorResults.investorCashFlows.length > 0) {
        const tableColWidths = [25, 40, 40, 40, 40];
        const tableColX = [margin];
        for (let i = 1; i < tableColWidths.length; i++) {
          tableColX.push(tableColX[i - 1] + tableColWidths[i - 1]);
        }

        // Table header
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 10, 'F');

        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        const cfHeaders = ['Year', 'Operating CF', 'Tax Benefit', 'Debt Service', 'Net Cash Flow'];
        cfHeaders.forEach((header, i) => {
          doc.text(header, tableColX[i] + 2, yPosition);
        });
        yPosition += lineHeight + 3;

        // Table rows
        doc.setFont('helvetica', 'normal');
        let totalOperatingCF = 0;
        let totalTaxBenefits = 0;
        let totalDebtService = 0;
        let totalNetCF = 0;

        investorResults.investorCashFlows.slice(0, 10).forEach((cf, index) => {
          checkPageBreak();

          // Alternate row coloring
          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 7, 'F');
          }

          const taxBenefit = investorResults.depreciationSchedule?.schedule[index]?.netBenefit || 0;
          const debtService = cf.debtService || 0;
          const netCF = (cf.operatingCashFlow || 0) + taxBenefit - debtService;

          totalOperatingCF += cf.operatingCashFlow || 0;
          totalTaxBenefits += taxBenefit;
          totalDebtService += debtService;
          totalNetCF += netCF;

          doc.setTextColor(...darkText);
          doc.setFontSize(9);
          doc.text(String(index + 1), tableColX[0] + 2, yPosition);
          doc.text(formatMoney(cf.operatingCashFlow || 0), tableColX[1] + 2, yPosition);
          doc.text(formatMoney(taxBenefit), tableColX[2] + 2, yPosition);
          doc.text(formatMoney(debtService), tableColX[3] + 2, yPosition, { align: 'right' });
          doc.setFont('helvetica', 'bold');
          doc.text(formatMoney(netCF), tableColX[4] + 2, yPosition);
          doc.setFont('helvetica', 'normal');
          yPosition += lineHeight - 1;
        });

        // Exit year (Year 10 special)
        yPosition += 3;
        doc.setFillColor(255, 243, 224);
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Exit', tableColX[0] + 2, yPosition);
        doc.text(formatMoney(investorResults.exitProceeds || 0), tableColX[4] + 2, yPosition);
        yPosition += lineHeight + 3;

        // Total row
        doc.setFillColor(...secondaryColor);
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.text('TOTAL', tableColX[0] + 2, yPosition);
        doc.text(formatMoney(totalOperatingCF), tableColX[1] + 2, yPosition);
        doc.text(formatMoney(totalTaxBenefits), tableColX[2] + 2, yPosition);
        doc.text(formatMoney(totalDebtService), tableColX[3] + 2, yPosition, { align: 'right' });
        doc.text(formatMoney(investorResults.totalReturns), tableColX[4] + 2, yPosition);
        yPosition += lineHeight + 5;
      }

      // Return Metrics Summary
      drawSectionHeader('Return Analysis');

      const metricsData = [
        ['Total Investment:', formatFullMoney(investorResults.totalInvestment)],
        ['Total Returns:', formatFullMoney(investorResults.totalReturns)],
        ['Net Profit:', formatFullMoney(investorResults.totalReturns - investorResults.totalInvestment)],
        ['Return on Investment:', `${((investorResults.totalReturns / investorResults.totalInvestment - 1) * 100).toFixed(1)}%`],
        ['Annualized Return:', `${(investorResults.irr * 100).toFixed(2)}%`],
      ];

      doc.setFontSize(10);
      metricsData.forEach(([label, value]) => {
        doc.setTextColor(...darkText);
        doc.setFont('helvetica', 'normal');
        doc.text(label, margin, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageWidth / 2, yPosition);
        yPosition += lineHeight;
      });

      addFooter();

      // ========== PAGE 4: TAX PLANNING & NEXT STEPS ==========
      doc.addPage();
      currentPage = 4;
      yPosition = margin;

      drawSectionHeader('Strategic Tax Planning Recommendations');

      doc.setFontSize(10);
      doc.setTextColor(...darkText);

      if (investorTrack === 'rep') {
        // REP-specific recommendations
        const repStrategies = [
          {
            title: '§461(l) Limitation Management',
            points: [
              `Your W-2 offset capacity is limited to $626,000 annually`,
              `Current W-2 income: ${formatFullMoney(w2Income)}`,
              `${w2Income > 626000 ? 'Consider deferring excess losses as NOL carryforward' : 'You have additional capacity for W-2 offset'}`,
            ]
          },
          {
            title: 'Business Income Optimization',
            points: [
              `Business income of ${formatFullMoney(businessIncome)} has no offset limitations`,
              'Time business income recognition to maximize tax benefits',
              'Consider accelerating business expenses in high-income years',
            ]
          },
          iraBalance > 0 ? {
            title: 'Roth IRA Conversion Strategy',
            points: [
              `Convert portions of your ${formatFullMoney(iraBalance)} traditional IRA`,
              'Use depreciation losses to offset conversion taxes',
              'Spread conversions over multiple years for optimal tax efficiency',
            ]
          } : null,
        ].filter(Boolean);

        repStrategies.forEach((strategy: any) => {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(...primaryColor);
          doc.text(strategy.title, margin, yPosition);
          yPosition += lineHeight;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...darkText);
          strategy.points.forEach((point: string) => {
            doc.text(`• ${point}`, margin + 5, yPosition);
            yPosition += lineHeight - 1;
          });
          yPosition += 5;
        });
      } else {
        // Non-REP recommendations
        const nonRepStrategies = [
          {
            title: 'Passive Loss Utilization',
            points: [
              'Unlimited capacity to offset passive income',
              `Current passive income: ${formatFullMoney(passiveIncome)}`,
              'Consider consolidating passive investments for maximum benefit',
            ]
          },
          {
            title: 'Capital Gains Timing',
            points: [
              `Potential to offset ${formatFullMoney(assetSaleGain)} in gains`,
              'Time asset sales to coincide with maximum depreciation years',
              `Consider harvesting gains in Year 1 for ${yearOneDepreciationPct}% bonus depreciation`,
            ]
          },
          {
            title: 'Investment Structuring',
            points: [
              'Maintain passive investor status for maximum flexibility',
              'Document limited participation to preserve passive treatment',
              'Consider grouping elections for related activities',
            ]
          },
        ];

        nonRepStrategies.forEach((strategy) => {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(...primaryColor);
          doc.text(strategy.title, margin, yPosition);
          yPosition += lineHeight;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...darkText);
          strategy.points.forEach((point) => {
            doc.text(`• ${point}`, margin + 5, yPosition);
            yPosition += lineHeight - 1;
          });
          yPosition += 5;
        });
      }

      // Next Steps
      yPosition += 5;
      drawSectionHeader('Next Steps');

      const nextSteps = [
        '1. Review this analysis with your CPA or tax advisor',
        '2. Confirm your tax status and available offset capacity',
        '3. Schedule consultation with Housing Diversity Corporation team',
        '4. Complete investor accreditation documentation',
        '5. Execute subscription documents',
        '6. Fund investment before year-end for maximum Year 1 benefits',
      ];

      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      nextSteps.forEach((step) => {
        checkPageBreak();
        doc.text(step, margin, yPosition);
        yPosition += lineHeight;
      });

      // Important Disclaimers
      yPosition += 10;
      checkPageBreak(50);

      doc.setFillColor(255, 243, 224);
      doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 45, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Important Disclaimers', margin + 5, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      const disclaimerText = `This analysis is provided for informational purposes only and should not be construed as tax, legal, or investment advice.
The projections contained herein are based on various assumptions that may not materialize. Tax laws and regulations are complex
and subject to change. Past performance is not indicative of future results. The tax benefits described may not be available to all
investors and depend on individual tax circumstances. Investors should consult with their own tax advisors, attorneys, and financial
advisors before making any investment decision. Housing Diversity Corporation makes no representations or warranties as to the accuracy or
completeness of the information contained in this report.`;

      const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - margin * 2 - 10);
      disclaimerLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });

      // Contact Information
      yPosition = pageHeight - 30;
      doc.setFillColor(...primaryColor);
      doc.rect(0, yPosition - 5, pageWidth, 35, 'F');

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Housing Diversity Corporation', pageWidth / 2, yPosition, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('www.housingdiversity.com | info@housingdiversity.com | (555) 123-4567', pageWidth / 2, yPosition + 6, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`© ${new Date().getFullYear()} Housing Diversity Corporation. All rights reserved. | Report Date: ${currentDate}`, pageWidth / 2, yPosition + 12, { align: 'center' });

      // Save the PDF
      const fileName = `HDC_Professional_Report_${investorTrack.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      console.log('Professional PDF report generated successfully');

    } catch (error) {
      console.error('Error generating professional PDF:', error);
      alert('Error generating PDF report. Please check the console for details.');
    }
  };

  return (
    <button
      onClick={generateProfessionalPDF}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#7FBD45',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#6ca935';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#7FBD45';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      📊 Download Professional Report
    </button>
  );
};

export default HDCProfessionalReportButton;