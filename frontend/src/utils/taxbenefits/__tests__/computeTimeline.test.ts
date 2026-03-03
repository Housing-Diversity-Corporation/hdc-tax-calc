import { computeTimeline, addMonths, monthsBetween } from '../computeTimeline';
import { getYear1ProrationFactor } from '../lihtcCreditCalculations';

// ── Utility Helpers ─────────────────────────────────────────────

/** Extract month (1-12) from a Date */
const month = (d: Date) => d.getMonth() + 1;
/** Extract full year from a Date */
const year = (d: Date) => d.getFullYear();
/** Extract day from a Date */
const day = (d: Date) => d.getDate();

// ── Date Utility Tests ──────────────────────────────────────────

describe('addMonths', () => {
  it('adds months correctly', () => {
    const d = new Date('2025-01-01T00:00:00');
    const result = addMonths(d, 6);
    expect(month(result)).toBe(7);
    expect(year(result)).toBe(2025);
  });

  it('wraps across year boundary', () => {
    const d = new Date('2025-07-01T00:00:00');
    const result = addMonths(d, 18);
    expect(month(result)).toBe(1);
    expect(year(result)).toBe(2027);
  });
});

describe('monthsBetween', () => {
  it('computes months between two dates', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2027-01-01T00:00:00');
    expect(monthsBetween(start, end)).toBe(24);
  });

  it('handles same month', () => {
    const d = new Date('2025-07-15T00:00:00');
    expect(monthsBetween(d, d)).toBe(0);
  });
});

// ── computeTimeline Validation Scenarios ────────────────────────

