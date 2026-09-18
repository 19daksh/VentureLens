import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { ScoreBadge } from '../components/ScoreBadge';
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Compass,
  TrendingUp,
  Award,
  AlertTriangle,
  GitCompare,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { ideas, loading, error, deleteIdea, selectedCompareIds, toggleCompareId, clearCompare } = useAnalysis();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'score_desc' | 'score_asc'>('date_desc');

  // Compute metrics
  const metrics = useMemo(() => {
    const total = ideas.length;
    if (total === 0) {
      return { total: 0, avgScore: 0, strongBuilds: 0, pivots: 0 };
    }
    const scores = ideas
      .filter(i => i.analysis?.overall_score !== undefined)
      .map(i => i.analysis!.overall_score);

    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const strong = ideas.filter(i => (i.analysis?.overall_score ?? 0) >= 80).length;
    const pivots = ideas.filter(i => (i.analysis?.overall_score ?? 0) < 60).length;

    return {
      total,
      avgScore: avg,
      strongBuilds: strong,
      pivots,
    };
  }, [ideas]);

  // Unique industries
  const industries = useMemo(() => {
    const list = Array.from(new Set(ideas.map(i => i.industry).filter(Boolean)));
    return list;
  }, [ideas]);

  // Filtered and sorted ideas
  const filteredIdeas = useMemo(() => {
    return ideas
      .filter(item => {
        const matchesSearch =
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.industry.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIndustry = industryFilter === 'all' || item.industry === industryFilter;
        return matchesSearch && matchesIndustry;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') {
          return (b.analysis?.overall_score ?? 0) - (a.analysis?.overall_score ?? 0);
        }
        if (sortBy === 'score_asc') {
          return (a.analysis?.overall_score ?? 0) - (b.analysis?.overall_score ?? 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [ideas, searchQuery, industryFilter, sortBy]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this startup evaluation?')) {
      await deleteIdea(id);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
              Founder Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1">
              Welcome back, {profile?.full_name || user?.email}. Manage and benchmark your validated concepts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/new-analysis"
              id="dashboard-btn-new-analysis"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Validate New Idea</span>
            </Link>
          </div>
        </div>

        {/* Notice Banner */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">System Notice</p>
              <p className="text-amber-800 dark:text-amber-300">{error}</p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Evaluated</span>
              <Layers className="w-4 h-4 text-slate-400 dark:text-slate-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{metrics.total}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Startup concepts tested</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Average Score</span>
              <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{metrics.avgScore}<span className="text-sm font-semibold text-slate-400 dark:text-slate-400">/100</span></p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Portfolio viability index</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Strong Signals</span>
              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{metrics.strongBuilds}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Score ≥ 80 (High conviction)</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pivots Advised</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{metrics.pivots}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Score &lt; 60 (Requires pivot)</p>
          </div>
        </div>

        {/* Selected Compare Floating / Sticky Bar */}
        {selectedCompareIds.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center font-bold text-xs">
                {selectedCompareIds.length}
              </div>
              <div>
                <p className="text-xs font-bold">
                  {selectedCompareIds.length} {selectedCompareIds.length === 1 ? 'idea' : 'ideas'} selected for comparison
                </p>
                <p className="text-[11px] text-indigo-200">
                  Select up to 3 ideas to benchmark their radar distributions side by side.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearCompare}
                className="text-xs font-medium text-indigo-200 hover:text-white px-3 py-1.5"
              >
                Clear
              </button>
              <Link
                to="/compare"
                id="bar-btn-compare-now"
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Launch Compare View</span>
              </Link>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="dashboard-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by startup title, keyword, or problem..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Industry Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="dashboard-filter-industry"
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 py-2 px-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Industries ({ideas.length})</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="dashboard-sort-order"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 py-2 px-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="date_desc">Newest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Ideas Grid / Table */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading your startup validations...</p>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">
              {searchQuery || industryFilter !== 'all' ? 'No matching ideas found' : 'No startup validations yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
              {searchQuery || industryFilter !== 'all'
                ? 'Try clearing your search terms or selecting a different industry filter.'
                : 'Submit your first concept to get deep market opportunity, competitor analysis, unit economics, and an MVP roadmap.'}
            </p>
            <div className="mt-6">
              <Link
                to="/new-analysis"
                id="empty-state-validate-btn"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Validate First Idea</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map(item => {
              const score = item.analysis?.overall_score;
              const isSelectedForCompare = selectedCompareIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  id={`idea-card-${item.id}`}
                  onClick={() => navigate(`/analysis/${item.id}`)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-6 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group ${
                    isSelectedForCompare
                      ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                  }`}
                >
                  <div>
                    {/* Header: Industry & Score */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-0.5 rounded-full truncate max-w-[160px] border border-indigo-200/50 dark:border-indigo-700/60">
                        {item.industry}
                      </span>
                      {score !== undefined ? (
                        <ScoreBadge score={score} size="md" />
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          {item.status === 'analyzing' ? 'Analyzing...' : 'Pending'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.analysis?.verdict && (
                      <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-300 font-medium">Verdict:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {item.analysis.verdict}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[11px]">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Compare toggle checkbox */}
                      <button
                        type="button"
                        id={`btn-compare-toggle-${item.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          toggleCompareId(item.id);
                        }}
                        title={isSelectedForCompare ? 'Remove from comparison' : 'Add to comparison'}
                        className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isSelectedForCompare
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">Compare</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        id={`btn-delete-idea-${item.id}`}
                        onClick={e => handleDelete(e, item.id)}
                        title="Delete evaluation"
                        className="p-1.5 rounded-md text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
