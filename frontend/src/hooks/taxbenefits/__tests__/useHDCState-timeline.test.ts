import { renderHook, act, waitFor } from '@testing-library/react';
import { useHDCState } from '../useHDCState';

/**
 * IMPL-112: useHDCState Timeline Integration Tests
 *
 * Validates:
 *   HS-1: computedTimeline is null when investmentDate is empty
 *   HS-2: computedTimeline populates when investmentDate is set
 *   HS-3: Election auto-resets for January PIS
 *   HS-4: New params flow through (documented; end-to-end covered by CT-1 in IMPL-111)
 *   HS-5: Old state still functional
 */
describe('useHDCState — Timeline Architecture (IMPL-112)', () => {

  // HS-1: computedTimeline is null when investmentDate is empty
  it('HS-1: computedTimeline is null when investmentDate is empty', () => {
    const { result } = renderHook(() => useHDCState());

    // Default investmentDate is '' (empty string)
    expect(result.current.investmentDate).toBe('');
    expect(result.current.computedTimeline).toBeNull();
  });

  // HS-2: computedTimeline populates when investmentDate is set
  it('HS-2: computedTimeline populates when investmentDate is set', () => {
    const { result } = renderHook(() => useHDCState());

    act(() => {
      result.current.setInvestmentDate('2025-07-01');
    });

    expect(result.current.computedTimeline).not.toBeNull();
    expect(result.current.computedTimeline!.investmentDate).toBeInstanceOf(Date);
    expect(result.current.computedTimeline!.investmentDate.getFullYear()).toBe(2025);
    expect(result.current.computedTimeline!.investmentDate.getMonth()).toBe(6); // July = 6 (0-indexed)
  });

  // HS-3: Election auto-resets for January PIS
  it('HS-3: election auto-resets when PIS lands on January', async () => {
    const { result } = renderHook(() => useHDCState());

    // Set investmentDate and constructionDelayMonths so PIS = January
    // Investment July 2025 + 6 months construction → PIS = January 2026
    act(() => {
      result.current.setInvestmentDate('2025-07-01');
      result.current.setConstructionDelayMonths(6);
      result.current.setElectDeferCreditPeriod(true);
    });

    // Guard useEffect should fire and reset electDeferCreditPeriod
    await waitFor(() => {
      expect(result.current.computedTimeline).not.toBeNull();
      expect(result.current.computedTimeline!.pisCalendarMonth).toBe(1); // January
      expect(result.current.electDeferCreditPeriod).toBe(false);
    });
  });

  // HS-3b: Election stays true when PIS is NOT January
  it('HS-3b: election stays true when PIS is not January', () => {
    const { result } = renderHook(() => useHDCState());

    // Investment July 2025 + 0 months construction → PIS = July 2025
    act(() => {
      result.current.setInvestmentDate('2025-07-01');
      result.current.setConstructionDelayMonths(0);
      result.current.setElectDeferCreditPeriod(true);
    });

    expect(result.current.computedTimeline).not.toBeNull();
    expect(result.current.computedTimeline!.pisCalendarMonth).toBe(7); // July
    expect(result.current.electDeferCreditPeriod).toBe(true);
  });

  // HS-4: New params flow through to calculations
  // The end-to-end flow (investmentDate → computeTimeline → calculations.ts two-path)
  // is already covered by CT-1 in IMPL-111's test suite. A hooks-level mock of
  // calculateFullInvestorAnalysis would be brittle and duplicate that coverage.
  // Instead, we verify the hook exposes all new params that useHDCCalculations needs.
  it('HS-4: new timing params are exposed by the hook for calculations passthrough', () => {
    const { result } = renderHook(() => useHDCState());

    act(() => {
      result.current.setInvestmentDate('2025-07-01');
      result.current.setPisDateOverride('2026-03-15'); // March (not January, avoids guard reset)
      result.current.setExitExtensionMonths(6);
      result.current.setElectDeferCreditPeriod(true);
    });

    expect(result.current.investmentDate).toBe('2025-07-01');
    expect(result.current.pisDateOverride).toBe('2026-03-15');
    expect(result.current.exitExtensionMonths).toBe(6);
    expect(result.current.electDeferCreditPeriod).toBe(true);
  });

  // HS-5: Old state still functional
  it('HS-5: deprecated state variables still present and functional', () => {
    const { result } = renderHook(() => useHDCState());

    // Verify old state is in return object
    expect(result.current.taxBenefitDelayMonths).toBeDefined();
    expect(result.current.placedInServiceMonth).toBeDefined();
    expect(result.current.exitMonth).toBeDefined();

    // Verify setters work
    act(() => {
      result.current.setTaxBenefitDelayMonths(12);
      result.current.setPlacedInServiceMonth(3);
      result.current.setExitMonth(9);
    });

    expect(result.current.taxBenefitDelayMonths).toBe(12);
    expect(result.current.placedInServiceMonth).toBe(3);
    expect(result.current.exitMonth).toBe(9);
  });

  // HS-5b: Old computeHoldPeriod still works
  it('HS-5b: old holdFromPIS / totalInvestmentYears still computed', () => {
    const { result } = renderHook(() => useHDCState());

    expect(result.current.holdFromPIS).toBeDefined();
    expect(result.current.totalInvestmentYears).toBeDefined();
    expect(result.current.exitYear).toBeDefined();
    expect(typeof result.current.holdFromPIS).toBe('number');
    expect(typeof result.current.totalInvestmentYears).toBe('number');
  });
});
