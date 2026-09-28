import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Milestone,
  CheckCircle2,
  Circle,
  Calendar,
  Target,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Layers,
  Clock,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  DollarSign,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wrench,
  Users,
  Compass,
  Building,
  Flag,
} from 'lucide-react';
import { StartupIdea, FullAnalysis } from '../types/analysis';
import {
  GrowthRoadmapRecord,
  GrowthRoadmapData,
  ExecutionPace,
  TeamCapacity,
  MilestoneCategory,
  MonthlyMilestone,
  TacticalActionItem,
} from '../types/growthRoadmap';
import {
  fetchGrowthRoadmap,
  generateGrowthRoadmap,
  toggleActionProgress,
  formatRoadmapAsMarkdown,
  exportRoadmapToCsv,
} from '../services/growthRoadmapService';
import { useAuth } from '../context/AuthContext';

interface GrowthRoadmapSectionProps {
  idea: StartupIdea;
  analysis: FullAnalysis;
}

export const GrowthRoadmapSection: React.FC<GrowthRoadmapSectionProps> = ({
  idea,
  analysis,
}) => {
  const { session } = useAuth();
  const userToken = session?.access_token;

  const [record, setRecord] = useState<GrowthRoadmapRecord | null>(idea.growth_roadmap || null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!idea.growth_roadmap);
  const [error, setError] = useState<string | null>(null);

  // Strategy custom dials
  const [pace, setPace] = useState<ExecutionPace>('lean_bootstrapped');
  const [teamCapacity, setTeamCapacity] = useState<TeamCapacity>('small_team');
  const [showConfig, setShowConfig] = useState(false);

  // Filters and expanded states
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'all'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  // Export copy state
  const [copiedPlan, setCopiedPlan] = useState(false);

  // Load existing or auto-generate initial roadmap on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (idea.growth_roadmap) {
        setRecord(idea.growth_roadmap);
        setPace(idea.growth_roadmap.pace || 'lean_bootstrapped');
        setTeamCapacity(idea.growth_roadmap.team_capacity || 'small_team');
        setInitialLoading(false);
        return;
      }

      try {
        const existing = await fetchGrowthRoadmap(idea.id, userToken);
        if (existing && isMounted) {
          setRecord(existing);
          setPace(existing.pace || 'lean_bootstrapped');
          setTeamCapacity(existing.team_capacity || 'small_team');
        } else if (isMounted) {
          // Auto generate the tailored roadmap
          await handleGenerateRoadmap('lean_bootstrapped', 'small_team');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to initialize roadmap.');
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [idea.id]);

  const handleGenerateRoadmap = async (
    targetPace: ExecutionPace = pace,
    targetCapacity: TeamCapacity = teamCapacity
  ) => {
    setLoading(true);
    setError(null);

    try {
      const generated = await generateGrowthRoadmap({
        ideaId: idea.id,
        pace: targetPace,
        teamCapacity: targetCapacity,
        analysisContext: {
          idea,
          analysis,
        },
        userToken,
      });

      setRecord(generated);
      setPace(generated.pace);
      setTeamCapacity(generated.team_capacity);
      // Expand first 2 months by default
      setExpandedMonths({ 1: true, 2: true, 3: false, 4: false, 5: false, 6: false });
    } catch (err: any) {
      console.error('Growth roadmap generation failed:', err);
      setError(err.message || 'Unable to generate growth roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = async (actionId: string) => {
    if (!record) return;

    const currentCompleted = record.completed_action_ids || [];
    const isCompleted = currentCompleted.includes(actionId);

    const updatedCompleted = isCompleted
      ? currentCompleted.filter((id) => id !== actionId)
      : [...currentCompleted, actionId];

    // Optimistic local state update
    const updatedRecord: GrowthRoadmapRecord = {
      ...record,
      completed_action_ids: updatedCompleted,
    };
    setRecord(updatedRecord);

    try {
      await toggleActionProgress({
        ideaId: idea.id,
        completedActionIds: updatedCompleted,
        userToken,
      });
    } catch (err) {
      console.error('Failed to sync milestone progress:', err);
    }
  };

  const toggleMonthExpand = (month: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const handleCopyMarkdown = () => {
    if (!record?.roadmap_data) return;
    const text = formatRoadmapAsMarkdown(idea.title, record.roadmap_data);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 3000);
    });
  };

  const handleExportCsv = () => {
    if (!record?.roadmap_data) return;
    exportRoadmapToCsv(idea.title, record.roadmap_data);
  };

  if (initialLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Rocket className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Synthesizing Bespoke 6-Month Growth Roadmap...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Calibrating milestone velocity, customer acquisition wedges, and success gates against{' '}
          <strong className="text-slate-700 dark:text-slate-300">{idea.industry}</strong> venture dynamics.
        </p>
      </div>
    );
  }

  const roadmapData = record?.roadmap_data;
  const completedIds = record?.completed_action_ids || [];

  // Calculate stats
  let totalActions = 0;
  let completedActions = 0;
  roadmapData?.months?.forEach((m) => {
    m.actionItems?.forEach((item) => {
      totalActions++;
      if (completedIds.includes(item.id)) {
        completedActions++;
      }
    });
  });

  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Filter months
  const displayedMonths = (roadmapData?.months || []).filter((m) => {
    if (selectedMonth !== 'all' && m.month !== selectedMonth) return false;
    return true;
  });

  return (
    <div
      id="growth-roadmap"
      style={{ scrollMarginTop: '130px' }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors mb-8"
    >
      {/* Section Header */}
      <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Rocket className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Automated Execution Architecture
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                6-MONTH HORIZON
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
              Prioritized Growth & Milestone Roadmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Chronologically prioritized, stage-gated milestones mapped directly to your validation signals,
              pre-mortem risks, and market wedge.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              id="roadmap-toggle-config-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showConfig
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Strategy Dial</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              id="roadmap-copy-summary-btn"
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {copiedPlan ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Plan</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCsv}
              id="roadmap-export-csv-btn"
              title="Export tasks to CSV for Linear, Notion, or Jira"
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Strategy Customization Dial Drawer */}
        {showConfig && (
          <div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Adjust Execution Parameters & Re-Calibrate Roadmap</span>
              </span>
              <span className="text-[11px] text-slate-500">Regenerates with Gemini 3.8</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pace Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Execution Pace & Capital Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lean_bootstrapped', label: 'Lean / Bootstrapped', desc: 'Low burn, organic wedge' },
                    { id: 'venture_scale', label: 'Venture Scale', desc: 'Hypergrowth, seed KPIs' },
                    { id: 'enterprise_b2b', label: 'B2B / Enterprise', desc: 'High ACV, design partners' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPace(p.id as ExecutionPace)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        pace === p.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <p className="font-bold">{p.label}</p>
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Capacity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team Composition & Bandwidth
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solo_founder', label: 'Solo Founder', desc: 'Single-threaded focus' },
                    { id: 'small_team', label: 'Co-Founders (2-3)', desc: 'Balanced engineering & GTM' },
                    { id: 'funded_team', label: 'Funded Team (4-6)', desc: 'Parallel development' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTeamCapacity(c.id as TeamCapacity)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        teamCapacity === c.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <p className="font-bold">{c.label}</p>
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleGenerateRoadmap(pace, teamCapacity)}
                disabled={loading}
                id="roadmap-recalibrate-btn"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-75"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Re-Generating Milestones...' : 'Apply & Regenerate Roadmap'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="m-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Roadmap Overview & North Star Card */}
      {roadmapData && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* North Star Metric Card */}
            <div className="lg:col-span-2 p-5 bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-800/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" />
                    <span>6-Month North Star Target</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Mode: <strong className="text-slate-800 dark:text-slate-200 capitalize">{pace.replace('_', ' ')}</strong>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {roadmapData.northStarMetric.name}
                </h3>
                <div className="my-2 inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-2xs">
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-semibold">Month 6 Target:</span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {roadmapData.northStarMetric.sixMonthTarget}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {roadmapData.northStarMetric.definition}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-950 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">Primary Growth Loop: </span>
                <span>{roadmapData.executivePlaybook.primaryGrowthLoop}</span>
              </div>
            </div>

            {/* Live Progress Tracker */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Milestone Completion
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-linear-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white font-bold">{completedActions}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">{totalActions}</strong> critical deliverables completed.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Burn Guideline: </span>
                <strong className="text-slate-700 dark:text-slate-300">
                  {roadmapData.executivePlaybook.capitalEfficiencyGuideline}
                </strong>
              </div>
            </div>
          </div>

          {/* Month Filtering Navigation Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 mr-1 hidden sm:inline">Filter Month:</span>
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMonth === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All 6 Months
              </button>
              {[1, 2, 3, 4, 5, 6].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedMonth === m
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Month {m}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 dark:text-slate-300 text-[11px] font-semibold mr-1">Discipline:</span>
              {(['all', 'validation', 'product', 'growth', 'monetization'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize cursor-pointer transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 6 Monthly Milestone Timeline */}
          <div className="space-y-6">
            {displayedMonths.map((milestone) => {
              const isExpanded = expandedMonths[milestone.month] ?? false;
              const filteredActionItems = milestone.actionItems?.filter((item) => {
                if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
                return true;
              }) || [];

              const monthCompleted = milestone.actionItems?.filter((i) => completedIds.includes(i.id)).length || 0;
              const monthTotal = milestone.actionItems?.length || 0;

              return (
                <div
                  key={milestone.month}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  {/* Month Accordion Header */}
                  <div
                    onClick={() => toggleMonthExpand(milestone.month)}
                    className="p-5 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                        M{milestone.month}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                            {milestone.phaseTitle}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              milestone.priority === 'critical'
                                ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                                : milestone.priority === 'high'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                            }`}
                          >
                            {milestone.priority} Priority
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                          {milestone.theme}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {monthCompleted}/{monthTotal} done
                      </span>
                      <button
                        type="button"
                        aria-label="Toggle month details"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Month Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {/* Success Gate Banner */}
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-2.5">
                        <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase text-[10px] tracking-wider">
                            Go / No-Go Success Gate (Requirement to Advance)
                          </span>
                          <p className="text-emerald-900 dark:text-emerald-200 mt-0.5 leading-relaxed font-medium">
                            {milestone.successGate}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Objectives */}
                        <div>
                          <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                            <Milestone className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Core Stage Objectives</span>
                          </h5>
                          <ul className="space-y-2">
                            {milestone.keyObjectives?.map((obj, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Primary KPIs */}
                        <div>
                          <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Stage KPIs & Target Thresholds</span>
                          </h5>
                          <div className="space-y-2">
                            {milestone.primaryKpis?.map((kpi, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{kpi.metric}</span>
                                  <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                                    {kpi.target}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{kpi.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tactical Action Items Checklist */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Tactical Action Items & Deliverables</span>
                          </h5>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400">Click checkboxes to track execution</span>
                        </div>

                        <div className="space-y-2">
                          {filteredActionItems.map((action) => {
                            const isDone = completedIds.includes(action.id);
                            return (
                              <div
                                key={action.id}
                                onClick={() => handleToggleAction(action.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                  isDone
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80'
                                    : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>

                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <span
                                      className={`font-bold ${
                                        isDone
                                          ? 'line-through text-slate-500 dark:text-slate-400'
                                          : 'text-slate-900 dark:text-white'
                                      }`}
                                    >
                                      {action.title}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {action.category}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        ~{action.estimatedDays}d
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                    {action.description}
                                  </p>

                                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-300">
                                      <strong>Deliverable:</strong> {action.deliverable}
                                    </span>
                                    {action.recommendedTools && action.recommendedTools.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Wrench className="w-3 h-3 text-slate-400" />
                                        {action.recommendedTools.map((t, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Potential Pitfalls & Stack Footer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <div>
                          <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Stage Pitfalls to Avoid:
                          </span>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                            {milestone.potentialPitfalls?.map((p, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span>•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                            Recommended Tech Stack & SaaS:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {milestone.suggestedStack?.map((tool, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
                              >
                                {tool}
                              </span>
                            ))}
                            {milestone.estimatedBudgetUsd && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                                Est. Burn: {milestone.estimatedBudgetUsd}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Early Warning Pivot Triggers */}
          {roadmapData.suggestedPivotsOrTriggers && roadmapData.suggestedPivotsOrTriggers.length > 0 && (
            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Early Warning Pivot Triggers (Contingency Playbook)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roadmapData.suggestedPivotsOrTriggers.map((pivot, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block mb-1">
                        If Signal Trigger Occurs:
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-2">
                        &ldquo;{pivot.condition}&rdquo;
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <strong className="text-indigo-600 dark:text-indigo-400">Tactical Pivot: </strong>
                      <span>{pivot.recommendedPivot}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
