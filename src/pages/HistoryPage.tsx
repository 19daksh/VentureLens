import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { ScoreBadge } from '../components/ScoreBadge';
import {
  Search,
  Filter,
  ArrowUpDown,
  History,
  GitCompare,
  Trash2,
  ExternalLink,
  PlusCircle,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { ideas, loading, error, deleteIdea, toggleCompareId, selectedCompareIds } = useAnalysis();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  const industries = useMemo(() => {
    return Array.from(new Set(ideas.map(i => i.industry).filter(Boolean)));
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter(i => {
      const matchSearch =
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchInd = industryFilter === 'all' || i.industry === industryFilter;
      return matchSearch && matchInd;
    });
  }, [ideas, searchQuery, industryFilter]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this startup evaluation?')) {
      await deleteIdea(id);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
              Evaluation History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1">
              Complete archive of your validated startup ideas and investment memos.
            </p>
          </div>

          <Link
            to="/new-analysis"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Validate New Idea</span>
          </Link>
        </div>

        {/* Notice Banner */}
        {error && (
          <div className="my-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">System Notice</p>
              <p className="text-amber-800 dark:text-amber-300">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="my-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search historical evaluations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={industryFilter}
              onChange={e => setIndustryFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 py-1.5 px-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Industries ({ideas.length})</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          {filteredIdeas.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No evaluations found in history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Idea Title</th>
                    <th className="p-4">Industry</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Verdict</th>
                    <th className="p-4">Evaluated Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {filteredIdeas.map(item => {
                    const isSelected = selectedCompareIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/analysis/${item.id}`, { state: { from: '/history' } })}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          <div>{item.title}</div>
                          <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                            {item.description}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {item.industry}
                          </span>
                        </td>
                        <td className="p-4">
                          {item.analysis?.overall_score !== undefined ? (
                            <ScoreBadge score={item.analysis.overall_score} size="sm" />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                          {item.analysis?.verdict || 'Analyzing'}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleCompareId(item.id)}
                              title="Compare"
                              className={`p-1.5 rounded-lg text-xs font-semibold ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              <GitCompare className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              to={`/analysis/${item.id}/report`}
                              title="Investor Memo"
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={e => handleDelete(e, item.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