describe('computeTimeline', () => {

  // T-1: January PIS, Clean 10-Year Exit
  describe('T-1: January PIS, Clean 10-Year Exit', () => {
    const tl = computeTimeline('2025-07-01', 6, null, false, 0, false);

    it('PIS date is January 2026', () => {
      expect(month(tl.pisDate)).toBe(1);
      expect(year(tl.pisDate)).toBe(2026);
    });

    it('full proration for January PIS', () => {
      expect(tl.lihtcYear1Pct).toBe(1.0);
      expect(tl.hasCatchUp).toBe(false);
      expect(tl.lihtcCreditYears).toBe(10);
    });

    it('lastCreditYear = 2035', () => {
      expect(tl.lastCreditYear).toBe(2035);
    });

    it('optimalExitDate = Jan 1, 2036', () => {
      expect(year(tl.optimalExitDate)).toBe(2036);
      expect(month(tl.optimalExitDate)).toBe(1);
      expect(day(tl.optimalExitDate)).toBe(1);
    });

    it('bonusDepK1Date = April 15, 2027', () => {
      expect(year(tl.bonusDepK1Date)).toBe(2027);
      expect(month(tl.bonusDepK1Date)).toBe(4);
      expect(day(tl.bonusDepK1Date)).toBe(15);
    });

    it('totalHoldMonths = 126', () => {
      expect(tl.totalHoldMonths).toBe(126);
    });

    it('placedInServiceYear = 1 (floor(6/12) + 1)', () => {
      expect(tl.placedInServiceYear).toBe(1);
    });
  });

  // T-2: July PIS, 11-Year with Catch-Up
  describe('T-2: July PIS, 11-Year with Catch-Up', () => {
    const tl = computeTimeline('2025-01-01', 18, null, false, 0, false);

    it('PIS date is July 2026', () => {
      expect(month(tl.pisDate)).toBe(7);
      expect(year(tl.pisDate)).toBe(2026);
    });

    it('50% proration for July PIS', () => {
      expect(tl.lihtcYear1Pct).toBe(0.5);
      expect(tl.hasCatchUp).toBe(true);
      expect(tl.lihtcCreditYears).toBe(11);
    });

    it('lastCreditYear = 2036', () => {
      expect(tl.lastCreditYear).toBe(2036);
    });

    it('optimalExitDate = Jan 1, 2037', () => {
      expect(year(tl.optimalExitDate)).toBe(2037);
      expect(month(tl.optimalExitDate)).toBe(1);
    });

    it('totalHoldMonths = 144', () => {
      expect(tl.totalHoldMonths).toBe(144);
    });

    it('placedInServiceYear = 2 (floor(18/12) + 1)', () => {
      expect(tl.placedInServiceYear).toBe(2);
    });
  });

  // T-3: THE BUG CASE — 23-Month Construction
  describe('T-3: 23-Month Construction (the bug case)', () => {
    const tl = computeTimeline('2025-01-01', 23, null, false, 0, false);

    it('PIS date is December 2026', () => {
      expect(month(tl.pisDate)).toBe(12);
      expect(year(tl.pisDate)).toBe(2026);
    });

    it('~8.33% proration for December PIS', () => {
      expect(tl.lihtcYear1Pct).toBeCloseTo(1 / 12, 4);
      expect(tl.hasCatchUp).toBe(true);
      expect(tl.lihtcCreditYears).toBe(11);
    });

    it('lastCreditYear = 2036', () => {
      expect(tl.lastCreditYear).toBe(2036);
    });

    it('optimalExitDate = Jan 1, 2037', () => {
      expect(year(tl.optimalExitDate)).toBe(2037);
      expect(month(tl.optimalExitDate)).toBe(1);
    });

    it('totalHoldMonths = 144', () => {
      expect(tl.totalHoldMonths).toBe(144);
    });

    it('totalInvestmentYears = 12 (NOT 14 — old bug)', () => {
      expect(tl.totalInvestmentYears).toBe(12);
    });

    it('placedInServiceYear = 2 (Math.floor, NOT Math.ceil which gives 3)', () => {
      expect(tl.placedInServiceYear).toBe(2);
    });
  });

  // T-4: PIS Override
  describe('T-4: PIS Override', () => {
    const tl = computeTimeline('2025-07-01', 23, '2027-01-15', false, 0, false);

    it('uses override date, not auto-computed', () => {
      expect(month(tl.pisDate)).toBe(1);
      expect(day(tl.pisDate)).toBe(15);
      expect(year(tl.pisDate)).toBe(2027);
    });

    it('pisIsOverridden = true', () => {
      expect(tl.pisIsOverridden).toBe(true);
    });

    it('January PIS → full proration, no catch-up', () => {
      expect(tl.pisCalendarMonth).toBe(1);
      expect(tl.lihtcYear1Pct).toBe(1.0);
      expect(tl.hasCatchUp).toBe(false);
      expect(tl.lihtcCreditYears).toBe(10);
    });
  });

  // T-5: OZ Floor Binding
  describe('T-5: OZ Floor Binding', () => {
    const tl = computeTimeline('2025-07-01', 1, null, true, 0, false);

    it('PIS date is August 2025', () => {
      expect(month(tl.pisDate)).toBe(8);
      expect(year(tl.pisDate)).toBe(2025);
    });

    it('11-year credit period (August PIS)', () => {
      expect(tl.lihtcCreditYears).toBe(11);
    });

    it('optimalExitDate = Jan 1, 2036', () => {
      expect(year(tl.optimalExitDate)).toBe(2036);
      expect(month(tl.optimalExitDate)).toBe(1);
    });

    it('ozMinimumDate = July 2035', () => {
      expect(tl.ozMinimumDate).not.toBeNull();
      expect(month(tl.ozMinimumDate!)).toBe(7);
      expect(year(tl.ozMinimumDate!)).toBe(2035);
    });

    it('ozFloorBinding = false (LIHTC exit > OZ floor)', () => {
      expect(tl.ozFloorBinding).toBe(false);
    });
  });

  // T-6: Extended Hold
  describe('T-6: Extended Hold', () => {
    const tl = computeTimeline('2025-07-01', 23, null, true, 60, false);

    it('optimalExitDate = Jan 1, 2038', () => {
      expect(year(tl.optimalExitDate)).toBe(2038);
      expect(month(tl.optimalExitDate)).toBe(1);
    });

    it('actualExitDate = Jan 1, 2043 (60 months extension)', () => {
      expect(year(tl.actualExitDate)).toBe(2043);
      expect(month(tl.actualExitDate)).toBe(1);
    });

    it('isExtended = true', () => {
      expect(tl.isExtended).toBe(true);
    });

    it('totalHoldMonths = 210', () => {
      expect(tl.totalHoldMonths).toBe(210);
    });
  });

  // T-7: K-1 Realization Timing
  describe('T-7: K-1 Realization Timing', () => {
    it('January PIS: bonusDepK1Date = April 15, 2026, lag = 15 months', () => {
      const tl = computeTimeline('2025-01-15', 0, null, false, 0, false);
      expect(year(tl.bonusDepK1Date)).toBe(2026);
      expect(month(tl.bonusDepK1Date)).toBe(4);
      expect(day(tl.bonusDepK1Date)).toBe(15);
      expect(tl.bonusDepLagMonths).toBe(15);
    });

    it('December PIS: bonusDepK1Date = April 15, 2026, lag = 4 months', () => {
      const tl = computeTimeline('2025-01-01', 11, null, false, 0, false);
      expect(year(tl.bonusDepK1Date)).toBe(2026);
      expect(month(tl.bonusDepK1Date)).toBe(4);
      expect(day(tl.bonusDepK1Date)).toBe(15);
      expect(tl.bonusDepLagMonths).toBe(4);
    });
  });

  // T-8: §42(f)(1) Election — December PIS (Same Exit as T-3)
  describe('T-8: §42(f)(1) Election — December PIS', () => {
    const tl = computeTimeline('2025-01-01', 23, null, false, 0, true);

    it('PIS is December 2026', () => {
      expect(tl.pisCalendarMonth).toBe(12);
    });

    it('election applies → creditStartYear = 2027 (not 2026)', () => {
      expect(tl.electDeferCreditPeriod).toBe(true);
      expect(tl.creditStartYear).toBe(2027);
    });

    it('full proration (election), no catch-up', () => {
      expect(tl.lihtcYear1Pct).toBe(1.0);
      expect(tl.hasCatchUp).toBe(false);
      expect(tl.lihtcCreditYears).toBe(10);
    });

    it('lastCreditYear = 2036', () => {
      expect(tl.lastCreditYear).toBe(2036);
    });

    it('optimalExitDate = Jan 1, 2037 (SAME as T-3 without election)', () => {
      expect(year(tl.optimalExitDate)).toBe(2037);
      expect(month(tl.optimalExitDate)).toBe(1);
    });

    it('exit date identical to T-3', () => {
      const t3 = computeTimeline('2025-01-01', 23, null, false, 0, false);
      expect(tl.optimalExitDate.getTime()).toBe(t3.optimalExitDate.getTime());
    });
  });

  // T-9: §42(f)(1) Election — January PIS (Guard)
  describe('T-9: §42(f)(1) Election — January PIS Guard', () => {
    const tl = computeTimeline('2025-07-01', 6, null, false, 0, true);

    it('PIS is January', () => {
      expect(tl.pisCalendarMonth).toBe(1);
    });

    it('guard: election ignored for January PIS', () => {
      expect(tl.electDeferCreditPeriod).toBe(false);
    });

    it('creditStartYear = 2026 (NOT 2027)', () => {
      expect(tl.creditStartYear).toBe(2026);
    });

    it('full proration, 10-year period (same as T-1)', () => {
      expect(tl.lihtcYear1Pct).toBe(1.0);
      expect(tl.lihtcCreditYears).toBe(10);
      expect(tl.lastCreditYear).toBe(2035);
    });

    it('exit date identical to T-1', () => {
      const t1 = computeTimeline('2025-07-01', 6, null, false, 0, false);
      expect(tl.optimalExitDate.getTime()).toBe(t1.optimalExitDate.getTime());
    });
  });

  // T-10: §42(f)(1) Election — July PIS (Compare Both)
  describe('T-10: §42(f)(1) Election — July PIS Comparison', () => {
    const without = computeTimeline('2025-01-01', 18, null, false, 0, false);
    const withElection = computeTimeline('2025-01-01', 18, null, false, 0, true);

    it('WITHOUT: creditStartYear=2026, Year1Pct=0.5, catchUp, 11 years', () => {
      expect(without.creditStartYear).toBe(2026);
      expect(without.lihtcYear1Pct).toBe(0.5);
      expect(without.hasCatchUp).toBe(true);
      expect(without.lihtcCreditYears).toBe(11);
      expect(without.lastCreditYear).toBe(2036);
    });

    it('WITH: creditStartYear=2027, Year1Pct=1.0, no catchUp, 10 years', () => {
      expect(withElection.creditStartYear).toBe(2027);
      expect(withElection.lihtcYear1Pct).toBe(1.0);
      expect(withElection.hasCatchUp).toBe(false);
      expect(withElection.lihtcCreditYears).toBe(10);
      expect(withElection.lastCreditYear).toBe(2036);
    });

    it('SAME EXIT: both produce Jan 1, 2037', () => {
      expect(year(without.optimalExitDate)).toBe(2037);
      expect(year(withElection.optimalExitDate)).toBe(2037);
      expect(without.optimalExitDate.getTime()).toBe(withElection.optimalExitDate.getTime());
    });
  });

  // placedInServiceYear backward compat verification
  describe('placedInServiceYear matches computeHoldPeriod convention', () => {
    const cases: [number, number][] = [
      [0, 1], [1, 1], [6, 1], [12, 2], [18, 2], [23, 2], [24, 3], [36, 4],
    ];

    test.each(cases)(
      'constructionMonths=%i → placedInServiceYear=%i',
      (constructionMonths, expected) => {
        const tl = computeTimeline('2025-01-01', constructionMonths, null, false, 0, false);
        expect(tl.placedInServiceYear).toBe(expected);
      }
    );
  });
});

// ── getYear1ProrationFactor Election Tests ──────────────────────

describe('getYear1ProrationFactor with election', () => {
  it('July, no election → 0.5', () => {
    expect(getYear1ProrationFactor(7, false)).toBe(0.5);
  });

  it('July, with election → 1.0', () => {
    expect(getYear1ProrationFactor(7, true)).toBe(1.0);
  });

  it('January, no election → 1.0', () => {
    expect(getYear1ProrationFactor(1, false)).toBe(1.0);
  });

  it('January, with election → 1.0 (guard irrelevant)', () => {
    expect(getYear1ProrationFactor(1, true)).toBe(1.0);
  });

  it('December, no election → ~0.0833', () => {
    expect(getYear1ProrationFactor(12, false)).toBeCloseTo(1 / 12, 4);
  });

  it('December, with election → 1.0', () => {
    expect(getYear1ProrationFactor(12, true)).toBe(1.0);
  });

  it('backward compatible — no second arg defaults to false', () => {
    expect(getYear1ProrationFactor(7)).toBe(0.5);
    expect(getYear1ProrationFactor(1)).toBe(1.0);
  });
});
