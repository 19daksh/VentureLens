import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Compass, Cpu, Database } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Submit your startup parameters',
      desc: 'Provide your idea title, a 2–3 paragraph summary, your intended target buyer, and the sector. You can also specify any early customer discovery feedback or technical requirements.',
      details: [
        'Precise industry classification',
        'Specific target buyer persona (B2B role or B2C demographic)',
        'Known pilots, patents, or distribution assets',
      ],
    },
    {
      num: '02',
      title: 'Server-side Gemini VC Diligence Engine',
      desc: 'Our backend invokes Gemini with a structured venture evaluation prompt and schema validation. The engine models unit economics, surveys market segments, and challenges assumptions.',
      details: [
        'Zero browser API key exposure',
        'JSON Schema validation preventing broken data structures',
        'Synthesizes TAM/SAM/SOM with transparent assumptions',
      ],
    },
    {
      num: '03',
      title: 'Persistent Storage with Supabase / PostgreSQL',
      desc: 'The structured analysis is parsed, score-checked, and written to PostgreSQL with strict Row Level Security (RLS) policies. Only your authenticated session can access your data.',
      details: [
        'Profiles, ideas, analyses, and sub-tables linked by UUIDs',
        'Automatic local-first offline fallback mode',
        'Complete SQL migration available in Settings',
      ],
    },
    {
      num: '04',
      title: 'Actionable Dashboard & Decision Verdict',
      desc: 'Explore your score breakdown (0–100), radar chart dimensions, competitor battlecards, pre-mortem risk mitigations, and a prioritized MVP roadmap.',
      details: [
        'Clear verdict: "Build", "Improve", or "Pivot"',
        'Top 3 immediate validation actions',
        'Investor memo view formatted for export',
      ],
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-3 py-1 rounded-full">
            Under The Hood
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 font-['Space_Grotesk',sans-serif]">
            How VentureLens AI Works
          </h1>
          <p className="text-sm text-slate-600 mt-3">
            A transparent walkthrough of our validation architecture, AI models, and database security.
          </p>
        </div>

        {/* Step-by-step Cards */}
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex flex-col md:flex-row gap-8 items-start"
            >
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-900 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl font-['Space_Grotesk',sans-serif] shadow-md">
                {step.num}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{step.desc}</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack Banner */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 text-center mb-6">
            Institutional Technical Architecture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Cpu className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">Gemini 3.8 Flash</p>
              <p className="text-[11px] text-slate-500 mt-1">Structured JSON schema output with venture capital evaluation prompts.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Database className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">Supabase & PostgreSQL</p>
              <p className="text-[11px] text-slate-500 mt-1">9 relational tables, UUID primary keys, and strict Row Level Security (RLS).</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">Zero Client Key Exposure</p>
              <p className="text-[11px] text-slate-500 mt-1">All Gemini requests proxy through server-side Express endpoints.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/new-analysis"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Run Your First Validation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
