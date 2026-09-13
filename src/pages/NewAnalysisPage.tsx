import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
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

  const handleApplySample = (sample: (typeof SAMPLE_IDEAS)[0]) => {
    setTitle(sample.title);
    setIndustry(sample.industry);
    setTargetAudience(sample.target_audience);
    setDescription(sample.description);
    setAdditionalInfo(sample.additional_info);
    setFormError(null);
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
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Institutional Due Diligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
            Validate a New Startup Idea
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Provide the details of your concept. Our server-side Gemini engine will analyze market sizing, competitor moats, unit economics, risks, and your MVP roadmap.
          </p>
        </div>

        {/* Quick Sample Selector Buttons */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
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
                className="text-[11px] font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Analyzing State Modal / Banner */}
        {isAnalyzing ? (
          <div className="bg-white rounded-2xl border border-indigo-200 p-8 sm:p-12 text-center shadow-lg animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Compass className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
              Running Venture Validation Engine...
            </h2>

            <p className="text-xs font-semibold text-indigo-600 mt-2 min-h-[20px]">
              {analysisProgressStep || 'Engaging server-side Gemini analysis...'}
            </p>

            {/* Simulated multi-step progress bar */}
            <div className="w-full max-w-md mx-auto bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800">1. TAM / SAM / SOM</p>
                <p className="text-slate-500 mt-0.5">Triangulating market size</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800">2. Competitor Moat</p>
                <p className="text-slate-500 mt-0.5">Finding defensible wedges</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800">3. Phased MVP</p>
                <p className="text-slate-500 mt-0.5">Prioritizing core launch</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-6">
              Evaluation typically takes 15–35 seconds. Please do not close this window.
            </p>
          </div>
        ) : (
          /* Analysis Input Form */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
            {(formError || error) && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
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
                <label htmlFor="idea-title" className="block text-xs font-bold text-slate-800 mb-1">
                  Startup Concept Title *
                </label>
                <input
                  type="text"
                  id="idea-input-title"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. CarePath AI, HyperCharge Logistics"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 2. Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="idea-industry" className="block text-xs font-bold text-slate-800 mb-1">
                    Industry / Sector *
                  </label>
                  <select
                    id="idea-select-industry"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs shadow-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label htmlFor="idea-custom-industry" className="block text-xs font-bold text-slate-800 mb-1">
                      Specify Industry *
                    </label>
                    <input
                      type="text"
                      id="idea-input-custom-industry"
                      value={customIndustry}
                      onChange={e => setCustomIndustry(e.target.value)}
                      placeholder="e.g. Aerospace, PropTech"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className={industry === 'Other' ? 'sm:col-span-2' : ''}>
                  <label htmlFor="idea-audience" className="block text-xs font-bold text-slate-800 mb-1">
                    Target Audience / Buyer Persona *
                  </label>
                  <input
                    type="text"
                    id="idea-input-audience"
                    required
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. Independent clinic owners, SMB Shopify merchants, Series A VP Eng"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 3. Description (Problem & Solution) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="idea-description" className="block text-xs font-bold text-slate-800">
                    Concept Description & Core Value Proposition *
                  </label>
                  <span className="text-[10px] text-slate-400">
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* 4. Optional Additional Information */}
              <div>
                <label htmlFor="idea-additional" className="block text-xs font-bold text-slate-800 mb-1">
                  Optional Additional Context (Pilots, Competitors, Pricing ideas)
                </label>
                <textarea
                  id="idea-input-additional"
                  rows={3}
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder="e.g. Any customer discovery calls conducted, known pilot interest, target pricing tiers, or specific concerns you want the AI to evaluate..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Security notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-[11px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
