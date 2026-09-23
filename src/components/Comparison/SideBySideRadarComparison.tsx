import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { StartupIdea, RiskItem } from '../../types/analysis';
import { useTheme } from '../../context/ThemeContext';
import { ScoreBadge } from '../ScoreBadge';
import {
  TrendingUp,
  ShieldAlert,
  Cpu,
  Target,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface SideBySideRadarComparisonProps {
  ideaA: StartupIdea;
  ideaB: StartupIdea;
}

// Computes a normalized 0-100 Risk Resilience score (higher = safer / better mitigated)
export function calculateRiskResilienceScore(risks?: RiskItem[]): {
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  label: string;
} {
  if (!risks || risks.length === 0) {
    return {
      score: 75,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      label: 'Standard Risk Profile',
    };
  }

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalPenalty = 0;

  risks.forEach((r) => {
    const sev = String(r.severity || '').toLowerCase();
    const prob = String(r.probability || '').toLowerCase();
    let sevWeight = 10;
    if (sev === 'critical') {
      sevWeight = 24;
      criticalCount++;
    } else if (sev === 'high') {
      sevWeight = 16;
      highCount++;
    } else if (sev === 'medium') {
      sevWeight = 9;
      mediumCount++;
    } else {
      sevWeight = 4;
      lowCount++;
    }

    let probMult = 1.0;
    if (prob === 'high') probMult = 1.1;
    else if (prob === 'medium') probMult = 0.85;
    else if (prob === 'low') probMult = 0.6;

    totalPenalty += sevWeight * probMult;
  });

  // Calculate resilience: base 100 minus risk penalties, bounded between 15 and 95
  const resilience = Math.max(15, Math.min(95, Math.round(100 - totalPenalty)));
  let label = 'Moderate Risk';
  if (resilience >= 80) label = 'Low Risk / High Defensibility';
  else if (resilience >= 65) label = 'Managed Risk Profile';
  else if (resilience < 50) label = 'Elevated Pre-Mortem Risk';

  return {
    score: resilience,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    label,
  };
}

export const SideBySideRadarComparison: React.FC<SideBySideRadarComparisonProps> = ({
  ideaA,
  ideaB,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [radarFocus, setRadarFocus] = useState<'triad' | 'full'>('triad');
  const [showDualRadars, setShowDualRadars] = useState<boolean>(true);

  // Compute metrics for Idea A
  const anaA = ideaA.analysis;
  const riskStatsA = useMemo(() => calculateRiskResilienceScore(anaA?.risks), [anaA?.risks]);
  const marketScoreA = anaA?.market_score ?? 50;
  const techScoreA = anaA?.technical_score ?? 50;
  const problemScoreA = anaA?.problem_score ?? 50;
  const revenueScoreA = anaA?.revenue_score ?? 50;
  const moatScoreA = anaA?.competition_score ?? 50;

  // Compute metrics for Idea B
  const anaB = ideaB.analysis;
  const riskStatsB = useMemo(() => calculateRiskResilienceScore(anaB?.risks), [anaB?.risks]);
  const marketScoreB = anaB?.market_score ?? 50;
  const techScoreB = anaB?.technical_score ?? 50;
  const problemScoreB = anaB?.problem_score ?? 50;
  const revenueScoreB = anaB?.revenue_score ?? 50;
  const moatScoreB = anaB?.competition_score ?? 50;

  // Triad subjects (Market, Risk, Feasibility) as explicitly requested
  const triadSubjects = [
    { key: 'market', label: 'Market Opportunity', scoreA: marketScoreA, scoreB: marketScoreB, icon: TrendingUp },
    { key: 'risk', label: 'Risk Resilience', scoreA: riskStatsA.score, scoreB: riskStatsB.score, icon: ShieldAlert },
    { key: 'feasibility', label: 'Technical Feasibility', scoreA: techScoreA, scoreB: techScoreB, icon: Cpu },
  ];

  // Full 6-dimensional diligence subjects
  const fullSubjects = [
    { key: 'market', label: 'Market Opportunity', scoreA: marketScoreA, scoreB: marketScoreB, icon: TrendingUp },
    { key: 'risk', label: 'Risk Resilience', scoreA: riskStatsA.score, scoreB: riskStatsB.score, icon: ShieldAlert },
    { key: 'feasibility', label: 'Technical Feasibility', scoreA: techScoreA, scoreB: techScoreB, icon: Cpu },
    { key: 'problem', label: 'Problem Severity', scoreA: problemScoreA, scoreB: problemScoreB, icon: Target },
    { key: 'revenue', label: 'Unit Economics', scoreA: revenueScoreA, scoreB: revenueScoreB, icon: DollarSign },
    { key: 'moat', label: 'Moat Defensibility', scoreA: moatScoreA, scoreB: moatScoreB, icon: Layers },
  ];

  const activeSubjects = radarFocus === 'triad' ? triadSubjects : fullSubjects;

  // Dataset for Recharts radar
  const chartData = activeSubjects.map((sub) => ({
    subject: sub.label,
    ideaA: sub.scoreA,
    ideaB: sub.scoreB,
    fullMark: 100,
  }));

  const chartDataA = activeSubjects.map((sub) => ({
    subject: sub.label,
    score: sub.scoreA,
    fullMark: 100,
  }));

  const chartDataB = activeSubjects.map((sub) => ({
    subject: sub.label,
    score: sub.scoreB,
    fullMark: 100,
  }));

  // Color pallete
  const colorA = { stroke: '#4f46e5', fill: '#6366f1' }; // Indigo
  const colorB = { stroke: '#059669', fill: '#10b981' }; // Emerald

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Radar Chart Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Side-by-Side Radar Visualization</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {radarFocus === 'triad' ? 'Core Triad' : '6-Axis Diligence'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Benchmarking Market Score, Risk Resilience, and Technical Feasibility across both concepts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Triad vs Full Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              id="compare-radar-focus-triad-btn"
              onClick={() => setRadarFocus('triad')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                radarFocus === 'triad'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Core Triad (Market, Risk, Feasibility)
            </button>
            <button
              id="compare-radar-focus-full-btn"
              onClick={() => setRadarFocus('full')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                radarFocus === 'full'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Full 6-Axis Matrix
            </button>
          </div>

          {/* Dual vs Single Chart Toggle */}
          <button
            id="compare-radar-layout-toggle-btn"
            onClick={() => setShowDualRadars(!showDualRadars)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs flex items-center gap-1.5 transition-colors"
            title={showDualRadars ? 'Show Single Overlay Radar' : 'Show Dual Side-by-Side Radars'}
          >
            {showDualRadars ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showDualRadars ? 'Overlay View' : 'Side-by-Side View'}</span>
          </button>
        </div>
      </div>

      {/* Radar Charts Section */}
      {showDualRadars ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart: Concept A */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xs transition-colors relative">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Concept A (Primary)
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[280px]">
                  {ideaA.title}
                </h4>
              </div>
              {anaA?.overall_score !== undefined && (
                <div className="text-right">
                  <ScoreBadge score={anaA.overall_score} size="md" />
                  <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Overall</span>
                </div>
              )}
            </div>

            <div className="w-full h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartDataA}>
                  <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    stroke={isDark ? '#475569' : '#cbd5e1'}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} / 100`, ideaA.title]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: isDark ? '1px solid #334155' : 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Radar
                    name={ideaA.title}
                    dataKey="score"
                    stroke={colorA.stroke}
                    fill={colorA.fill}
                    fillOpacity={0.4}
                    strokeWidth={2.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Market</span>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{marketScoreA}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Risk Safety</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{riskStatsA.score}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Feasibility</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{techScoreA}/100</span>
              </div>
            </div>
          </div>

          {/* Radar Chart: Concept B */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 shadow-xs transition-colors relative">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Concept B (Benchmark)
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[280px]">
                  {ideaB.title}
                </h4>
              </div>
              {anaB?.overall_score !== undefined && (
                <div className="text-right">
                  <ScoreBadge score={anaB.overall_score} size="md" />
                  <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Overall</span>
                </div>
              )}
            </div>

            <div className="w-full h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartDataB}>
                  <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    stroke={isDark ? '#475569' : '#cbd5e1'}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} / 100`, ideaB.title]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: isDark ? '1px solid #334155' : 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Radar
                    name={ideaB.title}
                    dataKey="score"
                    stroke={colorB.stroke}
                    fill={colorB.fill}
                    fillOpacity={0.4}
                    strokeWidth={2.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Market</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{marketScoreB}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Risk Safety</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{riskStatsB.score}/100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Feasibility</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{techScoreB}/100</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Consolidated Overlay Radar Chart */
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Superimposed Head-to-Head Radar Overlay
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Direct polygonal footprint comparison between {ideaA.title} and {ideaB.title}.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 inline-block" />
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{ideaA.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{ideaB.title}</span>
              </div>
            </div>
          </div>

          <div className="w-full h-[400px] flex items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
                <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  stroke={isDark ? '#475569' : '#cbd5e1'}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${val} / 100`,
                    name === 'ideaA' ? ideaA.title : ideaB.title,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #334155' : 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(val: string) => (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {val === 'ideaA' ? `${ideaA.title} (Concept A)` : `${ideaB.title} (Concept B)`}
                    </span>
                  )}
                />
                <Radar
                  name="ideaA"
                  dataKey="ideaA"
                  stroke={colorA.stroke}
                  fill={colorA.fill}
                  fillOpacity={0.3}
                  strokeWidth={2.5}
                />
                <Radar
                  name="ideaB"
                  dataKey="ideaB"
                  stroke={colorB.stroke}
                  fill={colorB.fill}
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Head-to-Head Key Metrics Comparison (Market, Risk, Feasibility) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PILLAR 1: Market Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. Market Opportunity
              </h5>
            </div>
            {marketScoreA !== marketScoreB && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  marketScoreA > marketScoreB
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {marketScoreA > marketScoreB
                  ? `Concept A +${marketScoreA - marketScoreB} pts`
                  : `Concept B +${marketScoreB - marketScoreA} pts`}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {/* Concept A Score */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {ideaA.title}
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{marketScoreA}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${marketScoreA}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                TAM: <strong className="text-slate-700 dark:text-slate-300">{anaA?.market_analysis?.tam || 'N/A'}</strong>
              </div>
            </div>

            {/* Concept B Score */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {ideaB.title}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{marketScoreB}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${marketScoreB}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                TAM: <strong className="text-slate-700 dark:text-slate-300">{anaB?.market_analysis?.tam || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* PILLAR 2: Risk Profile */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. Risk Resilience
              </h5>
            </div>
            {riskStatsA.score !== riskStatsB.score && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  riskStatsA.score > riskStatsB.score
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {riskStatsA.score > riskStatsB.score
                  ? `Concept A +${riskStatsA.score - riskStatsB.score} pts`
                  : `Concept B +${riskStatsB.score - riskStatsA.score} pts`}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {/* Concept A Risk */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {ideaA.title}
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {riskStatsA.score}/100 ({riskStatsA.criticalCount} Crit, {riskStatsA.highCount} High)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${riskStatsA.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Top risk: {anaA?.final_verdict?.biggest_risk || anaA?.risks?.[0]?.description || 'Operational scaling'}
              </p>
            </div>

            {/* Concept B Risk */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {ideaB.title}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {riskStatsB.score}/100 ({riskStatsB.criticalCount} Crit, {riskStatsB.highCount} High)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${riskStatsB.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Top risk: {anaB?.final_verdict?.biggest_risk || anaB?.risks?.[0]?.description || 'Market entry barrier'}
              </p>
            </div>
          </div>
        </div>

        {/* PILLAR 3: Technical Feasibility */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Tech Feasibility
              </h5>
            </div>
            {techScoreA !== techScoreB && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  techScoreA > techScoreB
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {techScoreA > techScoreB
                  ? `Concept A +${techScoreA - techScoreB} pts`
                  : `Concept B +${techScoreB - techScoreA} pts`}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {/* Concept A Feasibility */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {ideaA.title}
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {techScoreA}/100 ({anaA?.technical_feasibility?.complexity || 'Moderate'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${techScoreA}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Stack: {anaA?.technical_feasibility?.recommended_technology_direction || 'Modern Cloud Stack'}
              </p>
            </div>

            {/* Concept B Feasibility */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {ideaB.title}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {techScoreB}/100 ({anaB?.technical_feasibility?.complexity || 'Moderate'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${techScoreB}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Stack: {anaB?.technical_feasibility?.recommended_technology_direction || 'Modern Cloud Stack'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
