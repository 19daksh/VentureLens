import React, { useState, useMemo } from 'react';
import { RecentCompetitorDevelopment, CompetitorDevelopmentType } from '../../types/competitorIntelligence';
import {
  Calendar,
  ExternalLink,
  Sparkles,
  Rocket,
  DollarSign,
  TrendingUp,
  Tag,
  Search,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface RecentDevelopmentsProps {
  developments: RecentCompetitorDevelopment[];
}

export const RecentDevelopments: React.FC<RecentDevelopmentsProps> = ({ developments }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const types = useMemo(() => {
    const set = new Set<string>();
    developments.forEach((d) => {
      if (d.development_type) set.add(d.development_type);
    });
    return Array.from(set);
  }, [developments]);

  const filtered = useMemo(() => {
    return developments.filter((d) => {
      const matchType = selectedType === 'all' || d.development_type === selectedType;
      const matchSearch =
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.competitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [developments, selectedType, searchQuery]);

  const getTypeBadge = (type: CompetitorDevelopmentType) => {
    switch (type) {
      case 'Product Launch':
      case 'Feature Update':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Rocket className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>{type}</span>
          </span>
        );
      case 'Pricing Change':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <DollarSign className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{type}</span>
          </span>
        );
      case 'Funding':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{type}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Tag className="w-3 h-3" />
            <span>{type}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Competitor Moves & Activity Log (Past 12 Months)
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified company announcements, funding events, feature releases, and strategic implications.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Events ({developments.length})
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            No recent competitor developments found matching this filter.
          </div>
        ) : (
          filtered.map((dev) => (
            <div
              key={dev.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {dev.competitor_name}
                  </span>
                  {getTypeBadge(dev.development_type)}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{dev.date}</span>
                  </span>
                  {dev.source_url && (
                    <a
                      href={dev.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      <span>{dev.source_title || 'View Source'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {dev.title}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {dev.description}
                </p>
              </div>

              {/* Strategic Implication Callout */}
              {dev.potential_implication && (
                <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider text-[10px] block">
                    Strategic Implication for Your Startup
                  </span>
                  <p className="text-indigo-800 dark:text-indigo-300 mt-0.5 leading-relaxed">
                    {dev.potential_implication}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
