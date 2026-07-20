/**
 * IMPL-202: Year-parameterized §461(l) Excess Business Loss threshold
 *
 * The §461(l) piece of Wave 1, shipped standalone ahead of the rest. Verifies:
 *  1. getSec461lLimit() resolves the correct published figures for 2025 and 2026,
 *     across all filing statuses (Rev. Proc. 2024-40 / Rev. Proc. 2025-32 §4.31).
 *  2. Years beyond the latest published year fall back to the indexed-forward stub.
 *  3. The SECTION_461L_LIMITS backward-compat alias derives from the table (2025).
 *  4. The engine (NOL-conversion path) resolves the threshold by the deal's
 *     investment year — a 2026 MFJ deal caps at $512K, not $626K.
 *  5. The audit-export site and the engine resolve the SAME value for a given
 *     year (guards against the duplicated hardcode drifting back apart).
 */

import {
  getSec461lLimit,
  SECTION_461L_LIMITS,
  DEFAULT_461L_TAX_YEAR,
  SECTION_461L_LATEST_PUBLISHED_YEAR,
  calculateTaxUtilization,
  BenefitStream,
  InvestorProfile,
} from '../investorTaxUtilization';
import { buildTaxUtilizationSheet } from '../auditExport/sheets/taxUtilizationSheet';

// -----------------------------------------------------------------------------
// 1. Canonical lookup — published years
// -----------------------------------------------------------------------------

describe('getSec461lLimit — published figures', () => {
  it('resolves 2025 (Rev. Proc. 2024-40): $313K single / $313K HoH / $626K MFJ', () => {
    expect(getSec461lLimit(2025, 'Single')).toBe(313_000);
    expect(getSec461lLimit(2025, 'HoH')).toBe(313_000);
    expect(getSec461lLimit(2025, 'MFJ')).toBe(626_000);
  });

  it('resolves 2026 (Rev. Proc. 2025-32 §4.31, OBBBA clawback): $256K single / $256K HoH / $512K MFJ', () => {
    expect(getSec461lLimit(2026, 'Single')).toBe(256_000);
    expect(getSec461lLimit(2026, 'HoH')).toBe(256_000);
    expect(getSec461lLimit(2026, 'MFJ')).toBe(512_000);
  });

  it('MFJ is exactly 200% of the single amount per §461(l)(3)(A)(ii)', () => {
    expect(getSec461lLimit(2025, 'MFJ')).toBe(getSec461lLimit(2025, 'Single') * 2);
    expect(getSec461lLimit(2026, 'MFJ')).toBe(getSec461lLimit(2026, 'Single') * 2);
  });
});

// -----------------------------------------------------------------------------
// 2. Indexed-forward stub (years beyond the latest published figure)
// -----------------------------------------------------------------------------

describe('getSec461lLimit — 2027+ indexed-forward stub', () => {
  it('indexes the 2026 base forward at ~2.6%, rounded to nearest $1,000', () => {
    // 256_000 * 1.026 = 262,656 → round to nearest $1,000 = 263,000; MFJ = 2× = 526,000
    expect(getSec461lLimit(2027, 'Single')).toBe(263_000);
    expect(getSec461lLimit(2027, 'HoH')).toBe(263_000);
    expect(getSec461lLimit(2027, 'MFJ')).toBe(526_000);
  });

  it('stub is strictly increasing and keeps MFJ = 2× single (TODO: replace with published figures)', () => {
    const s2027 = getSec461lLimit(2027, 'Single');
    const s2028 = getSec461lLimit(2028, 'Single');
    expect(s2027).toBeGreaterThan(getSec461lLimit(SECTION_461L_LATEST_PUBLISHED_YEAR, 'Single'));
    expect(s2028).toBeGreaterThan(s2027);
    expect(getSec461lLimit(2028, 'MFJ')).toBe(getSec461lLimit(2028, 'Single') * 2);
  });

  it('pre-table years fall back to the earliest published (2025) figure', () => {
    expect(getSec461lLimit(2024, 'MFJ')).toBe(626_000);
  });
});

// -----------------------------------------------------------------------------
// 3. Backward-compatible alias derives from the table
// -----------------------------------------------------------------------------

describe('SECTION_461L_LIMITS backward-compat alias', () => {
  it('equals the canonical table at the default tax year (2025)', () => {
    expect(DEFAULT_461L_TAX_YEAR).toBe(2025);
    expect(SECTION_461L_LIMITS.MFJ).toBe(getSec461lLimit(2025, 'MFJ'));
    expect(SECTION_461L_LIMITS.Single).toBe(getSec461lLimit(2025, 'Single'));
    expect(SECTION_461L_LIMITS.HoH).toBe(getSec461lLimit(2025, 'HoH'));
  });
});

// -----------------------------------------------------------------------------
// 4. Engine (NOL-conversion path) resolves by investment year
// -----------------------------------------------------------------------------

