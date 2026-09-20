import React from 'react';
import { AICompetitorInsights } from '../../types/competitorIntelligence';
import {
  Sparkles,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Target,
  Layers,
  Lightbulb,
} from 'lucide-react';

interface AICompetitorInsightsCardProps {
  insights: Partial<AICompetitorInsights>;
  startupTitle: string;
}

export const AICompetitorInsightsCard: React.FC<AICompetitorInsightsCardProps> = ({
  insights,
  startupTitle,
}) => {
  return (
    <div className="space-y-6">
      {/* Landscape Strategic Summary */}
      {insights.landscape_summary && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
              Strategic Landscape Synthesis
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {insights.landscape_summary}
          </p>
        </div>
      )}

      {/* Market Structure Breakdown */}
      {insights.market_structure && (
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Market Structure Analysis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Direct Competitors
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {insights.market_structure.direct || 'Direct alternatives targeting identical customer segments.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Indirect Competitors
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {insights.market_structure.indirect || 'Different products satisfying the same underlying requirement.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Substitute Behaviors
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {insights.market_structure.substitutes || 'Manual spreadsheets, agency services, or status quo inertia.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Emerging Startups
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {insights.market_structure.emerging || 'Recent seed/pre-seed companies innovating with modern approaches.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Differentiation Opportunities & Strategic Recommendations */}
      {insights.differentiation_opportunities && insights.differentiation_opportunities.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Actionable Differentiation Wedges
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insights.differentiation_opportunities.map((opp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {opp.opportunity}
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {opp.label || 'Strategic Recommendation'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {opp.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Retaliation Risks & Countermeasures */}
      {insights.competitive_risks && insights.competitive_risks.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Incumbent Retaliation Risks & Countermeasures
          </h4>
          <div className="space-y-3">
            {insights.competitive_risks.map((risk, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Risk: {risk.risk}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      risk.severity === 'High'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : risk.severity === 'Medium'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {risk.severity} Severity
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Strategic Countermeasure / Mitigation
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5">{risk.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Validation Questions */}
      {insights.questions_to_validate && insights.questions_to_validate.length > 0 && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Customer Validation Questions to Ask Before Launch
            </h4>
          </div>
          <div className="space-y-2">
            {insights.questions_to_validate.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
