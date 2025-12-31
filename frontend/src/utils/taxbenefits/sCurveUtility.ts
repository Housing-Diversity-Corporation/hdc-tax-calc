/**
 * S-Curve Utility Functions
 *
 * S-curve (sigmoid function) is used to model gradual transitions and lease-up periods.
 * This is the SINGLE SOURCE OF TRUTH for all S-curve calculations.
 *
 * Used for:
 * - Interest reserve calculations (lease-up occupancy)
 * - Revenue ramp-up modeling
 * - Any gradual transition from 0% to 100%
 *
 * The S-curve formula: 1 / (1 + e^(-k*(x-0.5)))
 * - Starts near 0 at x=0
 * - Inflection point at x=0.5 (50% through)
 * - Approaches 1 at x=1
 * - k controls steepness (higher k = steeper curve)
 */

/**
 * Calculate S-curve value (sigmoid function)
 *
 * @param progress - Progress through the period (0 to 1)
 * @param steepness - Controls curve steepness (default: 10)
 *                    - Higher values = steeper curve (faster ramp-up)
 *                    - Lower values = gentler curve (gradual ramp-up)
 * @returns Value from 0 to 1 representing position on S-curve
 *
 * @example
 * // Calculate occupancy at month 9 of 18-month lease-up
 * const progress = 9 / 18; // 0.5
 * const occupancy = calculateSCurve(progress); // ~0.5 (50% at midpoint)
 *
 * @example
 * // Calculate occupancy at month 18 of 18-month lease-up
 * const progress = 18 / 18; // 1.0
 * const occupancy = calculateSCurve(progress); // ~0.9999 (nearly 100%)
 */
export function calculateSCurve(progress: number, steepness: number = 10): number {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.min(1, Math.max(0, progress));

  // S-curve formula: 1 / (1 + e^(-k*(x-0.5)))
  // This creates a smooth curve from ~0 to ~1
  const value = 1 / (1 + Math.exp(-steepness * (clampedProgress - 0.5)));

  return value;
}

/**
 * Calculate average S-curve value over a period
 *
 * This is useful for calculating average occupancy during a lease-up period.
 *
 * @param months - Total number of months in the period
 * @param steepness - Controls curve steepness (default: 10)
 * @returns Average value from 0 to 1
 *
 * @example
 * // Calculate average occupancy during 18-month lease-up
 * const avgOccupancy = calculateAverageSCurve(18); // ~0.31 (31% average)
 */
export function calculateAverageSCurve(months: number, steepness: number = 10): number {
  if (months <= 0) return 0;

  let total = 0;
  for (let month = 1; month <= months; month++) {
    const progress = month / months;
    total += calculateSCurve(progress, steepness);
  }

  return total / months;
}

/**
 * Calculate S-curve occupancy for each month in a period
 *
 * @param months - Total number of months in the period
 * @param steepness - Controls curve steepness (default: 10)
 * @returns Array of occupancy values (0 to 1) for each month
 *
 * @example
 * // Get monthly occupancy for 18-month lease-up
 * const occupancies = calculateMonthlyOccupancy(18);
 * // Returns: [0.01, 0.02, 0.04, ..., 0.96, 0.98, 0.99]
 */
export function calculateMonthlyOccupancy(months: number, steepness: number = 10): number[] {
  const occupancies: number[] = [];

  for (let month = 1; month <= months; month++) {
    const progress = month / months;
    occupancies.push(calculateSCurve(progress, steepness));
  }

  return occupancies;
}

/**
 * Standard steepness constant used throughout the application
 * k=10 provides a good balance between gradual and rapid transitions
 */
export const STANDARD_STEEPNESS = 10;

/**
 * Calculate S-curve progress at a specific percentage
 *
 * @param targetPercent - Target percentage (0-100)
 * @param steepness - Controls curve steepness (default: 10)
 * @returns Progress value (0-1) at which S-curve reaches the target
 *
 * @example
 * // At what point does occupancy reach 90%?
 * const progress = getProgressAtPercent(90); // ~0.72 (72% through period)
 */
export function getProgressAtPercent(targetPercent: number, steepness: number = 10): number {
  const target = targetPercent / 100;

  // Solve for x in: target = 1 / (1 + e^(-k*(x-0.5)))
  // Rearrange: x = 0.5 - (1/k) * ln((1/target) - 1)
  const x = 0.5 - (1 / steepness) * Math.log((1 / target) - 1);

  return Math.min(1, Math.max(0, x));
}
