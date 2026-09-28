import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { BackButton } from '../components/BackButton';
import { VoiceIdeaRecorder } from '../components/VoiceIdeaRecorder';
import { SwotAnalysisCard } from '../components/SwotAnalysisCard';
import { generateSwotAnalysis } from '../services/swotService';
import { SwotAnalysisData } from '../types/swot';
import {
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Zap,
  ShieldCheck,
  Compass,
  Mic,
  MicOff,
  Radio,
} from 'lucide-react';

const SAMPLE_IDEAS = [
  {
    name: 'CarePath AI - B2B Clinical Notes & Prior Authorization',
    title: 'CarePath AI',
    industry: 'HealthTech',
    target_audience: 'Independent outpatient clinics and multi-specialty physician practices in the US',
    description:
      'Physicians spend 2–3 hours every evening completing electronic health record (EHR) documentation and battling prior-authorization insurance rejections. CarePath AI listens ambiently to doctor-patient conversations, generates ICD-10 compliant clinical notes into Epic/Cerner, and automatically pre-populates prior authorization forms with relevant clinical evidence.',
    additional_info:
      'We have letters of intent from 3 regional orthopedic clinics willing to pilot at $400/provider/month. HIPAA compliance is our primary technical requirement.',
  },
  {
    name: 'FleetPulse - Commercial EV Depot Battery Optimization',
    title: 'FleetPulse',
    industry: 'CleanTech & Logistics',
    target_audience: 'Commercial delivery van fleet operators with 20–200 electric vehicles',
    description:
      'Commercial logistics fleets are transitioning to electric vans, but face utility demand surge penalties and premature battery degradation from unoptimized rapid charging. FleetPulse integrates with depot chargers and vehicle telematics to dynamically schedule charging around off-peak utility tariffs while predicting battery cell degradation.',
    additional_info:
      'Competing against legacy telematics providers (Geotab, Samsara) who only track vehicle GPS without deep battery chemistry analytics.',
  },
  {
    name: 'DevSecGuard - Automated AI Code Dependency Auditor',
    title: 'DevSecGuard',
    industry: 'DevTools & CyberSecurity',
    target_audience: 'Engineering leads and VP of Engineering at mid-sized SaaS companies (50–500 developers)',
    description:
      'Modern engineering teams deploy hundreds of open-source packages and AI-generated code snippets daily, creating stealth supply-chain vulnerabilities and prompt-injection risks. DevSecGuard acts as an automated CI/CD bot that isolates malicious dependency drift and flags hallucinated package attacks before pull requests are merged.',
    additional_info:
      'Initial open-source CLI prototype reached 800 GitHub stars. Planning a $49/developer/month cloud SaaS tier.',
  },
];

const INDUSTRIES = [
  'Artificial Intelligence',
  'B2B SaaS',
  'FinTech',
  'HealthTech & BioTech',
  'CleanTech & Climate',
  'DevTools & Infrastructure',
  'CyberSecurity',
  'E-Commerce & RetailTech',
  'EdTech',
  'Marketplace & Platforms',
  'Supply Chain & Logistics',
  'Other',
];

