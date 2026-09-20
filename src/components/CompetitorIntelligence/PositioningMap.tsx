import React, { useState, useMemo } from 'react';
import { PositioningAxisKey, PositioningCoordinate } from '../../types/competitorIntelligence';
import { Layers, Crosshair, Info, Sparkles, HelpCircle } from 'lucide-react';

interface PositioningMapProps {
  positioningMaps: Partial<Record<PositioningAxisKey, PositioningCoordinate[]>>;
  startupName: string;
}

const AXIS_CONFIG: Record<
  PositioningAxisKey,
  {
    name: string;
    description: string;
    xLabelLeft: string;
    xLabelRight: string;
    yLabelBottom: string;
    yLabelTop: string;
    quadrants: {
      topRight: string;
      topLeft: string;
      bottomLeft: string;
      bottomRight: string;
    };
  }
> = {
  price_vs_features: {
    name: 'Price vs. Feature Depth',
    description: 'Compares market pricing accessibility against breadth and depth of capabilities.',
    xLabelLeft: 'Low Cost / Free / Budget',
    xLabelRight: 'High Price / Enterprise',
    yLabelBottom: 'Lightweight / Single-Feature',
    yLabelTop: 'Comprehensive Suite / Deep AI',
    quadrants: {
      topRight: 'Enterprise Heavyweight',
      topLeft: 'High-Value Disruptor',
      bottomLeft: 'Point Solution / Budget',
      bottomRight: 'Overpriced Niche',
    },
  },
  innovation_vs_maturity: {
    name: 'Innovation vs. Market Maturity',
    description: 'Compares modern technological innovation against incumbent brand maturity.',
    xLabelLeft: 'Traditional / Rule-Based',
    xLabelRight: 'AI-Native / Cutting-Edge',
    yLabelBottom: 'Early-Stage / Emerging',
    yLabelTop: 'Established Incumbent / Scale',
    quadrants: {
      topRight: 'Next-Gen Incumbent',
      topLeft: 'Traditional Heavyweight',
      bottomLeft: 'Emerging Challenger',
      bottomRight: 'AI Pioneer / Disruptor',
    },
  },
  price_vs_target: {
    name: 'Price vs. Target Market',
    description: 'Compares pricing level against target customer segment scale.',
    xLabelLeft: 'Individual / Student / Consumer',
    xLabelRight: 'Mid-Market / Enterprise',
    yLabelBottom: 'Affordable / Low Price',
    yLabelTop: 'Premium / High Tier',
    quadrants: {
      topRight: 'Enterprise Premium',
      topLeft: 'Consumer Luxury',
      bottomLeft: 'Mass-Market Accessible',
      bottomRight: 'Enterprise Low-Cost',
    },
  },
  ease_vs_depth: {
    name: 'Ease of Use vs. Capability Depth',
    description: 'Compares frictionless user experience against advanced capability depth.',
    xLabelLeft: 'Complex / Steep Learning Curve',
    xLabelRight: 'Frictionless / Self-Serve',
    yLabelBottom: 'Basic / Minimalist',
    yLabelTop: 'Deep / Highly Configurable',
    quadrants: {
      topRight: 'Sweet Spot (Easy & Powerful)',
      topLeft: 'Power-User Only',
      bottomLeft: 'Barebones / Legacy',
      bottomRight: 'Simple Utility',
    },
  },
  b2c_vs_b2b: {
    name: 'B2C vs. B2B Focus',
    description: 'Compares consumer direct orientation against business and institutional scale.',
    xLabelLeft: 'Pure Consumer (B2C)',
    xLabelRight: 'Enterprise / B2B',
    yLabelBottom: 'Self-Funded / Free',
    yLabelTop: 'Contract / Enterprise Spend',
    quadrants: {
      topRight: 'Enterprise SaaS',
      topLeft: 'Consumer Subscription',
      bottomLeft: 'Ad/Freemium Consumer',
      bottomRight: 'Prosumer / Team Plan',
    },
  },
};

