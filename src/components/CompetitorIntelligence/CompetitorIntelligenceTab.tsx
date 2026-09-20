import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Calendar,
  Layers,
  Crosshair,
  DollarSign,
  Target,
  FileText,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  Pin,
  Bell,
  Printer,
} from 'lucide-react';
import { StartupIdea } from '../../types/analysis';
import {
  CompetitorIntelligenceData,
  CompetitorIntelligenceRecord,
  CompetitorProfile,
} from '../../types/competitorIntelligence';
import { useAuth } from '../../context/AuthContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { localDb } from '../../lib/supabase';
import { CompetitorDirectory } from './CompetitorDirectory';
import { FeatureMatrixTable } from './FeatureMatrixTable';
import { PricingIntelligence } from './PricingIntelligence';
import { PositioningMap } from './PositioningMap';
import { CompetitiveGaps } from './CompetitiveGaps';
import { RecentDevelopments } from './RecentDevelopments';
import { AICompetitorInsightsCard } from './AICompetitorInsightsCard';

interface CompetitorIntelligenceTabProps {
  idea: StartupIdea;
}

export const CompetitorIntelligenceTab: React.FC<CompetitorIntelligenceTabProps> = ({ idea }) => {
  const { session, user } = useAuth();
  const { saveCompetitorIntelligenceForIdea } = useAnalysis();

  const [intelligenceData, setIntelligenceData] = useState<CompetitorIntelligenceData | null>(
    idea.competitor_intelligence?.research_data ||
      idea.competitor_intelligence?.intelligence_data ||
      idea.analysis?.competitor_intelligence?.research_data ||
      idea.analysis?.competitor_intelligence?.intelligence_data ||
      null
  );
  const [researchedAt, setResearchedAt] = useState<string | null>(
    idea.competitor_intelligence?.researched_at ||
      idea.analysis?.competitor_intelligence?.researched_at ||
      null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync state if idea prop updates or check local database
  useEffect(() => {
    const existing =
      idea.competitor_intelligence?.research_data ||
      idea.competitor_intelligence?.intelligence_data ||
      idea.analysis?.competitor_intelligence?.research_data ||
      idea.analysis?.competitor_intelligence?.intelligence_data;

    if (existing) {
      setIntelligenceData(existing);
      setResearchedAt(
        idea.competitor_intelligence?.researched_at ||
          idea.analysis?.competitor_intelligence?.researched_at ||
          null
      );
    } else {
      const analysisId = idea.analysis?.id || idea.id;
      if (analysisId) {
        const localSaved = localDb.getCompetitorIntelligenceByAnalysisId(analysisId);
        if (localSaved) {
          const data = localSaved.research_data || localSaved.intelligence_data;
          if (data) {
            setIntelligenceData(data);
            setResearchedAt(localSaved.researched_at || null);
          }
        }
      }
    }
  }, [idea]);

  // Sub-navigation within Competitor Intelligence
  const [activeSubTab, setActiveSubTab] = useState<
    'directory' | 'matrix' | 'pricing' | 'positioning' | 'gaps' | 'developments' | 'insights'
  >('directory');

  const handleRunCompetitorResearch = async () => {
    setIsLoading(true);
    setError(null);

    const steps = [
      'Scanning live web search for direct & indirect market competitors...',
      'Extracting public pricing tiers, free trial structures & commercial models...',
      'Benchmarking product capabilities across core and AI feature sets...',
      'Retrieving recent competitor news, product updates & funding over past 12 months...',
      'Synthesizing competitive white-space, positioning coordinates & strategic gaps...',
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setLoadingStep(steps[stepIdx]);
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
          existing_competitors: idea.analysis?.competitor_analysis?.competitors?.map((c) => c.name),
        },
        clientContext: {
          title: idea.title,
          industry: idea.industry,
          target_audience: idea.target_audience,
        },
      };

      const response = await fetch('/api/competitor-intelligence', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      // Guard against HTML or non-JSON returned by an unhandled route or proxy error
      if (!contentType.includes('application/json') || responseText.trim().startsWith('<')) {
        console.error('Competitor intelligence endpoint returned non-JSON response:', responseText.slice(0, 300));
        throw new Error('Competitor intelligence service returned an unexpected response. Please try again.');
      }

      let resData: any;
      try {
        resData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse competitor intelligence response:', parseError, responseText.slice(0, 300));
        throw new Error('Competitor intelligence service returned an unexpected response. Please try again.');
      }

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.details || `Server responded with code ${response.status}`);
      }

      const fetchedIntelligence: CompetitorIntelligenceData =
        resData.intelligence ||
        resData.data?.research_data ||
        resData.data?.intelligence_data ||
        resData.data;

      if (!fetchedIntelligence || (!fetchedIntelligence.competitors && !fetchedIntelligence.landscape_summary)) {
        throw new Error('No competitor intelligence data returned from analysis service.');
      }

      const record: CompetitorIntelligenceRecord = {
        id: resData.recordId || resData.data?.id || `ci-${Date.now()}`,
        analysis_id: idea.analysis?.id || idea.id,
        user_id: user?.id || '',
        research_data: fetchedIntelligence,
        intelligence_data: fetchedIntelligence,
        researched_at: resData.researched_at || resData.data?.researched_at || new Date().toISOString(),
        change_alerts: resData.change_alerts || resData.data?.change_alerts || [],
        pinned_competitors: resData.pinned_competitors || resData.data?.pinned_competitors || [],
      };

      setIntelligenceData(fetchedIntelligence);
      setResearchedAt(record.researched_at);
      saveCompetitorIntelligenceForIdea(idea.id, record);
    } catch (err: any) {
      console.error('Competitor intelligence fetch failed:', err);
      let errorMsg = err.message || 'Unable to complete competitor research. Please try again.';
      if (errorMsg.includes('<!doctype') || errorMsg.includes("Unexpected token '<'")) {
        errorMsg = 'Competitor intelligence service returned an unexpected response. Please try again.';
      }
      setError(errorMsg);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleTogglePin = async (competitorId: string, isPinned: boolean) => {
    if (!intelligenceData) return;

    // Update local state optimistically
    const currentProfiles = intelligenceData.competitors || intelligenceData.competitor_profiles || [];
    const updatedProfiles = currentProfiles.map((p) =>
      p.id === competitorId ? { ...p, is_pinned: isPinned } : p
    );
    const updatedData: CompetitorIntelligenceData = {
      ...intelligenceData,
      competitors: updatedProfiles,
      competitor_profiles: updatedProfiles,
    };
    setIntelligenceData(updatedData);

    const record: CompetitorIntelligenceRecord = {
      id: idea.competitor_intelligence?.id || `ci-${Date.now()}`,
      analysis_id: idea.analysis?.id || idea.id,
      user_id: user?.id || '',
      research_data: updatedData,
      intelligence_data: updatedData,
      researched_at: researchedAt || new Date().toISOString(),
      pinned_competitors: updatedProfiles.filter((p) => p.is_pinned).map((p) => p.id),
    };
    saveCompetitorIntelligenceForIdea(idea.id, record);

    // Call tracking endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (user?.id === '00000000-0000-4000-8000-000000000001') {
        headers['Authorization'] = 'Bearer demo-token';
      }

      await fetch('/api/competitor-intelligence/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          analysisId: idea.analysis?.id || idea.id,
          competitorId,
          isPinned,
        }),
      });
    } catch (e) {
      console.warn('Failed to update tracking in backend:', e);
    }
  };

  const subTabs = [
    { id: 'directory', label: '1. Competitor Directory', icon: Users, count: intelligenceData?.competitor_profiles?.length },
    { id: 'matrix', label: '2. Feature Matrix', icon: Layers, count: intelligenceData?.feature_matrix?.length },
    { id: 'pricing', label: '3. Pricing Intelligence', icon: DollarSign },
    { id: 'positioning', label: '4. Positioning Map', icon: Crosshair },
    { id: 'gaps', label: '5. Market Gaps & White Space', icon: Target, count: intelligenceData?.competitive_gaps?.length },
    { id: 'developments', label: '6. Recent Moves (12 Mo)', icon: Calendar, count: intelligenceData?.recent_developments?.length },
    { id: 'insights', label: '7. AI Strategic Insights', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🕵️</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {intelligenceData?.is_search_grounded === false
                ? 'AI Competitor Intelligence (Synthesis Fallback)'
                : 'Grounded Competitor Intelligence'}
            </h3>
            {intelligenceData?.is_search_grounded === false ? (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                AI Synthesis (Search Quota Exceeded)
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Live Google Search Grounded
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-world competitor tracking, tier-by-tier pricing signals, feature matrices, and 2D strategic positioning.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {researchedAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {new Date(researchedAt).toLocaleDateString()}</span>
            </div>
          )}

          <button
            id="run-competitor-intelligence-btn"
            onClick={handleRunCompetitorResearch}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isLoading
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{intelligenceData ? 'Refresh Competitor Intelligence' : 'Run Competitor Intelligence'}</span>
          </button>
        </div>
      </div>

      {/* Search Quota Fallback Notice if not live search grounded */}
      {intelligenceData?.is_search_grounded === false && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-950 dark:text-amber-100">
              Live Google Search Grounding Unavailable (Search Quota Limit Exceeded)
            </span>
            <p className="leading-relaxed">
              Competitor profiles, feature matrices, and positioning coordinates were synthesized using Gemini model knowledge because Google Search grounding quota was exhausted. All profiles are marked as <strong>AI inference</strong>. Pricing tiers and recent developments should be validated directly on competitor platforms.
            </p>
          </div>
        </div>
      )}

      {/* Information Quality Standard Taxonomy Banner */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>Information Verification Standards:</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Official (Primary website/docs)</span>
          </span>
          <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Source-Reported (Press / funding / reviews)</span>
          </span>
          <span className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Inference (Synthesized recommendations)</span>
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Founder Assumption (Pre-validation hypothesis)</span>
          </span>
        </div>
      </div>

      {/* Loading Progress State */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-center space-y-4 animate-in fade-in">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800 animate-ping opacity-25" />
            <div className="w-12 h-12 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-100">
              Gathering Real-Time Competitor Intelligence
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 font-medium">
              {loadingStep}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Google Search grounding evaluates company offerings, public pricing models, feature disclosures, and recent press announcements.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs flex items-start gap-3 text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Research execution error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State when no data is loaded yet */}
      {!isLoading && !intelligenceData && (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-xl">
            🕵️
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Competitor Intelligence Generated Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Launch real-time competitor research to map out direct & indirect alternatives, benchmark feature availability, uncover hidden pricing tiers, and pinpoint defensible market white-space.
            </p>
          </div>
          <button
            onClick={handleRunCompetitorResearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-98"
          >
            <Search className="w-4 h-4" />
            <span>Launch Web-Grounded Competitor Intelligence</span>
          </button>
        </div>
      )}

      {/* Main Data Presentation */}
      {!isLoading && intelligenceData && (
        <div className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SUB-VIEW 1: Competitor Directory */}
          {activeSubTab === 'directory' && (
            <CompetitorDirectory
              competitors={intelligenceData.competitor_profiles || []}
              onTogglePin={handleTogglePin}
            />
          )}

          {/* SUB-VIEW 2: Feature Matrix Table */}
          {activeSubTab === 'matrix' && (
            <FeatureMatrixTable
              rows={intelligenceData.feature_matrix || []}
              competitors={intelligenceData.competitor_profiles || []}
              startupTitle={idea.title}
            />
          )}

          {/* SUB-VIEW 3: Pricing Intelligence */}
          {activeSubTab === 'pricing' && (
            <PricingIntelligence
              competitors={intelligenceData.competitor_profiles || []}
              gaps={intelligenceData.competitive_gaps || []}
              startupPricingStrategy={idea.analysis?.business_model?.pricing_strategy}
            />
          )}

          {/* SUB-VIEW 4: Strategic Positioning Map */}
          {activeSubTab === 'positioning' && (
            <PositioningMap
              positioningMaps={intelligenceData.positioning_maps || {}}
              startupName={idea.title}
            />
          )}

          {/* SUB-VIEW 5: Competitive Gaps & Differentiation */}
          {activeSubTab === 'gaps' && (
            <CompetitiveGaps
              gaps={intelligenceData.competitive_gaps || []}
              differentiation={intelligenceData.differentiation_opportunities || []}
              startupComparison={intelligenceData.startup_comparison || []}
              startupTitle={idea.title}
            />
          )}

          {/* SUB-VIEW 6: Recent Competitor Moves */}
          {activeSubTab === 'developments' && (
            <RecentDevelopments
              developments={intelligenceData.recent_developments || []}
            />
          )}

          {/* SUB-VIEW 7: AI Strategic Insights */}
          {activeSubTab === 'insights' && (
            <AICompetitorInsightsCard
              insights={intelligenceData.ai_insights || {}}
              startupTitle={idea.title}
            />
          )}

          {/* Verified Web Grounding Citations Drawer / Section */}
          {intelligenceData.sources && intelligenceData.sources.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Verified Grounding Sources & Live Search References ({intelligenceData.sources.length})
                  </h4>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {intelligenceData.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors flex items-start gap-2 text-xs group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {src.title || src.domain}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {src.domain || src.url}
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
