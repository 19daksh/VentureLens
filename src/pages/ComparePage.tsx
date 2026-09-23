import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { StartupIdea } from '../types/analysis';
import { ScoreBadge } from '../components/ScoreBadge';
import { SideBySideRadarComparison } from '../components/Comparison/SideBySideRadarComparison';
import { ComparisonRadarChart } from '../components/ComparisonRadarChart';
import { BackButton } from '../components/BackButton';
import {
  GitCompare,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRightLeft,
  Share2,
  Copy,
  ExternalLink,
  Search,
  Loader2,
  Sparkles,
  Layers,
  TrendingUp,
  ShieldAlert,
  Cpu,
  FileText,
  DollarSign,
  Target,
  Check,
} from 'lucide-react';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ideas, loading: ideasLoading, fetchIdeaOrAnalysisById } = useAnalysis();

  // Active view: 'side-by-side' (primary 2-idea comparison) or 'matrix' (3-idea table)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'matrix'>('side-by-side');

  // Selected ideas for Slot 1 and Slot 2
  const [slotIdeaA, setSlotIdeaA] = useState<StartupIdea | null>(null);
  const [slotIdeaB, setSlotIdeaB] = useState<StartupIdea | null>(null);

  // Fetching state for Slot 1 and Slot 2
  const [inputSlotA, setInputSlotA] = useState<string>('');
  const [inputSlotB, setInputSlotB] = useState<string>('');
  const [isFetchingA, setIsFetchingA] = useState<boolean>(false);
  const [isFetchingB, setIsFetchingB] = useState<boolean>(false);
  const [errorSlotA, setErrorSlotA] = useState<string | null>(null);
  const [errorSlotB, setErrorSlotB] = useState<string | null>(null);

  // Copy link feedback
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Read URL query params: id1 and id2 (or fallback a and b)
  const paramId1 = searchParams.get('id1') || searchParams.get('a');
  const paramId2 = searchParams.get('id2') || searchParams.get('b');

  // Synchronize URL params when slots change
  const updateUrlParams = useCallback(
    (idA?: string | null, idB?: string | null) => {
      const newParams = new URLSearchParams();
      if (idA) newParams.set('id1', idA);
      if (idB) newParams.set('id2', idB);
      setSearchParams(newParams, { replace: true });
    },
    [setSearchParams]
  );

  // Load ideas from URL params or default to first two available ideas
  useEffect(() => {
    let isMounted = true;

    async function initComparison() {
      // 1. Attempt to fetch ID 1
      if (paramId1) {
        setIsFetchingA(true);
        setErrorSlotA(null);
        try {
          const loadedA = await fetchIdeaOrAnalysisById(paramId1);
          if (isMounted) {
            if (loadedA) {
              setSlotIdeaA(loadedA);
              setInputSlotA(loadedA.analysis?.id || loadedA.id);
            } else {
              setErrorSlotA(`No analysis found with ID "${paramId1}"`);
            }
          }
        } catch {
          if (isMounted) setErrorSlotA(`Error fetching ID "${paramId1}"`);
        } finally {
          if (isMounted) setIsFetchingA(false);
        }
      } else if (!slotIdeaA && ideas.length > 0) {
        // Default to first completed idea
        const firstCompleted = ideas.find((i) => i.analysis) || ideas[0];
        setSlotIdeaA(firstCompleted);
        setInputSlotA(firstCompleted.analysis?.id || firstCompleted.id);
      }

      // 2. Attempt to fetch ID 2
      if (paramId2) {
        setIsFetchingB(true);
        setErrorSlotB(null);
        try {
          const loadedB = await fetchIdeaOrAnalysisById(paramId2);
          if (isMounted) {
            if (loadedB) {
              setSlotIdeaB(loadedB);
              setInputSlotB(loadedB.analysis?.id || loadedB.id);
            } else {
              setErrorSlotB(`No analysis found with ID "${paramId2}"`);
            }
          }
        } catch {
          if (isMounted) setErrorSlotB(`Error fetching ID "${paramId2}"`);
        } finally {
          if (isMounted) setIsFetchingB(false);
        }
      } else if (!slotIdeaB && ideas.length > 1) {
        // Default to second completed idea distinct from idea 1
        const secondIdea = ideas.find((i) => i.id !== (slotIdeaA?.id || ideas[0]?.id) && i.analysis) || ideas[1];
        setSlotIdeaB(secondIdea);
        setInputSlotB(secondIdea.analysis?.id || secondIdea.id);
      }
    }

    if (!ideasLoading) {
      initComparison();
    }

    return () => {
      isMounted = false;
    };
  }, [paramId1, paramId2, ideasLoading, ideas.length]);

  // Sync URL when slots are updated
  useEffect(() => {
    const idA = slotIdeaA?.analysis?.id || slotIdeaA?.id;
    const idB = slotIdeaB?.analysis?.id || slotIdeaB?.id;
    if (idA || idB) {
      updateUrlParams(idA, idB);
    }
  }, [slotIdeaA, slotIdeaB, updateUrlParams]);

  // Fetch slot A handler
  const handleFetchSlotA = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setIsFetchingA(true);
    setErrorSlotA(null);
    try {
      const result = await fetchIdeaOrAnalysisById(idToFetch.trim());
      if (result) {
        setSlotIdeaA(result);
        setInputSlotA(result.analysis?.id || result.id);
      } else {
        setErrorSlotA(`No analysis found with ID: ${idToFetch}`);
      }
    } catch {
      setErrorSlotA(`Failed to fetch analysis ID: ${idToFetch}`);
    } finally {
      setIsFetchingA(false);
    }
  };

  // Fetch slot B handler
  const handleFetchSlotB = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setIsFetchingB(true);
    setErrorSlotB(null);
    try {
      const result = await fetchIdeaOrAnalysisById(idToFetch.trim());
      if (result) {
        setSlotIdeaB(result);
        setInputSlotB(result.analysis?.id || result.id);
      } else {
        setErrorSlotB(`No analysis found with ID: ${idToFetch}`);
      }
    } catch {
      setErrorSlotB(`Failed to fetch analysis ID: ${idToFetch}`);
    } finally {
      setIsFetchingB(false);
    }
  };

  // Swap Slot A and Slot B
  const handleSwapSlots = () => {
    const tempIdea = slotIdeaA;
    const tempInput = inputSlotA;
    setSlotIdeaA(slotIdeaB);
    setInputSlotA(inputSlotB);
    setSlotIdeaB(tempIdea);
    setInputSlotB(tempInput);
    setErrorSlotA(null);
    setErrorSlotB(null);
  };

  // Copy shareable comparison link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contextual Back Navigation */}
        <div className="mb-4">
          <BackButton to="/dashboard" label="Back to Dashboard" />
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Venture Comparison & Radar Diligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Side-by-side interactive comparison benchmarking Market Score, Risk Profile, and Technical Feasibility.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold">
              <button
                id="compare-mode-side-by-side-btn"
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'side-by-side'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Side-by-Side Dual Radar
              </button>
              <button
                id="compare-mode-matrix-btn"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Multi-Idea Matrix
              </button>
            </div>

            {/* Swap Button */}
            <button
              id="compare-swap-slots-btn"
              onClick={handleSwapSlots}
              disabled={!slotIdeaA || !slotIdeaB}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              title="Swap Concept A and Concept B"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Swap</span>
            </button>

            {/* Copy Link Button */}
            <button
              id="compare-copy-link-btn"
              onClick={handleCopyLink}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Copy shareable link to this comparison"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Comparison Slot Selector Bar: Concept A vs Concept B */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* SLOT A: Concept A Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Concept A (Primary Candidate)
                </span>
              </div>
              {slotIdeaA?.analysis?.overall_score !== undefined && (
                <ScoreBadge score={slotIdeaA.analysis.overall_score} size="sm" />
              )}
            </div>

            {/* Dropdown selector */}
            <div className="space-y-2.5">
              <label htmlFor="slot-a-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Choose from your analyzed ideas:
              </label>
              <select
                id="slot-a-select"
                value={slotIdeaA?.id || ''}
                onChange={(e) => {
                  const found = ideas.find((i) => i.id === e.target.value);
                  if (found) {
                    setSlotIdeaA(found);
                    setInputSlotA(found.analysis?.id || found.id);
                    setErrorSlotA(null);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select an Idea --</option>
                {ideas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title} {i.analysis ? `(Score: ${i.analysis.overall_score})` : '(No Analysis)'}
                  </option>
                ))}
              </select>

              {/* Direct ID input and fetcher */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Or fetch by specific Analysis / Idea ID:
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="slot-a-id-input"
                      type="text"
                      value={inputSlotA}
                      onChange={(e) => setInputSlotA(e.target.value)}
                      placeholder="e.g. analysis-sample-1 or UUID"
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchSlotA(inputSlotA)}
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    id="slot-a-fetch-btn"
                    onClick={() => handleFetchSlotA(inputSlotA)}
                    disabled={isFetchingA || !inputSlotA.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {isFetchingA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Fetch</span>
                  </button>
                </div>
                {errorSlotA && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errorSlotA}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SLOT B: Concept B Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Concept B (Benchmark Counterpart)
                </span>
              </div>
              {slotIdeaB?.analysis?.overall_score !== undefined && (
                <ScoreBadge score={slotIdeaB.analysis.overall_score} size="sm" />
              )}
            </div>

            {/* Dropdown selector */}
            <div className="space-y-2.5">
              <label htmlFor="slot-b-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Choose from your analyzed ideas:
              </label>
              <select
                id="slot-b-select"
                value={slotIdeaB?.id || ''}
                onChange={(e) => {
                  const found = ideas.find((i) => i.id === e.target.value);
                  if (found) {
                    setSlotIdeaB(found);
                    setInputSlotB(found.analysis?.id || found.id);
                    setErrorSlotB(null);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select an Idea --</option>
                {ideas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title} {i.analysis ? `(Score: ${i.analysis.overall_score})` : '(No Analysis)'}
                  </option>
                ))}
              </select>

              {/* Direct ID input and fetcher */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Or fetch by specific Analysis / Idea ID:
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="slot-b-id-input"
                      type="text"
                      value={inputSlotB}
                      onChange={(e) => setInputSlotB(e.target.value)}
                      placeholder="e.g. analysis-sample-2 or UUID"
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchSlotB(inputSlotB)}
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    id="slot-b-fetch-btn"
                    onClick={() => handleFetchSlotB(inputSlotB)}
                    disabled={isFetchingB || !inputSlotB.trim()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {isFetchingB ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Fetch</span>
                  </button>
                </div>
                {errorSlotB && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errorSlotB}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning if comparing the exact same idea */}
        {slotIdeaA && slotIdeaB && slotIdeaA.id === slotIdeaB.id && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              You have selected the same startup concept for both Slot A and Slot B. Select or fetch a different analysis
              ID in Slot B to observe meaningful variance.
            </span>
          </div>
        )}

        {/* Render View: Side-by-Side or Multi-Idea Matrix */}
        {viewMode === 'side-by-side' ? (
          slotIdeaA && slotIdeaB ? (
            <div className="space-y-8">
              {/* The Dedicated Side-by-Side Radar Comparison Component */}
              <SideBySideRadarComparison ideaA={slotIdeaA} ideaB={slotIdeaB} />

              {/* Comprehensive Side-by-Side Diligence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detailed Card: Idea A */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Concept A Dossier
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{slotIdeaA.title}</h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{slotIdeaA.industry}</p>
                    </div>
                    {slotIdeaA.analysis && <ScoreBadge score={slotIdeaA.analysis.overall_score} size="lg" />}
                  </div>

                  {/* Verdict & Executive Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verdict</span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          slotIdeaA.analysis?.verdict_type === 'Build'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : slotIdeaA.analysis?.verdict_type === 'Pivot'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {slotIdeaA.analysis?.verdict_type || 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {slotIdeaA.analysis?.verdict || slotIdeaA.description}
                    </p>
                  </div>

                  {/* Market & Problem Summary */}
                  <div className="space-y-3 text-xs">
                    <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Market & Demand Profile
                    </h5>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">TAM:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {slotIdeaA.analysis?.market_analysis?.tam || 'N/A'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">SAM:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {slotIdeaA.analysis?.market_analysis?.sam || 'N/A'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Growth Velocity:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {slotIdeaA.analysis?.market_analysis?.growth_potential || 'High Growth'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2">
                    <Link
                      to={`/analysis/${slotIdeaA.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <span>Explore Full Deep-Dive Analysis for Concept A</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Detailed Card: Idea B */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Concept B Dossier
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{slotIdeaB.title}</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{slotIdeaB.industry}</p>
                    </div>
                    {slotIdeaB.analysis && <ScoreBadge score={slotIdeaB.analysis.overall_score} size="lg" />}
                  </div>

                  {/* Verdict & Executive Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verdict</span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          slotIdeaB.analysis?.verdict_type === 'Build'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : slotIdeaB.analysis?.verdict_type === 'Pivot'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {slotIdeaB.analysis?.verdict_type || 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {slotIdeaB.analysis?.verdict || slotIdeaB.description}
                    </p>
                  </div>

                  {/* Market & Problem Summary */}
                  <div className="space-y-3 text-xs">
                    <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Market & Demand Profile
                    </h5>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">TAM:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {slotIdeaB.analysis?.market_analysis?.tam || 'N/A'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">SAM:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {slotIdeaB.analysis?.market_analysis?.sam || 'N/A'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Growth Velocity:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {slotIdeaB.analysis?.market_analysis?.growth_potential || 'High Growth'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2">
                    <Link
                      to={`/analysis/${slotIdeaB.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      <span>Explore Full Deep-Dive Analysis for Concept B</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select or Fetch Two Analyses to Compare
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                Choose two concepts from the dropdowns above or enter their Analysis IDs to render the interactive radar
                charts and benchmark their market score, risk resilience, and feasibility.
              </p>
              {ideas.length < 2 && (
                <div className="mt-4">
                  <Link
                    to="/new-analysis"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Analyze Another Concept</span>
                  </Link>
                </div>
              )}
            </div>
          )
        ) : (
          /* Multi-Idea Matrix View */
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Broad Multi-Idea Radar Benchmark
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-6">
                Evaluating up to 3 startup concepts simultaneously across all 6 core diligence axes.
              </p>
              <ComparisonRadarChart ideas={[slotIdeaA, slotIdeaB].filter(Boolean) as StartupIdea[]} height={380} />
            </div>

            {/* Matrix Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Diligence Matrix Table
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-4 w-48 shrink-0">Metric</th>
                      {[slotIdeaA, slotIdeaB].filter(Boolean).map((idea, idx) => (
                        <th key={idea!.id} className="p-4 min-w-[220px]">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {idx === 0 ? 'Concept A' : 'Concept B'}
                          </span>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">{idea!.title}</div>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 normal-case font-semibold">
                            {idea!.industry}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">
                        Overall Score
                      </td>
                      {[slotIdeaA, slotIdeaB].filter(Boolean).map((idea) => (
                        <td key={idea!.id} className="p-4">
                          {idea!.analysis?.overall_score !== undefined ? (
                            <ScoreBadge score={idea!.analysis.overall_score} size="md" />
                          ) : (
                            'N/A'
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">
                        Market Score
                      </td>
                      {[slotIdeaA, slotIdeaB].filter(Boolean).map((idea) => (
                        <td key={idea!.id} className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {idea!.analysis?.market_score ?? 'N/A'}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">
                        Technical Feasibility
                      </td>
                      {[slotIdeaA, slotIdeaB].filter(Boolean).map((idea) => (
                        <td key={idea!.id} className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {idea!.analysis?.technical_score ?? 'N/A'}/100 (
                          {idea!.analysis?.technical_feasibility?.complexity || 'Moderate'})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">
                        Verdict
                      </td>
                      {[slotIdeaA, slotIdeaB].filter(Boolean).map((idea) => (
                        <td key={idea!.id} className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                          {idea!.analysis?.verdict || 'Pending'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-800/30">
                        Detailed Link
                      </td>
                      {[slotIdeaA, slotIdeaB].filter(Boolean).map((idea) => (
                        <td key={idea!.id} className="p-4">
                          <Link
                            to={`/analysis/${idea!.id}`}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Open Analysis →
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
