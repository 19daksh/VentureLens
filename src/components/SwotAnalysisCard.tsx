import React, { useState } from 'react';
import {
  SwotAnalysisData,
  SwotItem,
  SwotQuadrant,
  TowsStrategy,
} from '../types/swot';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Layers,
  Grid,
  ListFilter,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpRight,
  Zap,
  Target,
  Download,
  Sliders,
  X,
} from 'lucide-react';

interface SwotAnalysisCardProps {
  data: SwotAnalysisData;
  isLoading?: boolean;
  onRegenerate?: (lens: 'balanced' | 'aggressive_growth' | 'bootstrapped' | 'defensive_moat') => void;
  onUpdate?: (updated: SwotAnalysisData) => void;
  standalone?: boolean;
}

export const SwotAnalysisCard: React.FC<SwotAnalysisCardProps> = ({
  data,
  isLoading = false,
  onRegenerate,
  onUpdate,
  standalone = false,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'list' | 'tows'>('matrix');
  const [activeFilter, setActiveFilter] = useState<SwotQuadrant | 'all' | 'tows'>('all');
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [selectedItemForModal, setSelectedItemForModal] = useState<SwotItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuadrant, setAddQuadrant] = useState<SwotQuadrant>('strengths');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Core Competency');
  const [newStrategy, setNewStrategy] = useState('');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [newImpact, setNewImpact] = useState(8);
  const [showLensDropdown, setShowLensDropdown] = useState(false);
  const [completedTowsSteps, setCompletedTowsSteps] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleTowsStep = (key: string) => {
    setCompletedTowsSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyMarkdown = () => {
    const md = [
      `# SWOT Analysis: ${data.title}`,
      `**Strategic Verdict**: ${data.strategic_verdict}`,
      `**SWOT Health Score**: ${data.swot_health_score}/100`,
      `**Primary Advantage**: ${data.primary_advantage}`,
      `**Primary Vulnerability**: ${data.primary_vulnerability}`,
      '',
      '## 🟢 Strengths (Internal)',
      ...data.strengths.map(
        (s) => `- **${s.title}** (${s.category} | Impact: ${s.impact_score}/10): ${s.description}\n  *Action*: ${s.actionable_strategy}`
      ),
      '',
      '## 🔴 Weaknesses (Internal)',
      ...data.weaknesses.map(
        (w) => `- **${w.title}** (${w.category} | Severity: ${w.impact_score}/10): ${w.description}\n  *Mitigation*: ${w.actionable_strategy}`
      ),
      '',
      '## 🔵 Opportunities (External)',
      ...data.opportunities.map(
        (o) => `- **${o.title}** (${o.category} | Potential: ${o.impact_score}/10): ${o.description}\n  *Playbook*: ${o.actionable_strategy}`
      ),
      '',
      '## 🟠 Threats (External)',
      ...data.threats.map(
        (t) => `- **${t.title}** (${t.category} | Threat Level: ${t.impact_score}/10): ${t.description}\n  *Defense*: ${t.actionable_strategy}`
      ),
      '',
      '## 🔄 TOWS Strategic Matrix',
      ...data.tows_strategies.map(
        (t) => `### [${t.type}] ${t.title}\n${t.description}\nTactical steps:\n${t.tactical_steps.map((step) => `  - [ ] ${step}`).join('\n')}`
      ),
    ].join('\n');

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: SwotItem = {
      id: `${addQuadrant.slice(0, 3)}-custom-${Date.now()}`,
      quadrant: addQuadrant,
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      category: newCategory.trim() || 'General',
      priority: newPriority,
      actionable_strategy: newStrategy.trim() || 'Execute tactical milestone to address this factor.',
      impact_score: newImpact,
    };

    const updated: SwotAnalysisData = {
      ...data,
      [addQuadrant]: [newItem, ...data[addQuadrant]],
    };

    if (onUpdate) {
      onUpdate(updated);
    }

    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewStrategy('');
  };

  // Color schemes for quadrants
  const quadrantConfig = {
    strengths: {
      label: 'Strengths',
      subtitle: 'Internal • Competitive Advantages',
      color: 'emerald',
      icon: ShieldCheck,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      itemBg: 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30',
      dot: 'bg-emerald-500',
      actionLabel: 'Leverage Strategy',
      actionBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    },
    weaknesses: {
      label: 'Weaknesses',
      subtitle: 'Internal • Vulnerabilities & Gaps',
      color: 'rose',
      icon: AlertTriangle,
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      border: 'border-rose-200 dark:border-rose-800/40',
      itemBg: 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/30',
      dot: 'bg-rose-500',
      actionLabel: 'Mitigation Plan',
      actionBg: 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    },
    opportunities: {
      label: 'Opportunities',
      subtitle: 'External • Market Tailwinds & Gaps',
      color: 'sky',
      icon: TrendingUp,
      badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
      border: 'border-sky-200 dark:border-sky-800/40',
      itemBg: 'bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50/80 dark:hover:bg-sky-950/30',
      dot: 'bg-sky-500',
      actionLabel: 'Capture Playbook',
      actionBg: 'bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    },
    threats: {
      label: 'Threats',
      subtitle: 'External • Hazards & Incumbent Risks',
      color: 'amber',
      icon: ShieldAlert,
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      border: 'border-amber-200 dark:border-amber-800/40',
      itemBg: 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/30',
      dot: 'bg-amber-500',
      actionLabel: 'Defense Contingency',
      actionBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800';
    if (score >= 65) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800';
  };

  const renderItemCard = (item: SwotItem, quadrantKey: SwotQuadrant) => {
    const config = quadrantConfig[quadrantKey];
    const isExpanded = !!expandedItemIds[item.id];

    return (
      <div
        key={item.id}
        className={`group p-3.5 rounded-xl border ${config.border} ${config.itemBg} transition-all duration-200 shadow-xs hover:shadow-sm`}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setSelectedItemForModal(item)}
          >
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {item.category}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.priority === 'Critical'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    : item.priority === 'High'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.priority}
              </span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 ml-auto">
                Rating {item.impact_score}/10
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {item.title}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => toggleExpand(item.id)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
            title={isExpanded ? 'Hide details' : 'Show details'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          {item.description}
        </p>

        {isExpanded && item.actionable_strategy && (
          <div className={`mt-2.5 p-2.5 rounded-lg border text-xs leading-relaxed ${config.actionBg}`}>
            <div className="flex items-center gap-1 font-bold text-[11px] mb-1">
              <Zap className="w-3 h-3 text-amber-500 inline-block" />
              <span>{config.actionLabel}:</span>
            </div>
            <div>{item.actionable_strategy}</div>
          </div>
        )}

        <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[10px]">
          <button
            type="button"
            onClick={() => toggleExpand(item.id)}
            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-0.5 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Tactical Playbook'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedItemForModal(item)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium flex items-center gap-0.5 transition-colors"
          >
            Inspect <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  };

  const towsConfig = {
    SO: { label: 'SO Strategies (Maxi-Maxi)', tag: 'Leverage Strengths → Seize Opportunities', bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' },
    ST: { label: 'ST Strategies (Maxi-Mini)', tag: 'Use Strengths → Neutralize Threats', bg: 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800' },
    WO: { label: 'WO Strategies (Mini-Maxi)', tag: 'Overcome Weaknesses → Exploit Opportunities', bg: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800' },
    WT: { label: 'WT Strategies (Mini-Mini)', tag: 'Minimize Weaknesses → Avoid Threats (Defense)', bg: 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' },
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all overflow-hidden ${standalone ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}`}>
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Gemini SWOT Engine
            </span>
            {data.lens && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                Lens: {data.lens.replace('_', ' ')}
              </span>
            )}
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Generated {new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Strategic SWOT Matrix & Action Playbook
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Internal operational capabilities cross-referenced with external market forces and defensibility tactics.
          </p>
        </div>

        {/* Health Score Pill & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${getScoreColor(data.swot_health_score)} shadow-xs`}>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Health Index</div>
              <div className="text-xs font-medium">
                {data.swot_health_score >= 75 ? 'Resilient' : data.swot_health_score >= 60 ? 'Viable' : 'Vulnerable'}
              </div>
            </div>
            <div className="text-2xl font-black font-['Space_Grotesk',sans-serif]">
              {data.swot_health_score}
              <span className="text-xs font-bold ml-0.5 text-current">/100</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1"
              title="Copy SWOT markdown to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLensDropdown(!showLensDropdown)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Re-Analyze</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {showLensDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Select Strategic Lens
                    </div>
                    {[
                      { id: 'balanced', label: 'Balanced VC Diligence' },
                      { id: 'aggressive_growth', label: 'Hypergrowth Blitzscaling' },
                      { id: 'bootstrapped', label: 'Bootstrapped Cashflow' },
                      { id: 'defensive_moat', label: 'Defensive Moat & IP' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setShowLensDropdown(false);
                          onRegenerate(opt.id as any);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors font-medium"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-xs font-bold flex items-center gap-1"
              title="Add custom SWOT factor"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Diagnosis Strip */}
      <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
        <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed mb-3">
          <span className="font-bold text-indigo-600 dark:text-indigo-400">Institutional Verdict: </span>
          {data.strategic_verdict}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                Primary Advantage
              </div>
              <div className="text-slate-700 dark:text-slate-200 mt-0.5 font-medium">{data.primary_advantage}</div>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-rose-50/80 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/50">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-800 dark:text-rose-300 text-[11px] uppercase tracking-wider">
                Key Vulnerability
              </div>
              <div className="text-slate-700 dark:text-slate-200 mt-0.5 font-medium">{data.primary_vulnerability}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls: View Mode & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* View mode toggle */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'matrix'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>2×2 Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Detailed List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tows')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'tows'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>TOWS Strategies</span>
            <span className="text-[10px] px-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold">
              {data.tows_strategies?.length || 4}
            </span>
          </button>
        </div>

        {/* Quadrant Quick Filter Pills (visible in matrix/list mode) */}
        {viewMode !== 'tows' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {(['all', 'strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((quad) => {
              const active = activeFilter === quad;
              const count = quad === 'all'
                ? data.strengths.length + data.weaknesses.length + data.opportunities.length + data.threats.length
                : data[quad].length;

              return (
                <button
                  key={quad}
                  type="button"
                  onClick={() => setActiveFilter(quad)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap capitalize transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {quad} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Top Left: STRENGTHS */}
          {(activeFilter === 'all' || activeFilter === 'strengths') && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${quadrantConfig.strengths.border} bg-white dark:bg-slate-900 flex flex-col`}>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Strengths
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Internal • Positive</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {data.strengths.length} Factors
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {data.strengths.map((item) => renderItemCard(item, 'strengths'))}
              </div>
            </div>
          )}

          {/* Top Right: WEAKNESSES */}
          {(activeFilter === 'all' || activeFilter === 'weaknesses') && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${quadrantConfig.weaknesses.border} bg-white dark:bg-slate-900 flex flex-col`}>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Weaknesses
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Internal • Negative</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {data.weaknesses.length} Factors
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {data.weaknesses.map((item) => renderItemCard(item, 'weaknesses'))}
              </div>
            </div>
          )}

          {/* Bottom Left: OPPORTUNITIES */}
          {(activeFilter === 'all' || activeFilter === 'opportunities') && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${quadrantConfig.opportunities.border} bg-white dark:bg-slate-900 flex flex-col`}>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Opportunities
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">External • Positive</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {data.opportunities.length} Factors
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {data.opportunities.map((item) => renderItemCard(item, 'opportunities'))}
              </div>
            </div>
          )}

          {/* Bottom Right: THREATS */}
          {(activeFilter === 'all' || activeFilter === 'threats') && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${quadrantConfig.threats.border} bg-white dark:bg-slate-900 flex flex-col`}>
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Threats
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">External • Negative</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {data.threats.length} Factors
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {data.threats.map((item) => renderItemCard(item, 'threats'))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List / Detailed Drilldown View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((quadKey) => {
            if (activeFilter !== 'all' && activeFilter !== quadKey) return null;
            const config = quadrantConfig[quadKey];
            const items = data[quadKey];

            return (
              <div key={quadKey} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${config.badgeBg}`}>
                      <config.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
                        {config.label}
                      </h4>
                      <p className="text-xs text-slate-500">{config.subtitle}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.badgeBg} border`}>
                    {items.length} Factors Identified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {items.map((item) => renderItemCard(item, quadKey))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOWS Strategic Matrix View */}
      {viewMode === 'tows' && (
        <div className="space-y-5">
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <span className="font-bold text-indigo-700 dark:text-indigo-400">TOWS Strategic Synthesis: </span>
            Cross-quadrant strategies that pair internal capabilities against external market forces to formulate immediate tactical plays.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.tows_strategies || []).map((tows, idx) => {
              const conf = towsConfig[tows.type] || towsConfig.SO;

              return (
                <div
                  key={tows.id || idx}
                  className={`p-5 rounded-2xl border ${conf.bg} flex flex-col justify-between shadow-xs`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {tows.type} Matrix Play
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        Strategic Objective
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-1">
                      {tows.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      {conf.tag}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {tows.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Tactical Milestones</span>
                    </div>

                    <div className="space-y-1.5">
                      {tows.tactical_steps.map((step, sIdx) => {
                        const stepKey = `${tows.id}-${sIdx}`;
                        const isDone = !!completedTowsSteps[stepKey];

                        return (
                          <div
                            key={sIdx}
                            onClick={() => toggleTowsStep(stepKey)}
                            className="flex items-start gap-2 p-2 rounded-lg bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer transition-colors text-xs"
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`flex-1 leading-snug ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {selectedItemForModal.quadrant} • {selectedItemForModal.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedItemForModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Detailed Context
                </div>
                <p className="leading-relaxed">{selectedItemForModal.description}</p>
              </div>

              {selectedItemForModal.actionable_strategy && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-1 font-bold text-xs mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Actionable Playbook & Next Steps:</span>
                  </div>
                  <p className="leading-relaxed text-xs">{selectedItemForModal.actionable_strategy}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-2 text-slate-500">
                <span>Priority: <strong className="text-slate-900 dark:text-white">{selectedItemForModal.priority}</strong></span>
                <span>Impact Index: <strong className="text-slate-900 dark:text-white">{selectedItemForModal.impact_score}/10</strong></span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Factor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" />
                <span>Add Custom Factor</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Quadrant
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAddQuadrant(q)}
                      className={`py-1.5 px-2 rounded-lg font-bold capitalize border text-center transition-all ${
                        addQuadrant === q
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Factor Headline / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Proprietary distribution partnership"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Detailed Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Why does this factor matter for this startup?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Actionable Strategy / Mitigation
                </label>
                <input
                  type="text"
                  placeholder="What is the next tactical move?"
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                >
                  Add Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
