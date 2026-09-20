import React, { useState } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  ShieldAlert,
  Sparkles,
  Clock,
  CheckCircle2,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { StartupIdea } from '../../types/analysis';
import {
  MarketResearchData,
  MarketResearchRecord,
  ResearchSource,
} from '../../types/marketResearch';
import { useAuth } from '../../context/AuthContext';
import { useAnalysis } from '../../context/AnalysisContext';

interface MarketResearchTabProps {
  idea: StartupIdea;
}

export const MarketResearchTab: React.FC<MarketResearchTabProps> = ({ idea }) => {
  const { session, user } = useAuth();
  const { saveMarketResearchForIdea } = useAnalysis();

  const [researchData, setResearchData] = useState<MarketResearchData | null>(
    idea.market_research?.research_data || idea.analysis?.market_research?.research_data || null
  );
  const [researchedAt, setResearchedAt] = useState<string | null>(
    idea.market_research?.researched_at || idea.analysis?.market_research?.researched_at || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'competitors' | 'trends' | 'demand' | 'developments'>('all');

  const handleRunResearch = async () => {
    setIsLoading(true);
    setError(null);

    const steps = [
      'Searching current market conditions & live web data...',
      'Identifying real-world competitors & pricing signals...',
      'Analyzing recent industry developments & regulatory news...',
      'Synthesizing web-grounded market intelligence...',
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingStep(steps[stepIndex]);
    }, 2800);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (user?.id === '00000000-0000-4000-8000-000000000001') {
        headers['Authorization'] = 'Bearer demo-token';
      }

      const payload = {
        analysisId: idea.analysis?.id || idea.id,
        userId: user?.id,
        ideaData: {
          title: idea.title,
          description: idea.description,
          industry: idea.industry,
          target_audience: idea.target_audience,
          business_model: idea.analysis?.business_model?.recommended_business_model,
        },
        clientContext: {
          title: idea.title,
          description: idea.description,
          industry: idea.industry,
          target_audience: idea.target_audience,
          tam: idea.analysis?.market_analysis?.tam,
          sam: idea.analysis?.market_analysis?.sam,
          som: idea.analysis?.market_analysis?.som,
          overall_score: idea.analysis?.overall_score,
          verdict_type: idea.analysis?.verdict_type,
          competitors: idea.analysis?.competitor_analysis?.competitors,
          isDemo: user?.id === '00000000-0000-4000-8000-000000000001',
        },
      };

      const res = await fetch('/api/market-research', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      const responseText = await res.text();

      // Defensive check: if response is HTML or missing JSON content-type, reject with friendly error
      if (!contentType.includes('application/json') || responseText.trim().startsWith('<')) {
        console.error('Market research endpoint returned non-JSON payload:', responseText.slice(0, 300));
        throw new Error('Market research service returned an unexpected response. Please try again.');
      }

      let json: any;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Market research JSON parse error:', parseError, 'Raw response:', responseText.slice(0, 300));
        throw new Error('Market research service returned an unexpected response. Please try again.');
      }

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
            json.details ||
            'Market research is temporarily unavailable. Your existing VentureLens analysis is still available.'
        );
      }

      // Extract research data, accepting both json.data.research_data and json.research structures
      let receivedData: MarketResearchData;
      if (json.data?.research_data) {
        receivedData = json.data.research_data;
      } else if (json.research) {
        receivedData = {
          market_overview: typeof json.research.marketOverview === 'string'
            ? {
                summary: json.research.marketOverview,
                market_state: 'Expanding',
                key_developments: [],
                recent_statistics: [],
              }
            : json.research.marketOverview || {
                summary: 'Market research synthesized from industry datasets.',
                market_state: 'Expanding',
                key_developments: [],
                recent_statistics: [],
              },
          trends: json.research.marketTrends || json.research.trends || [],
          customer_demand: json.research.customerDemandSignals || json.research.customer_demand || [],
          competitors: json.research.competitorLandscape || json.research.competitors || [],
          competitive_gaps: json.research.competitiveGaps || json.research.competitive_gaps || [],
          opportunities: json.research.marketOpportunities || json.research.opportunities || [],
          threats: json.research.marketThreats || json.research.threats || [],
          recent_developments: json.research.recentDevelopments || json.research.recent_developments || [],
          sources: json.research.sources || [],
        };
      } else {
        throw new Error('Market research service returned an unexpected response. Please try again.');
      }

      const timestamp: string = json.data?.researched_at || new Date().toISOString();

      setResearchData(receivedData);
      setResearchedAt(timestamp);

      // Save to global context and local storage
      const record: MarketResearchRecord = {
        id: json.data?.id || 'mr-' + Date.now(),
        analysis_id: idea.analysis?.id || idea.id,
        user_id: user?.id || 'demo',
        research_data: receivedData,
        researched_at: timestamp,
        created_at: json.data?.created_at || timestamp,
        updated_at: json.data?.updated_at || timestamp,
      };

      saveMarketResearchForIdea(idea.id, record);
    } catch (err: any) {
      console.error('Market research error:', err);
      let message = err?.message || 'Market research is temporarily unavailable. Your existing VentureLens analysis is still available.';
      if (
        message.includes('Unexpected token') ||
        message.includes('is not valid JSON') ||
        message.includes('<!doctype') ||
        message.includes('JSON.parse')
      ) {
        message = 'Market research service returned an unexpected response. Please try again.';
      }
      setError(message);
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 border border-blue-200/60 dark:border-blue-800/50 p-6 sm:p-7 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            {researchData?.is_search_grounded === false ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>AI Knowledge Synthesis (Search Quota Exceeded)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Real-Time Google Search Grounding</span>
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {researchData?.is_search_grounded === false
                ? 'Market Intelligence (AI-Synthesized Fallback)'
                : 'Real-Time Market Research'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {researchData?.is_search_grounded === false
                ? `Synthesized market analysis based on Gemini model knowledge for "${idea.title}". Live web search grounding was unavailable due to quota constraints.`
                : `VentureLens queries live public web sources to identify current market trends, real competitors, observed customer demand signals, and recent sector developments relevant to "${idea.title}".`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {researchData && researchedAt && (
              <div className="text-right hidden lg:block">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Researched</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateTime(researchedAt)}
                </p>
              </div>
            )}

            <button
              id="run-market-research-btn"
              onClick={handleRunResearch}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-sm ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Researching Web...</span>
                </>
              ) : researchData ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Research</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Research Market</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Progress Bar & Status */}
        {isLoading && (
          <div className="mt-5 pt-4 border-t border-blue-200/50 dark:border-blue-800/40">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {loadingStep}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Executing Google Search queries</span>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                {error}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                Your core VentureLens scorecard and valuation metrics remain fully accessible.
              </p>
            </div>
          </div>
          <button
            onClick={handleRunResearch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty Initial State (If not yet researched) */}
      {!researchData && !isLoading && !error && (
        <div className="text-center py-16 px-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Globe className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            Ground Your Evaluation in Current Public Data
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-1.5 leading-relaxed">
            Click below to initiate web-grounded market research. VentureLens will search current public web sources, discover actual competing products and public pricing, and synthesize customer demand signals into this report.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-6 text-left">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Verified Web Sources</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Official sites, publications, and news</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Pricing & Positioning</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Identifies verified pricing and gaps</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">AI Advisor Grounding</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Empowers AI chatbot with live context</span>
            </div>
          </div>

          <button
            onClick={handleRunResearch}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Research Market Now</span>
          </button>
        </div>
      )}

      {/* Main Researched Results Content */}
      {researchData && (
        <div className="space-y-8">
          {/* Search Quota Fallback Notice if not live search grounded */}
          {researchData.is_search_grounded === false && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-amber-950 dark:text-amber-100">
                  Live Google Search Grounding Unavailable (Search Quota Limit Exceeded)
                </span>
                <p className="leading-relaxed">
                  Due to API rate/quota limitations on Google Search grounding, this analysis was synthesized using Gemini model knowledge. 
                  Claims, competitor pricing, and statistics are AI inferences rather than live-verified web crawls. Fabricated external URLs are strictly omitted.
                </p>
              </div>
            </div>
          )}

          {/* Quick Navigation Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Intelligence' },
              { id: 'competitors', label: `Competitors (${researchData.competitors?.length || 0})` },
              { id: 'trends', label: `Market Trends (${researchData.trends?.length || 0})` },
              { id: 'demand', label: `Demand Signals (${researchData.customer_demand?.length || 0})` },
              { id: 'developments', label: `Recent News (${researchData.recent_developments?.length || 0})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* SECTION A: Market Overview & Dynamics */}
          {(activeFilter === 'all' || activeFilter === 'trends') && (
            <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Current Market Overview
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Synthesis of active conditions and macroeconomic momentum
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  State: {researchData.market_overview?.market_state || 'Expanding'}
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                {researchData.market_overview?.summary}
              </div>

              {/* Recent Statistics Cards */}
              {researchData.market_overview?.recent_statistics &&
                researchData.market_overview.recent_statistics.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Recent Public Statistics
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {researchData.market_overview.recent_statistics.map((stat, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                        >
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{stat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* SECTION D: Researched Competitor Landscape */}
          {(activeFilter === 'all' || activeFilter === 'competitors') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Researched Competitor Landscape</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live market competitors, public pricing verification, and positioning
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {researchData.competitors?.length || 0} Products Identified
                </span>
              </div>

              {researchData.competitors?.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Information could not be verified from available public sources.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {researchData.competitors.map((comp, idx) => {
                    const isPricingVerified =
                      comp.pricing &&
                      !comp.pricing.toLowerCase().includes('not publicly verified') &&
                      !comp.pricing.toLowerCase().includes('unverified');

                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-base font-bold text-slate-900 dark:text-white">
                                  {comp.name}
                                </h5>
                                {comp.website && (
                                  <a
                                    href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    title="Open website"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                Target: {comp.target_audience}
                              </p>
                            </div>

                            {/* Verified Pricing Pill */}
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                isPricingVerified
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {comp.pricing || 'Pricing not publicly verified'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {comp.description}
                          </p>

                          {comp.positioning && (
                            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-900 dark:text-white">Positioning: </span>
                              {comp.positioning}
                            </div>
                          )}

                          {comp.features && comp.features.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                Known Features
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {comp.features.map((f, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {comp.observed_gaps && comp.observed_gaps.length > 0 && (
                            <div className="pt-1">
                              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                                Observed Market Gaps
                              </p>
                              <ul className="space-y-1">
                                {comp.observed_gaps.map((gap, gIdx) => (
                                  <li
                                    key={gIdx}
                                    className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                                  >
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Citations / Sources */}
                        {comp.sources && comp.sources.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-medium">Sources Cited:</span>
                            <div className="flex items-center gap-2">
                              {comp.sources.map((s, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  <span>{s.title || 'Source'}</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION B: Market Trends */}
          {(activeFilter === 'all' || activeFilter === 'trends') && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Current Market Trends (5-8 Research Signals)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Shifts in technology, regulations, consumer preferences, and business models
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {researchData.trends?.map((trend, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {trend.title}
                        </h5>
                        {trend.published_date && (
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {trend.published_date}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {trend.description}
                      </p>
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-300">
                        <span className="font-bold">Why it matters: </span>
                        {trend.why_it_matters}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate max-w-[200px] font-medium">{trend.source}</span>
                      {trend.source_url && (
                        <a
                          href={trend.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Evidence</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION C: Customer Demand Signals */}
          {(activeFilter === 'all' || activeFilter === 'demand') && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Customer Demand & Sentiment Signals</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Evidence-backed signals from search demand, review complaints, and community discussions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {researchData.customer_demand?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.signal}
                      </h5>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Signal #{idx + 1}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase">
                          Observed Evidence:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {item.evidence}
                        </p>
                      </div>

                      <div className="pt-1">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 block text-[11px] uppercase">
                          Interpretation (Inference):
                        </span>
                        <p className="text-xs text-indigo-900 dark:text-indigo-200 mt-0.5 leading-relaxed bg-indigo-50/60 dark:bg-indigo-950/40 p-2 rounded-lg">
                          {item.interpretation}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Source: {item.source}</span>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>Review Source</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION E: Competitive Gaps (Research-Based Opportunities) */}
          {researchData.competitive_gaps && researchData.competitive_gaps.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Competitive Gaps in Current Market</span>
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Unserved segments and feature voids identified from public competitor analyses
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {researchData.competitive_gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        {gap.gap_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                        Research-based opportunity
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {gap.opportunity}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Evidence: </span>
                      {gap.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION H: Recent Industry Developments (Past 12 Months) */}
          {(activeFilter === 'all' || activeFilter === 'developments') && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Recent Industry Developments (Past 12 Months)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Funding events, new regulations, major releases, and strategic shifts
                </p>
              </div>

              <div className="space-y-2.5">
                {researchData.recent_developments?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                          {item.date}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 text-xs">
                      <span className="text-slate-400 text-[11px]">{item.source}</span>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Article</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION I: Sources & Verification Citations */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{researchData.is_search_grounded === false ? 'Intelligence Grounding Status' : 'Verified Web Sources & Citations'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {researchData.is_search_grounded === false
                    ? 'Live Google Search was unavailable due to quota limits. Model knowledge was used without fabricated URLs.'
                    : 'Grounding citations extracted directly from Google Search results'}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {researchData.is_search_grounded === false
                  ? 'AI Synthesis Mode'
                  : `${researchData.sources?.length || 0} Grounded References`}
              </span>
            </div>

            {researchData.is_search_grounded !== false && researchData.search_queries_performed && researchData.search_queries_performed.length > 0 && (
              <div className="text-xs p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Google Search queries executed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {researchData.search_queries_performed.map((q, qIdx) => (
                    <span
                      key={qIdx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                    >
                      "{q}"
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!researchData.sources || researchData.sources.length === 0) ? (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                {researchData.is_search_grounded === false
                  ? 'No external web citations attached. Insights were synthesized from Gemini model knowledge (search quota exceeded). Fabricated URLs are strictly omitted.'
                  : 'No specific web sources were returned for these queries.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {researchData.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-start justify-between gap-2 group"
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {source.title || source.domain}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {source.domain}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-2">
              {researchData.is_search_grounded === false
                ? 'Search grounding unavailable due to API limits. AI-inferred metrics should be independently validated with primary sources.'
                : 'All market intelligence is grounded in public web sources using Google Search grounding. Inferences and strategic positioning are clearly categorized to avoid presenting conjecture as verified facts.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
