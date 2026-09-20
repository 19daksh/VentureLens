import React from 'react';
import {
  CompetitiveGapItem,
  DifferentiationOpportunity,
  StartupPositionComparison,
} from '../../types/competitorIntelligence';
import {
  Target,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Compass,
} from 'lucide-react';

interface CompetitiveGapsProps {
  gaps: CompetitiveGapItem[];
  differentiation: DifferentiationOpportunity[];
  startupComparison: StartupPositionComparison[];
  startupTitle: string;
}

export const CompetitiveGaps: React.FC<CompetitiveGapsProps> = ({
  gaps,
  differentiation,
  startupComparison,
  startupTitle,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Research-Based Competitive Gaps & White Space */}
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Identified Market Gaps & White-Space Opportunities
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Systematic blindspots, underserved cohorts, and friction points left open by incumbents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {gaps.map((gap) => (
            <div
              key={gap.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {gap.gap_type}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  {gap.classification || 'Research-based opportunity'}
                </span>
              </div>

              <div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">{gap.title}</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {gap.evidence}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                {gap.affected_segment && (
                  <span className="text-slate-500">
                    Underserved Segment:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{gap.affected_segment}</strong>
                  </span>
                )}
                {gap.relevant_competitors && gap.relevant_competitors.length > 0 && (
                  <span className="text-slate-400 text-[11px]">
                    Incumbents: {gap.relevant_competitors.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Strategic Differentiation Analysis Across 10 Dimensions */}
      {differentiation.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Compass className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Strategic Differentiation Analysis
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Factual side-by-side comparison across strategic axes to avoid head-on competition.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {differentiation.map((diff, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {diff.title || diff.dimension.replace('_', ' ')}
                  </h5>
                  <span className="text-[10px] font-bold text-slate-500 capitalize">
                    Confidence: {diff.confidence}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Incumbent Status Quo
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {diff.current_landscape}
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Proposed Differentiation Wedge (★ {startupTitle})
                    </span>
                    <p className="text-indigo-900 dark:text-indigo-200 font-semibold mt-0.5">
                      {diff.potential_differentiation}
                    </p>
                  </div>
                </div>

                {diff.evidence && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Evidence: {diff.evidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Startup Comparison Table */}
      {startupComparison.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Core Value Wedge Comparison
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-200 w-1/4">
                    Dimension
                  </th>
                  <th className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40 w-3/8">
                    ★ {startupTitle} (Proposed)
                  </th>
                  <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300 w-3/8">
                    Competitor Landscape (Observed)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {startupComparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                      {row.dimension}
                    </td>
                    <td className="p-3.5 text-indigo-900 dark:text-indigo-200 bg-indigo-50/20 dark:bg-indigo-950/10 font-medium">
                      {row.startup_position}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {row.competitor_landscape}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
