import React from 'react';
import { Activity, ShieldCheck, TrendingUp, Wrench } from 'lucide-react';
import { StartupIdea } from '../types/analysis';
import { computeIdeaHealthScore } from '../utils/healthScore';

interface IdeaHealthMiniBadgeProps {
  idea: StartupIdea;
  onInspectHealth?: (ideaId: string) => void;
  className?: string;
}

export const IdeaHealthMiniBadge: React.FC<IdeaHealthMiniBadgeProps> = ({
  idea,
  onInspectHealth,
  className = '',
}) => {
  if (!idea.analysis) return null;

  const health = computeIdeaHealthScore(idea);

  return (
    <div
      onClick={e => {
        if (onInspectHealth) {
          e.stopPropagation();
          onInspectHealth(idea.id);
        }
      }}
      title="Click to inspect Idea Health Score breakdown (Market, Feasibility, Risk)"
      className={`mt-3 p-2.5 rounded-xl border transition-all ${health.tier.bgClass} ${health.tier.borderClass} hover:ring-2 hover:ring-indigo-500/30 cursor-pointer ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3.5 h-3.5 ${health.tier.textClass}`} />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            Idea Health Score
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs font-black ${health.tier.textClass} font-['Space_Grotesk',sans-serif]`}>
            {health.overallHealthScore}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-300 font-bold">/100</span>
          <span className={`ml-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${health.tier.badgeClass}`}>
            {health.tier.label}
          </span>
        </div>
      </div>

      {/* Mini 3-Pillar Progress Segments */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-[10px] border-t border-slate-200/70 dark:border-slate-700/60">
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <TrendingUp className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
          <span className="truncate">Mkt: <b>{health.marketPotential.score}</b></span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <Wrench className="w-2.5 h-2.5 text-blue-500 shrink-0" />
          <span className="truncate">Feas: <b>{health.feasibility.score}</b></span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
          <span className="truncate">Risk: <b>{health.riskProfile.score}</b></span>
        </div>
      </div>
    </div>
  );
};
