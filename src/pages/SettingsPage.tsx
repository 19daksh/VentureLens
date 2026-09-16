import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  User,
  Building,
  Mail,
  Shield,
  Palette,
  Bell,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  KeyRound,
} from 'lucide-react';

const INDUSTRY_OPTIONS = [
  'B2B SaaS',
  'Artificial Intelligence',
  'FinTech',
  'HealthTech & BioTech',
  'CleanTech & Climate',
  'DevTools & Infrastructure',
  'CyberSecurity',
  'E-Commerce & RetailTech',
  'EdTech',
  'Marketplace & Platforms',
  'Supply Chain & Logistics',
];

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, resetPassword, signOut } = useAuth();
  const { refreshIdeas } = useAnalysis();
  const navigate = useNavigate();

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [organization, setOrganization] = useState(profile?.organization || '');
  const [role, setRole] = useState(profile?.role || 'founder');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Founder Preferences State
  const [defaultIndustry, setDefaultIndustry] = useState(() => {
    return localStorage.getItem('venturelens_pref_default_industry') || 'B2B SaaS';
  });
  const [emailSummaries, setEmailSummaries] = useState(() => {
    return localStorage.getItem('venturelens_pref_email_summaries') !== 'false';
  });
  const [benchmarkAlerts, setBenchmarkAlerts] = useState(() => {
    return localStorage.getItem('venturelens_pref_benchmarks') !== 'false';
  });
  const [prefSavedNotice, setPrefSavedNotice] = useState(false);

  // Security / Password Reset State
  const [resettingPassword, setResettingPassword] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Synchronize state when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.organization) setOrganization(profile.organization);
      if (profile.role) setRole(profile.role);
    }
  }, [profile]);

  // Clean up any legacy custom connection keys
  useEffect(() => {
    localStorage.removeItem('venturelens_custom_supabase_url');
    localStorage.removeItem('venturelens_custom_supabase_key');
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus(null);

    const result = await updateProfile({
      full_name: fullName.trim(),
      organization: organization.trim(),
      role: role.trim(),
    });

    setSavingProfile(false);
    if (result.error) {
      setProfileStatus({ type: 'error', message: result.error });
    } else {
      setProfileStatus({ type: 'success', message: 'Profile details saved successfully.' });
      setTimeout(() => setProfileStatus(null), 3000);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('venturelens_pref_default_industry', defaultIndustry);
    localStorage.setItem('venturelens_pref_email_summaries', String(emailSummaries));
    localStorage.setItem('venturelens_pref_benchmarks', String(benchmarkAlerts));
    setPrefSavedNotice(true);
    setTimeout(() => setPrefSavedNotice(false), 2500);
  };

  const handleRequestPasswordReset = async () => {
    if (!user?.email) {
      setSecurityStatus({ type: 'error', message: 'No registered email found for this account.' });
      return;
    }

    setResettingPassword(true);
    setSecurityStatus(null);

    const result = await resetPassword(user.email);
    setResettingPassword(false);

    if (result.error) {
      setSecurityStatus({ type: 'error', message: result.error });
    } else {
      setSecurityStatus({
        type: 'success',
        message: `Password reset link sent to ${user.email}. Check your inbox.`,
      });
    }
  };

  const handleClearLocalData = () => {
    if (
      window.confirm(
        'Warning: This will clear local draft evaluations from your browser cache. Continue?'
      )
    ) {
      localStorage.removeItem('venturelens_local_ideas');
      localStorage.removeItem('venturelens_local_analyses');
      refreshIdeas();
      alert('Local idea cache cleared.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your founder profile, validation preferences, interface appearance, and account security.
          </p>
        </div>

        {/* 1. Founder Profile Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Founder Profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your founder name and organization identity across validation reports.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            {profileStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                }`}
              >
                {profileStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{profileStatus.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Venture / Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Acme Labs"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="founder">Founder & CEO</option>
                <option value="product_lead">Product Leader / CTO</option>
                <option value="venture_scout">Venture Scout / Analyst</option>
                <option value="angel_investor">Angel Investor</option>
                <option value="accelerator_director">Incubator / Accelerator Partner</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                id="settings-btn-save-profile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Appearance & Theme Preference Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Interface Theme</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your preferred color scheme or synchronize with your operating system.
                </p>
              </div>
            </div>

            <div>
              <ThemeToggle variant="segmented" id="settings-theme-selector" />
            </div>
          </div>

          {/* Validation Preferences */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Evaluation Defaults
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Target Industry
                </label>
                <select
                  value={defaultIndustry}
                  onChange={(e) => setDefaultIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Pre-selected when creating new validation briefs.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSummaries}
                    onChange={(e) => setEmailSummaries(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Include investor executive summary in export files
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={benchmarkAlerts}
                    onChange={(e) => setBenchmarkAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Enable competitor radar comparison benchmarks
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {prefSavedNotice ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved
                </span>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleSavePreferences}
                id="settings-btn-save-prefs"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* 3. Account & Security Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Account & Authentication</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your credentials and sign-in credentials securely.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {securityStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  securityStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                }`}
              >
                {securityStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{securityStatus.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Primary Account Email</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'Not authenticated'}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 w-fit">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Account</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Password & Security</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Request a secure password reset link to your registered email.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestPasswordReset}
                disabled={resettingPassword}
                id="settings-btn-reset-password"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              >
                {resettingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Local Cache Management */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Local Evaluation Cache</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clear locally cached draft inputs and browser session temporary storage.
              </p>
            </div>

            <button
              onClick={handleClearLocalData}
              id="settings-btn-clear-data"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/80 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Cache</span>
            </button>
          </div>
        </div>

        {/* 5. Sign Out Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-950 p-6 sm:p-8 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Account Session</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sign out of your VentureLens session on this device.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              id="settings-btn-signout"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of VentureLens</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