function nonpassiveProfile(overrides: Partial<InvestorProfile> = {}): InvestorProfile {
  return {
    annualPassiveIncome: 0,
    annualPassiveOrdinaryIncome: 0,
    annualPassiveLTCGIncome: 0,
    annualOrdinaryIncome: 3_000_000, // W-2 well above any cap
    annualPortfolioIncome: 0,
    filingStatus: 'MFJ',
    investorTrack: 'rep',
    groupingElection: true, // REP + grouped → nonpassive → §461(l) applies
    federalOrdinaryRate: 37,
    federalCapGainsRate: 0.238,
    investorState: 'NY',
    stateOrdinaryRate: 0.109,
    stateCapGainsRate: 0.109,
    investorEquity: 20_000_000,
    ...overrides,
  };
}

/** Single-year stream with a $1.5M Year-1 business loss (depreciation), in millions. */
function oneYearLossStream(lossInDollars: number): BenefitStream {
  return {
    annualDepreciation: [lossInDollars / 1_000_000],
    annualLIHTC: [0],
    annualStateLIHTC: [0],
    annualOperatingCF: [0],
    exitEvents: [
      {
        year: 1,
        exitProceeds: 0,
        cumulativeDepreciation: lossInDollars / 1_000_000,
        recaptureExposure: 0,
        appreciationGain: 0,
        ozEnabled: false,
      },
    ],
    grossEquity: 20,
    netEquity: 20,
    syndicationOffset: 0,
  };
}

describe('§461(l) engine resolution by investment year', () => {
  it('2026 MFJ, $1.5M excess business loss → $512,000 allowed, $988,000 converted to NOL', () => {
    const result = calculateTaxUtilization(
      oneYearLossStream(1_500_000),
      nonpassiveProfile({ filingStatus: 'MFJ', firstTaxYear: 2026 })
    );
    const yr1 = result.annualUtilization[0];
    expect(Math.round(yr1.depreciationAllowed * 1_000_000)).toBe(512_000);
    expect(Math.round(yr1.nolGenerated * 1_000_000)).toBe(988_000);
  });

  it('2025 MFJ (backward-compat, unchanged): $626,000 allowed, $874,000 NOL', () => {
    const result = calculateTaxUtilization(
      oneYearLossStream(1_500_000),
      nonpassiveProfile({ filingStatus: 'MFJ', firstTaxYear: 2025 })
    );
    const yr1 = result.annualUtilization[0];
    expect(Math.round(yr1.depreciationAllowed * 1_000_000)).toBe(626_000);
    expect(Math.round(yr1.nolGenerated * 1_000_000)).toBe(874_000);
  });

  it('no firstTaxYear → defaults to 2025 figures (backward compatibility)', () => {
    const result = calculateTaxUtilization(
      oneYearLossStream(1_500_000),
      nonpassiveProfile({ filingStatus: 'MFJ' }) // firstTaxYear omitted
    );
    expect(Math.round(result.annualUtilization[0].depreciationAllowed * 1_000_000)).toBe(626_000);
  });

  it('2026 single resolves the $256,000 cap', () => {
    const result = calculateTaxUtilization(
      oneYearLossStream(1_500_000),
      nonpassiveProfile({ filingStatus: 'Single', firstTaxYear: 2026 })
    );
    expect(Math.round(result.annualUtilization[0].depreciationAllowed * 1_000_000)).toBe(256_000);
  });
});

// -----------------------------------------------------------------------------
// 5. Audit-export ↔ engine single-source parity
// -----------------------------------------------------------------------------

/** Extract the §461(l) cap formula string from the built Tax_Utilization sheet. */
function capFormula(taxYear: number): string {
  const investorResults: any = { taxUtilization: { treatment: 'nonpassive', annualUtilization: [] } };
  const params: any = { holdPeriod: 1, filingStatus: 'married', investorTrack: 'rep', groupingElection: true };
  const { sheet } = buildTaxUtilizationSheet(investorResults, 20_000_000, params, taxYear);
  const capCell = Object.values(sheet).find(
    (cell: any) => cell && typeof cell === 'object' && typeof cell.f === 'string'
      && cell.f.includes('TU_IsREP=1,TU_GroupingElection=0')
  ) as { f: string } | undefined;
  if (!capCell) throw new Error('§461(l) cap cell not found in audit-export sheet');
  return capCell.f;
}

describe('audit-export ↔ engine single-source parity (anti-drift guard)', () => {
  it('audit-export embeds the SAME 2026 caps the engine resolves ($512K / $256K)', () => {
    const f = capFormula(2026);
    expect(f).toContain(String(getSec461lLimit(2026, 'MFJ'))); // 512000
    expect(f).toContain(String(getSec461lLimit(2026, 'Single'))); // 256000
    expect(f).toContain('512000');
    expect(f).toContain('256000');
  });

  it('audit-export embeds the SAME 2025 caps the engine resolves ($626K / $313K)', () => {
    const f = capFormula(2025);
    expect(f).toContain(String(getSec461lLimit(2025, 'MFJ'))); // 626000
    expect(f).toContain(String(getSec461lLimit(2025, 'Single'))); // 313000
  });
});
