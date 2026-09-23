import React from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { Compass, ShieldCheck, HeartHandshake, Eye, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <BackButton to="/" label="Back to Home" />
        </div>
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/80 px-3 py-1 rounded-full">
            Our Mission
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 font-['Space_Grotesk',sans-serif]">
            Helping founders build things that matter
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed max-w-2xl mx-auto">
            The #1 reason startups fail is building products with no market need. VentureLens AI was created to provide institutional venture capital diligence to every founder on day zero.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-8 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">
              Why VentureLens AI?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              Traditional startup advice often swings between two extremes: either uncritical cheerleading from friends and general chatbots, or impenetrable venture capital gatekeeping.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              We built VentureLens AI to provide an objective, data-informed mirror. By interrogating market dynamics, customer alternatives, unit economics, and execution complexity, we help founders either double down with high conviction or pivot early—saving months of wasted engineering effort and thousands of dollars in capital.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
              <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Radical Clarity</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">We highlight fatal flaws and operational risks directly rather than sugarcoating them.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Founder Sovereignty</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Your ideas belong strictly to you. With PostgreSQL RLS, your data remains 100% private.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Pragmatic Execution</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Every evaluation translates directly into must-have MVP features and immediate validation actions.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/new-analysis"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Start Validating Your Idea</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
