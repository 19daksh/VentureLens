import React, { useState, useMemo } from 'react';
import {
  CompetitorProfile,
  CompetitorType,
  InformationQualityStatus,
} from '../../types/competitorIntelligence';
import {
  Users,
  Search,
  ExternalLink,
  Pin,
  PinOff,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  DollarSign,
  Target,
  ArrowUpRight,
  Info,
  Calendar,
  X,
} from 'lucide-react';

interface CompetitorDirectoryProps {
  competitors: CompetitorProfile[];
  onTogglePin?: (competitorId: string, isPinned: boolean) => void;
}

export const CompetitorDirectory: React.FC<CompetitorDirectoryProps> = ({
  competitors,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorProfile | null>(null);

  const filtered = useMemo(() => {
    return competitors.filter((c) => {
      const matchType = selectedType === 'all' || c.competitor_type === selectedType;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.target_audience.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.core_product && c.core_product.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.key_features && c.key_features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchType && matchSearch;
    });
  }, [competitors, selectedType, searchQuery]);

  const getStatusBadge = (status?: InformationQualityStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Official</span>
          </span>
        );
      case 'Source-reported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Source-reported</span>
          </span>
        );
      case 'AI inference':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>AI inference</span>
          </span>
        );
    }
  };

  const getTypeBadge = (type: CompetitorType) => {
    switch (type) {
      case 'Direct':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Direct Competitor
          </span>
        );
      case 'Indirect':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Indirect Solution
          </span>
        );
      case 'Substitute':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Substitute / Habit
          </span>
        );
      case 'Emerging':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Emerging Startup
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Type Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Direct', 'Indirect', 'Substitute', 'Emerging'].map((typeKey) => {
            const isSelected = selectedType === typeKey;
            return (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {typeKey === 'all' ? `All Competitors (${competitors.length})` : typeKey}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search competitors, features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Competitor Battlecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            No competitors found matching your search.
          </div>
        ) : (
          filtered.map((comp) => {
            const isPinned = Boolean(comp.is_pinned);

            return (
              <div
                key={comp.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                  isPinned
                    ? 'border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-400/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {comp.name}
                        </h5>
                        {comp.website && (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-slate-400 hover:text-indigo-600"
                            title="Visit official website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(comp.competitor_type)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onTogglePin && (
                        <button
                          onClick={() => onTogglePin(comp.id, !isPinned)}
                          title={isPinned ? 'Unpin tracking' : 'Pin competitor for tracking'}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isPinned
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Core Product / Value Prop */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2">
                    {comp.core_product || comp.positioning}
                  </p>

                  {/* Target Audience & Pricing Pill */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-semibold uppercase">Target:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {comp.target_audience}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-semibold uppercase">Pricing Model:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {comp.pricing?.pricing_summary || 'Pricing not publicly verified'}
                      </span>
                    </div>
                  </div>

                  {/* Key Capabilities */}
                  {comp.key_features && comp.key_features.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {comp.key_features.slice(0, 3).map((feat, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]"
                        >
                          {feat}
                        </span>
                      ))}
                      {comp.key_features.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{comp.key_features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Status & Deep Dive button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {getStatusBadge(comp.information_status)}

                  <button
                    onClick={() => setSelectedCompetitor(comp)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    <span>Full Battlecard</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Battlecard Modal */}
      {selectedCompetitor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedCompetitor.name}
                  </h3>
                  {getTypeBadge(selectedCompetitor.competitor_type)}
                  {getStatusBadge(selectedCompetitor.information_status)}
                </div>
                {selectedCompetitor.website && (
                  <a
                    href={selectedCompetitor.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-semibold"
                  >
                    <span>{selectedCompetitor.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedCompetitor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Product & Positioning */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Core Offering & Market Positioning
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedCompetitor.core_product || selectedCompetitor.positioning}
              </p>
            </div>

            {/* Target Audience & Geographic Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Audience</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedCompetitor.target_audience}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Geographic Focus</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {selectedCompetitor.geographic_focus || 'Global / North America'}
                </span>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Verified Pricing Tiers ({selectedCompetitor.pricing?.confidence || 'Publicly Checked'})
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedCompetitor.pricing?.pricing_summary || 'Pricing not publicly verified'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Free Tier:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedCompetitor.pricing?.free_tier || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Entry Plan:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedCompetitor.pricing?.entry_tier || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Premium:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedCompetitor.pricing?.premium_tier || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Enterprise:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedCompetitor.pricing?.enterprise_tier || 'Contact'}
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths & Limitations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {selectedCompetitor.observed_strengths && selectedCompetitor.observed_strengths.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 space-y-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[10px] block">
                    Observed Strengths
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                    {selectedCompetitor.observed_strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCompetitor.observed_limitations && selectedCompetitor.observed_limitations.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 space-y-2">
                  <span className="font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider text-[10px] block">
                    Observed Gaps / Limitations
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                    {selectedCompetitor.observed_limitations.map((l, idx) => (
                      <li key={idx}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Latest Move (if any) */}
            {selectedCompetitor.latest_development && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block">
                  Recent Move: {selectedCompetitor.latest_development.title} ({selectedCompetitor.latest_development.date})
                </span>
                <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  {selectedCompetitor.latest_development.description}
                </p>
                {selectedCompetitor.latest_development.potential_implication && (
                  <p className="text-slate-600 dark:text-slate-300 italic pt-1">
                    Implication: {selectedCompetitor.latest_development.potential_implication}
                  </p>
                )}
              </div>
            )}

            {/* Source Citations */}
            {selectedCompetitor.sources && selectedCompetitor.sources.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Researched Web Sources
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCompetitor.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
                    >
                      <span className="truncate max-w-[200px]">{src.title || src.domain}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
