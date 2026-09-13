import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Users,
  Layers,
  ShieldAlert,
  Rocket,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  DollarSign,
  Cpu,
  ArrowRight,
  HelpCircle,
  FileText,
  BarChart2,
  Award,
} from 'lucide-react';
import { ScoreBadge } from '../components/ScoreBadge';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'market' | 'competitors' | 'economics' | 'mvp'>('market');

  const categories = [
    {
      icon: Target,
      title: 'Problem & Demand Validation',
      desc: 'Verify whether the target audience actively searches for solutions and suffers enough friction to pay.',
      highlight: 'Problem severity & frequency matrix',
    },
    {
      icon: TrendingUp,
      title: 'TAM, SAM & SOM Market Sizing',
      desc: 'Institutional-grade addressable market estimation with explicit calculation assumptions.',
      highlight: 'Realistic growth CAGR benchmarks',
    },
    {
      icon: Users,
      title: 'Competitor Moat Analysis',
      desc: 'Uncover incumbent blindspots, pricing weaknesses, and defensible wedges.',
      highlight: 'Differentiation opportunity battlecards',
    },
    {
      icon: DollarSign,
      title: 'Business Model & Unit Economics',
      desc: 'Target pricing strategies, gross margin projections, and sustainable customer acquisition ratios.',
      highlight: 'LTV:CAC & payback period estimates',
    },
    {
      icon: Cpu,
      title: 'Technical Feasibility & Scalability',
      desc: 'Identify architectural complexity, infrastructure dependencies, and API lockdown bottlenecks.',
      highlight: 'Tech stack direction & failure modes',
    },
    {
      icon: ShieldAlert,
      title: 'Rigorous Risk Matrix',
      desc: 'Pre-mortem assessment categorizing market, regulatory, execution, and technological vulnerabilities.',
      highlight: 'Actionable mitigation strategies',
    },
    {
      icon: Rocket,
      title: 'Phased MVP Roadmap',
      desc: 'Strictly isolate must-have core features from nice-to-haves to ship within 6–8 weeks.',
      highlight: 'Phase-by-phase scope milestones',
    },
    {
      icon: FileText,
      title: 'Investor-Ready Executive Memo',
      desc: 'Generate structured reports formatted for angel syndicates, venture capitalists, and co-founders.',
      highlight: 'Exportable printable format',
    },
  ];

  const faqs = [
    {
      q: 'How does VentureLens AI validate ideas differently from standard chatbots?',
      a: 'Generic chatbots generate generic flattery. VentureLens AI executes institutional venture capital methodologies: breaking down TAM/SAM/SOM, interrogating customer willingness-to-pay, cataloging real competitor battlecards, modeling unit economics, and executing a pre-mortem risk assessment with actionable MVP scoping.',
    },
    {
      q: 'Is my proprietary startup idea kept private and secure?',
      a: 'Yes. All ideas and generated analyses are protected with strict database Row-Level Security (RLS). Only your authenticated account can read, edit, or view your venture data. Your inputs are never used to train public models.',
    },
    {
      q: 'Can I compare multiple startup ideas head-to-head?',
      a: 'Absolutely. VentureLens AI features a dedicated Multi-Idea Comparison tool where you can select 2 to 3 concepts and benchmark their problem severity, market opportunity, technical feasibility, and revenue potential on an overlay radar chart.',
    },
    {
      q: 'Can I export the analysis to share with investors or co-founders?',
      a: 'Yes. Every analysis comes with a dedicated Investor Memo View featuring executive summaries, radar score distributions, risk matrices, and one-click PDF print formatting.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI-Powered Venture Capital Due Diligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-['Space_Grotesk',sans-serif]">
            Validate your startup idea <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-100 to-violet-300">
              before you build it.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Stop burning months building products nobody buys. VentureLens AI stress-tests your concept across market demand, competitive moats, unit economics, technical feasibility, and MVP roadmap in under 60 seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/new-analysis"
              id="hero-btn-validate"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
            >
              <span>Validate My Idea</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/how-it-works"
              id="hero-btn-how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-7 py-3.5 rounded-xl font-semibold text-base transition-colors"
            >
              <span>See How It Works</span>
            </Link>
          </div>

          {/* Quick proof metrics */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">10-Point</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Evaluation Framework</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-300">&lt; 45 Sec</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Deep Gemini Analysis</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">TAM / SAM</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Transparent Sizing</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100% RLS</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Isolated User Storage</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE SAMPLE INSIGHT PREVIEW */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
              Live Analysis Sample
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
              Inspect a real validation report generated by VentureLens
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              See the depth, benchmarks, and actionable rigor delivered for every concept submitted.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
            {/* Header of sample card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    CleanTech & Logistics
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Commercial EV Fleet</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  FleetPulse - Predictive Fleet Battery Management
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Validation Verdict
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Strong Build Signal</span>
                </div>
                <ScoreBadge score={87} size="lg" />
              </div>
            </div>

            {/* Interactive sample tabs */}
            <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-700">
              {[
                { id: 'market', label: 'Market Sizing & Demand' },
                { id: 'competitors', label: 'Competitor Moat' },
                { id: 'economics', label: 'Unit Economics' },
                { id: 'mvp', label: 'MVP Roadmap' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="pt-6">
              {activeTab === 'market' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Addressable Market</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">$18.4 Billion</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Global commercial fleet telematics and depot charging market by 2030.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Serviceable Addressable</p>
                    <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">$3.8 Billion</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Class 3-6 commercial delivery van fleets in North America & Western Europe.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/90 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Early Obtainable (Year 1-3)</p>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">$210 Million</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Amazon DSP contractors and municipal express logistics depots.</p>
                  </div>
                </div>
              )}

              {activeTab === 'competitors' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Incumbent: Geotab & Samsara</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">Market Leader</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Strong telematics and ELD tracking, but shallow electrochemical battery health models and no dynamic depot charging grid arbitration.
                    </p>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                      Strategic Wedge: Build as an app extension inside the Samsara Marketplace rather than replacing their hardware.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'economics' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Recommended Model</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-1">$99 - $149 / vehicle / month</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">High-retention B2B SaaS with zero churn once wired to depot chargers.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">LTV : CAC Target</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">6.2 : 1 Ratio</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Payback period under 5 months based on direct downtime cost savings.</p>
                  </div>
                </div>
              )}

              {activeTab === 'mvp' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Phase 1 (Week 1–6): Telemetry Core & Battery Health Score</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ingest OBD-II CAN-bus packets and benchmark battery state-of-health variance on 20 pilot delivery vans.</p>
                    </div>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Phase 2 (Week 7–12): Automated Peak Tariff Avoidance</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Connect OpenADR protocol to schedule overnight depot charging away from 4 PM–9 PM utility surge rates.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
              Seamless Workflow
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
              How VentureLens AI validates your startup in 4 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <span className="text-3xl font-black text-indigo-100 dark:text-slate-800 absolute top-4 right-4">01</span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Input Concept</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Enter your startup title, target buyer, industry, core problem, and any known pilot details.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <span className="text-3xl font-black text-indigo-100 dark:text-slate-800 absolute top-4 right-4">02</span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gemini Server Analysis</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Our secure backend evaluates market size, competitor alternatives, unit economics, and architectural risks.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <span className="text-3xl font-black text-indigo-100 dark:text-slate-800 absolute top-4 right-4">03</span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Interactive Dashboard</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Review scores, radar distributions, competitive battlecards, and an actionable must-have MVP roadmap.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <span className="text-3xl font-black text-indigo-100 dark:text-slate-800 absolute top-4 right-4">04</span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Compare & Share</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Benchmark multiple ideas side-by-side or export an investor-ready executive report for partners and backers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KEY EVALUATION CATEGORIES */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
              Comprehensive Coverage
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
              Rigorous 360° Startup Evaluation
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Every analysis interrogates 8 mission-critical pillars before you spend time or money building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-xs group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{cat.desc}</p>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>{cat.highlight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PRICING PREVIEW */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
              Simple Transparent Pricing
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
              Invest in validation, not rework
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col transition-colors">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Explorer</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ forever</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Test your initial concepts with foundational validation.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>3 Startup Idea Validations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Overall Validation Score & Verdict</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Problem & Market Sizing</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="mt-8 block text-center py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Founder Pro (Featured) */}
            <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-7 rounded-2xl border border-indigo-500 shadow-xl flex flex-col relative scale-105">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                Most Popular
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Founder Pro</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-xs text-indigo-200">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">For active builders validating multiple ventures per year.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-200 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Unlimited Idea Validations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Deep Competitor Battlecards & Moat</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Multi-Idea Radar Comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Investor Report & PDF Exports</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="mt-8 block text-center py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white shadow-md transition-colors"
              >
                Start Free 7-Day Trial
              </Link>
            </div>

            {/* Studio */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col transition-colors">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Venture Studio</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$99</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">For incubators, accelerators, and startup studios.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Unlimited Team Workspaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Portfolio Sourcing Batch Runs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Direct Supabase Database Sync</span>
                </li>
              </ul>

              <Link
                to="/pricing"
                className="mt-8 block text-center py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
              Everything you need to know about VentureLens AI
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-20 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk',sans-serif]">
            Ready to test your concept with venture capital rigor?
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Get an objective breakdown of demand, competitors, market opportunity, and a phased MVP roadmap in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/new-analysis"
              id="cta-btn-start"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
            >
              <span>Validate My Startup Idea</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center text-slate-300 hover:text-white px-6 py-3.5 text-sm font-semibold"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
