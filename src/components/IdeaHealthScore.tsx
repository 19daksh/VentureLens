import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  Wrench,
  ShieldCheck,
  Sliders,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowUpRight,
  FileText,
  BarChart3,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { StartupIdea, FullAnalysis } from '../types/analysis';
import {
  computeIdeaHealthScore,
  DEFAULT_HEALTH_WEIGHTS,
  HEALTH_WEIGHT_PRESETS,
  HealthWeights,
  IdeaHealthScoreResult,
} from '../utils/healthScore';

// Reference benchmark startup for empty-state preview
const BENCHMARK_SAMPLE_IDEA: StartupIdea = {
  id: 'benchmark-preview-sample',
  user_id: 'benchmark-user',
  title: 'FleetPulse AI - Battery Health & Telematics',
  description: 'AI-powered IoT and telemetry platform for electric delivery fleet managers to predict battery degradation, optimize depot charging, and reduce downtime.',
  industry: 'CleanTech & Logistics',
  target_audience: 'Mid-to-large commercial electric van and truck fleet operators with 50+ vehicles.',
  status: 'completed',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  analysis: {
    id: 'analysis-sample-ref',
    idea_id: 'benchmark-preview-sample',
    user_id: 'benchmark-user',
    overall_score: 87,
    verdict: 'High-conviction B2B venture with compelling commercial ROI and regulatory tailwinds.',
    verdict_type: 'Build',
    confidence_indicator: 'High Confidence (89% market data fit)',
    executive_summary: 'FleetPulse addresses an urgent operational bottleneck in commercial EV transition with strong unit economics ($120/vehicle/mo SaaS).',
    problem_score: 91,
    market_score: 88,
    competition_score: 79,
    revenue_score: 92,
    technical_score: 83,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    problem_validation: {
      problem_strength_score: 91,
      problem_severity: 'Critical',
      frequency: 'Daily',
      existing_alternatives: ['Generic telematics (Geotab, Samsara)', 'Manual spreadsheets'],
      customer_pain_points: ['Unplanned battery state-of-health drops causing missed delivery windows'],
      validation_insights: 'Commercial fleet managers report fleet downtime costs upwards of $1,200 per vehicle per day.',
    },
    market_analysis: {
      market_opportunity_score: 88,
      tam: '$18.4 Billion (Global Commercial Fleet Telematics)',
      sam: '$3.8 Billion (Electric Commercial Delivery Van Software)',
      som: '$210 Million (Tier-1 logistics corridors)',
      demand_score: 89,
      growth_potential: 'High Growth (34% CAGR through 2032)',
      market_trends: ['Corporate Net-Zero mandates accelerating Class 3-6 EV delivery adoption'],
      key_insights: 'The shift to electric fleet management shifts the variable cost from fuel pump pricing to battery health and grid demand charges.',
    },
    competitor_analysis: {
      competition_score: 79,
      competitive_landscape_summary: 'Incumbent telematics giants focus on GPS routing; specialized battery diagnostics lack cross-OEM APIs.',
      differentiation_strategy: 'FleetPulse sits as an agnostic layer on top of existing Geotab/Samsara hardware.',
      competitors: [],
    },
    business_model: {
      recommended_business_model: 'Per-vehicle Tiered SaaS',
      customer_segment: 'Commercial parcel, food delivery fleets',
      pricing_strategy: '$89 - $139 per vehicle / month billed annually',
      revenue_streams: ['Monthly recurring telematics SaaS subscription'],
      monetization_strategy: 'Land with a 10-vehicle free proof-of-concept demonstrating electricity cost reduction.',
      unit_economics_considerations: 'Target CAC of $4,200 with average contract value of $36,000/year. Projected LTV:CAC of 6.2:1.',
      revenue_potential_score: 92,
    },
    technical_feasibility: {
      technical_feasibility_score: 83,
      recommended_technology_direction: 'Python/FastAPI microservices for physics-informed machine learning battery models; TimescaleDB; React dashboard.',
      major_technical_requirements: ['J1939 and CAN-bus telemetry ingestion via standard OBD-II cellular dongles'],
      complexity: 'Medium-High',
      scalability_considerations: 'High data ingestion volume requiring timeseries partitioning.',
      technical_risks: ['Proprietary OEM CAN-bus encryption on newer vehicles'],
    },
    risks: [
      {
        category: 'Market',
        description: 'Slower than projected commercial EV delivery vehicle deliveries by major automotive OEMs.',
        severity: 'Medium',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Target existing early adopters (Amazon DSPs, FedEx contractors, DHL) and hybrid fleet operators.',
      },
      {
        category: 'Technical',
        description: 'OEMs locking down CAN-bus diagnostic ports with cybersecurity gateways.',
        severity: 'High',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Partner directly with Geotab Marketplace and certified OBD-II hardware providers with licensed API keys.',
      },
    ],
    mvp_roadmap: {
      phases: [
        {
          phase: 'Phase 1: Telematics Ingestion & Real-Time Battery Monitor',
          duration: '6 Weeks',
          features: ['OBD-II Dongle stream ingestion', 'Live battery State-of-Health dashboard'],
          goal: 'Deliver first live vehicle telemetry to 3 pilot customers',
          priority: 'Critical',
        },
      ],
      must_have_features: ['Live battery State-of-Health gauge', 'Depot charging alert rules'],
      nice_to_have_features: ['Driver eco-score ranking'],
      future_features: ['Direct utility grid V2G bidding'],
    },
    recommendations: [],
    go_to_market: {
      initial_target_customer: 'Regional commercial delivery fleet managers',
      acquisition_channels: ['Fleet management associations', 'Direct enterprise outreach'],
      launch_strategy: 'Target private fleet owners with 25-100 electric vans',
      positioning: 'Battery longevity and depot charging intelligence',
      early_validation_strategy: '30-day proof of concept measuring kWh energy savings',
    },
    final_verdict: {
      overall_score: 87,
      verdict: 'High-conviction B2B venture with compelling commercial ROI.',
      verdict_type: 'Build',
      confidence_indicator: 'High Confidence',
      strongest_aspects: ['High problem severity', 'Predictable SaaS unit economics'],
      weakest_aspects: ['Long enterprise sales cycle'],
      biggest_risk: 'Hardware telemetry compatibility across mixed OEM fleets',
      recommended_next_step: 'Finalize 2 pilot agreements with local last-mile courier fleets.',
    },
  },
};

