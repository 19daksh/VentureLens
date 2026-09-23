import React, { useState, useMemo } from 'react';
import { FeatureMatrixRow, CompetitorProfile, FeatureAvailabilityStatus } from '../../types/competitorIntelligence';
import { Z_INDEX } from '../../constants/zIndex';
import { CheckCircle2, MinusCircle, HelpCircle, Search, Filter, Layers, Info } from 'lucide-react';

interface FeatureMatrixTableProps {
  rows: FeatureMatrixRow[];
  competitors: CompetitorProfile[];
  startupTitle: string;
}

export const FeatureMatrixTable: React.FC<FeatureMatrixTableProps> = ({
  rows,
  competitors,
  startupTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFeatureNote, setActiveFeatureNote] = useState<FeatureMatrixRow | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        r.feature_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [rows, selectedCategory, searchQuery]);

  const renderStatusIcon = (status: FeatureAvailabilityStatus) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Available</span>
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <MinusCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Partial</span>
          </span>
        );
      case 'Not identified':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Not identified</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Features ({rows.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Feature Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <th className={`p-3.5 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-800/95 ${Z_INDEX.IN_CONTENT_STICKY} min-w-[200px] border-r border-slate-200 dark:border-slate-700`}>
                Product Capability
              </th>
              {/* Highlight Your Startup */}
              <th className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/60 border-r border-indigo-200 dark:border-indigo-900/60 min-w-[150px] text-center">
                <div className="flex flex-col items-center">
                  <span>★ {startupTitle}</span>
                  <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                    Your Proposed Scope
                  </span>
                </div>
              </th>
              {competitors.map((comp) => (
                <th
                  key={comp.id}
                  className="p-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 min-w-[140px] text-center"
                >
                  <div className="flex flex-col items-center">
                    <span className="truncate max-w-[130px]" title={comp.name}>
                      {comp.name}
                    </span>
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      {comp.competitor_type || 'Competitor'}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={competitors.length + 2}
                  className="p-8 text-center text-slate-400 dark:text-slate-500"
                >
                  No features match your current filter or query.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Feature Title & Description */}
                  <td className={`p-3.5 sticky left-0 bg-white dark:bg-slate-900 ${Z_INDEX.IN_CONTENT_STICKY} border-r border-slate-200 dark:border-slate-700`}>
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {row.feature_name}
                        </span>
                        {row.description && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {row.description}
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 inline-block">
                          {row.category}
                        </span>
                      </div>
                      {row.notes && (
                        <button
                          onClick={() => setActiveFeatureNote(row)}
                          title="View nuances & notes"
                          className="text-slate-400 hover:text-indigo-600 p-0.5"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Startup Status Column */}
                  <td className="p-3.5 text-center bg-indigo-50/30 dark:bg-indigo-950/20 border-r border-indigo-100 dark:border-indigo-900/40">
                    {renderStatusIcon(row.startup_status)}
                  </td>

                  {/* Competitor Columns */}
                  {competitors.map((comp) => {
                    const status =
                      row.competitor_status?.[comp.id] ||
                      row.competitor_status?.[comp.name] ||
                      (comp.name
                        ? Object.entries(row.competitor_status || {}).find(
                            ([k]) => k.toLowerCase() === comp.name.toLowerCase()
                          )?.[1]
                        : undefined) ||
                      'Not identified';
                    return (
                      <td
                        key={comp.id}
                        className="p-3.5 text-center border-r border-slate-100 dark:border-slate-800"
                      >
                        {renderStatusIcon(status)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Feature Notes Modal / Bottom Drawer if clicked */}
      {activeFeatureNote && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs flex items-start justify-between gap-3">
          <div>
            <span className="font-bold text-indigo-900 dark:text-indigo-200">
              Capability Details: {activeFeatureNote.feature_name}
            </span>
            <p className="text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
              {activeFeatureNote.notes}
            </p>
          </div>
          <button
            onClick={() => setActiveFeatureNote(null)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Legend & Methodology Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">
            Feature Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Available (Verified in documentation or product)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Partial (Add-on / Limited / Beta)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Not identified (Not found in public documentation)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
