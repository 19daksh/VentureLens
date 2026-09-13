import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Server,
  RefreshCw,
  Cpu,
  Trash2,
  Palette,
} from 'lucide-react';

const SQL_MIGRATION_PREVIEW = `-- VENTURELENS AI DATABASE SCHEMA
-- Run this in your Supabase SQL Editor to provision all 9 relational tables with RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  organization TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'founder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Startup Ideas table
CREATE TABLE IF NOT EXISTS startup_ideas (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  additional_info TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  idea_id TEXT REFERENCES startup_ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2) NOT NULL,
  verdict TEXT NOT NULL,
  verdict_type TEXT NOT NULL,
  confidence_indicator TEXT DEFAULT 'high',
  executive_summary TEXT NOT NULL,
  problem_score NUMERIC(5,2),
  market_score NUMERIC(5,2),
  competition_score NUMERIC(5,2),
  revenue_score NUMERIC(5,2),
  technical_score NUMERIC(5,2),
  raw_gemini_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can access own ideas" ON startup_ideas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own analyses" ON analyses
  FOR ALL USING (auth.uid() = user_id);`;

export const SettingsPage: React.FC = () => {
  const { isConfiguredWithSupabase } = useAuth();
  const { refreshIdeas } = useAnalysis();

  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('venturelens_custom_supabase_url') || ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    localStorage.getItem('venturelens_custom_supabase_key') || ''
  );
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_PREVIEW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl.trim() && supabaseAnonKey.trim()) {
      localStorage.setItem('venturelens_custom_supabase_url', supabaseUrl.trim());
      localStorage.setItem('venturelens_custom_supabase_key', supabaseAnonKey.trim());
      setSaveStatus('Supabase configuration saved. Reloading page to reconnect...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      localStorage.removeItem('venturelens_custom_supabase_url');
      localStorage.removeItem('venturelens_custom_supabase_key');
      setSaveStatus('Cleared custom credentials. Reverting to default mode.');
    }
  };

  const handleClearLocalData = () => {
    if (
      window.confirm(
        'Warning: This will clear local test ideas from your browser cache. Continue?'
      )
    ) {
      localStorage.removeItem('venturelens_local_ideas');
      localStorage.removeItem('venturelens_local_analyses');
      refreshIdeas();
      alert('Local idea store cleared.');
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure appearance theme, live Supabase PostgreSQL credentials, and database security.
          </p>
        </div>

        {/* Appearance & Theme Preference Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interface Theme</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your preferred color scheme or follow your system operating system.
                </p>
              </div>
            </div>

            <div>
              <ThemeToggle variant="segmented" id="settings-theme-selector" />
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isConfiguredWithSupabase
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Database Engine Status</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isConfiguredWithSupabase
                    ? 'Connected to live Supabase PostgreSQL instance'
                    : 'Active in offline-first resilient mode (Ready for live Supabase connection)'}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isConfiguredWithSupabase
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConfiguredWithSupabase ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-blue-600 dark:bg-blue-400'}`} />
              <span>{isConfiguredWithSupabase ? 'Supabase Live' : 'Local Storage Mode'}</span>
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] block">Security Model</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">PostgreSQL Row-Level Security (RLS)</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] block">AI Engine</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 mt-1 block">Gemini 3.8 Flash (Server-Side)</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] block">Tables Provisioned</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">9 Relational Tables</span>
            </div>
          </div>
        </div>

        {/* Supabase Connection Setup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Connect Custom Supabase Project
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Optionally paste your Supabase Project URL and public Anon Key to persist all ideas, competitor battlecards, and risk matrices in your personal PostgreSQL cloud instance.
          </p>

          {saveStatus && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="text"
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition-colors"
              >
                Save & Connect Supabase
              </button>
              {supabaseUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setSupabaseUrl('');
                    setSupabaseAnonKey('');
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* SQL Migration Script Viewer */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">PostgreSQL Schema & RLS Script</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Copy and run this in your Supabase SQL Editor to initialize all 9 tables.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              id="settings-btn-copy-sql"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>

          <div className="mt-4 bg-slate-900 text-slate-200 rounded-xl p-4 overflow-x-auto text-[11px] font-mono leading-relaxed max-h-72 border border-slate-800">
            <pre>{SQL_MIGRATION_PREVIEW}</pre>
          </div>
        </div>

        {/* Data Reset */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 shadow-xs transition-colors">
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">Clear Local Idea Store</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Reset local cached ideas and evaluation history. This cannot be undone.
          </p>
          <button
            onClick={handleClearLocalData}
            id="settings-btn-clear-data"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Cached Ideas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