interface IdeaHealthScoreProps {
  ideas: StartupIdea[];
  selectedIdeaId?: string;
  onSelectIdea?: (id: string) => void;
  className?: string;
}

export const IdeaHealthScore: React.FC<IdeaHealthScoreProps> = ({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  className = '',
}) => {
  const navigate = useNavigate();

  // Mode: 'single' (specific idea) or 'portfolio' (blended across all ideas)
  const [viewMode, setViewMode] = useState<'single' | 'portfolio'>('single');
  const [showDemoPreview, setShowDemoPreview] = useState<boolean>(false);

  // Selected idea internal state
  const [internalSelectedId, setInternalSelectedId] = useState<string>(() => {
    if (selectedIdeaId) return selectedIdeaId;
    const completed = ideas.find(i => i.analysis !== undefined);
    return completed?.id || ideas[0]?.id || '';
  });

  // Keep in sync with prop if controlled
  useEffect(() => {
    if (selectedIdeaId) {
      setInternalSelectedId(selectedIdeaId);
      setViewMode('single');
    }
  }, [selectedIdeaId]);

  const activeIdeaId = selectedIdeaId !== undefined ? selectedIdeaId : internalSelectedId;

  // Real ideas that have an analysis
  const analyzedIdeas = useMemo(() => {
    return ideas.filter(i => i.analysis !== undefined);
  }, [ideas]);

  // Determine which idea is being analyzed
  const activeIdea = useMemo(() => {
    if (ideas.length === 0 || showDemoPreview) {
      return BENCHMARK_SAMPLE_IDEA;
    }
    const found = ideas.find(i => i.id === activeIdeaId);
    if (found) return found;
    return analyzedIdeas[0] || ideas[0] || BENCHMARK_SAMPLE_IDEA;
  }, [ideas, activeIdeaId, showDemoPreview, analyzedIdeas]);

  // Health Weights state
  const [weights, setWeights] = useState<HealthWeights>(DEFAULT_HEALTH_WEIGHTS);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [showWeightSliders, setShowWeightSliders] = useState<boolean>(false);

  // Compute Idea Health Score for Single Idea
  const singleHealthResult: IdeaHealthScoreResult = useMemo(() => {
    return computeIdeaHealthScore(activeIdea, weights);
  }, [activeIdea, weights]);

  // Compute Portfolio Aggregate Health if in portfolio mode
  const portfolioHealthResult: IdeaHealthScoreResult = useMemo(() => {
    if (analyzedIdeas.length === 0) return singleHealthResult;

    // Blended scores
    const allResults = analyzedIdeas.map(idea => computeIdeaHealthScore(idea, weights));
    const avgScore = Math.round(
      allResults.reduce((acc, r) => acc + r.overallHealthScore, 0) / allResults.length
    );
    const avgMarket = Math.round(
      allResults.reduce((acc, r) => acc + r.marketPotential.score, 0) / allResults.length
    );
    const avgFeas = Math.round(
      allResults.reduce((acc, r) => acc + r.feasibility.score, 0) / allResults.length
    );
    const avgRisk = Math.round(
      allResults.reduce((acc, r) => acc + r.riskProfile.score, 0) / allResults.length
    );

    // Create synthetic blended analysis
    const blendedAnalysis: FullAnalysis = {
      ...(analyzedIdeas[0].analysis as FullAnalysis),
      overall_score: avgScore,
      market_score: avgMarket,
      technical_score: avgFeas,
    };

    const res = computeIdeaHealthScore(blendedAnalysis, weights);
    res.marketPotential.score = avgMarket;
    res.feasibility.score = avgFeas;
    res.riskProfile.score = avgRisk;
    res.overallHealthScore = avgScore;
    return res;
  }, [analyzedIdeas, weights, singleHealthResult]);

  // Current active result
  const healthResult = viewMode === 'portfolio' && analyzedIdeas.length > 1
    ? portfolioHealthResult
    : singleHealthResult;

  // SVG Gauge calculations
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthResult.overallHealthScore / 100) * circumference;

  const handleSelectPreset = (index: number) => {
    setActivePresetIndex(index);
    setWeights(HEALTH_WEIGHT_PRESETS[index].weights);
  };

  const handleSliderChange = (pillar: keyof HealthWeights, val: number) => {
    setActivePresetIndex(-1); // custom
    setWeights(prev => ({
      ...prev,
      [pillar]: val,
    }));
  };

  const handleResetWeights = () => {
    setActivePresetIndex(0);
    setWeights(DEFAULT_HEALTH_WEIGHTS);
  };

  const handleIdeaChange = (id: string) => {
    setShowDemoPreview(false);
    setViewMode('single');
    if (onSelectIdea) {
      onSelectIdea(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  const isDemo = ideas.length === 0 || showDemoPreview;

  return (
    <section
      id="idea-health-score-section"
      aria-label="Idea Health Score"
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs transition-colors ${className}`}
    >
      {/* Top Header: Title, Mode Toggles, Idea Picker, and Sensitivity Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
                Idea Health Score
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                0-100 Weighted Gauge
              </span>
              {isDemo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Benchmark Preview Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              Weighted composite evaluating <b className="text-slate-700 dark:text-slate-200">Market Potential ({weights.market}%)</b>, <b className="text-slate-700 dark:text-slate-200">Feasibility ({weights.feasibility}%)</b>, and <b className="text-slate-700 dark:text-slate-200">Risk Resilience ({weights.risk}%)</b>.
            </p>
          </div>
        </div>

        {/* Controls: Mode Switch, Idea Picker & Sensitivity Calibration */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Portfolio vs Single Mode switch if 2+ ideas */}
          {analyzedIdeas.length > 1 && !isDemo && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                id="btn-health-mode-single"
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'single'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Idea Focus
              </button>
              <button
                type="button"
                id="btn-health-mode-portfolio"
                onClick={() => setViewMode('portfolio')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'portfolio'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Portfolio Avg ({analyzedIdeas.length})</span>
              </button>
            </div>
          )}

          {/* Idea Dropdown (when in single idea mode) */}
          {viewMode === 'single' && ideas.length > 1 && !isDemo && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 hidden sm:inline">
                Idea:
              </span>
              <select
                id="select-idea-health-picker"
                value={activeIdea.id}
                onChange={e => handleIdeaChange(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-1.5 px-3 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer max-w-[210px] truncate"
              >
                {ideas.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.title} {i.analysis?.overall_score ? `(${i.analysis.overall_score} pts)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If 0 user ideas, provide toggle to switch between sample preview and call to action */}
          {ideas.length === 0 && (
            <button
              type="button"
              id="btn-toggle-demo-preview"
              onClick={() => setShowDemoPreview(!showDemoPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showDemoPreview ? 'Viewing Benchmark Demo' : 'Preview Live Demo'}</span>
            </button>
          )}

          {/* Sensitivity Weights Toggle */}
          <button
            type="button"
            id="btn-toggle-health-weights"
            onClick={() => setShowWeightSliders(!showWeightSliders)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showWeightSliders
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sensitivity Calibration</span>
            {activePresetIndex !== 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-indigo-400"></span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Sensitivity Weights Calibration Bar */}
      {showWeightSliders && (
        <div
          id="health-weights-calibration-panel"
          className="my-5 p-4.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 transition-all animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Weighted Health Scoring Sensitivity</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Adjust how Market Potential, Feasibility, and Risk are weighted to match investor thesis or founder profile.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {HEALTH_WEIGHT_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  id={`btn-health-preset-${idx}`}
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activePresetIndex === idx
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
              <button
                type="button"
                id="btn-health-reset-weights"
                onClick={handleResetWeights}
                title="Reset to default weights (40 / 35 / 25)"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Range Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Market Slider */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  Market Potential
                </span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{weights.market}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                value={weights.market}
                onChange={e => handleSliderChange('market', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1">
                TAM/SAM expansion, market trends & customer demand
              </p>
            </div>

            {/* Feasibility Slider */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" />
                  Technical Feasibility
                </span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{weights.feasibility}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                value={weights.feasibility}
                onChange={e => handleSliderChange('feasibility', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1">
                Architecture complexity, MVP scope & execution velocity
              </p>
            </div>

            {/* Risk Slider */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Risk & Downside Resilience
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{weights.risk}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                value={weights.risk}
                onChange={e => handleSliderChange('risk', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1">
                Downside hedging, mitigation coverage & critical failure avoidance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Radial Score Gauge Card & Right Pillar Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Column: Radial Score Gauge & Key Verdict (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {viewMode === 'portfolio' ? 'Aggregate Portfolio' : 'Evaluated Startup'}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[220px]">
                  {viewMode === 'portfolio' ? `Blended Viability (${analyzedIdeas.length} Ideas)` : activeIdea.title}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                {viewMode === 'portfolio' ? 'Cross-Industry' : activeIdea.industry}
              </span>
            </div>

            {/* Radial SVG Gauge */}
            <div className="relative flex flex-col items-center justify-center my-4 py-2">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-800"
                />
                {/* Colored Progress Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={healthResult.tier.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
                  {healthResult.overallHealthScore}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 -mt-1">
                  out of 100
                </span>
                <span
                  className={`mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs border ${healthResult.tier.badgeClass}`}
                >
                  {healthResult.tier.label}
                </span>
              </div>
            </div>

            {/* Verdict Explanation */}
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed text-center px-2 font-medium">
              {healthResult.tier.description}
            </p>
          </div>

          {/* Bottom Contribution Breakdown Bar */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs mb-2 font-bold">
              <span className="text-slate-800 dark:text-slate-100 font-bold">Point Distribution</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {healthResult.overallHealthScore} Total Health Pts
              </span>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-300/40 dark:border-slate-700/60">
              <div
                style={{ width: `${(healthResult.marketPotential.weightedContribution / (healthResult.overallHealthScore || 1)) * 100}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Market Potential: ${healthResult.marketPotential.weightedContribution} pts`}
              />
              <div
                style={{ width: `${(healthResult.feasibility.weightedContribution / (healthResult.overallHealthScore || 1)) * 100}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`Feasibility: ${healthResult.feasibility.weightedContribution} pts`}
              />
              <div
                style={{ width: `${(healthResult.riskProfile.weightedContribution / (healthResult.overallHealthScore || 1)) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Risk Resilience: ${healthResult.riskProfile.weightedContribution} pts`}
              />
            </div>

            {/* Legend with high contrast labels */}
            <div className="flex items-center justify-between text-[11px] mt-2.5 font-medium flex-wrap gap-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">Market</span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  (+{healthResult.marketPotential.weightedContribution})
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">Feas</span>
                <strong className="text-blue-600 dark:text-blue-400 font-extrabold">
                  (+{healthResult.feasibility.weightedContribution})
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">Risk</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  (+{healthResult.riskProfile.weightedContribution})
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 3 Pillar Metric Cards & Diagnostic Drivers (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Pillar 1: Market Potential */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Market Potential
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                      ({weights.market}% weight)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 leading-relaxed">
                    {healthResult.marketPotential.keyInsights[0]}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-['Space_Grotesk',sans-serif]">
                    {healthResult.marketPotential.score}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-300">/100</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  +{healthResult.marketPotential.weightedContribution} pts
                </span>
              </div>
            </div>

            {/* Sub-metrics Nested Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px]">
              {healthResult.marketPotential.subMetrics.map(sub => (
                <div key={sub.label} className="bg-slate-50 dark:bg-slate-800/95 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block truncate">
                    {sub.label}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate mt-0.5">
                    {sub.value}
                  </span>
                  {sub.detail && (
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 block truncate mt-0.5" title={sub.detail}>
                      {sub.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 2: Technical Feasibility */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700/60 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60 shadow-xs">
                  <Wrench className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Technical Feasibility
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                      ({weights.feasibility}% weight)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 leading-relaxed">
                    {healthResult.feasibility.keyInsights[0]}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 font-['Space_Grotesk',sans-serif]">
                    {healthResult.feasibility.score}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-300">/100</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-800/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  +{healthResult.feasibility.weightedContribution} pts
                </span>
              </div>
            </div>

            {/* Sub-metrics Nested Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px]">
              {healthResult.feasibility.subMetrics.map(sub => (
                <div key={sub.label} className="bg-slate-50 dark:bg-slate-800/95 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block truncate">
                    {sub.label}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate mt-0.5">
                    {sub.value}
                  </span>
                  {sub.detail && (
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 block truncate mt-0.5" title={sub.detail}>
                      {sub.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 3: Risk & Downside Resilience */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60 shadow-xs">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Risk & Downside Resilience
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                      ({weights.risk}% weight)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 leading-relaxed">
                    {healthResult.riskProfile.keyInsights[0]}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-['Space_Grotesk',sans-serif]">
                    {healthResult.riskProfile.score}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-300">/100</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-800/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  +{healthResult.riskProfile.weightedContribution} pts
                </span>
              </div>
            </div>

            {/* Sub-metrics Nested Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px]">
              {healthResult.riskProfile.subMetrics.map(sub => (
                <div key={sub.label} className="bg-slate-50 dark:bg-slate-800/95 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block truncate">
                    {sub.label}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate mt-0.5">
                    {sub.value}
                  </span>
                  {sub.detail && (
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 block truncate mt-0.5" title={sub.detail}>
                      {sub.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Catalysts & Vulnerabilities Footer */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positive Catalysts */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Key Health Catalysts</span>
          </p>
          <ul className="space-y-1.5">
            {healthResult.healthCatalysts.map((cat, i) => (
              <li key={i} className="text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-1.5 font-medium leading-relaxed">
                <span className="text-emerald-500 font-bold shrink-0">•</span>
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Vulnerabilities */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Primary De-Risking Opportunity</span>
          </p>
          {healthResult.vulnerabilities.length > 0 ? (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-950 dark:text-amber-100 truncate max-w-[240px]">
                  {healthResult.vulnerabilities[0].issue}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-md shrink-0">
                  +{healthResult.vulnerabilities[0].potentialScoreGain} pts potential
                </span>
              </div>
              <p className="text-amber-900 dark:text-amber-200 text-xs font-medium leading-relaxed">
                {healthResult.vulnerabilities[0].recommendedMitigation}
              </p>
            </div>
          ) : (
            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
              Maintain current validation sprint velocity.
            </p>
          )}
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px]">
          Weights auto-adjust to reflect your capital risk profile. Scores recalculated in real time.
        </span>

        <div className="flex items-center gap-3">
          {isDemo && (
            <Link
              to="/new-analysis"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-all hover:scale-105"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Validate Your Own Startup</span>
            </Link>
          )}

          {!isDemo && activeIdea.analysis && (
            <>
              <button
                type="button"
                id="btn-health-view-report"
                onClick={() => navigate(`/analysis/${activeIdea.id}/report`)}
                className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Investor Memo</span>
              </button>

              <button
                type="button"
                id="btn-health-view-deep-analysis"
                onClick={() => navigate(`/analysis/${activeIdea.id}`, { state: { from: '/dashboard' } })}
                className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold transition-all border border-indigo-200/60 dark:border-indigo-800"
              >
                <span>View Full Due Diligence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