export const PositioningMap: React.FC<PositioningMapProps> = ({ positioningMaps, startupName }) => {
  const [selectedAxis, setSelectedAxis] = useState<PositioningAxisKey>('price_vs_features');
  const [hoveredPoint, setHoveredPoint] = useState<PositioningCoordinate | null>(null);

  const currentPoints = useMemo(() => {
    return positioningMaps[selectedAxis] || [];
  }, [positioningMaps, selectedAxis]);

  const config = AXIS_CONFIG[selectedAxis] || AXIS_CONFIG.price_vs_features;

  return (
    <div className="space-y-4">
      {/* Header & Axis Selection Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Strategic Market Positioning Map
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {config.description} (Analytical estimates based on publicly available data)
          </p>
        </div>

        {/* Axis dropdown / pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(AXIS_CONFIG) as PositioningAxisKey[]).map((axisKey) => {
            const isSelected = selectedAxis === axisKey;
            return (
              <button
                key={axisKey}
                onClick={() => {
                  setSelectedAxis(axisKey);
                  setHoveredPoint(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {AXIS_CONFIG[axisKey].name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 2D Canvas */}
      <div className="relative bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden">
        {/* Quadrant Watermarks */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none p-6 text-[10px] font-bold tracking-wider uppercase text-slate-300 dark:text-slate-700 select-none">
          <div className="flex items-start justify-start p-2 opacity-50">
            {config.quadrants.topLeft}
          </div>
          <div className="flex items-start justify-end p-2 opacity-50 text-right">
            {config.quadrants.topRight}
          </div>
          <div className="flex items-end justify-start p-2 opacity-50">
            {config.quadrants.bottomLeft}
          </div>
          <div className="flex items-end justify-end p-2 opacity-50 text-right">
            {config.quadrants.bottomRight}
          </div>
        </div>

        {/* Axis Labels: Top and Bottom */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[460px] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 500 360">
            {/* Grid Lines */}
            <line
              x1="40"
              y1="180"
              x2="460"
              y2="180"
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1.5"
            />
            <line
              x1="250"
              y1="25"
              x2="250"
              y2="335"
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1.5"
            />

            {/* Border bounds */}
            <rect
              x="40"
              y="25"
              width="420"
              height="310"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
              rx="8"
            />

            {/* Interactive Data Points */}
            {currentPoints.map((pt) => {
              // Convert 0-100 coordinates to SVG bounds:
              // X: 40 to 460 (width 420) => x = 40 + (score / 100) * 420
              // Y: 25 to 335 (height 310, inverted since SVG y is top-down) => y = 335 - (score / 100) * 310
              const cx = 40 + Math.max(5, Math.min(95, pt.x_score)) * 4.2;
              const cy = 335 - Math.max(5, Math.min(95, pt.y_score)) * 3.1;
              const isStartup = Boolean(pt.is_startup);
              const isHovered = hoveredPoint?.id === pt.id;

              return (
                <g
                  key={pt.id}
                  className="cursor-pointer transition-transform duration-150"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onClick={() => setHoveredPoint(pt)}
                >
                  {/* Highlight halo for startup or hovered point */}
                  {isStartup ? (
                    <>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="18"
                        className="fill-indigo-500/20 dark:fill-indigo-500/30 animate-pulse"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r="10"
                        className="fill-indigo-600 stroke-white stroke-2 shadow-md"
                      />
                    </>
                  ) : (
                    <>
                      {isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="14"
                          className="fill-slate-400/20 dark:fill-slate-500/30"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? '8' : '6'}
                        className={`stroke-white stroke-2 transition-all ${
                          pt.competitor_type === 'Direct'
                            ? 'fill-rose-500 dark:fill-rose-400'
                            : pt.competitor_type === 'Emerging'
                            ? 'fill-amber-500 dark:fill-amber-400'
                            : pt.competitor_type === 'Substitute'
                            ? 'fill-slate-600 dark:fill-slate-400'
                            : 'fill-blue-500 dark:fill-blue-400'
                        }`}
                      />
                    </>
                  )}

                  {/* Text Label on Plot */}
                  <text
                    x={cx}
                    y={cy - (isStartup ? 14 : 10)}
                    textAnchor="middle"
                    className={`text-[10px] font-bold pointer-events-none select-none ${
                      isStartup
                        ? 'fill-indigo-700 dark:fill-indigo-300 font-extrabold'
                        : 'fill-slate-700 dark:fill-slate-300 font-medium'
                    }`}
                  >
                    {isStartup ? `★ ${pt.name}` : pt.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Axis Labels Overlay */}
        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-3 pt-2">
          <span>← {config.xLabelLeft}</span>
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
            {config.name}
          </span>
          <span>{config.xLabelRight} →</span>
        </div>
      </div>

      {/* Selected Point Details Card & Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dynamic Point Inspector */}
        <div className="md:col-span-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {hoveredPoint ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      hoveredPoint.is_startup
                        ? 'bg-indigo-600'
                        : hoveredPoint.competitor_type === 'Direct'
                        ? 'bg-rose-500'
                        : hoveredPoint.competitor_type === 'Emerging'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    {hoveredPoint.name}
                  </h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {hoveredPoint.is_startup ? 'Your Startup' : hoveredPoint.competitor_type || 'Competitor'}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-500">
                  Coordinates: ({hoveredPoint.x_score}, {hoveredPoint.y_score})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-semibold block">Horizontal Axis:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {hoveredPoint.x_label || `${hoveredPoint.x_score}/100`}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-semibold block">Vertical Axis:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {hoveredPoint.y_label || `${hoveredPoint.y_score}/100`}
                  </span>
                </div>
              </div>

              {hoveredPoint.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">
                  &ldquo;{hoveredPoint.notes}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 py-3">
              <Crosshair className="w-4 h-4 mr-2 text-indigo-500" />
              Hover or click on any marker above to inspect coordinates and strategic positioning notes.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">
            Map Legend
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 ring-2 ring-indigo-300" />
              <span className="font-bold text-slate-900 dark:text-white">Your Startup Position</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-700 dark:text-slate-300">Direct Competitor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-700 dark:text-slate-300">Indirect Solution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-700 dark:text-slate-300">Emerging Challenger</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span className="text-slate-700 dark:text-slate-300">Substitute / Traditional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
