import { computeHoldPeriod } from '../computeHoldPeriod';

describe('computeHoldPeriod', () => {
  const scenarios = [
    // [constructionDevMonths, pisMonth, delayMonths, expectedHoldFromPIS, expectedTotalYears]
    // IMPL-087: totalYears = prePIS + holdFromPIS + 1 (disposition year)
    [0, 1, 0, 10, 11],
    [0, 7, 0, 11, 12],
    [0, 7, 6, 12, 13],
    [0, 12, 0, 11, 12],
    [24, 7, 0, 11, 14],
    [24, 7, 6, 12, 15],
    [48, 7, 6, 12, 17],
    [0, 1, 12, 11, 12],
    [0, 1, 13, 12, 13],
  ] as const;

  it.each(scenarios)(
    'constructionDevMonths=%i, pisMonth=%i, delayMonths=%i → holdFromPIS=%i, totalYears=%i',
    (constructionDevMonths, pisMonth, delayMonths, expectedHoldFromPIS, expectedTotalYears) => {
      const result = computeHoldPeriod(pisMonth, constructionDevMonths, delayMonths);
      expect(result.holdFromPIS).toBe(expectedHoldFromPIS);
      expect(result.totalInvestmentYears).toBe(expectedTotalYears);
    }
  );

  describe('creditPeriodFromPIS logic', () => {
    it('pisMonth=1 → 10-year credit period (no Year 11 catch-up)', () => {
      const { holdFromPIS } = computeHoldPeriod(1, 0, 0);
      expect(holdFromPIS).toBe(10);
    });

    it('pisMonth>1 → 11-year credit period (Year 11 catch-up per §42(f)(3))', () => {
      const { holdFromPIS } = computeHoldPeriod(2, 0, 0);
      expect(holdFromPIS).toBe(11);
    });
  });

  describe('delay spillover logic', () => {
    it('delayMonths=0 → no spillover', () => {
      const { holdFromPIS } = computeHoldPeriod(1, 0, 0);
      expect(holdFromPIS).toBe(10); // 10 + 0 + 0
    });

    it('delayMonths=12 → 1 full year, no spillover', () => {
      const { holdFromPIS } = computeHoldPeriod(1, 0, 12);
      expect(holdFromPIS).toBe(11); // 10 + 1 + 0
    });

    it('delayMonths=13 → 1 full year + 1 spillover', () => {
      const { holdFromPIS } = computeHoldPeriod(1, 0, 13);
      expect(holdFromPIS).toBe(12); // 10 + 1 + 1
    });

    it('delayMonths=6 → 0 full years + 1 spillover', () => {
      const { holdFromPIS } = computeHoldPeriod(1, 0, 6);
      expect(holdFromPIS).toBe(11); // 10 + 0 + 1
    });
  });

  describe('construction period adds to total but not holdFromPIS', () => {
    it('24 months construction → +2 years total, holdFromPIS unchanged', () => {
      const noConstruction = computeHoldPeriod(7, 0, 0);
      const withConstruction = computeHoldPeriod(7, 24, 0);
      expect(withConstruction.holdFromPIS).toBe(noConstruction.holdFromPIS);
      expect(withConstruction.totalInvestmentYears).toBe(noConstruction.totalInvestmentYears + 2);
    });
  });
});
