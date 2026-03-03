import { calculateXIRR, daysBetween } from '../xirrCalculation';
import { XirrCashFlow } from '../../../types/taxbenefits';

// ── X-9: daysBetween Utility Tests ─────────────────────────────

describe('daysBetween', () => {
  const d = (s: string) => new Date(s + 'T00:00:00');

  it('same date = 0', () => {
    expect(daysBetween(d('2025-01-01'), d('2025-01-01'))).toBe(0);
  });

  it('one day apart = 1', () => {
    expect(daysBetween(d('2025-01-01'), d('2025-01-02'))).toBe(1);
  });

  it('Jan 1 to Dec 31 = 364', () => {
    expect(daysBetween(d('2025-01-01'), d('2025-12-31'))).toBe(364);
  });

  it('full non-leap year = 365', () => {
    expect(daysBetween(d('2025-01-01'), d('2026-01-01'))).toBe(365);
  });

  it('full leap year = 366 (2024 is leap)', () => {
    expect(daysBetween(d('2024-01-01'), d('2025-01-01'))).toBe(366);
  });

  it('two non-leap years = 730', () => {
    expect(daysBetween(d('2025-01-01'), d('2027-01-01'))).toBe(730);
  });

  it('DST spring forward — must be 1, not 0', () => {
    expect(daysBetween(d('2025-03-09'), d('2025-03-10'))).toBe(1);
  });

  it('DST fall back — must be 1, not 2', () => {
    expect(daysBetween(d('2025-11-02'), d('2025-11-03'))).toBe(1);
  });
});

// ── calculateXIRR Tests ────────────────────────────────────────

