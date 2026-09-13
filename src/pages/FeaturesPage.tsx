import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Cpu,
  ShieldAlert,
  Rocket,
  FileText,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const deepFeatures = [
    {
      icon: Target,
      title: 'Problem & Willingness-to-Pay Validation',
      tag: 'Critical Gate',
      desc: 'We evaluate customer pain severity (Critical, High, Moderate, Low), friction frequency (Daily, Weekly, Occasional), and whether existing workarounds indicate authentic budget allocation.',
      points: [
        'Frequency vs. Severity pain matrix',
        'Customer interview hypothesis prompts',
        'Workaround expenditure analysis',
      ],
    },
    {
      icon: TrendingUp,
      title: 'TAM, SAM & SOM Market Sizing',
      tag: 'Market Sizing',
      desc: 'Avoid naive top-down market sizing. VentureLens AI breaks down Total Addressable Market, Serviceable Addressable Market, and Serviceable Obtainable Market (Years 1-3) with explicit assumptions.',
      points: [
        'Bottom-up & Top-down triangulated estimates',
        'Industry CAGR and secular tailwinds',
        'Early Beachhead market isolation',
      ],
    },
    {
      icon: Users,
      title: 'Competitor Moat & White-Space Mapping',
      tag: 'Defensibility',
      desc: 'Deep-dives into direct incumbents, indirect alternatives, and spreadsheets. Pinpoints specific product, pricing, or distribution vulnerabilities.',
      points: [
        'Incumbent strength vs. weakness breakdown',
        'Strategic wedge identification',
        'Defensibility and switching cost evaluation',
      ],
    },
    {
      icon: DollarSign,
      title: 'Business Model & Unit Economics',
      tag: 'Monetization',
      desc: 'Identifies the optimal revenue model (SaaS, usage, marketplace take-rate, transactional) and projects realistic CAC, LTV:CAC, and margin targets.',
      points: [
        'Recommended pricing tier structure',
        'Expected payback period benchmarks',
        'Secondary expansion revenue streams',
      ],
    },
    {
      icon: Cpu,
      title: 'Technical Feasibility & Architecture',
      tag: 'Engineering',
      desc: 'Evaluates architectural complexity, API reliance, hardware or regulatory constraints, and machine learning requirements before you hire engineers.',
      points: [
        'Recommended tech stack & frameworks',
        'High-risk dependencies & API lockout risks',
        'Scalability bottlenecks at 10x scale',
      ],
    },
    {
      icon: ShieldAlert,
      title: 'Pre-Mortem Risk Matrix',
      tag: 'Risk Management',
      desc: 'Categorizes critical failure points across Market, Execution, Regulatory, Financial, and Competitive axes, paired with proactive mitigations.',
      points: [
        'Severity, probability, and impact ratings',
        'Pre-launch mitigation battle-plan',
        'Regulatory and compliance alerts',
      ],
    },
    {
      icon: Rocket,
      title: 'Phased MVP Roadmap Scoping',
      tag: 'Execution',
      desc: 'Forces lean discipline. Separates non-negotiable must-haves from distraction features, organizing build milestones into 4–8 week release cycles.',
      points: [
        'Must-have vs. Nice-to-have classification',
        'Target launch timeline with measurable goals',
        'Clear validation milestones before code expansion',
      ],
    },
    {
      icon: FileText,
      title: 'Investor Memo & Report Generation',
      tag: 'Fundraising',
      desc: 'Turns the entire validation into a clean, printable executive summary formatted like venture capital investment memos.',
      points: [
        'Print-optimized layout for PDF export',
        'Visual radar charts and scoring distribution',
        'Shareable link for syndicates and angel networks',
      ],
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
            Feature Deep Dive
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
            Everything you need to stress-test your startup
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            Built on institutional venture diligence frameworks to help founders navigate market reality before committing capital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {deepFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{feat.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {feat.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center bg-indigo-900 dark:bg-indigo-950 rounded-2xl p-10 text-white shadow-xl border border-indigo-800/60">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk',sans-serif]">
            Ready to test your concept against this framework?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 dark:text-indigo-300 mt-2 max-w-xl mx-auto">
            Input your title, audience, and description. VentureLens AI provides your complete multi-dimensional analysis in seconds.
          </p>
          <div className="mt-6">
            <Link
              to="/new-analysis"
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
            >
              <span>Validate Your Idea Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
