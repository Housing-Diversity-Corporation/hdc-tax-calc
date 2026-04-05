/**
 * IMPL-151: Wealth Manager Summary Export
 *
 * One-page client-meeting handout PDF for Screen 2 (FundDetail).
 * Uses jsPDF + jspdf-autotable. Reuses HDC brand colors from existing reports.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnnualUtilization, TaxUtilizationResult } from './taxbenefits/investorTaxUtilization';
import type { IRAConversionPlan } from '../types/taxbenefits';

// ─── HDC Brand Colors ────────────────────────────────────────────────────────
const PRIMARY: [number, number, number] = [64, 127, 127];   // Faded Jade #407F7F
const GREEN: [number, number, number] = [127, 189, 69];     // Sushi #7FBD45
const DARK: [number, number, number] = [71, 74, 68];        // Cabbage Pont #474A44
const GRAY: [number, number, number] = [120, 120, 120];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_BG: [number, number, number] = [245, 249, 249]; // very light teal tint

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function fmtPctRaw(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Export Data Interface ───────────────────────────────────────────────────
export interface WealthManagerExportData {
  // Header
  fundName: string;
  investorName: string;

  // Investment Summary
  optimalCommitment: number;       // dollars
  constraintBinding: string;
  holdPeriod: number;
  savingsPerDollar: number;
  utilizationRate: number;         // 0–1

  // Year 1 Tax Impact
  year1Depreciation: number;       // millions
  year1TaxSavings: number;         // millions
  preHDCRate: number;              // % e.g. 47.9
  postHDCRate: number;             // % e.g. 0
  treatment: string;               // label e.g. "REP — Nonpassive Treatment"

  // Annual Profile
  annualUtilization: AnnualUtilization[];
  isNonpassive: boolean;

  // Roth Conversion (optional — REP + IRA balance only)
  rothConversion?: {
    iraBalance: number;
    optimalConversion: number;
    conversionWindow: number;       // years
    effectiveRate: number;          // post-HDC rate %
    year30RothValue: number;
    lifetimeAdvantage: number;
  };
}

// ─── PDF Generator ───────────────────────────────────────────────────────────
export function exportWealthManagerSummary(data: WealthManagerExportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.width;   // ~215.9
  const ph = doc.internal.pageSize.height;  // ~279.4
  const m = 16; // margin
  const cw = pw - 2 * m;                    // content width
  let y = m;

  // ── Timestamp ──────────────────────────────────────────────────────────────
  const now = new Date();
  const ptTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const dateStr = ptTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ══════════════════════════════════════════════════════════════════════════
  //  HEADER BAND
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pw, 32, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('Housing Diversity Corporation', m, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Investment Summary', m, 19);

  doc.setFontSize(8);
  doc.text(`Prepared for: ${data.investorName}`, m, 25);
  doc.text(dateStr, pw - m, 12, { align: 'right' });
  doc.text('Strictly Confidential', pw - m, 19, { align: 'right' });

  y = 38;

  // ── Fund name ──────────────────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(data.fundName, m, y);
  y += 3;

  // green underline
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  doc.line(m, y, pw - m, y);
  y += 7;

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 1 + 2: Two-column layout (Investment Summary / Year 1 Tax Impact)
  // ══════════════════════════════════════════════════════════════════════════
  const colW = (cw - 6) / 2; // 6mm gap between columns
  const col1X = m;
  const col2X = m + colW + 6;
  const sectionStartY = y;

  // ── Section 1: Investment Summary (left column) ────────────────────────────
  drawSectionLabel(doc, 'Investment Summary', col1X, y);
  y += 6;

  const leftRows: [string, string][] = [
    ['Optimal Commitment', fmtMoney(data.optimalCommitment)],
    ['Binding Constraint', data.constraintBinding],
    ['Hold Period', `${data.holdPeriod} years`],
    ['Savings per Dollar', `$${data.savingsPerDollar.toFixed(2)}`],
    ['Utilization Rate', fmtPct(data.utilizationRate)],
    ['Tax Treatment', data.treatment],
  ];
  y = drawKVBlock(doc, leftRows, col1X, y, colW);

  // ── Section 2: Year 1 Tax Impact (right column) ───────────────────────────
  let y2 = sectionStartY;
  drawSectionLabel(doc, 'Year 1 Tax Impact', col2X, y2);
  y2 += 6;

  const rightRows: [string, string][] = [
    ['Bonus Depreciation', fmtMoney(data.year1Depreciation * 1_000_000)],
    ['Tax Savings', fmtMoney(data.year1TaxSavings * 1_000_000)],
    ['Pre-HDC Effective Rate', fmtPctRaw(data.preHDCRate)],
    ['Post-HDC Effective Rate', fmtPctRaw(data.postHDCRate)],
    ['Rate Compression', `${(data.preHDCRate - data.postHDCRate).toFixed(1)} pts`],
  ];
  y2 = drawKVBlock(doc, rightRows, col2X, y2, colW);

  y = Math.max(y, y2) + 6;

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 3: Annual Tax Profile (condensed table)
  // ══════════════════════════════════════════════════════════════════════════
  drawSectionLabel(doc, 'Annual Tax Profile', m, y);
  y += 2;

  // Build rows — limit to first 11 years (credit period) plus running cumulative
  const maxRows = Math.min(11, data.annualUtilization.length);
  let cumSavings = 0;

  const head = data.isNonpassive
    ? [['Year', 'Depr Tax Savings', 'LIHTC Used', 'NOL Pool', 'Cumulative Savings']]
    : [['Year', 'Depr Tax Savings', 'LIHTC Used', 'Suspended Loss', 'Cumulative Savings']];

  const body: string[][] = [];
  for (let i = 0; i < maxRows; i++) {
    const yr = data.annualUtilization[i];
    cumSavings += (yr.depreciationTaxSavings + yr.lihtcUsable); // both in millions
    const trackCol = data.isNonpassive
      ? fmtMoney(yr.nolPool * 1_000_000)
      : fmtMoney(yr.cumulativeSuspendedLoss * 1_000_000);
    body.push([
      `${yr.year}`,
      fmtMoney(yr.depreciationTaxSavings * 1_000_000),
      fmtMoney(yr.lihtcUsable * 1_000_000),
      trackCol,
      fmtMoney(cumSavings * 1_000_000),
    ]);
  }

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY,
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: DARK,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: m, right: m },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 4: Roth Conversion Window (conditional)
  // ══════════════════════════════════════════════════════════════════════════
  if (data.rothConversion) {
    drawSectionLabel(doc, 'Roth Conversion Window', m, y);
    y += 6;

    const rothRows: [string, string][] = [
      ['IRA Balance', fmtMoney(data.rothConversion.iraBalance)],
      ['Optimal Annual Conversion', fmtMoney(data.rothConversion.optimalConversion)],
      ['Conversion Window', `${data.rothConversion.conversionWindow} years`],
      ['Effective Conversion Rate', fmtPctRaw(data.rothConversion.effectiveRate)],
      ['Projected Roth Value (Yr 30)', fmtMoney(data.rothConversion.year30RothValue)],
      ['Lifetime Advantage', fmtMoney(data.rothConversion.lifetimeAdvantage)],
    ];
    y = drawKVBlock(doc, rothRows, m, y, cw);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'All projections are estimates subject to change. Prospective investors should consult qualified legal and tax counsel.',
    pw / 2,
    ph - 14,
    { align: 'center', maxWidth: cw }
  );

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Housing Diversity Corporation | Confidential | Page 1 of 1`,
    pw / 2,
    ph - 8,
    { align: 'center' }
  );

  // ── Download ───────────────────────────────────────────────────────────────
  const safeName = data.fundName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  const fileName = `HDC_Summary_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ─── Drawing Helpers ─────────────────────────────────────────────────────────

function drawSectionLabel(doc: jsPDF, label: string, x: number, y: number): void {
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, y);

  // thin green line under label
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.3);
  doc.line(x, y + 1.5, x + doc.getTextWidth(label), y + 1.5);
}

function drawKVBlock(
  doc: jsPDF,
  rows: [string, string][],
  x: number,
  y: number,
  maxWidth: number
): number {
  const rowH = 5;
  for (const [label, value] of rows) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(value, x + maxWidth, y, { align: 'right' });

    y += rowH;
  }
  return y;
}
