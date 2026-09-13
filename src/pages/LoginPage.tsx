import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, AlertCircle, Loader2, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromPath = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate(fromPath, { replace: true });
    }
  };

  const handleUseDemoAccount = async () => {
    setEmail('founder@venturelens.ai');
    setPassword('demo123456');
    setSubmitting(true);
    const result = await signIn('founder@venturelens.ai', 'demo123456');
    setSubmitting(false);
    if (!result.error) {
      navigate(fromPath, { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            VentureLens AI
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">
          Sign in to your account
        </h2>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Or{' '}
          <Link to="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
            create a new founder account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10 transition-colors">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                id="login-input-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="founder@venture.com"
                className="mt-1 block w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-input-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Account Button */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="login-demo-btn"
              onClick={handleUseDemoAccount}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>One-Click Demo Founder Login</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">
              Instantly logs in to test all analysis, compare, and report features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
