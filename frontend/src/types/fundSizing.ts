/**
 * Fund Sizing & Pool Aggregation Types (IMPL-085)
 *
 * Re-exports from engine modules for clean imports in UI components.
 */

export type {
  PoolAggregationConfig,
  PoolAggregationMeta,
  PoolAggregationResult,
} from '../utils/taxbenefits/poolAggregation';

export type {
  PeakType,
  SizingDataPoint,
  FundSizingResult,
  FundSizingConfig,
} from '../utils/taxbenefits/fundSizingOptimizer';
