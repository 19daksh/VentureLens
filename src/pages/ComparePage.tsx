import React from 'react';
import { Link } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { ScoreBadge } from '../components/ScoreBadge';
import { ComparisonRadarChart } from '../components/ComparisonRadarChart';
import {
  GitCompare,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const ComparePage: React.FC = () => {
  const { ideas, selectedCompareIds, toggleCompareId, clearCompare } = useAnalysis();

  // Selected ideas with full analyses
  const selectedIdeas = ideas.filter(i => selectedCompareIds.includes(i.id));

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
                Multi-Idea Comparison
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 pl-8">
              Compare 2 to 3 startup concepts head-to-head across market size, moat defensibility, and unit economics.
            </p>
          </div>

          {selectedIdeas.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={clearCompare}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 py-1.5"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Idea Selector Chips */}
        <div className="my-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select concepts to benchmark (Max 3):
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              {selectedIdeas.length} / 3 selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {ideas.map(idea => {
              const isSelected = selectedCompareIds.includes(idea.id);
              return (
                <button
                  key={idea.id}
                  id={`compare-toggle-btn-${idea.id}`}
                  onClick={() => toggleCompareId(idea.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{idea.title}</span>
                  {idea.analysis?.overall_score !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                        isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idea.analysis.overall_score}
                    </span>
                  )}
                  {isSelected && <X className="w-3 h-3 ml-0.5 opacity-80" />}
                </button>
              );
            })}
          </div>
        </div>

        {selectedIdeas.length < 2 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <GitCompare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Select at least 2 startup ideas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
              Click the idea pills above to add them to this side-by-side comparison radar and metrics matrix.
            </p>
            {ideas.length < 2 && (
              <div className="mt-4">
                <Link
                  to="/new-analysis"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Validate Another Idea</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Multi-Radar Comparison Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Multi-Idea Radar Benchmark</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                    Compare performance across problem, market opportunity, moat, revenue, and technical feasibility.
                  </p>
                </div>
              </div>

              <div className="w-full pt-4">
                <ComparisonRadarChart ideas={selectedIdeas} height={380} />
              </div>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Side-by-Side Diligence Matrix
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-4 w-48 shrink-0">Metric</th>
                      {selectedIdeas.map(idea => (
                        <th key={idea.id} className="p-4 min-w-[220px]">
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">{idea.title}</div>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 normal-case font-semibold">{idea.industry}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {/* Overall Score */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Overall Score</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4">
                          {idea.analysis?.overall_score !== undefined ? (
                            <ScoreBadge score={idea.analysis.overall_score} size="md" />
                          ) : (
                            'N/A'
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Verdict */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Verdict</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                          {idea.analysis?.verdict || 'Pending'}
                        </td>
                      ))}
                    </tr>

                    {/* Problem Severity */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Problem Severity</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4 capitalize font-medium">
                          {idea.analysis?.problem_validation?.problem_severity || (idea.analysis?.problem_validation as any)?.pain_severity || 'High'}
                        </td>
                      ))}
                    </tr>

                    {/* TAM / SAM */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">TAM / SAM</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white">{idea.analysis?.market_analysis?.tam || 'N/A'}</p>
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{idea.analysis?.market_analysis?.sam || 'N/A'}</p>
                        </td>
                      ))}
                    </tr>

                    {/* Business Model */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Business Model</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4 font-medium">
                          {idea.analysis?.business_model?.recommended_business_model || (idea.analysis?.business_model as any)?.recommended_pricing || 'B2B SaaS'}
                        </td>
                      ))}
                    </tr>

                    {/* Pricing Strategy */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Pricing Strategy</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {idea.analysis?.business_model?.pricing_strategy || (idea.analysis?.business_model as any)?.ltv_cac_estimate || 'Value-Based'}
                        </td>
                      ))}
                    </tr>

                    {/* Technical Feasibility */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Architecture Complexity</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4 font-medium capitalize">
                          {idea.analysis?.technical_feasibility?.complexity || (idea.analysis?.technical_feasibility as any)?.time_to_build || 'Moderate'}
                        </td>
                      ))}
                    </tr>

                    {/* Actions */}
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">Detailed Report</td>
                      {selectedIdeas.map(idea => (
                        <td key={idea.id} className="p-4">
                          <Link
                            to={`/analysis/${idea.id}`}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                          >
                            Open Full Analysis →
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
