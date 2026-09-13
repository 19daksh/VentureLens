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
  const { getIdeaById, deleteIdea, toggleCompareId, selectedCompareIds } = useAnalysis();

  const [activeTab, setActiveTab] = useState<
    'problem' | 'market' | 'competitors' | 'business' | 'tech' | 'risks' | 'mvp' | 'recommendations'
  >('problem');

  const idea = id ? getIdeaById(id) : null;

  if (!idea) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 text-center">
        <Compass className="w-12 h-12 text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Analysis not found</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          The requested startup evaluation could not be located or was removed.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
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
    switch (type) {
      case 'strong_build':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          title: 'Strong Build Signal',
          description: 'High market demand, clear customer pain, and defensible economics.',
        };
      case 'build_with_caution':
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          title: 'Promising Opportunity (With Caveats)',
          description: 'Solid core premise, but requires tighter positioning or moat refinement.',
        };
      case 'improve':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          title: 'Requires Improvement',
          description: 'Significant competitive overlap or unproven customer willingness-to-pay.',
        };
      default:
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          title: 'Pivot Advised',
          description: 'Substantial structural headwinds, commoditized alternatives, or high execution friction.',
        };
    }
  };

  const verdictTheme = getVerdictTheme(analysis?.verdict_type);

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  {idea.industry}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(idea.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5 font-['Space_Grotesk',sans-serif]">
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
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isSelectedForCompare ? 'In Comparison' : 'Add to Compare'}</span>
            </button>

            {/* Investor Report Link */}
            <Link
              to={`/analysis/${id}/report`}
              id="detail-btn-view-report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Investor Memo</span>
            </Link>

            {/* Delete */}
            <button
              onClick={handleDelete}
              id="detail-btn-delete"
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${verdictTheme.badge}`}
                      >
                        {analysis.verdict || verdictTheme.title}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Confidence: <strong className="text-slate-800 uppercase text-[10px]">{analysis.confidence_indicator || 'High'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Overall Score:</span>
                      <ScoreBadge score={analysis.overall_score} size="xl" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Executive Summary
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-2.5 leading-relaxed font-normal">
                      {analysis.executive_summary}
                    </p>
                  </div>

                  {/* Dimension score chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Problem</p>
                      <p className="text-lg font-extrabold text-slate-800 mt-0.5">{analysis.problem_score}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Market</p>
                      <p className="text-lg font-extrabold text-indigo-600 mt-0.5">{analysis.market_score}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Competition</p>
                      <p className="text-lg font-extrabold text-slate-800 mt-0.5">{analysis.competition_score}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
                      <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{analysis.revenue_score}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Technical</p>
                      <p className="text-lg font-extrabold text-slate-800 mt-0.5">{analysis.technical_score}</p>
                    </div>
                  </div>
                </div>

                {/* Target Audience Context */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Target Buyer:</strong> {idea.target_audience}
                  </span>
                </div>
              </div>

              {/* Right 1 Col: Radar Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Validation Radar
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">5 Dimensions</span>
                </div>
                <div className="w-full h-64">
                  <RadarScoreChart analysis={analysis} height={260} />
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Balanced shape indicates low asymmetric execution friction.
                </p>
              </div>
            </div>

            {/* Categorized Deep-Dive Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200 scrollbar-none">
              {[
                { id: 'problem', label: '1. Problem & Demand', icon: Target },
                { id: 'market', label: '2. Market Sizing (TAM)', icon: TrendingUp },
                { id: 'competitors', label: '3. Competitors & Moat', icon: Users },
                { id: 'business', label: '4. Business Model & Pricing', icon: DollarSign },
                { id: 'tech', label: '5. Tech Architecture', icon: Cpu },
                { id: 'risks', label: '6. Risk Matrix', icon: ShieldAlert },
                { id: 'mvp', label: '7. MVP Roadmap', icon: Rocket },
                { id: 'recommendations', label: '8. Next Steps', icon: Sparkles },
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
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              {/* TAB 1: Problem & Demand */}
              {activeTab === 'problem' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Problem & Customer Demand</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Evaluating pain intensity and authentic willingness-to-pay</p>
                    </div>
                    <ScoreBadge score={analysis.problem_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pain Severity</p>
                      <p className="text-base font-bold text-slate-900 mt-1 capitalize">
                        {analysis.problem_validation?.pain_severity || 'High'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Friction Frequency</p>
                      <p className="text-base font-bold text-slate-900 mt-1 capitalize">
                        {analysis.problem_validation?.frequency || 'Daily'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Willingness to Pay</p>
                      <p className="text-base font-bold text-emerald-600 mt-1 capitalize">
                        {analysis.problem_validation?.willingness_to_pay || 'High'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Customer Problem Analysis
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {analysis.problem_validation?.description || idea.description}
                    </p>
                  </div>

                  {analysis.problem_validation?.existing_workarounds && analysis.problem_validation.existing_workarounds.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Existing Workarounds & Flaws
                      </h4>
                      <div className="space-y-2">
                        {analysis.problem_validation.existing_workarounds.map((w, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-slate-700 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.problem_validation?.validation_hypotheses && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Hypotheses to Validate in Customer Interviews
                      </h4>
                      <div className="space-y-2">
                        {analysis.problem_validation.validation_hypotheses.map((h, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">TAM / SAM / SOM Market Sizing</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Top-down and bottom-up market estimation</p>
                    </div>
                    <ScoreBadge score={analysis.market_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Addressable Market (TAM)</span>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">
                        {analysis.market_analysis?.tam || '$10B+'}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">The total worldwide addressable demand for this category.</p>
                    </div>

                    <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/50">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Serviceable Addressable Market (SAM)</span>
                      <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                        {analysis.market_analysis?.sam || '$1.5B'}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">The portion of TAM targeted by your current geography and tech segment.</p>
                    </div>

                    <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Serviceable Obtainable Market (SOM)</span>
                      <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                        {analysis.market_analysis?.som || '$120M'}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">Realistic revenue target attainable within Years 1–3 of operations.</p>
                    </div>
                  </div>

                  {analysis.market_analysis?.growth_potential && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Growth Potential & CAGR Trajectory
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {analysis.market_analysis.growth_potential}
                      </p>
                    </div>
                  )}

                  {analysis.market_analysis?.market_trends && analysis.market_analysis.market_trends.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Key Market Trends & Tailwinds
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.market_analysis.market_trends.map((t, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Competitors & Strategic Moats</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Benchmarking direct alternatives and uncovering unserved white-space</p>
                    </div>
                    <ScoreBadge score={analysis.competition_score} size="md" />
                  </div>

                  {/* Moat & Differentiation Callout */}
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Strategic Defensibility & Moat
                    </h4>
                    <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                      {analysis.competitor_analysis?.moat_potential ||
                        'Defensibility rests on data network effects, customer workflow integration, and proprietary fine-tuned models.'}
                    </p>
                  </div>

                  {/* Competitor Battlecards */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Competitor Battlecards
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.competitor_analysis?.competitors?.map((comp, idx) => (
                        <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-bold text-slate-900">{comp.name}</h5>
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                              Competitor {idx + 1}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{comp.description}</p>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
                            <div>
                              <strong className="text-slate-700 block mb-0.5">Strengths:</strong>
                              <ul className="text-slate-500 space-y-0.5">
                                {comp.strengths?.slice(0, 2).map((s, sIdx) => (
                                  <li key={sIdx}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <strong className="text-slate-700 block mb-0.5">Weaknesses:</strong>
                              <ul className="text-slate-500 space-y-0.5">
                                {comp.weaknesses?.slice(0, 2).map((w, wIdx) => (
                                  <li key={wIdx}>• {w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 text-[11px]">
                            <strong className="text-indigo-700">Wedge Opportunity: </strong>
                            <span className="text-slate-600">{comp.differentiation_opportunity}</span>
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Business Model & Unit Economics</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Pricing models, gross margins, and customer acquisition</p>
                    </div>
                    <ScoreBadge score={analysis.revenue_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pricing Model</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {analysis.business_model?.recommended_pricing || 'Subscription / B2B SaaS'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated LTV : CAC</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        {analysis.business_model?.ltv_cac_estimate || '4.5 : 1 Target'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Margin Target</p>
                      <p className="text-sm font-bold text-indigo-600 mt-1">
                        {analysis.business_model?.gross_margin_estimate || '75% - 85%'}
                      </p>
                    </div>
                  </div>

                  {analysis.business_model?.pricing_tiers && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                        Suggested Pricing Tiers
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {analysis.business_model.pricing_tiers.map((tier, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <p className="text-xs font-bold text-slate-900">{tier.name}</p>
                            <p className="text-xl font-extrabold text-indigo-600 mt-1">{tier.price}</p>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{tier.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.business_model?.revenue_streams && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Expansion Revenue Streams
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.business_model.revenue_streams.map((stream, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Technical Feasibility & Architecture</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Complexity evaluation, stack guidance, and bottleneck discovery</p>
                    </div>
                    <ScoreBadge score={analysis.technical_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Architecture Complexity</p>
                      <p className="text-sm font-bold text-slate-900 mt-1 capitalize">
                        {analysis.technical_feasibility?.complexity || 'Moderate'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Time to Initial Prototype</p>
                      <p className="text-sm font-bold text-indigo-600 mt-1">
                        {analysis.technical_feasibility?.time_to_build || '4–8 Weeks'}
                      </p>
                    </div>
                  </div>

                  {analysis.technical_feasibility?.recommended_stack && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Recommended Technology Stack
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.technical_feasibility.recommended_stack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-lg"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.technical_feasibility?.key_challenges && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Key Engineering & Scaling Challenges
                      </h4>
                      <div className="space-y-2">
                        {analysis.technical_feasibility.key_challenges.map((c, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                            <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Pre-Mortem Risk Assessment Matrix</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Identify fatal vulnerabilities before committing capital</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                      {analysis.risks?.length || 0} Core Risks Cataloged
                    </span>
                  </div>

                  <div className="space-y-4">
                    {analysis.risks?.map((risk, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              {risk.category}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                                risk.severity === 'critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : risk.severity === 'high'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              Severity: {risk.severity}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-medium">
                            Prob: <strong className="text-slate-700 capitalize">{risk.probability}</strong> • Impact: <strong className="text-slate-700 capitalize">{risk.impact}</strong>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 font-semibold">{risk.description}</p>

                        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-emerald-800">Mitigation Strategy: </strong>
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Phased MVP Roadmap & Feature Isolation</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Strict separation of core must-haves from distraction features</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                      6–8 Week Target Cycle
                    </span>
                  </div>

                  {/* Must have vs Nice to have columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          Must-Have Features (Non-Negotiable MVP)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Only build what is essential to prove customer willingness-to-pay.</p>
                      <div className="space-y-2 pt-2">
                        {analysis.mvp_roadmap?.must_have_features?.map((f, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white border border-emerald-100 text-xs text-slate-800 shadow-2xs">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Nice-to-Have Features (Deferred to V2)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Defer these features until after initial customer retention is proven.</p>
                      <div className="space-y-2 pt-2">
                        {analysis.mvp_roadmap?.nice_to_have_features?.map((f, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 shadow-2xs">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Phased Milestones */}
                  {analysis.mvp_roadmap?.phases && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                        Phase Execution Sequence
                      </h4>
                      <div className="space-y-4">
                        {analysis.mvp_roadmap.phases.map((phase, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                              0{idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-slate-900">{phase.phase_name}</h5>
                                <span className="text-xs font-semibold text-indigo-600">{phase.duration}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{phase.goal}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: Next Steps & Final Recommendations */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Next Steps & Founder Action Plan</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Direct prescriptive actions for the next 14 days</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Action Items
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Immediate Priority Actions
                    </h4>
                    {analysis.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 text-xs text-slate-800"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed mt-0.5">{rec}</span>
                      </div>
                    ))}
                  </div>

                  {analysis.final_verdict && (
                    <div className="mt-8 p-6 rounded-2xl bg-indigo-950 text-white shadow-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-sm font-bold tracking-tight font-['Space_Grotesk',sans-serif]">
                          Final Diligence Verdict & Strategic Synthesis
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-normal">
                        {analysis.final_verdict}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
            <p className="text-xs text-slate-500">Analysis results are currently being processed or unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
};
