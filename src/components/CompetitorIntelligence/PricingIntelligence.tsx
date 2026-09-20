import React from 'react';
import { CompetitorProfile, CompetitiveGapItem } from '../../types/competitorIntelligence';
import {
  DollarSign,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Calendar,
  AlertCircle,
  Sparkles,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

interface PricingIntelligenceProps {
  competitors: CompetitorProfile[];
  gaps: CompetitiveGapItem[];
  startupPricingStrategy?: string;
}

export const PricingIntelligence: React.FC<PricingIntelligenceProps> = ({
  competitors,
  gaps,
  startupPricingStrategy,
}) => {
  const pricingGaps = gaps.filter((g) => g.gap_type === 'Pricing gap');

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Official</span>
          </span>
        );
      case 'Source-Reported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Source-Reported</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Pricing not publicly verified</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Strategic Pricing Wedge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Market Pricing Intelligence & Tier Benchmarks
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-world pricing structures, free tier policies, and enterprise gatekeeping.
          </p>
        </div>

        {startupPricingStrategy && (
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
            <span className="font-bold">Your Pricing Plan:</span> {startupPricingStrategy}
          </div>
        )}
      </div>

      {/* Pricing Gap Opportunities (if any) */}
      {pricingGaps.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Identified Pricing Gaps & Monetization Wedges
            </h5>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pricingGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">{gap.title}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    {gap.classification}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{gap.evidence}</p>
                {gap.affected_segment && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Target Opportunity: <span className="font-semibold text-slate-600 dark:text-slate-300">{gap.affected_segment}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((comp) => {
          const p = comp.pricing;
          const isVerified = p?.confidence === 'Verified';

          return (
            <div
              key={comp.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                {/* Competitor Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">{comp.name}</h5>
                      {comp.website && (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {comp.business_model || 'SaaS'}
                    </span>
                  </div>
                  {getConfidenceBadge(p?.confidence)}
                </div>

                {/* Pricing Summary */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pricing Summary
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {p?.pricing_summary || 'Pricing not publicly verified'}
                  </p>
                </div>

                {/* Tier Breakdown */}
                <div className="mt-4 space-y-2 text-xs">
                  {/* Free Tier */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Free Tier / Trial:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[180px] truncate">
                      {p?.free_tier || 'None / Not listed'}
                    </span>
                  </div>

                  {/* Entry Tier */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Entry Plan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[180px] truncate">
                      {p?.entry_tier || 'Pricing not publicly verified'}
                    </span>
                  </div>

                  {/* Mid Tier */}
                  {p?.mid_tier && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Mid Tier / Pro:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[180px] truncate">
                        {p.mid_tier}
                      </span>
                    </div>
                  )}

                  {/* Premium Tier */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Premium Plan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[180px] truncate">
                      {p?.premium_tier || 'Pricing not publicly verified'}
                    </span>
                  </div>

                  {/* Enterprise Tier */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Enterprise:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[180px] truncate">
                      {p?.enterprise_tier || 'Contact Sales / Custom'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Research Metadata Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Researched: {p?.last_researched || new Date().toISOString().split('T')[0]}</span>
                </span>
                {p?.source_reference && (
                  <span className="truncate max-w-[120px]" title={p.source_reference}>
                    {p.source_reference}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
