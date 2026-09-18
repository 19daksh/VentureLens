import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { ScoreBadge } from '../components/ScoreBadge';
import { RadarScoreChart } from '../components/RadarScoreChart';
import {
  Compass,
  ArrowLeft,
  FileText,
  GitCompare,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Cpu,
  ShieldAlert,
  Rocket,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Printer,
  ExternalLink,
} from 'lucide-react';

export const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIdeaById, deleteIdea, toggleCompareId, selectedCompareIds, loading } = useAnalysis();

  const [activeTab, setActiveTab] = useState<
    'problem' | 'market' | 'competitors' | 'business' | 'tech' | 'risks' | 'mvp' | 'gtm' | 'recommendations'
  >('problem');

  const idea = id ? getIdeaById(id) : null;

  if (loading && !idea) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading analysis data...</p>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 text-center">
        <Compass className="w-12 h-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analysis not found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          The requested startup evaluation could not be located or was removed.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const analysis = idea.analysis;
  const isSelectedForCompare = id ? selectedCompareIds.includes(id) : false;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this startup evaluation?')) {
      if (id) {
        await deleteIdea(id);
        navigate('/dashboard');
      }
    }
  };

  const getVerdictTheme = (type?: string) => {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('build') || normalized === 'strong_build' || normalized === 'build_with_caution') {
      return {
        badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        title: 'Build Signal',
        description: 'High market demand, clear customer pain, and defensible economics.',
      };
    }
    if (normalized.includes('improve')) {
      return {
        badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        title: 'Requires Improvement',
        description: 'Significant competitive overlap or unproven customer willingness-to-pay.',
      };
    }
    return {
      badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      title: 'Pivot Advised',
      description: 'Substantial structural headwinds, commoditized alternatives, or high execution friction.',
    };
  };

  const verdictTheme = getVerdictTheme(analysis?.verdict_type);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full">
                  {idea.industry}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {new Date(idea.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 font-['Space_Grotesk',sans-serif]">
                {idea.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Compare Toggle */}
            <button
              onClick={() => id && toggleCompareId(id)}
              id="detail-btn-toggle-compare"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isSelectedForCompare
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isSelectedForCompare ? 'In Comparison' : 'Add to Compare'}</span>
            </button>

            {/* Investor Report Link */}
            <Link
              to={`/analysis/${id}/report`}
              id="detail-btn-view-report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Investor Memo</span>
            </Link>

            {/* Delete */}
            <button
              onClick={handleDelete}
              id="detail-btn-delete"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete evaluation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {analysis ? (
          <>
            {/* Executive Summary & Radar Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
              {/* Left 2 Cols: Verdict & Summary */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${verdictTheme.badge}`}
                      >
                        {analysis.verdict || verdictTheme.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                        Confidence: <strong className="text-slate-800 dark:text-slate-200 uppercase text-[10px]">{analysis.confidence_indicator || 'High'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-300 font-semibold">Overall Score:</span>
                      <ScoreBadge score={analysis.overall_score} size="xl" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Executive Summary
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed font-normal">
                      {analysis.executive_summary}
                    </p>
                  </div>

                  {/* Dimension score chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Problem</p>
                      <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{analysis.problem_score}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Market</p>
                      <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{analysis.market_score}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Competition</p>
                      <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{analysis.competition_score}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Revenue</p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{analysis.revenue_score}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Technical</p>
                      <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{analysis.technical_score}</p>
                    </div>
                  </div>
                </div>

                {/* Target Audience Context */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">Target Buyer:</strong> {idea.target_audience}
                  </span>
                </div>
              </div>

              {/* Right 1 Col: Radar Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col items-center justify-center transition-colors">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Validation Radar
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">5 Dimensions</span>
                </div>
                <div className="w-full h-64">
                  <RadarScoreChart analysis={analysis} height={260} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2">
                  Balanced shape indicates low asymmetric execution friction.
                </p>
              </div>
            </div>

            {/* Categorized Deep-Dive Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
              {[
                { id: 'problem', label: '1. Problem & Demand', icon: Target },
                { id: 'market', label: '2. Market Sizing (TAM)', icon: TrendingUp },
                { id: 'competitors', label: '3. Competitors & Moat', icon: Users },
                { id: 'business', label: '4. Business Model & Pricing', icon: DollarSign },
                { id: 'tech', label: '5. Tech Architecture', icon: Cpu },
                { id: 'risks', label: '6. Risk Matrix', icon: ShieldAlert },
                { id: 'mvp', label: '7. MVP Roadmap', icon: Rocket },
                { id: 'gtm', label: '8. Go-To-Market', icon: Compass },
                { id: 'recommendations', label: '9. Next Steps', icon: Sparkles },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
              {/* TAB 1: Problem & Demand */}
              {activeTab === 'problem' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Problem & Customer Demand</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Evaluating pain intensity and authentic willingness-to-pay</p>
                    </div>
                    <ScoreBadge score={analysis.problem_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Problem Severity</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1 capitalize">
                        {analysis.problem_validation?.problem_severity || (analysis.problem_validation as any)?.pain_severity || 'High'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Friction Frequency</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1 capitalize">
                        {analysis.problem_validation?.frequency || 'Daily'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Problem Score</p>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 capitalize">
                        {analysis.problem_validation?.problem_strength_score ?? analysis.problem_score}/100
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Customer Problem Analysis & Insights
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {analysis.problem_validation?.validation_insights || (analysis.problem_validation as any)?.description || idea.description}
                    </p>
                  </div>

                  {analysis.problem_validation?.customer_pain_points && analysis.problem_validation.customer_pain_points.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Validated Customer Pain Points
                      </h4>
                      <div className="space-y-2">
                        {analysis.problem_validation.customer_pain_points.map((pt, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((analysis.problem_validation?.existing_alternatives && analysis.problem_validation.existing_alternatives.length > 0) ||
                    ((analysis.problem_validation as any)?.existing_workarounds && (analysis.problem_validation as any).existing_workarounds.length > 0)) && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Existing Alternatives & Competitor Workarounds
                      </h4>
                      <div className="space-y-2">
                        {(analysis.problem_validation?.existing_alternatives || (analysis.problem_validation as any)?.existing_workarounds || []).map((w: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Market Sizing */}
              {activeTab === 'market' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">TAM / SAM / SOM Market Sizing</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Top-down and bottom-up market estimation</p>
                    </div>
                    <ScoreBadge score={analysis.market_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Addressable Market (TAM)</span>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {analysis.market_analysis?.tam || '$10B+'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300 mt-2">The total worldwide addressable demand for this category.</p>
                    </div>

                    <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Serviceable Addressable Market (SAM)</span>
                      <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                        {analysis.market_analysis?.sam || '$1.5B'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">The portion of TAM targeted by your current geography and tech segment.</p>
                    </div>

                    <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/40">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Serviceable Obtainable Market (SOM)</span>
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        {analysis.market_analysis?.som || '$120M'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Realistic revenue target attainable within Years 1–3 of operations.</p>
                    </div>
                  </div>

                  {analysis.market_analysis?.growth_potential && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Growth Potential & CAGR Trajectory
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysis.market_analysis.growth_potential}
                      </p>
                    </div>
                  )}

                  {analysis.market_analysis?.market_trends && analysis.market_analysis.market_trends.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Key Market Trends & Tailwinds
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.market_analysis.market_trends.map((t, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Competitors & Moat */}
              {activeTab === 'competitors' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Competitors & Strategic Moats</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Benchmarking direct alternatives and uncovering unserved white-space</p>
                    </div>
                    <ScoreBadge score={analysis.competition_score} size="md" />
                  </div>

                  {/* Moat & Differentiation Callout */}
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                      Strategic Defensibility & Moat
                    </h4>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
                      {analysis.competitor_analysis?.differentiation_strategy ||
                        (analysis.competitor_analysis as any)?.moat_potential ||
                        'Defensibility rests on proprietary data, targeted customer workflow integration, and distinct positioning.'}
                    </p>
                  </div>

                  {analysis.competitor_analysis?.competitive_landscape_summary && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Competitive Landscape Overview
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysis.competitor_analysis.competitive_landscape_summary}
                      </p>
                    </div>
                  )}

                  {/* Competitor Battlecards */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Competitor Battlecards
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.competitor_analysis?.competitors?.map((comp, idx) => (
                        <div key={idx} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">{comp.name}</h5>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                              Competitor {idx + 1}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{comp.description}</p>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div>
                              <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Strengths:</strong>
                              <ul className="text-slate-500 dark:text-slate-400 space-y-0.5">
                                {comp.strengths?.slice(0, 2).map((s, sIdx) => (
                                  <li key={sIdx}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Weaknesses:</strong>
                              <ul className="text-slate-500 dark:text-slate-400 space-y-0.5">
                                {comp.weaknesses?.slice(0, 2).map((w, wIdx) => (
                                  <li key={wIdx}>• {w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                            <strong className="text-indigo-700 dark:text-indigo-400">Wedge Opportunity: </strong>
                            <span className="text-slate-600 dark:text-slate-300">{comp.differentiation_opportunity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Business Model & Pricing */}
              {activeTab === 'business' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Business Model & Unit Economics</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pricing models, gross margins, and customer acquisition</p>
                    </div>
                    <ScoreBadge score={analysis.revenue_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pricing Model</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {analysis.business_model?.recommended_business_model || (analysis.business_model as any)?.recommended_pricing || 'Subscription / B2B SaaS'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pricing Strategy</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {analysis.business_model?.pricing_strategy || 'Value-Based Pricing'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Target Segment</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {analysis.business_model?.customer_segment || 'Early Adopters & SMBs'}
                      </p>
                    </div>
                  </div>

                  {analysis.business_model?.monetization_strategy && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Monetization Strategy
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysis.business_model.monetization_strategy}
                      </p>
                    </div>
                  )}

                  {analysis.business_model?.unit_economics_considerations && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1">
                        Unit Economics Considerations
                      </h4>
                      <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                        {analysis.business_model.unit_economics_considerations}
                      </p>
                    </div>
                  )}

                  {(analysis.business_model as any)?.pricing_tiers && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        Suggested Pricing Tiers
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(analysis.business_model as any).pricing_tiers.map((tier: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{tier.name}</p>
                            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{tier.price}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{tier.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.business_model?.revenue_streams && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Expansion Revenue Streams
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.business_model.revenue_streams.map((stream, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{stream}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Technical Architecture */}
              {activeTab === 'tech' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Technical Feasibility & Architecture</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Complexity evaluation, stack guidance, and scalability discovery</p>
                    </div>
                    <ScoreBadge score={analysis.technical_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Architecture Complexity</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                        {analysis.technical_feasibility?.complexity || 'Moderate'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Feasibility Score</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {analysis.technical_feasibility?.technical_feasibility_score ?? analysis.technical_score}/100
                      </p>
                    </div>
                  </div>

                  {analysis.technical_feasibility?.recommended_technology_direction && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1">
                        Recommended Technology Direction
                      </h4>
                      <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                        {analysis.technical_feasibility.recommended_technology_direction}
                      </p>
                    </div>
                  )}

                  {analysis.technical_feasibility?.major_technical_requirements && analysis.technical_feasibility.major_technical_requirements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Major Technical Requirements
                      </h4>
                      <div className="space-y-2">
                        {analysis.technical_feasibility.major_technical_requirements.map((req, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.technical_feasibility?.scalability_considerations && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Scalability Considerations
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysis.technical_feasibility.scalability_considerations}
                      </p>
                    </div>
                  )}

                  {analysis.technical_feasibility?.technical_risks && analysis.technical_feasibility.technical_risks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Technical Risks & Challenges
                      </h4>
                      <div className="space-y-2">
                        {analysis.technical_feasibility.technical_risks.map((c, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: Risk Matrix */}
              {activeTab === 'risks' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Pre-Mortem Risk Assessment Matrix</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Identify fatal vulnerabilities before committing capital</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-3 py-1 rounded-full">
                      {analysis.risks?.length || 0} Core Risks Cataloged
                    </span>
                  </div>

                  <div className="space-y-4">
                    {analysis.risks?.map((risk, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {risk.category}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                                String(risk.severity).toLowerCase() === 'critical'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                                  : String(risk.severity).toLowerCase() === 'high'
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              Severity: {risk.severity}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Prob: <strong className="text-slate-700 dark:text-slate-300 capitalize">{risk.probability}</strong> • Impact: <strong className="text-slate-700 dark:text-slate-300 capitalize">{risk.impact}</strong>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{risk.description}</p>

                        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-emerald-800 dark:text-emerald-300">Mitigation Strategy: </strong>
                            <span>{risk.mitigation}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: MVP Roadmap */}
              {activeTab === 'mvp' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Phased MVP Roadmap & Feature Isolation</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Strict separation of core must-haves from distraction features</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/60 px-3 py-1 rounded-full">
                      6–8 Week Target Cycle
                    </span>
                  </div>

                  {/* Must have vs Nice to have columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                          Must-Have Features (Non-Negotiable MVP)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Only build what is essential to prove customer willingness-to-pay.</p>
                      <div className="space-y-2 pt-2">
                        {analysis.mvp_roadmap?.must_have_features?.map((f, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/50 text-xs text-slate-800 dark:text-slate-200 shadow-2xs">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Nice-to-Have Features (Deferred to V2)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Defer these features until after initial customer retention is proven.</p>
                      <div className="space-y-2 pt-2">
                        {analysis.mvp_roadmap?.nice_to_have_features?.map((f, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 shadow-2xs">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Phased Milestones */}
                  {analysis.mvp_roadmap?.phases && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                        Phase Execution Sequence
                      </h4>
                      <div className="space-y-4">
                        {analysis.mvp_roadmap.phases.map((phase: any, idx: number) => {
                          const phaseName = phase.phase || phase.phase_name || `Phase ${idx + 1}`;
                          return (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row gap-4 items-start">
                              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                                0{idx + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">{phaseName}</h5>
                                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{phase.duration}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{phase.goal}</p>
                                {phase.features && phase.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {phase.features.map((feat: string, fIdx: number) => (
                                      <span key={fIdx} className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                                        {feat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: Go-To-Market */}
              {activeTab === 'gtm' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Go-To-Market & Distribution Strategy</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Early beachhead customer acquisition, channel economics, and positioning</p>
                    </div>
                    <ScoreBadge score={analysis.overall_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Initial Beachhead Customer</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1 leading-relaxed">
                        {analysis.go_to_market?.initial_target_customer || 'Early adopter niche buyers with urgent unmet workflows'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                      <p className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">Market Positioning</p>
                      <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 mt-1 leading-relaxed">
                        {analysis.go_to_market?.positioning || 'Precision purpose-built solution replacing fragmented manual tools'}
                      </p>
                    </div>
                  </div>

                  {analysis.go_to_market?.acquisition_channels && analysis.go_to_market.acquisition_channels.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Primary Customer Acquisition Channels
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.go_to_market.acquisition_channels.map((ch, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <Rocket className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <span>{ch}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.go_to_market?.launch_strategy && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Recommended Launch Playbook
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysis.go_to_market.launch_strategy}
                      </p>
                    </div>
                  )}

                  {analysis.go_to_market?.early_validation_strategy && (
                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1">
                        Early Validation & Traction Loop
                      </h4>
                      <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                        {analysis.go_to_market.early_validation_strategy}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: Next Steps & Final Recommendations */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Next Steps & Founder Action Plan</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Direct prescriptive actions to de-risk and validate</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900/60 px-3 py-1 rounded-full">
                      Action Items
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Immediate Priority Actions
                    </h4>
                    {analysis.recommendations?.map((rec: any, idx: number) => {
                      const isObj = typeof rec === 'object' && rec !== null;
                      const actionText = isObj ? rec.action : String(rec);
                      const priority = isObj ? rec.priority : 'Immediate';
                      const category = isObj ? rec.category : 'General';
                      const reason = isObj ? rec.reason : null;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col gap-2 text-xs text-slate-800 dark:text-slate-200"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                                {idx + 1}
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-white">{actionText}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                                {category}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                String(priority).toLowerCase() === 'immediate'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                              }`}>
                                {priority}
                              </span>
                            </div>
                          </div>
                          {reason && (
                            <p className="text-slate-500 dark:text-slate-400 pl-7 text-[11px] leading-relaxed">
                              {reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {analysis.final_verdict && (
                    <div className="mt-8 p-6 rounded-2xl bg-indigo-950 text-white shadow-lg space-y-4 border border-indigo-900">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-sm font-bold tracking-tight font-['Space_Grotesk',sans-serif]">
                          Final Diligence Verdict & Strategic Synthesis
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-normal">
                        {typeof analysis.final_verdict === 'object' ? analysis.final_verdict.verdict : analysis.final_verdict}
                      </p>

                      {typeof analysis.final_verdict === 'object' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                          {analysis.final_verdict.recommended_next_step && (
                            <div className="p-3 rounded-lg bg-indigo-900/60 border border-indigo-800 col-span-full">
                              <strong className="text-indigo-300 block text-[10px] uppercase font-bold tracking-wider">Recommended Next Step:</strong>
                              <span className="text-indigo-100 mt-1 block">{analysis.final_verdict.recommended_next_step}</span>
                            </div>
                          )}
                          {analysis.final_verdict.biggest_risk && (
                            <div className="p-3 rounded-lg bg-indigo-900/60 border border-indigo-800 col-span-full">
                              <strong className="text-rose-300 block text-[10px] uppercase font-bold tracking-wider">Primary Risk to De-Risk:</strong>
                              <span className="text-indigo-100 mt-1 block">{analysis.final_verdict.biggest_risk}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center my-8 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400">Analysis results are currently being processed or unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
};