export const NewAnalysisPage: React.FC = () => {
  const { createIdeaAndAnalyze, isAnalyzing, analysisProgressStep, error } = useAnalysis();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('B2B SaaS');
  const [customIndustry, setCustomIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isInlineDictating, setIsInlineDictating] = useState(false);
  const inlineRecognitionRef = useRef<any>(null);

  // SWOT Analysis State
  const [swotData, setSwotData] = useState<SwotAnalysisData | null>(null);
  const [isGeneratingSwot, setIsGeneratingSwot] = useState(false);
  const [swotError, setSwotError] = useState<string | null>(null);
  const [swotLens, setSwotLens] = useState<'balanced' | 'aggressive_growth' | 'bootstrapped' | 'defensive_moat'>('balanced');

  const handleGenerateSwot = async (overrideLens?: 'balanced' | 'aggressive_growth' | 'bootstrapped' | 'defensive_moat') => {
    if (!description.trim() || description.trim().length < 15) {
      setSwotError('Please write or dictate at least 15 characters in the description before generating a SWOT analysis.');
      return;
    }

    setSwotError(null);
    setIsGeneratingSwot(true);

    try {
      const chosenIndustry = industry === 'Other' && customIndustry.trim() ? customIndustry.trim() : industry;
      const targetLens = overrideLens || swotLens;

      const result = await generateSwotAnalysis({
        title: title.trim() || 'Emerging Startup Concept',
        description: description.trim(),
        industry: chosenIndustry,
        target_audience: targetAudience.trim() || 'Early Adopters & Target Buyers',
        additional_info: additionalInfo.trim() || undefined,
        lens: targetLens,
      });

      setSwotData(result);
    } catch (err: any) {
      console.error('[NewAnalysisPage] SWOT Error:', err);
      setSwotError(err.message || 'Could not generate SWOT analysis. Please try again.');
    } finally {
      setIsGeneratingSwot(false);
    }
  };

  // Clean up inline recognition on unmount
  useEffect(() => {
    return () => {
      if (inlineRecognitionRef.current) {
        try {
          inlineRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleApplySample = (sample: (typeof SAMPLE_IDEAS)[0]) => {
    setTitle(sample.title);
    setIndustry(sample.industry);
    setTargetAudience(sample.target_audience);
    setDescription(sample.description);
    setAdditionalInfo(sample.additional_info);
    setFormError(null);
  };

  const handleVoiceApplyAll = (data: {
    title: string;
    industry: string;
    customIndustry?: string;
    targetAudience: string;
    description: string;
    additionalInfo?: string;
  }) => {
    setTitle(data.title);
    if (INDUSTRIES.includes(data.industry)) {
      setIndustry(data.industry);
      setCustomIndustry('');
    } else {
      setIndustry('Other');
      setCustomIndustry(data.customIndustry || data.industry);
    }
    setTargetAudience(data.targetAudience);
    setDescription(data.description);
    if (data.additionalInfo) {
      setAdditionalInfo(data.additionalInfo);
    }
    setFormError(null);
  };

  const handleVoiceApplyDescription = (text: string) => {
    setDescription((prev) => (prev.trim() ? `${prev.trim()}\n\n${text.trim()}` : text.trim()));
    setFormError(null);
  };

  const toggleInlineDictation = () => {
    if (isInlineDictating) {
      if (inlineRecognitionRef.current) {
        try {
          inlineRecognitionRef.current.stop();
        } catch {}
      }
      setIsInlineDictating(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setFormError('Speech recognition is not supported in this browser. Please use the Voice Pitch Recorder component above.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            setDescription((prev) => (prev.trim() ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Inline Dictation] error:', event?.error);
        setIsInlineDictating(false);
      };

      recognition.onend = () => {
        setIsInlineDictating(false);
      };

      recognition.start();
      inlineRecognitionRef.current = recognition;
      setIsInlineDictating(true);
    } catch (err: any) {
      setIsInlineDictating(false);
      setFormError('Could not start microphone dictation: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError('Please enter a startup title.');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setFormError('Please describe the problem and solution with at least 20 characters.');
      return;
    }
    if (!targetAudience.trim()) {
      setFormError('Please specify the target customer audience.');
      return;
    }

    setFormError(null);

    const chosenIndustry = industry === 'Other' && customIndustry.trim() ? customIndustry.trim() : industry;

    const result = await createIdeaAndAnalyze({
      title: title.trim(),
      industry: chosenIndustry,
      target_audience: targetAudience.trim(),
      description: description.trim(),
      additional_info: additionalInfo.trim() || undefined,
    });

    if (result.ideaId) {
      navigate(`/analysis/${result.ideaId}`);
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contextual Back Navigation */}
        <div className="mb-6">
          <BackButton to="/dashboard" label="Back to Dashboard" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Institutional Due Diligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Validate a New Startup Idea
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
            Provide the details of your concept. Our server-side Gemini engine will analyze market sizing, competitor moats, unit economics, risks, and your MVP roadmap.
          </p>
        </div>

        {/* Quick Sample Selector Buttons */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Or try an instant sample template:</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_IDEAS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                id={`sample-idea-btn-${idx}`}
                onClick={() => handleApplySample(s)}
                className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-600 dark:text-slate-300 transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Microphone-Based Voice Idea Recorder Component */}
        {!isAnalyzing && (
          <VoiceIdeaRecorder
            onApplyAll={handleVoiceApplyAll}
            onApplyDescriptionOnly={handleVoiceApplyDescription}
            currentDescription={description}
          />
        )}

        {/* Interactive Analyzing State Modal / Banner */}
        {isAnalyzing ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-8 sm:p-12 text-center shadow-lg animate-in fade-in zoom-in-95 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center mx-auto mb-6">
              <Compass className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">
              Running Venture Validation Engine...
            </h2>

            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 min-h-[20px]">
              {analysisProgressStep || 'Engaging server-side Gemini analysis...'}
            </p>

            {/* Simulated multi-step progress bar */}
            <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-6 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-slate-200">1. TAM / SAM / SOM</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Triangulating market size</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-slate-200">2. Competitor Moat</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Finding defensible wedges</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-slate-200">3. Phased MVP</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Prioritizing core launch</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-6">
              Evaluation typically takes 15–35 seconds. Please do not close this window.
            </p>
          </div>
        ) : (
          /* Analysis Input Form */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs transition-colors">
            {(formError || error) && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p className="font-bold">Validation Error</p>
                  <p className="mt-0.5">{formError || error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Startup Title */}
              <div>
                <label htmlFor="idea-input-title" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Startup Concept Title *
                </label>
                <input
                  type="text"
                  id="idea-input-title"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. CarePath AI, HyperCharge Logistics"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 2. Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="idea-select-industry" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Industry / Sector *
                  </label>
                  <select
                    id="idea-select-industry"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs shadow-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                {industry === 'Other' && (
                  <div>
                    <label htmlFor="idea-input-custom-industry" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Specify Industry *
                    </label>
                    <input
                      type="text"
                      id="idea-input-custom-industry"
                      value={customIndustry}
                      onChange={e => setCustomIndustry(e.target.value)}
                      placeholder="e.g. Aerospace, PropTech"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className={industry === 'Other' ? 'sm:col-span-2' : ''}>
                  <label htmlFor="idea-input-audience" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Target Audience / Buyer Persona *
                  </label>
                  <input
                    type="text"
                    id="idea-input-audience"
                    required
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. Independent clinic owners, SMB Shopify merchants, Series A VP Eng"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 3. Description (Problem & Solution) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor="idea-input-description" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Concept Description & Core Value Proposition *
                    </label>
                    <button
                      type="button"
                      onClick={toggleInlineDictation}
                      id="inline-mic-dictate-btn"
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all border ${
                        isInlineDictating
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700'
                      }`}
                      title={isInlineDictating ? 'Click to stop dictation' : 'Click to dictate directly into description with microphone'}
                    >
                      {isInlineDictating ? (
                        <>
                          <Radio className="w-3 h-3 text-rose-500 animate-ping" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3" />
                          <span>Dictate with Mic</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {description.length} chars (minimum 20)
                  </span>
                </div>
                <textarea
                  id="idea-input-description"
                  rows={5}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain the specific friction or painful problem your customer faces, how your proposed solution addresses it, and why existing alternatives are insufficient..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
                />

                {/* Instant SWOT Analysis Generator Callout */}
                <div className="mt-3 p-4 rounded-xl bg-linear-to-r from-indigo-50/80 via-purple-50/50 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Instant AI SWOT Analysis
                          </h4>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            GEMINI 3.8
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Generate an interactive 4-quadrant matrix & TOWS playbook directly from your description
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="generate-swot-btn"
                      disabled={isGeneratingSwot || description.trim().length < 15}
                      onClick={() => handleGenerateSwot()}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                        isGeneratingSwot
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : description.trim().length < 15
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white'
                      }`}
                    >
                      {isGeneratingSwot ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing Description...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{swotData ? 'Re-Generate SWOT' : 'Generate SWOT Analysis'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Lens Selection Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-indigo-100/60 dark:border-indigo-900/40 text-[10px]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">Lens:</span>
                    {[
                      { id: 'balanced', label: 'Balanced VC' },
                      { id: 'aggressive_growth', label: 'Hypergrowth' },
                      { id: 'bootstrapped', label: 'Bootstrapped' },
                      { id: 'defensive_moat', label: 'Defensive Moat' },
                    ].map((lens) => (
                      <button
                        key={lens.id}
                        type="button"
                        onClick={() => {
                          setSwotLens(lens.id as any);
                          if (swotData) handleGenerateSwot(lens.id as any);
                        }}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                          swotLens === lens.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lens.label}
                      </button>
                    ))}
                    {description.trim().length < 15 && (
                      <span className="text-amber-600 dark:text-amber-400 ml-auto font-medium">
                        (Add {15 - description.trim().length} more characters to enable)
                      </span>
                    )}
                  </div>

                  {swotError && (
                    <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-[11px] text-rose-700 dark:text-rose-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>{swotError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateSwot()}
                        className="font-bold underline ml-2 hover:text-rose-900"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Loading State Animation */}
                  {isGeneratingSwot && (
                    <div className="mt-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 text-center animate-in fade-in">
                      <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Evaluating Concept with Gemini API...
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Assessing internal strengths, structural weaknesses, external market tailwinds, and cross-quadrant TOWS strategies.
                      </p>
                    </div>
                  )}

                  {/* Rendered Interactive SWOT Card */}
                  {swotData && !isGeneratingSwot && (
                    <div className="mt-4">
                      <SwotAnalysisCard
                        data={swotData}
                        isLoading={isGeneratingSwot}
                        onRegenerate={handleGenerateSwot}
                        onUpdate={setSwotData}
                        standalone={true}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Optional Additional Information */}
              <div>
                <label htmlFor="idea-input-additional" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Optional Additional Context (Pilots, Competitors, Pricing ideas)
                </label>
                <textarea
                  id="idea-input-additional"
                  rows={3}
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder="e.g. Any customer discovery calls conducted, known pilot interest, target pricing tiers, or specific concerns you want the AI to evaluate..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Security notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Requests are secured server-side. Your inputs are isolated via PostgreSQL Row-Level Security.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="idea-submit-analyze-btn"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Validate Idea with Gemini</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
