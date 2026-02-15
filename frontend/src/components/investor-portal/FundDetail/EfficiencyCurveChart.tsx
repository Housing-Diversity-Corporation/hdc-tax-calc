import React from 'react';
import type { SizingDataPoint } from '../../../types/fundSizing';

interface EfficiencyCurveChartProps {
  curve: SizingDataPoint[];
  optimalCommitment: number;
  capacityExhaustedAt: number | null;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

const EfficiencyCurveChart: React.FC<EfficiencyCurveChartProps> = ({
  curve,
  optimalCommitment,
  capacityExhaustedAt,
}) => {
  if (curve.length < 2) return null;

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const commitments = curve.map(p => p.commitment);
  const spds = curve.map(p => p.savingsPerDollar);
  const minX = Math.min(...commitments);
  const maxX = Math.max(...commitments);
  const maxY = Math.max(...spds) * 1.1; // 10% headroom

  const xScale = (val: number) => PADDING.left + ((val - minX) / (maxX - minX)) * plotWidth;
  const yScale = (val: number) => PADDING.top + plotHeight - (val / maxY) * plotHeight;

  // Build SVG path for the efficiency curve
  const pathPoints = curve.map(p => `${xScale(p.commitment)},${yScale(p.savingsPerDollar)}`);
  const pathD = `M ${pathPoints.join(' L ')}`;

  // Optimal point
  const optimalPoint = curve.reduce((best, p) =>
    Math.abs(p.commitment - optimalCommitment) < Math.abs(best.commitment - optimalCommitment) ? p : best
  );
  const optX = xScale(optimalPoint.commitment);
  const optY = yScale(optimalPoint.savingsPerDollar);

  // Format commitment for axis labels
  const formatAxis = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  // X-axis ticks (5 ticks)
  const xTicks = Array.from({ length: 5 }, (_, i) => minX + (i / 4) * (maxX - minX));

  // Y-axis ticks (4 ticks)
  const yTicks = Array.from({ length: 4 }, (_, i) => (i / 3) * maxY);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[#474a44] mb-2">Utilization Efficiency Curve</h3>
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <svg width={CHART_WIDTH} height={CHART_HEIGHT} className="w-full" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={PADDING.left}
              y1={yScale(tick)}
              x2={CHART_WIDTH - PADDING.right}
              y2={yScale(tick)}
              stroke="#e5e7eb"
              strokeDasharray="3,3"
            />
          ))}

          {/* Capacity exhaustion line */}
          {capacityExhaustedAt !== null && (
            <line
              x1={xScale(capacityExhaustedAt)}
              y1={PADDING.top}
              x2={xScale(capacityExhaustedAt)}
              y2={PADDING.top + plotHeight}
              stroke="#ef4444"
              strokeDasharray="4,4"
              strokeWidth={1}
            />
          )}

          {/* Efficiency curve */}
          <path d={pathD} fill="none" stroke="#407f7f" strokeWidth={2} />

          {/* Optimal point marker */}
          <circle cx={optX} cy={optY} r={5} fill="#407f7f" stroke="white" strokeWidth={2} />

          {/* Optimal point label */}
          <text x={optX} y={optY - 10} textAnchor="middle" className="text-[10px] fill-[#407f7f] font-medium">
            {formatAxis(optimalPoint.commitment)}
          </text>

          {/* X-axis */}
          <line
            x1={PADDING.left}
            y1={PADDING.top + plotHeight}
            x2={CHART_WIDTH - PADDING.right}
            y2={PADDING.top + plotHeight}
            stroke="#9ca3af"
          />
          {xTicks.map((tick, i) => (
            <text
              key={`x-${i}`}
              x={xScale(tick)}
              y={PADDING.top + plotHeight + 15}
              textAnchor="middle"
              className="text-[9px] fill-[#474a44]/60"
            >
              {formatAxis(tick)}
            </text>
          ))}
          <text
            x={PADDING.left + plotWidth / 2}
            y={CHART_HEIGHT - 2}
            textAnchor="middle"
            className="text-[10px] fill-[#474a44]/70 font-medium"
          >
            Commitment Amount
          </text>

          {/* Y-axis */}
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + plotHeight}
            stroke="#9ca3af"
          />
          {yTicks.map((tick, i) => (
            <text
              key={`y-${i}`}
              x={PADDING.left - 5}
              y={yScale(tick) + 3}
              textAnchor="end"
              className="text-[9px] fill-[#474a44]/60"
            >
              ${tick.toFixed(2)}
            </text>
          ))}
          <text
            x={12}
            y={PADDING.top + plotHeight / 2}
            textAnchor="middle"
            className="text-[10px] fill-[#474a44]/70 font-medium"
            transform={`rotate(-90, 12, ${PADDING.top + plotHeight / 2})`}
          >
            Savings / Dollar
          </text>
        </svg>
      </div>
    </div>
  );
};

export default EfficiencyCurveChart;
