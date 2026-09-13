import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const PricingPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-3 py-1 rounded-full">
            Transparent Plans
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 font-['Space_Grotesk',sans-serif]">
            Invest in clarity before you write a single line of code
          </h1>
          <p className="text-sm text-slate-600 mt-3">
            Choose the plan that matches your current stage, from solo ideators to active venture studios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Explorer */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Explorer</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Perfect for first-time founders exploring early hypotheses.</p>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>3 Startup Idea Validations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Problem & Demand Scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>TAM / SAM / SOM Market Sizing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Standard MVP Scope</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup"
              className="mt-8 block text-center py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Founder Pro (Recommended) */}
          <div className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-950 text-white p-8 rounded-2xl border-2 border-indigo-500 shadow-xl flex flex-col justify-between relative scale-105">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
              Most Popular
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Founder Pro</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-xs text-indigo-200">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">For serious founders and serial entrepreneurs.</p>

              <div className="mt-6 pt-6 border-t border-indigo-800/60 space-y-3 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Unlimited Startup Validations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Deep Competitor Battlecards & Moats</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Unit Economics & LTV:CAC Benchmarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Multi-Idea Radar Comparison Tool</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Investor Memo View & PDF Export</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup"
              className="mt-8 block text-center py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white shadow-md transition-colors"
            >
              Start 7-Day Free Trial
            </Link>
          </div>

          {/* Studio */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Venture Studio</span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$99</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">For accelerators, incubators, and startup studios.</p>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Everything in Founder Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>5 Team Member Seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Batch Batch Portfolio Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Direct Supabase Connection & API</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Priority Diligence Model Processing</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup"
              className="mt-8 block text-center py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Contact Studio Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