describe('calculateXIRR', () => {

  // X-1: Simple 1-Year Return (Analytically Solvable)
  describe('X-1: Simple 1-Year Return', () => {
    const cashFlows: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -1000, category: 'investment' },
      { date: '2026-01-01', amount: 1100, category: 'exit' },
    ];

    it('≈ 10.0% (analytical: 1.1^(1/0.999315) - 1)', () => {
      const result = calculateXIRR(cashFlows);
      expect(result).toBeCloseTo(10.0, 0);
      expect(Math.abs(result - 10.0)).toBeLessThan(0.1);
    });
  });

  // X-2: Simple 2-Year Doubling
  describe('X-2: Simple 2-Year Doubling', () => {
    const cashFlows: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -1000, category: 'investment' },
      { date: '2027-01-01', amount: 2000, category: 'exit' },
    ];

    it('≈ 41.4% (analytical: 2^(1/1.99863) - 1)', () => {
      const result = calculateXIRR(cashFlows);
      expect(result).toBeCloseTo(41.4, 0);
      expect(Math.abs(result - 41.4)).toBeLessThan(0.2);
    });
  });

  // X-3: Uniform Annual Cash Flows (IRR Cross-Check)
  describe('X-3: Uniform Annual (IRR cross-check)', () => {
    const cashFlows: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -10000, category: 'investment' },
      { date: '2026-01-01', amount: 3000, category: 'return' },
      { date: '2027-01-01', amount: 3000, category: 'return' },
      { date: '2028-01-01', amount: 3000, category: 'return' },
      { date: '2029-01-01', amount: 3000, category: 'return' },
    ];

    it('≈ 7.7% (traditional IRR ≈ 7.71%)', () => {
      const result = calculateXIRR(cashFlows);
      expect(result).toBeCloseTo(7.7, 0);
      expect(Math.abs(result - 7.7)).toBeLessThan(0.2);
    });
  });

  // X-4: Day-Precision Sensitivity (Earlier = Higher XIRR)
  describe('X-4: Day-Precision Sensitivity', () => {
    const earlyFlows: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -10000, category: 'investment' },
      { date: '2025-04-15', amount: 5000, category: 'k1-early' },
      { date: '2026-04-15', amount: 5000, category: 'k1-late' },
      { date: '2027-01-01', amount: 3000, category: 'exit' },
    ];

    const lateFlows: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -10000, category: 'investment' },
      { date: '2025-10-15', amount: 5000, category: 'k1-early' },
      { date: '2026-10-15', amount: 5000, category: 'k1-late' },
      { date: '2027-07-01', amount: 3000, category: 'exit' },
    ];

    it('earlier cash flows produce materially higher XIRR', () => {
      const earlyXirr = calculateXIRR(earlyFlows);
      const lateXirr = calculateXIRR(lateFlows);
      expect(earlyXirr).toBeGreaterThan(lateXirr);
      expect(earlyXirr - lateXirr).toBeGreaterThan(1); // materially different
    });
  });

  // X-5: HDC-Realistic K-1 Timing
  describe('X-5: HDC-Realistic K-1 Timing', () => {
    const cashFlows: XirrCashFlow[] = [
      { date: '2025-07-01', amount: -500000, category: 'investment' },
      { date: '2028-04-15', amount: 180000, category: 'k1-dep-bonus' },
      { date: '2028-04-15', amount: 28000, category: 'k1-lihtc-yr1' },
      { date: '2028-12-31', amount: 45000, category: 'cashflow-yr1' },
      { date: '2029-04-15', amount: 12000, category: 'k1-dep-yr2' },
      { date: '2029-04-15', amount: 48000, category: 'k1-lihtc-yr2' },
      { date: '2029-12-31', amount: 45000, category: 'cashflow-yr2' },
      { date: '2030-04-15', amount: 12000, category: 'k1-dep-yr3' },
      { date: '2030-04-15', amount: 48000, category: 'k1-lihtc-yr3' },
      { date: '2030-12-31', amount: 45000, category: 'cashflow-yr3' },
      { date: '2038-01-01', amount: 620000, category: 'exit-proceeds' },
    ];

    it('converges to positive rate in 5-15% range', () => {
      const result = calculateXIRR(cashFlows);
      expect(result).not.toBeNaN();
      expect(result).toBeGreaterThan(5);
      expect(result).toBeLessThan(15);
    });
  });

  // X-6: Same-Date Cash Flows Combine Correctly
  describe('X-6: Same-Date Cash Flows', () => {
    const separate: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -1000, category: 'investment' },
      { date: '2026-04-15', amount: 200, category: 'k1-dep' },
      { date: '2026-04-15', amount: 300, category: 'k1-lihtc' },
      { date: '2026-04-15', amount: 100, category: 'k1-state' },
      { date: '2027-01-01', amount: 500, category: 'exit' },
    ];

    const combined: XirrCashFlow[] = [
      { date: '2025-01-01', amount: -1000, category: 'investment' },
      { date: '2026-04-15', amount: 600, category: 'k1-combined' },
      { date: '2027-01-01', amount: 500, category: 'exit' },
    ];

    it('separate entries converge', () => {
      const result = calculateXIRR(separate);
      expect(result).not.toBeNaN();
    });

    it('separate ≈ combined (within ±0.01)', () => {
      const separateXirr = calculateXIRR(separate);
      const combinedXirr = calculateXIRR(combined);
      expect(Math.abs(separateXirr - combinedXirr)).toBeLessThan(0.01);
    });
  });

  // X-7: Edge Cases — NaN Conditions
  describe('X-7: NaN Guard Conditions', () => {
    it('all positive → NaN', () => {
      const cfs: XirrCashFlow[] = [
        { date: '2025-01-01', amount: 1000, category: 'a' },
        { date: '2026-01-01', amount: 500, category: 'b' },
      ];
      expect(calculateXIRR(cfs)).toBeNaN();
    });

    it('all negative → NaN', () => {
      const cfs: XirrCashFlow[] = [
        { date: '2025-01-01', amount: -1000, category: 'a' },
        { date: '2026-01-01', amount: -500, category: 'b' },
      ];
      expect(calculateXIRR(cfs)).toBeNaN();
    });

    it('single cash flow → NaN', () => {
      const cfs: XirrCashFlow[] = [
        { date: '2025-01-01', amount: -1000, category: 'a' },
      ];
      expect(calculateXIRR(cfs)).toBeNaN();
    });

    it('empty array → NaN', () => {
      expect(calculateXIRR([])).toBeNaN();
    });
  });

  // X-8: Convergence Under Stress
  describe('X-8: Convergence Under Stress', () => {
    it('high return converges (does not throw or infinite loop)', () => {
      const cfs: XirrCashFlow[] = [
        { date: '2025-01-01', amount: -100, category: 'inv' },
        { date: '2025-07-01', amount: 500, category: 'exit' },
      ];
      const result = calculateXIRR(cfs);
      // May be very high or NaN if clamped — either is acceptable
      expect(typeof result).toBe('number');
      if (!isNaN(result)) {
        expect(result).toBeGreaterThan(100);
      }
    });

    it('negative return converges', () => {
      const cfs: XirrCashFlow[] = [
        { date: '2025-01-01', amount: -1000, category: 'inv' },
        { date: '2030-01-01', amount: 200, category: 'exit' },
      ];
      const result = calculateXIRR(cfs);
      expect(result).not.toBeNaN();
      expect(result).toBeLessThan(0);
    });

    it('break-even ≈ 0%', () => {
      const cfs: XirrCashFlow[] = [
        { date: '2025-01-01', amount: -1000, category: 'inv' },
        { date: '2030-01-01', amount: 1000, category: 'exit' },
      ];
      const result = calculateXIRR(cfs);
      expect(result).not.toBeNaN();
      expect(Math.abs(result)).toBeLessThan(0.1);
    });
  });

  // X-10: January vs December PIS — IRR Impact
  describe('X-10: Jan vs Dec PIS — K-1 timing impact', () => {
    const janPIS: XirrCashFlow[] = [
      { date: '2025-07-01', amount: -500000, category: 'investment' },
      // PIS Jan 2026 → K-1 April 2027 (21 month wait)
      { date: '2027-04-15', amount: 180000, category: 'k1-dep-bonus' },
      { date: '2028-04-15', amount: 48000, category: 'k1-lihtc' },
      { date: '2030-01-01', amount: 400000, category: 'exit' },
    ];

    const decPIS: XirrCashFlow[] = [
      { date: '2025-07-01', amount: -500000, category: 'investment' },
      // PIS Dec 2025 → K-1 April 2026 (9 month wait)
      { date: '2026-04-15', amount: 180000, category: 'k1-dep-bonus' },
      { date: '2027-04-15', amount: 48000, category: 'k1-lihtc' },
      { date: '2029-01-01', amount: 400000, category: 'exit' },
    ];

    it('Dec PIS XIRR > Jan PIS XIRR (materially, >1% diff)', () => {
      const janXirr = calculateXIRR(janPIS);
      const decXirr = calculateXIRR(decPIS);
      expect(janXirr).not.toBeNaN();
      expect(decXirr).not.toBeNaN();
      expect(decXirr).toBeGreaterThan(janXirr);
      expect(decXirr - janXirr).toBeGreaterThan(1);
    });

    it('traditional IRR would miss this — same amounts, different timing', () => {
      // Both have identical total amounts: -500k, +180k, +48k, +400k
      const janTotal = -500000 + 180000 + 48000 + 400000;
      const decTotal = -500000 + 180000 + 48000 + 400000;
      expect(janTotal).toBe(decTotal); // Same total dollars
      // But XIRR differs because timing differs
      const janXirr = calculateXIRR(janPIS);
      const decXirr = calculateXIRR(decPIS);
      expect(decXirr).not.toBe(janXirr);
    });
  });
});
