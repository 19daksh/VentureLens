import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white font-['Space_Grotesk',sans-serif]">
                VentureLens AI
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Institutional-grade venture evaluation engine. Validate market opportunity, demand, competitors, unit economics, risks, and MVP roadmaps before committing engineering capital.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Gemini 3.8 Flash
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Supabase / PostgreSQL
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/features" className="hover:text-white transition-colors">Evaluation Categories</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How VentureLens Works</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Founder & Studio Pricing</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Multi-Idea Comparison</Link></li>
            </ul>
          </div>

          {/* Validation Dimensions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Validation Core</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>TAM / SAM / SOM Estimation</li>
              <li>Competitive Moat Mapping</li>
              <li>Unit Economics & Pricing Strategy</li>
              <li>Phased MVP Roadmap (Must-Have vs Nice-to-Have)</li>
              <li>Risk Matrix & Mitigation Tactics</li>
            </ul>
          </div>

          {/* Security & Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Security & Trust</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Row-Level Security (RLS)
              </li>
              <li>Isolated Founder Workspaces</li>
              <li>Server-Side Zero-Exposure API</li>
              <li>Exportable Investor Memos</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} VentureLens AI. All rights reserved. Validate your idea before you build it.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-slate-400">About</Link>
            <Link to="/pricing" className="hover:text-slate-400">Terms</Link>
            <Link to="/how-it-works" className="hover:text-slate-400">Methodology</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
